import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Eye, Send, Search, CheckCircle2, X, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { useConsultantReports } from "@/hooks/useAdminData";
import { downloadV3ReportAsPdf, assessmentResultToV3Params } from "@/lib/reportV3Download";
import { generateV3Report } from "@/lib/reportV3Generator";
import type { LangKey } from "@/lib/reportDataFetcher";

interface ReportRow {
  id: string;
  client: string;
  clientEmail: string;
  anchor: string;
  assessmentDate: string;
  reportDate: string;
  status: "ready" | "sent";
  sentTo?: string;
  scores: Record<string, number>;
}

export default function ConsultantReportsPage() {
  const { language } = useTranslation();
  const { data: rawReports, isLoading } = useConsultantReports();
  const [searchQuery, setSearchQuery] = useState("");
  const [previewReportMeta, setPreviewReportMeta] = useState<ReportRow | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendingReport, setSendingReport] = useState<ReportRow | null>(null);
  const [sendEmail, setSendEmail] = useState("");

  const anchorColors: Record<string, string> = {
    TF: "bg-blue-50 text-blue-600",
    GM: "bg-red-50 text-red-600",
    AU: "bg-amber-50 text-amber-600",
    SE: "bg-green-50 text-green-600",
    EC: "bg-purple-50 text-purple-600",
    SV: "bg-pink-50 text-pink-600",
    CH: "bg-orange-50 text-orange-600",
    LS: "bg-cyan-50 text-cyan-600",
  };

  const anchorLabels: Record<string, string> = {
    TF: language === "en" ? "Technical" : language === "zh-TW" ? "技術型" : "技术型",
    GM: language === "en" ? "Management" : "管理型",
    AU: language === "en" ? "Autonomy" : "自主型",
    SE: language === "en" ? "Security" : "安全型",
    EC: language === "en" ? "Entrepreneurial" : language === "zh-TW" ? "創業型" : "创业型",
    SV: language === "en" ? "Service" : language === "zh-TW" ? "服務型" : "服务型",
    CH: language === "en" ? "Challenge" : language === "zh-TW" ? "挑戰型" : "挑战型",
    LS: language === "en" ? "Lifestyle" : "生活型",
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().slice(0, 10);
  };

  const reports: ReportRow[] = (rawReports || []).map((record) => ({
    id: record.id,
    client: record.clientName || record.clientEmail || "-",
    clientEmail: record.clientEmail || "",
    anchor: record.main_anchor || "TF",
    assessmentDate: formatDate(record.created_at),
    reportDate: record.sentDate ? formatDate(record.sentDate) : formatDate(record.created_at),
    status: record.isSent ? "sent" : "ready",
    sentTo: record.isSent ? record.clientEmail : undefined,
    scores: {
      TF: Number(record.score_tf) || 0,
      GM: Number(record.score_gm) || 0,
      AU: Number(record.score_au) || 0,
      SE: Number(record.score_se) || 0,
      EC: Number(record.score_ec) || 0,
      SV: Number(record.score_sv) || 0,
      CH: Number(record.score_ch) || 0,
      LS: Number(record.score_ls) || 0,
    },
  }));

  const statusLabels: Record<string, { label: string; color: string }> = {
    ready: { label: language === "en" ? "Ready" : language === "zh-TW" ? "待傳送" : "待发送", color: "bg-emerald-50 text-emerald-600" },
    sent: { label: language === "en" ? "Sent" : language === "zh-TW" ? "已傳送" : "已发送", color: "bg-blue-50 text-blue-600" },
  };

  const filteredReports = reports.filter((report) => !searchQuery || report.client.toLowerCase().includes(searchQuery.toLowerCase()));



  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (report: ReportRow) => {
    setDownloadingId(report.id);
    try {
      // Find the raw record to get user_id for V3 params
      const rawRecord = (rawReports || []).find((r) => r.id === report.id);
      if (!rawRecord) throw new Error("Record not found");

      const v3Params = assessmentResultToV3Params(
        rawRecord as any,
        report.client,
        "mid",
        null,
        language as LangKey,
      );
      await downloadV3ReportAsPdf(v3Params);
      toast.success(language === "en" ? "Report downloaded" : language === "zh-TW" ? "報告已下載" : "报告已下载");
    } catch {
      toast.error(language === "en" ? "Download failed" : language === "zh-TW" ? "下載失敗" : "下载失败");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (report: ReportRow) => {
    setPreviewReportMeta(report);
    setPreviewHtml(null);
    setPreviewLoading(true);
    try {
      const rawRecord = (rawReports || []).find((r) => r.id === report.id);
      if (!rawRecord) throw new Error("Record not found");
      const v3Params = assessmentResultToV3Params(
        rawRecord as any,
        report.client,
        "mid",
        null,
        language as LangKey,
      );
      const output = await generateV3Report(
        {
          scores: v3Params.scores,
          careerStage: v3Params.careerStage,
          userName: v3Params.userName,
          workExperienceYears: v3Params.workExperienceYears,
          userId: v3Params.userId,
          reportVersion: "professional",
          reportType: "career_anchor",
        },
        v3Params.language || "zh-CN",
        undefined,
        { showWeights: false },
      );
      setPreviewHtml(output.bodyHtml);
    } catch {
      toast.error(language === "en" ? "Preview failed" : language === "zh-TW" ? "預覽失敗" : "预览失败");
      setPreviewReportMeta(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = (report: ReportRow) => {
    setSendEmail(report.sentTo || report.clientEmail || "");
    setSendingReport(report);
  };

  const confirmSend = () => {
    if (!sendEmail.trim()) {
      toast.error(language === "en" ? "Please enter an email address" : language === "zh-TW" ? "請輸入電子郵件地址" : "请输入邮箱地址");
      return;
    }
    toast.success(
      language === "en"
        ? `Report sent to ${sendEmail}`
        : language === "zh-TW" ? `報告已傳送至 ${sendEmail}`
        : `报告已发送至 ${sendEmail}`
    );
    setSendingReport(null);
    setSendEmail("");
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
          <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "Client Reports" : language === "zh-TW" ? "客戶報告" : "客户报告"}</h1>
          <p className="text-sm text-muted-foreground">{language === "en" ? "View, download, and share client assessment reports" : language === "zh-TW" ? "檢視、下載和分享客戶測評報告" : "查看、下载和分享客户测评报告"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><FileText className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-bold text-foreground">{reports.length}</div>
            <div className="text-xs text-muted-foreground">{language === "en" ? "Total Reports" : language === "zh-TW" ? "報告總數" : "报告总数"}</div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Send className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-bold text-foreground">{reports.filter((reportRow) => reportRow.status === "sent").length}</div>
            <div className="text-xs text-muted-foreground">{language === "en" ? "Sent to Clients" : language === "zh-TW" ? "已傳送" : "已发送"}</div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><Download className="w-5 h-5" /></div>
          <div>
            <div className="text-xl font-bold text-foreground">{reports.filter((reportRow) => reportRow.status === "ready").length}</div>
            <div className="text-xs text-muted-foreground">{language === "en" ? "Pending Send" : language === "zh-TW" ? "待傳送" : "待发送"}</div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={language === "en" ? "Search by client name..." : language === "zh-TW" ? "搜尋客戶姓名..." : "搜索客户姓名..."} className="w-full pl-9 pr-4 py-2 bg-muted/10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
      </div>

      {/* Reports Table */}
      {reports.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{language === "en" ? "No client reports yet" : language === "zh-TW" ? "暫無客戶報告" : "暂无客户报告"}</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Client" : language === "zh-TW" ? "客戶" : "客户"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Core Anchor" : language === "zh-TW" ? "核心錨" : "核心锚"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Assessment Date" : language === "zh-TW" ? "測評日期" : "测评日期"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Report Date" : language === "zh-TW" ? "報告日期" : "报告日期"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Status" : language === "zh-TW" ? "狀態" : "状态"}</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Actions" : "操作"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">{report.client[0]}</div>
                      <div>
                        <span className="text-sm font-medium text-foreground block">{report.client}</span>
                        {report.clientEmail && <span className="text-[11px] text-muted-foreground">{report.clientEmail}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${anchorColors[report.anchor] || "bg-muted text-muted-foreground"}`}>{anchorLabels[report.anchor] || report.anchor}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{report.assessmentDate}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{report.reportDate}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusLabels[report.status].color}`}>{statusLabels[report.status].label}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handlePreview(report)}
                        className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors"
                        title={language === "en" ? "View" : language === "zh-TW" ? "檢視" : "查看"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(report)}
                        disabled={downloadingId === report.id}
                        className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        title={language === "en" ? "Complete Report" : language === "zh-TW" ? "完整報告" : "完整报告"}
                      >
                        {downloadingId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </button>
                      {report.status === "ready" && (
                        <button
                          onClick={() => handleSend(report)}
                          className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-emerald-500 transition-colors"
                          title={language === "en" ? "Send to Client" : language === "zh-TW" ? "傳送給客戶" : "发送给客户"}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Report Preview Modal */}
      <AnimatePresence>
        {previewReportMeta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
            onClick={() => { setPreviewReportMeta(null); setPreviewHtml(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-foreground text-sm">{previewReportMeta.client}</div>
                    <div className="text-xs text-muted-foreground">{anchorLabels[previewReportMeta.anchor]} · {previewReportMeta.assessmentDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(previewReportMeta)}
                    disabled={downloadingId === previewReportMeta.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {downloadingId === previewReportMeta.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {language === "en" ? "Complete Report" : language === "zh-TW" ? "完整報告" : "完整报告"}
                  </button>
                  <button onClick={() => { setPreviewReportMeta(null); setPreviewHtml(null); }} className="p-1.5 hover:bg-muted/20 rounded-lg">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {previewLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <p className="text-sm text-muted-foreground">
                      {language === "en" ? "Generating report preview..." : language === "zh-TW" ? "正在生成報告預覽..." : "正在生成报告预览..."}
                    </p>
                  </div>
                ) : previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full min-h-[70vh] border-0"
                    title="Report Preview"
                  />
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Report Modal */}
      <AnimatePresence>
        {sendingReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSendingReport(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">{language === "en" ? "Send Report" : language === "zh-TW" ? "傳送報告" : "发送报告"}</h3>
                <button onClick={() => setSendingReport(null)} className="p-1 rounded-lg hover:bg-muted/20">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="mb-4 p-3 bg-muted/10 rounded-lg">
                <div className="text-sm font-medium text-foreground">{sendingReport.client}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {anchorLabels[sendingReport.anchor]} · {sendingReport.assessmentDate}
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {language === "en" ? "Recipient Email" : language === "zh-TW" ? "收件人電子郵件" : "收件人邮箱"}
                </label>
                <input
                  type="email"
                  value={sendEmail}
                  onChange={(event) => setSendEmail(event.target.value)}
                  placeholder={language === "en" ? "client@example.com" : language === "zh-TW" ? "客戶電子郵件地址" : "客户邮箱地址"}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <label className="flex items-center gap-2 mb-5 text-sm text-muted-foreground">
                <input type="checkbox" defaultChecked className="rounded" />
                {language === "en" ? "Include PDF attachment" : language === "zh-TW" ? "附帶PDF附件" : "附带PDF附件"}
              </label>
              <div className="flex justify-end gap-3">
                <button onClick={() => setSendingReport(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {language === "en" ? "Cancel" : "取消"}
                </button>
                <button
                  onClick={confirmSend}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {language === "en" ? "Send" : language === "zh-TW" ? "傳送" : "发送"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
