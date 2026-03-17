
-- =====================================================
-- 统一批次施测 (Unified Batch Assessment) Core Tables
-- =====================================================

-- 1. 企业测评批次主表
CREATE TABLE IF NOT EXISTS scpc_assessment_batches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name text NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  organization_name text NOT NULL DEFAULT '',
  assessment_type text NOT NULL CHECK (assessment_type IN ('career_anchor', 'life_card', 'combined')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'closed', 'archived')),
  batch_slug text NOT NULL UNIQUE,
  access_code text NOT NULL,
  language text NOT NULL DEFAULT 'zh-TW',
  instructions text DEFAULT '',
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  allow_repeat_entry boolean NOT NULL DEFAULT false,
  allow_resume boolean NOT NULL DEFAULT true,
  allow_view_report boolean NOT NULL DEFAULT true,
  reminder_1_day boolean NOT NULL DEFAULT false,
  reminder_3_day boolean NOT NULL DEFAULT false,
  reminder_before_deadline boolean NOT NULL DEFAULT false,
  max_code_attempts integer NOT NULL DEFAULT 5,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sab_status ON scpc_assessment_batches(status);
CREATE INDEX IF NOT EXISTS idx_sab_org ON scpc_assessment_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_sab_slug ON scpc_assessment_batches(batch_slug);
CREATE INDEX IF NOT EXISTS idx_sab_created ON scpc_assessment_batches(created_at DESC);

-- 2. 测评参与者会话
CREATE TABLE IF NOT EXISTS scpc_assessment_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES scpc_assessment_batches(id) ON DELETE CASCADE,
  participant_name text NOT NULL DEFAULT '',
  department text DEFAULT '',
  email text DEFAULT '',
  work_years integer,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  session_token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  answers jsonb DEFAULT '[]',
  current_question_index integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  ip_address text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sas_batch ON scpc_assessment_sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_sas_status ON scpc_assessment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sas_token ON scpc_assessment_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sas_email ON scpc_assessment_sessions(email);

-- 3. 测评结果
CREATE TABLE IF NOT EXISTS scpc_assessment_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES scpc_assessment_sessions(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES scpc_assessment_batches(id) ON DELETE CASCADE,
  participant_name text NOT NULL DEFAULT '',
  department text DEFAULT '',
  email text DEFAULT '',
  work_years integer,
  calculated_scores jsonb NOT NULL DEFAULT '{}',
  main_anchor text DEFAULT '',
  conflict_pairs jsonb DEFAULT '[]',
  duration_seconds integer DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sar_batch ON scpc_assessment_results(batch_id);
CREATE INDEX IF NOT EXISTS idx_sar_session ON scpc_assessment_results(session_id);
CREATE INDEX IF NOT EXISTS idx_sar_completed ON scpc_assessment_results(completed_at DESC);

-- 4. 批次访问日志
CREATE TABLE IF NOT EXISTS scpc_batch_access_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES scpc_assessment_batches(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('link_visit', 'code_verify_success', 'code_verify_fail', 'assessment_start', 'assessment_complete', 'reminder_sent', 'batch_created', 'batch_paused', 'batch_closed')),
  participant_name text DEFAULT '',
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sbal_batch ON scpc_batch_access_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_sbal_event ON scpc_batch_access_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_sbal_created ON scpc_batch_access_logs(created_at DESC);

-- 5. 提醒日志
CREATE TABLE IF NOT EXISTS scpc_batch_reminder_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES scpc_assessment_batches(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('auto_1day', 'auto_3day', 'auto_deadline', 'manual')),
  recipient_email text DEFAULT '',
  recipient_name text DEFAULT '',
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sbrl_batch ON scpc_batch_reminder_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_sbrl_type ON scpc_batch_reminder_logs(reminder_type);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE scpc_assessment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE scpc_assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scpc_assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE scpc_batch_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scpc_batch_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Super admin: full access to all batches
CREATE POLICY "super_admin_batches_all" ON scpc_assessment_batches
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role_type = 'super_admin')
  );

-- Org admin/HR: access own org batches only
CREATE POLICY "org_admin_batches_own" ON scpc_assessment_batches
  FOR ALL TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role_type IN ('org_admin', 'hr', 'department_manager'))
  );

-- Anon users: read active batches by slug (for participant flow)
CREATE POLICY "anon_batches_read_active" ON scpc_assessment_batches
  FOR SELECT TO anon
  USING (status = 'active');

-- Sessions: authenticated admins can read/manage
CREATE POLICY "admin_sessions_all" ON scpc_assessment_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scpc_assessment_batches b
      JOIN profiles p ON p.id = auth.uid()
      WHERE b.id = scpc_assessment_sessions.batch_id
      AND (p.role_type = 'super_admin' OR (p.role_type IN ('org_admin', 'hr', 'department_manager') AND b.organization_id = p.organization_id))
    )
  );

-- Anon: can create and update own sessions
CREATE POLICY "anon_sessions_insert" ON scpc_assessment_sessions
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "anon_sessions_select" ON scpc_assessment_sessions
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_sessions_update" ON scpc_assessment_sessions
  FOR UPDATE TO anon
  USING (true);

-- Results: authenticated admins can read
CREATE POLICY "admin_results_all" ON scpc_assessment_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scpc_assessment_batches b
      JOIN profiles p ON p.id = auth.uid()
      WHERE b.id = scpc_assessment_results.batch_id
      AND (p.role_type = 'super_admin' OR (p.role_type IN ('org_admin', 'hr', 'department_manager') AND b.organization_id = p.organization_id))
    )
  );

-- Anon: can insert results
CREATE POLICY "anon_results_insert" ON scpc_assessment_results
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "anon_results_select" ON scpc_assessment_results
  FOR SELECT TO anon
  USING (true);

-- Access logs: admin read, anon insert
CREATE POLICY "admin_access_logs_all" ON scpc_batch_access_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role_type = 'super_admin')
  );

CREATE POLICY "anon_access_logs_insert" ON scpc_batch_access_logs
  FOR INSERT TO anon
  WITH CHECK (true);

-- Reminder logs: admin only
CREATE POLICY "admin_reminder_logs_all" ON scpc_batch_reminder_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role_type IN ('super_admin', 'org_admin', 'hr'))
  );
