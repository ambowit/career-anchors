-- Add batch_id column to assessment_assignments for grouping batch dispatches
ALTER TABLE assessment_assignments
  ADD COLUMN IF NOT EXISTS batch_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS target_description text;

-- Index for batch grouping queries
CREATE INDEX IF NOT EXISTS idx_assignments_batch ON assessment_assignments (batch_id);