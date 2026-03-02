import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Upload, FileSpreadsheet, Users, Zap, CheckCircle2,
  AlertCircle, X, Download,
} from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import {
  useAllCertifications, useAllCourseCatalog, useBatchAssignATypeCdu,
  useIssueCertification, type CourseCatalogEntry,
} from "@/hooks/useCertification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TabId = "csv-import" | "batch-cdu" | "export-renewal";

export default function BatchOperationsPage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const [activeTab, setActiveTab] = useState<TabId>("csv-import");

  const tabs: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
    { id: "csv-import", label: { en: "CSV Import", "zh-TW": "CSV 匯入", "zh-CN": "CSV 导入" }[langKey]!, icon: Upload },
    { id: "batch-cdu", label: { en: "Batch A-Type CDU", "zh-TW": "批次 A 類 CDU", "zh-CN": "批量 A 类 CDU" }[langKey]!, icon: Zap },
    { id: "export-renewal", label: { en: "Export Renewal List", "zh-TW": "匯出換證名單", "zh-CN": "导出换证名单" }[langKey]!, icon: Download },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {{ en: "Batch Operations", "zh-TW": "批次操作", "zh-CN": "批量操作" }[langKey]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {{ en: "CSV import, batch CDU assignment, and bulk data export", "zh-TW": "CSV 匯入、批次 CDU 派發與大量資料匯出", "zh-CN": "CSV 导入、批量 CDU 派发与批量数据导出" }[langKey]}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 mb-6 border-b border-border pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/20"}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "csv-import" && <CsvImportPanel langKey={langKey} />}
      {activeTab === "batch-cdu" && <BatchCduPanel langKey={langKey} />}
      {activeTab === "export-renewal" && <ExportRenewalPanel langKey={langKey} />}
    </div>
  );
}

// ==================== CSV Import Panel ====================

function CsvImportPanel({ langKey }: { langKey: string }) {
  const [csvData, setCsvData] = useState<Array<Record<string, string>>>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "preview" | "importing" | "done">("idle");
  const [importResults, setImportResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const issueMutation = useIssueCertification();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        toast.error({ en: "CSV file must have at least a header and one data row", "zh-TW": "CSV 文件至少需要標題行和一行數據", "zh-CN": "CSV 文件至少需要标题行和一行数据" }[langKey]!);
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((header, index) => { row[header] = values[index] || ""; });
        return row;
      });
      setCsvHeaders(headers);
      setCsvData(rows);
      setImportStatus("preview");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImportStatus("importing");
    let successCount = 0;
    let failedCount = 0;

    for (const row of csvData) {
      const userId = row["userId"] || row["user_id"] || "";
      const certType = row["certType"] || row["certification_type"] || "scpc_professional";
      const orgId = row["orgId"] || row["organization_id"] || "";
      if (!userId) { failedCount++; continue; }

      try {
        await issueMutation.mutateAsync({
          userId,
          certificationType: certType,
          organizationId: orgId || undefined,
        });
        successCount++;
      } catch {
        failedCount++;
      }
    }

    setImportResults({ success: successCount, failed: failedCount });
    setImportStatus("done");
    toast.success(
      { en: `Import complete: ${successCount} success, ${failedCount} failed`, "zh-TW": `匯入完成：${successCount} 成功，${failedCount} 失敗`, "zh-CN": `导入完成：${successCount} 成功，${failedCount} 失败` }[langKey]!
    );
  };

  const downloadTemplate = () => {
    const csvContent = "userId,certType,orgId\nuser-uuid-here,scpc_professional,org-uuid-here";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "certification_import_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">
            {{ en: "CSV Certification Import", "zh-TW": "CSV 認證匯入", "zh-CN": "CSV 认证导入" }[langKey]}
          </h3>
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/10 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/20 transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {{ en: "Download Template", "zh-TW": "下載模板", "zh-CN": "下载模板" }[langKey]}
          </button>
        </div>

        {importStatus === "idle" && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-sky-300 transition-colors"
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">
              {{ en: "Click or drag CSV file here", "zh-TW": "點擊或拖曳 CSV 文件到此處", "zh-CN": "点击或拖拽 CSV 文件到此处" }[langKey]}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {{ en: "Required columns: userId, certType, orgId", "zh-TW": "必要欄位：userId, certType, orgId", "zh-CN": "必要列：userId, certType, orgId" }[langKey]}
            </p>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </div>
        )}

        {importStatus === "preview" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">
                {{ en: `${csvData.length} rows loaded`, "zh-TW": `已載入 ${csvData.length} 行`, "zh-CN": `已加载 ${csvData.length} 行` }[langKey]}
              </span>
            </div>
            <div className="border border-border rounded-lg overflow-hidden max-h-60 overflow-y-auto mb-4">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/10 border-b border-border">{csvHeaders.map((h) => <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
                <tbody>
                  {csvData.slice(0, 10).map((row, index) => (
                    <tr key={index} className="border-b border-border/50">{csvHeaders.map((h) => <td key={h} className="px-3 py-1.5 text-foreground">{row[h]}</td>)}</tr>
                  ))}
                  {csvData.length > 10 && <tr><td colSpan={csvHeaders.length} className="px-3 py-2 text-center text-muted-foreground">... {csvData.length - 10} more</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setImportStatus("idle"); setCsvData([]); setCsvHeaders([]); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {{ en: "Cancel", "zh-TW": "取消", "zh-CN": "取消" }[langKey]}
              </button>
              <button onClick={handleImport} className="px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
                {{ en: `Import ${csvData.length} Records`, "zh-TW": `匯入 ${csvData.length} 筆記錄`, "zh-CN": `导入 ${csvData.length} 条记录` }[langKey]}
              </button>
            </div>
          </div>
        )}

        {importStatus === "importing" && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{{ en: "Importing...", "zh-TW": "匯入中...", "zh-CN": "导入中..." }[langKey]}</p>
          </div>
        )}

        {importStatus === "done" && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
            <p className="text-lg font-bold text-foreground mb-1">
              {{ en: "Import Complete", "zh-TW": "匯入完成", "zh-CN": "导入完成" }[langKey]}
            </p>
            <p className="text-sm text-muted-foreground">
              {{ en: `${importResults.success} success, ${importResults.failed} failed`, "zh-TW": `${importResults.success} 成功，${importResults.failed} 失敗`, "zh-CN": `${importResults.success} 成功，${importResults.failed} 失败` }[langKey]}
            </p>
            <button onClick={() => { setImportStatus("idle"); setCsvData([]); setCsvHeaders([]); }} className="mt-4 px-4 py-2 bg-muted/10 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/20 transition-colors">
              {{ en: "Import More", "zh-TW": "繼續匯入", "zh-CN": "继续导入" }[langKey]}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ==================== Batch A-Type CDU Panel ====================

function BatchCduPanel({ langKey }: { langKey: string }) {
  const { data: courses = [] } = useAllCourseCatalog();
  const { data: certifications = [] } = useAllCertifications();
  const batchAssignMutation = useBatchAssignATypeCdu();

  const officialCourses = courses.filter((c) => c.is_official && c.is_active);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedUserCertPairs, setSelectedUserCertPairs] = useState<Array<{ userId: string; certificationId: string }>>([]);
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0]);
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

  const selectedCourse = officialCourses.find((c) => c.id === selectedCourseId);
  const activeCerts = certifications.filter((c) => c.certification_status === "active" || c.certification_status === "pending_renewal");

  const togglePair = (userId: string, certificationId: string) => {
    setSelectedUserCertPairs((prev) => {
      const exists = prev.some((p) => p.userId === userId && p.certificationId === certificationId);
      if (exists) return prev.filter((p) => !(p.userId === userId && p.certificationId === certificationId));
      return [...prev, { userId, certificationId }];
    });
  };

  const selectAll = () => {
    if (selectedUserCertPairs.length === activeCerts.length) {
      setSelectedUserCertPairs([]);
    } else {
      setSelectedUserCertPairs(activeCerts.map((c) => ({ userId: c.user_id, certificationId: c.id })));
    }
  };

  const handleBatchAssign = async () => {
    if (!selectedCourse || selectedUserCertPairs.length === 0) return;
    await batchAssignMutation.mutateAsync({
      userCertPairs: selectedUserCertPairs,
      courseId: selectedCourse.id,
      courseName: selectedCourse.course_name,
      courseProvider: selectedCourse.course_provider,
      cduHours: selectedCourse.cdu_hours,
      activityDate,
    });
    toast.success(
      { en: `A-Type CDU assigned to ${selectedUserCertPairs.length} users`, "zh-TW": `A 類 CDU 已派發給 ${selectedUserCertPairs.length} 位使用者`, "zh-CN": `A 类 CDU 已派发给 ${selectedUserCertPairs.length} 位用户` }[langKey]!
    );
    setSelectedUserCertPairs([]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">
          {{ en: "Batch Assign A-Type CDU", "zh-TW": "批次派發 A 類 CDU", "zh-CN": "批量派发 A 类 CDU" }[langKey]}
        </h3>

        {/* Select Course */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            {{ en: "Select Official Course", "zh-TW": "選擇官方課程", "zh-CN": "选择官方课程" }[langKey]}
          </label>
          <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm">
            <option value="">{{ en: "-- Select Course --", "zh-TW": "-- 選擇課程 --", "zh-CN": "-- 选择课程 --" }[langKey]}</option>
            {officialCourses.map((course) => (
              <option key={course.id} value={course.id}>{course.course_code} - {course.course_name} ({course.cdu_hours}h)</option>
            ))}
          </select>
        </div>

        {selectedCourse && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-blue-800">{selectedCourse.course_name}</div>
              <div className="text-xs text-blue-600">{selectedCourse.course_provider} · {selectedCourse.cdu_hours}h · {selectedCourse.course_code}</div>
            </div>
          </div>
        )}

        {/* Activity Date */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            {{ en: "Activity Date", "zh-TW": "活動日期", "zh-CN": "活动日期" }[langKey]}
          </label>
          <input type="date" value={activityDate} onChange={(e) => setActivityDate(e.target.value)} className="w-60 px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
        </div>

        {/* Select Users */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              {{ en: "Select Certified Users", "zh-TW": "選擇認證使用者", "zh-CN": "选择认证用户" }[langKey]}
              <span className="text-xs text-muted-foreground ml-2">({selectedUserCertPairs.length}/{activeCerts.length})</span>
            </label>
            <button onClick={selectAll} className="text-xs text-sky-600 hover:text-sky-700">
              {selectedUserCertPairs.length === activeCerts.length ? { en: "Deselect All", "zh-TW": "取消全選", "zh-CN": "取消全选" }[langKey] : { en: "Select All", "zh-TW": "全選", "zh-CN": "全选" }[langKey]}
            </button>
          </div>
          <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
            {activeCerts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                {{ en: "No active certifications found", "zh-TW": "暫無有效認證", "zh-CN": "暂无有效认证" }[langKey]}
              </div>
            ) : (
              activeCerts.map((cert) => {
                const profile = profileMap[cert.user_id];
                const isSelected = selectedUserCertPairs.some((p) => p.userId === cert.user_id && p.certificationId === cert.id);
                return (
                  <div key={cert.id} onClick={() => togglePair(cert.user_id, cert.id)} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-border/50 last:border-0 transition-colors ${isSelected ? "bg-sky-50" : "hover:bg-muted/5"}`}>
                    <input type="checkbox" checked={isSelected} readOnly className="rounded border-border pointer-events-none" />
                    <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-xs flex-shrink-0">
                      {(profile?.full_name || "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{profile?.full_name || cert.user_id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">{cert.certification_number}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cert.certification_status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {cert.certification_status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <button
          onClick={handleBatchAssign}
          disabled={!selectedCourse || selectedUserCertPairs.length === 0 || batchAssignMutation.isPending}
          className="px-5 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {batchAssignMutation.isPending
            ? { en: "Assigning...", "zh-TW": "派發中...", "zh-CN": "派发中..." }[langKey]
            : { en: `Assign to ${selectedUserCertPairs.length} Users`, "zh-TW": `派發給 ${selectedUserCertPairs.length} 位使用者`, "zh-CN": `派发给 ${selectedUserCertPairs.length} 位用户` }[langKey]}
        </button>
      </div>
    </motion.div>
  );
}

// ==================== Export Renewal List Panel ====================

function ExportRenewalPanel({ langKey }: { langKey: string }) {
  const { data: certifications = [] } = useAllCertifications();
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });
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

  const dueForRenewal = useMemo(() => {
    return certifications.filter((c) => {
      const expiry = new Date(c.expiry_date);
      return expiry >= new Date(dateFrom) && expiry <= new Date(dateTo);
    });
  }, [certifications, dateFrom, dateTo]);

  const handleExport = () => {
    const headers = ["Certification Number", "Holder Name", "Email", "Type", "Status", "Issue Date", "Expiry Date", "Min CDU Hours"];
    const rows = dueForRenewal.map((c) => {
      const profile = profileMap[c.user_id];
      return [
        c.certification_number,
        profile?.full_name || "",
        profile?.email || "",
        c.certification_type,
        c.certification_status,
        c.issue_date,
        c.expiry_date,
        String(c.minimum_cdu_hours),
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `renewal_list_${dateFrom}_to_${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success({ en: "Renewal list exported", "zh-TW": "換證名單已匯出", "zh-CN": "换证名单已导出" }[langKey]!);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">
          {{ en: "Export Renewal Due List", "zh-TW": "匯出到期換證名單", "zh-CN": "导出到期换证名单" }[langKey]}
        </h3>
        <div className="flex items-center gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "From", "zh-TW": "從", "zh-CN": "从" }[langKey]}</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "To", "zh-TW": "到", "zh-CN": "到" }[langKey]}</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
          </div>
          <div className="self-end">
            <span className="text-sm font-medium text-foreground">
              {{ en: `${dueForRenewal.length} certifications due`, "zh-TW": `${dueForRenewal.length} 張認證到期`, "zh-CN": `${dueForRenewal.length} 张认证到期` }[langKey]}
            </span>
          </div>
        </div>

        {dueForRenewal.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden max-h-72 overflow-y-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/5 border-b border-border">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{{ en: "Cert #", "zh-TW": "證書編號", "zh-CN": "证书编号" }[langKey]}</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{{ en: "Name", "zh-TW": "姓名", "zh-CN": "姓名" }[langKey]}</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{{ en: "Expiry", "zh-TW": "到期日", "zh-CN": "到期日" }[langKey]}</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{{ en: "Status", "zh-TW": "狀態", "zh-CN": "状态" }[langKey]}</th>
                </tr>
              </thead>
              <tbody>
                {dueForRenewal.map((cert) => {
                  const profile = profileMap[cert.user_id];
                  return (
                    <tr key={cert.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{cert.certification_number}</td>
                      <td className="px-4 py-2">{profile?.full_name || "—"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{cert.expiry_date}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cert.certification_status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {cert.certification_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <button onClick={handleExport} disabled={dueForRenewal.length === 0} className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
          <Download className="w-4 h-4" />
          {{ en: "Export CSV", "zh-TW": "匯出 CSV", "zh-CN": "导出 CSV" }[langKey]}
        </button>
      </div>
    </motion.div>
  );
}
