import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, UserCog, User, CheckCircle2, Clock, XCircle,
  Loader2, Search, Crown, Zap, Shield, ChevronDown,
  Calendar, Users, ClipboardList, Plus, RefreshCw, Filter,
  ArrowUpRight, MoreHorizontal, Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import { useSubscriptions } from "@/hooks/useAdminData";

const planStyles: Record<string, { gradient: string; icon: typeof Zap; label: Record<string, string> }> = {
  trial: {
    gradient: "from-amber-500 to-orange-500",
    icon: Clock,
    label: { en: "Trial", "zh-TW": "試用", "zh-CN": "试用" },
  },
  basic: {
    gradient: "from-slate-400 to-slate-500",
    icon: Shield,
    label: { en: "Basic", "zh-TW": "基礎", "zh-CN": "基础" },
  },
  professional: {
    gradient: "from-blue-500 to-indigo-600",
    icon: Zap,
    label: { en: "Professional", "zh-TW": "專業", "zh-CN": "专业" },
  },
  enterprise: {
    gradient: "from-violet-500 to-purple-600",
    icon: Crown,
    label: { en: "Enterprise", "zh-TW": "企業", "zh-CN": "企业" },
  },
};

const statusStyles: Record<string, { color: string; bgColor: string; label: Record<string, string> }> = {
  active: {
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
    label: { en: "Active", "zh-TW": "有效", "zh-CN": "有效" },
  },
  trial: {
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800",
    label: { en: "Trial", "zh-TW": "試用中", "zh-CN": "试用中" },
  },
  expired: {
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
    label: { en: "Expired", "zh-TW": "已過期", "zh-CN": "已过期" },
  },
  cancelled: {
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700",
    label: { en: "Cancelled", "zh-TW": "已取消", "zh-CN": "已取消" },
  },
};

const entityTypeConfig: Record<string, { icon: typeof Building2; label: Record<string, string>; color: string }> = {
  organization: { icon: Building2, label: { en: "Organization", "zh-TW": "機構", "zh-CN": "机构" }, color: "text-blue-600" },
  consultant: { icon: UserCog, label: { en: "Consultant", "zh-TW": "諮詢師", "zh-CN": "咨询师" }, color: "text-violet-600" },
  individual: { icon: User, label: { en: "Individual", "zh-TW": "個人", "zh-CN": "个人" }, color: "text-teal-600" },
};

export default function SubscriptionsPage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const { data: subscriptions, isLoading, refetch, isFetching } = useSubscriptions();
  const subs = subscriptions || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = subs;
    if (statusFilter) result = result.filter((s) => s.status === statusFilter);
    if (entityFilter) result = result.filter((s) => s.entity_type === entityFilter);
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter((s) =>
        (s.entityName || "").toLowerCase().includes(lower) ||
        (s.plan_type || "").toLowerCase().includes(lower)
      );
    }
    return result;
  }, [subs, statusFilter, entityFilter, searchQuery]);

  const stats = useMemo(() => ({
    total: subs.length,
    active: subs.filter((s) => s.status === "active").length,
    trial: subs.filter((s) => s.status === "trial").length,
    expired: subs.filter((s) => s.status === "expired" || s.status === "cancelled").length,
    totalUsers: subs.reduce((sum, s) => sum + (s.max_users || 0), 0),
    totalAssessments: subs.reduce((sum, s) => sum + (s.max_assessments || 0), 0),
  }), [subs]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString(
        language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN",
        { year: "numeric", month: "short", day: "numeric" }
      );
    } catch {
      return dateString;
    }
  };

  const getDaysUntilExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {language === "en" ? "Subscriptions" : language === "zh-TW" ? "訂閱管理" : "订阅管理"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === "en"
                ? "Manage plans and quotas for all entities"
                : language === "zh-TW"
                ? "管理所有實體的方案與配額"
                : "管理所有实体的方案与配额"}
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
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[#1a365d] text-white hover:bg-[#1a365d]/90 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            {language === "en" ? "Add" : "新增"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4 space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Crown className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {language === "en" ? "Total Subscriptions" : language === "zh-TW" ? "總訂閱數" : "总订阅数"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-4 space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-emerald-600">{stats.active}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {language === "en" ? "Active" : "有效"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-amber-600">{stats.trial}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {language === "en" ? "Trial" : language === "zh-TW" ? "試用中" : "试用中"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-4 space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-red-600">{stats.expired}</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <Ban className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {language === "en" ? "Expired / Cancelled" : language === "zh-TW" ? "已過期/取消" : "已过期/取消"}
          </p>
        </motion.div>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={language === "en" ? "Search by name or plan..." : language === "zh-TW" ? "搜尋名稱或方案..." : "搜索名称或方案..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a365d]/20 focus:border-[#1a365d]/40 transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-lg border transition-colors",
            showFilters || statusFilter || entityFilter
              ? "border-[#1a365d]/40 bg-[#1a365d]/5 text-[#1a365d]"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          {language === "en" ? "Filter" : "篩選"}
          <ChevronDown className={cn("w-3 h-3 transition-transform", showFilters && "rotate-180")} />
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pb-2">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground min-w-[50px]">
                  {language === "en" ? "Status" : language === "zh-TW" ? "狀態" : "状态"}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(statusStyles).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-full border transition-colors font-medium",
                        statusFilter === key
                          ? "border-[#1a365d] bg-[#1a365d] text-white"
                          : cn("border", config.bgColor, config.color, "hover:opacity-80")
                      )}
                    >
                      {config.label[langKey]}
                    </button>
                  ))}
                </div>
              </div>
              {/* Entity Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground min-w-[50px]">
                  {language === "en" ? "Type" : language === "zh-TW" ? "類型" : "类型"}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(entityTypeConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setEntityFilter(entityFilter === key ? null : key)}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-colors font-medium",
                          entityFilter === key
                            ? "border-[#1a365d] bg-[#1a365d] text-white"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {config.label[langKey]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Cards */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-12 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Crown className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2">
            {language === "en" ? "No Subscriptions" : language === "zh-TW" ? "暫無訂閱" : "暂无订阅"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {language === "en"
              ? "Subscriptions will appear here when organizations, consultants, or individuals sign up for a plan."
              : language === "zh-TW"
              ? "當機構、諮詢師或個人訂閱方案後，訂閱記錄將顯示於此。"
              : "当机构、咨询师或个人订阅方案后，订阅记录将显示于此。"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub, index) => {
            const plan = planStyles[sub.plan_type || "basic"] || planStyles.basic;
            const statusKey = (sub.status || "active") as keyof typeof statusStyles;
            const status = statusStyles[statusKey] || statusStyles.active;
            const entityConfig = entityTypeConfig[sub.entity_type || "individual"] || entityTypeConfig.individual;
            const EntityIcon = entityConfig.icon;
            const PlanIcon = plan.icon;
            const daysLeft = getDaysUntilExpiry(sub.expires_at);
            const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 30;

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.3) }}
                className="group bg-card border border-border rounded-xl p-5 hover:border-[#1a365d]/20 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Plan Badge */}
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 text-white", plan.gradient)}>
                    <PlanIcon className="w-5 h-5" />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {sub.entityName || "—"}
                      </h3>
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide", status.bgColor, status.color)}>
                        {status.label[langKey]}
                      </span>
                      {isExpiringSoon && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                          {language === "en" ? `${daysLeft}d left` : `剩 ${daysLeft} 天`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <EntityIcon className={cn("w-3 h-3", entityConfig.color)} />
                        {entityConfig.label[langKey]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        {plan.label[langKey]} · {sub.billing_cycle === "yearly"
                          ? (language === "en" ? "Annual" : "年付")
                          : (language === "en" ? "Monthly" : "月付")}
                      </span>
                    </div>
                  </div>

                  {/* Quotas */}
                  <div className="hidden md:flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        {sub.max_users || 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {language === "en" ? "Users" : language === "zh-TW" ? "用戶" : "用户"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                        {sub.max_assessments || 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {language === "en" ? "Assessments" : language === "zh-TW" ? "測評" : "测评"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(sub.expires_at)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {language === "en" ? "Expires" : "到期"}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
