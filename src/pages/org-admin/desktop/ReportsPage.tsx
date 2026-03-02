import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, FileSpreadsheet, Filter, Calendar, Clock, User, Building2, CheckCircle2, X, Archive } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";

interface ExportRecord {
  id: string;
  filename: string;
  type: "pdf" | "excel" | "csv";
  scope: string;
  createdBy: string;
  createdAt: string;
  size: string;
  status: "completed" | "processing";
}

export default function OrgReportsPage() {
  const { language } = useTranslation();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "csv">("pdf");
  const [exportScope, setExportScope] = useState<"individual" | "department" | "organization">("individual");

  const exportHistory: ExportRecord[] = [
    { id: "1", filename: language === "en" ? "Feb 2026 Individual Reports.pdf" : language === "zh-TW" ? "2026年2月個人報告集.pdf" : "2026年2月个人报告集.pdf", type: "pdf", scope: language === "en" ? "Individual" : language === "zh-TW" ? "個人" : "个人", createdBy: language === "en" ? "Zhang Wei" : language === "zh-TW" ? "張偉" : "张伟", createdAt: "2026-02-24 14:30", size: "2.4 MB", status: "completed" },
    { id: "2", filename: language === "en" ? "Engineering Dept Summary.xlsx" : language === "zh-TW" ? "工程部彙總報告.xlsx" : "工程部汇总报告.xlsx", type: "excel", scope: language === "en" ? "Department" : language === "zh-TW" ? "部門" : "部门", createdBy: language === "en" ? "Li Na" : language === "zh-TW" ? "李娜" : "李娜", createdAt: "2026-02-22 09:15", size: "856 KB", status: "completed" },
    { id: "3", filename: language === "en" ? "Q1 Organization Report.csv" : language === "zh-TW" ? "Q1機構整體報告.csv" : "Q1机构整体报告.csv", type: "csv", scope: language === "en" ? "Organization" : language === "zh-TW" ? "機構" : "机构", createdBy: language === "en" ? "Wang Fang" : language === "zh-TW" ? "王芳" : "王芳", createdAt: "2026-02-20 16:45", size: "1.2 MB", status: "completed" },
    { id: "4", filename: language === "en" ? "Sales Dept Analysis.pdf" : language === "zh-TW" ? "銷售部分析報告.pdf" : "销售部分析报告.pdf", type: "pdf", scope: language === "en" ? "Department" : language === "zh-TW" ? "部門" : "部门", createdBy: language === "en" ? "Zhang Wei" : language === "zh-TW" ? "張偉" : "张伟", createdAt: "2026-02-18 11:20", size: "1.8 MB", status: "completed" },
    { id: "5", filename: language === "en" ? "New Employee Assessment.xlsx" : language === "zh-TW" ? "新員工測評彙總.xlsx" : "新员工测评汇总.xlsx", type: "excel", scope: language === "en" ? "Individual" : language === "zh-TW" ? "個人" : "个人", createdBy: language === "en" ? "Li Na" : language === "zh-TW" ? "李娜" : "李娜", createdAt: "2026-02-15 13:50", size: "420 KB", status: "processing" },
  ];

  const [scopePreset, setScopePreset] = useState(false);

  const openExportWithScope = (scope: "individual" | "department" | "organization" | null) => {
    if (scope) {
      setExportScope(scope);
      setScopePreset(true);
    } else {
      setScopePreset(false);
    }
    setShowExportModal(true);
  };

  const quickActions = [
    { label: language === "en" ? "Export All Completed" : language === "zh-TW" ? "匯出所有已完成" : "导出所有已完成", desc: language === "en" ? "Export all completed individual reports" : language === "zh-TW" ? "匯出所有已完成的個人測評報告" : "导出所有已完成的个人测评报告", icon: CheckCircle2, color: "#10b981", scope: "individual" as const },
    { label: language === "en" ? "Department Summary" : language === "zh-TW" ? "部門彙總報告" : "部门汇总报告", desc: language === "en" ? "Export summary by department" : language === "zh-TW" ? "按部門匯出彙總分析報告" : "按部门导出汇总分析报告", icon: Building2, color: "#3b82f6", scope: "department" as const },
    { label: language === "en" ? "Custom Selection" : language === "zh-TW" ? "自定義選擇匯出" : "自定义选择导出", desc: language === "en" ? "Select specific users or criteria" : language === "zh-TW" ? "自訂選擇使用者或篩選條件" : "自定义选择用户或筛选条件", icon: Filter, color: "#8b5cf6", scope: null },
  ];

  const formatIcons: Record<string, typeof FileText> = {
    pdf: FileText,
    excel: FileSpreadsheet,
    csv: Archive,
  };

  const formatColors: Record<string, string> = {
    pdf: "text-red-500 bg-red-50",
    excel: "text-green-600 bg-green-50",
    csv: "text-blue-500 bg-blue-50",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "Reports & Export" : language === "zh-TW" ? "報告與匯出" : "报告与导出"}</h1>
          <p className="text-sm text-muted-foreground">{language === "en" ? "Generate and export assessment reports in various formats" : language === "zh-TW" ? "生成和匯出各類測評報告" : "生成和导出各类测评报告"}</p>
        </div>
        <button onClick={() => openExportWithScope(null)} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors">
          <Download className="w-4 h-4" />
          {language === "en" ? "New Export" : language === "zh-TW" ? "新建匯出" : "新建导出"}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={() => openExportWithScope(action.scope)}
            className="bg-card border border-border rounded-xl p-5 text-left hover:border-sky-300 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${action.color}18`, color: action.color }}>
              <action.icon className="w-5 h-5" />
            </div>
            <div className="font-semibold text-foreground text-sm mb-1 group-hover:text-sky-600 transition-colors">{action.label}</div>
            <div className="text-xs text-muted-foreground">{action.desc}</div>
          </motion.button>
        ))}
      </div>

      {/* Export History */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-sm">{language === "en" ? "Export History" : language === "zh-TW" ? "匯出歷史" : "导出历史"}</h3>
          <span className="text-xs text-muted-foreground ml-1">({exportHistory.length})</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground pb-3">{language === "en" ? "File" : language === "zh-TW" ? "文件" : "文件"}</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-3">{language === "en" ? "Format" : language === "zh-TW" ? "格式" : "格式"}</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-3">{language === "en" ? "Scope" : language === "zh-TW" ? "範圍" : "范围"}</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-3">{language === "en" ? "Created By" : language === "zh-TW" ? "建立者" : "创建者"}</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-3">{language === "en" ? "Date" : language === "zh-TW" ? "日期" : "日期"}</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-3">{language === "en" ? "Size" : language === "zh-TW" ? "大小" : "大小"}</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3">{language === "en" ? "Action" : language === "zh-TW" ? "操作" : "操作"}</th>
            </tr>
          </thead>
          <tbody>
            {exportHistory.map((record) => {
              const FormatIcon = formatIcons[record.type];
              return (
                <tr key={record.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                  <td className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formatColors[record.type]}`}>
                        <FormatIcon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{record.filename}</span>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase">{record.type}</span>
                  </td>
                  <td className="py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 font-medium">{record.scope}</span>
                  </td>
                  <td className="py-3.5 text-sm text-muted-foreground">{record.createdBy}</td>
                  <td className="py-3.5 text-sm text-muted-foreground">{record.createdAt}</td>
                  <td className="py-3.5 text-sm text-muted-foreground">{record.size}</td>
                  <td className="py-3.5 text-right">
                    {record.status === "completed" ? (
                      <button className="text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-xs text-amber-500 font-medium">{language === "en" ? "Processing..." : language === "zh-TW" ? "生成中..." : "生成中..."}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowExportModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 w-[520px] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">{language === "en" ? "Export Report" : language === "zh-TW" ? "匯出報告" : "导出报告"}</h3>
                <button onClick={() => setShowExportModal(false)} className="p-1 rounded-lg hover:bg-muted/20 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Scope Selection — shown as editable selector, or as a locked badge when pre-set via quick action */}
              <div className="mb-5">
                <label className="text-sm font-medium text-foreground mb-2 block">{language === "en" ? "Export Scope" : language === "zh-TW" ? "匯出範圍" : "导出范围"}</label>
                {scopePreset ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-sky-500 bg-sky-50 text-sky-700 text-sm font-medium">
                      {exportScope === "individual" ? <User className="w-4 h-4" /> : exportScope === "department" ? <Building2 className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                      {exportScope === "individual" ? (language === "en" ? "Individual" : language === "zh-TW" ? "個人報告" : "个人报告") : exportScope === "department" ? (language === "en" ? "Department" : language === "zh-TW" ? "部門彙總" : "部门汇总") : (language === "en" ? "Organization" : language === "zh-TW" ? "機構整體" : "机构整体")}
                    </div>
                    <button onClick={() => setScopePreset(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">
                      {language === "en" ? "Change" : language === "zh-TW" ? "更改" : "更改"}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: "individual" as const, label: language === "en" ? "Individual" : language === "zh-TW" ? "個人報告" : "个人报告", icon: User },
                      { key: "department" as const, label: language === "en" ? "Department" : language === "zh-TW" ? "部門彙總" : "部门汇总", icon: Building2 },
                      { key: "organization" as const, label: language === "en" ? "Organization" : language === "zh-TW" ? "機構整體" : "机构整体", icon: Calendar },
                    ]).map((scope) => (
                      <button
                        key={scope.key}
                        onClick={() => setExportScope(scope.key)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${exportScope === scope.key ? "border-sky-500 bg-sky-50 text-sky-700" : "border-border text-muted-foreground hover:border-sky-300"}`}
                      >
                        <scope.icon className="w-4 h-4" />
                        {scope.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Format Selection */}
              <div className="mb-5">
                <label className="text-sm font-medium text-foreground mb-2 block">{language === "en" ? "File Format" : language === "zh-TW" ? "文件格式" : "文件格式"}</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: "pdf" as const, label: "PDF", desc: language === "en" ? "Rich report" : language === "zh-TW" ? "完整報告" : "完整报告" },
                    { key: "excel" as const, label: "Excel", desc: language === "en" ? "Data analysis" : language === "zh-TW" ? "數據分析" : "数据分析" },
                    { key: "csv" as const, label: "CSV", desc: language === "en" ? "Raw data" : language === "zh-TW" ? "原始數據" : "原始数据" },
                  ]).map((format) => (
                    <button
                      key={format.key}
                      onClick={() => setExportFormat(format.key)}
                      className={`flex flex-col items-center py-3 rounded-lg border text-sm transition-all ${exportFormat === format.key ? "border-sky-500 bg-sky-50 text-sky-700" : "border-border text-muted-foreground hover:border-sky-300"}`}
                    >
                      <span className="font-semibold">{format.label}</span>
                      <span className="text-[10px] mt-0.5 opacity-70">{format.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="mb-5">
                <label className="text-sm font-medium text-foreground mb-2 block">{language === "en" ? "Date Range" : language === "zh-TW" ? "時間範圍" : "时间范围"}</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" defaultValue="2026-01-01" className="px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm text-foreground" />
                  <input type="date" defaultValue="2026-02-25" className="px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm text-foreground" />
                </div>
              </div>

              {/* Additional Options */}
              <div className="mb-6 space-y-2">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-sky-500" />
                  {language === "en" ? "Include radar charts" : language === "zh-TW" ? "包含雷達圖" : "包含雷达图"}
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-sky-500" />
                  {language === "en" ? "Include detailed analysis" : language === "zh-TW" ? "包含詳細分析" : "包含详细分析"}
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-sky-500" />
                  {language === "en" ? "Zip multiple files" : language === "zh-TW" ? "多文件打包為ZIP" : "多文件打包为ZIP"}
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowExportModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}
                </button>
                <button onClick={() => setShowExportModal(false)} className="px-5 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors">
                  {language === "en" ? "Start Export" : language === "zh-TW" ? "開始匯出" : "开始导出"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
