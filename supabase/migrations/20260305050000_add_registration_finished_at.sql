-- Add finished_at to track individual candidate completion
-- This allows us to stop re-granting access even if the overall assessment is still "active"
ALTER TABLE public.assessment_registrations 
ADD COLUMN IF NOT EXISTS finished_at timestamp with time zone;

-- Update candidate_finish_assessment to mark the individual registration as finished
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

  -- 1. Mark individual registration as finished
  UPDATE public.assessment_registrations
  SET finished_at = now()
  WHERE assessment_id = p_assessment_id AND user_id = auth.uid();

  -- 2. Check if it's a sample round
  SELECT is_sample INTO v_is_sample FROM public.assessments WHERE id = p_assessment_id;

  -- 3. Coding phase ends -> move to peer-review phase (under_review).
  -- For sample rounds, we can immediately move status if we want, 
  -- but let's stick to the existing guard logic.
  UPDATE public.assessments
  SET status = 'under_review'
  WHERE id = p_assessment_id
    AND status IN ('started', 'ready'); 
    
  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object('updated', v_count, 'finished_at', now());
END;
$$;
