
-- V8.1 DDL Migration 1: Create certificate_types table (證照清單)
-- Stores all available certification types (SCPC, SCPS, ELF, etc.)

CREATE TABLE IF NOT EXISTS certificate_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_code text NOT NULL UNIQUE,            -- e.g., SCPC, SCPS, ELF
  cert_name_en text NOT NULL,                -- English name
  cert_name_zh_cn text NOT NULL,             -- Simplified Chinese name
  cert_name_zh_tw text NOT NULL,             -- Traditional Chinese name
  description_en text DEFAULT '',
  description_zh_cn text DEFAULT '',
  description_zh_tw text DEFAULT '',
  gcqa_code text DEFAULT '',                 -- GCQA cooperation code (first 4 chars of cert ID)
  renewal_cycle_years integer NOT NULL DEFAULT 5,
  minimum_cdu_hours integer NOT NULL DEFAULT 80,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE certificate_types IS 'Certificate type registry for all certification programs (SCPC, SCPS, ELF, etc.)';
COMMENT ON COLUMN certificate_types.cert_code IS 'Unique short code used in certificate ID generation (e.g., SCPC, SCPS, ELF)';
COMMENT ON COLUMN certificate_types.gcqa_code IS 'GCQA cooperation code: first 4 characters of certificate ID for GCQA-partnered certificates';

-- Insert default certificate types
INSERT INTO certificate_types (cert_code, cert_name_en, cert_name_zh_cn, cert_name_zh_tw, gcqa_code, renewal_cycle_years, minimum_cdu_hours, sort_order)
VALUES
  ('SCPC', 'SCPC Career Pathway Consultant', 'SCPC 职业路径顾问', 'SCPC 職業路徑顧問', 'SCPC', 5, 80, 1),
  ('SCPS', 'SCPS Career Pathway Specialist', 'SCPS 职业路径专家', 'SCPS 職業路徑專家', 'SCPS', 5, 80, 2),
  ('ELF', 'ELF Executive Life Facilitator', 'ELF 高管生涯引导师', 'ELF 高管生涯引導師', 'ELF-', 5, 80, 3)
ON CONFLICT (cert_code) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_cert_types_active ON certificate_types (is_active);
CREATE INDEX IF NOT EXISTS idx_cert_types_code ON certificate_types (cert_code);
