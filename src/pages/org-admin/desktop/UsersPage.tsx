import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Upload, Download, CheckCircle2, Clock, XCircle,
  Edit, Trash2, X, FileSpreadsheet, Loader2, Save, AlertTriangle, ShieldAlert, KeyRound, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import { getRoleLabel, type RoleType } from "@/lib/permissions";
import { toast } from "sonner";
import { useOrgUsers, useOrgDepartments, useOrgSeatInfo, useUpdateProfile, useDeleteProfile, useAddRole, useRemoveRole, useOrganizationsWithCounts, type AdditionalRole } from "@/hooks/useAdminData";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type ModalMode = "add" | "edit" | "delete" | "import" | null;

interface ImportResult {
  email: string;
  success: boolean;
  error?: string;
}

export default function OrgUsersPage() {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const { organizationId } = usePermissions();
  const { data: users, isLoading } = useOrgUsers();
  const { data: depts } = useOrgDepartments();
  const { data: seatInfo } = useOrgSeatInfo();
  const updateMutation = useUpdateProfile();
  const deleteMutation = useDeleteProfile();
  const addRoleMutation = useAddRole();
  const removeRoleMutation = useRemoveRole();
  const { data: allOrgs } = useOrganizationsWithCounts();
  const allOrganizations = allOrgs || [];
  const [saveMode, setSaveMode] = useState<"replace" | "add" | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "employee", departmentId: "", phone: "" });
  const [editingUser, setEditingUser] = useState<{ id: string; full_name: string; role_type: string; department_id: string; organization_id: string | null; status: string } | null>(null);
  const [deletingUser, setDeletingUser] = useState<{ id: string; full_name: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Batch import state
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [importRoleType, setImportRoleType] = useState("employee");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password reset state
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showResetSection, setShowResetSection] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const orgRoles: RoleType[] = ["hr", "department_manager", "employee"];
  const departments = depts || [];

  const statusConfig = {
    active: { label: language === "en" ? "Active" : language === "zh-TW" ? "活躍" : "活跃", icon: CheckCircle2, color: "text-green-600" },
    invited: { label: language === "en" ? "Invited" : language === "zh-TW" ? "已邀請" : "已邀请", icon: Clock, color: "text-amber-600" },
    suspended: { label: language === "en" ? "Suspended" : language === "zh-TW" ? "已暫停" : "已暂停", icon: XCircle, color: "text-red-600" },
    deactivated: { label: language === "en" ? "Deactivated" : language === "zh-TW" ? "已停用" : "已停用", icon: XCircle, color: "text-red-600" },
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const allUsers = users || [];
  const filtered = allUsers.filter((user) => {
    const matchesSearch = (user.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (user.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !selectedRole || user.role_type === selectedRole;
    return matchesSearch && matchesRole;
  });

  const isAtSeatLimit = seatInfo?.isAtLimit ?? false;

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error(language === "en" ? "Name and email required" : language === "zh-TW" ? "姓名和信箱為必填" : "姓名和邮箱为必填");
      return;
    }

    setIsCreating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: newUser.email,
          password: "scpc2026",
          full_name: newUser.name,
          role_type: newUser.role,
          organization_id: organizationId,
          department_id: newUser.departmentId || null,
          phone: newUser.phone || "",
        },
      });

      if (error || !result?.success) {
        const isSeatError = result?.error === "seat_limit_exceeded";
        const errorMsg = isSeatError
          ? (language === "en" ? result?.message_en : result?.message)
          : (result?.results?.[0]?.error || error?.message || "Unknown error");
        toast.error(errorMsg);
      } else {
        toast.success(language === "en" ? "User created (password: scpc2026)" : language === "zh-TW" ? "使用者已建立（預設密碼: scpc2026）" : "用户已创建（默认密码: scpc2026）");
        setModalMode(null);
        setNewUser({ name: "", email: "", role: "employee", departmentId: "", phone: "" });
        queryClient.invalidateQueries({ queryKey: ["org"] });
      }
    } catch {
      toast.error(language === "en" ? "Failed to create user" : language === "zh-TW" ? "建立使用者失敗" : "创建用户失败");
    } finally {
      setIsCreating(false);
    }
  };

  const handleReplaceRole = async () => {
    if (!editingUser) return;
    setSaveMode("replace");
    try {
      await updateMutation.mutateAsync({
        id: editingUser.id,
        role_type: editingUser.role_type,
        department_id: editingUser.department_id || null,
        status: editingUser.status,
      });
      toast.success(language === "en" ? "Primary role replaced" : language === "zh-TW" ? "主角色已替換" : "主角色已替换");
      setEditingUser(null);
      setModalMode(null);
    } finally {
      setSaveMode(null);
    }
  };

  const handleAddRole = async () => {
    if (!editingUser) return;
    setSaveMode("add");
    try {
      const orgName = allOrganizations.find((o) => o.id === (editingUser as any).organization_id)?.name || null;
      await addRoleMutation.mutateAsync({
        userId: editingUser.id,
        newRole: {
          role_type: editingUser.role_type,
          organization_id: (editingUser as any).organization_id || organizationId || null,
          organization_name: orgName || undefined,
          department_id: editingUser.department_id || null,
        },
      });
      toast.success(language === "en" ? "Role added" : language === "zh-TW" ? "角色已新增" : "角色已添加");
      setEditingUser(null);
      setModalMode(null);
    } catch (error: any) {
      if (error?.message === "DUPLICATE_ROLE") {
        toast.error(language === "en" ? "This role already exists for this user" : language === "zh-TW" ? "該使用者已擁有此角色" : "该用户已拥有此角色");
      } else {
        toast.error(language === "en" ? "Failed to add role" : language === "zh-TW" ? "新增角色失敗" : "添加角色失败");
      }
    } finally {
      setSaveMode(null);
    }
  };

  const handleRemoveAdditionalRole = async (userId: string, roleIndex: number) => {
    try {
      await removeRoleMutation.mutateAsync({ userId, roleIndex });
      toast.success(language === "en" ? "Role removed" : language === "zh-TW" ? "角色已移除" : "角色已移除");
    } catch {
      toast.error(language === "en" ? "Failed to remove role" : language === "zh-TW" ? "移除角色失敗" : "移除角色失败");
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!resetPasswordForm.newPassword || !resetPasswordForm.confirmPassword) {
      toast.error(language === "en" ? "Please fill in both password fields" : language === "zh-TW" ? "請填寫兩個密碼欄位" : "请填写两个密码字段");
      return;
    }
    if (resetPasswordForm.newPassword.length < 6) {
      toast.error(language === "en" ? "Password must be at least 6 characters" : language === "zh-TW" ? "密碼長度至少6位" : "密码长度至少6位");
      return;
    }
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      toast.error(language === "en" ? "Passwords do not match" : language === "zh-TW" ? "兩次輸入的密碼不一致" : "两次输入的密码不一致");
      return;
    }
    setIsResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: { user_id: userId, new_password: resetPasswordForm.newPassword },
      });
      if (error || !data?.success) {
        toast.error(data?.error || (language === "en" ? "Failed to reset password" : language === "zh-TW" ? "密碼重置失敗" : "密码重置失败"));
      } else {
        toast.success(language === "en" ? "Password reset successfully" : language === "zh-TW" ? "密碼已重置" : "密码已重置");
        setResetPasswordForm({ newPassword: "", confirmPassword: "" });
        setShowResetSection(false);
      }
    } catch {
      toast.error(language === "en" ? "Failed to reset password" : language === "zh-TW" ? "密碼重置失敗" : "密码重置失败");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    await deleteMutation.mutateAsync(deletingUser.id);
    toast.success(language === "en" ? "User deleted" : language === "zh-TW" ? "使用者已刪除" : "用户已删除");
    setDeletingUser(null);
    setModalMode(null);
    queryClient.invalidateQueries({ queryKey: ["org"] });
  };

  // Parse CSV/text for batch import
  const parseImportText = (text: string): Array<{ email: string; full_name: string; phone?: string }> => {
    const lines = text.trim().split("\n").filter((line) => line.trim());
    const results: Array<{ email: string; full_name: string; phone?: string }> = [];
    for (const line of lines) {
      const parts = line.includes(",") ? line.split(",") : line.split("\t");
      const trimmed = parts.map((p) => p.trim());
      if (trimmed.length >= 2 && trimmed[0] && trimmed[1]) {
        results.push({ email: trimmed[0], full_name: trimmed[1], phone: trimmed[2] || undefined });
      }
    }
    return results;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImportText(e.target?.result as string);
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBatchImport = async () => {
    const parsedUsers = parseImportText(importText);
    if (parsedUsers.length === 0) {
      toast.error(language === "en" ? "No valid users found" : language === "zh-TW" ? "未找到有效的使用者資料" : "未找到有效的用户数据");
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      const usersPayload = parsedUsers.map((userRow) => ({
        email: userRow.email,
        password: "scpc2026",
        full_name: userRow.full_name,
        role_type: importRoleType,
        organization_id: organizationId,
        phone: userRow.phone || "",
      }));

      const { data: result, error } = await supabase.functions.invoke("create-user", {
        body: { users: usersPayload },
      });

      if (error) {
        toast.error(language === "en" ? `Import failed: ${error.message}` : language === "zh-TW" ? `匯入失敗: ${error.message}` : `导入失败: ${error.message}`);
      } else if (result?.error === "seat_limit_exceeded") {
        toast.error(language === "en" ? result?.message_en : result?.message);
      } else {
        setImportResults(result.results || []);
        const successCount = result.created || 0;
        const failCount = result.failed || 0;
        if (failCount === 0) {
          toast.success(language === "en" ? `Imported ${successCount} users` : language === "zh-TW" ? `成功匯入 ${successCount} 位使用者` : `成功导入 ${successCount} 个用户`);
        } else {
          toast.warning(language === "en" ? `Imported ${successCount}, failed ${failCount}` : language === "zh-TW" ? `成功 ${successCount} 位，失敗 ${failCount} 位` : `成功 ${successCount} 个，失败 ${failCount} 个`);
        }
        queryClient.invalidateQueries({ queryKey: ["org"] });
      }
    } catch {
      toast.error(language === "en" ? "Import failed" : language === "zh-TW" ? "匯入失敗" : "导入失败");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = language === "en"
      ? "Email,Name,Phone(optional)\nzhangsan@example.com,Zhang San,13800138000\nlisi@example.com,Li Si,"
      : language === "zh-TW"
        ? "信箱,姓名,手機號(選填)\nzhangsan@example.com,張三,13800138000\nlisi@example.com,李四,"
        : "邮箱,姓名,手机号(选填)\nzhangsan@example.com,张三,13800138000\nlisi@example.com,李四,";
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = language === "en" ? "user-import-template.csv" : language === "zh-TW" ? "使用者匯入範本.csv" : "用户导入模板.csv";
    link.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "User Management" : language === "zh-TW" ? "使用者管理" : "用户管理"}</h1>
          <p className="text-sm text-muted-foreground">{language === "en" ? "Create, import, and manage organization members" : language === "zh-TW" ? "建立、匯入和管理機構成員" : "创建、导入和管理机构成员"}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setModalMode("import"); setImportText(""); setImportResults(null); }} className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">
            <Upload className="w-4 h-4" /> {language === "en" ? "Batch Import" : language === "zh-TW" ? "批次匯入" : "批量导入"}
          </button>
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">
            <Download className="w-4 h-4" /> {language === "en" ? "Export" : language === "zh-TW" ? "匯出" : "导出"}
          </button>
          <button onClick={() => setModalMode("add")} className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> {language === "en" ? "Add User" : language === "zh-TW" ? "新增使用者" : "新增用户"}
          </button>
        </div>
      </div>

      {/* Seat Info Banner */}
      {seatInfo && (
        <div className={cn(
          "flex items-center justify-between px-5 py-3 rounded-xl mb-6 border",
          seatInfo.isAtLimit
            ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
            : "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800"
        )}>
          <div className="flex items-center gap-3">
            {seatInfo.isAtLimit ? (
              <ShieldAlert className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-sky-500" />
            )}
            <div>
              <p className={cn("text-sm font-medium", seatInfo.isAtLimit ? "text-red-700 dark:text-red-400" : "text-sky-700 dark:text-sky-400")}>
                {language === "en"
                  ? `Seats: ${seatInfo.currentUsers} / ${seatInfo.maxSeats} used`
                  : language === "zh-TW" ? `席位使用：${seatInfo.currentUsers} / ${seatInfo.maxSeats}`
                  : `席位使用：${seatInfo.currentUsers} / ${seatInfo.maxSeats}`}
              </p>
              {seatInfo.isAtLimit ? (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {language === "en"
                    ? "Seat limit reached. Please purchase more seats to add users."
                    : language === "zh-TW" ? "席位已滿，請購買更多席位後再新增使用者。"
                    : "席位已满，请购买更多席位后再添加用户。"}
                </p>
              ) : (
                <p className="text-xs text-sky-600 dark:text-sky-400">
                  {language === "en"
                    ? `${seatInfo.remaining} seat(s) remaining`
                    : language === "zh-TW" ? `剩餘 ${seatInfo.remaining} 個席位`
                    : `剩余 ${seatInfo.remaining} 个席位`}
                </p>
              )}
            </div>
          </div>
          <div className="w-32 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                seatInfo.isAtLimit ? "bg-red-500" : seatInfo.remaining <= 3 ? "bg-amber-500" : "bg-sky-500"
              )}
              style={{ width: `${Math.min((seatInfo.currentUsers / seatInfo.maxSeats) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder={language === "en" ? "Search name or email..." : language === "zh-TW" ? "搜尋姓名或信箱..." : "搜索姓名或邮箱..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSelectedRole(null)} className={cn("px-3 py-2 rounded-lg text-sm font-medium", !selectedRole ? "bg-sky-500 text-white" : "bg-card border border-border text-muted-foreground")}>{language === "en" ? "All" : language === "zh-TW" ? "全部" : "全部"}</button>
          {orgRoles.map((role) => (
            <button key={role} onClick={() => setSelectedRole(role)} className={cn("px-3 py-2 rounded-lg text-sm font-medium", selectedRole === role ? "bg-sky-500 text-white" : "bg-card border border-border text-muted-foreground")}>{getRoleLabel(role, language)}</button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-muted/30">
            <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "User" : language === "zh-TW" ? "使用者" : "用户"}</th>
            <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Role" : language === "zh-TW" ? "角色" : "角色"}</th>
            <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Department" : language === "zh-TW" ? "部門" : "部门"}</th>
            <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Assessments" : language === "zh-TW" ? "測評數" : "测评数"}</th>
            <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Status" : language === "zh-TW" ? "狀態" : "状态"}</th>
            <th className="text-right px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Actions" : language === "zh-TW" ? "操作" : "操作"}</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">{language === "en" ? "No users found" : language === "zh-TW" ? "暫無使用者資料" : "暂无用户数据"}</td></tr>
            ) : filtered.map((user) => {
              const userStatus = (user.status as keyof typeof statusConfig) || "active";
              const status = statusConfig[userStatus] || statusConfig.active;
              const StatusIcon = status.icon;
              const displayName = user.full_name || user.email || "—";
              return (
                <tr key={user.id} className="hover:bg-muted/10">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-500/15 flex items-center justify-center text-xs font-medium text-sky-600">{displayName.charAt(0)}</div>
                      <div><div className="text-sm font-medium text-foreground">{displayName}</div><div className="text-xs text-muted-foreground">{user.email}</div></div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-100 text-sky-700">{getRoleLabel(user.role_type as RoleType, language)}</span>
                      {Array.isArray(user.additional_roles) && (user.additional_roles as AdditionalRole[]).length > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-violet-100 text-violet-700" title={(user.additional_roles as AdditionalRole[]).map((r: AdditionalRole) => `${getRoleLabel(r.role_type as RoleType, language)}${r.organization_name ? ` @ ${r.organization_name}` : ""}`).join(", ")}>
                          +{(user.additional_roles as AdditionalRole[]).length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{user.departmentName || "—"}</td>
                  <td className="px-5 py-4 text-sm text-foreground">{user.assessmentCount || 0}</td>
                  <td className="px-5 py-4"><span className={cn("flex items-center gap-1 text-xs font-medium", status.color)}><StatusIcon className="w-3.5 h-3.5" /> {status.label}</span></td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditingUser({ id: user.id, full_name: user.full_name || "", role_type: user.role_type || "employee", department_id: user.department_id || "", organization_id: user.organization_id || organizationId || null, status: user.status || "active" }); setModalMode("edit"); }} className="p-1.5 hover:bg-muted/20 rounded-lg"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => { setDeletingUser({ id: user.id, full_name: user.full_name || user.email || "" }); setModalMode("delete"); }} className="p-1.5 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Add User Modal */}
      <AnimatePresence>
        {modalMode === "add" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{language === "en" ? "Create User" : language === "zh-TW" ? "建立使用者" : "创建用户"}</h2>
                <button onClick={() => setModalMode(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              {isAtSeatLimit && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">
                    {language === "en"
                      ? `Seat limit reached (${seatInfo?.currentUsers}/${seatInfo?.maxSeats}). Cannot create new users. Please contact your administrator to purchase more seats.`
                      : language === "zh-TW" ? `席位已滿（${seatInfo?.currentUsers}/${seatInfo?.maxSeats}），無法建立新使用者。請聯繫管理員購買更多席位。`
                      : `席位已满（${seatInfo?.currentUsers}/${seatInfo?.maxSeats}），无法创建新用户。请联系管理员购买更多席位。`}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Full Name" : language === "zh-TW" ? "姓名" : "姓名"} *</label>
                  <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20" disabled={isAtSeatLimit} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Email" : language === "zh-TW" ? "信箱" : "邮箱"} *</label>
                  <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20" disabled={isAtSeatLimit} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Role" : language === "zh-TW" ? "角色" : "角色"} *</label>
                    <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm" disabled={isAtSeatLimit}>
                      {orgRoles.map((role) => <option key={role} value={role}>{getRoleLabel(role, language)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Department" : language === "zh-TW" ? "部門" : "部门"}</label>
                    <select value={newUser.departmentId} onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm" disabled={isAtSeatLimit}>
                      <option value="">{language === "en" ? "None" : language === "zh-TW" ? "無" : "无"}</option>
                      {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Phone" : language === "zh-TW" ? "手機號" : "手机号"}</label>
                  <input type="tel" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm" disabled={isAtSeatLimit} />
                </div>
                {!isAtSeatLimit && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-700">
                      {language === "en"
                        ? "Default password: scpc2026. Users can change it after first login."
                        : language === "zh-TW" ? "預設密碼：scpc2026，使用者首次登入後可修改。"
                        : "默认密码：scpc2026，用户首次登录后可修改。"}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground">{language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}</button>
                <button onClick={handleAddUser} disabled={isCreating || isAtSeatLimit} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-lg disabled:opacity-50">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isCreating ? (language === "en" ? "Creating..." : language === "zh-TW" ? "建立中..." : "创建中...") : (language === "en" ? "Create" : language === "zh-TW" ? "建立" : "创建")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {modalMode === "edit" && editingUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{language === "en" ? "Edit User" : language === "zh-TW" ? "編輯使用者" : "编辑用户"}: {editingUser.full_name}</h2>
                <button onClick={() => setModalMode(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              {/* Current Additional Roles */}
              {(() => {
                const userData = allUsers.find((u) => u.id === editingUser.id);
                const additionalRoles = (userData?.additional_roles as AdditionalRole[]) || [];
                if (additionalRoles.length === 0) return null;
                return (
                  <div className="mb-5">
                    <label className="block text-sm font-medium mb-2">{language === "en" ? "Additional Roles" : language === "zh-TW" ? "已有角色" : "已有角色"}</label>
                    <div className="space-y-2">
                      {additionalRoles.map((additionalRole, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted/30 border border-border rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-100 text-sky-700">
                              {getRoleLabel(additionalRole.role_type as RoleType, language)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {additionalRole.organization_name || allOrganizations.find((o) => o.id === additionalRole.organization_id)?.name || (language === "en" ? "No org" : language === "zh-TW" ? "無機構" : "无机构")}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveAdditionalRole(editingUser.id, index)}
                            className="p-1 hover:bg-destructive/10 rounded"
                            title={language === "en" ? "Remove" : language === "zh-TW" ? "移除" : "移除"}
                          >
                            <X className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Role" : language === "zh-TW" ? "角色" : "角色"}</label>
                  <select value={editingUser.role_type} onChange={(e) => setEditingUser({ ...editingUser, role_type: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm">
                    {orgRoles.map((r) => <option key={r} value={r}>{getRoleLabel(r, language)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Organization" : language === "zh-TW" ? "所屬機構" : "所属机构"}</label>
                  <select value={(editingUser as any).organization_id || organizationId || ""} onChange={(e) => setEditingUser({ ...editingUser, organization_id: e.target.value || organizationId || "" } as any)} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm">
                    {allOrganizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Department" : language === "zh-TW" ? "部門" : "部门"}</label>
                  <select value={editingUser.department_id} onChange={(e) => setEditingUser({ ...editingUser, department_id: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm">
                    <option value="">{language === "en" ? "None" : language === "zh-TW" ? "無" : "无"}</option>
                    {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Status" : language === "zh-TW" ? "狀態" : "状态"}</label>
                  <select value={editingUser.status} onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm">
                    <option value="active">{language === "en" ? "Active" : language === "zh-TW" ? "活躍" : "活跃"}</option>
                    <option value="invited">{language === "en" ? "Invited" : language === "zh-TW" ? "已邀請" : "已邀请"}</option>
                    <option value="suspended">{language === "en" ? "Suspended" : language === "zh-TW" ? "已暫停" : "已暂停"}</option>
                  </select>
                </div>
              </div>

              {/* Replace/Add explanation */}
              <div className="mt-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  {language === "en"
                    ? "'Replace' overwrites the primary role. 'Add' keeps the current primary and adds a new role."
                    : language === "zh-TW" ? "「替換」會覆蓋當前主角色。「新增」保留當前主角色，新增一個額外角色。"
                    : "「替换」会覆盖当前主角色。「添加」保留当前主角色，新增一个额外角色。"}
                </p>
              </div>

              {/* Password Reset Section */}
              <div className="mt-5 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetSection(!showResetSection);
                    if (!showResetSection) setResetPasswordForm({ newPassword: "", confirmPassword: "" });
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                  {language === "en" ? "Reset Password" : language === "zh-TW" ? "重置密碼" : "重置密码"}
                </button>
                {showResetSection && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{language === "en" ? "New Password" : language === "zh-TW" ? "新密碼" : "新密码"}</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={resetPasswordForm.newPassword}
                          onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                          placeholder={language === "en" ? "At least 6 characters" : language === "zh-TW" ? "至少6位字元" : "至少6位字符"}
                          className="w-full px-3 py-2.5 pr-10 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Confirm Password" : language === "zh-TW" ? "確認密碼" : "确认密码"}</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={resetPasswordForm.confirmPassword}
                          onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                          placeholder={language === "en" ? "Re-enter new password" : language === "zh-TW" ? "再次輸入新密碼" : "再次输入新密码"}
                          className="w-full px-3 py-2.5 pr-10 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {resetPasswordForm.newPassword && resetPasswordForm.confirmPassword && resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {language === "en" ? "Passwords do not match" : language === "zh-TW" ? "兩次輸入的密碼不一致" : "两次输入的密码不一致"}
                      </p>
                    )}
                    <button
                      onClick={() => handleResetPassword(editingUser.id)}
                      disabled={isResettingPassword || !resetPasswordForm.newPassword || !resetPasswordForm.confirmPassword || resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {isResettingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                      {isResettingPassword ? (language === "en" ? "Resetting..." : language === "zh-TW" ? "重置中..." : "重置中...") : (language === "en" ? "Reset Password" : language === "zh-TW" ? "重置密碼" : "重置密码")}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground">{language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}</button>
                <button onClick={handleAddRole} disabled={saveMode !== null} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50">
                  {saveMode === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saveMode === "add" ? (language === "en" ? "Adding..." : language === "zh-TW" ? "新增中..." : "添加中...") : (language === "en" ? "Add" : language === "zh-TW" ? "新增" : "添加")}
                </button>
                <button onClick={handleReplaceRole} disabled={saveMode !== null} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-lg disabled:opacity-50">
                  {saveMode === "replace" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saveMode === "replace" ? (language === "en" ? "Replacing..." : language === "zh-TW" ? "替換中..." : "替换中...") : (language === "en" ? "Replace" : language === "zh-TW" ? "替換" : "替换")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {modalMode === "delete" && deletingUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></div>
                <h2 className="text-lg font-semibold text-foreground">{language === "en" ? "Delete User" : language === "zh-TW" ? "刪除使用者" : "删除用户"}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {language === "en" ? `Are you sure you want to permanently delete "${deletingUser.full_name}"?` : language === "zh-TW" ? `確定要永久刪除「${deletingUser.full_name}」嗎？` : `确定要永久删除「${deletingUser.full_name}」吗？`}
              </p>
              <p className="text-xs text-destructive mb-6">
                {language === "en" ? "This action cannot be undone. All associated data will be removed." : language === "zh-TW" ? "此操作不可撤銷，該使用者的所有關聯資料將被移除。" : "此操作不可撤销，该用户的所有关联数据将被移除。"}
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground">{language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}</button>
                <button onClick={handleDeleteUser} disabled={deleteMutation.isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50">
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleteMutation.isPending ? (language === "en" ? "Deleting..." : language === "zh-TW" ? "刪除中..." : "删除中...") : (language === "en" ? "Delete" : language === "zh-TW" ? "刪除" : "删除")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch Import Modal */}
      <AnimatePresence>
        {modalMode === "import" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{language === "en" ? "Batch Import Users" : language === "zh-TW" ? "批次匯入使用者" : "批量导入用户"}</h2>
                <button onClick={() => setModalMode(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              {isAtSeatLimit && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">
                    {language === "en"
                      ? `Seat limit reached (${seatInfo?.currentUsers}/${seatInfo?.maxSeats}). Cannot import users. Please contact your administrator to purchase more seats.`
                      : language === "zh-TW" ? `席位已滿（${seatInfo?.currentUsers}/${seatInfo?.maxSeats}），無法匯入使用者。請聯繫管理員購買更多席位。`
                      : `席位已满（${seatInfo?.currentUsers}/${seatInfo?.maxSeats}），无法导入用户。请联系管理员购买更多席位。`}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Default Role" : language === "zh-TW" ? "預設角色" : "默认角色"}</label>
                  <select value={importRoleType} onChange={(e) => setImportRoleType(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm" disabled={isAtSeatLimit}>
                    {orgRoles.map((r) => <option key={r} value={r}>{getRoleLabel(r, language)}</option>)}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium">{language === "en" ? "User Data" : language === "zh-TW" ? "使用者資料" : "用户数据"}</label>
                    <div className="flex items-center gap-2">
                      <button onClick={handleDownloadTemplate} className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-600">
                        <FileSpreadsheet className="w-3.5 h-3.5" /> {language === "en" ? "Template" : language === "zh-TW" ? "下載範本" : "下载模板"}
                      </button>
                      <label className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        {language === "en" ? "Upload CSV" : language === "zh-TW" ? "上傳CSV" : "上传CSV"}
                        <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>
                  </div>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={language === "en"
                      ? "Format: email,name,phone(optional)\nzhangsan@example.com,Zhang San,13800138000"
                      : language === "zh-TW" ? "格式：信箱,姓名,手機號(選填)\nzhangsan@example.com,張三,13800138000"
                      : "格式：邮箱,姓名,手机号(选填)\nzhangsan@example.com,张三,13800138000"}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 min-h-[120px] font-mono"
                    disabled={isAtSeatLimit}
                  />
                  {importText && (() => {
                    const parsedCount = parseImportText(importText).length;
                    const wouldExceed = seatInfo ? parsedCount > seatInfo.remaining : false;
                    return (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                          {language === "en" ? `${parsedCount} valid users detected` : language === "zh-TW" ? `偵測到 ${parsedCount} 位有效使用者` : `检测到 ${parsedCount} 个有效用户`}
                        </p>
                        {wouldExceed && (
                          <p className="text-xs text-red-500">
                            {language === "en"
                              ? `Exceeds remaining seats (${seatInfo?.remaining})`
                              : language === "zh-TW" ? `超出剩餘席位 (${seatInfo?.remaining})`
                              : `超出剩余席位 (${seatInfo?.remaining})`}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-700">
                    {language === "en"
                      ? "All imported users will have default password: scpc2026"
                      : language === "zh-TW" ? "所有匯入使用者的預設密碼為：scpc2026"
                      : "所有导入用户的默认密码为：scpc2026"}
                  </p>
                </div>

                {/* Import Results */}
                {importResults && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">
                      {language === "en" ? "Import Results" : language === "zh-TW" ? "匯入結果" : "导入结果"}
                    </div>
                    <div className="max-h-[200px] overflow-y-auto divide-y divide-border">
                      {importResults.map((result, index) => (
                        <div key={index} className="flex items-center justify-between px-3 py-2">
                          <span className="text-sm text-foreground truncate flex-1">{result.email}</span>
                          {result.success ? (
                            <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> {language === "en" ? "Success" : language === "zh-TW" ? "成功" : "成功"}</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-500 max-w-[200px] truncate" title={result.error}><XCircle className="w-3.5 h-3.5 flex-shrink-0" /> {result.error}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground">{language === "en" ? "Close" : language === "zh-TW" ? "關閉" : "关闭"}</button>
                <button onClick={handleBatchImport} disabled={isImporting || !importText.trim() || isAtSeatLimit} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-lg disabled:opacity-50">
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isImporting ? (language === "en" ? "Importing..." : language === "zh-TW" ? "匯入中..." : "导入中...") : (language === "en" ? "Start Import" : language === "zh-TW" ? "開始匯入" : "开始导入")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
