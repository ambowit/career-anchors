
-- ═══ 1. Fix handle_new_user trigger to be compatible with enterprise schema ═══
-- The old trigger only inserts basic fields (id, email, full_name, avatar_url)
-- but the profiles table now has role_type, organization_id etc.
-- Update it to use ON CONFLICT DO NOTHING so it won't conflict with Edge Function upserts.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, role_type, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', ''),
    'user',
    COALESCE(NEW.raw_user_meta_data ->> 'role_type', 'individual'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ═══ 2. Re-enable RLS on all tables (idempotent) ═══
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ═══ 3. Recreate helper functions (idempotent) ═══
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role_type FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ═══ 4. Drop ALL existing policies and recreate cleanly ═══
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ═══ PROFILES ═══
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_all_super" ON public.profiles FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "profiles_select_org" ON public.profiles FOR SELECT USING (public.get_my_role() IN ('org_admin','hr','department_manager') AND organization_id = public.get_my_org_id());
CREATE POLICY "profiles_insert_org" ON public.profiles FOR INSERT WITH CHECK (public.get_my_role() IN ('org_admin','hr') AND organization_id = public.get_my_org_id());
CREATE POLICY "profiles_update_org" ON public.profiles FOR UPDATE USING (public.get_my_role() IN ('org_admin','hr') AND organization_id = public.get_my_org_id());
CREATE POLICY "profiles_delete_org" ON public.profiles FOR DELETE USING (public.get_my_role() IN ('org_admin','hr') AND organization_id = public.get_my_org_id());
CREATE POLICY "profiles_select_consultant" ON public.profiles FOR SELECT USING (public.get_my_role() = 'consultant' AND consultant_id = auth.uid());

-- ═══ ORGANIZATIONS ═══
CREATE POLICY "orgs_all_super" ON public.organizations FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "orgs_select_own" ON public.organizations FOR SELECT USING (id = public.get_my_org_id());

-- ═══ DEPARTMENTS ═══
CREATE POLICY "depts_all_super" ON public.departments FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "depts_all_org" ON public.departments FOR ALL USING (public.get_my_role() IN ('org_admin','hr','department_manager') AND organization_id = public.get_my_org_id());
CREATE POLICY "depts_select_member" ON public.departments FOR SELECT USING (organization_id = public.get_my_org_id());

-- ═══ ASSESSMENT_RESULTS ═══
CREATE POLICY "results_own" ON public.assessment_results FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "results_insert_own" ON public.assessment_results FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "results_select_super" ON public.assessment_results FOR SELECT USING (public.get_my_role() = 'super_admin');
CREATE POLICY "results_select_org" ON public.assessment_results FOR SELECT USING (public.get_my_role() IN ('org_admin','hr','department_manager') AND organization_id = public.get_my_org_id());
CREATE POLICY "results_select_consultant" ON public.assessment_results FOR SELECT USING (public.get_my_role() = 'consultant' AND consultant_id = auth.uid());
CREATE POLICY "results_all_super" ON public.assessment_results FOR ALL USING (public.get_my_role() = 'super_admin');

-- ═══ ASSESSMENT_PROGRESS ═══
CREATE POLICY "progress_own" ON public.assessment_progress FOR ALL USING (user_id = auth.uid());

-- ═══ CONSULTANT_NOTES ═══
CREATE POLICY "notes_own" ON public.consultant_notes FOR ALL USING (consultant_id = auth.uid());
CREATE POLICY "notes_select_super" ON public.consultant_notes FOR SELECT USING (public.get_my_role() = 'super_admin');

-- ═══ AUDIT_LOGS ═══
CREATE POLICY "audit_select_super" ON public.audit_logs FOR SELECT USING (public.get_my_role() = 'super_admin');
CREATE POLICY "audit_insert_any" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- ═══ SSO_CONFIGURATIONS ═══
CREATE POLICY "sso_all_super" ON public.sso_configurations FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "sso_select_org" ON public.sso_configurations FOR SELECT USING (public.get_my_role() IN ('org_admin','hr') AND organization_id = public.get_my_org_id());

-- ═══ ASSESSMENT_ASSIGNMENTS ═══
CREATE POLICY "assign_all_super" ON public.assessment_assignments FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "assign_all_org" ON public.assessment_assignments FOR ALL USING (public.get_my_role() IN ('org_admin','hr') AND organization_id = public.get_my_org_id());
CREATE POLICY "assign_consultant" ON public.assessment_assignments FOR SELECT USING (public.get_my_role() = 'consultant' AND consultant_id = auth.uid());
CREATE POLICY "assign_insert_consultant" ON public.assessment_assignments FOR INSERT WITH CHECK (public.get_my_role() = 'consultant' AND consultant_id = auth.uid());
CREATE POLICY "assign_select_own" ON public.assessment_assignments FOR SELECT USING (assigned_to = auth.uid());

-- ═══ SUBSCRIPTIONS ═══
CREATE POLICY "subs_all_super" ON public.subscriptions FOR ALL USING (public.get_my_role() = 'super_admin');

-- ═══ USER_REPORTS ═══
CREATE POLICY "reports_select_own" ON public.user_reports FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "reports_insert_own" ON public.user_reports FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "reports_select_consultant" ON public.user_reports FOR SELECT USING (consultant_id = auth.uid());
CREATE POLICY "reports_insert_consultant" ON public.user_reports FOR INSERT WITH CHECK (consultant_id = auth.uid());
CREATE POLICY "reports_all_super" ON public.user_reports FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "reports_select_org" ON public.user_reports FOR SELECT USING (
  public.get_my_role() IN ('org_admin','hr','department_manager') AND organization_id = public.get_my_org_id()
);

-- ═══ MESSAGES ═══
CREATE POLICY "msg_select_received" ON public.messages FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "msg_select_sent" ON public.messages FOR SELECT USING (sender_id = auth.uid());
CREATE POLICY "msg_insert_send" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "msg_update_read" ON public.messages FOR UPDATE USING (recipient_id = auth.uid());
CREATE POLICY "msg_all_super" ON public.messages FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "msg_select_org" ON public.messages FOR SELECT USING (
  public.get_my_role() IN ('org_admin','hr') AND organization_id = public.get_my_org_id()
);
