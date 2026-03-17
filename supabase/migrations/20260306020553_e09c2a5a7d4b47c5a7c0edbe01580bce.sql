-- Add assessment permission columns to organizations table
-- All default to true (enabled) so existing organizations are not affected
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS enable_career_anchor boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_ideal_card boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_combined boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN organizations.enable_career_anchor IS 'Whether this organization allows career anchor assessments';
COMMENT ON COLUMN organizations.enable_ideal_card IS 'Whether this organization allows ideal life card assessments';
COMMENT ON COLUMN organizations.enable_combined IS 'Whether this organization allows combined (fusion) assessments';