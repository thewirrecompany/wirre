-- Candidates need to look up their assigned peer's anonymous_id to browse their code,
-- but RLS blocks reading other candidates' registration rows.
-- This security-definer function safely returns the peer's anonymous_id only if
-- the caller owns the reviewing registration and has been assigned that peer.

CREATE OR REPLACE FUNCTION public.get_peer_anonymous_id(p_my_registration_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_peer_reg_id uuid;
  v_anon_id text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Verify the caller owns this registration
  IF NOT EXISTS (
    SELECT 1 FROM assessment_registrations
    WHERE id = p_my_registration_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Get the assigned peer registration id
  SELECT assigned_peer_registration_id
  INTO v_peer_reg_id
  FROM assessment_registrations
  WHERE id = p_my_registration_id;

  IF v_peer_reg_id IS NULL THEN
    RETURN NULL; -- No peer assigned yet
  END IF;

  -- Return the peer's anonymous_id
  SELECT anonymous_id INTO v_anon_id
  FROM assessment_registrations
  WHERE id = v_peer_reg_id;

  RETURN v_anon_id;
END;
$$;
