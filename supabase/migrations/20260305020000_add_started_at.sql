-- Add started_at timestamp to assessment_registrations for precise start tracking (especially sample rounds)
ALTER TABLE public.assessment_registrations
ADD COLUMN started_at timestamp with time zone;
