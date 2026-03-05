-- Function to assign peer reviews
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
BEGIN
  -- Verify assessment timing
  SELECT start_at, duration_minutes INTO assessment_start, assessment_duration
  FROM public.assessments WHERE id = target_assessment_id;

  IF assessment_duration IS NULL THEN
    RAISE EXCEPTION 'Invalid assessment data';
  END IF;

  -- For assessments without a fixed start_at (e.g. sample / per-candidate rounds),
  -- fall back to the earliest started_at among registered candidates.
  IF assessment_start IS NULL THEN
    SELECT MIN(started_at) INTO assessment_start
    FROM public.assessment_registrations
    WHERE assessment_id = target_assessment_id
      AND started_at IS NOT NULL;

    IF assessment_start IS NULL THEN
      RAISE EXCEPTION 'Invalid assessment data: no start time available';
    END IF;
  END IF;

  IF now() < (assessment_start + (assessment_duration || ' minutes')::interval) THEN
    -- In prod, raise error. For testing, maybe allow manual trigger? 
    -- Following strict requirements: "starts ONLY after the 3 hours are over"
    RAISE EXCEPTION 'Assessment coding phase is not over yet.';
  END IF;

  -- Check if already assigned
  IF EXISTS (
    SELECT 1 FROM public.assessment_registrations
    WHERE assessment_id = target_assessment_id
    AND peer_review_repo_url IS NOT NULL
  ) THEN
    RETURN; -- Already assigned
  END IF;

  -- Correctly shuffle participants keeping ID and URL aligned
  WITH shuffled_participants AS (
    SELECT id, private_repo_url
    FROM public.assessment_registrations
    WHERE assessment_id = target_assessment_id
      AND private_repo_url IS NOT NULL
      AND peer_review_repo_url IS NULL -- Only assign if not already assigned
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
  
  -- If we have fewer than 2 participants (e.g. 1), we can't swap.
  -- Fallback: Assign to self so they are not stuck in "Assigning..." state.
  IF num_participants IS NULL OR num_participants < 2 THEN
     -- If there's 1 participant, assign them to review themselves
     IF num_participants = 1 THEN
        UPDATE public.assessment_registrations
        SET 
          peer_review_repo_url = participant_urls[1],
          assigned_peer_registration_id = participant_ids[1]
        WHERE id = participant_ids[1];
     END IF;
     RETURN;
  END IF;

  -- Create a standard cycle: 1->2, 2->3, ..., N->1
  -- The arrays are already shuffled randomly due to ORDER BY random() above,
  -- so strict "next index" logic is random enough.
  
  FOR i IN 1..num_participants LOOP
    
    -- Calculate peer index (1-based because SQL arrays are 1-based)
    peer_index := (i % num_participants) + 1;
    
    -- Update registration i with repo URL of peer_index
    UPDATE public.assessment_registrations
    SET 
      peer_review_repo_url = participant_urls[peer_index],
      assigned_peer_registration_id = participant_ids[peer_index]
    WHERE id = participant_ids[i];
    
  END LOOP;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
