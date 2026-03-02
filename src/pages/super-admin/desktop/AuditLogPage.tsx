import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import { useAuditLogs } from "@/hooks/useAdminData";

const operationLabels: Record<string, { en: string; "zh-TW": string; "zh-CN": string; color: string }> = {
  login: { en: "Login", "zh-TW": "登入", "zh-CN": "登录", color: "bg-blue-100 text-blue-700" },
  logout: { en: "Logout", "zh-TW": "登出", "zh-CN": "退出", color: "bg-slate-100 text-slate-700" },
  create_user: { en: "Create User", "zh-TW": "建立用戶", "zh-CN": "创建用户", color: "bg-green-100 text-green-700" },
  bulk_import: { en: "Bulk Import", "zh-TW": "批次匯入", "zh-CN": "批量导入", color: "bg-purple-100 text-purple-700" },
  assign_assessment: { en: "Assign Assessment", "zh-TW": "派發測評", "zh-CN": "派发测评", color: "bg-sky-100 text-sky-700" },
  export_report: { en: "Export Report", "zh-TW": "匯出報告", "zh-CN": "导出报告", color: "bg-amber-100 text-amber-700" },
  role_change: { en: "Role Change", "zh-TW": "角色變更", "zh-CN": "角色变更", color: "bg-orange-100 text-orange-700" },
  sso_config_change: { en: "SSO Config", "zh-TW": "SSO 設定", "zh-CN": "SSO 配置", color: "bg-pink-100 text-pink-700" },
  delete_user: { en: "Delete User", "zh-TW": "刪除用戶", "zh-CN": "删除用户", color: "bg-red-100 text-red-700" },
};

export default function AuditLogPage() {
  const { language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);

  const { data: auditLogs, isLoading } = useAuditLogs(selectedOperation);
  const logs = auditLogs || [];

  const operations = Object.keys(operationLabels);

  const filtered = logs.filter((log) => {
    if (!searchQuery) return true;
    const lowerSearch = searchQuery.toLowerCase();
    return (log.user_email || "").toLowerCase().includes(lowerSearch) ||
           (log.target_description || "").toLowerCase().includes(lowerSearch);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "Audit Logs" : language === "zh-TW" ? "稽核日誌" : "审计日志"}</h1>
          <p className="text-sm text-muted-foreground">{language === "en" ? "Complete record of all sensitive operations" : language === "zh-TW" ? "所有敏感操作的完整記錄" : "所有敏感操作的完整记录"}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">
          <Download className="w-4 h-4" />
          {language === "en" ? "Export Logs" : language === "zh-TW" ? "匯出日誌" : "导出日志"}
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder={language === "en" ? "Search by user or target..." : language === "zh-TW" ? "搜尋用戶或操作對象..." : "搜索用户或操作对象..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
        </div>
        <select value={selectedOperation || ""} onChange={(e) => setSelectedOperation(e.target.value || null)} className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm min-w-[160px]">
          <option value="">{language === "en" ? "All Operations" : language === "zh-TW" ? "全部操作" : "全部操作"}</option>
          {operations.map((op) => (
            <option key={op} value={op}>{operationLabels[op][language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN"]}</option>
          ))}
        </select>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Time" : language === "zh-TW" ? "時間" : "时间"}</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "User" : language === "zh-TW" ? "用戶" : "用户"}</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Operation" : "操作"}</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Target" : language === "zh-TW" ? "對象" : "对象"}</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">{language === "en" ? "No audit logs found" : language === "zh-TW" ? "暫無稽核日誌" : "暂无审计日志"}</td></tr>
            ) : filtered.map((log) => {
              const op = operationLabels[log.operation_type || ""] || { en: log.operation_type || "—", "zh-TW": log.operation_type || "—", "zh-CN": log.operation_type || "—", color: "bg-gray-100 text-gray-700" };
              return (
                <tr key={log.id} className="hover:bg-muted/10">
                  <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono">{formatTime(log.created_at)}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{log.user_email || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", op.color)}>
                      {op[language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN"]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{log.target_description || "—"}</td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono">{log.ip_address || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
