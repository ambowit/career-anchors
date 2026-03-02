
-- ============================================
-- 1. user_reports - 个人报告存档空间
-- ============================================
CREATE TABLE IF NOT EXISTS user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES assessment_results(id) ON DELETE SET NULL,
  report_type text NOT NULL DEFAULT 'assessment'
    CHECK (report_type IN ('assessment', 'comprehensive', 'trend', 'ideal_card')),
  title text NOT NULL,
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  consultant_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_reports_user ON user_reports(user_id);
CREATE INDEX idx_user_reports_assessment ON user_reports(assessment_id);
CREATE INDEX idx_user_reports_consultant ON user_reports(consultant_id);
CREATE INDEX idx_user_reports_created ON user_reports(created_at DESC);

-- RLS for user_reports
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON user_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Consultants can view reports of their clients
CREATE POLICY "Consultants can view client reports"
  ON user_reports FOR SELECT
  USING (auth.uid() = consultant_id);

-- Consultants can insert reports for their clients
CREATE POLICY "Consultants can create client reports"
  ON user_reports FOR INSERT
  WITH CHECK (auth.uid() = consultant_id);

-- Users can insert their own reports
CREATE POLICY "Users can insert own reports"
  ON user_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Super admins can do everything
CREATE POLICY "Super admins full access on user_reports"
  ON user_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_type = 'super_admin'
    )
  );

-- Org admins can view reports within their org
CREATE POLICY "Org admins can view org reports"
  ON user_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_type IN ('org_admin', 'hr', 'department_manager')
      AND profiles.organization_id = user_reports.organization_id
    )
  );

-- ============================================
-- 2. messages - 全链路消息系统
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT '',
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'notification'
    CHECK (message_type IN ('system', 'notification', 'personal', 'report_share', 'assessment_assign', 'reminder')),
  channel text NOT NULL DEFAULT 'system'
    CHECK (channel IN ('org_internal', 'consultant_client', 'platform_user', 'system')),
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_channel ON messages(channel);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_org ON messages(organization_id);
CREATE INDEX idx_messages_type ON messages(message_type);

-- RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages sent to them
CREATE POLICY "Users can view received messages"
  ON messages FOR SELECT
  USING (auth.uid() = recipient_id);

-- Users can view messages they sent
CREATE POLICY "Users can view sent messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id);

-- Users can insert messages (send)
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can update their received messages (mark as read)
CREATE POLICY "Users can mark own messages as read"
  ON messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Super admins can view ALL messages (monitoring)
CREATE POLICY "Super admins can view all messages"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_type = 'super_admin'
    )
  );

-- Org admins can view org internal messages
CREATE POLICY "Org admins can view org messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_type IN ('org_admin', 'hr')
      AND profiles.organization_id = messages.organization_id
    )
  );

COMMENT ON TABLE user_reports IS 'Personal report archive for users and consultant clients';
COMMENT ON TABLE messages IS 'Full-chain messaging system across all roles and channels';
