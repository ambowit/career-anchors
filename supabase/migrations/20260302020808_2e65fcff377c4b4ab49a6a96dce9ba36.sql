
-- ============================================================
-- 1. report_templates: 模板主表（三类模板）
-- ============================================================
CREATE TABLE IF NOT EXISTS report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  template_category text NOT NULL CHECK (template_category IN ('LIFE_CARD', 'CAREER_ANCHOR', 'COMBINED')),
  version text NOT NULL DEFAULT 'V1',
  description text DEFAULT '',
  is_published boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE report_templates IS 'Report template definitions supporting 3 categories: LIFE_CARD, CAREER_ANCHOR, COMBINED. Supports publish, archive (soft delete), and versioning.';

CREATE INDEX idx_rt_category ON report_templates (template_category);
CREATE INDEX idx_rt_published ON report_templates (is_published) WHERE is_published = true;
CREATE INDEX idx_rt_archived ON report_templates (is_archived);

-- ============================================================
-- 2. report_template_sections: 模板 section 配置
-- ============================================================
CREATE TABLE IF NOT EXISTS report_template_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  section_name text NOT NULL,
  section_name_en text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  section_type text NOT NULL CHECK (section_type IN (
    'STATIC_TEXT', 'SCORE_RANGE_MATCH', 'DUAL_MATCH', 'TRI_MATCH',
    'FUSION_MATCH', 'CHART_BLOCK', 'TABLE_BLOCK', 'USER_INFO_BLOCK'
  )),
  mapping_key text DEFAULT '',
  content text DEFAULT '',
  content_en text DEFAULT '',
  is_locked boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE report_template_sections IS 'Sections within a report template. section_type determines rendering logic. Content is super-admin authored text, never AI-modified.';

CREATE INDEX idx_rts_template ON report_template_sections (template_id);
CREATE INDEX idx_rts_order ON report_template_sections (template_id, display_order);
CREATE INDEX idx_rts_type ON report_template_sections (section_type);

-- ============================================================
-- 3. partner_user_bindings: 合作方 ↔ 用户绑定
-- ============================================================
CREATE TABLE IF NOT EXISTS partner_user_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES product_partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bound_by uuid REFERENCES profiles(id),
  bound_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_partner_user UNIQUE (partner_id, user_id)
);

COMMENT ON TABLE partner_user_bindings IS 'Binding relationship between product partners and users. Users must have partner role. Super admin binds from role-filtered user list.';

CREATE INDEX idx_pub_partner ON partner_user_bindings (partner_id);
CREATE INDEX idx_pub_user ON partner_user_bindings (user_id);
CREATE INDEX idx_pub_active ON partner_user_bindings (is_active) WHERE is_active = true;

-- ============================================================
-- 4. Add template_id reference to generated_anchor_reports
-- ============================================================
ALTER TABLE generated_anchor_reports
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES report_templates(id),
  ADD COLUMN IF NOT EXISTS template_version text DEFAULT '';
