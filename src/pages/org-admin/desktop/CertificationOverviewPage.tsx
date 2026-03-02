import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award, Users, AlertTriangle, CheckCircle2, Clock, XCircle, RefreshCw, Search } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useOrgCertifications } from "@/hooks/useCertification";
import { supabase } from "@/integrations/supabase/client";

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

export default function CertificationOverviewPage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const { data: certifications = [], isLoading } = useOrgCertifications();
  const [searchTerm, setSearchTerm] = useState("");
  const [profileMap, setProfileMap] = useState<Record<string, { full_name: string; email: string }>>({});

  useEffect(() => {
    const userIds = [...new Set(certifications.map((c) => c.user_id))];
    if (userIds.length === 0) return;
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds)
      .then(({ data }) => {
        const map: Record<string, { full_name: string; email: string }> = {};
        (data || []).forEach((p: { id: string; full_name: string; email: string }) => { map[p.id] = p; });
        setProfileMap(map);
      });
  }, [certifications]);

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
    if (!searchTerm) return true;
    const profile = profileMap[c.user_id];
    const name = profile?.full_name || "";
    const email = profile?.email || "";
    const term = searchTerm.toLowerCase();
    return name.toLowerCase().includes(term) || email.toLowerCase().includes(term) || c.certification_number.toLowerCase().includes(term);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {{ en: "Certification Overview", "zh-TW": "認證總覽", "zh-CN": "认证总览" }[langKey]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {{ en: "Monitor certification status for all organization members", "zh-TW": "監控機構內所有認證人員狀態", "zh-CN": "监控机构内所有认证人员状态" }[langKey]}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: { en: "Total Certified", "zh-TW": "認證總人數", "zh-CN": "认证总人数" }[langKey]!, value: stats.total, icon: Users, color: "text-slate-700", bg: "bg-slate-50" },
          { label: { en: "Active", "zh-TW": "有效認證", "zh-CN": "有效认证" }[langKey]!, value: stats.active, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: { en: "Pending Renewal", "zh-TW": "待換證", "zh-CN": "待换证" }[langKey]!, value: stats.pendingRenewal, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: { en: "Expiring Soon", "zh-TW": "即將到期", "zh-CN": "即将到期" }[langKey]!, value: stats.expiringSoon, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
          { label: { en: "Expired", "zh-TW": "已過期", "zh-CN": "已过期" }[langKey]!, value: stats.expired, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className={`${stat.bg} border border-border rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={{ en: "Search by name, email, or certificate number...", "zh-TW": "按姓名、郵箱或證書編號搜尋...", "zh-CN": "按姓名、邮箱或证书编号搜索..." }[langKey]} className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm" />
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full" /></div>
        ) : filteredCerts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {{ en: "No certifications found", "zh-TW": "暫無認證記錄", "zh-CN": "暂无认证记录" }[langKey]}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Name", "zh-TW": "姓名", "zh-CN": "姓名" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Cert Number", "zh-TW": "證書編號", "zh-CN": "证书编号" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Type", "zh-TW": "類型", "zh-CN": "类型" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Expiry", "zh-TW": "到期日", "zh-CN": "到期日" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Status", "zh-TW": "狀態", "zh-CN": "状态" }[langKey]}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.map((cert) => {
                const profile = profileMap[cert.user_id];
                const daysLeft = Math.ceil((new Date(cert.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={cert.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-foreground">{profile?.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{profile?.email || ""}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground font-mono">{cert.certification_number}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{cert.certification_type === "scpc_professional" ? "Professional" : cert.certification_type}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm text-foreground">{cert.expiry_date}</div>
                      {daysLeft > 0 && daysLeft <= 180 && <div className="text-[10px] text-amber-500 font-medium">{daysLeft}d left</div>}
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
    </div>
  );
}
