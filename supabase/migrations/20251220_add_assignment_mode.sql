-- Add assignment_mode enum and column to assessments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_assignment_mode') THEN
    CREATE TYPE public.assessment_assignment_mode AS ENUM ('company repo', 'make repo');
  END IF;
END$$;

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS assignment_mode public.assessment_assignment_mode;

-- optional index to speed up filters by assignment_mode
CREATE INDEX IF NOT EXISTS idx_assessments_assignment_mode ON public.assessments (assignment_mode);
