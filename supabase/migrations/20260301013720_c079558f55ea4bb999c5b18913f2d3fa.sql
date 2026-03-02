
-- V8.1 DDL Migration 2: Create certification_applications table (認證申請)
-- Users submit certification applications which go through review workflow

CREATE TABLE IF NOT EXISTS certification_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  certificate_type_id uuid NOT NULL REFERENCES certificate_types(id),
  certification_type text NOT NULL,           -- SCPC | SCPS | ELF (denormalized for quick access)
  
  -- Applicant info
  first_name_en text DEFAULT '',
  last_name_en text DEFAULT '',
  full_name_zh text DEFAULT '',
  
  -- Application data
  application_data jsonb DEFAULT '{}',        -- Flexible JSON for any application form fields
  supporting_documents jsonb DEFAULT '[]',    -- Array of document URLs
  
  -- Review workflow status
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft', 'submitted', 'under_review', 'sent_to_gcqa', 'certificate_issuing', 'approved', 'rejected', 'withdrawn')),
  
  -- Review tracking
  reviewer_id uuid REFERENCES profiles(id),
  review_comment text DEFAULT '',
  reviewed_at timestamptz,
  
  -- Result: generated certification
  certification_id uuid REFERENCES certifications(id),  -- Link to issued cert after approval
  
  organization_id uuid REFERENCES organizations(id),
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE certification_applications IS 'Certification applications submitted by users, reviewed through multi-step workflow';
COMMENT ON COLUMN certification_applications.status IS 'Workflow: submitted → under_review → sent_to_gcqa → certificate_issuing → approved/rejected';

CREATE INDEX IF NOT EXISTS idx_cert_app_user ON certification_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_cert_app_type ON certification_applications (certification_type);
CREATE INDEX IF NOT EXISTS idx_cert_app_status ON certification_applications (status);
CREATE INDEX IF NOT EXISTS idx_cert_app_org ON certification_applications (organization_id);
CREATE INDEX IF NOT EXISTS idx_cert_app_reviewer ON certification_applications (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_cert_app_created ON certification_applications (created_at DESC);
