CREATE OR REPLACE FUNCTION public.setup_test_account(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_role text,
  p_role_type text,
  p_needs_org boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid := NULL;
  v_result jsonb;
BEGIN
  -- If the role needs an organization, ensure demo org exists
  IF p_needs_org THEN
    SELECT id INTO v_org_id FROM organizations WHERE domain = 'scpc-demo.com' LIMIT 1;
    
    IF v_org_id IS NULL THEN
      INSERT INTO organizations (name, domain, plan_type, max_seats, status)
      VALUES ('SCPC Demo Corp', 'scpc-demo.com', 'enterprise', 100, 'active')
      RETURNING id INTO v_org_id;
    END IF;
  END IF;

  -- Upsert profile with correct role, and RESET additional_roles to prevent
  -- stale swapped roles from persisting across re-logins
  INSERT INTO profiles (id, email, full_name, role, role_type, avatar_url, status, organization_id, additional_roles, updated_at)
  VALUES (p_user_id, p_email, p_full_name, p_role, p_role_type, '', 'active', v_org_id, '[]'::jsonb, now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    role_type = EXCLUDED.role_type,
    status = EXCLUDED.status,
    organization_id = EXCLUDED.organization_id,
    additional_roles = '[]'::jsonb,
    updated_at = now();

  -- Clear any stale assessment progress
  DELETE FROM assessment_progress WHERE user_id = p_user_id;

  v_result := jsonb_build_object(
    'success', true,
    'organization_id', v_org_id
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.setup_test_account IS 'Bootstrap a test account with proper role and optional demo organization (bypasses RLS). Resets additional_roles to prevent stale role swaps.';