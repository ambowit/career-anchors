import { supabase } from "@/integrations/supabase/client";
import { findConsoleRoleFromProfile } from "@/lib/permissions";

interface ProfileForConsole {
  id: string;
  role_type: string;
  organization_id?: string | null;
  department_id?: string | null;
  additional_roles?: Array<{
    role_type: string;
    organization_id?: string | null;
    department_id?: string | null;
    organization_name?: string | null;
  }> | null;
}

/**
 * Navigate to the user's console, auto-swapping roles if needed.
 *
 * When the user's console role lives in `additional_roles` (not the
 * primary `role_type`), this helper promotes it to primary before
 * navigating.  This mirrors what RoleSwitcher does on manual switch
 * and guarantees that RoleGuard + usePermissions see the correct role.
 *
 * Returns `true` if navigation occurred, `false` if no console access.
 */
export async function navigateToConsoleWithSwap(
  profile: ProfileForConsole,
  refreshProfile: () => Promise<void>,
  navigate: (path: string) => void,
): Promise<boolean> {
  const consoleInfo = findConsoleRoleFromProfile(profile);
  if (!consoleInfo) return false;

  if (consoleInfo.needsSwap) {
    const additionalRoles = Array.isArray(profile.additional_roles)
      ? profile.additional_roles
      : [];

    const targetAdditionalRole = additionalRoles.find(
      (roleEntry) => roleEntry.role_type === consoleInfo.roleType,
    );

    // Build new additional_roles: remove the target, add current primary
    const newAdditionalRoles = additionalRoles
      .filter((roleEntry) => roleEntry.role_type !== consoleInfo.roleType)
      .concat({
        role_type: profile.role_type,
        organization_id: profile.organization_id || null,
        department_id: profile.department_id || null,
        organization_name: null,
      });

    const { error } = await supabase
      .from("profiles")
      .update({
        role_type: consoleInfo.roleType,
        organization_id: targetAdditionalRole?.organization_id || null,
        additional_roles: newAdditionalRoles as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) return false;

    await refreshProfile();
  }

  navigate(consoleInfo.consolePath);
  return true;
}
