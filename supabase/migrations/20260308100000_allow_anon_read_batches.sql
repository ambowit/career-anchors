-- Allow anon role to SELECT from anonymous_assessment_batches
-- This is needed so anonymous participants can read batch info when they open their assessment link
CREATE POLICY "anon_batches_select_anon"
  ON anonymous_assessment_batches
  FOR SELECT
  TO anon
  USING (true);
