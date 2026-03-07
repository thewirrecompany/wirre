-- Add access_revoked_at to track when access was manually revoked for timer freezing
ALTER TABLE public.assessment_registrations
  ADD COLUMN IF NOT EXISTS access_revoked_at timestamptz;
