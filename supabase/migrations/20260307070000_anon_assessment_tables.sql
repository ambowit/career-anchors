-- Anonymous Assessment Center — Create Tables

CREATE TABLE IF NOT EXISTS anonymous_assessment_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('career_anchor', 'life_card', 'fusion')),
  total_links INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'report_generated', 'closed')),
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT DEFAULT '',
  expires_at TIMESTAMPTZ,
  allow_report_reopen BOOLEAN NOT NULL DEFAULT true,
  optional_identity_enabled BOOLEAN NOT NULL DEFAULT false,
  report_visibility TEXT NOT NULL DEFAULT 'personal_only' CHECK (report_visibility IN ('personal_only', 'personal_and_benchmark')),
  language TEXT NOT NULL DEFAULT 'zh-TW',
  instructions TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS anonymous_assessment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES anonymous_assessment_batches(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'in_progress', 'completed', 'disabled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  participant_name TEXT,
  report_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS anonymous_assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES anonymous_assessment_links(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES anonymous_assessment_batches(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '{}',
  calculated_scores JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS anonymous_batch_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES anonymous_assessment_batches(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'full',
  total_participants INTEGER NOT NULL DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,
  summary JSONB DEFAULT '{}',
  charts JSONB DEFAULT '{}',
  ai_insights JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  risk_signals JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS anonymous_assessment_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id TEXT NOT NULL UNIQUE,
  role_name TEXT NOT NULL,
  role_name_zh TEXT NOT NULL,
  create_batch BOOLEAN NOT NULL DEFAULT false,
  generate_links BOOLEAN NOT NULL DEFAULT false,
  view_progress BOOLEAN NOT NULL DEFAULT false,
  generate_report BOOLEAN NOT NULL DEFAULT false,
  export_links BOOLEAN NOT NULL DEFAULT false,
  export_reports BOOLEAN NOT NULL DEFAULT false,
  close_batch BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_anon_links_batch ON anonymous_assessment_links(batch_id);
CREATE INDEX IF NOT EXISTS idx_anon_links_token ON anonymous_assessment_links(token);
CREATE INDEX IF NOT EXISTS idx_anon_links_status ON anonymous_assessment_links(status);
CREATE INDEX IF NOT EXISTS idx_anon_responses_batch ON anonymous_assessment_responses(batch_id);
CREATE INDEX IF NOT EXISTS idx_anon_responses_link ON anonymous_assessment_responses(link_id);
CREATE INDEX IF NOT EXISTS idx_anon_reports_batch ON anonymous_batch_reports(batch_id);
CREATE INDEX IF NOT EXISTS idx_anon_batches_status ON anonymous_assessment_batches(status);

-- RLS
ALTER TABLE anonymous_assessment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_assessment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_batch_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_assessment_permissions ENABLE ROW LEVEL SECURITY;

-- Batches policies
CREATE POLICY "anon_batches_select" ON anonymous_assessment_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "anon_batches_insert" ON anonymous_assessment_batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anon_batches_update" ON anonymous_assessment_batches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "anon_batches_delete" ON anonymous_assessment_batches FOR DELETE TO authenticated USING (true);

-- Links policies
CREATE POLICY "anon_links_select_auth" ON anonymous_assessment_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "anon_links_insert" ON anonymous_assessment_links FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anon_links_update_auth" ON anonymous_assessment_links FOR UPDATE TO authenticated USING (true);
CREATE POLICY "anon_links_select_anon" ON anonymous_assessment_links FOR SELECT TO anon USING (true);
CREATE POLICY "anon_links_update_anon" ON anonymous_assessment_links FOR UPDATE TO anon USING (true);

-- Responses policies
CREATE POLICY "anon_responses_select" ON anonymous_assessment_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "anon_responses_insert_auth" ON anonymous_assessment_responses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anon_responses_insert_anon" ON anonymous_assessment_responses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_responses_select_anon" ON anonymous_assessment_responses FOR SELECT TO anon USING (true);

-- Reports policies
CREATE POLICY "anon_reports_select" ON anonymous_batch_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "anon_reports_insert" ON anonymous_batch_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anon_reports_update" ON anonymous_batch_reports FOR UPDATE TO authenticated USING (true);

-- Permissions policies
CREATE POLICY "anon_perms_select" ON anonymous_assessment_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "anon_perms_update" ON anonymous_assessment_permissions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "anon_perms_insert" ON anonymous_assessment_permissions FOR INSERT TO authenticated WITH CHECK (true);

-- Seed default permission roles
INSERT INTO anonymous_assessment_permissions (role_id, role_name, role_name_zh, create_batch, generate_links, view_progress, generate_report, export_links, export_reports, close_batch) VALUES
  ('super_admin', 'Super Admin', '超級管理員', true, true, true, true, true, true, true),
  ('enterprise_admin', 'Enterprise Admin', '企業管理員', true, true, true, true, true, true, true),
  ('hr_admin', 'HR Admin', '人資管理員', true, true, true, true, true, false, false),
  ('assessment_admin', 'Assessment Admin', '測評管理員', true, true, true, false, true, false, false),
  ('viewer', 'Read-only Viewer', '唯讀檢視者', false, false, true, false, false, false, false)
ON CONFLICT (role_id) DO NOTHING;

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_anon_batch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_anon_batch_updated_at ON anonymous_assessment_batches;
CREATE TRIGGER trg_anon_batch_updated_at
  BEFORE UPDATE ON anonymous_assessment_batches
  FOR EACH ROW EXECUTE FUNCTION update_anon_batch_updated_at();
