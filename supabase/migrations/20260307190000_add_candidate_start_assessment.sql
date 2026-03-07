-- Create a SECURITY DEFINER RPC to mark a candidate's registration as started.
-- This sets the started_at timestamp in assessment_registrations.
-- Primarily used for sample rounds where each candidate starts at a different time.

CREATE OR REPLACE FUNCTION public.candidate_start_assessment(p_assessment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists boolean;
  v_count int := 0;
BEGIN
  -- Auth check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Verify registration exists
  SELECT EXISTS(
    SELECT 1 FROM public.assessment_registrations
    WHERE assessment_id = p_assessment_id AND user_id = auth.uid()
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'not registered for assessment';
  END IF;

  -- Update started_at if not already set
  UPDATE public.assessment_registrations
  SET started_at = COALESCE(started_at, now())
  WHERE assessment_id = p_assessment_id AND user_id = auth.uid();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object('updated', v_count, 'started_at', now());
END;
$$;
