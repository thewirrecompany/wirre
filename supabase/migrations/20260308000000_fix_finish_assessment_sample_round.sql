-- Fix: candidate_finish_assessment should NOT change the assessment-level status for sample rounds.
-- For sample rounds, each candidate has an independent timer; the assessment stays 'ready'
-- so new candidates can still register and start independently.
-- (Previously the RPC always tried to move status -> 'under_review', which would flip sample
--  rounds away from 'ready' the moment any one candidate finished.)

CREATE OR REPLACE FUNCTION public.candidate_finish_assessment(p_assessment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists boolean;
  v_count int := 0;
  v_is_sample boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM assessment_registrations
    WHERE assessment_id = p_assessment_id AND user_id = auth.uid()
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'not registered for assessment';
  END IF;

  -- 1. Mark individual registration as finished (applies to all round types)
  UPDATE public.assessment_registrations
  SET finished_at = now()
  WHERE assessment_id = p_assessment_id AND user_id = auth.uid();

  -- 2. Determine round type
  SELECT is_sample INTO v_is_sample FROM public.assessments WHERE id = p_assessment_id;

  -- 3. For NON-sample rounds only: coding phase ends -> move to peer-review phase.
  --    For sample rounds each candidate finishes independently; assessment-level status
  --    stays 'ready' and is managed separately (not by this per-candidate function).
  IF v_is_sample IS NOT TRUE THEN
    UPDATE public.assessments
    SET status = 'under_review'
    WHERE id = p_assessment_id
      AND status IN ('started', 'ready');
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN json_build_object('updated', v_count);
END;
$$;
