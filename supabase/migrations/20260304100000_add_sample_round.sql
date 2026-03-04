-- Add is_sample column to assessments
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS "is_sample" boolean NOT NULL DEFAULT false;

-- Update the start_at validation trigger to bypass the 3-day rule for sample rounds
CREATE OR REPLACE FUNCTION public.validate_assessment_start_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $function$
BEGIN
  -- Sample rounds created by the super-organizer have no start_at requirement
  IF NEW.is_sample = TRUE THEN
    RETURN NEW;
  END IF;

  IF (NEW.start_at IS NOT NULL) AND (NEW.start_at < now() + interval '3 days') THEN
    RAISE EXCEPTION 'start_at must be at least 3 days in the future';
  END IF;

  RETURN NEW;
END;
$function$;
