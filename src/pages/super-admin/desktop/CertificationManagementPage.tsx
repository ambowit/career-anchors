import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Plus, X, Search, CheckCircle2, Clock, XCircle, AlertTriangle, Users, Bell, Loader2, Hash, Shield, RefreshCw } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useAllCertifications, useIssueCertification, useActiveCertificateTypes } from "@/hooks/useCertification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function getStatusLabel(status: string, langKey: string) {
  const labels: Record<string, Record<string, string>> = {
    active: { en: "Active", "zh-TW": "有效", "zh-CN": "有效" },
    pending_renewal: { en: "Pending Renewal", "zh-TW": "待換證", "zh-CN": "待换证" },
    under_review: { en: "Under Review", "zh-TW": "審核中", "zh-CN": "审核中" },
    suspended: { en: "Suspended", "zh-TW": "已暫停", "zh-CN": "已暂停" },
    expired: { en: "Expired", "zh-TW": "已過期", "zh-CN": "已过期" },
    revoked: { en: "Revoked", "zh-TW": "已撤銷", "zh-CN": "已撤销" },
  };
  return labels[status]?.[langKey] || status;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_renewal: "bg-amber-50 text-amber-700 border-amber-200",
  under_review: "bg-blue-50 text-blue-700 border-blue-200",
  suspended: "bg-orange-50 text-orange-700 border-orange-200",
  expired: "bg-red-50 text-red-700 border-red-200",
  revoked: "bg-slate-50 text-slate-700 border-slate-200",
};

interface IssueFormState {
  userId: string;
  certificateTypeId: string;
  firstNameEn: string;
  lastNameEn: string;
  organizationId: string;
}

const EMPTY_ISSUE_FORM: IssueFormState = {
  userId: "",
  certificateTypeId: "",
  firstNameEn: "",
  lastNameEn: "",
  organizationId: "",
};

export default function CertificationManagementPage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const { data: certifications = [], isLoading } = useAllCertifications();
  const { data: certificateTypes = [] } = useActiveCertificateTypes();
  const issueMutation = useIssueCertification();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCertCode, setFilterCertCode] = useState<string>("all");
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [profileMap, setProfileMap] = useState<Record<string, { full_name: string; email: string; first_name_en?: string; last_name_en?: string }>>({});
  const [orgMap, setOrgMap] = useState<Record<string, string>>({});
  const [issueForm, setIssueForm] = useState<IssueFormState>(EMPTY_ISSUE_FORM);
  const [eligibleUsers, setEligibleUsers] = useState<Array<{ id: string; full_name: string; email: string; first_name_en?: string; last_name_en?: string }>>([]);
  const [isRunningReminders, setIsRunningReminders] = useState(false);
  const [certIdPreview, setCertIdPreview] = useState("");

  const selectedCertType = useMemo(
    () => certificateTypes.find((ct) => ct.id === issueForm.certificateTypeId),
    [certificateTypes, issueForm.certificateTypeId]
  );

  // Update cert ID preview when form changes
  useEffect(() => {
    if (!selectedCertType || !issueForm.userId) {
      setCertIdPreview("");
      return;
    }
    const prefix = selectedCertType.gcqa_code || selectedCertType.cert_code;
    const year = new Date().getFullYear();
    const suffix = issueForm.userId.substring(0, 4).toUpperCase();
    setCertIdPreview(`${prefix}${year}###${suffix}`);
  }, [selectedCertType, issueForm.userId]);

  // Auto-fill English names when user is selected
  useEffect(() => {
    if (!issueForm.userId) return;
    const selectedUser = eligibleUsers.find((u) => u.id === issueForm.userId);
    if (selectedUser) {
      setIssueForm((prev) => ({
        ...prev,
        firstNameEn: selectedUser.first_name_en || prev.firstNameEn,
        lastNameEn: selectedUser.last_name_en || prev.lastNameEn,
      }));
    }
  }, [issueForm.userId, eligibleUsers]);

  const handleRunReminders = async () => {
    setIsRunningReminders(true);
    try {
      const { data, error } = await supabase.functions.invoke("certification-reminders");
      if (error) throw error;
      const sent = data?.reminders_sent || 0;
      const expired = data?.newly_expired || 0;
      toast.success(
        { en: `Reminders processed: ${sent} sent, ${expired} expired updated`, "zh-TW": `提醒處理完成：${sent} 條已發送，${expired} 條已過期更新`, "zh-CN": `提醒处理完成：${sent} 条已发送，${expired} 条已过期更新` }[langKey]!
      );
    } catch {
      toast.error({ en: "Failed to run reminders", "zh-TW": "提醒運行失敗", "zh-CN": "提醒运行失败" }[langKey]!);
    } finally {
      setIsRunningReminders(false);
    }
  };

  useEffect(() => {
    const userIds = [...new Set(certifications.map((c) => c.user_id))];
    if (userIds.length > 0) {
      supabase
        .from("profiles")
        .select("id, full_name, email, first_name_en, last_name_en")
        .in("id", userIds)
        .then(({ data }) => {
          const map: Record<string, { full_name: string; email: string; first_name_en?: string; last_name_en?: string }> = {};
          (data || []).forEach((profile: any) => { map[profile.id] = profile; });
          setProfileMap(map);
        });
    }
    const orgIds = [...new Set(certifications.map((c) => c.organization_id).filter(Boolean))];
    if (orgIds.length > 0) {
      supabase.from("organizations").select("id, name").in("id", orgIds as string[]).then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach((o: { id: string; name: string }) => { map[o.id] = o.name; });
        setOrgMap(map);
      });
    }
  }, [certifications]);

  useEffect(() => {
    if (!showIssueModal) return;
    supabase
      .from("profiles")
      .select("id, full_name, email, first_name_en, last_name_en")
      .in("role_type", ["consultant", "hr"])
      .order("full_name")
      .then(({ data }) => {
        setEligibleUsers((data || []) as Array<{ id: string; full_name: string; email: string; first_name_en?: string; last_name_en?: string }>);
      });
  }, [showIssueModal]);

  const stats = {
    total: certifications.length,
    active: certifications.filter((c) => c.certification_status === "active").length,
    pendingRenewal: certifications.filter((c) => c.certification_status === "pending_renewal").length,
    expired: certifications.filter((c) => c.certification_status === "expired").length,
    expiringSoon: certifications.filter((c) => {
      const days = Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 180 && days > 0 && c.certification_status === "active";
    }).length,
  };

  const filteredCerts = certifications.filter((c) => {
    if (filterStatus !== "all" && c.certification_status !== filterStatus) return false;
    if (filterCertCode !== "all" && c.cert_code !== filterCertCode) return false;
    if (!searchTerm) return true;
    const profile = profileMap[c.user_id];
    const term = searchTerm.toLowerCase();
    return (
      (profile?.full_name || "").toLowerCase().includes(term) ||
      (profile?.email || "").toLowerCase().includes(term) ||
      c.certification_number.toLowerCase().includes(term)
    );
  });

  const handleIssue = async () => {
    if (!issueForm.userId) {
      toast.error({ en: "Please select a user", "zh-TW": "請選擇使用者", "zh-CN": "请选择用户" }[langKey]!);
      return;
    }
    if (!issueForm.certificateTypeId || !selectedCertType) {
      toast.error({ en: "Please select certificate type", "zh-TW": "請選擇證照類型", "zh-CN": "请选择证照类型" }[langKey]!);
      return;
    }
    if (!issueForm.firstNameEn || !issueForm.lastNameEn) {
      toast.error({ en: "English name is required for GCQA", "zh-TW": "GCQA 需要英文姓名", "zh-CN": "GCQA 需要英文姓名" }[langKey]!);
      return;
    }

    await issueMutation.mutateAsync({
      userId: issueForm.userId,
      certificateTypeId: selectedCertType.id,
      certCode: selectedCertType.cert_code,
      gcqaCode: selectedCertType.gcqa_code,
      firstNameEn: issueForm.firstNameEn,
      lastNameEn: issueForm.lastNameEn,
      certificationType: selectedCertType.cert_code.toLowerCase(),
      renewalCycleYears: selectedCertType.renewal_cycle_years,
      minimumCduHours: selectedCertType.minimum_cdu_hours,
      organizationId: issueForm.organizationId || undefined,
    });
    toast.success({ en: "Certificate issued successfully!", "zh-TW": "證書已成功頒發！", "zh-CN": "证书已成功颁发！" }[langKey]!);
    setShowIssueModal(false);
    setIssueForm(EMPTY_ISSUE_FORM);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {{ en: "Issue Certificate", "zh-TW": "頒發證號", "zh-CN": "颁发证号" }[langKey]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {{ en: "Manage all certifications across the platform — auto-generated certificate IDs", "zh-TW": "管理全平台認證 — 自動生成證書編號", "zh-CN": "管理全平台认证 — 自动生成证书编号" }[langKey]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunReminders}
            disabled={isRunningReminders}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {isRunningReminders ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            {{ en: "Run Reminders", "zh-TW": "運行提醒", "zh-CN": "运行提醒" }[langKey]}
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {{ en: "Issue Certificate", "zh-TW": "頒發證號", "zh-CN": "颁发证号" }[langKey]}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: { en: "Total", "zh-TW": "總計", "zh-CN": "总计" }[langKey]!, value: stats.total, icon: Users, color: "text-slate-700" },
          { label: { en: "Active", "zh-TW": "有效", "zh-CN": "有效" }[langKey]!, value: stats.active, icon: CheckCircle2, color: "text-emerald-600" },
          { label: { en: "Pending", "zh-TW": "待換證", "zh-CN": "待换证" }[langKey]!, value: stats.pendingRenewal, icon: Clock, color: "text-amber-600" },
          { label: { en: "Expiring", "zh-TW": "即將到期", "zh-CN": "即将到期" }[langKey]!, value: stats.expiringSoon, icon: AlertTriangle, color: "text-orange-600" },
          { label: { en: "Expired", "zh-TW": "已過期", "zh-CN": "已过期" }[langKey]!, value: stats.expired, icon: XCircle, color: "text-red-600" },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><stat.icon className={`w-4 h-4 ${stat.color}`} /><span className="text-xs text-muted-foreground font-medium">{stat.label}</span></div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={{ en: "Search name / cert #...", "zh-TW": "搜尋姓名 / 證書編號...", "zh-CN": "搜索姓名 / 证书编号..." }[langKey]}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm"
          />
        </div>
        {/* Cert code filter */}
        <div className="flex items-center gap-1.5">
          {["all", ...certificateTypes.map((ct) => ct.cert_code)].map((code) => (
            <button
              key={code}
              onClick={() => setFilterCertCode(code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCertCode === code ? "bg-red-500 text-white" : "bg-muted/10 text-muted-foreground hover:bg-muted/20"}`}
            >
              {code === "all" ? { en: "All Types", "zh-TW": "全部類型", "zh-CN": "全部类型" }[langKey] : code}
            </button>
          ))}
        </div>
        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          {["all", "active", "pending_renewal", "expired", "under_review"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === status ? "bg-slate-700 text-white" : "bg-muted/10 text-muted-foreground hover:bg-muted/20"}`}
            >
              {status === "all" ? { en: "All Status", "zh-TW": "全部狀態", "zh-CN": "全部状态" }[langKey] : getStatusLabel(status, langKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" /></div>
        ) : filteredCerts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm"><Award className="w-10 h-10 mx-auto mb-3 opacity-30" />{{ en: "No certifications", "zh-TW": "暫無認證", "zh-CN": "暂无认证" }[langKey]}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Name", "zh-TW": "姓名", "zh-CN": "姓名" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Certificate ID", "zh-TW": "證書編號", "zh-CN": "证书编号" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Type", "zh-TW": "類型", "zh-CN": "类型" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Org", "zh-TW": "機構", "zh-CN": "机构" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Issue", "zh-TW": "發證", "zh-CN": "发证" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Expiry", "zh-TW": "到期", "zh-CN": "到期" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Renewal", "zh-TW": "換證次數", "zh-CN": "换证次数" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Hash", "zh-TW": "雜湊", "zh-CN": "哈希" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Status", "zh-TW": "狀態", "zh-CN": "状态" }[langKey]}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.map((cert) => {
                const profile = profileMap[cert.user_id];
                return (
                  <tr key={cert.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-foreground">{profile?.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{profile?.email || ""}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono font-semibold text-foreground bg-muted/10 px-2 py-1 rounded">{cert.certification_number}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                        {cert.cert_code || cert.certification_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{cert.organization_id ? orgMap[cert.organization_id] || "—" : "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{cert.issue_date}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{cert.expiry_date}</td>
                    <td className="px-5 py-3.5">
                      {cert.recertification_count > 0 ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
                          <RefreshCw className="w-3 h-3" />
                          {cert.recertification_count}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {cert.certificate_hash ? (
                        <span className="text-[10px] font-mono text-muted-foreground" title={cert.certificate_hash}>
                          <Shield className="w-3 h-3 inline mr-0.5 text-emerald-500" />
                          {cert.certificate_hash.substring(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[cert.certification_status] || ""}`}>
                        {getStatusLabel(cert.certification_status, langKey)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Issue Certificate Modal */}
      <AnimatePresence>
        {showIssueModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => setShowIssueModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-[560px] shadow-xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-foreground">
                  {{ en: "Issue New Certificate", "zh-TW": "頒發新證號", "zh-CN": "颁发新证号" }[langKey]}
                </h3>
                <button onClick={() => setShowIssueModal(false)} className="p-1 rounded-lg hover:bg-muted/20">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Certificate ID Preview */}
              {certIdPreview && (
                <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">
                      {{ en: "Certificate ID Preview", "zh-TW": "證書編號預覽", "zh-CN": "证书编号预览" }[langKey]}
                    </span>
                  </div>
                  <div className="text-lg font-mono font-bold text-emerald-800 tracking-wider">{certIdPreview}</div>
                  <div className="text-[10px] text-emerald-600 mt-1">
                    {{ en: "### = auto-incremented serial number", "zh-TW": "### = 自動遞增序號", "zh-CN": "### = 自动递增序号" }[langKey]}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Certificate Type Selector */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {{ en: "Certificate Type", "zh-TW": "證照類型", "zh-CN": "证照类型" }[langKey]} *
                  </label>
                  <select
                    value={issueForm.certificateTypeId}
                    onChange={(e) => setIssueForm({ ...issueForm, certificateTypeId: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm"
                  >
                    <option value="">{{ en: "Select certificate type...", "zh-TW": "選擇證照類型...", "zh-CN": "选择证照类型..." }[langKey]}</option>
                    {certificateTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.cert_code} — {langKey === "en" ? ct.cert_name_en : langKey === "zh-TW" ? (ct.cert_name_zh_tw || ct.cert_name_en) : (ct.cert_name_zh_cn || ct.cert_name_en)}
                        {ct.gcqa_code ? ` (GCQA: ${ct.gcqa_code})` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedCertType && (
                    <div className="mt-1.5 text-xs text-muted-foreground flex items-center gap-3">
                      <span>{{ en: "Cycle", "zh-TW": "週期", "zh-CN": "周期" }[langKey]}: {selectedCertType.renewal_cycle_years} {{ en: "years", "zh-TW": "年", "zh-CN": "年" }[langKey]}</span>
                      <span>{{ en: "Min CDU", "zh-TW": "最低 CDU", "zh-CN": "最低 CDU" }[langKey]}: {selectedCertType.minimum_cdu_hours}h</span>
                      {selectedCertType.gcqa_code && (
                        <span className="text-emerald-600 font-medium">GCQA: {selectedCertType.gcqa_code}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* User Selector */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {{ en: "Select User", "zh-TW": "選擇使用者", "zh-CN": "选择用户" }[langKey]} *
                  </label>
                  <select
                    value={issueForm.userId}
                    onChange={(e) => setIssueForm({ ...issueForm, userId: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm"
                  >
                    <option value="">{{ en: "Select...", "zh-TW": "選擇...", "zh-CN": "选择..." }[langKey]}</option>
                    {eligibleUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                {/* English Name (for GCQA) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {{ en: "First Name (EN)", "zh-TW": "名 (英文)", "zh-CN": "名 (英文)" }[langKey]} *
                    </label>
                    <input
                      value={issueForm.firstNameEn}
                      onChange={(e) => setIssueForm({ ...issueForm, firstNameEn: e.target.value })}
                      placeholder="John"
                      className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {{ en: "Last Name (EN)", "zh-TW": "姓 (英文)", "zh-CN": "姓 (英文)" }[langKey]} *
                    </label>
                    <input
                      value={issueForm.lastNameEn}
                      onChange={(e) => setIssueForm({ ...issueForm, lastNameEn: e.target.value })}
                      placeholder="Doe"
                      className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground -mt-2">
                  {{ en: "English names are required for GCQA data export", "zh-TW": "英文姓名為 GCQA 資料匯出必填", "zh-CN": "英文姓名为 GCQA 资料导出必填" }[langKey]}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button onClick={() => setShowIssueModal(false)} className="px-4 py-2 text-sm text-muted-foreground">
                  {{ en: "Cancel", "zh-TW": "取消", "zh-CN": "取消" }[langKey]}
                </button>
                <button
                  onClick={handleIssue}
                  disabled={issueMutation.isPending}
                  className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {issueMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                  {{ en: "Issue Certificate", "zh-TW": "頒發證號", "zh-CN": "颁发证号" }[langKey]}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
