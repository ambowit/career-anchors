import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  X,
  Tag,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

interface CpPurchaseModalProps {
  isOpen: boolean;
  serviceName: string;
  originalPrice: number;
  discountedPrice: number;
  discountRate: number;
  totalBalance: number;
  isPurchasing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const TXT = {
  en: {
    title: "Confirm Purchase",
    service: "Service",
    originalPrice: "Original Price",
    memberDiscount: "Member Discount",
    finalPrice: "Final Price",
    currentBalance: "Current Balance",
    afterPurchase: "After Purchase",
    confirm: "Confirm Purchase",
    purchasing: "Processing…",
    cancel: "Cancel",
    insufficientTitle: "Insufficient CP Balance",
    insufficientDesc: "You need more CP to access this service",
    needed: "Required",
    deficit: "Shortfall",
    recharge: "Recharge Now",
    off: "off",
    cpUnit: "CP (Career Points)",
  },
  "zh-TW": {
    title: "確認購買",
    service: "服務項目",
    originalPrice: "原價",
    memberDiscount: "會員折扣",
    finalPrice: "實付價格",
    currentBalance: "目前餘額",
    afterPurchase: "購買後餘額",
    confirm: "確認購買",
    purchasing: "處理中…",
    cancel: "取消",
    insufficientTitle: "CP 餘額不足",
    insufficientDesc: "您需要更多 CP 才能使用此服務",
    needed: "需要",
    deficit: "差額",
    recharge: "立即儲值",
    off: "折",
    cpUnit: "CP（生涯點）",
  },
  "zh-CN": {
    title: "确认购买",
    service: "服务项目",
    originalPrice: "原价",
    memberDiscount: "会员折扣",
    finalPrice: "实付价格",
    currentBalance: "当前余额",
    afterPurchase: "购买后余额",
    confirm: "确认购买",
    purchasing: "处理中…",
    cancel: "取消",
    insufficientTitle: "CP 余额不足",
    insufficientDesc: "您需要更多 CP 才能使用此服务",
    needed: "需要",
    deficit: "差额",
    recharge: "立即充值",
    off: "折",
    cpUnit: "CP（生涯点）",
  },
} as const;

type LangKey = keyof typeof TXT;

export default function CpPurchaseModal({
  isOpen,
  serviceName,
  originalPrice,
  discountedPrice,
  discountRate,
  totalBalance,
  isPurchasing,
  onConfirm,
  onCancel,
}: CpPurchaseModalProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const txt = TXT[(language as LangKey) || "zh-TW"];

  const hasDiscount = discountRate < 1;
  const canAfford = totalBalance >= discountedPrice;
  const balanceAfter = totalBalance - discountedPrice;
  const deficit = discountedPrice - totalBalance;

  const discountPercent = Math.round((1 - discountRate) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(event) => event.stopPropagation()}>
              {/* Header */}
              <div className={cn(
                "px-6 py-5 flex items-center justify-between",
                canAfford
                  ? "bg-gradient-to-r from-slate-800 to-slate-900"
                  : "bg-gradient-to-r from-amber-600 to-orange-600"
              )}>
                <div className="flex items-center gap-3">
                  {canAfford ? (
                    <ShoppingCart className="w-5 h-5 text-white/80" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-white/90" />
                  )}
                  <h3 className="text-white font-semibold text-lg">
                    {canAfford ? txt.title : txt.insufficientTitle}
                  </h3>
                </div>
                <button
                  onClick={onCancel}
                  className="text-white/60 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {canAfford ? (
                  <>
                    {/* Service info */}
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="text-xs text-slate-500 mb-1">{txt.service}</div>
                      <div className="text-base font-semibold text-slate-800">{serviceName}</div>
                    </div>

                    {/* Price breakdown */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{txt.originalPrice}</span>
                        <span className={cn(
                          "font-mono font-medium",
                          hasDiscount ? "line-through text-slate-400" : "text-slate-700"
                        )}>
                          {originalPrice} {txt.cpUnit}
                        </span>
                      </div>

                      {hasDiscount && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 font-medium">
                              {txt.memberDiscount} ({discountPercent}% {txt.off})
                            </span>
                          </div>
                          <span className="text-emerald-600 font-mono font-medium">
                            −{originalPrice - discountedPrice} {txt.cpUnit}
                          </span>
                        </div>
                      )}

                      <div className="h-px bg-slate-200" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">{txt.finalPrice}</span>
                        <span className="text-xl font-bold text-slate-800 font-mono">
                          {discountedPrice}
                          <span className="text-sm font-medium text-slate-400 ml-1">{txt.cpUnit}</span>
                        </span>
                      </div>
                    </div>

                    {/* Balance info */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-500">{txt.currentBalance}</span>
                        </div>
                        <span className="font-mono font-medium text-slate-700">
                          {Math.floor(totalBalance)} {txt.cpUnit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{txt.afterPurchase}</span>
                        <span className="font-mono font-medium text-emerald-600">
                          {Math.floor(balanceAfter)} {txt.cpUnit}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={onCancel}
                        disabled={isPurchasing}
                        className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        {txt.cancel}
                      </button>
                      <button
                        onClick={onConfirm}
                        disabled={isPurchasing}
                        className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isPurchasing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {txt.purchasing}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            {txt.confirm}
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Insufficient balance */}
                    <p className="text-sm text-slate-500">{txt.insufficientDesc}</p>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2.5">
                      <div className="text-sm font-medium text-slate-700">{serviceName}</div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{txt.needed}</span>
                        <span className="font-mono font-bold text-slate-700">{discountedPrice} {txt.cpUnit}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{txt.currentBalance}</span>
                        <span className="font-mono font-medium text-slate-600">{Math.floor(totalBalance)} {txt.cpUnit}</span>
                      </div>
                      <div className="h-px bg-amber-200" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-700 font-medium">{txt.deficit}</span>
                        <span className="font-mono font-bold text-amber-700">
                          {Math.ceil(deficit)} {txt.cpUnit}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        {txt.cancel}
                      </button>
                      <button
                        onClick={() => {
                          onCancel();
                          navigate("/recharge");
                        }}
                        className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        {txt.recharge}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
