-- Fix assign_peer_reviews:
-- 1. Remove self-review fallback (if only 1 participant, just return without assigning)
-- 2. For sample rounds (start_at IS NULL): only pair candidates whose finished_at IS NOT NULL
--    instead of using MIN(started_at) as a global timer.
-- 3. For normal rounds: keep existing timing check (now() >= start_at + duration).

CREATE OR REPLACE FUNCTION public.assign_peer_reviews(target_assessment_id uuid)
RETURNS void AS $$
DECLARE
  participant_ids uuid[];
  participant_urls text[];
  num_participants int;
  i int;
  peer_index int;
  assessment_start timestamptz;
  assessment_duration int;
  v_is_sample boolean;
BEGIN
  -- Fetch assessment data
  SELECT start_at, duration_minutes, is_sample
  INTO assessment_start, assessment_duration, v_is_sample
  FROM public.assessments WHERE id = target_assessment_id;

  IF assessment_duration IS NULL THEN
    RAISE EXCEPTION 'Invalid assessment data';
  END IF;

  -- For NORMAL rounds: verify that the global coding phase is over
  IF v_is_sample IS NOT TRUE THEN
    IF assessment_start IS NULL THEN
      RAISE EXCEPTION 'Invalid assessment data: no start time for non-sample round';
    END IF;

    IF now() < (assessment_start + (assessment_duration || ' minutes')::interval) THEN
      RAISE EXCEPTION 'Assessment coding phase is not over yet.';
    END IF;
  END IF;

  -- Check if already assigned (any participant has a peer_review_repo_url)
  IF EXISTS (
    SELECT 1 FROM public.assessment_registrations
    WHERE assessment_id = target_assessment_id
    AND peer_review_repo_url IS NOT NULL
  ) THEN
    RETURN; -- Already assigned
  END IF;

  -- Build participant list:
  -- For SAMPLE rounds: only include candidates who have finished (finished_at IS NOT NULL)
  -- For NORMAL rounds: include all candidates with a repo
  WITH shuffled_participants AS (
    SELECT id, private_repo_url
    FROM public.assessment_registrations
    WHERE assessment_id = target_assessment_id
      AND private_repo_url IS NOT NULL
      AND peer_review_repo_url IS NULL
      AND (
        -- Sample rounds: only finished candidates
        (v_is_sample IS TRUE AND finished_at IS NOT NULL)
        OR
        -- Normal rounds: all candidates with a repo (round is already over per the check above)
        (v_is_sample IS NOT TRUE)
      )
    ORDER BY random()
  ),
  aggregated AS (
     SELECT 
       array_agg(id) AS ids, 
       array_agg(private_repo_url) AS urls
     FROM shuffled_participants
  )
  SELECT ids, urls INTO participant_ids, participant_urls FROM aggregated;

  num_participants := array_length(participant_ids, 1);
  
  -- If fewer than 2 participants, we cannot do a peer swap. Just return.
  -- Do NOT assign self-review.
  IF num_participants IS NULL OR num_participants < 2 THEN
     RETURN;
  END IF;

  -- Create a standard cycle: 1->2, 2->3, ..., N->1
  FOR i IN 1..num_participants LOOP
    peer_index := (i % num_participants) + 1;
    
    UPDATE public.assessment_registrations
    SET 
      peer_review_repo_url = participant_urls[peer_index],
      assigned_peer_registration_id = participant_ids[peer_index]
    WHERE id = participant_ids[i];
  END LOOP;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
