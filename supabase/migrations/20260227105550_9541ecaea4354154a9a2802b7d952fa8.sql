
-- ===================================================================
-- SCPC Certification System v4 Enterprise Upgrade - Database Migration
-- ===================================================================

-- 1. ALTER certifications: Update defaults (5yr cycle, 80 CDU hours)
ALTER TABLE certifications
  ALTER COLUMN minimum_cdu_hours SET DEFAULT 80,
  ALTER COLUMN renewal_cycle_years SET DEFAULT 5;

COMMENT ON COLUMN certifications.minimum_cdu_hours IS 'Minimum CDU hours required per renewal cycle (default 80 for 5-year SCPC cycle)';

-- Add cycle_start_date for tracking original cycle start
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS cycle_start_date date;
COMMENT ON COLUMN certifications.cycle_start_date IS 'Original start date of current certification cycle (for renewal calculation)';

-- Backfill cycle_start_date from issue_date for existing records
UPDATE certifications SET cycle_start_date = issue_date WHERE cycle_start_date IS NULL;

-- 2. ALTER cdu_records: Add A/B type classification and auto-verification
ALTER TABLE cdu_records
  ADD COLUMN IF NOT EXISTS cdu_type text NOT NULL DEFAULT 'B',
  ADD COLUMN IF NOT EXISTS auto_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS course_catalog_id uuid;

COMMENT ON COLUMN cdu_records.cdu_type IS 'CDU classification: A = official course (auto-verified), B = external (manual review)';
COMMENT ON COLUMN cdu_records.auto_verified IS 'Whether this CDU was automatically verified via course enrollment system';
COMMENT ON COLUMN cdu_records.start_date IS 'Start date of the CDU activity';
COMMENT ON COLUMN cdu_records.end_date IS 'End date of the CDU activity';
COMMENT ON COLUMN cdu_records.course_catalog_id IS 'Reference to official course catalog entry (for A-type CDU)';

-- Backfill start_date from activity_date for existing records
UPDATE cdu_records SET start_date = activity_date WHERE start_date IS NULL;

-- Add index for cdu_type
CREATE INDEX IF NOT EXISTS idx_cdu_type ON cdu_records(cdu_type);
CREATE INDEX IF NOT EXISTS idx_cdu_course_catalog ON cdu_records(course_catalog_id);

-- 3. CREATE cdu_course_catalog: Official course library for A-type CDU
CREATE TABLE IF NOT EXISTS cdu_course_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text NOT NULL,
  course_name text NOT NULL,
  course_name_zh text,
  description text,
  description_zh text,
  course_provider text NOT NULL DEFAULT 'SCPC',
  course_type text NOT NULL DEFAULT 'training',
  cdu_hours numeric(6,2) NOT NULL DEFAULT 0,
  is_official boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  prerequisites text,
  organization_id uuid REFERENCES organizations(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE cdu_course_catalog IS 'Official course library for A-type CDU auto-verification. Courses marked is_official=true trigger automatic CDU generation upon enrollment completion.';
COMMENT ON COLUMN cdu_course_catalog.course_code IS 'Unique course identifier code (e.g., SCPC-101)';
COMMENT ON COLUMN cdu_course_catalog.course_type IS 'training | workshop | conference | supervision | seminar';

CREATE INDEX IF NOT EXISTS idx_course_catalog_org ON cdu_course_catalog(organization_id);
CREATE INDEX IF NOT EXISTS idx_course_catalog_active ON cdu_course_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_course_catalog_official ON cdu_course_catalog(is_official);

-- Add FK from cdu_records to cdu_course_catalog
ALTER TABLE cdu_records
  ADD CONSTRAINT fk_cdu_course_catalog
  FOREIGN KEY (course_catalog_id) REFERENCES cdu_course_catalog(id)
  ON DELETE SET NULL;

-- 4. CREATE course_enrollments: Track enrollment + attendance + assignment for A-type auto-CDU
CREATE TABLE IF NOT EXISTS course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES cdu_course_catalog(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  certification_id uuid REFERENCES certifications(id),
  enrollment_date timestamptz NOT NULL DEFAULT now(),
  attendance_confirmed boolean NOT NULL DEFAULT false,
  attendance_date date,
  assignment_submitted boolean NOT NULL DEFAULT false,
  assignment_submitted_at timestamptz,
  assignment_grade text,
  completion_status text NOT NULL DEFAULT 'enrolled',
  completed_at timestamptz,
  cdu_auto_generated boolean NOT NULL DEFAULT false,
  cdu_record_id uuid REFERENCES cdu_records(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE course_enrollments IS 'Enrollment records linking users to official courses. When attendance + assignment conditions are met, A-type CDU is auto-generated.';
COMMENT ON COLUMN course_enrollments.completion_status IS 'enrolled | attending | completed | dropped | failed';

CREATE INDEX IF NOT EXISTS idx_enrollment_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_cert ON course_enrollments(certification_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_status ON course_enrollments(completion_status);
CREATE INDEX IF NOT EXISTS idx_enrollment_org ON course_enrollments(organization_id);

-- Unique constraint: one enrollment per user per course (can re-enroll after drop)
CREATE UNIQUE INDEX IF NOT EXISTS uq_enrollment_user_course ON course_enrollments(user_id, course_id) WHERE completion_status NOT IN ('dropped', 'failed');

-- 5. CREATE notification_logs: Comprehensive notification tracking
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  channel text NOT NULL DEFAULT 'system',
  subject text NOT NULL,
  content text,
  template_key text,
  metadata jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'sent',
  message_id uuid REFERENCES messages(id),
  organization_id uuid REFERENCES organizations(id),
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE notification_logs IS 'Centralized notification log tracking all system notifications across channels (system, email, LINE)';
COMMENT ON COLUMN notification_logs.notification_type IS 'cdu_review | renewal_reminder | expiry_warning | certification_issued | cdu_shortfall | renewal_result';
COMMENT ON COLUMN notification_logs.channel IS 'system | email | line';
COMMENT ON COLUMN notification_logs.status IS 'pending | sent | failed | read';
COMMENT ON COLUMN notification_logs.template_key IS 'Reference to notification template for future template system';

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notification_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notif_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notif_channel ON notification_logs(channel);
CREATE INDEX IF NOT EXISTS idx_notif_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notif_org ON notification_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notification_logs(created_at DESC);

-- 6. Update existing certifications to new defaults (5yr/80hr) where they had old defaults
UPDATE certifications 
SET minimum_cdu_hours = 80, renewal_cycle_years = 5 
WHERE minimum_cdu_hours = 60 AND renewal_cycle_years = 3;
