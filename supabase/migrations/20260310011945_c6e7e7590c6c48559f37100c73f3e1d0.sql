
-- Ensure anon role can SELECT from anonymous_assessment_batches
-- Drop first in case it exists, then recreate
DROP POLICY IF EXISTS "anon_batches_select_anon" ON anonymous_assessment_batches;

CREATE POLICY "anon_batches_select_anon"
  ON anonymous_assessment_batches
  FOR SELECT
  TO anon
  USING (true);
