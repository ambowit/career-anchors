
-- 1. Create organization_types table
CREATE TABLE organization_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_zh_cn text NOT NULL,
  name_zh_tw text NOT NULL,
  name_en text NOT NULL,
  description_zh_cn text NOT NULL DEFAULT '',
  description_zh_tw text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  default_feature_permissions jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_types_active ON organization_types(is_active);
CREATE INDEX idx_org_types_sort ON organization_types(sort_order);

-- 2. Seed 4 default organization types
INSERT INTO organization_types (code, name_zh_cn, name_zh_tw, name_en, description_zh_cn, description_zh_tw, description_en, default_feature_permissions, sort_order) VALUES
('enterprise', '企业机构', '企業機構', 'Enterprise',
 '大型企业客户，开启全套测评和分析功能',
 '大型企業客戶，開啟全套測評和分析功能',
 'Large enterprise clients with full assessment and analytics features',
 '{"career_anchor":true,"ideal_card":true,"combined":true,"report_download":true,"analytics":true,"client_management":true,"consultant_notes":true,"trend_analysis":true,"certification":true,"cdu_records":true,"message":true}',
 1),
('education', '教育机构', '教育機構', 'Education',
 '学校及培训机构，侧重职业指导和测评',
 '學校及培訓機構，側重職業指導和測評',
 'Schools and training institutions focused on career guidance',
 '{"career_anchor":true,"ideal_card":true,"combined":false,"report_download":true,"analytics":true,"client_management":false,"consultant_notes":false,"trend_analysis":false,"certification":false,"cdu_records":false,"message":true}',
 2),
('consulting', '咨询机构', '諮詢機構', 'Consulting',
 '专业咨询公司，含完整咨询师功能',
 '專業諮詢公司，含完整諮詢師功能',
 'Professional consulting firms with full consultant features',
 '{"career_anchor":true,"ideal_card":true,"combined":true,"report_download":true,"analytics":true,"client_management":true,"consultant_notes":true,"trend_analysis":true,"certification":true,"cdu_records":true,"message":true}',
 3),
('independent', '独立咨询师', '獨立諮詢師', 'Independent',
 '个人独立咨询师，基础功能配置',
 '個人獨立諮詢師，基礎功能配置',
 'Individual independent consultants with basic feature set',
 '{"career_anchor":true,"ideal_card":false,"combined":false,"report_download":true,"analytics":false,"client_management":true,"consultant_notes":true,"trend_analysis":false,"certification":false,"cdu_records":false,"message":false}',
 4);

-- 3. Add organization_type_id and feature_permissions to organizations
ALTER TABLE organizations
  ADD COLUMN organization_type_id uuid REFERENCES organization_types(id),
  ADD COLUMN feature_permissions jsonb NOT NULL DEFAULT '{}';

CREATE INDEX idx_org_type_id ON organizations(organization_type_id);

-- 4. Add feature_permissions to profiles (for consultant-level permission overrides)
ALTER TABLE profiles
  ADD COLUMN feature_permissions jsonb NOT NULL DEFAULT '{}';
