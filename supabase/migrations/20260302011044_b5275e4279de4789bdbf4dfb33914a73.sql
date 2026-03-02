
-- 1. Ideal card assessment results table
CREATE TABLE IF NOT EXISTS ideal_card_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  assessment_id uuid REFERENCES assessment_results(id),
  ranked_cards jsonb NOT NULL DEFAULT '[]',
  top10_cards jsonb NOT NULL DEFAULT '[]',
  category_distribution jsonb NOT NULL DEFAULT '{}',
  extreme_dimensions jsonb NOT NULL DEFAULT '[]',
  core_values_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_icr_user ON ideal_card_results(user_id);
CREATE INDEX idx_icr_assessment ON ideal_card_results(assessment_id);
CREATE INDEX idx_icr_created ON ideal_card_results(created_at DESC);
COMMENT ON TABLE ideal_card_results IS 'Stores ideal life card assessment results. ranked_cards: full ranking array [{rank,cardId,category,label}]. top10_cards: final 10 cards. category_distribution: {intrinsic:N, material:N, ...}. extreme_dimensions: [{category, direction, score}].';

-- 2. Add assessment_type to assessment_results (career_anchor | ideal_card | combined)
ALTER TABLE assessment_results ADD COLUMN IF NOT EXISTS assessment_type text NOT NULL DEFAULT 'career_anchor';
COMMENT ON COLUMN assessment_results.assessment_type IS 'Assessment entry type: career_anchor | ideal_card | combined';

-- 3. Add report_number + report_type to generated_anchor_reports
ALTER TABLE generated_anchor_reports ADD COLUMN IF NOT EXISTS report_number text;
ALTER TABLE generated_anchor_reports ADD COLUMN IF NOT EXISTS report_type text NOT NULL DEFAULT 'career_anchor';
COMMENT ON COLUMN generated_anchor_reports.report_number IS 'Unique report ID: SCPC + YYYYMM + last4UserID + random2';
COMMENT ON COLUMN generated_anchor_reports.report_type IS 'Report type: career_anchor | ideal_card | fusion';
CREATE UNIQUE INDEX IF NOT EXISTS idx_gar_report_number ON generated_anchor_reports(report_number) WHERE report_number IS NOT NULL;

-- 4. Add work_experience_years to profiles (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_experience_years integer;
COMMENT ON COLUMN profiles.work_experience_years IS 'Years of work experience for report cover injection';

-- 5. Fusion analysis reports table
CREATE TABLE IF NOT EXISTS fusion_analysis_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  assessment_id uuid NOT NULL REFERENCES assessment_results(id),
  ideal_card_result_id uuid REFERENCES ideal_card_results(id),
  anchor_report_id uuid REFERENCES generated_anchor_reports(id),
  report_number text,
  version_id uuid REFERENCES report_versions(id),
  anchor_scores jsonb NOT NULL DEFAULT '{}',
  value_ranking jsonb NOT NULL DEFAULT '[]',
  conflict_index numeric(5,2) NOT NULL DEFAULT 0,
  motivation_alignment numeric(5,2) NOT NULL DEFAULT 0,
  core_positioning text NOT NULL DEFAULT '',
  drive_match_analysis text NOT NULL DEFAULT '',
  conflict_risk_level text NOT NULL DEFAULT 'low',
  development_path text NOT NULL DEFAULT '',
  risk_warnings text NOT NULL DEFAULT '',
  report_data jsonb NOT NULL DEFAULT '{}',
  pdf_url text,
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_far_user ON fusion_analysis_reports(user_id);
CREATE INDEX idx_far_assessment ON fusion_analysis_reports(assessment_id);
CREATE INDEX idx_far_generated ON fusion_analysis_reports(generated_at DESC);
CREATE UNIQUE INDEX idx_far_report_number ON fusion_analysis_reports(report_number) WHERE report_number IS NOT NULL;
COMMENT ON TABLE fusion_analysis_reports IS 'Fusion analysis reports for combined assessments. Stores cross-analysis of career anchor + ideal life card results. Includes conflict_index, motivation_alignment, core positioning, and development paths.';

-- 6. Report text blocks for ideal card and fusion reports
CREATE TABLE IF NOT EXISTS report_text_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES report_versions(id),
  report_type text NOT NULL,
  block_key text NOT NULL,
  block_category text NOT NULL DEFAULT 'general',
  match_criteria jsonb NOT NULL DEFAULT '{}',
  content_en text NOT NULL DEFAULT '',
  content_zh_tw text NOT NULL DEFAULT '',
  content_zh_cn text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_locked boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rtb_version ON report_text_blocks(version_id);
CREATE INDEX idx_rtb_type ON report_text_blocks(report_type);
CREATE INDEX idx_rtb_key ON report_text_blocks(block_key);
COMMENT ON TABLE report_text_blocks IS 'Generic text blocks for ideal_card and fusion report types. block_key: value_explanation, category_analysis, extreme_dimension, fusion_positioning, drive_match, conflict_risk, development_path, risk_warning. match_criteria: JSON filter for score ranges, categories, conflict levels.';
