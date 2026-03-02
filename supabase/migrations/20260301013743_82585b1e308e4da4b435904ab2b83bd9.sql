
-- V8.1 DDL Migration 3: Alter certifications table for V8.1 requirements

-- Add certificate_hash for security verification
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS certificate_hash text DEFAULT '';

-- Add cert_code reference to certificate_types
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS cert_code text DEFAULT '';

-- Add English name fields for GCQA export
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS first_name_en text DEFAULT '';
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS last_name_en text DEFAULT '';

-- Add recertification tracking
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS recertification_date date;
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS recertification_count integer NOT NULL DEFAULT 0;

-- Add certificate_type_id reference
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS certificate_type_id uuid REFERENCES certificate_types(id);

COMMENT ON COLUMN certifications.certificate_hash IS 'SHA-256 hash for certificate authenticity verification';
COMMENT ON COLUMN certifications.cert_code IS 'Certificate type code (SCPC, SCPS, ELF) for ID generation';
COMMENT ON COLUMN certifications.first_name_en IS 'Holder English first name for GCQA export';
COMMENT ON COLUMN certifications.last_name_en IS 'Holder English last name for GCQA export';
COMMENT ON COLUMN certifications.recertification_date IS 'Original issue_date of the certification (GCQA RECERTIFICATION DATE)';
COMMENT ON COLUMN certifications.recertification_count IS 'Number of times this certification has been renewed';
COMMENT ON COLUMN certifications.certificate_type_id IS 'Reference to certificate_types registry';

CREATE INDEX IF NOT EXISTS idx_certifications_cert_code ON certifications (cert_code);
CREATE INDEX IF NOT EXISTS idx_certifications_type_id ON certifications (certificate_type_id);
