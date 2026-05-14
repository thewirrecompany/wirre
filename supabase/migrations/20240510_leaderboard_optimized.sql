-- ============================================================
-- Optimized Leaderboard RPC
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION get_leaderboard(p_assessment_id UUID DEFAULT NULL)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    username TEXT,
    full_name TEXT,
    github_username TEXT,
    linkedin_url TEXT,
    is_public BOOLEAN,
    total_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH scored_registrations AS (
        SELECT 
            r.user_id,
            (COALESCE(r.score, 0) + ((COALESCE(r.ai_score, 0) + COALESCE(r.ai_peer_review_score, 0)) / 2.0)) / 2.0 as round_score
        FROM assessment_registrations r
        WHERE (p_assessment_id IS NULL OR r.assessment_id = p_assessment_id)
          AND r.score IS NOT NULL
    ),
    user_aggregates AS (
        SELECT 
            sr.user_id,
            SUM(sr.round_score) as final_score
        FROM scored_registrations sr
        GROUP BY sr.user_id
    ),
    eligible_candidates AS (
        SELECT 
            c.user_id,
            c.username,
            c.full_name,
            c.github_username,
            c.linkedin_url,
            c.is_public,
            COALESCE(ua.final_score, 0) as final_score
        FROM candidates c
        LEFT JOIN user_aggregates ua ON c.user_id = ua.user_id
        WHERE c.username IS NOT NULL 
          AND TRIM(c.username) != ''
          -- If p_assessment_id is provided, only include candidates registered for this assessment
          AND (p_assessment_id IS NULL OR c.user_id IN (
              SELECT reg.user_id FROM assessment_registrations reg WHERE reg.assessment_id = p_assessment_id
          ))
    )
    SELECT 
        DENSE_RANK() OVER (ORDER BY ec.final_score DESC) as rank,
        ec.user_id,
        ec.username,
        ec.full_name,
        ec.github_username,
        ec.linkedin_url,
        ec.is_public,
        ec.final_score::NUMERIC(10,2) as total_score
    FROM eligible_candidates ec
    ORDER BY ec.final_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

