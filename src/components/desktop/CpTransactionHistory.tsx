import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Gift,
  RefreshCw,
  Clock,
  Star,
  Filter,
  Users,
  MessageSquare,
  ShoppingCart,
  Wallet,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import type { CpTransaction } from "@/hooks/useCpWallet";
import { cn } from "@/lib/utils";

interface CpTransactionHistoryProps {
  transactions: CpTransaction[];
  maxItems?: number;
}

type TransactionFilter = "all" | "paid_recharge" | "recharge_bonus" | "activity_reward" | "consumption" | "refund";

const TRANSACTION_ICONS: Record<string, typeof ArrowUpCircle> = {
  recharge: ArrowUpCircle,
  recharge_bonus: Gift,
  activity_grant: Star,
  consumption: ArrowDownCircle,
  refund: RefreshCw,
  refund_bonus_deduct: RefreshCw,
  expiry: Clock,
  referral_reward: Users,
  consultation_reward: MessageSquare,
  sale_reward: ShoppingCart,
};

const TRANSACTION_COLORS: Record<string, string> = {
  recharge: "text-emerald-600 bg-emerald-50",
  recharge_bonus: "text-sky-600 bg-sky-50",
  activity_grant: "text-amber-600 bg-amber-50",
  consumption: "text-red-500 bg-red-50",
  refund: "text-orange-500 bg-orange-50",
  refund_bonus_deduct: "text-orange-400 bg-orange-50",
  expiry: "text-slate-400 bg-slate-100",
  referral_reward: "text-violet-600 bg-violet-50",
  consultation_reward: "text-indigo-600 bg-indigo-50",
  sale_reward: "text-teal-600 bg-teal-50",
};

const TXT = {
  en: {
    title: "Transaction History",
    all: "All",
    paidRecharge: "Paid Recharge",
    rechargeBonus: "Recharge Bonus",
    activityReward: "Activity Reward",
    consumption: "Consumption",
    refund: "Refund",
    noTransactions: "No transactions yet",
    deductionBreakdown: "Deduction Breakdown",
    paidUsed: "Paid",
    bonusUsed: "Bonus",
    activityUsed: "Activity",
    balanceAfter: "Balance After",
    orderId: "Order",
    typeLabels: {
      recharge: "Recharge (Paid)",
      recharge_bonus: "Recharge Bonus",
      activity_grant: "Activity Grant",
      consumption: "Consumption",
      refund: "Refund",
      refund_bonus_deduct: "Bonus Deduction",
      expiry: "Expired",
      referral_reward: "Referral Reward",
      consultation_reward: "Consultation Reward",
      sale_reward: "Sale Reward",
    } as Record<string, string>,
    cpTypeLabels: {
      paid: "Paid CP",
      recharge_bonus: "Bonus CP",
      activity: "Activity CP",
    } as Record<string, string>,
  },
  "zh-TW": {
    title: "交易明細",
    all: "全部",
    paidRecharge: "儲值購買",
    rechargeBonus: "儲值贈送",
    activityReward: "活動獎勵",
    consumption: "消費",
    refund: "退費",
    noTransactions: "尚無交易記錄",
    deductionBreakdown: "扣點明細",
    paidUsed: "付費",
    bonusUsed: "贈送",
    activityUsed: "活動",
    balanceAfter: "交易後餘額",
    orderId: "訂單",
    typeLabels: {
      recharge: "儲值購買",
      recharge_bonus: "儲值贈送",
      activity_grant: "活動贈點",
      consumption: "消費扣點",
      refund: "退費返還",
      refund_bonus_deduct: "贈送點扣除",
      expiry: "到期過期",
      referral_reward: "推薦獎勵",
      consultation_reward: "諮詢獎勵",
      sale_reward: "銷售獎勵",
    } as Record<string, string>,
    cpTypeLabels: {
      paid: "付費 CP",
      recharge_bonus: "贈送 CP",
      activity: "活動 CP",
    } as Record<string, string>,
  },
  "zh-CN": {
    title: "交易明细",
    all: "全部",
    paidRecharge: "充值购买",
    rechargeBonus: "充值赠送",
    activityReward: "活动奖励",
    consumption: "消费",
    refund: "退费",
    noTransactions: "尚无交易记录",
    deductionBreakdown: "扣点明细",
    paidUsed: "付费",
    bonusUsed: "赠送",
    activityUsed: "活动",
    balanceAfter: "交易后余额",
    orderId: "订单",
    typeLabels: {
      recharge: "充值购买",
      recharge_bonus: "充值赠送",
      activity_grant: "活动赠点",
      consumption: "消费扣点",
      refund: "退费返还",
      refund_bonus_deduct: "赠送点扣除",
      expiry: "到期过期",
      referral_reward: "推荐奖励",
      consultation_reward: "咨询奖励",
      sale_reward: "销售奖励",
    } as Record<string, string>,
    cpTypeLabels: {
      paid: "付费 CP",
      recharge_bonus: "赠送 CP",
      activity: "活动 CP",
    } as Record<string, string>,
  },
};

const FILTER_MAP: Record<TransactionFilter, string[]> = {
  all: [],
  paid_recharge: ["recharge"],
  recharge_bonus: ["recharge_bonus"],
  activity_reward: ["activity_grant", "referral_reward", "consultation_reward", "sale_reward"],
  consumption: ["consumption"],
  refund: ["refund", "refund_bonus_deduct"],
};

function formatDate(dateString: string, language: string): string {
  const date = new Date(dateString);
  if (language === "en") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function isPositiveTransaction(transactionType: string): boolean {
  return ["recharge", "recharge_bonus", "activity_grant", "refund", "referral_reward", "consultation_reward", "sale_reward"].includes(transactionType);
}

export default function CpTransactionHistory({ transactions, maxItems }: CpTransactionHistoryProps) {
  const { language } = useLanguage();
  const t = TXT[language as keyof typeof TXT] ?? TXT["zh-TW"];
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    const filterTypes = FILTER_MAP[filter];
    const filtered = filterTypes.length > 0
      ? transactions.filter((transaction) => filterTypes.includes(transaction.transaction_type))
      : transactions;
    return maxItems ? filtered.slice(0, maxItems) : filtered;
  }, [transactions, filter, maxItems]);

  const filters: { key: TransactionFilter; label: string }[] = [
    { key: "all", label: t.all },
    { key: "paid_recharge", label: t.paidRecharge },
    { key: "recharge_bonus", label: t.rechargeBonus },
    { key: "activity_reward", label: t.activityReward },
    { key: "consumption", label: t.consumption },
    { key: "refund", label: t.refund },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800">{t.title}</h2>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {filters.map((filterItem) => (
            <button
              key={filterItem.key}
              onClick={() => setFilter(filterItem.key)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                filter === filterItem.key
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {filterItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-5 pb-5">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <Filter className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">{t.noTransactions}</p>
          </div>
        ) : (
          <div className="space-y-1 mt-2">
            {filteredTransactions.map((transaction, index) => {
              const IconComponent = TRANSACTION_ICONS[transaction.transaction_type] ?? ArrowDownCircle;
              const colorClass = TRANSACTION_COLORS[transaction.transaction_type] ?? "text-slate-500 bg-slate-100";
              const isPositive = isPositiveTransaction(transaction.transaction_type);
              const amount = Number(transaction.amount);
              const isConsumption = transaction.transaction_type === "consumption";
              const isExpanded = expandedId === transaction.id;
              const paidUsed = Number(transaction.paid_used || 0);
              const bonusUsed = Number(transaction.bonus_used || 0);
              const activityUsed = Number(transaction.activity_used || 0);
              const hasBreakdown = isConsumption && (paidUsed > 0 || bonusUsed > 0 || activityUsed > 0);

              return (
                <div key={transaction.id}>
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.015 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors",
                      hasBreakdown && "cursor-pointer"
                    )}
                    onClick={() => hasBreakdown && setExpandedId(isExpanded ? null : transaction.id)}
                  >
                    {/* Icon */}
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {t.typeLabels[transaction.transaction_type] ?? transaction.transaction_type}
                        </p>
                        <Badge variant="outline" className="text-[10px] px-1.5 h-5 border-slate-200 text-slate-500">
                          {t.cpTypeLabels[transaction.cp_type] ?? transaction.cp_type}
                        </Badge>
                        {hasBreakdown && (
                          <Info className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {transaction.description || formatDate(transaction.created_at, language)}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className={cn("text-sm font-bold", isPositive ? "text-emerald-600" : "text-red-500")}>
                        {isPositive ? "+" : "-"}{Math.abs(amount).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatDate(transaction.created_at, language)}
                      </p>
                    </div>
                  </motion.div>

                  {/* Expandable consumption breakdown */}
                  {isExpanded && hasBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-12 mr-3 mb-2 px-4 py-3 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <p className="text-[11px] font-semibold text-slate-600 mb-2">{t.deductionBreakdown}</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[10px] text-slate-400">{t.paidUsed}</p>
                          <p className="text-xs font-bold text-sky-600">{paidUsed.toLocaleString()} CP</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">{t.bonusUsed}</p>
                          <p className="text-xs font-bold text-violet-600">{bonusUsed.toLocaleString()} CP</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">{t.activityUsed}</p>
                          <p className="text-xs font-bold text-amber-600">{activityUsed.toLocaleString()} CP</p>
                        </div>
                      </div>
                      {/* Balance after */}
                      <div className="mt-2 pt-2 border-t border-slate-200/60">
                        <p className="text-[10px] text-slate-400 mb-1">{t.balanceAfter}</p>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-slate-600">
                            <Wallet className="w-3 h-3 inline mr-0.5 text-slate-400" />
                            {Number(transaction.balance_after_paid || 0).toLocaleString()}
                          </span>
                          <span className="text-slate-600">
                            <Gift className="w-3 h-3 inline mr-0.5 text-slate-400" />
                            {Number(transaction.balance_after_bonus || 0).toLocaleString()}
                          </span>
                          <span className="text-slate-600">
                            <Star className="w-3 h-3 inline mr-0.5 text-slate-400" />
                            {Number(transaction.balance_after_activity || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
