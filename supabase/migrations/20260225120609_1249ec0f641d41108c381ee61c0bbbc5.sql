
-- ============================================================
-- SCPC Enterprise SaaS: Multi-tenant Database Architecture
-- ============================================================

-- 1. Organizations (多租户机构)
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text,
  logo_url text,
  plan_type text NOT NULL DEFAULT 'trial',
  max_seats integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE organizations IS 'Multi-tenant organizations for enterprise SaaS';
COMMENT ON COLUMN organizations.plan_type IS 'trial | standard | professional | enterprise';
COMMENT ON COLUMN organizations.status IS 'active | suspended | archived';

-- 2. Departments (部门)
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  manager_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_departments_org ON departments(organization_id);
COMMENT ON TABLE departments IS 'Department structure within organizations';

-- 3. SSO Configurations (SSO配置)
CREATE TABLE IF NOT EXISTS sso_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_type text NOT NULL,
  provider_name text NOT NULL,
  client_id text,
  metadata_url text,
  domain_mapping text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  config_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sso_org ON sso_configurations(organization_id);
COMMENT ON TABLE sso_configurations IS 'SSO provider configurations per organization';
COMMENT ON COLUMN sso_configurations.provider_type IS 'azure_ad | google_workspace | okta | custom_oidc | custom_saml';

-- 4. Extend profiles table with enterprise fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role_type text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS consultant_id uuid,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_profiles_role_type ON profiles(role_type);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_consultant ON profiles(consultant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);

COMMENT ON COLUMN profiles.role_type IS 'super_admin | org_admin | hr | department_manager | employee | consultant | client | individual';
COMMENT ON COLUMN profiles.status IS 'active | invited | suspended | deactivated';

-- 5. Assessment Assignments (测评派发)
CREATE TABLE IF NOT EXISTS assessment_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_by uuid NOT NULL,
  assigned_to uuid NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  consultant_id uuid,
  assessment_version text NOT NULL DEFAULT 'scpc_v1.4',
  status text NOT NULL DEFAULT 'pending',
  due_date timestamptz,
  reminder_sent boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX idx_assignments_org ON assessment_assignments(organization_id);
CREATE INDEX idx_assignments_to ON assessment_assignments(assigned_to);
CREATE INDEX idx_assignments_by ON assessment_assignments(assigned_by);
COMMENT ON TABLE assessment_assignments IS 'Assessment assignments dispatched by admins or consultants';
COMMENT ON COLUMN assessment_assignments.status IS 'pending | in_progress | completed | expired | cancelled';

-- 6. Consultant Notes (咨询备注)
CREATE TABLE IF NOT EXISTS consultant_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid NOT NULL,
  client_id uuid NOT NULL,
  assessment_id uuid REFERENCES assessment_results(id) ON DELETE SET NULL,
  content text NOT NULL,
  is_internal boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notes_consultant ON consultant_notes(consultant_id);
CREATE INDEX idx_notes_client ON consultant_notes(client_id);
COMMENT ON TABLE consultant_notes IS 'Internal consultation notes by consultants, hidden from clients';

-- 7. Audit Logs (审计日志)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  operation_type text NOT NULL,
  target_type text,
  target_id text,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_operation ON audit_logs(operation_type);
COMMENT ON TABLE audit_logs IS 'Complete audit trail for all sensitive operations';
COMMENT ON COLUMN audit_logs.operation_type IS 'login | logout | create_user | bulk_import | assign_assessment | export_report | role_change | sso_config_change | delete_user';

-- 8. Subscriptions (订阅计划)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  plan_type text NOT NULL,
  max_users integer,
  max_assessments integer,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_entity ON subscriptions(entity_type, entity_id);
COMMENT ON TABLE subscriptions IS 'Subscription plans for organizations, consultants, and individuals';
COMMENT ON COLUMN subscriptions.entity_type IS 'organization | consultant | individual';
COMMENT ON COLUMN subscriptions.plan_type IS 'trial | basic | professional | enterprise';
COMMENT ON COLUMN subscriptions.billing_cycle IS 'monthly | yearly';

-- 9. Extend assessment_results with tenant context
ALTER TABLE assessment_results
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS consultant_id uuid,
  ADD COLUMN IF NOT EXISTS assigned_by uuid;

CREATE INDEX IF NOT EXISTS idx_results_org ON assessment_results(organization_id);
CREATE INDEX IF NOT EXISTS idx_results_consultant ON assessment_results(consultant_id);

-- 10. Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_progress ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies

-- profiles: users can read/update own profile
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- profiles: org admins/HR can see their org members
CREATE POLICY "profiles_select_org" ON profiles FOR SELECT USING (
  organization_id IS NOT NULL
  AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role_type FROM profiles WHERE id = auth.uid()) IN ('org_admin', 'hr', 'department_manager')
);

-- profiles: consultants can see their clients
CREATE POLICY "profiles_select_consultant_clients" ON profiles FOR SELECT USING (
  consultant_id IS NOT NULL
  AND consultant_id = auth.uid()
  AND (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'consultant'
);

-- profiles: super admin can see all
CREATE POLICY "profiles_select_super_admin" ON profiles FOR SELECT USING (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'super_admin'
);
CREATE POLICY "profiles_all_super_admin" ON profiles FOR ALL USING (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- profiles: insert for auth trigger
CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- organizations: org members can see their org
CREATE POLICY "organizations_select_member" ON organizations FOR SELECT USING (
  id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "organizations_all_super_admin" ON organizations FOR ALL USING (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- departments: org members can see departments in their org
CREATE POLICY "departments_select_org" ON departments FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "departments_all_super_admin" ON departments FOR ALL USING (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'super_admin'
);
CREATE POLICY "departments_manage_org_admin" ON departments FOR ALL USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role_type FROM profiles WHERE id = auth.uid()) IN ('org_admin', 'hr')
);

-- sso_configurations: only org admin and super admin
CREATE POLICY "sso_select_org_admin" ON sso_configurations FOR SELECT USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'org_admin'
);
CREATE POLICY "sso_all_super_admin" ON sso_configurations FOR ALL USING (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- assessment_results: users see own results
CREATE POLICY "results_select_own" ON assessment_results FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "results_insert_own" ON assessment_results FOR INSERT WITH CHECK (user_id = auth.uid());

-- assessment_results: org admins see org results
CREATE POLICY "results_select_org" ON assessment_results FOR SELECT USING (
  organization_id IS NOT NULL
  AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role_type FROM profiles WHERE id = auth.uid()) IN ('org_admin', 'hr', 'department_manager')
);

-- assessment_results: consultants see client results
CREATE POLICY "results_select_consultant" ON assessment_results FOR SELECT USING (
  consultant_id IS NOT NULL
  AND consultant_id = auth.uid()
);

-- assessment_results: super admin sees all
CREATE POLICY "results_all_super_admin" ON assessment_results FOR ALL USING (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- assessment_progress: users manage own progress
CREATE POLICY "progress_select_own" ON assessment_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "progress_insert_own" ON assessment_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "progress_update_own" ON assessment_progress FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "progress_delete_own" ON assessment_progress FOR DELETE USING (user_id = auth.uid());

-- assessment_assignments: assigned user can see own
CREATE POLICY "assignments_select_own" ON assessment_assignments FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "assignments_select_org" ON assessment_assignments FOR SELECT USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role_type FROM profiles WHERE id = auth.uid()) IN ('org_admin', 'hr')
);
CREATE POLICY "assignments_manage_org" ON assessment_assignments FOR INSERT WITH CHECK (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role_type FROM profiles WHERE id = auth.uid()) IN ('org_admin', 'hr')
);
CREATE POLICY "assignments_select_consultant" ON assessment_assignments FOR SELECT USING (
  consultant_id = auth.uid()
);
CREATE POLICY "assignments_manage_consultant" ON assessment_assignments FOR INSERT WITH CHECK (
  consultant_id = auth.uid()
  AND (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'consultant'
);
CREATE POLICY "assignments_all_super_admin" ON assessment_assignments FOR ALL USING (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- consultant_notes: consultant sees own notes
CREATE POLICY "notes_select_own" ON consultant_notes FOR SELECT USING (consultant_id = auth.uid());
CREATE POLICY "notes_manage_own" ON consultant_notes FOR ALL USING (consultant_id = auth.uid());
CREATE POLICY "notes_all_super_admin" ON consultant_notes FOR ALL USING (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- audit_logs: only super admin and org admin (own org logs)
CREATE POLICY "audit_select_super_admin" ON audit_logs FOR SELECT USING (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'super_admin'
);
CREATE POLICY "audit_insert_any" ON audit_logs FOR INSERT WITH CHECK (true);

-- subscriptions: entity owner and super admin
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT USING (
  (entity_type = 'organization' AND entity_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
  OR (entity_type = 'consultant' AND entity_id = auth.uid())
  OR (entity_type = 'individual' AND entity_id = auth.uid())
);
CREATE POLICY "subscriptions_all_super_admin" ON subscriptions FOR ALL USING (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'super_admin'
);
