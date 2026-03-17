
-- Career stage descriptions: editable by super admin from Report Generator page
CREATE TABLE IF NOT EXISTS career_stage_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_key text NOT NULL UNIQUE, -- 'entry', 'mid', 'senior', 'executive'
  title_zh_tw text NOT NULL DEFAULT '',
  title_zh_cn text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  description_zh_tw text NOT NULL DEFAULT '',
  description_zh_cn text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_csd_stage ON career_stage_descriptions (stage_key);

COMMENT ON TABLE career_stage_descriptions IS 'Editable career stage descriptions for reports. 4 stages: entry (0-5yr), mid (6-12yr), senior (12+yr), executive. Super admin can modify anytime.';
