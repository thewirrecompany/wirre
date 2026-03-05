-- Fix candidate_finish_assessment to set status 'under_review' (not 'completed') when the
-- coding phase ends. The assessment moves to 'completed' only after the 1-hour peer review
-- window also closes, handled by auto_complete_expired_assessments().

-- Must drop first because PostgreSQL won't allow changing the return type via CREATE OR REPLACE.
DROP FUNCTION IF EXISTS public.candidate_finish_assessment(uuid);

CREATE OR REPLACE FUNCTION public.candidate_finish_assessment(p_assessment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists boolean;
  v_count int := 0;
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

  -- Coding phase ends -> move to peer-review phase (under_review).
  -- Do not jump straight to 'completed'; auto_complete_expired_assessments() will
  -- advance to 'completed' once the 1-hour peer review window has elapsed.
  UPDATE public.assessments
  SET status = 'under_review'
  WHERE id = p_assessment_id
    AND status IN ('started', 'ready'); -- guard against double-finish
  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object('updated', v_count);
END;
$$;
