import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Gift,
  Copy,
  CheckCircle2,
  Users,
  Sparkles,
  Award,
  Share2,
  Loader2,
  Clock,
  Heart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import { Navigate } from "react-router-dom";

const TXT = {
  en: {
    title: "Referral & Rewards",
    desc: "Invite friends and earn CP rewards",
    referralCode: "Your Referral Code",
    copyCode: "Copy Code",
    copied: "Copied!",
    shareLink: "Share Link",
    howItWorks: "How It Works",
    step1Title: "Share Your Code",
    step1Desc: "Share your unique referral code with friends and colleagues",
    step2Title: "They Sign Up",
    step2Desc: "When they register and complete their first assessment",
    step3Title: "Earn Rewards",
    step3Desc: "You both receive CP rewards automatically",
    rewardRates: "Reward Rates",
    referralReward: "Successful Referral",
    consultationReward: "Consultation Completed",
    saleReward: "Sale Achieved",
    rewardHistory: "Reward History",
    noRewards: "No rewards yet",
    noRewardsDesc: "Start sharing your referral code to earn CP rewards",
    date: "Date",
    type: "Type",
    amount: "Amount",
    status: "Status",
    pending: "Pending",
    granted: "Granted",
    cancelled: "Cancelled",
    consultation_completed: "Consultation",
    successful_referral: "Referral",
    sale_achieved: "Sale Bonus",
    totalEarned: "Total Earned",
    cpUnit: "CP (Career Points)",
    rewardsThisMonth: "This Month",
    activityReward: "Activity Reward",
    consumptionReward: "Consumption Reward",
  },
  "zh-TW": {
    title: "推薦與獎勵",
    desc: "邀請好友，獲得 CP 獎勵",
    referralCode: "您的推薦碼",
    copyCode: "複製推薦碼",
    copied: "已複製！",
    shareLink: "分享連結",
    howItWorks: "如何運作",
    step1Title: "分享推薦碼",
    step1Desc: "將您的專屬推薦碼分享給朋友和同事",
    step2Title: "好友註冊",
    step2Desc: "對方註冊並完成首次測評",
    step3Title: "獲得獎勵",
    step3Desc: "雙方自動獲得 CP 獎勵",
    rewardRates: "獎勵額度",
    referralReward: "成功推薦",
    consultationReward: "完成諮詢",
    saleReward: "達成銷售",
    rewardHistory: "獎勵記錄",
    noRewards: "尚無獎勵記錄",
    noRewardsDesc: "開始分享推薦碼，即可獲得 CP 獎勵",
    date: "日期",
    type: "類型",
    amount: "金額",
    status: "狀態",
    pending: "待發放",
    granted: "已發放",
    cancelled: "已取消",
    consultation_completed: "諮詢獎勵",
    successful_referral: "推薦獎勵",
    sale_achieved: "銷售獎勵",
    totalEarned: "累計獲得",
    cpUnit: "CP（生涯點）",
    rewardsThisMonth: "本月獎勵",
    activityReward: "活動獎勵",
    consumptionReward: "消費獎勵",
  },
  "zh-CN": {
    title: "推荐与奖励",
    desc: "邀请好友，获得 CP 奖励",
    referralCode: "您的推荐码",
    copyCode: "复制推荐码",
    copied: "已复制！",
    shareLink: "分享链接",
    howItWorks: "如何运作",
    step1Title: "分享推荐码",
    step1Desc: "将您的专属推荐码分享给朋友和同事",
    step2Title: "好友注册",
    step2Desc: "对方注册并完成首次测评",
    step3Title: "获得奖励",
    step3Desc: "双方自动获得 CP 奖励",
    rewardRates: "奖励额度",
    referralReward: "成功推荐",
    consultationReward: "完成咨询",
    saleReward: "达成销售",
    rewardHistory: "奖励记录",
    noRewards: "暂无奖励记录",
    noRewardsDesc: "开始分享推荐码，即可获得 CP 奖励",
    date: "日期",
    type: "类型",
    amount: "金额",
    status: "状态",
    pending: "待发放",
    granted: "已发放",
    cancelled: "已取消",
    consultation_completed: "咨询奖励",
    successful_referral: "推荐奖励",
    sale_achieved: "销售奖励",
    totalEarned: "累计获得",
    cpUnit: "CP（生涯点）",
    rewardsThisMonth: "本月奖励",
    activityReward: "活动奖励",
    consumptionReward: "消费奖励",
  },
};

const REWARD_COLORS: Record<string, string> = {
  consultation_completed: "border-violet-200 bg-violet-50 text-violet-700",
  successful_referral: "border-sky-200 bg-sky-50 text-sky-700",
  sale_achieved: "border-amber-200 bg-amber-50 text-amber-700",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  granted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-500",
};

export default function ReferralPage() {
  const { session } = useAuth();
  const { language } = useLanguage();
  const { isCpPointsEnabled } = useFeaturePermissions();
  const txt = TXT[language] || TXT["zh-TW"];
  const userId = session?.user?.id;

  if (!isCpPointsEnabled) {
    return <Navigate to="/" replace />;
  }
  const [codeCopied, setCodeCopied] = useState(false);

  // Generate referral code from user ID (first 8 chars uppercase)
  const referralCode = userId ? userId.substring(0, 8).toUpperCase() : "--------";

  // Get reward rules
  const { data: rewardRules = [] } = useQuery({
    queryKey: ["reward-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_rules")
        .select("rule_key, rule_value")
        .in("rule_key", ["referral_reward_by_tier", "consultation_reward_cp", "sale_reward_cp"]);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user membership for tier-based rewards
  const { data: membership } = useQuery({
    queryKey: ["my-membership", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_memberships")
        .select("*, current_tier:membership_tiers!user_memberships_current_tier_id_fkey(*)")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const getRewardAmount = (ruleKey: string): number => {
    const rule = rewardRules.find((r: any) => r.rule_key === ruleKey);
    if (!rule) return 0;
    const value = typeof rule.rule_value === "object" ? rule.rule_value : JSON.parse(rule.rule_value);

    // Handle tier-based rewards
    if (ruleKey === "referral_reward_by_tier") {
      const tierCode = (membership as any)?.current_tier?.tier_code || "normal";
      return value[tierCode] || 0;
    }

    return value.amount || 0;
  };

  // Get reward history
  const { data: rewards = [], isLoading: loadingRewards } = useQuery({
    queryKey: ["my-rewards", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_rewards")
        .select("*")
        .eq("referrer_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Stats
  const totalEarned = rewards
    .filter((r: any) => r.status === "granted")
    .reduce((sum: number, r: any) => sum + (r.cp_amount || 0), 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonthEarned = rewards
    .filter(
      (r: any) => r.status === "granted" && new Date(r.created_at) >= monthStart
    )
    .reduce((sum: number, r: any) => sum + (r.cp_amount || 0), 0);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCodeCopied(true);
      toast.success(txt.copied);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      language === "en" ? "en-US" : language === "zh-CN" ? "zh-CN" : "zh-TW",
      { year: "numeric", month: "short", day: "numeric" }
    );
  };

  const getTypeLabel = (type: string): string => {
    return (txt as Record<string, string>)[type] || type;
  };

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      pending: txt.pending,
      granted: txt.granted,
      cancelled: txt.cancelled,
    };
    return map[status] || status;
  };

  const rewardRateCards = [
    {
      label: txt.referralReward,
      amount: getRewardAmount("referral_reward_by_tier"),
      category: txt.activityReward,
      icon: Users,
      gradient: "from-sky-50 to-indigo-50",
      borderColor: "border-sky-200",
      iconColor: "text-sky-600",
    },
    {
      label: txt.consultationReward,
      amount: getRewardAmount("consultation_reward_cp"),
      category: txt.activityReward,
      icon: Heart,
      gradient: "from-violet-50 to-fuchsia-50",
      borderColor: "border-violet-200",
      iconColor: "text-violet-600",
    },
    {
      label: txt.saleReward,
      amount: getRewardAmount("sale_reward_cp"),
      category: txt.consumptionReward,
      icon: Award,
      gradient: "from-amber-50 to-orange-50",
      borderColor: "border-amber-200",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{txt.title}</h1>
        <p className="text-sm text-slate-500 mt-1">{txt.desc}</p>
      </div>

      {/* Referral Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden"
      >
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-sky-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-sky-400" />
              <span className="text-sm text-slate-300">{txt.referralCode}</span>
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-bold tracking-[0.25em] text-white">
              {referralCode}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopyCode}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                codeCopied
                  ? "bg-emerald-500 text-white"
                  : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
              )}
            >
              {codeCopied ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {codeCopied ? txt.copied : txt.copyCode}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">{txt.totalEarned}</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {totalEarned.toLocaleString()} <span className="text-sm text-slate-400">{txt.cpUnit}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">{txt.rewardsThisMonth}</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {thisMonthEarned.toLocaleString()} <span className="text-sm text-slate-400">{txt.cpUnit}</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* How It Works */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-4">{txt.howItWorks}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: txt.step1Title, desc: txt.step1Desc, icon: Share2, step: "1" },
            { title: txt.step2Title, desc: txt.step2Desc, icon: Users, step: "2" },
            { title: txt.step3Title, desc: txt.step3Desc, icon: Sparkles, step: "3" },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
                  {item.step}
                </div>
                <item.icon className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reward Rates */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-4">{txt.rewardRates}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {rewardRateCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 + index * 0.06 }}
              className={cn(
                "bg-gradient-to-br rounded-xl p-5 border shadow-sm",
                card.gradient,
                card.borderColor
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <card.icon className={cn("w-5 h-5", card.iconColor)} />
                  <span className="text-sm font-medium text-slate-700">{card.label}</span>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 h-5 border-slate-200 text-slate-500">
                  {card.category}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                +{card.amount} <span className="text-sm font-normal text-slate-500">{txt.cpUnit}</span>
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reward History */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{txt.rewardHistory}</h2>
        </div>

        {loadingRewards ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : rewards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
              <Gift className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">{txt.noRewards}</p>
            <p className="text-xs text-slate-400 max-w-xs text-center">{txt.noRewardsDesc}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">{txt.date}</th>
                  <th className="px-5 py-3 font-medium">{txt.type}</th>
                  <th className="px-5 py-3 font-medium text-right">{txt.amount}</th>
                  <th className="px-5 py-3 font-medium text-center">{txt.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rewards.map((reward: any) => (
                  <tr key={reward.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {formatDate(reward.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5",
                          REWARD_COLORS[reward.reward_type] || REWARD_COLORS.successful_referral
                        )}
                      >
                        {getTypeLabel(reward.reward_type)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right text-emerald-700 font-semibold font-mono">
                      +{reward.cp_amount?.toLocaleString()} <span className="text-emerald-500 text-xs">{txt.cpUnit}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5",
                          STATUS_COLORS[reward.status] || STATUS_COLORS.pending
                        )}
                      >
                        {getStatusLabel(reward.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
