-- Add total_paused_ms to track accumulated pause time for timer persistence
ALTER TABLE public.assessment_registrations
  ADD COLUMN IF NOT EXISTS total_paused_ms bigint DEFAULT 0;

-- Update grant-assessment-access and revoke-assessment-access logic will handle the calculation
