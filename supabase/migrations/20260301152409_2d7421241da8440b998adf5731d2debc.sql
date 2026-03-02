
-- ====================================================================
-- SCPC Anchor Report System V8 - Complete Database Schema
-- ====================================================================

-- 1. Report version management
CREATE TABLE report_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_type TEXT NOT NULL DEFAULT 'SCPC',
  version_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  UNIQUE(assessment_type, version_number)
);
COMMENT ON TABLE report_versions IS 'Version management for report templates. Only one active version per assessment_type at a time. Status: draft → active → locked.';

-- 2. Fixed 4 score range definitions per version
CREATE TABLE anchor_score_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES report_versions(id) ON DELETE CASCADE,
  score_min INTEGER NOT NULL,
  score_max INTEGER NOT NULL,
  range_label_en TEXT NOT NULL DEFAULT '',
  range_label_zh_tw TEXT NOT NULL DEFAULT '',
  range_label_zh_cn TEXT NOT NULL DEFAULT '',
  range_description_en TEXT NOT NULL DEFAULT '',
  range_description_zh_tw TEXT NOT NULL DEFAULT '',
  range_description_zh_cn TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE anchor_score_ranges IS 'Fixed 4 score ranges per version: 80-100, 65-79, 45-64, <45. Labels and descriptions copied verbatim from attachment.';

-- 3. Core text blocks - original attachment text only, never AI-modified
CREATE TABLE anchor_text_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES report_versions(id) ON DELETE CASCADE,
  anchor_type TEXT NOT NULL,
  section_type TEXT NOT NULL,
  score_min INTEGER NOT NULL,
  score_max INTEGER NOT NULL,
  original_text_block TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'zh-TW',
  source_attachment TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE anchor_text_blocks IS 'Raw original text blocks from attachments. TEXT type only, no rich text. Locked after version publish. anchor_type: TF/GM/AU/SE/EC/SV/CH/LS. section_type: anchor_explanation/career_advice/risk_warning/development_path.';

-- 4. Dual anchor combination interpretations
CREATE TABLE anchor_combination_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES report_versions(id) ON DELETE CASCADE,
  anchor_1 TEXT NOT NULL,
  anchor_2 TEXT NOT NULL,
  combination_code TEXT NOT NULL,
  tier TEXT NOT NULL,
  original_text_block TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'zh-TW',
  source_attachment TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE anchor_combination_mapping IS 'Dual anchor combination text. Tier: tier_1/tier_2/tier_3. Generated when top-2 score diff ≤ 5 or combination exists in code table.';

-- 5. Tri-anchor archetype models (only 5 fixed archetypes)
CREATE TABLE anchor_tri_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES report_versions(id) ON DELETE CASCADE,
  anchor_1 TEXT NOT NULL,
  anchor_2 TEXT NOT NULL,
  anchor_3 TEXT NOT NULL,
  tri_code TEXT NOT NULL,
  archetype_name TEXT NOT NULL,
  original_text_block TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'zh-TW',
  source_attachment TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE anchor_tri_mapping IS 'Tri-anchor archetype models. Only 5 archetypes: Stability-Driven Expansion, Creator-Stabilizer Tension, Mission-Driven Challenger, Technocratic Integrator, Stewardship-Oriented Leader.';

-- 6. Generated reports snapshot (immutable history)
CREATE TABLE generated_anchor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  assessment_result_id UUID REFERENCES assessment_results(id),
  version_id UUID NOT NULL REFERENCES report_versions(id),
  report_data JSONB NOT NULL,
  primary_anchor TEXT NOT NULL,
  secondary_anchor TEXT,
  tertiary_anchor TEXT,
  anchor_scores JSONB NOT NULL,
  has_dual_anchor BOOLEAN DEFAULT false,
  has_tri_anchor BOOLEAN DEFAULT false,
  combination_code TEXT,
  tri_code TEXT,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE generated_anchor_reports IS 'Immutable snapshot of generated reports. report_data stores all matched text blocks. Historical reports keep locked version text.';

-- Performance indexes
CREATE INDEX idx_rv_type_status ON report_versions(assessment_type, status);
CREATE INDEX idx_asr_version ON anchor_score_ranges(version_id);
CREATE INDEX idx_atb_version ON anchor_text_blocks(version_id);
CREATE INDEX idx_atb_anchor_section ON anchor_text_blocks(anchor_type, section_type);
CREATE INDEX idx_atb_range ON anchor_text_blocks(score_min, score_max);
CREATE INDEX idx_atb_lang ON anchor_text_blocks(language);
CREATE INDEX idx_acm_version ON anchor_combination_mapping(version_id);
CREATE INDEX idx_acm_anchors ON anchor_combination_mapping(anchor_1, anchor_2);
CREATE INDEX idx_acm_tier ON anchor_combination_mapping(tier);
CREATE INDEX idx_atm_version ON anchor_tri_mapping(version_id);
CREATE INDEX idx_atm_anchors ON anchor_tri_mapping(anchor_1, anchor_2, anchor_3);
CREATE INDEX idx_gar_user ON generated_anchor_reports(user_id);
CREATE INDEX idx_gar_version ON generated_anchor_reports(version_id);
CREATE INDEX idx_gar_assessment ON generated_anchor_reports(assessment_result_id);
CREATE INDEX idx_gar_generated ON generated_anchor_reports(generated_at DESC);
