import { motion } from "framer-motion";
import { 
  Users, 
  FileQuestion, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Target,
  Award,
  Coins
} from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { 
  useCertificationTypes, 
  useCpPackages, 
  useAssessmentQuestions,
  getLocalizedName,
  getLocalizedDescription 
} from "@/hooks/useSeedData";

export default function AdminDashboardPage() {
  const { t, language } = useTranslation();
  
  // Fetch real data from database
  const { data: certificationTypes, isLoading: loadingCerts } = useCertificationTypes();
  const { data: cpPackages, isLoading: loadingPackages } = useCpPackages();
  const { data: questions, isLoading: loadingQuestions } = useAssessmentQuestions();

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
      labelKey: "certificationTypes",
      value: loadingCerts ? "..." : String(certificationTypes?.length || 0),
      change: certificationTypes?.length ? `+${certificationTypes.length}` : "0",
      trend: "up",
      icon: Award,
      color: "hsl(200, 80%, 50%)",
    },
    {
      labelKey: "cpPackages",
      value: loadingPackages ? "..." : String(cpPackages?.length || 0),
      change: cpPackages?.length ? `${cpPackages.length} 種` : "0",
      trend: "up",
      icon: Coins,
      color: "hsl(280, 60%, 55%)",
    },
    {
      labelKey: "questionCount",
      value: loadingQuestions ? "..." : String(questions?.length || 0),
      change: questions?.length ? `+${questions.length}` : "0",
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

      {/* Certification Types & CP Packages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Certification Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "hsl(200, 80%, 50%, 0.15)", color: "hsl(200, 80%, 45%)" }}
            >
              <Award className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-foreground">
              {language === "en" ? "Certification Types" : language === "zh-TW" ? "認證類型" : "认证类型"}
            </h3>
          </div>
          
          {loadingCerts ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {certificationTypes?.map((cert, index) => (
                <div key={cert.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ 
                        backgroundColor: `hsl(${200 + index * 40}, 70%, 50%)`,
                        color: "white"
                      }}
                    >
                      L{cert.level}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {cert.type_code} - {getLocalizedName(cert, language)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {language === "en" 
                          ? `${cert.validity_years} years • ${cert.cdu_requirement} CDU`
                          : language === "zh-TW"
                            ? `${cert.validity_years} 年效期 • ${cert.cdu_requirement} CDU`
                            : `${cert.validity_years} 年有效期 • ${cert.cdu_requirement} CDU`
                        }
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    NT${cert.price_ntd.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* CP Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "hsl(280, 60%, 55%, 0.15)", color: "hsl(280, 60%, 50%)" }}
            >
              <Coins className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-foreground">
              {language === "en" ? "CP Packages" : language === "zh-TW" ? "CP 方案" : "CP 方案"}
            </h3>
          </div>
          
          {loadingPackages ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {cpPackages?.map((pkg, index) => (
                <div key={pkg.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ 
                        backgroundColor: `hsl(${280 + index * 25}, 60%, 55%)`,
                        color: "white"
                      }}
                    >
                      {pkg.cp_amount}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {getLocalizedName(pkg, language)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pkg.bonus_cp > 0 && (
                          <span className="text-green-600">
                            +{pkg.bonus_cp} {language === "en" ? "bonus" : language === "zh-TW" ? "贈送" : "赠送"}
                          </span>
                        )}
                        {pkg.discount_percent > 0 && (
                          <span className="text-amber-600 ml-2">
                            {pkg.discount_percent}% {language === "en" ? "off" : language === "zh-TW" ? "折扣" : "折扣"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    NT${pkg.price_ntd.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
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
                  {language === "en" ? "Core anchor type statistics" : language === "zh-TW" ? "核心錨類型統計" : "核心锚类型统计"}
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
