import { useAuth } from "@/hooks/useAuth";
import {
  type RoleType,
  type PermissionModule,
  type RoleCategory,
  hasPermission,
  getPermissions,
  getRoleCategory,
  getRoleLevel,
  getConsolePath,
  getCreatableRoles,
  getRoleLabel,
} from "@/lib/permissions";
import { useLanguage } from "@/hooks/useLanguage";

export function usePermissions() {
  const { profile } = useAuth();
  const language = useLanguage((state) => state.language);

  const roleType: RoleType = (profile?.role_type as RoleType) ?? "individual";
  const roleCategory: RoleCategory = getRoleCategory(roleType);
  const roleLevel = getRoleLevel(roleType);
  const consolePath = getConsolePath(roleType);
  const roleLabel = getRoleLabel(roleType, language);
  const permissions = getPermissions(roleType);
  const creatableRoles = getCreatableRoles(roleType);

  const canAccess = (module: PermissionModule): boolean => {
    return hasPermission(roleType, module);
  };

  const isSuperAdmin = roleType === "super_admin";
  const isOrgAdmin = roleType === "org_admin";
  const isHR = roleType === "hr";
  const isDepartmentManager = roleType === "department_manager";
  const isConsultant = roleType === "consultant";
  const isEmployee = roleType === "employee";
  const isClient = roleType === "client";
  const isIndividual = roleType === "individual";

  const isOrgRole = roleCategory === "organization";
  const isConsultantRole = roleCategory === "consultant";

  const organizationId = profile?.organization_id ?? null;
  const departmentId = profile?.department_id ?? null;
  const consultantId = profile?.consultant_id ?? null;

  return {
    roleType,
    roleCategory,
    roleLevel,
    roleLabel,
    consolePath,
    permissions,
    creatableRoles,
    canAccess,
    isSuperAdmin,
    isOrgAdmin,
    isHR,
    isDepartmentManager,
    isConsultant,
    isEmployee,
    isClient,
    isIndividual,
    isOrgRole,
    isConsultantRole,
    organizationId,
    departmentId,
    consultantId,
  };
}
