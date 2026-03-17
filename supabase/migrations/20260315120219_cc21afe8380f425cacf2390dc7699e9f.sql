-- Add per-assessment-type usage limit columns to org_assessment_codes
ALTER TABLE org_assessment_codes
  ADD COLUMN IF NOT EXISTS max_uses_career_anchor integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS used_count_career_anchor integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_uses_ideal_card integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS used_count_ideal_card integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_uses_combined integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS used_count_combined integer NOT NULL DEFAULT 0;

-- Migrate existing data: distribute old max_uses evenly to each type
UPDATE org_assessment_codes
SET max_uses_career_anchor = max_uses,
    max_uses_ideal_card = max_uses,
    max_uses_combined = max_uses;

-- Enable realtime for org_assessment_codes and org_assessment_code_usage
ALTER PUBLICATION supabase_realtime ADD TABLE org_assessment_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE org_assessment_code_usage;