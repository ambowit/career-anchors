import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Star,
  Crown,
  Gift,
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  AlertCircle,
  PartyPopper,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useCpWallet } from "@/hooks/useCpWallet";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import { Navigate } from "react-router-dom";

// --------------- i18n ---------------
const TXT = {
  en: {
    pageTitle: "Recharge CP",
    pageDesc: "Choose a package to top up your CP balance",
    breadcrumbHome: "Home",
    breadcrumbWallet: "CP Wallet",
    breadcrumbRecharge: "Recharge",
    loginRequired: "Login Required",
    loginRequiredDesc: "Please log in to recharge CP points",
    loginButton: "Log In",
    loading: "Loading packages...",
    noPackages: "No Packages Available",
    noPackagesDesc: "Please check back later for recharge packages",
    cpUnit: "CP (Career Points)",
    bonusCp: "Bonus",
    featured: "Best Value",
    originalPrice: "Original",
    memberDiscount: "Member Discount",
    yourPrice: "Your Price",
    selectPackage: "Select",
    currentBalance: "Current Balance",
    memberTier: "Member Tier",
    nonMember: "Non-Member",
    // Confirmation modal
    confirmTitle: "Confirm Recharge",
    confirmDesc: "Please review your purchase details",
    packageLabel: "Package",
    priceLabel: "Price",
    discountLabel: "Discount",
    totalCpLabel: "Total CP to Receive",
    paidCpLabel: "Paid CP",
    bonusCpLabel: "Bonus CP",
    paymentMethod: "Payment Method",
    platformPay: "Platform Balance",
    confirmButton: "Confirm Purchase",
    cancelButton: "Cancel",
    // Processing
    processing: "Processing your recharge...",
    pleaseWait: "Please do not close this page",
    // Success
    successTitle: "Recharge Successful!",
    successDesc: "Your CP has been added to your wallet",
    cpReceived: "CP Received",
    newBalance: "New Balance",
    viewWallet: "View Wallet",
    buyMore: "Buy More",
    // Errors
    errorGeneric: "Recharge failed. Please try again.",
    errorRetry: "Retry",
    off: "off",
  },
  "zh-TW": {
    pageTitle: "充值 CP",
    pageDesc: "選擇充值方案為您的 CP 帳戶加值",
    breadcrumbHome: "首頁",
    breadcrumbWallet: "CP 錢包",
    breadcrumbRecharge: "充值",
    loginRequired: "需要登入",
    loginRequiredDesc: "請登入後進行 CP 充值",
    loginButton: "登入",
    loading: "載入方案中...",
    noPackages: "暫無充值方案",
    noPackagesDesc: "請稍後再查看充值方案",
    cpUnit: "CP（生涯點）",
    bonusCp: "贈送",
    featured: "超值推薦",
    originalPrice: "原價",
    memberDiscount: "會員折扣",
    yourPrice: "您的價格",
    selectPackage: "選擇",
    currentBalance: "目前餘額",
    memberTier: "會員等級",
    nonMember: "非會員",
    // Confirmation modal
    confirmTitle: "確認充值",
    confirmDesc: "請確認您的購買詳情",
    packageLabel: "方案",
    priceLabel: "價格",
    discountLabel: "折扣",
    totalCpLabel: "獲得 CP 總計",
    paidCpLabel: "付費 CP",
    bonusCpLabel: "贈送 CP",
    paymentMethod: "付款方式",
    platformPay: "平台餘額",
    confirmButton: "確認購買",
    cancelButton: "取消",
    // Processing
    processing: "正在處理您的儲值...",
    pleaseWait: "請勿關閉此頁面",
    // Success
    successTitle: "儲值成功！",
    successDesc: "CP 已加入您的錢包",
    cpReceived: "獲得 CP",
    newBalance: "新餘額",
    viewWallet: "查看錢包",
    buyMore: "繼續儲值",
    // Errors
    errorGeneric: "儲值失敗，請重試。",
    errorRetry: "重試",
    off: "折",
  },
  "zh-CN": {
    pageTitle: "充值 CP",
    pageDesc: "选择充值方案为您的 CP 账户加值",
    breadcrumbHome: "首页",
    breadcrumbWallet: "CP 钱包",
    breadcrumbRecharge: "充值",
    loginRequired: "需要登录",
    loginRequiredDesc: "请登录后进行 CP 充值",
    loginButton: "登录",
    loading: "加载方案中...",
    noPackages: "暂无充值方案",
    noPackagesDesc: "请稍后再查看充值方案",
    cpUnit: "CP（生涯点）",
    bonusCp: "赠送",
    featured: "超值推荐",
    originalPrice: "原价",
    memberDiscount: "会员折扣",
    yourPrice: "您的价格",
    selectPackage: "选择",
    currentBalance: "当前余额",
    memberTier: "会员等级",
    nonMember: "非会员",
    // Confirmation modal
    confirmTitle: "确认充值",
    confirmDesc: "请确认您的购买详情",
    packageLabel: "方案",
    priceLabel: "价格",
    discountLabel: "折扣",
    totalCpLabel: "获得 CP 总计",
    paidCpLabel: "付费 CP",
    bonusCpLabel: "赠送 CP",
    paymentMethod: "付款方式",
    platformPay: "平台余额",
    confirmButton: "确认购买",
    cancelButton: "取消",
    // Processing
    processing: "正在处理您的充值...",
    pleaseWait: "请勿关闭此页面",
    // Success
    successTitle: "充值成功！",
    successDesc: "CP 已加入您的钱包",
    cpReceived: "获得 CP",
    newBalance: "新余额",
    viewWallet: "查看钱包",
    buyMore: "继续充值",
    // Errors
    errorGeneric: "充值失败，请重试。",
    errorRetry: "重试",
    off: "折",
  },
} as const;

// --------------- types ---------------
interface RechargePackage {
  id: string;
  package_name_zh_tw: string;
  package_name_zh_cn: string;
  package_name_en: string;
  price_amount: number;
  currency: string;
  cp_amount: number;
  bonus_cp_amount: number;
  description_zh_tw: string | null;
  description_zh_cn: string | null;
  description_en: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

interface RechargeResult {
  success: boolean;
  order: {
    id: string;
    cp_amount: number;
    bonus_cp_amount: number;
    total_cp: number;
    price_paid: number;
    currency: string;
    payment_reference: string;
  };
  wallet: {
    total_balance: number;
    balance_paid: number;
    balance_recharge_bonus: number;
    balance_activity: number;
  };
}

// --------------- helpers ---------------
const CURRENCY_SYMBOLS: Record<string, string> = {
  TWD: "NT$",
  USD: "$",
  CNY: "¥",
  HKD: "HK$",
};

function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getPackageName(
  packageItem: RechargePackage,
  language: string
): string {
  if (language === "en") return packageItem.package_name_en;
  if (language === "zh-CN") return packageItem.package_name_zh_cn || packageItem.package_name_zh_tw;
  return packageItem.package_name_zh_tw;
}

function getPackageDesc(
  packageItem: RechargePackage,
  language: string
): string | null {
  if (language === "en") return packageItem.description_en;
  if (language === "zh-CN") return packageItem.description_zh_cn || packageItem.description_zh_tw;
  return packageItem.description_zh_tw;
}

function getDiscountText(discountRate: number, language: string): string {
  const percentOff = Math.round((1 - discountRate) * 100);
  if (language === "en") return `${percentOff}% off`;
  return `${percentOff}% ${language === "zh-TW" ? "折扣" : "折扣"}`;
}

// --------------- gradient presets for cards ---------------
const CARD_GRADIENTS = [
  "from-slate-50 to-slate-100 border-slate-200",
  "from-sky-50 to-blue-50 border-sky-200",
  "from-amber-50 to-orange-50 border-amber-200",
  "from-emerald-50 to-teal-50 border-emerald-200",
  "from-violet-50 to-purple-50 border-violet-200",
  "from-rose-50 to-pink-50 border-rose-200",
];

const FEATURED_GRADIENT = "from-amber-50 via-yellow-50 to-orange-50 border-amber-300 ring-2 ring-amber-200/50";

// =============== MAIN COMPONENT ===============
export default function RechargePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { isCpPointsEnabled } = useFeaturePermissions();
  const queryClient = useQueryClient();
  const { wallet, membership } = useCpWallet();

  const textContent = TXT[language] || TXT["zh-TW"];

  if (!isCpPointsEnabled) {
    return <Navigate to="/" replace />;
  }

  const [selectedPackage, setSelectedPackage] = useState<RechargePackage | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rechargeResult, setRechargeResult] = useState<RechargeResult | null>(null);

  const discountRate = membership?.current_tier?.discount_rate ?? 1.0;
  const hasMemberDiscount = discountRate < 1.0;

  // ---- Query packages ----
  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ["recharge-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recharge_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as RechargePackage[];
    },
  });

  // ---- Recharge mutation ----
  const rechargeMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const { data, error } = await supabase.functions.invoke("process-recharge", {
        body: { user_id: user?.id, package_id: packageId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as RechargeResult;
    },
    onSuccess: (data) => {
      setRechargeResult(data);
      setShowConfirm(false);
      setShowSuccess(true);
      // Invalidate wallet & transaction queries
      queryClient.invalidateQueries({ queryKey: ["cp-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["cp-membership"] });
      queryClient.invalidateQueries({ queryKey: ["cp-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cp-expiring"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || textContent.errorGeneric);
    },
  });

  function handleSelectPackage(packageItem: RechargePackage) {
    setSelectedPackage(packageItem);
    setShowConfirm(true);
  }

  function handleConfirmRecharge() {
    if (!selectedPackage) return;
    rechargeMutation.mutate(selectedPackage.id);
  }

  function handleCloseSuccess() {
    setShowSuccess(false);
    setRechargeResult(null);
    setSelectedPackage(null);
  }

  // --------------- render guards ---------------
  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
            <CreditCard className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{textContent.loginRequired}</h2>
          <p className="text-sm text-slate-500 mb-6">{textContent.loginRequiredDesc}</p>
          <button
            onClick={() => navigate("/auth")}
            className="px-6 py-2.5 text-sm font-semibold rounded-lg text-white transition-all hover:shadow-lg"
            style={{ backgroundColor: "#1a3a5c" }}
          >
            {textContent.loginButton}
          </button>
        </motion.div>
      </div>
    );
  }

  // --------------- page ---------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <button onClick={() => navigate("/")} className="hover:text-slate-700 transition-colors">
              {textContent.breadcrumbHome}
            </button>
            <span>/</span>
            <button onClick={() => navigate("/cp-wallet")} className="hover:text-slate-700 transition-colors">
              {textContent.breadcrumbWallet}
            </button>
            <span>/</span>
            <span className="text-slate-800 font-medium">{textContent.breadcrumbRecharge}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/cp-wallet")}
                className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{textContent.pageTitle}</h1>
                <p className="text-sm text-slate-500 mt-0.5">{textContent.pageDesc}</p>
              </div>
            </div>

            {/* Current balance badge */}
            <div className="hidden sm:flex items-center gap-4">
              {membership?.current_tier && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-slate-500">{textContent.memberTier}:</span>
                  <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 font-semibold">
                    {membership.current_tier.icon_emoji || ""}{" "}
                    {language === "en"
                      ? membership.current_tier.tier_name_en
                      : language === "zh-CN"
                        ? membership.current_tier.tier_name_zh_cn
                        : membership.current_tier.tier_name_zh_tw}
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-slate-100">
                <span className="text-slate-500">{textContent.currentBalance}:</span>
                <span className="font-bold text-slate-800">
                  {wallet?.total_balance?.toLocaleString() || 0} {textContent.cpUnit}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Member discount banner */}
        {hasMemberDiscount && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
          >
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Crown className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                {textContent.memberDiscount}: {getDiscountText(discountRate, language)}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {language === "en"
                  ? `As a ${membership?.current_tier?.tier_name_en} member, all packages are discounted for you.`
                  : language === "zh-CN"
                    ? `作为${membership?.current_tier?.tier_name_zh_cn}会员，所有方案均享受折扣。`
                    : `身為${membership?.current_tier?.tier_name_zh_tw}會員，所有方案均享有折扣。`}
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
          </motion.div>
        )}

        {/* Loading */}
        {packagesLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
            <p className="text-sm text-slate-500">{textContent.loading}</p>
          </div>
        )}

        {/* Empty */}
        {!packagesLoading && (!packages || packages.length === 0) && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-2">
              <CreditCard className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">{textContent.noPackages}</h3>
            <p className="text-sm text-slate-500">{textContent.noPackagesDesc}</p>
          </div>
        )}

        {/* Package grid */}
        {!packagesLoading && packages && packages.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages.map((packageItem, index) => {
              const originalPrice = Number(packageItem.price_amount);
              const finalPrice = originalPrice * discountRate;
              const totalCp = packageItem.cp_amount + packageItem.bonus_cp_amount;
              const description = getPackageDesc(packageItem, language);
              const gradientClass = packageItem.is_featured
                ? FEATURED_GRADIENT
                : CARD_GRADIENTS[index % CARD_GRADIENTS.length];

              return (
                <motion.div
                  key={packageItem.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className={cn(
                    "relative rounded-2xl border bg-gradient-to-br p-6 flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group",
                    gradientClass
                  )}
                  onClick={() => handleSelectPackage(packageItem)}
                >
                  {/* Featured badge */}
                  {packageItem.is_featured && (
                    <div className="absolute -top-2.5 left-5">
                      <Badge className="bg-amber-500 text-white border-0 shadow-md text-xs px-2.5 h-6 gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        {textContent.featured}
                      </Badge>
                    </div>
                  )}

                  {/* CP amount header */}
                  <div className="mb-4 mt-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-slate-900">{totalCp.toLocaleString()}</span>
                      <span className="text-sm font-semibold text-slate-500">{textContent.cpUnit}</span>
                    </div>
                    {packageItem.bonus_cp_amount > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Gift className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600">
                          {textContent.bonusCp} +{packageItem.bonus_cp_amount} {textContent.cpUnit}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Package name */}
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    {getPackageName(packageItem, language)}
                  </h3>
                  {description && (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{description}</p>
                  )}

                  <div className="mt-auto pt-4 border-t border-slate-200/60">
                    {/* Price */}
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        {hasMemberDiscount && (
                          <p className="text-xs text-slate-400 line-through mb-0.5">
                            {formatPrice(originalPrice, packageItem.currency)}
                          </p>
                        )}
                        <p className="text-xl font-extrabold text-slate-900">
                          {formatPrice(Math.round(finalPrice), packageItem.currency)}
                        </p>
                      </div>
                      {hasMemberDiscount && (
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 text-xs">
                          -{Math.round((1 - discountRate) * 100)}%
                        </Badge>
                      )}
                    </div>

                    {/* Select button */}
                    <button
                      className={cn(
                        "w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                        packageItem.is_featured
                          ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                          : "bg-slate-800 hover:bg-slate-900 text-white"
                      )}
                    >
                      {textContent.selectPackage}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Trust badges */}
        {!packagesLoading && packages && packages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex items-center justify-center gap-8 text-slate-400"
          >
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>{language === "en" ? "Secure Payment" : "安全支付"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Zap className="w-4 h-4" />
              <span>{language === "en" ? "Instant Delivery" : "即時到帳"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Star className="w-4 h-4" />
              <span>{language === "en" ? "Member Benefits" : "會員專享"}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ==================== CONFIRMATION MODAL ==================== */}
      <AnimatePresence>
        {showConfirm && selectedPackage && (
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => !rechargeMutation.isPending && setShowConfirm(false)}
          >
            <motion.div
              key="confirm-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              {/* Modal header */}
              <div className="px-6 pt-6 pb-4">
                <h3 className="text-lg font-bold text-slate-900">{textContent.confirmTitle}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{textContent.confirmDesc}</p>
              </div>

              {/* Modal content */}
              {rechargeMutation.isPending ? (
                <div className="px-6 py-12 flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{textContent.processing}</p>
                  <p className="text-xs text-slate-400">{textContent.pleaseWait}</p>
                </div>
              ) : (
                <div className="px-6 pb-2 space-y-4">
                  {/* Package summary */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">{textContent.packageLabel}</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {getPackageName(selectedPackage, language)}
                      </span>
                    </div>

                    {hasMemberDiscount && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">{textContent.originalPrice}</span>
                          <span className="text-sm text-slate-400 line-through">
                            {formatPrice(Number(selectedPackage.price_amount), selectedPackage.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-emerald-600">{textContent.discountLabel}</span>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50 text-xs">
                            -{Math.round((1 - discountRate) * 100)}%
                          </Badge>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-sm font-semibold text-slate-700">{textContent.priceLabel}</span>
                      <span className="text-lg font-extrabold text-slate-900">
                        {formatPrice(
                          Math.round(Number(selectedPackage.price_amount) * discountRate),
                          selectedPackage.currency
                        )}
                      </span>
                    </div>
                  </div>

                  {/* CP breakdown */}
                  <div className="bg-sky-50/60 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">{textContent.paidCpLabel}</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {selectedPackage.cp_amount.toLocaleString()} {textContent.cpUnit}
                      </span>
                    </div>
                    {selectedPackage.bonus_cp_amount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-emerald-600 flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5" />
                          {textContent.bonusCpLabel}
                        </span>
                        <span className="text-sm font-semibold text-emerald-600">
                          +{selectedPackage.bonus_cp_amount.toLocaleString()} {textContent.cpUnit}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-sky-200/60">
                      <span className="text-sm font-semibold text-slate-700">{textContent.totalCpLabel}</span>
                      <span className="text-lg font-extrabold text-sky-700">
                        {(selectedPackage.cp_amount + selectedPackage.bonus_cp_amount).toLocaleString()} {textContent.cpUnit}
                      </span>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="flex items-center justify-between px-1 py-2">
                    <span className="text-sm text-slate-500">{textContent.paymentMethod}</span>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      {textContent.platformPay}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal footer */}
              {!rechargeMutation.isPending && (
                <div className="px-6 py-4 flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {textContent.cancelButton}
                  </button>
                  <button
                    onClick={handleConfirmRecharge}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg"
                    style={{ backgroundColor: "#1a3a5c" }}
                  >
                    {textContent.confirmButton}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== SUCCESS MODAL ==================== */}
      <AnimatePresence>
        {showSuccess && rechargeResult && (
          <motion.div
            key="success-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          >
            <motion.div
              key="success-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              {/* Success animation area */}
              <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 px-6 pt-10 pb-8 text-center overflow-hidden">
                {/* Decorative dots */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="absolute top-4 left-8 w-2.5 h-2.5 rounded-full bg-amber-300/60"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="absolute top-8 right-12 w-3 h-3 rounded-full bg-emerald-300/60"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                  className="absolute bottom-6 left-16 w-2 h-2 rounded-full bg-sky-300/60"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
                  className="absolute top-12 right-6 w-1.5 h-1.5 rounded-full bg-pink-300/60"
                />

                {/* Check icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.25, type: "spring", stiffness: 400 }}
                  >
                    <Check className="w-8 h-8 text-emerald-600" strokeWidth={3} />
                  </motion.div>
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold text-slate-900"
                >
                  {textContent.successTitle}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-slate-500 mt-1"
                >
                  {textContent.successDesc}
                </motion.p>

                {/* CP received */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 shadow-sm"
                >
                  <PartyPopper className="w-5 h-5 text-amber-500" />
                  <span className="text-2xl font-extrabold text-slate-900">
                    +{rechargeResult.order.total_cp.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">{textContent.cpUnit}</span>
                </motion.div>
              </div>

              {/* Result details */}
              <div className="px-6 py-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">{textContent.cpReceived}</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {rechargeResult.order.cp_amount.toLocaleString()}
                    {rechargeResult.order.bonus_cp_amount > 0 &&
                      ` + ${rechargeResult.order.bonus_cp_amount.toLocaleString()} ${textContent.bonusCp}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">{textContent.newBalance}</span>
                  <span className="text-base font-extrabold text-emerald-600">
                    {rechargeResult.wallet.total_balance.toLocaleString()} {textContent.cpUnit}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-6 pb-5 flex gap-3">
                <button
                  onClick={() => {
                    handleCloseSuccess();
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {textContent.buyMore}
                </button>
                <button
                  onClick={() => navigate("/cp-wallet")}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: "#1a3a5c" }}
                >
                  {textContent.viewWallet}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
