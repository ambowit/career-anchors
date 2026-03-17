-- Allow anonymous users to UPDATE scpc_assessment_results
-- Required for combined assessments where career anchor is inserted first
-- and value_ranking is updated after ideal card completion
CREATE POLICY "anon_results_update" ON scpc_assessment_results
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);