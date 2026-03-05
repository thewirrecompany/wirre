-- Enable peer review features

ALTER TABLE public.assessment_registrations 
ADD COLUMN peer_review_repo_url text,
ADD COLUMN assigned_peer_registration_id uuid REFERENCES public.assessment_registrations(id);

CREATE TABLE public.peer_review_bugs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id),
  target_registration_id uuid NOT NULL REFERENCES public.assessment_registrations(id),
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT peer_review_bugs_pkey PRIMARY KEY (id)
);

-- RLS Policies
ALTER TABLE public.peer_review_bugs ENABLE ROW LEVEL SECURITY;

-- Reporters can read their own bugs
CREATE POLICY "Users can read own reported bugs" ON public.peer_review_bugs
  FOR SELECT USING (auth.uid() = reporter_id);

-- Reporters can create bugs
CREATE POLICY "Users can create bugs" ON public.peer_review_bugs
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
  
-- Admins/Companies logic might be needed too, but sticking to basics for now.
