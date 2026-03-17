import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Download, Loader2, Shield, LogIn, LogOut,
  UserPlus, Upload, ClipboardList, FileText, UserCog,
  Settings, Trash2, KeyRound, Award, CheckCircle,
  XCircle, Layers, BarChart3, ChevronDown,
  Calendar, Filter, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import { useAuditLogs } from "@/hooks/useAdminData";

const operationConfig: Record<string, {
  en: string; "zh-TW": string; "zh-CN": string;
  color: string; bgColor: string;
  icon: typeof LogIn;
}> = {
  login: { en: "Login", "zh-TW": "登入", "zh-CN": "登录", color: "text-blue-700 dark:text-blue-300", bgColor: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800", icon: LogIn },
  logout: { en: "Logout", "zh-TW": "登出", "zh-CN": "退出", color: "text-slate-600 dark:text-slate-300", bgColor: "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700", icon: LogOut },
  create_user: { en: "Create User", "zh-TW": "建立用戶", "zh-CN": "创建用户", color: "text-emerald-700 dark:text-emerald-300", bgColor: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800", icon: UserPlus },
  bulk_import: { en: "Bulk Import", "zh-TW": "批次匯入", "zh-CN": "批量导入", color: "text-violet-700 dark:text-violet-300", bgColor: "bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800", icon: Upload },
  assign_assessment: { en: "Assign Assessment", "zh-TW": "派發測評", "zh-CN": "派发测评", color: "text-sky-700 dark:text-sky-300", bgColor: "bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800", icon: ClipboardList },
  export_report: { en: "Export Report", "zh-TW": "匯出報告", "zh-CN": "导出报告", color: "text-amber-700 dark:text-amber-300", bgColor: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800", icon: FileText },
  role_change: { en: "Role Change", "zh-TW": "角色變更", "zh-CN": "角色变更", color: "text-orange-700 dark:text-orange-300", bgColor: "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800", icon: UserCog },
  sso_config_change: { en: "SSO Config", "zh-TW": "SSO 設定", "zh-CN": "SSO 配置", color: "text-pink-700 dark:text-pink-300", bgColor: "bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800", icon: Settings },
  delete_user: { en: "Delete User", "zh-TW": "刪除用戶", "zh-CN": "删除用户", color: "text-red-700 dark:text-red-300", bgColor: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800", icon: Trash2 },
  password_reset: { en: "Password Reset", "zh-TW": "重設密碼", "zh-CN": "重置密码", color: "text-teal-700 dark:text-teal-300", bgColor: "bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800", icon: KeyRound },
  certification_issued: { en: "Cert Issued", "zh-TW": "發證", "zh-CN": "发证", color: "text-indigo-700 dark:text-indigo-300", bgColor: "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800", icon: Award },
  cdu_approved: { en: "CDU Approved", "zh-TW": "CDU 通過", "zh-CN": "CDU 通过", color: "text-green-700 dark:text-green-300", bgColor: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800", icon: CheckCircle },
  cdu_rejected: { en: "CDU Rejected", "zh-TW": "CDU 駁回", "zh-CN": "CDU 驳回", color: "text-rose-700 dark:text-rose-300", bgColor: "bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800", icon: XCircle },
  batch_created: { en: "Batch Created", "zh-TW": "建立批次", "zh-CN": "创建批次", color: "text-cyan-700 dark:text-cyan-300", bgColor: "bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800", icon: Layers },
  report_generated: { en: "Report Generated", "zh-TW": "生成報告", "zh-CN": "生成报告", color: "text-fuchsia-700 dark:text-fuchsia-300", bgColor: "bg-fuchsia-50 dark:bg-fuchsia-900/30 border-fuchsia-200 dark:border-fuchsia-800", icon: BarChart3 },
};

export default function AuditLogPage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: auditLogs, isLoading, refetch, isFetching } = useAuditLogs(selectedOperation);
  const logs = auditLogs || [];

  const filtered = useMemo(() => {
    if (!searchQuery) return logs;
    const lowerSearch = searchQuery.toLowerCase();
    return logs.filter((log) =>
      (log.user_email || "").toLowerCase().includes(lowerSearch) ||
      (log.target_description || "").toLowerCase().includes(lowerSearch)
    );
  }, [logs, searchQuery]);

  const operationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of logs) {
      const op = log.operation_type || "unknown";
      counts[op] = (counts[op] || 0) + 1;
    }
    return counts;
  }, [logs]);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffMinutes < 1) return language === "en" ? "Just now" : "剛才";
      if (diffMinutes < 60) return language === "en" ? `${diffMinutes}m ago` : `${diffMinutes} 分鐘前`;
      if (diffHours < 24) return language === "en" ? `${diffHours}h ago` : `${diffHours} 小時前`;

      return date.toLocaleString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatFullTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });
    } catch {
      return dateString;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1a365d]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#1a365d]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {language === "en" ? "Audit Logs" : language === "zh-TW" ? "稽核日誌" : "审计日志"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === "en"
                ? `${filtered.length} records found`
                : language === "zh-TW"
                ? `共 ${filtered.length} 條記錄`
                : `共 ${filtered.length} 条记录`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
            {language === "en" ? "Refresh" : "刷新"}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            {language === "en" ? "Export" : language === "zh-TW" ? "匯出" : "导出"}
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={language === "en" ? "Search by email or description..." : language === "zh-TW" ? "搜尋用戶或操作描述..." : "搜索用户或操作描述..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]/20 focus:border-[#1a365d]/40 transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-lg border transition-colors",
            showFilters || selectedOperation
              ? "border-[#1a365d]/40 bg-[#1a365d]/5 text-[#1a365d]"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          {language === "en" ? "Filter" : "篩選"}
          <ChevronDown className={cn("w-3 h-3 transition-transform", showFilters && "rotate-180")} />
        </button>
      </div>

      {/* Filter Pills */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pb-2">
              <button
                onClick={() => setSelectedOperation(null)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-full border transition-colors font-medium",
                  !selectedOperation
                    ? "border-[#1a365d] bg-[#1a365d] text-white"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                {language === "en" ? "All" : "全部"}
                <span className="ml-1 opacity-70">({logs.length})</span>
              </button>
              {Object.entries(operationConfig).map(([key, config]) => {
                const count = operationCounts[key] || 0;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedOperation(selectedOperation === key ? null : key)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border transition-colors font-medium",
                      selectedOperation === key
                        ? "border-[#1a365d] bg-[#1a365d] text-white"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    )}
                  >
                    {config[langKey]}
                    {count > 0 && <span className="opacity-70">({count})</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log List */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-12 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Shield className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2">
            {language === "en" ? "No Audit Records" : language === "zh-TW" ? "暫無稽核記錄" : "暂无审计记录"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {language === "en"
              ? "Audit records will appear here automatically as users perform sensitive operations such as login, user management, and report generation."
              : language === "zh-TW"
              ? "當用戶執行敏感操作（如登入、用戶管理、報告生成等），系統將自動在此記錄稽核日誌。"
              : "当用户执行敏感操作（如登录、用户管理、报告生成等），系统将自动在此记录审计日志。"}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {filtered.map((log, index) => {
            const opKey = log.operation_type || "";
            const config = operationConfig[opKey] || {
              en: opKey, "zh-TW": opKey, "zh-CN": opKey,
              color: "text-gray-600", bgColor: "bg-gray-50 border-gray-200",
              icon: Shield,
            };
            const Icon = config.icon;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                className="group bg-card border border-border rounded-lg px-5 py-3.5 hover:border-[#1a365d]/20 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Operation Icon */}
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", config.bgColor)}>
                    <Icon className={cn("w-4 h-4", config.color)} />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border", config.bgColor, config.color)}>
                        {config[langKey]}
                      </span>
                      <span className="text-sm font-medium text-foreground truncate">
                        {log.user_email || "—"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {log.target_description || "—"}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span title={formatFullTime(log.created_at)}>
                        {formatTime(log.created_at)}
                      </span>
                    </div>
                    {log.ip_address && (
                      <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                        {log.ip_address}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
