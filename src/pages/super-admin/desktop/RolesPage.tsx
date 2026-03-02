import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, ChevronRight, Search, ShieldCheck,
  Pencil, X, Save, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import {
  type RoleType,
  type PermissionModule,
  getRoleLabel,
  getRoleDescription,
  getRoleCategory,
  getRoleLevel,
  getPermissions,
  getPermissionLabel,
} from "@/lib/permissions";
import { useAllProfilesWithOrgs } from "@/hooks/useAdminData";

const ALL_ROLES: RoleType[] = [
  "super_admin",
  "org_admin",
  "hr",
  "department_manager",
  "employee",
  "consultant",
  "client",
  "individual",
  "partner",
];

const ALL_PERMISSION_MODULES: PermissionModule[] = [
  "dashboard", "organizations", "departments", "users", "user_create",
  "user_bulk_import", "user_delete", "user_password_reset",
  "assessments", "assessment_assign",
  "analytics", "reports", "report_export", "question_bank", "question_edit",
  "sso_config", "audit_logs", "system_settings", "subscriptions",
  "consultant_notes", "client_management", "report_templates",
  "certification_management", "cdu_management", "course_management",
  "batch_operations", "cce_export", "message_monitoring",
];

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  platform: { "zh-CN": "平台级", "zh-TW": "平台級", en: "Platform" },
  organization: { "zh-CN": "机构级", "zh-TW": "機構級", en: "Organization" },
  consultant: { "zh-CN": "咨询级", "zh-TW": "諮詢級", en: "Consultant" },
  individual: { "zh-CN": "个人级", "zh-TW": "個人級", en: "Individual" },
};

const CATEGORY_COLORS: Record<string, string> = {
  platform: "bg-red-500",
  organization: "bg-blue-500",
  consultant: "bg-emerald-500",
  individual: "bg-slate-500",
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700 border-red-200",
  org_admin: "bg-blue-100 text-blue-700 border-blue-200",
  hr: "bg-sky-100 text-sky-700 border-sky-200",
  department_manager: "bg-indigo-100 text-indigo-700 border-indigo-200",
  employee: "bg-slate-100 text-slate-600 border-slate-200",
  consultant: "bg-emerald-100 text-emerald-700 border-emerald-200",
  client: "bg-teal-100 text-teal-700 border-teal-200",
  individual: "bg-gray-100 text-gray-600 border-gray-200",
  partner: "bg-orange-100 text-orange-700 border-orange-200",
};

interface RoleOverride {
  description?: string;
  permissions?: PermissionModule[];
}

function loadRoleOverrides(): Record<string, RoleOverride> {
  try {
    const stored = localStorage.getItem("scpc_role_overrides");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveRoleOverrides(overrides: Record<string, RoleOverride>) {
  localStorage.setItem("scpc_role_overrides", JSON.stringify(overrides));
}

export default function SuperAdminRolesPage() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { data: allProfiles } = useAllProfilesWithOrgs();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<RoleType | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editPermissions, setEditPermissions] = useState<PermissionModule[]>([]);
  const [roleOverrides, setRoleOverrides] = useState<Record<string, RoleOverride>>(loadRoleOverrides);

  const users = allProfiles || [];

  const userCountByRole = ALL_ROLES.reduce((accumulator, role) => {
    accumulator[role] = users.filter((user) => user.role_type === role).length;
    return accumulator;
  }, {} as Record<string, number>);

  const filteredRoles = ALL_ROLES.filter((role) => {
    const label = getRoleLabel(role, language);
    const matchesSearch = label.toLowerCase().includes(searchQuery.toLowerCase()) || role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || getRoleCategory(role) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["platform", "organization", "consultant", "individual"];

  const handleRoleClick = (role: RoleType) => {
    navigate(`/super-admin/users?role=${role}`);
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
    saveRoleOverrides(newOverrides);
    setEditingRole(null);
    toast.success(language === "en" ? "Role configuration updated" : language === "zh-TW" ? "角色設定已更新" : "角色配置已更新");
  };

  const handleResetRole = () => {
    if (!editingRole) return;
    const newOverrides = { ...roleOverrides };
    delete newOverrides[editingRole];
    setRoleOverrides(newOverrides);
    saveRoleOverrides(newOverrides);
    setEditDescription(getRoleDescription(editingRole, language));
    setEditPermissions([...getPermissions(editingRole)]);
    toast.success(language === "en" ? "Role reset to defaults" : language === "zh-TW" ? "角色已恢復預設設定" : "角色已恢复默认配置");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {language === "en" ? "Role Management" : "角色管理"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === "en"
              ? "Manage system roles, edit permissions and descriptions"
              : language === "zh-TW" ? "管理系統角色，編輯權限和角色描述" : "管理系统角色，编辑权限和角色描述"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {categories.map((category) => {
          const rolesInCategory = ALL_ROLES.filter((role) => getRoleCategory(role) === category);
          const totalUsers = rolesInCategory.reduce((sum, role) => sum + (userCountByRole[role] || 0), 0);
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              className={cn(
                "bg-card border rounded-lg p-4 text-left transition-all hover:shadow-sm",
                selectedCategory === category ? "border-primary ring-2 ring-primary/20" : "border-border"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("w-2.5 h-2.5 rounded-full", CATEGORY_COLORS[category])} />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {CATEGORY_LABELS[category]?.[language] || category}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
              <div className="text-xs text-muted-foreground">
                {language === "en" ? `${rolesInCategory.length} roles` : language === "zh-TW" ? `${rolesInCategory.length} 個角色` : `${rolesInCategory.length} 个角色`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={language === "en" ? "Search roles..." : language === "zh-TW" ? "搜尋角色..." : "搜索角色..."}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
        />
      </div>

      {/* Role Cards */}
      <div className="space-y-4">
        {filteredRoles.map((role, index) => {
          const effectivePermissions = getEffectivePermissions(role);
          const category = getRoleCategory(role);
          const level = getRoleLevel(role);
          const userCount = userCountByRole[role] || 0;
          const isOverridden = !!roleOverrides[role];

          return (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", CATEGORY_COLORS[category])}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{getRoleLabel(role, language)}</h3>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border", ROLE_BADGE_COLORS[role])}>
                          {CATEGORY_LABELS[category]?.[language] || category}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
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
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(role)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-sm font-medium text-primary transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {language === "en" ? "Edit" : language === "zh-TW" ? "編輯" : "编辑"}
                    </button>
                    <button
                      onClick={() => handleRoleClick(role)}
                      className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-lg text-sm font-medium text-foreground transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span>{userCount}</span>
                      <span className="text-muted-foreground">{language === "en" ? "users" : "人"}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Permission Modules */}
                <div className="flex flex-wrap gap-1.5">
                  {effectivePermissions.map((permission) => (
                    <span
                      key={permission}
                      className="text-[11px] px-2 py-1 rounded-md bg-muted/60 text-muted-foreground font-medium"
                    >
                      {getPermissionLabel(permission, language)}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredRoles.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {language === "en" ? "No roles match your search" : language === "zh-TW" ? "沒有匹配的角色" : "没有匹配的角色"}
          </div>
        )}
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
              className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", CATEGORY_COLORS[getRoleCategory(editingRole)])}>
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
                    {language === "en" ? "Role Description" : "角色描述"}
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    placeholder={language === "en" ? "Enter role description..." : language === "zh-TW" ? "輸入角色描述..." : "输入角色描述..."}
                  />
                </div>

                {/* Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-foreground">
                      {language === "en" ? "Permission Modules" : language === "zh-TW" ? "權限模組" : "权限模块"}
                      <span className="text-muted-foreground ml-1">({editPermissions.length}/{ALL_PERMISSION_MODULES.length})</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {ALL_PERMISSION_MODULES.map((module) => {
                      const isActive = editPermissions.includes(module);
                      return (
                        <button
                          key={module}
                          onClick={() => togglePermission(module)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all text-left",
                            isActive
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-muted/10 border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                            isActive ? "bg-primary border-primary" : "border-muted-foreground/30"
                          )}>
                            {isActive && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <span className="truncate">{getPermissionLabel(module, language)}</span>
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
                    {language === "en" ? "Cancel" : "取消"}
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
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
