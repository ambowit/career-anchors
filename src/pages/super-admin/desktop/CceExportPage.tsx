import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, Download, Filter, Eye } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useAllCertifications, useAllCduRecords, type CduRecord } from "@/hooks/useCertification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CceExportPage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const { data: certifications = [] } = useAllCertifications();
  const { data: cduRecords = [] } = useAllCduRecords();

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [profileMap, setProfileMap] = useState<Record<string, { full_name: string; email: string }>>({});

  useEffect(() => {
    const userIds = [...new Set(certifications.map((c) => c.user_id))];
    if (userIds.length === 0) return;
    supabase.from("profiles").select("id, full_name, email").in("id", userIds).then(({ data }) => {
      const map: Record<string, { full_name: string; email: string }> = {};
      (data || []).forEach((p: { id: string; full_name: string; email: string }) => { map[p.id] = p; });
      setProfileMap(map);
    });
  }, [certifications]);

  const orgIds = useMemo(() => {
    const ids = new Set(certifications.map((c) => c.organization_id).filter(Boolean));
    return Array.from(ids) as string[];
  }, [certifications]);

  const exportData = useMemo(() => {
    const filteredCerts = certifications.filter((cert) => {
      if (orgFilter !== "all" && cert.organization_id !== orgFilter) return false;
      return true;
    });

    return filteredCerts.map((cert) => {
      const profile = profileMap[cert.user_id];
      const certCduRecords = cduRecords.filter(
        (r) => r.certification_id === cert.id && r.approval_status === "approved"
      );

      const typeARecords = certCduRecords.filter((r) => (r as CduRecord).cdu_type === "A");
      const typeBRecords = certCduRecords.filter((r) => (r as CduRecord).cdu_type === "B");
      const typeAHours = typeARecords.reduce((sum, r) => sum + Number(r.cdu_hours), 0);
      const typeBHours = typeBRecords.reduce((sum, r) => sum + Number(r.cdu_hours), 0);
      const totalHours = typeAHours + typeBHours;

      return {
        certificationNumber: cert.certification_number,
        holderName: profile?.full_name || "",
        holderEmail: profile?.email || "",
        certificationType: cert.certification_type,
        certificationStatus: cert.certification_status,
        issueDate: cert.issue_date,
        expiryDate: cert.expiry_date,
        renewalCycleYears: cert.renewal_cycle_years,
        minimumCduHours: cert.minimum_cdu_hours,
        totalApprovedCduHours: totalHours,
        typeAHours,
        typeBHours,
        organizationId: cert.organization_id || "",
      };
    });
  }, [certifications, cduRecords, orgFilter, profileMap]);

  const handleExportCce = () => {
    const cceHeaders = [
      "Certification Number",
      "Holder Name",
      "Holder Email",
      "Certification Type",
      "Certification Status",
      "Issue Date",
      "Expiry Date",
      "Renewal Cycle (Years)",
      "Minimum CDU Hours Required",
      "Total Approved CDU Hours",
      "A-Type CDU Hours",
      "B-Type CDU Hours",
      "Organization ID",
    ];

    const rows = exportData.map((row) => [
      row.certificationNumber,
      row.holderName,
      row.holderEmail,
      row.certificationType,
      row.certificationStatus,
      row.issueDate,
      row.expiryDate,
      String(row.renewalCycleYears),
      String(row.minimumCduHours),
      String(row.totalApprovedCduHours),
      String(row.typeAHours),
      String(row.typeBHours),
      row.organizationId,
    ]);

    const csvContent = [cceHeaders.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CCE_Export_${dateFrom}_to_${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success({ en: "CCE format export complete", "zh-TW": "CCE 格式匯出完成", "zh-CN": "CCE 格式导出完成" }[langKey]!);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {{ en: "CCE Format Export", "zh-TW": "CCE 格式匯出", "zh-CN": "CCE 格式导出" }[langKey]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {{ en: "Export certification data in CCE format for the US certification board", "zh-TW": "以 CCE 格式匯出認證資料供美國認證委員會使用", "zh-CN": "以 CCE 格式导出认证数据供美国认证委员会使用" }[langKey]}
          </p>
        </div>
        <button
          onClick={handleExportCce}
          disabled={exportData.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {{ en: "Export CCE CSV", "zh-TW": "匯出 CCE CSV", "zh-CN": "导出 CCE CSV" }[langKey]}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Date Range", "zh-TW": "日期範圍", "zh-CN": "日期范围" }[langKey]}</label>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 bg-card border border-border rounded-lg text-sm" />
            <span className="text-muted-foreground">—</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 bg-card border border-border rounded-lg text-sm" />
          </div>
        </div>
        {orgIds.length > 0 && (
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Organization", "zh-TW": "機構", "zh-CN": "机构" }[langKey]}</label>
            <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)} className="px-3 py-2 bg-card border border-border rounded-lg text-sm">
              <option value="all">{{ en: "All Organizations", "zh-TW": "全部機構", "zh-CN": "全部机构" }[langKey]}</option>
              {orgIds.map((id) => <option key={id} value={id}>{id.slice(0, 8)}...</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: { en: "Total Records", "zh-TW": "總記錄", "zh-CN": "总记录" }[langKey]!, value: exportData.length, color: "text-slate-600" },
          { label: { en: "Total CDU Hours", "zh-TW": "總 CDU 學時", "zh-CN": "总 CDU 学时" }[langKey]!, value: `${exportData.reduce((s, r) => s + r.totalApprovedCduHours, 0)}h`, color: "text-emerald-600" },
          { label: { en: "A-Type Hours", "zh-TW": "A 類學時", "zh-CN": "A 类学时" }[langKey]!, value: `${exportData.reduce((s, r) => s + r.typeAHours, 0)}h`, color: "text-blue-600" },
          { label: { en: "B-Type Hours", "zh-TW": "B 類學時", "zh-CN": "B 类学时" }[langKey]!, value: `${exportData.reduce((s, r) => s + r.typeBHours, 0)}h`, color: "text-purple-600" },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Preview Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/5">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {{ en: "Export Preview", "zh-TW": "匯出預覽", "zh-CN": "导出预览" }[langKey]}
          </span>
          <span className="text-xs text-muted-foreground">({exportData.length} {{ en: "records", "zh-TW": "筆", "zh-CN": "条" }[langKey]})</span>
        </div>
        {exportData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {{ en: "No certification data to export", "zh-TW": "暫無可匯出的認證資料", "zh-CN": "暂无可导出的认证数据" }[langKey]}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/5">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 whitespace-nowrap">Cert #</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 whitespace-nowrap">Holder</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 whitespace-nowrap">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 whitespace-nowrap">Issue Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 whitespace-nowrap">Expiry Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 whitespace-nowrap">Total CDU</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 whitespace-nowrap">A-Type</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 whitespace-nowrap">B-Type</th>
                </tr>
              </thead>
              <tbody>
                {exportData.slice(0, 50).map((row) => (
                  <tr key={row.certificationNumber} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-2 font-mono text-xs">{row.certificationNumber}</td>
                    <td className="px-4 py-2">
                      <div className="text-sm font-medium text-foreground">{row.holderName || "—"}</div>
                      <div className="text-[10px] text-muted-foreground">{row.holderEmail}</div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.certificationStatus === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {row.certificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{row.issueDate}</td>
                    <td className="px-4 py-2 text-muted-foreground">{row.expiryDate}</td>
                    <td className="px-4 py-2 font-semibold">{row.totalApprovedCduHours}h</td>
                    <td className="px-4 py-2 text-blue-600 font-medium">{row.typeAHours}h</td>
                    <td className="px-4 py-2 text-purple-600 font-medium">{row.typeBHours}h</td>
                  </tr>
                ))}
                {exportData.length > 50 && (
                  <tr><td colSpan={8} className="text-center py-2 text-xs text-muted-foreground">... {exportData.length - 50} {{ en: "more records", "zh-TW": "筆更多記錄", "zh-CN": "条更多记录" }[langKey]}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
