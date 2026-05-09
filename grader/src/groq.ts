import { config } from './config.js';

/**
 * The grading prompt — produces a structured JSON response.
 * Follows the strategy from TODO.md: grade the diff, not the repo.
 */
const BASE_RULES = `CRITICAL REPORT FORMATTING RULES:
1. USE BULLET POINTS ONLY. NO YAPPING.
2. NO EMOJIS EVER.
3. FOR CORRECT IMPLEMENTATIONS: Just list what is correct as a short bullet point. DO NOT explain what they did (the user already knows what they did).
4. FOR ERRORS/MISTAKES: ONLY explain what is wrong. You MUST mention exact file names and line ranges (e.g. "lines 45-50 in cache.go"). Directly explain where it is wrong and why it is wrong logically. Do not explain anything else.

Scoring guide:
- 0: Completely invalid or no effort.
- 1-3: Highly incomplete or poor quality.
- 4-5: Partial implementation or missed major issues.
- 6-7: Good attempt, but with noticeable misses.
- 8-9: Very strong, only minor nitpicks.
- 10: Flawless.`;

export interface GradeResult {
  codingScore: number;
  codingReport: string;
  peerReviewScore?: number;
  peerReviewReport?: string;
  raw: Record<string, unknown>;
}

/**
 * Send the diff to Groq for grading.
 * Includes automatic retry with exponential backoff for rate limits.
 */
export async function gradeWithGroq(
  diff: string,
  description?: string | null,
  readme?: string | null,
  fullCodebase?: string | null,
  peerReviewBugsStr?: string | null
): Promise<GradeResult> {
  // Truncate diff if it's extremely large (Groq context limits)
  // The user has requested NO TRUNCATION to ensure maximum quality analysis.
  // We set the limits to extremely high values (e.g., 1 million chars ~250k tokens)
  // to ensure nothing gets cut off unless it's astronomically large.
  const maxDiffChars = 1_000_000;
  let truncatedDiff = diff;
  if (diff.length > maxDiffChars) {
    truncatedDiff = diff.slice(0, maxDiffChars) + '\n\n[... DIFF TRUNCATED TO FIT RATE LIMITS ...]';
  }

  let truncatedCodebase = fullCodebase || "No codebase provided.";
  const maxCodebaseChars = 1_000_000;
  if (truncatedCodebase.length > maxCodebaseChars) {
    truncatedCodebase = truncatedCodebase.slice(0, maxCodebaseChars) + '\n\n[... CODEBASE TRUNCATED TO FIT RATE LIMITS ...]';
  }

  const promptDesc = description && description.trim() ? description : "No additional description provided.";
  const promptReadme = readme && readme.trim() ? readme : "No README provided.";
  
  // Conditionally build prompt
  const hasReviewer = !!peerReviewBugsStr;
  
  let systemPrompt = `You are an expert, uncompromising senior software engineer conducting a rigorous code review.\n`;
  if (hasReviewer) {
    systemPrompt += `You are evaluating a candidate's codebase submission, AND evaluating the peer review comments made by another candidate on this same codebase.\n\n`;
    systemPrompt += `YOUR TASKS:
A) Grade the Code (Coding Score):
- Verify COMPLETENESS against the README requirements.
- Verify CORRECTNESS and look for logical bugs.

B) Grade the Reviewer (Peer Review Score):
- Look at the "PEER REVIEW BUGS" provided.
- Did the reviewer find actual, legitimate bugs in the candidate's code?
- Did they hallucinate bugs that don't exist? Did they miss an incredibly obvious logic error?
- If the reviewer reported no bugs, but the code is flawless, give them a high score for not nitpicking. If the code is broken and they reported no bugs, give them a low score.

${BASE_RULES}

Respond with ONLY a valid JSON object in this exact format:
{
  "coding_score": <integer 0-10>,
  "coding_report": "<strict bulleted markdown following the rules above>",
  "peer_review_score": <integer 0-10>,
  "peer_review_report": "<strict bulleted markdown following the rules above>"
}`;
  } else {
    systemPrompt += `You are evaluating a candidate's codebase submission.\n\n`;
    systemPrompt += `YOUR TASKS:
- Grade the Code: Verify COMPLETENESS against the README requirements and CORRECTNESS (look for logical bugs).

${BASE_RULES}

Respond with ONLY a valid JSON object in this exact format:
{
  "coding_score": <integer 0-10>,
  "coding_report": "<strict bulleted markdown following the rules above>"
}`;
  }

  let userPrompt = `Here is the assessment description / task instructions:
${promptDesc}

Here is the repository README (if available):
${promptReadme}

Here is the candidate's FULL REPOSITORY CODEBASE for context (this shows the state of the codebase after their changes, allowing you to see unchanged files that might be relevant):
${truncatedCodebase}

Here is the exact DIFF of what the candidate changed:
${truncatedDiff}\n`;

  if (hasReviewer) {
    userPrompt += `\nPEER REVIEW BUGS REPORTED BY REVIEWER:\n${peerReviewBugsStr}\n\nPlease evaluate this submission and respond with the dual JSON evaluation.`;
  } else {
    userPrompt += `\nPlease evaluate this submission and respond with the JSON evaluation.`;
  }

  let lastError: Error | null = null;

  // Retry up to 5 times with exponential backoff
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const requestBody = {
        model: config.deepinfraModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      };

      const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.deepinfraApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${errorText}`);
      }

      const responseData: any = await response.json();
      const content = responseData.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from DeepInfra');
      }

      // Parse the JSON response — strip any markdown fences if present
      const cleaned = content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      // Validate scores
      const codingScore = Math.max(0, Math.min(10, Math.round(parsed.coding_score ?? 0)));
      
      let peerReviewScore: number | undefined;
      if (parsed.peer_review_score !== null && parsed.peer_review_score !== undefined) {
         peerReviewScore = Math.max(0, Math.min(10, Math.round(parsed.peer_review_score)));
      }

      // Build human-readable markdown reports
      const codingReport = buildReport(parsed, codingScore, 'coding');
      const peerReviewReport = peerReviewScore !== undefined 
          ? buildReport(parsed, peerReviewScore, 'peer')
          : undefined;

      return { 
        codingScore, 
        codingReport, 
        peerReviewScore, 
        peerReviewReport, 
        raw: parsed 
      };
    } catch (error: any) {
      lastError = error;

      // JSON parse errors — try to salvage
      if (error instanceof SyntaxError) {
        console.error(`   ⚠️  Failed to parse API response as JSON (attempt ${attempt + 1}/5)`);
        if (attempt < 4) {
          await sleep(2000);
          continue;
        }
      }

      // Check for rate limit (429) or server errors (5xx)
      const isRateLimit = error?.status === 429 || error?.message?.includes('rate_limit');
      const isServerError = error?.status >= 500;

      if (isRateLimit || isServerError) {
        // Groq / DeepInfra free tier rate limits (Tokens Per Minute) can take a minute to reset.
        // Wait 10s, 20s, 40s, 60s
        const waitMs = Math.min(10000 * Math.pow(2, attempt), 60_000);
        console.log(`   ⏳ Error: ${error.message}`);
        console.log(`   ⏳ Rate limited / server error. Retrying in ${waitMs / 1000}s... (attempt ${attempt + 1}/5)`);
        await sleep(waitMs);
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('Failed to grade after 5 attempts');
}

function buildReport(parsed: Record<string, unknown>, score: number, type: 'coding' | 'peer'): string {
  const parts: string[] = [];

  if (type === 'coding') {
    parts.push(`## AI Coding Grading Report\n`);
    parts.push(`**Score: ${score}/10**\n`);
    if (parsed.coding_report) parts.push(`${parsed.coding_report}\n`);
  } else {
    parts.push(`## AI Peer Review Grading Report\n`);
    parts.push(`**Score: ${score}/10**\n`);
    if (parsed.peer_review_report) parts.push(`${parsed.peer_review_report}\n`);
  }

  return parts.join('\n');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
