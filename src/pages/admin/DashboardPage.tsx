import { motion } from "framer-motion";
import { 
  Users, 
  FileQuestion, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Target
} from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";

export default function AdminDashboardPage() {
  const { t, language } = useTranslation();

  const stats = [
    {
      labelKey: "totalUsers",
      value: "12,847",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "hsl(75, 55%, 50%)",
    },
    {
      labelKey: "weeklyNew",
      value: "342",
      change: "+8.2%",
      trend: "up",
      icon: TrendingUp,
      color: "hsl(200, 80%, 50%)",
    },
    {
      labelKey: "avgTime",
      value: language === "en" ? "18.5 min" : language === "zh-TW" ? "18.5 分鐘" : "18.5 分钟",
      change: "-2.3%",
      trend: "down",
      icon: Clock,
      color: "hsl(280, 60%, 55%)",
    },
    {
      labelKey: "questionCount",
      value: "156",
      change: "+5",
      trend: "up",
      icon: FileQuestion,
      color: "hsl(35, 90%, 55%)",
    },
  ];

  const anchorDistribution = [
    { nameKey: "TF", count: 2341, percentage: 18.2 },
    { nameKey: "GM", count: 1876, percentage: 14.6 },
    { nameKey: "AU", count: 2156, percentage: 16.8 },
    { nameKey: "SE", count: 1654, percentage: 12.9 },
    { nameKey: "EC", count: 1432, percentage: 11.1 },
    { nameKey: "SV", count: 1287, percentage: 10.0 },
    { nameKey: "CH", count: 1098, percentage: 8.5 },
    { nameKey: "LS", count: 1003, percentage: 7.9 },
  ];

  const recentActivity = [
    { 
      user: language === "en" ? "User #8847" : language === "zh-TW" ? "用戶 #8847" : "用户 #8847", 
      action: language === "en" ? "Completed" : language === "zh-TW" ? "完成測評" : "完成测评", 
      anchorKey: "TF", 
      time: language === "en" ? "3 min ago" : language === "zh-TW" ? "3 分鐘前" : "3 分钟前" 
    },
    { 
      user: language === "en" ? "User #8846" : language === "zh-TW" ? "用戶 #8846" : "用户 #8846", 
      action: language === "en" ? "Completed" : language === "zh-TW" ? "完成測評" : "完成测评", 
      anchorKey: "GM", 
      time: language === "en" ? "8 min ago" : language === "zh-TW" ? "8 分鐘前" : "8 分钟前" 
    },
    { 
      user: language === "en" ? "User #8845" : language === "zh-TW" ? "用戶 #8845" : "用户 #8845", 
      action: language === "en" ? "Started" : language === "zh-TW" ? "開始測評" : "开始测评", 
      anchorKey: null, 
      time: language === "en" ? "12 min ago" : language === "zh-TW" ? "12 分鐘前" : "12 分钟前" 
    },
    { 
      user: language === "en" ? "User #8844" : language === "zh-TW" ? "用戶 #8844" : "用户 #8844", 
      action: language === "en" ? "Completed" : language === "zh-TW" ? "完成測評" : "完成测评", 
      anchorKey: "AU", 
      time: language === "en" ? "15 min ago" : language === "zh-TW" ? "15 分鐘前" : "15 分钟前" 
    },
    { 
      user: language === "en" ? "User #8843" : language === "zh-TW" ? "用戶 #8843" : "用户 #8843", 
      action: language === "en" ? "Completed" : language === "zh-TW" ? "完成測評" : "完成测评", 
      anchorKey: "SE", 
      time: language === "en" ? "21 min ago" : language === "zh-TW" ? "21 分鐘前" : "21 分钟前" 
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">{t("admin.dashboard")}</h1>
        <p className="text-muted-foreground">
          {language === "en" 
            ? "System data overview and real-time monitoring" 
            : language === "zh-TW" 
              ? "系統數據概覽與實時監控" 
              : "系统数据概览与实时监控"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.labelKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  stat.trend === "up"
                    ? "bg-green-500/10 text-green-600"
                    : "bg-red-500/10 text-red-600"
                }`}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{t(`admin.${stat.labelKey}`)}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anchor Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "hsl(75, 55%, 50%, 0.15)", color: "hsl(75, 55%, 45%)" }}
              >
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("admin.anchorDistribution")}</h3>
                <p className="text-xs text-muted-foreground">
                  {language === "en" ? "High-sensitivity anchor statistics" : language === "zh-TW" ? "高敏感錨類型統計" : "高敏感锚类型统计"}
                </p>
              </div>
            </div>
            <button className="text-sm text-primary hover:underline">
              {language === "en" ? "View Details" : language === "zh-TW" ? "查看詳情" : "查看详情"}
            </button>
          </div>

          <div className="space-y-4">
            {anchorDistribution.map((anchor, index) => (
              <div key={anchor.nameKey} className="flex items-center gap-4">
                <div className="w-28 text-sm text-muted-foreground truncate">
                  {t(`assessment.dimensions.${anchor.nameKey}`)}
                </div>
                <div className="flex-1">
                  <div className="h-8 bg-muted/20 rounded-lg overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${anchor.percentage}%` }}
                      transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                      className="h-full rounded-lg"
                      style={{ 
                        backgroundColor: `hsl(${75 + index * 30}, 55%, ${50 + index * 3}%)` 
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-xs font-medium text-foreground">
                        {anchor.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-16 text-right text-sm font-medium text-foreground">
                  {anchor.percentage}%
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "hsl(200, 80%, 50%, 0.15)", color: "hsl(200, 80%, 45%)" }}
              >
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("admin.recentActivity")}</h3>
                <p className="text-xs text-muted-foreground">
                  {language === "en" ? "Recent activity" : language === "zh-TW" ? "最近活動" : "最近活动"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                  style={{ backgroundColor: "hsl(228, 51%, 23%)", color: "white" }}
                >
                  {activity.user.split("#")[1]?.slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {activity.user}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.action}
                    {activity.anchorKey && (
                      <span className="text-primary"> · {t(`assessment.dimensions.${activity.anchorKey}`)}</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
