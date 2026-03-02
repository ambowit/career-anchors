-- Add career_stage column to all content tables
ALTER TABLE anchor_text_blocks ADD COLUMN IF NOT EXISTS career_stage text NOT NULL DEFAULT 'entry';
ALTER TABLE anchor_combination_mapping ADD COLUMN IF NOT EXISTS career_stage text NOT NULL DEFAULT 'entry';
ALTER TABLE anchor_tri_mapping ADD COLUMN IF NOT EXISTS career_stage text NOT NULL DEFAULT 'entry';

-- Add indexes for career_stage queries
CREATE INDEX IF NOT EXISTS idx_atb_career_stage ON anchor_text_blocks (career_stage);
CREATE INDEX IF NOT EXISTS idx_acm_career_stage ON anchor_combination_mapping (career_stage);
CREATE INDEX IF NOT EXISTS idx_atm_career_stage ON anchor_tri_mapping (career_stage);

-- Enforce one active version per assessment category at database level
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_version_per_category ON report_versions (assessment_type) WHERE (status = 'active');

-- Add comment for documentation
COMMENT ON COLUMN anchor_text_blocks.career_stage IS 'Career stage: entry (职场新人), mid (职场中期), senior (职场资深), executive (高管/创业者)';
COMMENT ON COLUMN anchor_combination_mapping.career_stage IS 'Career stage: entry, mid, senior, executive';
COMMENT ON COLUMN anchor_tri_mapping.career_stage IS 'Career stage: entry, mid, senior, executive';