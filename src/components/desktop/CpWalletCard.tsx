import { motion } from "framer-motion";
import { Wallet, TrendingUp, Gift, Star, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import type { CpWallet, UserMembership, MembershipTier, CpLedgerEntry } from "@/hooks/useCpWallet";
import { cn } from "@/lib/utils";

interface CpWalletCardProps {
  wallet: CpWallet | null;
  membership: UserMembership | null;
  nextTier: MembershipTier | null;
  tierProgressPercent: number;
  expiringEntries: CpLedgerEntry[];
  totalExpiringCp: number;
  onViewDetails?: () => void;
}

const TXT = {
  en: {
    walletTitle: "CP Wallet",
    totalBalance: "Total Balance",
    paidCp: "Paid CP",
    bonusCp: "Bonus CP",
    activityCp: "Activity CP",
    memberTier: "Membership",
    noWallet: "No wallet yet",
    noWalletDesc: "Recharge to activate your CP wallet",
    recharge: "Recharge Now",
    nextTier: "Next Tier",
    progressTo: "to",
    discount: "off",
    expiringWarning: "CP expiring within 30 days",
    cpUnit: "CP (Career Points)",
    viewAll: "View Details",
    maxTier: "Highest Tier",
    rolling12m: "12-Month Recharge",
  },
  "zh-TW": {
    walletTitle: "CP 錢包",
    totalBalance: "總餘額",
    paidCp: "付費 CP",
    bonusCp: "贈送 CP",
    activityCp: "活動 CP",
    memberTier: "會員等級",
    noWallet: "尚未開通錢包",
    noWalletDesc: "充值即可啟用 CP 錢包",
    recharge: "立即充值",
    nextTier: "下一等級",
    progressTo: "至",
    discount: "折扣",
    expiringWarning: "30 天內到期的 CP",
    cpUnit: "CP（生涯點）",
    viewAll: "查看明細",
    maxTier: "最高等級",
    rolling12m: "近 12 月充值",
  },
  "zh-CN": {
    walletTitle: "CP 钱包",
    totalBalance: "总余额",
    paidCp: "付费 CP",
    bonusCp: "赠送 CP",
    activityCp: "活动 CP",
    memberTier: "会员等级",
    noWallet: "尚未开通钱包",
    noWalletDesc: "充值即可启用 CP 钱包",
    recharge: "立即充值",
    nextTier: "下一等级",
    progressTo: "至",
    discount: "折扣",
    expiringWarning: "30 天内到期的 CP",
    cpUnit: "CP（生涯点）",
    viewAll: "查看明细",
    maxTier: "最高等级",
    rolling12m: "近 12 月充值",
  },
};

function getTierName(tier: MembershipTier, language: string): string {
  if (language === "en") return tier.tier_name_en;
  if (language === "zh-TW") return tier.tier_name_zh_tw;
  return tier.tier_name_zh_cn;
}

function getDiscountLabel(rate: number, language: string): string {
  const discountPercent = Math.round((1 - rate) * 100);
  if (discountPercent <= 0) return "";
  if (language === "en") return `${discountPercent}% off`;
  return `${discountPercent}% ${language === "zh-TW" ? "折扣" : "折扣"}`;
}

export default function CpWalletCard({
  wallet,
  membership,
  nextTier,
  tierProgressPercent,
  expiringEntries,
  totalExpiringCp,
  onViewDetails,
}: CpWalletCardProps) {
  const { language } = useLanguage();
  const t = TXT[language as keyof typeof TXT] ?? TXT["zh-TW"];
  const currentTier = membership?.current_tier;

  // No wallet state
  if (!wallet) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700">{t.walletTitle}</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">{t.noWalletDesc}</p>
        <button
          onClick={onViewDetails}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
          style={{ backgroundColor: "#1a3a5c" }}
        >
          {t.recharge}
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  const balancePaid = Number(wallet.balance_paid);
  const balanceBonus = Number(wallet.balance_recharge_bonus);
  const balanceActivity = Number(wallet.balance_activity);
  const totalBalance = Number(wallet.total_balance);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
    >
      {/* Main Balance Card */}
      <div
        className="relative p-6 text-white overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${currentTier?.color_hex ?? "#1a3a5c"} 0%, #0f2744 100%)` }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-6 -translate-x-6" />

        <div className="relative z-10">
          {/* Header: Title + Tier Badge */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white/80">{t.walletTitle}</h3>
                {currentTier && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-lg">{currentTier.icon_emoji}</span>
                    <span className="text-sm font-semibold">{getTierName(currentTier, language)}</span>
                    {currentTier.discount_rate < 1 && (
                      <Badge variant="outline" className="border-white/30 text-white/90 text-[10px] px-1.5 py-0">
                        {getDiscountLabel(currentTier.discount_rate, language)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="text-xs text-white/70 hover:text-white transition-colors flex items-center gap-1"
              >
                {t.viewAll}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Total Balance */}
          <div className="mb-6">
            <p className="text-xs text-white/60 mb-1">{t.totalBalance}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight">{totalBalance.toLocaleString()}</span>
              <span className="text-sm text-white/60">{t.cpUnit}</span>
            </div>
          </div>

          {/* Three Ledger Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className="w-3 h-3 text-white/60" />
                <span className="text-[10px] text-white/60 font-medium">{t.paidCp}</span>
              </div>
              <p className="text-lg font-bold">{balancePaid.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Gift className="w-3 h-3 text-white/60" />
                <span className="text-[10px] text-white/60 font-medium">{t.bonusCp}</span>
              </div>
              <p className="text-lg font-bold">{balanceBonus.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Star className="w-3 h-3 text-white/60" />
                <span className="text-[10px] text-white/60 font-medium">{t.activityCp}</span>
              </div>
              <p className="text-lg font-bold">{balanceActivity.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Tier Progress + Expiry Warning */}
      <div className="bg-white border border-t-0 border-slate-200 rounded-b-2xl p-4 space-y-3">
        {/* Tier Progress */}
        {nextTier ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">
                {t.nextTier}: {nextTier.icon_emoji} {getTierName(nextTier, language)}
              </span>
              <span className="text-xs font-medium text-slate-600">{tierProgressPercent}%</span>
            </div>
            <Progress value={tierProgressPercent} className="h-2" />
            <p className="text-[10px] text-slate-400 mt-1.5">
              {t.rolling12m}: TWD {Number(membership?.rolling_12m_recharge_total ?? 0).toLocaleString()} / {Number(nextTier.recharge_threshold_12m).toLocaleString()}
            </p>
          </div>
        ) : currentTier ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.maxTier} {currentTier.icon_emoji} {getTierName(currentTier, language)}</span>
          </div>
        ) : null}

        {/* Expiry Warning */}
        {totalExpiringCp > 0 && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-800 font-medium">
                {t.expiringWarning}: {totalExpiringCp.toLocaleString()} {t.cpUnit}
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">
                {expiringEntries.length} {language === "en" ? "batch(es)" : "筆"}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
