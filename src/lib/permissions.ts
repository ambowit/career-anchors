// ============================================================
// SCPC Enterprise SaaS — Role & Permission Definitions
// RBAC + ABAC hybrid model with four-layer hierarchy
// ============================================================

export type RoleType =
  | "super_admin"
  | "org_admin"
  | "hr"
  | "department_manager"
  | "employee"
  | "consultant"
  | "client"
  | "individual"
  | "partner";

export type RoleCategory = "platform" | "organization" | "consultant" | "individual";

export function getRoleCategory(roleType: RoleType): RoleCategory {
  switch (roleType) {
    case "super_admin":
      return "platform";
    case "org_admin":
    case "hr":
    case "department_manager":
    case "employee":
      return "organization";
    case "consultant":
    case "client":
      return "consultant";
    case "individual":
      return "individual";
    case "partner":
      return "platform";
  }
}

// Role hierarchy level (higher = more access)
export function getRoleLevel(roleType: RoleType): number {
  const levels: Record<RoleType, number> = {
    super_admin: 100,
    org_admin: 80,
    hr: 70,
    department_manager: 60,
    consultant: 70,
    employee: 40,
    client: 30,
    individual: 20,
    partner: 50,
  };
  return levels[roleType];
}

// Human-readable role labels (三语)
export function getRoleLabel(roleType: RoleType, language: "zh-CN" | "zh-TW" | "en"): string {
  const labels: Record<RoleType, Record<string, string>> = {
    super_admin: { "zh-CN": "超级管理员", "zh-TW": "超級管理員", en: "Super Admin" },
    org_admin: { "zh-CN": "机构管理员", "zh-TW": "機構管理員", en: "Organization Admin" },
    hr: { "zh-CN": "HR", "zh-TW": "HR", en: "HR" },
    department_manager: { "zh-CN": "部门主管", "zh-TW": "部門主管", en: "Department Manager" },
    employee: { "zh-CN": "员工", "zh-TW": "員工", en: "Employee" },
    consultant: { "zh-CN": "咨询师", "zh-TW": "諮詢師", en: "Consultant" },
    client: { "zh-CN": "咨询客户", "zh-TW": "諮詢客戶", en: "Client" },
    individual: { "zh-CN": "个人用户", "zh-TW": "個人使用者", en: "Individual User" },
    partner: { "zh-CN": "合作方", "zh-TW": "合作方", en: "Partner" },
  };
  return labels[roleType]?.[language] ?? roleType;
}

// Permission modules
export type PermissionModule =
  | "dashboard"
  | "organizations"
  | "departments"
  | "users"
  | "user_create"
  | "user_bulk_import"
  | "user_delete"
  | "user_password_reset"
  | "assessments"
  | "assessment_assign"
  | "analytics"
  | "reports"
  | "report_export"
  | "question_bank"
  | "question_edit"
  | "sso_config"
  | "audit_logs"
  | "system_settings"
  | "subscriptions"
  | "consultant_notes"
  | "client_management"
  | "report_templates"
  | "certification_management"
  | "cdu_management"
  | "course_management"
  | "batch_operations"
  | "cce_export"
  | "message_monitoring";

// Permission matrix: which roles have access to which modules
const PERMISSION_MATRIX: Record<RoleType, PermissionModule[]> = {
  super_admin: [
    "dashboard", "organizations", "departments", "users", "user_create",
    "user_bulk_import", "user_delete", "user_password_reset",
    "assessments", "assessment_assign",
    "analytics", "reports", "report_export", "question_bank", "question_edit",
    "sso_config", "audit_logs", "system_settings", "subscriptions",
    "consultant_notes", "client_management", "report_templates",
    "certification_management", "cdu_management", "course_management",
    "batch_operations", "cce_export", "message_monitoring",
  ],
  org_admin: [
    "dashboard", "departments", "users", "user_create", "user_bulk_import",
    "user_delete", "user_password_reset",
    "assessments", "assessment_assign", "analytics",
    "reports", "report_export",
    "certification_management", "cdu_management",
  ],
  hr: [
    "dashboard", "users", "user_create", "user_bulk_import",
    "assessments", "assessment_assign", "analytics", "reports", "report_export",
  ],
  department_manager: [
    "dashboard", "users", "assessments", "analytics", "reports",
  ],
  employee: [
    "dashboard", "assessments", "reports",
  ],
  consultant: [
    "dashboard", "client_management", "user_create", "assessments",
    "assessment_assign", "reports", "report_export", "consultant_notes",
    "analytics",
  ],
  client: [
    "dashboard", "assessments", "reports",
  ],
  individual: [
    "dashboard", "assessments", "reports",
  ],
  partner: [
    "dashboard",
  ],
};

export function hasPermission(roleType: RoleType, module: PermissionModule): boolean {
  return PERMISSION_MATRIX[roleType]?.includes(module) ?? false;
}

export function getPermissions(roleType: RoleType): PermissionModule[] {
  return PERMISSION_MATRIX[roleType] ?? [];
}

// Which console each role accesses
export function getConsolePath(roleType: RoleType): string {
  switch (roleType) {
    case "super_admin":
      return "/super-admin";
    case "org_admin":
    case "hr":
    case "department_manager":
      return "/org";
    case "consultant":
      return "/consultant";
    case "partner":
      return "/partner";
    case "employee":
    case "client":
    case "individual":
    default:
      return "/";
  }
}

// Check if a role has console access (i.e. a management workspace)
export function isConsoleRoleType(roleType: RoleType): boolean {
  return ["super_admin", "org_admin", "hr", "department_manager", "consultant", "partner"].includes(roleType);
}

// Find the best console path from profile, checking both role_type and additional_roles
export function findConsolePathFromProfile(profile: {
  role_type: string;
  additional_roles?: Array<{ role_type: string; organization_id?: string | null }> | null;
}): string | null {
  // Check primary role first
  if (isConsoleRoleType(profile.role_type as RoleType)) {
    return getConsolePath(profile.role_type as RoleType);
  }
  // Check additional roles
  const additionalRoles = Array.isArray(profile.additional_roles) ? profile.additional_roles : [];
  for (const additionalRole of additionalRoles) {
    if (isConsoleRoleType(additionalRole.role_type as RoleType)) {
      return getConsolePath(additionalRole.role_type as RoleType);
    }
  }
  return null;
}

// Find the best console role from profile, indicating if a swap is needed
export function findConsoleRoleFromProfile(profile: {
  role_type: string;
  additional_roles?: Array<{ role_type: string; organization_id?: string | null }> | null;
}): { roleType: RoleType; consolePath: string; needsSwap: boolean } | null {
  // Primary role is already a console role — no swap needed
  if (isConsoleRoleType(profile.role_type as RoleType)) {
    return {
      roleType: profile.role_type as RoleType,
      consolePath: getConsolePath(profile.role_type as RoleType),
      needsSwap: false,
    };
  }
  // Check additional roles
  const additionalRoles = Array.isArray(profile.additional_roles) ? profile.additional_roles : [];
  for (const additionalRole of additionalRoles) {
    if (isConsoleRoleType(additionalRole.role_type as RoleType)) {
      return {
        roleType: additionalRole.role_type as RoleType,
        consolePath: getConsolePath(additionalRole.role_type as RoleType),
        needsSwap: true,
      };
    }
  }
  return null;
}

// Get all console-capable roles from a profile (for showing multiple entries)
export function getAllConsoleRoles(profile: {
  role_type: string;
  additional_roles?: Array<{ role_type: string; organization_id?: string | null; organization_name?: string | null }> | null;
}): Array<{ roleType: RoleType; consolePath: string; organizationName?: string | null }> {
  const consoleRoles: Array<{ roleType: RoleType; consolePath: string; organizationName?: string | null }> = [];
  // Check primary role
  if (isConsoleRoleType(profile.role_type as RoleType)) {
    consoleRoles.push({
      roleType: profile.role_type as RoleType,
      consolePath: getConsolePath(profile.role_type as RoleType),
    });
  }
  // Check additional roles
  const additionalRoles = Array.isArray(profile.additional_roles) ? profile.additional_roles : [];
  for (const additionalRole of additionalRoles) {
    if (isConsoleRoleType(additionalRole.role_type as RoleType)) {
      consoleRoles.push({
        roleType: additionalRole.role_type as RoleType,
        consolePath: getConsolePath(additionalRole.role_type as RoleType),
        organizationName: (additionalRole as any).organization_name ?? null,
      });
    }
  }
  return consoleRoles;
}

// Human-readable permission module labels
export function getPermissionLabel(module: PermissionModule, language: "zh-CN" | "zh-TW" | "en"): string {
  const labels: Record<PermissionModule, Record<string, string>> = {
    dashboard: { "zh-CN": "仪表盘", "zh-TW": "儀表盤", en: "Dashboard" },
    organizations: { "zh-CN": "机构管理", "zh-TW": "機構管理", en: "Organizations" },
    departments: { "zh-CN": "部门管理", "zh-TW": "部門管理", en: "Departments" },
    users: { "zh-CN": "用户查看", "zh-TW": "使用者查看", en: "View Users" },
    user_create: { "zh-CN": "创建用户", "zh-TW": "建立使用者", en: "Create Users" },
    user_bulk_import: { "zh-CN": "批量导入", "zh-TW": "批次匯入", en: "Bulk Import" },
    user_delete: { "zh-CN": "删除用户", "zh-TW": "刪除使用者", en: "Delete Users" },
    user_password_reset: { "zh-CN": "重置密码", "zh-TW": "重設密碼", en: "Reset Password" },
    assessments: { "zh-CN": "测评管理", "zh-TW": "測評管理", en: "Assessments" },
    assessment_assign: { "zh-CN": "分配测评", "zh-TW": "分配測評", en: "Assign Assessments" },
    analytics: { "zh-CN": "数据分析", "zh-TW": "數據分析", en: "Analytics" },
    reports: { "zh-CN": "报告查看", "zh-TW": "報告查看", en: "View Reports" },
    report_export: { "zh-CN": "导出报告", "zh-TW": "匯出報告", en: "Export Reports" },
    question_bank: { "zh-CN": "题库查看", "zh-TW": "題庫查看", en: "Question Bank" },
    question_edit: { "zh-CN": "编辑题目", "zh-TW": "編輯題目", en: "Edit Questions" },
    sso_config: { "zh-CN": "SSO 配置", "zh-TW": "SSO 配置", en: "SSO Config" },
    audit_logs: { "zh-CN": "审计日志", "zh-TW": "審計日誌", en: "Audit Logs" },
    system_settings: { "zh-CN": "系统设置", "zh-TW": "系統設置", en: "System Settings" },
    subscriptions: { "zh-CN": "订阅管理", "zh-TW": "訂閱管理", en: "Subscriptions" },
    consultant_notes: { "zh-CN": "咨询笔记", "zh-TW": "諮詢筆記", en: "Consultant Notes" },
    client_management: { "zh-CN": "客户管理", "zh-TW": "客戶管理", en: "Client Management" },
    report_templates: { "zh-CN": "报告模板", "zh-TW": "報告模板", en: "Report Templates" },
    certification_management: { "zh-CN": "认证管理", "zh-TW": "認證管理", en: "Certification Management" },
    cdu_management: { "zh-CN": "CDU 管理", "zh-TW": "CDU 管理", en: "CDU Management" },
    course_management: { "zh-CN": "课程管理", "zh-TW": "課程管理", en: "Course Management" },
    batch_operations: { "zh-CN": "批量操作", "zh-TW": "批次操作", en: "Batch Operations" },
    cce_export: { "zh-CN": "CCE 导出", "zh-TW": "CCE 匯出", en: "CCE Export" },
    message_monitoring: { "zh-CN": "消息监控", "zh-TW": "訊息監控", en: "Message Monitoring" },
  };
  return labels[module]?.[language] ?? module;
}

// Role description for role management pages
export function getRoleDescription(roleType: RoleType, language: "zh-CN" | "zh-TW" | "en"): string {
  const descriptions: Record<RoleType, Record<string, string>> = {
    super_admin: { "zh-CN": "拥有平台最高权限，可管理所有机构、用户、系统配置和审计日志", "zh-TW": "擁有平台最高權限，可管理所有機構、使用者、系統配置和審計日誌", en: "Full platform access including organizations, users, system config, and audit logs" },
    org_admin: { "zh-CN": "机构最高管理员，可管理机构内所有用户、部门、测评和报告", "zh-TW": "機構最高管理員，可管理機構內所有使用者、部門、測評和報告", en: "Top organization admin managing all users, departments, assessments, and reports within the org" },
    hr: { "zh-CN": "人力资源角色，可创建用户、分配测评、查看分析和导出报告", "zh-TW": "人力資源角色，可建立使用者、分配測評、查看分析和匯出報告", en: "HR role for creating users, assigning assessments, viewing analytics, and exporting reports" },
    department_manager: { "zh-CN": "部门主管，可查看部门成员、测评结果和数据分析", "zh-TW": "部門主管，可查看部門成員、測評結果和數據分析", en: "Department head with access to team members, assessment results, and analytics" },
    employee: { "zh-CN": "普通员工，可参与测评并查看自己的报告", "zh-TW": "普通員工，可參與測評並查看自己的報告", en: "Regular employee who can take assessments and view their own reports" },
    consultant: { "zh-CN": "职业咨询师，可管理客户、分配测评、写咨询笔记和导出报告", "zh-TW": "職業諮詢師，可管理客戶、分配測評、寫諮詢筆記和匯出報告", en: "Career consultant managing clients, assigning assessments, writing notes, and exporting reports" },
    client: { "zh-CN": "咨询客户，可参与测评并查看报告", "zh-TW": "諮詢客戶，可參與測評並查看報告", en: "Consulting client who takes assessments and views reports" },
    individual: { "zh-CN": "个人用户，自主参与测评并查看结果", "zh-TW": "個人使用者，自主參與測評並查看結果", en: "Individual user who takes assessments independently and views their results" },
    partner: { "zh-CN": "产品合作方，可提交产品、查看销售数据和收入报表", "zh-TW": "產品合作方，可提交產品、查看銷售數據和收入報表", en: "Product partner who can submit products, view sales data, and track revenue" },
  };
  return descriptions[roleType]?.[language] ?? "";
}

// Allowed role types for user creation per context
export function getCreatableRoles(creatorRole: RoleType): RoleType[] {
  switch (creatorRole) {
    case "super_admin":
      return ["org_admin", "hr", "department_manager", "employee", "consultant", "client", "individual"];
    case "org_admin":
      return ["hr", "department_manager", "employee"];
    case "hr":
      return ["employee"];
    case "consultant":
      return ["client"];
    default:
      return [];
  }
}
