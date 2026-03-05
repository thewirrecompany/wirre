-- Function to auto-complete assessments where the full window (coding + 1h peer review) has elapsed.
-- Called client-side on page load to ensure state is consistent even without a cron job.
--
-- Timeline per assessment:
--   [start_at] ----[+duration]----> coding ends, status -> 'under_review', peer review starts
--   [start_at + duration + 1h] ---> peer review ends, status -> 'completed'
--
-- For sample/per-candidate rounds (start_at IS NULL), the per-registration started_at is used.
-- Those are handled per-registration; the assessment-level status is not auto-changed here
-- because different candidates may start at different times.

CREATE OR REPLACE FUNCTION public.auto_complete_expired_assessments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Move 'started' assessments -> 'under_review' once the coding window closes.
  --    (coding_end = start_at + duration_minutes)
  --    Excludes sample rounds: their per-candidate timer is based on
  --    assessment_registrations.started_at, not assessments.start_at.
  UPDATE public.assessments
  SET status = 'under_review'
  WHERE status = 'started'
    AND is_sample IS NOT TRUE
    AND start_at IS NOT NULL
    AND duration_minutes IS NOT NULL
    AND now() >= (start_at + (duration_minutes || ' minutes')::interval);

  -- 2. Move 'under_review' assessments -> 'completed' once the peer review window (1 h) also closes.
  --    (peer_review_end = start_at + duration_minutes + 60 minutes)
  --    Excludes sample rounds for the same reason.
  UPDATE public.assessments
  SET status = 'completed'
  WHERE status = 'under_review'
    AND is_sample IS NOT TRUE
    AND start_at IS NOT NULL
    AND duration_minutes IS NOT NULL
    AND now() >= (start_at + (duration_minutes || ' minutes')::interval + interval '1 hour');
END;
$$;
