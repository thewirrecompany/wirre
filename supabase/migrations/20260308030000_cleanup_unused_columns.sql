-- Cleanup unused columns and rename for clarity
-- 
-- assessment_registrations:
--   - Rename started_at -> coding_started_at (unambiguous: marks when candidate started coding)
--   - Rename finished_at -> coding_finished_at (unambiguous: marks when coding phase was submitted)
--   - Remove total_paused_ms (no longer pausing; access is all-or-nothing)
--   - Remove access_revoked_at (only used for pause-duration accounting, no longer needed)
--
-- assessments:
--   - Remove github_installation_id (never read; WIRRE uses a single installation)
--   - Remove github_repo_verified_at (never read anywhere in code)
--   - Remove finalized_at (only ever written alongside identities_revealed; never read)
--
-- companies:
--   - Remove github_installation_id (never used)

-- ============================================================================
-- assessment_registrations renames
-- ============================================================================
ALTER TABLE public.assessment_registrations
  RENAME COLUMN started_at TO coding_started_at;

ALTER TABLE public.assessment_registrations
  RENAME COLUMN finished_at TO coding_finished_at;

-- ============================================================================
-- assessment_registrations removals
-- ============================================================================
ALTER TABLE public.assessment_registrations
  DROP COLUMN IF EXISTS total_paused_ms,
  DROP COLUMN IF EXISTS access_revoked_at;

-- ============================================================================
-- assessments removals
-- ============================================================================
ALTER TABLE public.assessments
  DROP COLUMN IF EXISTS github_installation_id,
  DROP COLUMN IF EXISTS github_repo_verified_at,
  DROP COLUMN IF EXISTS finalized_at;

-- ============================================================================
-- companies removals
-- ============================================================================
ALTER TABLE public.companies
  DROP COLUMN IF EXISTS github_installation_id;

-- ============================================================================
-- Update SQL functions that reference the old column names
-- ============================================================================

-- candidate_finish_assessment: uses finished_at -> coding_finished_at
DROP FUNCTION IF EXISTS public.candidate_finish_assessment(uuid);
CREATE OR REPLACE FUNCTION public.candidate_finish_assessment(p_assessment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_count integer;
BEGIN
  v_user_id := auth.uid();

  UPDATE public.assessment_registrations
  SET coding_finished_at = now()
  WHERE assessment_id = p_assessment_id
    AND user_id = v_user_id
    AND coding_finished_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object('updated', v_count, 'coding_finished_at', now());
END;
$$;

-- candidate_start_assessment: uses started_at -> coding_started_at
DROP FUNCTION IF EXISTS public.candidate_start_assessment(uuid);
CREATE OR REPLACE FUNCTION public.candidate_start_assessment(p_assessment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_count integer;
BEGIN
  v_user_id := auth.uid();

  UPDATE public.assessment_registrations
  SET coding_started_at = COALESCE(coding_started_at, now())
  WHERE assessment_id = p_assessment_id
    AND user_id = v_user_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object('updated', v_count);
END;
$$;

-- candidate_skip_peer_review: uses finished_at -> coding_finished_at
DROP FUNCTION IF EXISTS public.candidate_skip_peer_review(uuid);
CREATE OR REPLACE FUNCTION public.candidate_skip_peer_review(p_assessment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_count integer;
BEGIN
  v_user_id := auth.uid();

  UPDATE public.assessment_registrations
  SET peer_review_skipped = true,
      coding_finished_at = COALESCE(coding_finished_at, now())
  WHERE assessment_id = p_assessment_id
    AND user_id = v_user_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object('updated', v_count);
END;
$$;

-- auto_complete_expired_assessments: uses started_at/finished_at -> coding_started_at/coding_finished_at
DROP FUNCTION IF EXISTS public.auto_complete_expired_assessments();
CREATE OR REPLACE FUNCTION public.auto_complete_expired_assessments()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Mark expired sample-round registrations as coding-finished
  -- (per-candidate timer: expires at coding_started_at + duration_minutes)
  UPDATE public.assessment_registrations ar
  SET coding_finished_at = COALESCE(ar.coding_finished_at, now())
  FROM public.assessments a
  WHERE ar.assessment_id = a.id
    AND a.is_sample = true
    AND ar.coding_started_at IS NOT NULL
    AND ar.coding_finished_at IS NULL
    AND ar.access_granted = true
    AND now() > (ar.coding_started_at + (a.duration_minutes * interval '1 minute'));

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object('completed', v_count);
END;
$$;
