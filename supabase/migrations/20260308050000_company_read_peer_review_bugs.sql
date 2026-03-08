-- Allow company users to read peer review bugs for assessments they own.
-- Previously only reporters (candidates) could read their own bugs.

CREATE POLICY "Companies can read bugs for their assessments"
  ON public.peer_review_bugs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = peer_review_bugs.assessment_id
        AND a.company_user_id = auth.uid()
    )
  );
