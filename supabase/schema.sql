-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.assessment_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  private_repo_url text,
  github_username text,
  repo_provisioned boolean DEFAULT false,
  access_granted boolean DEFAULT false,
  anonymous_id text,
  score integer CHECK (score >= 0 AND score <= 10),
  notes text,
  selection_status text DEFAULT 'pending'::text CHECK (selection_status = ANY (ARRAY['pending'::text, 'selected'::text, 'rejected'::text])),
  ai_grading_status USER-DEFINED DEFAULT 'pending'::grading_status,
  ai_score integer CHECK (ai_score >= 0 AND ai_score <= 10),
  ai_report text,
  ai_grading_started_at timestamp with time zone,
  CONSTRAINT assessment_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_registrations_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id),
  CONSTRAINT assessment_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_user_id uuid NOT NULL,
  title text,
  status text NOT NULL DEFAULT 'draft'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  payment_confirmed boolean DEFAULT false,
  payment_amount numeric DEFAULT 0,
  payment_confirmed_at timestamp with time zone,
  technologies jsonb,
  duration_minutes integer,
  start_at timestamp with time zone,
  positions integer DEFAULT 1,
  min_salary numeric,
  max_salary numeric,
  assignment_level text,
  assignment_mode text,
  description text,
  github_repo_owner text,
  github_repo_name text,
  github_repo_verified boolean DEFAULT false,
  github_installation_id text,
  github_repo_verified_at timestamp with time zone,
  finalized_at timestamp with time zone,
  identities_revealed boolean DEFAULT false,
  is_paid boolean NOT NULL DEFAULT true,
  round_number integer DEFAULT 1,
  parent_assessment_id uuid,
  grading_status USER-DEFINED DEFAULT 'pending'::grading_status,
  CONSTRAINT assessments_pkey PRIMARY KEY (id),
  CONSTRAINT assessments_parent_assessment_id_fkey FOREIGN KEY (parent_assessment_id) REFERENCES public.assessments(id)
);
CREATE TABLE public.candidates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  github_username text,
  created_at timestamp with time zone DEFAULT now(),
  linkedin_url text,
  private_repo_url text,
  email text,
  date_of_birth date,
  CONSTRAINT candidates_pkey PRIMARY KEY (id),
  CONSTRAINT candidates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  domain text,
  linkedin_url text,
  created_at timestamp with time zone DEFAULT now(),
  github_installation_id text,
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role = ANY (ARRAY['company'::text, 'candidate'::text, 'admin'::text, 'superadmin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  onboarding_completed boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['candidate'::text, 'company'::text, 'contributor'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT waitlist_pkey PRIMARY KEY (id)
);