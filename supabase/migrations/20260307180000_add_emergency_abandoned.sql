-- Add emergency_abandoned flag to assessments for "Emergency Delete Round" feature
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS emergency_abandoned boolean DEFAULT false;

-- Admin RPC: emergency delete round
-- Marks all registrations as finished, revokes access flags, and completes the round as abandoned.
CREATE OR REPLACE FUNCTION public.admin_emergency_delete_round(p_assessment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_role text;
BEGIN
  -- Only admins and superadmins can call this
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'not authorized: admin role required';
  END IF;

  -- Mark all registrations as finished (those not already finished)
  UPDATE public.assessment_registrations
  SET
    finished_at = COALESCE(finished_at, now()),
    access_granted = false
  WHERE assessment_id = p_assessment_id;

  -- Mark the assessment as completed and emergency_abandoned
  UPDATE public.assessments
  SET
    status = 'completed',
    emergency_abandoned = true,
    finalized_at = COALESCE(finalized_at, now())
  WHERE id = p_assessment_id;

  RETURN json_build_object('success', true, 'assessment_id', p_assessment_id);
END;
$$;
