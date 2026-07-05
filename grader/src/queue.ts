import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config.js';

let supabase: SupabaseClient;

function getClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
  }
  return supabase;
}

export interface QueuedSubmission {
  registrationId: string;
  assessmentId: string;
  anonymousId: string;
  privateRepoUrl: string;
  templateOwner: string;
  templateRepo: string;
  description: string | null;
  peerReviewSkipped: boolean;
  candidateEmail?: string;
  candidateName?: string;
}

/**
 * Fetch the next queued submission from Supabase.
 * Also re-queues any stale 'in_progress' items that have been stuck for too long.
 */
export async function fetchNextQueued(): Promise<QueuedSubmission | null> {
  const db = getClient();

  // 1. Re-queue stale locks (in_progress for > staleLockMinutes)
  const staleThreshold = new Date(Date.now() - config.staleLockMinutes * 60 * 1000).toISOString();

  await db
    .from('assessment_registrations')
    .update({ ai_grading_status: 'queued', ai_grading_started_at: null })
    .eq('ai_grading_status', 'in_progress')
    .lt('ai_grading_started_at', staleThreshold);

  // 2. Fetch the oldest queued submission
  const { data: registration, error } = await db
    .from('assessment_registrations')
    .select('id, user_id, assessment_id, anonymous_id, private_repo_url, peer_review_skipped')
    .eq('ai_grading_status', 'queued')
    .order('ai_grading_started_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('❌ Error fetching queued submission:', error.message);
    return null;
  }

  if (!registration) return null;

  // 3. Lock it — set to in_progress atomically
  const { error: lockError } = await db
    .from('assessment_registrations')
    .update({
      ai_grading_status: 'in_progress',
      ai_grading_started_at: new Date().toISOString(),
    })
    .eq('id', registration.id)
    .eq('ai_grading_status', 'queued'); // optimistic lock

  if (lockError) {
    console.error('❌ Failed to lock submission:', lockError.message);
    return null;
  }

  // 4. Fetch the assessment's template repo info and description
  const { data: assessment, error: assessmentError } = await db
    .from('assessments')
    .select('github_repo_owner, github_repo_name, description')
    .eq('id', registration.assessment_id)
    .single();

  if (assessmentError || !assessment?.github_repo_owner || !assessment?.github_repo_name) {
    console.error(`❌ Assessment ${registration.assessment_id} missing template repo info`);
    // Mark as error
    await db
      .from('assessment_registrations')
      .update({ ai_grading_status: 'error' })
      .eq('id', registration.id);
    return null;
  }

  // 5. Fetch candidate email and name from profiles table
  let candidateEmail, candidateName;
  if (registration.user_id) {
    const { data: profile } = await db
      .from('profiles')
      .select('email, full_name')
      .eq('id', registration.user_id)
      .maybeSingle();
      
    if (profile) {
      candidateEmail = profile.email;
      candidateName = profile.full_name;
    }
  }

  return {
    registrationId: registration.id,
    assessmentId: registration.assessment_id,
    anonymousId: registration.anonymous_id,
    privateRepoUrl: registration.private_repo_url,
    templateOwner: assessment.github_repo_owner,
    templateRepo: assessment.github_repo_name,
    description: assessment.description || null,
    peerReviewSkipped: registration.peer_review_skipped || false,
    candidateEmail,
    candidateName,
  };
}

/**
 * Publish grading results back to Supabase.
 */
export async function publishResult(
  registrationId: string,
  codingScore: number,
  codingReport: string,
  skippedPeerReview: boolean,
  reviewerRegistrationId?: string,
  peerReviewScore?: number,
  peerReviewReport?: string
): Promise<void> {
  const db = getClient();

  const updates: any = {
    ai_grading_status: 'graded',
    ai_score: codingScore,
    ai_report: codingReport,
  };

  if (skippedPeerReview) {
    updates.ai_peer_review_score = 0;
    updates.ai_peer_review_report = '- ⚠️ Candidate skipped the peer review round completely. 0 points awarded.';
  }

  const { error } = await db
    .from('assessment_registrations')
    .update(updates)
    .eq('id', registrationId);

  if (error) {
    throw new Error(`Failed to publish result for ${registrationId}: ${error.message}`);
  }

  // Update reviewer's peer review score (if applicable)
  if (reviewerRegistrationId && peerReviewScore !== undefined && peerReviewScore !== null) {
    const { error: peerError } = await db
      .from('assessment_registrations')
      .update({
        ai_peer_review_score: peerReviewScore,
        ai_peer_review_report: peerReviewReport,
      })
      .eq('id', reviewerRegistrationId);
      
    if (peerError) {
      console.error(`❌ Failed to publish peer review score for reviewer ${reviewerRegistrationId}:`, peerError.message);
    }
  }
}

/**
 * Fetch all peer review bugs targeted at a specific registration.
 */
export async function getPeerReviewBugs(targetRegistrationId: string) {
  const db = getClient();
  const { data, error } = await db
    .from('peer_review_bugs')
    .select('reporter_id, title, description, severity')
    .eq('target_registration_id', targetRegistrationId);

  if (error) {
    console.error(`❌ Failed to fetch bugs for ${targetRegistrationId}:`, error.message);
    return [];
  }
  return data || [];
}

/**
 * Find who was assigned to review this target submission.
 */
export async function getReviewerRegistrationId(targetRegistrationId: string): Promise<{ id: string, skipped: boolean } | null> {
  const db = getClient();
  const { data, error } = await db
    .from('assessment_registrations')
    .select('id, peer_review_skipped')
    .eq('assigned_peer_registration_id', targetRegistrationId)
    .maybeSingle();

  if (error || !data) return null;
  return { id: data.id, skipped: data.peer_review_skipped || false };
}



/**
 * Mark a submission as errored.
 */
export async function markError(registrationId: string, errorMessage?: string): Promise<void> {
  const db = getClient();

  await db
    .from('assessment_registrations')
    .update({
      ai_grading_status: 'queued',
      ai_report: errorMessage ? `Grading failed/interrupted: ${errorMessage} (Returned to queue)` : null,
      ai_grading_started_at: null,
    })
    .eq('id', registrationId);
}

/**
 * Reset a specific submission to queued (e.g., on manual interrupt).
 */
export async function resetToQueued(registrationId: string): Promise<void> {
  const db = getClient();
  await db
    .from('assessment_registrations')
    .update({
      ai_grading_status: 'queued',
      ai_grading_started_at: null,
    })
    .eq('id', registrationId);
}

/**
 * Get count of queued submissions.
 */
export async function getQueueCount(): Promise<number> {
  const db = getClient();

  const { count, error } = await db
    .from('assessment_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('ai_grading_status', 'queued');

  if (error) return 0;
  return count || 0;
}
