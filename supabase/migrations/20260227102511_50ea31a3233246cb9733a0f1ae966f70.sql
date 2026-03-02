
-- =============================================
-- SCPC Certification Management System Tables
-- =============================================

-- 1. Certifications: Core certification lifecycle tracking
CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  certification_type text NOT NULL DEFAULT 'scpc_professional',
  certification_number text NOT NULL,
  issue_date date NOT NULL,
  expiry_date date NOT NULL,
  renewal_cycle_years integer NOT NULL DEFAULT 3,
  certification_status text NOT NULL DEFAULT 'active'
    CHECK (certification_status IN ('active', 'pending_renewal', 'under_review', 'suspended', 'expired', 'revoked')),
  minimum_cdu_hours integer NOT NULL DEFAULT 60,
  issued_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(certification_number)
);

CREATE INDEX idx_certifications_user ON certifications(user_id);
CREATE INDEX idx_certifications_org ON certifications(organization_id);
CREATE INDEX idx_certifications_status ON certifications(certification_status);
CREATE INDEX idx_certifications_expiry ON certifications(expiry_date);

COMMENT ON TABLE certifications IS 'Professional certification lifecycle tracking for SCPC certified practitioners';
COMMENT ON COLUMN certifications.certification_status IS 'active | pending_renewal | under_review | suspended | expired | revoked';
COMMENT ON COLUMN certifications.minimum_cdu_hours IS 'Minimum CDU hours required per renewal cycle (default 60 for 3-year cycle)';

-- 2. CDU Records: Continuing Development Unit credit tracking
CREATE TABLE IF NOT EXISTS cdu_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  certification_id uuid NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  activity_type text NOT NULL
    CHECK (activity_type IN ('training', 'workshop', 'conference', 'supervision', 'research', 'publication', 'teaching')),
  activity_title text NOT NULL,
  activity_provider text,
  activity_date date NOT NULL,
  cdu_hours numeric(6,2) NOT NULL CHECK (cdu_hours > 0),
  proof_document_url text,
  approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  reviewer_id uuid REFERENCES profiles(id),
  review_comment text,
  reviewed_at timestamptz,
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cdu_user ON cdu_records(user_id);
CREATE INDEX idx_cdu_certification ON cdu_records(certification_id);
CREATE INDEX idx_cdu_status ON cdu_records(approval_status);
CREATE INDEX idx_cdu_org ON cdu_records(organization_id);

COMMENT ON TABLE cdu_records IS 'Continuing Development Unit credit records for certified practitioners';
COMMENT ON COLUMN cdu_records.activity_type IS 'training | workshop | conference | supervision | research | publication | teaching';
COMMENT ON COLUMN cdu_records.approval_status IS 'pending | approved | rejected';

-- 3. Renewal Applications: Certification renewal workflow
CREATE TABLE IF NOT EXISTS renewal_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  certification_id uuid NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  application_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),
  total_cdu_hours numeric(6,2) NOT NULL DEFAULT 0,
  cdu_summary jsonb DEFAULT '[]'::jsonb,
  supporting_documents jsonb DEFAULT '[]'::jsonb,
  reviewer_id uuid REFERENCES profiles(id),
  review_comment text,
  reviewed_at timestamptz,
  new_issue_date date,
  new_expiry_date date,
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_renewal_user ON renewal_applications(user_id);
CREATE INDEX idx_renewal_cert ON renewal_applications(certification_id);
CREATE INDEX idx_renewal_status ON renewal_applications(status);
CREATE INDEX idx_renewal_org ON renewal_applications(organization_id);

COMMENT ON TABLE renewal_applications IS 'Certification renewal applications with CDU summary and review workflow';
COMMENT ON COLUMN renewal_applications.status IS 'draft | submitted | under_review | approved | rejected | withdrawn';
COMMENT ON COLUMN renewal_applications.cdu_summary IS 'JSON array of CDU activity summaries included in this renewal';

-- 4. Certification Review Logs: Audit trail for all review decisions
CREATE TABLE IF NOT EXISTS certification_review_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES profiles(id),
  reviewer_email text,
  target_type text NOT NULL
    CHECK (target_type IN ('cdu_record', 'renewal_application', 'certification')),
  target_id uuid NOT NULL,
  action text NOT NULL
    CHECK (action IN ('approve', 'reject', 'suspend', 'revoke', 'reinstate', 'issue', 'expire')),
  previous_status text,
  new_status text,
  comment text,
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_logs_reviewer ON certification_review_logs(reviewer_id);
CREATE INDEX idx_review_logs_target ON certification_review_logs(target_type, target_id);
CREATE INDEX idx_review_logs_org ON certification_review_logs(organization_id);
CREATE INDEX idx_review_logs_created ON certification_review_logs(created_at DESC);

COMMENT ON TABLE certification_review_logs IS 'Complete audit trail for all certification-related review decisions';
COMMENT ON COLUMN certification_review_logs.target_type IS 'cdu_record | renewal_application | certification';
COMMENT ON COLUMN certification_review_logs.action IS 'approve | reject | suspend | revoke | reinstate | issue | expire';
