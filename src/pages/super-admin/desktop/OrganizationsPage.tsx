import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Building2,
  Edit, Trash2, X, Save,
  CheckCircle2, Clock, XCircle, Loader2, AlertTriangle, UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import {
  useOrganizationsWithCounts,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
} from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type ModalMode = "add" | "edit" | "delete" | null;

interface OrgFormData {
  id: string;
  name: string;
  domain: string;
  plan: string;
  maxSeats: string;
  status: string;
  adminEmail: string;
  adminName: string;
}

const initialFormData: OrgFormData = {
  id: "", name: "", domain: "", plan: "trial", maxSeats: "10", status: "active",
  adminEmail: "", adminName: "",
};

export default function OrganizationsPage() {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formData, setFormData] = useState<OrgFormData>(initialFormData);
  const [isCreatingWithAdmin, setIsCreatingWithAdmin] = useState(false);

  const { data: organizations, isLoading } = useOrganizationsWithCounts();
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();
  const deleteMutation = useDeleteOrganization();

  const plans = ["enterprise", "professional", "standard", "trial"];
  const planLabels: Record<string, string> = { enterprise: "Enterprise", professional: "Professional", standard: "Standard", trial: "Trial" };
  const statuses = ["active", "suspended", "archived"];
  const statusLabels: Record<string, string> = language === "en" ? { active: "Active", suspended: "Suspended", archived: "Archived" } : language === "zh-TW" ? { active: "活躍", suspended: "已暫停", archived: "已歸檔" } : { active: "活跃", suspended: "已暂停", archived: "已归档" };

  const orgs = organizations || [];
  const filteredOrgs = orgs.filter((org) => {
    const matchesSearch = (org.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (org.domain || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = !selectedPlan || org.plan_type === selectedPlan;
    return matchesSearch && matchesPlan;
  });

  const statusConfig = {
    active: { label: language === "en" ? "Active" : language === "zh-TW" ? "活躍" : "活跃", icon: CheckCircle2, color: "text-green-600" },
    suspended: { label: language === "en" ? "Suspended" : language === "zh-TW" ? "已暫停" : "已暂停", icon: XCircle, color: "text-red-600" },
    trial: { label: language === "en" ? "Trial" : language === "zh-TW" ? "試用中" : "试用中", icon: Clock, color: "text-amber-600" },
  };

  const openAdd = () => {
    setFormData(initialFormData);
    setModalMode("add");
  };

  const openEdit = (org: typeof orgs[0]) => {
    setFormData({
      id: org.id, name: org.name || "", domain: org.domain || "",
      plan: org.plan_type || "trial", maxSeats: String(org.max_seats || 10),
      status: org.status || "active", adminEmail: "", adminName: "",
    });
    setModalMode("edit");
  };

  const openDelete = (org: typeof orgs[0]) => {
    setFormData({ ...initialFormData, id: org.id, name: org.name || "" });
    setModalMode("delete");
  };

  const handleSave = async () => {
    if (!formData.name) return;

    if (modalMode === "add") {
      setIsCreatingWithAdmin(true);
      try {
        // Step 1: Create the organization
        const orgData = await createMutation.mutateAsync({
          name: formData.name,
          domain: formData.domain,
          plan_type: formData.plan,
          max_seats: parseInt(formData.maxSeats) || 10,
        });

        // Step 2: Create org admin account if email is provided
        if (formData.adminEmail && formData.adminName) {
          const { data: createResult, error: createError } = await supabase.functions.invoke("create-user", {
            body: {
              email: formData.adminEmail,
              password: "scpc2026",
              full_name: formData.adminName,
              role_type: "org_admin",
              organization_id: orgData.id,
            },
          });

          if (createError || !createResult?.success) {
            const isSeatError = createResult?.error === "seat_limit_exceeded";
            const errorMsg = isSeatError
              ? (language === "en" ? createResult?.message_en : createResult?.message)
              : (createResult?.results?.[0]?.error || createError?.message || "Unknown error");
            toast.error(
              language === "en"
                ? `Organization created, but admin account failed: ${errorMsg}`
                : language === "zh-TW"
                ? `機構已建立，但管理員帳戶建立失敗: ${errorMsg}`
                : `机构已创建，但管理员账户创建失败: ${errorMsg}`
            );
          } else {
            toast.success(
              language === "en"
                ? "Organization and admin account created successfully"
                : language === "zh-TW"
                ? "機構和管理員帳戶建立成功"
                : "机构和管理员账户创建成功"
            );
          }
          // Refresh user data too
          queryClient.invalidateQueries({ queryKey: ["admin"] });
        } else {
          toast.success(language === "en" ? "Organization created" : language === "zh-TW" ? "機構建立成功" : "机构创建成功");
        }
      } catch (error) {
        toast.error(language === "en" ? "Failed to create organization" : language === "zh-TW" ? "建立機構失敗" : "创建机构失败");
      } finally {
        setIsCreatingWithAdmin(false);
      }
    } else if (modalMode === "edit") {
      await updateMutation.mutateAsync({
        id: formData.id, name: formData.name, domain: formData.domain,
        plan_type: formData.plan, max_seats: parseInt(formData.maxSeats) || 10,
        status: formData.status,
      });
      toast.success(language === "en" ? "Organization updated" : language === "zh-TW" ? "機構更新成功" : "机构更新成功");
    }
    setModalMode(null);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(formData.id);
    toast.success(language === "en" ? "Organization deleted" : language === "zh-TW" ? "機構已刪除" : "机构已删除");
    setModalMode(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending || isCreatingWithAdmin;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const planBadgeColor = (planType: string) => {
    switch (planType) {
      case "enterprise": return "bg-purple-100 text-purple-700";
      case "professional": return "bg-blue-100 text-blue-700";
      case "standard": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "Organizations" : language === "zh-TW" ? "機構管理" : "机构管理"}</h1>
          <p className="text-sm text-muted-foreground">{language === "en" ? "Manage all tenant organizations" : language === "zh-TW" ? "管理所有租戶機構" : "管理所有租户机构"}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> {language === "en" ? "Add Organization" : language === "zh-TW" ? "新增機構" : "新增机构"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4"><div className="text-2xl font-bold text-foreground">{orgs.length}</div><div className="text-xs text-muted-foreground">{language === "en" ? "Total Organizations" : language === "zh-TW" ? "機構總數" : "机构总数"}</div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="text-2xl font-bold text-green-600">{orgs.filter(o => o.status === "active").length}</div><div className="text-xs text-muted-foreground">{language === "en" ? "Active" : language === "zh-TW" ? "活躍" : "活跃"}</div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="text-2xl font-bold text-foreground">{orgs.reduce((sum, o) => sum + (o.userCount || 0), 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">{language === "en" ? "Total Users" : language === "zh-TW" ? "總用戶" : "总用户"}</div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="text-2xl font-bold text-foreground">{orgs.filter(o => o.ssoEnabled).length}</div><div className="text-xs text-muted-foreground">{language === "en" ? "SSO Enabled" : language === "zh-TW" ? "SSO已啟用" : "SSO已启用"}</div></div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder={language === "en" ? "Search organizations..." : language === "zh-TW" ? "搜尋機構名稱或網域..." : "搜索机构名称或域名..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSelectedPlan(null)} className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-colors", !selectedPlan ? "bg-red-500 text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground")}>{language === "en" ? "All" : "全部"}</button>
          {plans.map((plan) => (
            <button key={plan} onClick={() => setSelectedPlan(plan)} className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-colors", selectedPlan === plan ? "bg-red-500 text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground")}>{planLabels[plan]}</button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-muted/30">
            <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Organization" : language === "zh-TW" ? "機構" : "机构"}</th>
            <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Plan" : language === "zh-TW" ? "方案" : "套餐"}</th>
            <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Users / Seats" : language === "zh-TW" ? "用戶/席位" : "用户/席位"}</th>
            <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Assessments" : language === "zh-TW" ? "測評數" : "测评数"}</th>
            <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">SSO</th>
            <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Status" : language === "zh-TW" ? "狀態" : "状态"}</th>
            <th className="text-right px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Actions" : "操作"}</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {filteredOrgs.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">{language === "en" ? "No organizations found" : language === "zh-TW" ? "暫無機構資料" : "暂无机构数据"}</td></tr>
            ) : filteredOrgs.map((org) => {
              const orgStatus = (org.status as keyof typeof statusConfig) || "active";
              const status = statusConfig[orgStatus] || statusConfig.active;
              const StatusIcon = status.icon;
              const userCount = org.userCount || 0;
              const maxSeats = org.max_seats || 1;
              return (
                <tr key={org.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center"><Building2 className="w-4 h-4 text-red-500" /></div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{org.name}</div>
                        <div className="text-xs text-muted-foreground">{org.domain || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planBadgeColor(org.plan_type || "")}`}>{planLabels[org.plan_type || ""] || org.plan_type || "—"}</span></td>
                  <td className="px-5 py-4">
                    <div className={cn("text-sm", userCount > maxSeats ? "text-red-600 font-semibold" : "text-foreground")}>{userCount} / {maxSeats}</div>
                    <div className="w-20 h-1.5 bg-muted/30 rounded-full mt-1"><div className={cn("h-full rounded-full", userCount > maxSeats ? "bg-red-500" : userCount === maxSeats ? "bg-amber-500" : "bg-primary")} style={{ width: `${Math.min((userCount / maxSeats) * 100, 100)}%` }} /></div>
                    {userCount > maxSeats && <div className="text-[10px] text-red-500 mt-0.5">{language === "en" ? "Over limit!" : "超出席位!"}</div>}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{(org.assessmentCount || 0).toLocaleString()}</td>
                  <td className="px-5 py-4"><span className={`text-xs ${org.ssoEnabled ? "text-green-600" : "text-muted-foreground"}`}>{org.ssoEnabled ? "✓ Enabled" : "—"}</span></td>
                  <td className="px-5 py-4"><span className={cn("flex items-center gap-1 text-xs font-medium", status.color)}><StatusIcon className="w-3.5 h-3.5" /> {status.label}</span></td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(org)} className="p-1.5 hover:bg-muted/20 rounded-lg" title={language === "en" ? "Edit" : language === "zh-TW" ? "編輯" : "编辑"}><Edit className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => openDelete(org)} className="p-1.5 hover:bg-destructive/10 rounded-lg" title={language === "en" ? "Delete" : language === "zh-TW" ? "刪除" : "删除"}><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {(modalMode === "add" || modalMode === "edit") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{modalMode === "add" ? (language === "en" ? "Add Organization" : language === "zh-TW" ? "新增機構" : "新增机构") : (language === "en" ? "Edit Organization" : language === "zh-TW" ? "編輯機構" : "编辑机构")}</h2>
                <button onClick={() => setModalMode(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Name" : language === "zh-TW" ? "機構名稱" : "机构名称"} *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Plan" : language === "zh-TW" ? "方案" : "套餐"}</label>
                    <select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm">
                      {plans.map((p) => <option key={p} value={p}>{planLabels[p]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Max Seats" : "最大席位"}</label>
                    <input type="number" value={formData.maxSeats} onChange={(e) => setFormData({ ...formData, maxSeats: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm" />
                  </div>
                </div>
                {modalMode === "edit" && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Status" : language === "zh-TW" ? "狀態" : "状态"}</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm">
                      {statuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
                    </select>
                  </div>
                )}

                {/* Admin Account Section — only on Add */}
                {modalMode === "add" && (
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <UserPlus className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-semibold text-foreground">{language === "en" ? "Organization Admin Account" : language === "zh-TW" ? "機構管理員帳戶" : "机构管理员账户"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {language === "en"
                        ? "Optionally create an admin account for this organization. Default password: scpc2026"
                        : language === "zh-TW"
                        ? "可選：為該機構建立管理員帳戶。預設密碼：scpc2026"
                        : "可选：为该机构创建管理员账户。默认密码：scpc2026"}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Admin Name" : language === "zh-TW" ? "管理員姓名" : "管理员姓名"}</label>
                        <input
                          type="text"
                          value={formData.adminName}
                          onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                          placeholder={language === "en" ? "e.g. Zhang San" : language === "zh-TW" ? "例如：張三" : "例如：张三"}
                          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Admin Email" : language === "zh-TW" ? "管理員信箱" : "管理员邮箱"}</label>
                        <input
                          type="email"
                          value={formData.adminEmail}
                          onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                          placeholder={language === "en" ? "admin@company.com" : "admin@company.com"}
                          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}</button>
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? (language === "en" ? "Saving..." : language === "zh-TW" ? "儲存中..." : "保存中...") : (language === "en" ? "Save" : language === "zh-TW" ? "儲存" : "保存")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {modalMode === "delete" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                <h2 className="text-lg font-semibold text-foreground">{language === "en" ? "Delete Organization" : language === "zh-TW" ? "刪除機構" : "删除机构"}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {language === "en" ? `Are you sure you want to delete "${formData.name}"? This action cannot be undone.` : language === "zh-TW" ? `確定要刪除「${formData.name}」嗎？此操作不可撤銷。` : `确定要删除「${formData.name}」吗？此操作不可撤销。`}
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}</button>
                <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50">
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleteMutation.isPending ? (language === "en" ? "Deleting..." : language === "zh-TW" ? "刪除中..." : "删除中...") : (language === "en" ? "Delete" : language === "zh-TW" ? "刪除" : "删除")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
