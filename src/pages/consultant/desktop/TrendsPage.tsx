import { motion } from "framer-motion";
import { TrendingUp, Users, BarChart3, ArrowUpRight, ArrowDownRight, Compass } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";

const ANCHOR_COLORS: Record<string, string> = {
  TF: "#3b82f6",
  GM: "#ef4444",
  AU: "#f59e0b",
  SE: "#10b981",
  EC: "#8b5cf6",
  SV: "#ec4899",
  CH: "#f97316",
  LS: "#06b6d4",
};

export default function ConsultantTrendsPage() {
  const { language } = useTranslation();

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

  const clientAnchorDistribution = [
    { key: "TF", count: 8, percentage: 33 },
    { key: "GM", count: 5, percentage: 21 },
    { key: "AU", count: 4, percentage: 17 },
    { key: "CH", count: 3, percentage: 13 },
    { key: "EC", count: 2, percentage: 8 },
    { key: "SE", count: 1, percentage: 4 },
    { key: "SV", count: 1, percentage: 4 },
    { key: "LS", count: 0, percentage: 0 },
  ];

  const anchorTrends = [
    { key: "TF", current: 33, previous: 28, change: 5 },
    { key: "GM", current: 21, previous: 25, change: -4 },
    { key: "AU", current: 17, previous: 15, change: 2 },
    { key: "CH", current: 13, previous: 10, change: 3 },
    { key: "EC", current: 8, previous: 12, change: -4 },
    { key: "SE", current: 4, previous: 5, change: -1 },
    { key: "SV", current: 4, previous: 3, change: 1 },
    { key: "LS", current: 0, previous: 2, change: -2 },
  ];

  const clientProgress = [
    { name: language === "en" ? "Chen Ming" : language === "zh-TW" ? "陳明" : "陈明", sessions: 3, firstAnchor: "SE", currentAnchor: "TF", trend: "positive" },
    { name: language === "en" ? "Wang Lei" : "王磊", sessions: 4, firstAnchor: "GM", currentAnchor: "GM", trend: "stable" },
    { name: language === "en" ? "Sun Jie" : language === "zh-TW" ? "孫傑" : "孙杰", sessions: 2, firstAnchor: "AU", currentAnchor: "AU", trend: "stable" },
    { name: language === "en" ? "Liu Fang" : language === "zh-TW" ? "劉芳" : "刘芳", sessions: 1, firstAnchor: "EC", currentAnchor: "EC", trend: "new" },
    { name: language === "en" ? "Zhou Wei" : language === "zh-TW" ? "周偉" : "周伟", sessions: 3, firstAnchor: "TF", currentAnchor: "CH", trend: "shift" },
  ];

  const quarterlyData = [
    { quarter: "Q3 2025", clients: 15, assessments: 22, avgScore: 72 },
    { quarter: "Q4 2025", clients: 18, assessments: 28, avgScore: 74 },
    { quarter: "Q1 2026", clients: 22, assessments: 35, avgScore: 76 },
    { quarter: "Q2 2026", clients: 24, assessments: 42, avgScore: 78 },
  ];

  const maxAssessments = Math.max(...quarterlyData.map((q) => q.assessments));

  const trendLabels: Record<string, { label: string; color: string }> = {
    positive: { label: language === "en" ? "Positive" : language === "zh-TW" ? "正向發展" : "正向发展", color: "bg-emerald-50 text-emerald-600" },
    stable: { label: language === "en" ? "Stable" : language === "zh-TW" ? "穩定" : "稳定", color: "bg-blue-50 text-blue-600" },
    shift: { label: language === "en" ? "Shift" : language === "zh-TW" ? "變化中" : "变化中", color: "bg-amber-50 text-amber-600" },
    new: { label: language === "en" ? "New" : language === "zh-TW" ? "新客戶" : "新客户", color: "bg-purple-50 text-purple-600" },
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "Trend Analysis" : language === "zh-TW" ? "趨勢分析" : "趋势分析"}</h1>
        <p className="text-sm text-muted-foreground">{language === "en" ? "Track patterns and progress across your client base" : language === "zh-TW" ? "追蹤客戶群體的錨點模式與進展" : "跟踪客户群体的锚点模式与进展"}</p>
      </div>

      <div className="grid grid-cols-5 gap-6 mb-6">
        {/* Client Anchor Distribution */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Compass className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">{language === "en" ? "Client Anchor Distribution" : language === "zh-TW" ? "客戶錨點分布" : "客户锚点分布"}</h3>
          </div>
          <div className="space-y-3">
            {clientAnchorDistribution.filter((a) => a.count > 0).map((anchor) => (
              <div key={anchor.key} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ANCHOR_COLORS[anchor.key] }} />
                <div className="w-14 text-sm text-muted-foreground">{anchorLabels[anchor.key]}</div>
                <div className="flex-1">
                  <div className="h-5 bg-muted/20 rounded-md overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${anchor.percentage}%` }} transition={{ duration: 0.5, delay: 0.3 }} className="h-full rounded-md" style={{ backgroundColor: ANCHOR_COLORS[anchor.key] }} />
                  </div>
                </div>
                <div className="w-8 text-right text-xs font-medium text-foreground">{anchor.percentage}%</div>
                <div className="w-6 text-right text-xs text-muted-foreground">{anchor.count}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quarterly Growth */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="col-span-3 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">{language === "en" ? "Quarterly Growth" : language === "zh-TW" ? "季度增長" : "季度增长"}</h3>
          </div>
          <div className="flex items-end gap-6 h-36">
            {quarterlyData.map((quarter, index) => (
              <div key={quarter.quarter} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end gap-1.5 h-28">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(quarter.clients / 30) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                    className="flex-1 bg-emerald-400/70 rounded-t-sm"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(quarter.assessments / maxAssessments) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.25 + index * 0.05 }}
                    className="flex-1 bg-blue-400/70 rounded-t-sm"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{quarter.quarter}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-muted-foreground">{language === "en" ? "Clients" : language === "zh-TW" ? "客戶數" : "客户数"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-muted-foreground">{language === "en" ? "Assessments" : language === "zh-TW" ? "測評數" : "测评数"}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Anchor Trend Changes */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">{language === "en" ? "Anchor Trend Changes" : language === "zh-TW" ? "錨點趨勢變化" : "锚点趋势变化"}</h3>
            <span className="text-xs text-muted-foreground ml-auto">{language === "en" ? "vs. last quarter" : language === "zh-TW" ? "對比上季度" : "对比上季度"}</span>
          </div>
          <div className="space-y-2.5">
            {anchorTrends.map((trend) => (
              <div key={trend.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ANCHOR_COLORS[trend.key] }} />
                <div className="w-14 text-sm text-muted-foreground">{anchorLabels[trend.key]}</div>
                <div className="flex-1 text-sm font-medium text-foreground">{trend.current}%</div>
                <div className={`flex items-center gap-0.5 text-xs font-medium ${trend.change > 0 ? "text-emerald-600" : trend.change < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                  {trend.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : trend.change < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                  {trend.change > 0 ? "+" : ""}{trend.change}%
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Client Progress Tracking */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">{language === "en" ? "Client Progress" : language === "zh-TW" ? "客戶進展追蹤" : "客户进展追踪"}</h3>
          </div>
          <div className="space-y-3">
            {clientProgress.map((client, index) => (
              <div key={client.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">{client.name[0]}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{client.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {client.sessions} {language === "en" ? "sessions" : language === "zh-TW" ? "次測評" : "次测评"} · {anchorLabels[client.firstAnchor]}
                    {client.firstAnchor !== client.currentAnchor && ` → ${anchorLabels[client.currentAnchor]}`}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trendLabels[client.trend].color}`}>
                  {trendLabels[client.trend].label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
