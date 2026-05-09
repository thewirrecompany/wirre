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
            -- Formula: (manual + (ai_code + ai_peer)/2) / 2
            -- This results in a score out of 10 for each round
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
    )
    SELECT 
        DENSE_RANK() OVER (ORDER BY ua.final_score DESC) as rank,
        c.user_id,
        c.username,
        c.full_name,
        c.github_username,
        c.linkedin_url,
        c.is_public,
        ua.final_score::NUMERIC(10,2) as total_score
    FROM user_aggregates ua
    JOIN candidates c ON ua.user_id = c.user_id
    ORDER BY ua.final_score DESC;
END;
$$ LANGUAGE plpgsql;
