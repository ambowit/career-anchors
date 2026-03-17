import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ChevronRight, ShieldCheck, Pencil, X, Save, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import {
  type RoleType,
  type PermissionModule,
  getRoleLabel,
  getRoleDescription,
  getRoleLevel,
  getPermissions,
  getPermissionLabel,
} from "@/lib/permissions";
import { useOrgUsers } from "@/hooks/useAdminData";
import { useFeaturePermissions, type FeatureKey } from "@/hooks/useFeaturePermissions";

const ORG_ROLES: RoleType[] = ["org_admin", "hr", "department_manager", "employee"];

const ORG_PERMISSION_MODULES: PermissionModule[] = [
  "dashboard", "departments", "users", "user_create", "user_bulk_import",
  "user_delete", "user_password_reset",
  "assessments", "assessment_assign", "analytics",
  "reports", "report_export", "system_settings",
  "certification_management", "cdu_management",
];

const ROLE_COLORS: Record<string, string> = {
  org_admin: "bg-blue-500",
  hr: "bg-sky-500",
  department_manager: "bg-indigo-500",
  employee: "bg-slate-500",
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  org_admin: "bg-blue-100 text-blue-700 border-blue-200",
  hr: "bg-sky-100 text-sky-700 border-sky-200",
  department_manager: "bg-indigo-100 text-indigo-700 border-indigo-200",
  employee: "bg-slate-100 text-slate-600 border-slate-200",
};

interface RoleOverride {
  description?: string;
  permissions?: PermissionModule[];
}

function loadOrgRoleOverrides(): Record<string, RoleOverride> {
  try {
    const stored = localStorage.getItem("scpc_org_role_overrides");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveOrgRoleOverrides(overrides: Record<string, RoleOverride>) {
  localStorage.setItem("scpc_org_role_overrides", JSON.stringify(overrides));
}

export default function OrgRolesPage() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { data: orgUsers } = useOrgUsers();
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<RoleType | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editPermissions, setEditPermissions] = useState<PermissionModule[]>([]);
  const [roleOverrides, setRoleOverrides] = useState<Record<string, RoleOverride>>(loadOrgRoleOverrides);

  const { hasFeature } = useFeaturePermissions();

  // Map feature keys to the permission modules they gate
  const FEATURE_MODULE_MAP: Record<string, PermissionModule[]> = {
    analytics: ["analytics"],
    report_download: ["reports", "report_export"],
    certification: ["certification_management", "cdu_management"],
  };

  const disabledModules = new Set<PermissionModule>();
  Object.entries(FEATURE_MODULE_MAP).forEach(([featureKey, modules]) => {
    if (!hasFeature(featureKey as FeatureKey)) {
      modules.forEach((m) => disabledModules.add(m));
    }
  });

  const users = orgUsers || [];

  const userCountByRole = ORG_ROLES.reduce((accumulator, role) => {
    accumulator[role] = users.filter((user) => user.role_type === role).length;
    return accumulator;
  }, {} as Record<string, number>);

  const totalUsers = users.length;

  const handleViewUsers = () => {
    navigate("/org/users");
  };

  const getEffectiveDescription = (role: RoleType): string => {
    return roleOverrides[role]?.description || getRoleDescription(role, language);
  };

  const getEffectivePermissions = (role: RoleType): PermissionModule[] => {
    return roleOverrides[role]?.permissions || getPermissions(role);
  };

  const openEditModal = (role: RoleType) => {
    setEditingRole(role);
    setEditDescription(roleOverrides[role]?.description || getRoleDescription(role, language));
    setEditPermissions([...(roleOverrides[role]?.permissions || getPermissions(role))]);
  };

  const togglePermission = (module: PermissionModule) => {
    if (disabledModules.has(module as PermissionModule)) return;
    setEditPermissions((previous) =>
      previous.includes(module)
        ? previous.filter((permissionModule) => permissionModule !== module)
        : [...previous, module]
    );
  };

  const handleSaveEdit = () => {
    if (!editingRole) return;
    const newOverrides = {
      ...roleOverrides,
      [editingRole]: {
        description: editDescription,
        permissions: editPermissions,
      },
    };
    setRoleOverrides(newOverrides);
    saveOrgRoleOverrides(newOverrides);
    setEditingRole(null);
    toast.success(language === "en" ? "Role configuration updated" : language === "zh-TW" ? "角色配置已更新" : "角色配置已更新");
  };

  const handleResetRole = () => {
    if (!editingRole) return;
    const newOverrides = { ...roleOverrides };
    delete newOverrides[editingRole];
    setRoleOverrides(newOverrides);
    saveOrgRoleOverrides(newOverrides);
    setEditDescription(getRoleDescription(editingRole, language));
    setEditPermissions([...getPermissions(editingRole)]);
    toast.success(language === "en" ? "Role reset to defaults" : language === "zh-TW" ? "角色已恢復預設配置" : "角色已恢复默认配置");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {language === "en" ? "Role Management" : language === "zh-TW" ? "角色管理" : "角色管理"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === "en"
              ? "Manage organization roles, edit permissions and descriptions"
              : language === "zh-TW" ? "管理機構角色，編輯權限和角色描述"
              : "管理机构角色，编辑权限和角色描述"}
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Total Members" : language === "zh-TW" ? "總成員數" : "总成员数"}</div>
        </div>
        {ORG_ROLES.map((role) => (
          <div key={role} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("w-2 h-2 rounded-full", ROLE_COLORS[role])} />
              <span className="text-xs font-medium text-muted-foreground">{getRoleLabel(role, language)}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{userCountByRole[role] || 0}</div>
          </div>
        ))}
      </div>

      {/* Role Cards */}
      <div className="space-y-4">
        {ORG_ROLES.map((role, index) => {
          const effectivePermissions = getEffectivePermissions(role);
          const level = getRoleLevel(role);
          const userCount = userCountByRole[role] || 0;
          const isExpanded = expandedRole === role;
          const isOverridden = !!roleOverrides[role];

          return (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => setExpandedRole(isExpanded ? null : role)}
                    className="flex items-center gap-3 text-left flex-1"
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", ROLE_COLORS[role])}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{getRoleLabel(role, language)}</h3>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border", ROLE_BADGE_COLORS[role])}>
                          Lv.{level}
                        </span>
                        {isOverridden && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                            {language === "en" ? "Customized" : language === "zh-TW" ? "已自訂" : "已自定义"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getEffectiveDescription(role)}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={() => openEditModal(role)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 rounded-lg text-sm font-medium text-sky-600 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {language === "en" ? "Edit" : language === "zh-TW" ? "編輯" : "编辑"}
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">{userCount}</div>
                        <div className="text-[11px] text-muted-foreground">{language === "en" ? "users" : language === "zh-TW" ? "人" : "人"}</div>
                      </div>
                      <ChevronRight className={cn("w-5 h-5 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Permission Details */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border"
                >
                  <div className="p-5 bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-foreground">
                        {language === "en" ? "Permission Modules" : language === "zh-TW" ? "權限模組" : "权限模块"}
                        <span className="text-muted-foreground ml-1">({effectivePermissions.length})</span>
                      </h4>
                      <button
                        onClick={handleViewUsers}
                        className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {language === "en" ? "View Users" : language === "zh-TW" ? "查看用戶" : "查看用户"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {effectivePermissions.map((permission) => (
                        <span
                          key={permission}
                          className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border text-foreground font-medium"
                        >
                          {getPermissionLabel(permission, language)}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {editingRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
            onClick={() => setEditingRole(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", ROLE_COLORS[editingRole])}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {language === "en" ? "Edit Role: " : language === "zh-TW" ? "編輯角色: " : "编辑角色: "}
                      {getRoleLabel(editingRole, language)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {language === "en" ? "Modify description and permission modules" : language === "zh-TW" ? "修改角色描述和權限模組" : "修改角色描述和权限模块"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setEditingRole(null)} className="p-2 hover:bg-muted/20 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                {/* Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {language === "en" ? "Role Description" : language === "zh-TW" ? "角色描述" : "角色描述"}
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-none"
                    placeholder={language === "en" ? "Enter role description..." : language === "zh-TW" ? "輸入角色描述..." : "输入角色描述..."}
                  />
                </div>

                {/* Permissions */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    {language === "en" ? "Permission Modules" : language === "zh-TW" ? "權限模組" : "权限模块"}
                    <span className="text-muted-foreground ml-1">({editPermissions.length}/{ORG_PERMISSION_MODULES.length})</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ORG_PERMISSION_MODULES.map((module) => {
                      const isActive = editPermissions.includes(module);
                      const isDisabled = disabledModules.has(module as PermissionModule);
                      return (
                        <button
                          key={module}
                          onClick={() => togglePermission(module)}
                          disabled={isDisabled}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all text-left",
                            isDisabled
                              ? "opacity-40 cursor-not-allowed bg-muted/5 border-border text-muted-foreground"
                              : isActive
                                ? "bg-sky-500/10 border-sky-500/30 text-sky-600"
                                : "bg-muted/10 border-border text-muted-foreground hover:border-sky-500/20 hover:text-foreground"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                            isDisabled
                              ? "border-muted-foreground/20 bg-muted/30"
                              : isActive ? "bg-sky-500 border-sky-500" : "border-muted-foreground/30"
                          )}>
                            {isActive && !isDisabled && <Check className="w-3 h-3 text-white" />}
                            {isDisabled && <X className="w-3 h-3 text-muted-foreground/50" />}
                          </div>
                          <span className="truncate">{getPermissionLabel(module, language)}</span>
                          {isDisabled && (
                            <span className="ml-auto text-[10px] text-muted-foreground/60 whitespace-nowrap">
                              {language === "en" ? "N/A" : language === "zh-TW" ? "未授權" : "未授权"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/5">
                <button
                  onClick={handleResetRole}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {language === "en" ? "Reset to Defaults" : language === "zh-TW" ? "恢復預設" : "恢复默认"}
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingRole(null)}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-2 px-5 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {language === "en" ? "Save Changes" : language === "zh-TW" ? "儲存修改" : "保存修改"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
