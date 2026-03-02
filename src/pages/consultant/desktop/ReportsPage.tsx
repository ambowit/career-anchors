import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Eye, Send, Search, CheckCircle2, X, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { useConsultantReports } from "@/hooks/useAdminData";
import { downloadHtmlAsPdf } from "@/lib/exportReport";

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
  const [previewReport, setPreviewReport] = useState<ReportRow | null>(null);
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

  const anchorFullLabels: Record<string, string> = {
    TF: language === "en" ? "Technical/Functional Competence" : language === "zh-TW" ? "技術/專業能力型" : "技术/专业能力型",
    GM: language === "en" ? "General Management" : "管理型",
    AU: language === "en" ? "Autonomy/Independence" : language === "zh-TW" ? "自主/獨立型" : "自主/独立型",
    SE: language === "en" ? "Security/Stability" : language === "zh-TW" ? "安全/穩定型" : "安全/稳定型",
    EC: language === "en" ? "Entrepreneurial Creativity" : language === "zh-TW" ? "創業/創造型" : "创业/创造型",
    SV: language === "en" ? "Service/Dedication" : language === "zh-TW" ? "服務/奉獻型" : "服务/奉献型",
    CH: language === "en" ? "Pure Challenge" : language === "zh-TW" ? "挑戰型" : "挑战型",
    LS: language === "en" ? "Lifestyle Integration" : "生活方式整合型",
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

  const generateReportHTML = (report: ReportRow): string => {
    const isEn = language === "en";
    const isZhTW = language === "zh-TW";
    const scores = report.scores;
    const sortedScores = Object.entries(scores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
    const topScore = sortedScores[0]?.[1] || 100;

    const scoreRows = sortedScores.map(([code, score]) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${anchorFullLabels[code] || code}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px;">
            <div style="width: 200px; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
              <div style="width: ${Math.min((score / topScore) * 100, 100)}%; height: 100%; background: ${score >= 80 ? '#22c55e' : score >= 65 ? '#eab308' : '#94a3b8'}; border-radius: 4px;"></div>
            </div>
            <span style="min-width: 40px; font-weight: 600;">${score.toFixed(0)}</span>
          </div>
        </td>
      </tr>
    `).join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${isEn ? "Career Anchor Assessment Report" : isZhTW ? "職業錨測評報告" : "职业锚测评报告"} — ${report.client}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Roboto, sans-serif;
      max-width: 800px; margin: 0 auto; padding: 40px 24px;
      background: #fff; color: #1a1a1a;
    }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <header style="text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #eee;">
    <h1 style="margin: 0; font-size: 28px; color: #1a365d;">${isEn ? "Career Anchor Assessment Report" : isZhTW ? "職業錨測評報告" : "职业锚测评报告"}</h1>
    <p style="margin: 8px 0 0; color: #64748b; font-size: 16px;">${report.client}</p>
    <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">${isEn ? "Assessment Date" : isZhTW ? "測評日期" : "测评日期"}: ${report.assessmentDate} | ${isEn ? "Report Date" : isZhTW ? "報告日期" : "报告日期"}: ${report.reportDate}</p>
  </header>

  <section style="margin-bottom: 32px;">
    <div style="display: flex; gap: 24px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 200px; padding: 24px; background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); border-radius: 12px; color: white;">
        <p style="margin: 0 0 8px; font-size: 14px; opacity: 0.8;">${isEn ? "High-Sensitivity Anchor" : isZhTW ? "高敏感錨" : "高敏感锚"}</p>
        <p style="margin: 0; font-size: 24px; font-weight: 700;">${anchorFullLabels[report.anchor] || report.anchor}</p>
        <p style="margin: 8px 0 0; font-size: 32px; font-weight: 800;">${(scores[report.anchor] || 0).toFixed(0)}</p>
      </div>
    </div>
  </section>

  <section style="margin-bottom: 32px;">
    <h2 style="margin: 0 0 16px; font-size: 18px; color: #334155;">${isEn ? "Dimension Scores" : isZhTW ? "維度得分" : "维度得分"}</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>${scoreRows}</tbody>
    </table>
  </section>

  <section style="margin-bottom: 32px; padding: 20px; background: #f0fdf4; border-radius: 12px;">
    <h3 style="margin: 0 0 12px; color: #166534;">${isEn ? "Consultant Notes" : isZhTW ? "諮詢師備註" : "咨询师备注"}</h3>
    <p style="margin: 0; color: #15803d; font-size: 14px; line-height: 1.8;">
      ${isEn ? `The client's primary career anchor is ${anchorFullLabels[report.anchor]}. This indicates a strong preference for this career orientation. Further discussion during consultation sessions is recommended to explore alignment with current career trajectory.` : isZhTW ? `客戶的主要職業錨為${anchorFullLabels[report.anchor]}，表明該維度在職業決策中佔據核心地位。建議在後續諮詢中進一步探討該錨定與當前職業發展路徑的匹配程度。` : `客户的主要职业锚为${anchorFullLabels[report.anchor]}，表明该维度在职业决策中占据核心地位。建议在后续咨询中进一步探讨该锚定与当前职业发展路径的匹配程度。`}
    </p>
  </section>

  <footer style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; text-align: center; color: #94a3b8; font-size: 12px;">
    <p>SCPC Career Anchor Assessment System — ${isEn ? "Consultant Report" : isZhTW ? "諮詢師報告" : "咨询师报告"}</p>
  </footer>
</body>
</html>`.trim();
  };

  const handleDownload = async (report: ReportRow) => {
    const html = generateReportHTML(report);
    try {
      
      const pdfFilename = `${report.client}-${language === "en" ? "report" : language === "zh-TW" ? "測評報告" : "测评报告"}-${report.assessmentDate}.pdf`;
      await downloadHtmlAsPdf(html, pdfFilename);
      toast.success(language === "en" ? "Report downloaded" : language === "zh-TW" ? "報告已下載" : "报告已下载");
    } catch {
      toast.error(language === "en" ? "Download failed" : language === "zh-TW" ? "下載失敗" : "下载失败");
    }
  };

  const handlePreview = (report: ReportRow) => {
    setPreviewReport(report);
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
      <div className="grid grid-cols-3 gap-5 mb-6">
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
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "High-Sens Anchor" : language === "zh-TW" ? "高敏感錨" : "高敏感锚"}</th>
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
                        className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors"
                        title={language === "en" ? "Download" : language === "zh-TW" ? "下載" : "下载"}
                      >
                        <Download className="w-4 h-4" />
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
        {previewReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
            onClick={() => setPreviewReport(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-foreground text-sm">{previewReport.client}</div>
                    <div className="text-xs text-muted-foreground">{anchorLabels[previewReport.anchor]} · {previewReport.assessmentDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(previewReport)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {language === "en" ? "Download" : language === "zh-TW" ? "下載" : "下载"}
                  </button>
                  <button onClick={() => setPreviewReport(null)} className="p-1.5 hover:bg-muted/20 rounded-lg">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <iframe
                  srcDoc={generateReportHTML(previewReport)}
                  className="w-full h-full min-h-[60vh] border-0"
                  title="Report Preview"
                />
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
