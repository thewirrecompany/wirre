    -- Fix mark_due_assessments_started to skip sample rounds.
    -- Sample rounds should remain 'ready' forever since each candidate starts independently.
    -- The per-candidate timer is tracked via assessment_registrations.started_at.

    CREATE OR REPLACE FUNCTION public.mark_due_assessments_started()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
    UPDATE assessments
    SET status = 'started'
    WHERE status = 'ready'
        AND start_at IS NOT NULL
        AND start_at <= now()
        AND is_sample IS NOT TRUE;
    END;
    $function$;
