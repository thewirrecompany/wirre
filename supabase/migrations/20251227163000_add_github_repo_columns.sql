-- Migration: add GitHub repo verification columns to companies
BEGIN;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS github_repo text,
  ADD COLUMN IF NOT EXISTS github_installation_id bigint NULL,
  ADD COLUMN IF NOT EXISTS github_repo_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS github_repo_verified_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_companies_github_repo ON public.companies (github_repo);

COMMIT;
