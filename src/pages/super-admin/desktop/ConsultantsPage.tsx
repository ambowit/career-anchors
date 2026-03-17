import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, UserCog, Eye, ShieldCheck, Loader2, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import { useConsultants, useOrganizationsWithCounts } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type ModalMode = "add" | "view" | null;

interface CreateConsultantForm {
  fullName: string;
  email: string;
  phone: string;
  organizationId: string;
}

const FEATURE_KEYS = [
  { key: "career_anchor", labelEn: "Career Anchor", labelZhTw: "職業錨測評", labelZhCn: "职业锚测评" },
  { key: "ideal_card", labelEn: "Espresso Card", labelZhTw: "理想人生卡", labelZhCn: "理想人生卡" },
  { key: "combined", labelEn: "Integration Assessment", labelZhTw: "整合測評", labelZhCn: "整合测评" },
  { key: "report_download", labelEn: "Report Download", labelZhTw: "報告下載", labelZhCn: "报告下载" },
  { key: "analytics", labelEn: "Analytics", labelZhTw: "資料分析", labelZhCn: "数据分析" },
  { key: "client_management", labelEn: "Client Management", labelZhTw: "客戶管理", labelZhCn: "客户管理" },
  { key: "consultant_notes", labelEn: "Consultant Notes", labelZhTw: "諮詢筆記", labelZhCn: "咨询笔记" },
  { key: "trend_analysis", labelEn: "Trend Analysis", labelZhTw: "趨勢分析", labelZhCn: "趋势分析" },
  { key: "certification", labelEn: "Certification", labelZhTw: "認證管理", labelZhCn: "认证管理" },
  { key: "cdu_records", labelEn: "CDU Records", labelZhTw: "CDU 記錄", labelZhCn: "CDU 记录" },
  { key: "message", labelEn: "Messaging", labelZhTw: "訊息功能", labelZhCn: "消息功能" },
] as const;

export default function ConsultantsPage() {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: consultants, isLoading } = useConsultants();
  const { data: orgs } = useOrganizationsWithCounts();
  const organizations = orgs || [];

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [createForm, setCreateForm] = useState<CreateConsultantForm>({
    fullName: "", email: "", phone: "", organizationId: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [viewingConsultant, setViewingConsultant] = useState<any>(null);

  // Permission editing state
  const [permEditingConsultant, setPermEditingConsultant] = useState<any>(null);
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [permFormData, setPermFormData] = useState<Record<string, boolean>>({});
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  const dataList = consultants || [];

  const filtered = dataList.filter((consultant) =>
    (consultant.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (consultant.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateConsultant = async () => {
    if (!createForm.fullName || !createForm.email) {
      toast.error(language === "en" ? "Name and email are required" : language === "zh-TW" ? "姓名和信箱為必填" : "姓名和邮箱为必填");
      return;
    }
    setIsCreating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: createForm.email,
          password: "scpc2026",
          full_name: createForm.fullName,
          role_type: "consultant",
          organization_id: createForm.organizationId || null,
          phone: createForm.phone || "",
        },
      });

      if (error || !result?.success) {
        const errorMsg = result?.results?.[0]?.error || error?.message || "Unknown error";
        toast.error(language === "en" ? `Failed: ${errorMsg}` : `创建失败: ${errorMsg}`);
      } else {
        toast.success(
          language === "en"
            ? "Consultant created (password: scpc2026)"
            : language === "zh-TW"
              ? "諮詢師已建立（預設密碼: scpc2026）"
              : "咨询师已创建（默认密码: scpc2026）"
        );
        setModalMode(null);
        setCreateForm({ fullName: "", email: "", phone: "", organizationId: "" });
        queryClient.invalidateQueries({ queryKey: ["admin"] });
      }
    } catch {
      toast.error(language === "en" ? "Failed to create consultant" : language === "zh-TW" ? "建立諮詢師失敗" : "创建咨询师失败");
    } finally {
      setIsCreating(false);
    }
  };

  const openPermissionsModal = (consultant: any) => {
    const existingPerms = (consultant.feature_permissions as Record<string, boolean>) || {};
    const initialPerms: Record<string, boolean> = {};
    for (const featureKey of FEATURE_KEYS) {
      initialPerms[featureKey.key] = existingPerms[featureKey.key] === true;
    }
    setPermEditingConsultant(consultant);
    setPermFormData(initialPerms);
    setPermModalOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!permEditingConsultant) return;
    setIsSavingPerms(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ feature_permissions: permFormData })
        .eq("id", permEditingConsultant.id);
      if (error) throw error;
      toast.success(
        language === "en" ? "Permissions updated" : language === "zh-TW" ? "權限已更新" : "权限已更新"
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "consultants"] });
      setPermModalOpen(false);
      setPermEditingConsultant(null);
    } catch {
      toast.error(
        language === "en" ? "Failed to update permissions" : language === "zh-TW" ? "更新權限失敗" : "更新权限失败"
      );
    } finally {
      setIsSavingPerms(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {language === "en" ? "Consultants" : language === "zh-TW" ? "諮詢師管理" : "咨询师管理"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === "en" ? "Manage registered consultants and their clients" : language === "zh-TW" ? "管理註冊諮詢師及其客戶" : "管理注册咨询师及其客户"}
          </p>
        </div>
        <button
          onClick={() => {
            setCreateForm({ fullName: "", email: "", phone: "", organizationId: "" });
            setModalMode("add");
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {language === "en" ? "Add Consultant" : language === "zh-TW" ? "新增諮詢師" : "新增咨询师"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{dataList.length}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Total Consultants" : language === "zh-TW" ? "諮詢師總數" : "咨询师总数"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{dataList.reduce((sum, c) => sum + (c.clientCount || 0), 0)}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Total Clients" : language === "zh-TW" ? "客戶總數" : "客户总数"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{dataList.reduce((sum, c) => sum + (c.assessmentCount || 0), 0)}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Total Assessments" : language === "zh-TW" ? "測評總數" : "测评总数"}</div>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={language === "en" ? "Search consultants..." : language === "zh-TW" ? "搜尋諮詢師..." : "搜索咨询师..."}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
        />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">
                {language === "en" ? "Consultant" : language === "zh-TW" ? "諮詢師" : "咨询师"}
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">
                {language === "en" ? "Clients" : language === "zh-TW" ? "客戶數" : "客户数"}
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">
                {language === "en" ? "Assessments" : language === "zh-TW" ? "測評數" : "测评数"}
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">
                {language === "en" ? "Status" : language === "zh-TW" ? "狀態" : "状态"}
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">
                {language === "en" ? "Actions" : language === "zh-TW" ? "操作" : "操作"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {language === "en" ? "No consultants found" : language === "zh-TW" ? "暫無諮詢師資料" : "暂无咨询师数据"}
                </td>
              </tr>
            ) : filtered.map((consultant) => (
              <tr key={consultant.id} className="hover:bg-muted/10">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <UserCog className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{consultant.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{consultant.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-right text-muted-foreground">{consultant.clientCount || 0}</td>
                <td className="px-5 py-4 text-sm text-right text-muted-foreground">{consultant.assessmentCount || 0}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs ${consultant.status === "active" ? "text-green-600" : "text-amber-600"}`}>
                    {consultant.status === "active"
                      ? (language === "en" ? "Active" : language === "zh-TW" ? "活躍" : "活跃")
                      : (language === "en" ? "Inactive" : language === "zh-TW" ? "未啟用" : "未激活")}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setViewingConsultant(consultant); setModalMode("view"); }}
                      className="p-1.5 hover:bg-muted/20 rounded-lg"
                      title={language === "en" ? "View" : language === "zh-TW" ? "查看" : "查看"}
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => openPermissionsModal(consultant)}
                      className="p-1.5 hover:bg-muted/20 rounded-lg"
                      title={language === "en" ? "Edit Permissions" : language === "zh-TW" ? "編輯權限" : "编辑权限"}
                    >
                      <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Create Consultant Modal */}
      <AnimatePresence>
        {modalMode === "add" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setModalMode(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  {language === "en" ? "Add Consultant" : language === "zh-TW" ? "新增諮詢師" : "新增咨询师"}
                </h2>
                <button onClick={() => setModalMode(null)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {language === "en" ? "Name" : language === "zh-TW" ? "姓名" : "姓名"} *
                  </label>
                  <input
                    type="text"
                    value={createForm.fullName}
                    onChange={(event) => setCreateForm({ ...createForm, fullName: event.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    placeholder={language === "en" ? "Full name" : language === "zh-TW" ? "完整姓名" : "完整姓名"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {language === "en" ? "Email" : language === "zh-TW" ? "信箱" : "邮箱"} *
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    placeholder="consultant@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {language === "en" ? "Phone" : language === "zh-TW" ? "電話" : "手机号"}
                  </label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(event) => setCreateForm({ ...createForm, phone: event.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {language === "en" ? "Organization (Optional)" : language === "zh-TW" ? "所屬機構（選填）" : "所属机构（选填）"}
                  </label>
                  <select
                    value={createForm.organizationId}
                    onChange={(event) => setCreateForm({ ...createForm, organizationId: event.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                  >
                    <option value="">{language === "en" ? "Independent" : language === "zh-TW" ? "獨立諮詢師" : "独立咨询师"}</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-700">
                    {language === "en"
                      ? "Default password: scpc2026. Consultant can change it after first login."
                      : language === "zh-TW"
                        ? "預設密碼：scpc2026，諮詢師首次登入後可修改。"
                        : "默认密码：scpc2026，咨询师首次登录后可修改。"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground">
                  {language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}
                </button>
                <button
                  onClick={handleCreateConsultant}
                  disabled={isCreating}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isCreating
                    ? (language === "en" ? "Creating..." : language === "zh-TW" ? "建立中..." : "创建中...")
                    : (language === "en" ? "Create" : language === "zh-TW" ? "建立" : "创建")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Permissions Modal */}
      <AnimatePresence>
        {permModalOpen && permEditingConsultant && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => { setPermModalOpen(false); setPermEditingConsultant(null); }}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {language === "en" ? "Edit Permissions" : language === "zh-TW" ? "編輯權限" : "编辑权限"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {permEditingConsultant.full_name || permEditingConsultant.email}
                  </p>
                </div>
                <button onClick={() => { setPermModalOpen(false); setPermEditingConsultant(null); }}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {language === "en"
                  ? "Control which features this consultant can access"
                  : language === "zh-TW"
                  ? "控制該諮詢師可使用的功能"
                  : "控制该咨询师可使用的功能"}
              </p>
              <div className="space-y-1.5">
                {FEATURE_KEYS.map((featureKey) => (
                  <label
                    key={featureKey.key}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-muted/10 transition-colors cursor-pointer"
                  >
                    <span className="text-sm text-foreground">
                      {language === "en" ? featureKey.labelEn : language === "zh-TW" ? featureKey.labelZhTw : featureKey.labelZhCn}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPermFormData({
                          ...permFormData,
                          [featureKey.key]: !permFormData[featureKey.key],
                        })
                      }
                      className={cn(
                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
                        permFormData[featureKey.key] ? "bg-green-500" : "bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm",
                          permFormData[featureKey.key] ? "translate-x-[18px]" : "translate-x-[3px]"
                        )}
                      />
                    </button>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setPermModalOpen(false); setPermEditingConsultant(null); }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}
                </button>
                <button
                  onClick={handleSavePermissions}
                  disabled={isSavingPerms}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {isSavingPerms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSavingPerms
                    ? (language === "en" ? "Saving..." : language === "zh-TW" ? "儲存中..." : "保存中...")
                    : (language === "en" ? "Save" : language === "zh-TW" ? "儲存" : "保存")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Consultant Modal */}
      <AnimatePresence>
        {modalMode === "view" && viewingConsultant && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => { setModalMode(null); setViewingConsultant(null); }}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  {language === "en" ? "Consultant Details" : language === "zh-TW" ? "諮詢師詳情" : "咨询师详情"}
                </h2>
                <button onClick={() => { setModalMode(null); setViewingConsultant(null); }}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <UserCog className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground">{viewingConsultant.full_name || "—"}</div>
                    <div className="text-sm text-muted-foreground">{viewingConsultant.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xl font-bold text-foreground">{viewingConsultant.clientCount || 0}</div>
                    <div className="text-xs text-muted-foreground">{language === "en" ? "Clients" : language === "zh-TW" ? "客戶" : "客户"}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xl font-bold text-foreground">{viewingConsultant.assessmentCount || 0}</div>
                    <div className="text-xs text-muted-foreground">{language === "en" ? "Assessments" : language === "zh-TW" ? "測評" : "测评"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-sm text-muted-foreground">{language === "en" ? "Status:" : language === "zh-TW" ? "狀態：" : "状态："}</span>
                  <span className={cn("text-sm font-medium", viewingConsultant.status === "active" ? "text-green-600" : "text-amber-600")}>
                    {viewingConsultant.status === "active"
                      ? (language === "en" ? "Active" : language === "zh-TW" ? "活躍" : "活跃")
                      : (language === "en" ? "Inactive" : language === "zh-TW" ? "未啟用" : "未激活")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === "en" ? "Joined: " : language === "zh-TW" ? "加入時間：" : "加入时间："}
                  {viewingConsultant.created_at ? new Date(viewingConsultant.created_at).toLocaleDateString() : "—"}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => { setModalMode(null); setViewingConsultant(null); }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {language === "en" ? "Close" : language === "zh-TW" ? "關閉" : "关闭"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
