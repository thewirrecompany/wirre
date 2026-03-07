-- Re-apply the sample round exemption to the start_at validation trigger.
-- The trigger appears to have been modified outside migrations, losing the is_sample bypass.
-- Also harmonize the error message.

CREATE OR REPLACE FUNCTION public.validate_assessment_start_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $function$
BEGIN
  -- Sample rounds have no start_at requirement
  IF NEW.is_sample = TRUE THEN
    RETURN NEW;
  END IF;

  IF (NEW.start_at IS NOT NULL) AND (NEW.start_at < now()) THEN
    RAISE EXCEPTION 'start_at cannot be in the past';
  END IF;

  RETURN NEW;
END;
$function$;
