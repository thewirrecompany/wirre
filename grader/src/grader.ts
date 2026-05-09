import { fetchNextQueued, publishResult, markError, getQueueCount, getPeerReviewBugs, getReviewerRegistrationId, type QueuedSubmission } from './queue.js';
import { getSubmissionDiff } from './github.js';
import { gradeWithGroq } from './groq.js';

let currentSubmissionId: string | null = null;

export function getCurrentSubmissionId() {
  return currentSubmissionId;
}

export async function gradeSubmission(submission: QueuedSubmission): Promise<boolean> {
  currentSubmissionId = submission.registrationId;
  const label = `[${submission.anonymousId}]`;
  try {
    console.log(`${label} 📂 Fetching diff...`);
    const { diff, readme, fullCodebase, changedFiles } = await getSubmissionDiff(
      submission.templateOwner, submission.templateRepo, submission.privateRepoUrl
    );

    // --- Fetch Reviewer Info and Bugs ---
    let reviewerRegistrationId: string | undefined = undefined;
    
    // Who was assigned to review this codebase?
    const reviewerInfo = await getReviewerRegistrationId(submission.registrationId);
    if (reviewerInfo) {
      reviewerRegistrationId = reviewerInfo.id;
    }

    const bugs = await getPeerReviewBugs(submission.registrationId);
    let peerReviewBugsStr: string | null = null;

    if (bugs.length > 0) {
      peerReviewBugsStr = bugs.map((b, i) => 
        `BUG ${i + 1}:\nTitle: ${b.title}\nSeverity: ${b.severity}\nDescription:\n${b.description}\n`
      ).join('\n---\n');
    } else if (reviewerInfo && reviewerInfo.skipped) {
      // Reviewer skipped the round entirely. Don't pass bugs to AI.
      console.log(`${label} Reviewer skipped the peer review round for this code.`);
    } else if (reviewerInfo && !reviewerInfo.skipped) {
      // Reviewer didn't skip, but found 0 bugs. We must grade them for reporting 0 bugs!
      peerReviewBugsStr = "Reviewer explicitly reported 0 bugs.";
    }

    const descSize = submission.description ? submission.description.length : 0;
    const readmeSize = readme ? readme.length : 0;
    const diffSize = diff.length;
    const codebaseSize = fullCodebase.length;
    const bugsSize = peerReviewBugsStr ? peerReviewBugsStr.length : 0;
    
    // We divide by 3 instead of 4 because source code has many symbols and spaces, resulting in higher token density.
    const totalChars = descSize + readmeSize + diffSize + codebaseSize + bugsSize;
    const approxTokens = Math.ceil(totalChars / 3);

    console.log(`\n${label} ───────────────── PRE-GRADING ANALYSIS ─────────────────`);
    console.log(`${label} 📝 Description:   ${descSize.toLocaleString()} chars`);
    console.log(`${label} 📖 README:        ${readmeSize.toLocaleString()} chars`);
    console.log(`${label} 📊 Diff size:     ${diffSize.toLocaleString()} chars (${diff.split('\n').length} lines)`);
    console.log(`${label} 📦 Codebase size: ${codebaseSize.toLocaleString()} chars`);
    if (bugsSize > 0) {
      console.log(`${label} 🐞 Peer Review:   ${bugsSize.toLocaleString()} chars (${bugs.length} bugs)`);
    } else {
      console.log(`${label} 🐞 Peer Review:   None found`);
    }
    console.log(`${label} 🧮 Approx tokens: ~${approxTokens.toLocaleString()} tokens`);

    // Log the actual files changed
    const totalChanged = changedFiles.added.length + changedFiles.modified.length + changedFiles.deleted.length;
    if (totalChanged === 0) {
      console.log(`\n⚠️  WARNING: ${label} NO CHANGES FOUND BETWEEN TEMPLATE AND CANDIDATE!`);
    } else {
      console.log(`${label} 📂 Files Changed (${totalChanged}):`);
      if (changedFiles.added.length > 0) console.log(`${label}    Added:    ${changedFiles.added.join(', ')}`);
      if (changedFiles.modified.length > 0) console.log(`${label}    Modified: ${changedFiles.modified.join(', ')}`);
      if (changedFiles.deleted.length > 0) console.log(`${label}    Deleted:  ${changedFiles.deleted.join(', ')}`);
    }

    console.log(`${label} ────────────────────────────────────────────────────────\n`);

    console.log(`${label} 🤖 Sending to DeepInfra/AI (Dual Grading)...`);
    const result = await gradeWithGroq(diff, submission.description, readme, fullCodebase, peerReviewBugsStr);
    console.log(`${label} ✅ Coding Score: ${result.codingScore}/10`);
    if (result.peerReviewScore !== undefined) {
      console.log(`${label} ✅ Peer Review Score: ${result.peerReviewScore}/10`);
    }

    console.log(`${label} 📤 Publishing...`);
    await publishResult(
      submission.registrationId, 
      result.codingScore, 
      result.codingReport, 
      submission.peerReviewSkipped, // Did THIS candidate skip THEIR peer review?
      reviewerRegistrationId,       // The ID of the person who reviewed THIS candidate
      result.peerReviewScore, 
      result.peerReviewReport
    );
    console.log(`${label} ✅ Done!`);
    currentSubmissionId = null;
    return true;
  } catch (error: any) {
    console.error(`${label} ❌ Failed: ${error.message}`);
    await markError(submission.registrationId, error.message);
    currentSubmissionId = null;
    return false;
  }
}

export async function runGradingLoop(shouldStop: () => boolean, pollIntervalMs: number): Promise<void> {
  console.log('\n🚀 Grading loop started. Polling for queued submissions...\n');
  let processed = 0, errors = 0;

  while (!shouldStop()) {
    const submission = await fetchNextQueued();
    if (!submission) {
      process.stdout.write(`\r⏳ Queue empty. Waiting... (processed: ${processed}, errors: ${errors})`);
      await new Promise(r => setTimeout(r, pollIntervalMs));
      continue;
    }
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📋 Processing: ${submission.anonymousId} | Assessment: ${submission.assessmentId}`);
    console.log(`${'═'.repeat(60)}`);

    (await gradeSubmission(submission)) ? processed++ : errors++;
    console.log(`📊 Session: ${processed} processed, ${errors} errors\n`);
    if (shouldStop()) { console.log('\n🛑 Stop signal received. Exiting.'); break; }
  }

  console.log(`\n🏁 Session complete. Processed: ${processed}, Errors: ${errors}\n`);
}
