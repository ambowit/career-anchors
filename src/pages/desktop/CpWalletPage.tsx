import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Wallet,
  CreditCard,
  RefreshCw,
  Loader2,
  AlertCircle,
  Gift,
  Star,
  ArrowRight,
  TrendingDown,
  ShoppingBag,
  FileText,
  GraduationCap,
  Award,
  MoreHorizontal,
  BadgeDollarSign,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useCpWallet } from "@/hooks/useCpWallet";
import CpTransactionHistory from "@/components/desktop/CpTransactionHistory";
import { cn } from "@/lib/utils";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import { Navigate } from "react-router-dom";

const TXT = {
  en: {
    pageTitle: "CP Account",
    breadcrumbHome: "Home",
    breadcrumbWallet: "CP Account",
    // Section 1: Overview
    totalBalance: "Available Career Points",
    paidBalance: "Paid CP",
    bonusBalance: "Recharge Bonus",
    activityBalance: "Activity Reward",
    monthlyConsumed: "Consumed This Month",
    monthlyRecharged: "Recharged This Month",
    recharge: "Recharge",
    applyRefund: "Apply Refund",
    browseServices: "Browse Services",
    cpUnit: "CP",
    // Section 2: Source Cards
    sourceTitle: "Balance by Source",
    paidCpTitle: "Paid CP",
    paidCpDesc: "Purchased with real currency. Refundable.",
    bonusCpTitle: "Recharge Bonus CP",
    bonusCpDesc: "Bonus from recharge. Non-refundable.",
    activityCpTitle: "Activity Reward CP",
    activityCpDesc: "Earned via referral & activities. Non-refundable.",
    currentBalance: "Current Balance",
    cumulativeTotal: "Cumulative Total",
    refundable: "Refundable",
    nonRefundable: "Non-refundable",
    // Section 3: Consumption
    consumptionTitle: "Consumption Breakdown",
    bySource: "By Deduction Source",
    byCategory: "By Category",
    fromPaid: "From Paid CP",
    fromBonus: "From Bonus CP",
    fromActivity: "From Activity CP",
    catAssessment: "Assessment",
    catReport: "Report",
    catCourse: "Course",
    catCertification: "Certification",
    catOther: "Other",
    thisMonth: "This Month",
    // States
    loginRequired: "Login Required",
    loginRequiredDesc: "Please log in to access your CP account",
    loginButton: "Log In",
    errorTitle: "Unable to Load Account",
    errorDesc: "Something went wrong. Please try again.",
    retryButton: "Retry",
  },
  "zh-TW": {
    pageTitle: "生涯點（CP）帳戶",
    breadcrumbHome: "首頁",
    breadcrumbWallet: "CP 帳戶",
    totalBalance: "當前可用生涯點",
    paidBalance: "儲值購買",
    bonusBalance: "儲值贈送",
    activityBalance: "活動獎勵",
    monthlyConsumed: "本月累計消費",
    monthlyRecharged: "本月累計儲值",
    recharge: "立即儲值",
    applyRefund: "申請退費",
    browseServices: "瀏覽可購買服務",
    cpUnit: "CP",
    sourceTitle: "來源分類餘額",
    paidCpTitle: "儲值購買 CP",
    paidCpDesc: "用戶以真實貨幣購買，可申請退費",
    bonusCpTitle: "儲值贈送 CP",
    bonusCpDesc: "儲值時系統贈送，不可退費",
    activityCpTitle: "活動獎勵 CP",
    activityCpDesc: "推薦、活動等獎勵獲得，不可退費",
    currentBalance: "當前餘額",
    cumulativeTotal: "累計獲得",
    refundable: "可退費",
    nonRefundable: "不可退費",
    consumptionTitle: "消費情況",
    bySource: "按扣點來源拆分",
    byCategory: "按消費品類",
    fromPaid: "儲值購買扣除",
    fromBonus: "儲值贈送扣除",
    fromActivity: "活動獎勵扣除",
    catAssessment: "測評",
    catReport: "報告",
    catCourse: "課程",
    catCertification: "認證 / 換證",
    catOther: "其他",
    thisMonth: "本月",
    loginRequired: "需要登入",
    loginRequiredDesc: "請登入以存取您的 CP 帳戶",
    loginButton: "登入",
    errorTitle: "無法載入帳戶",
    errorDesc: "發生錯誤，請重試。",
    retryButton: "重試",
  },
  "zh-CN": {
    pageTitle: "生涯点（CP）账户",
    breadcrumbHome: "首页",
    breadcrumbWallet: "CP 账户",
    totalBalance: "当前可用生涯点",
    paidBalance: "充值购买",
    bonusBalance: "充值赠送",
    activityBalance: "活动奖励",
    monthlyConsumed: "本月累计消费",
    monthlyRecharged: "本月累计充值",
    recharge: "立即充值",
    applyRefund: "申请退费",
    browseServices: "浏览可购买服务",
    cpUnit: "CP",
    sourceTitle: "来源分类余额",
    paidCpTitle: "充值购买 CP",
    paidCpDesc: "用户以真实货币购买，可申请退费",
    bonusCpTitle: "充值赠送 CP",
    bonusCpDesc: "充值时系统赠送，不可退费",
    activityCpTitle: "活动奖励 CP",
    activityCpDesc: "推荐、活动等奖励获得，不可退费",
    currentBalance: "当前余额",
    cumulativeTotal: "累计获得",
    refundable: "可退费",
    nonRefundable: "不可退费",
    consumptionTitle: "消费情况",
    bySource: "按扣点来源拆分",
    byCategory: "按消费品类",
    fromPaid: "充值购买扣除",
    fromBonus: "充值赠送扣除",
    fromActivity: "活动奖励扣除",
    catAssessment: "测评",
    catReport: "报告",
    catCourse: "课程",
    catCertification: "认证 / 换证",
    catOther: "其他",
    thisMonth: "本月",
    loginRequired: "需要登录",
    loginRequiredDesc: "请登录以访问您的 CP 账户",
    loginButton: "登录",
    errorTitle: "无法加载账户",
    errorDesc: "发生错误，请重试。",
    retryButton: "重试",
  },
} as const;

export default function CpWalletPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { isCpPointsEnabled } = useFeaturePermissions();
  const {
    wallet,
    transactions,
    monthlyStats,
    loading,
    error,
    refetch,
  } = useCpWallet();

  const t = TXT[language] || TXT["zh-TW"];

  // CP feature disabled for this org — redirect to home
  if (!isCpPointsEnabled) {
    return <Navigate to="/" replace />;
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
            <Wallet className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{t.loginRequired}</h2>
          <p className="text-sm text-slate-500 mb-6">{t.loginRequiredDesc}</p>
          <button onClick={() => navigate("/auth")} className="px-6 py-2.5 text-sm font-semibold rounded-lg text-white transition-all hover:shadow-lg" style={{ backgroundColor: "#1a3a5c" }}>
            {t.loginButton}
          </button>
        </motion.div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </motion.div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{t.errorTitle}</h2>
          <p className="text-sm text-slate-500 mb-6">{t.errorDesc}</p>
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg text-white" style={{ backgroundColor: "#1a3a5c" }}>
            <RefreshCw className="w-4 h-4" /> {t.retryButton}
          </button>
        </motion.div>
      </div>
    );
  }

  const balancePaid = Number(wallet?.balance_paid ?? 0);
  const balanceBonus = Number(wallet?.balance_recharge_bonus ?? 0);
  const balanceActivity = Number(wallet?.balance_activity ?? 0);
  const totalBalance = Number(wallet?.total_balance ?? 0);
  const lifetimeRecharged = Number(wallet?.lifetime_recharged ?? 0);

  // Estimate cumulative totals from transactions
  const allTxns = transactions;
  const cumulativePaid = allTxns.filter((txn) => txn.transaction_type === "recharge" && txn.cp_type === "paid").reduce((sum, txn) => sum + Number(txn.amount), 0);
  const cumulativeBonus = allTxns.filter((txn) => txn.transaction_type === "recharge_bonus").reduce((sum, txn) => sum + Number(txn.amount), 0);
  const cumulativeActivity = allTxns.filter((txn) => ["activity_grant", "referral_reward", "consultation_reward", "sale_reward"].includes(txn.transaction_type)).reduce((sum, txn) => sum + Number(txn.amount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <button onClick={() => navigate("/")} className="hover:text-slate-700 transition-colors">{t.breadcrumbHome}</button>
            <span>/</span>
            <span className="text-slate-800 font-medium">{t.breadcrumbWallet}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900">{t.pageTitle}</h1>
            </div>
            <button onClick={() => refetch()} className="flex items-center gap-2 px-3.5 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* ─── Section 1: Account Overview ─── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="relative rounded-2xl overflow-hidden text-white" style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #0f2744 60%, #162d4a 100%)" }}>
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-sky-400/8 -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-violet-400/6 translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10 p-6 md:p-8">
              {/* Main balance */}
              <div className="mb-6">
                <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-1">{t.totalBalance}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight">{totalBalance.toLocaleString()}</span>
                  <span className="text-base text-white/50">{t.cpUnit}</span>
                </div>
              </div>

              {/* 3 category + 2 monthly stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <MiniStat icon={Wallet} label={t.paidBalance} value={balancePaid} />
                <MiniStat icon={Gift} label={t.bonusBalance} value={balanceBonus} />
                <MiniStat icon={Star} label={t.activityBalance} value={balanceActivity} />
                <MiniStat icon={TrendingDown} label={t.monthlyConsumed} value={monthlyStats.consumedTotal} accent />
                <MiniStat icon={CreditCard} label={t.monthlyRecharged} value={monthlyStats.rechargedTotal} />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate("/recharge")} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-white text-slate-900 hover:bg-white/90 transition-colors shadow-sm">
                  <CreditCard className="w-4 h-4" /> {t.recharge}
                </button>
                {balancePaid > 0 && (
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors">
                    <RefreshCw className="w-4 h-4" /> {t.applyRefund}
                  </button>
                )}
                <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors">
                  <ShoppingBag className="w-4 h-4" /> {t.browseServices}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Section 2: Source Category Cards ─── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
          <h2 className="text-base font-semibold text-slate-800 mb-4">{t.sourceTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Paid CP Card */}
            <SourceCard
              icon={Wallet}
              title={t.paidCpTitle}
              description={t.paidCpDesc}
              balance={balancePaid}
              cumulative={cumulativePaid > 0 ? cumulativePaid : lifetimeRecharged}
              balanceLabel={t.currentBalance}
              cumulativeLabel={t.cumulativeTotal}
              tagLabel={t.refundable}
              tagColor="emerald"
              gradientFrom="from-sky-50"
              gradientTo="to-indigo-50"
              borderColor="border-sky-200/80"
              iconColor="text-sky-600"
              cpUnit={t.cpUnit}
              actions={
                <div className="flex gap-2 mt-3">
                  <button onClick={() => navigate("/recharge")} className="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors">{t.recharge}</button>
                  {balancePaid > 0 && (
                    <>
                      <span className="text-slate-300">|</span>
                      <button className="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors">{t.applyRefund}</button>
                    </>
                  )}
                </div>
              }
            />

            {/* Bonus CP Card */}
            <SourceCard
              icon={Gift}
              title={t.bonusCpTitle}
              description={t.bonusCpDesc}
              balance={balanceBonus}
              cumulative={cumulativeBonus}
              balanceLabel={t.currentBalance}
              cumulativeLabel={t.cumulativeTotal}
              tagLabel={t.nonRefundable}
              tagColor="slate"
              gradientFrom="from-violet-50"
              gradientTo="to-fuchsia-50"
              borderColor="border-violet-200/80"
              iconColor="text-violet-600"
              cpUnit={t.cpUnit}
            />

            {/* Activity CP Card */}
            <SourceCard
              icon={Star}
              title={t.activityCpTitle}
              description={t.activityCpDesc}
              balance={balanceActivity}
              cumulative={cumulativeActivity}
              balanceLabel={t.currentBalance}
              cumulativeLabel={t.cumulativeTotal}
              tagLabel={t.nonRefundable}
              tagColor="slate"
              gradientFrom="from-amber-50"
              gradientTo="to-orange-50"
              borderColor="border-amber-200/80"
              iconColor="text-amber-600"
              cpUnit={t.cpUnit}
            />
          </div>
        </motion.div>

        {/* ─── Section 3: Consumption Breakdown ─── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }}>
          <h2 className="text-base font-semibold text-slate-800 mb-4">{t.consumptionTitle}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* By Deduction Source */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BadgeDollarSign className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">{t.bySource}</h3>
                <span className="text-[10px] text-slate-400 ml-auto">{t.thisMonth}</span>
              </div>
              <div className="space-y-3">
                <DeductionRow label={t.fromPaid} value={monthlyStats.consumedPaid} total={monthlyStats.consumedTotal} color="bg-sky-500" />
                <DeductionRow label={t.fromBonus} value={monthlyStats.consumedBonus} total={monthlyStats.consumedTotal} color="bg-violet-500" />
                <DeductionRow label={t.fromActivity} value={monthlyStats.consumedActivity} total={monthlyStats.consumedTotal} color="bg-amber-500" />
              </div>
            </div>

            {/* By Category */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">{t.byCategory}</h3>
                <span className="text-[10px] text-slate-400 ml-auto">{t.thisMonth}</span>
              </div>
              <div className="space-y-3">
                <CategoryRow icon={FileText} label={t.catAssessment} value={0} color="text-sky-600 bg-sky-50" />
                <CategoryRow icon={FileText} label={t.catReport} value={0} color="text-violet-600 bg-violet-50" />
                <CategoryRow icon={GraduationCap} label={t.catCourse} value={0} color="text-emerald-600 bg-emerald-50" />
                <CategoryRow icon={Award} label={t.catCertification} value={0} color="text-amber-600 bg-amber-50" />
                <CategoryRow icon={MoreHorizontal} label={t.catOther} value={0} color="text-slate-500 bg-slate-100" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Section 4: Transaction History ─── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.24 }}>
          <CpTransactionHistory transactions={transactions} />
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

interface MiniStatProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent?: boolean;
}

function MiniStat({ icon: Icon, label, value, accent }: MiniStatProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-white/50" />
        <span className="text-[10px] text-white/50 font-medium truncate">{label}</span>
      </div>
      <p className={cn("text-lg font-bold", accent ? "text-orange-300" : "text-white")}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

interface SourceCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  balance: number;
  cumulative: number;
  balanceLabel: string;
  cumulativeLabel: string;
  tagLabel: string;
  tagColor: "emerald" | "slate";
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  iconColor: string;
  cpUnit: string;
  actions?: React.ReactNode;
}

function SourceCard({
  icon: Icon,
  title,
  description,
  balance,
  cumulative,
  balanceLabel,
  cumulativeLabel,
  tagLabel,
  tagColor,
  gradientFrom,
  gradientTo,
  borderColor,
  iconColor,
  cpUnit,
  actions,
}: SourceCardProps) {
  const tagClasses = tagColor === "emerald"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-slate-100 text-slate-500 border-slate-200";

  return (
    <div className={cn("bg-gradient-to-br rounded-xl p-5 border shadow-sm", gradientFrom, gradientTo, borderColor)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-white/80", iconColor)}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-slate-800">{title}</span>
        </div>
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border", tagClasses)}>
          {tagLabel}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">{description}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">{balanceLabel}</span>
          <span className="text-xl font-bold text-slate-900">{balance.toLocaleString()} <span className="text-xs font-normal text-slate-400">{cpUnit}</span></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">{cumulativeLabel}</span>
          <span className="text-sm font-medium text-slate-600">{cumulative.toLocaleString()} <span className="text-xs text-slate-400">{cpUnit}</span></span>
        </div>
      </div>
      {actions}
    </div>
  );
}

interface DeductionRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function DeductionRow({ label, value, total, color }: DeductionRowProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-600">{label}</span>
        <span className="text-xs font-semibold text-slate-800">{value.toLocaleString()} CP</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

interface CategoryRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}

function CategoryRow({ icon: Icon, label, value, color }: CategoryRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs text-slate-700 font-medium">{label}</span>
      </div>
      <span className="text-xs font-semibold text-slate-800">{value.toLocaleString()} CP</span>
    </div>
  );
}
