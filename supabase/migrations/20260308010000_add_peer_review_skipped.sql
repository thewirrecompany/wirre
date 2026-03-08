-- Add peer_review_skipped to clearly distinguish "candidate fully done with everything"
-- from finished_at which only means "coding phase done".
--
-- finished_at = coding phase submitted (peer review may still be pending)
-- peer_review_skipped = candidate explicitly opted out of peer review (fully done, score = 0 for PR)
--
-- This makes Rounds.tsx categorization consistent for both sample and normal rounds:
-- a registration with peer_review_skipped=true always goes into Completed, regardless of round type.

ALTER TABLE public.assessment_registrations
  ADD COLUMN IF NOT EXISTS peer_review_skipped boolean NOT NULL DEFAULT false;

-- RPC called when a candidate clicks "Finalize & Submit" (skip peer review).
-- Sets peer_review_skipped = true and ensures finished_at is also set.
CREATE OR REPLACE FUNCTION public.candidate_skip_peer_review(p_assessment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.assessment_registrations
  SET
    peer_review_skipped = true,
    finished_at = COALESCE(finished_at, now())
  WHERE assessment_id = p_assessment_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not registered for assessment';
  END IF;

  RETURN json_build_object('ok', true);
END;
$$;
