-- Allow anon to read batch metadata when a shared report references it
-- This fixes shared report links failing when batch status != 'active'
CREATE POLICY "anon_batches_read_for_shared_reports"
  ON public.scpc_assessment_batches
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.scpc_assessment_results sar
      WHERE sar.batch_id = scpc_assessment_batches.id
      AND sar.share_token IS NOT NULL
    )
  );
