-- Add is_system column to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

-- Insert SCPC Platform system organization
INSERT INTO organizations (
  id, name, domain, logo_url, plan_type, max_seats, status,
  is_system, enable_career_anchor, enable_ideal_card, enable_combined,
  feature_permissions, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'SCPC 平台',
  'scpc.com',
  '',
  'enterprise',
  9999,
  'active',
  true,
  true, true, true,
  '{"career_anchor":true,"ideal_card":true,"combined":true,"report_download":true,"analytics":true,"client_management":true,"consultant_notes":true,"trend_analysis":true,"certification":true,"cdu_records":true,"message":true}',
  now(),
  now()
);

-- Insert Individual User Center system organization
INSERT INTO organizations (
  id, name, domain, logo_url, plan_type, max_seats, status,
  is_system, enable_career_anchor, enable_ideal_card, enable_combined,
  feature_permissions, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '個人用戶中心',
  '',
  '',
  'enterprise',
  999999,
  'active',
  true,
  true, true, true,
  '{"career_anchor":true,"ideal_card":true,"combined":true,"report_download":true,"analytics":true,"client_management":true,"consultant_notes":true,"trend_analysis":true,"certification":true,"cdu_records":true,"message":true}',
  now(),
  now()
);