    -- Create a SECURITY DEFINER RPC to mark a sample round as ready.
    -- This bypasses RLS policies and triggers that block setting start_at for sample rounds.

    CREATE OR REPLACE FUNCTION public.mark_sample_round_ready(p_assessment_id uuid)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
    v_is_sample boolean;
    v_count int := 0;
    BEGIN
    -- Auth check
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'not authorized';
    END IF;

    -- Verify it's a sample round owned by this user or user is admin
    SELECT is_sample INTO v_is_sample
    FROM public.assessments
    WHERE id = p_assessment_id
        AND (company_user_id = auth.uid() OR public.is_admin(auth.uid()));

    IF v_is_sample IS NULL THEN
        RAISE EXCEPTION 'assessment not found or not authorized';
    END IF;

    IF v_is_sample IS NOT TRUE THEN
        RAISE EXCEPTION 'this function is only for sample rounds';
    END IF;

    -- Mark as ready and set start_at to now
    UPDATE public.assessments
    SET status = 'ready',
        start_at = now(),
        updated_at = now()
    WHERE id = p_assessment_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN json_build_object('updated', v_count, 'start_at', now());
    END;
    $$;
