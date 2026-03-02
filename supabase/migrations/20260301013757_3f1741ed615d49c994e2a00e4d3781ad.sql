
-- V8.1 DDL Migration 4: Alter cdu_course_catalog for V8.1 requirements

-- Add institution field (AMBOW | HK)
ALTER TABLE cdu_course_catalog ADD COLUMN IF NOT EXISTS institution text DEFAULT '' 
  CHECK (institution IN ('', 'AMBOW', 'HK'));

-- Add year tag for Red Cup courses (紅盃年度標籤)
ALTER TABLE cdu_course_catalog ADD COLUMN IF NOT EXISTS year_tag text DEFAULT '';

-- Add CDU class (A-Class / B-Class)
ALTER TABLE cdu_course_catalog ADD COLUMN IF NOT EXISTS cdu_class text NOT NULL DEFAULT 'A'
  CHECK (cdu_class IN ('A', 'B'));

-- Add recorded course support
ALTER TABLE cdu_course_catalog ADD COLUMN IF NOT EXISTS is_recorded boolean NOT NULL DEFAULT false;
ALTER TABLE cdu_course_catalog ADD COLUMN IF NOT EXISTS course_url text DEFAULT '';

-- Add credit conditions (認抵條件) to replace prerequisites semantically
ALTER TABLE cdu_course_catalog ADD COLUMN IF NOT EXISTS credit_conditions text DEFAULT '';

COMMENT ON COLUMN cdu_course_catalog.institution IS 'Organizing institution: AMBOW or HK';
COMMENT ON COLUMN cdu_course_catalog.year_tag IS 'Year tag for Red Cup courses (e.g., 2024紅盃課程)';
COMMENT ON COLUMN cdu_course_catalog.cdu_class IS 'CDU classification: A = auto-approved, B = manual review';
COMMENT ON COLUMN cdu_course_catalog.is_recorded IS 'Whether this is a recorded/on-demand course';
COMMENT ON COLUMN cdu_course_catalog.course_url IS 'URL for recorded courses (required when is_recorded=true)';
COMMENT ON COLUMN cdu_course_catalog.credit_conditions IS 'Credit recognition conditions (認抵條件)';

CREATE INDEX IF NOT EXISTS idx_course_catalog_institution ON cdu_course_catalog (institution);
CREATE INDEX IF NOT EXISTS idx_course_catalog_cdu_class ON cdu_course_catalog (cdu_class);
CREATE INDEX IF NOT EXISTS idx_course_catalog_year_tag ON cdu_course_catalog (year_tag);
