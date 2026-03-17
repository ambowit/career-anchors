-- Allow anonymous (unauthenticated) users to read shared assessment results
-- Only rows with a non-null share_token are accessible (meaning the owner opted to share)
CREATE POLICY "allow_anon_read_shared_results"
  ON public.scpc_assessment_results
  FOR SELECT
  TO anon
  USING (share_token IS NOT NULL);
