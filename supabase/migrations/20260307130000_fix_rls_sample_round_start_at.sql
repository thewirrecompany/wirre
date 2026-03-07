-- Fix RLS policies on assessments table to allow sample rounds to set start_at freely.
-- The trigger already skips sample rounds, but the RLS WITH CHECK clauses also enforce
-- (start_at IS NULL OR start_at >= now() + 3 days), which blocks setting start_at = now()
-- for sample rounds when marked as ready.

-- Drop and recreate the relevant policies with an is_sample exemption.

-- 1. "Companies and admins can update assessments"
DROP POLICY IF EXISTS "Companies and admins can update assessments" ON public.assessments;
CREATE POLICY "Companies and admins can update assessments"
  ON public.assessments
  AS permissive
  FOR UPDATE
  TO authenticated
  USING (((company_user_id = auth.uid()) OR public.is_admin(auth.uid())))
  WITH CHECK (
    ((company_user_id = auth.uid()) OR public.is_admin(auth.uid()))
    AND (
      is_sample = TRUE
      OR (start_at IS NULL)
      OR (start_at >= (now() + '3 days'::interval))
    )
  );

-- 2. "Companies can insert assessments"
DROP POLICY IF EXISTS "Companies can insert assessments" ON public.assessments;
CREATE POLICY "Companies can insert assessments"
  ON public.assessments
  AS permissive
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (company_user_id = auth.uid())
    AND (
      is_sample = TRUE
      OR (start_at IS NULL)
      OR (start_at >= (now() + '3 days'::interval))
    )
  );

-- 3. "Owners and admins can insert assessments"
DROP POLICY IF EXISTS "Owners and admins can insert assessments" ON public.assessments;
CREATE POLICY "Owners and admins can insert assessments"
  ON public.assessments
  AS permissive
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ((company_user_id = auth.uid()) OR public.is_admin(auth.uid()))
    AND (
      is_sample = TRUE
      OR (start_at IS NULL)
      OR (start_at >= (now() + '3 days'::interval))
    )
  );

-- 4. "Owners and admins can update assessments"
DROP POLICY IF EXISTS "Owners and admins can update assessments" ON public.assessments;
CREATE POLICY "Owners and admins can update assessments"
  ON public.assessments
  AS permissive
  FOR UPDATE
  TO authenticated
  USING (((company_user_id = auth.uid()) OR public.is_admin(auth.uid())))
  WITH CHECK (
    ((company_user_id = auth.uid()) OR public.is_admin(auth.uid()))
    AND (
      is_sample = TRUE
      OR (start_at IS NULL)
      OR (start_at >= (now() + '3 days'::interval))
    )
  );
