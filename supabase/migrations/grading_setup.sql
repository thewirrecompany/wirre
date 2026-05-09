-- ============================================================
-- WIRRE Grading System: Database Setup
-- Run this in Supabase SQL Editor (one-time setup)
-- ============================================================

-- 1. Add missing values to the grading_status enum
ALTER TYPE grading_status ADD VALUE IF NOT EXISTS 'queued';
ALTER TYPE grading_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE grading_status ADD VALUE IF NOT EXISTS 'graded';
ALTER TYPE grading_status ADD VALUE IF NOT EXISTS 'error';

-- 2. Create trigger: auto-queue for AI grading when candidate finishes coding
CREATE OR REPLACE FUNCTION auto_queue_ai_grading()
RETURNS TRIGGER AS $$
BEGIN
  -- When coding_finished_at changes from NULL to a timestamp,
  -- and the submission hasn't been graded yet,
  -- auto-queue it for AI grading.
  IF OLD.coding_finished_at IS NULL
     AND NEW.coding_finished_at IS NOT NULL
     AND (NEW.ai_grading_status IS NULL OR NEW.ai_grading_status = 'pending')
  THEN
    NEW.ai_grading_status := 'queued';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists (idempotent)
DROP TRIGGER IF EXISTS trg_auto_queue_ai_grading ON assessment_registrations;

-- Create the trigger
CREATE TRIGGER trg_auto_queue_ai_grading
  BEFORE UPDATE ON assessment_registrations
  FOR EACH ROW
  EXECUTE FUNCTION auto_queue_ai_grading();
