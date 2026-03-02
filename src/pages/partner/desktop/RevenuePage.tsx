import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  Loader2,
  Download,
  Wallet,
  TrendingUp,
  Package,
  FileText,
  Link2,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TXT = {
  en: {
    title: "Revenue Report",
    desc: "Revenue breakdown, settlement history and detailed export",
    pendingSettlement: "Pending Settlement",
    settledThisMonth: "Settled This Month",
    lifetimeRevenue: "Lifetime Revenue",
    revenueByProduct: "Revenue by Product",
    productName: "Product",
    totalSales: "Total Sales",
    totalRevenue: "Total Revenue",
    pendingAmount: "Pending",
    settledAmount: "Settled",
    settlementHistory: "Settlement History",
    noRevenue: "No revenue yet",
    noRevenueDesc: "Revenue records will appear here once sales are made",
    noPartner: "Partner Account Not Found",
    noPartnerDesc: "Your partner account is being set up. Please contact support.",
    exportCsv: "Export CSV",
    exportExcel: "Export Excel",
    exportMenu: "Export",
    cpUnit: "CP",
    pending: "Pending",
    settled: "Settled",
    cancelled: "Cancelled",
    date: "Date",
    amount: "Amount",
    status: "Status",
    product: "Product",
    noSettlements: "No settlement records yet",
    type: "Type",
    document: "Document",
    link: "Link",
    membershipTier: "Membership",
    originalPrice: "Original Price",
    actualPaid: "Actual Paid",
    splitRatio: "Split %",
    platformShare: "Platform Share",
    partnerShare: "Partner Share",
    userId: "User ID",
    allRecords: "All Records",
    detailExport: "Detail Export",
  },
  "zh-TW": {
    title: "收入報表",
    desc: "收入明細、結算歷史與詳細匯出",
    pendingSettlement: "待結算",
    settledThisMonth: "本月已結算",
    lifetimeRevenue: "累計已結算",
    revenueByProduct: "各產品收入",
    productName: "產品",
    totalSales: "銷售筆數",
    totalRevenue: "總收入",
    pendingAmount: "待結算",
    settledAmount: "已結算",
    settlementHistory: "結算明細",
    noRevenue: "尚無收入記錄",
    noRevenueDesc: "當產生銷售後，收入記錄將顯示在此",
    noPartner: "找不到合作方帳戶",
    noPartnerDesc: "您的合作方帳戶正在設定中，請聯繫管理員。",
    exportCsv: "匯出 CSV",
    exportExcel: "匯出 Excel",
    exportMenu: "匯出",
    cpUnit: "CP",
    pending: "待結算",
    settled: "已結算",
    cancelled: "已取消",
    date: "日期",
    amount: "金額",
    status: "狀態",
    product: "產品",
    noSettlements: "尚無結算記錄",
    type: "類型",
    document: "文檔",
    link: "連結",
    membershipTier: "會員等級",
    originalPrice: "原價",
    actualPaid: "實付",
    splitRatio: "分潤比",
    platformShare: "平台分成",
    partnerShare: "合作方分成",
    userId: "用戶 ID",
    allRecords: "全部記錄",
    detailExport: "明細匯出",
  },
  "zh-CN": {
    title: "收入报表",
    desc: "收入明细、结算历史与详细导出",
    pendingSettlement: "待结算",
    settledThisMonth: "本月已结算",
    lifetimeRevenue: "累计已结算",
    revenueByProduct: "各产品收入",
    productName: "产品",
    totalSales: "销售笔数",
    totalRevenue: "总收入",
    pendingAmount: "待结算",
    settledAmount: "已结算",
    settlementHistory: "结算明细",
    noRevenue: "暂无收入记录",
    noRevenueDesc: "当产生销售后，收入记录将显示在此",
    noPartner: "找不到合作方账户",
    noPartnerDesc: "您的合作方账户正在设定中，请联系管理员。",
    exportCsv: "导出 CSV",
    exportExcel: "导出 Excel",
    exportMenu: "导出",
    cpUnit: "CP",
    pending: "待结算",
    settled: "已结算",
    cancelled: "已取消",
    date: "日期",
    amount: "金额",
    status: "状态",
    product: "产品",
    noSettlements: "暂无结算记录",
    type: "类型",
    document: "文档",
    link: "链接",
    membershipTier: "会员等级",
    originalPrice: "原价",
    actualPaid: "实付",
    splitRatio: "分润比",
    platformShare: "平台分成",
    partnerShare: "合作方分成",
    userId: "用户 ID",
    allRecords: "全部记录",
    detailExport: "明细导出",
  },
};

const SETTLEMENT_COLORS: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  settled: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-200 bg-slate-50 text-slate-500",
};

interface ProductRevenueSummary {
  productId: string;
  productName: string;
  productType: string;
  salesCount: number;
  totalRevenue: number;
  pendingAmount: number;
  settledAmount: number;
}

export default function RevenuePage() {
  const { session } = useAuth();
  const { language } = useLanguage();
  const txt = TXT[language] || TXT["zh-TW"];
  const userId = session?.user?.id;
  const [activeTab, setActiveTab] = useState<"products" | "history" | "all">("products");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Get partner profile
  const { data: partner, isLoading: loadingPartner } = useQuery({
    queryKey: ["partner-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_partners")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const partnerId = partner?.id;

  // Get all revenue records with product info (including product_type)
  const { data: revenueRecords = [], isLoading: loadingRevenue } = useQuery({
    queryKey: ["partner-revenue-full", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_revenue")
        .select("*, partner_products(product_name_zh_tw, product_name_zh_cn, product_name_en, product_type, revenue_split_platform, revenue_split_partner)")
        .eq("partner_id", partnerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId,
  });

  // Get detailed sales records (with membership tier, original price, split snapshot)
  const { data: detailedSales = [] } = useQuery({
    queryKey: ["partner-sales-detailed", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_sales")
        .select("*, partner_products(product_name_zh_tw, product_name_zh_cn, product_name_en, product_type)")
        .eq("partner_id", partnerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId,
  });

  // Compute summary stats
  const monthStart = useMemo(() => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const pendingSettlement = useMemo(
    () =>
      revenueRecords
        .filter((record: any) => record.settlement_status === "pending")
        .reduce((sum: number, record: any) => sum + (record.partner_share || 0), 0),
    [revenueRecords]
  );

  const settledThisMonth = useMemo(
    () =>
      revenueRecords
        .filter(
          (record: any) =>
            record.settlement_status === "settled" &&
            record.settled_at &&
            new Date(record.settled_at) >= monthStart
        )
        .reduce((sum: number, record: any) => sum + (record.partner_share || 0), 0),
    [revenueRecords, monthStart]
  );

  const lifetimeRevenue = useMemo(
    () =>
      revenueRecords
        .filter((record: any) => record.settlement_status === "settled")
        .reduce((sum: number, record: any) => sum + (record.partner_share || 0), 0),
    [revenueRecords]
  );

  // Revenue by product (with type info)
  const productRevenueSummaries = useMemo(() => {
    const productRevenueMap = new Map<string, ProductRevenueSummary>();
    revenueRecords.forEach((record: any) => {
      const productId = record.product_id;
      const existing = productRevenueMap.get(productId);
      const productName = getProductNameFromRecord(record, language);
      const productType = record.partner_products?.product_type || "document";

      if (existing) {
        existing.salesCount += 1;
        existing.totalRevenue += record.partner_share || 0;
        if (record.settlement_status === "pending") {
          existing.pendingAmount += record.partner_share || 0;
        } else if (record.settlement_status === "settled") {
          existing.settledAmount += record.partner_share || 0;
        }
      } else {
        productRevenueMap.set(productId, {
          productId,
          productName,
          productType,
          salesCount: 1,
          totalRevenue: record.partner_share || 0,
          pendingAmount: record.settlement_status === "pending" ? record.partner_share || 0 : 0,
          settledAmount: record.settlement_status === "settled" ? record.partner_share || 0 : 0,
        });
      }
    });

    return Array.from(productRevenueMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [revenueRecords, language]);

  // Settlement history (settled records)
  const settledRecords = useMemo(
    () => revenueRecords.filter((record: any) => record.settlement_status === "settled"),
    [revenueRecords]
  );

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      language === "en" ? "en-US" : language === "zh-CN" ? "zh-CN" : "zh-TW",
      { year: "numeric", month: "short", day: "numeric" }
    );
  };

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      pending: txt.pending,
      settled: txt.settled,
      cancelled: txt.cancelled,
    };
    return map[status] || status;
  };

  const getProductTypeLabel = (productType: string): string => {
    return productType === "document" ? txt.document : txt.link;
  };

  // Comprehensive CSV export with all fields
  const handleExportCsv = () => {
    const hasDetailedData = detailedSales.length > 0;
    const dataSource = hasDetailedData ? detailedSales : revenueRecords;

    if (dataSource.length === 0) return;

    const headers = [
      txt.date,
      txt.product,
      txt.type,
      txt.userId,
      txt.membershipTier,
      txt.originalPrice + " (CP)",
      txt.actualPaid + " (CP)",
      txt.splitRatio,
      txt.platformShare + " (CP)",
      txt.partnerShare + " (CP)",
      ...(hasDetailedData ? [] : [txt.status]),
    ].join(",");

    const rows = dataSource.map((record: any) => {
      if (hasDetailedData) {
        const productName = getProductNameFromRecord(record, language);
        const date = new Date(record.created_at).toISOString().split("T")[0];
        const productType = record.partner_products?.product_type || "—";
        const splitPercent = record.revenue_split_snapshot
          ? `${Math.round(Number(record.revenue_split_snapshot) * 100)}%`
          : "—";

        return [
          date,
          `"${productName}"`,
          getProductTypeLabel(productType),
          record.user_id?.substring(0, 8) || "—",
          record.user_membership_tier || "—",
          record.original_cp_price || "—",
          record.cp_paid || "—",
          splitPercent,
          record.platform_income || "—",
          record.partner_income || "—",
        ].join(",");
      } else {
        const productName = getProductNameFromRecord(record, language);
        const date = new Date(record.created_at).toISOString().split("T")[0];
        const productType = record.partner_products?.product_type || "—";
        const splitPlatform = record.partner_products?.revenue_split_platform;
        const splitPercent = splitPlatform
          ? `${Math.round(Number(splitPlatform) * 100)}/${Math.round((1 - Number(splitPlatform)) * 100)}`
          : "—";
        const status = getStatusLabel(record.settlement_status);

        return [
          date,
          `"${productName}"`,
          getProductTypeLabel(productType),
          record.order_user_id?.substring(0, 8) || "—",
          "—",
          record.cp_amount || "—",
          record.cp_amount || "—",
          splitPercent,
          record.platform_share || "—",
          record.partner_share || "—",
          status,
        ].join(",");
      }
    });

    const csvContent = ["\uFEFF" + headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `revenue_report_${new Date().toISOString().split("T")[0]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    toast.success(language === "en" ? "CSV exported" : language === "zh-CN" ? "已导出 CSV" : "已匯出 CSV");
  };

  // Excel export (tab-separated with .xls extension for Excel compatibility)
  const handleExportExcel = () => {
    const hasDetailedData = detailedSales.length > 0;
    const dataSource = hasDetailedData ? detailedSales : revenueRecords;

    if (dataSource.length === 0) return;

    const headers = [
      txt.date,
      txt.product,
      txt.type,
      txt.userId,
      txt.membershipTier,
      txt.originalPrice + " (CP)",
      txt.actualPaid + " (CP)",
      txt.splitRatio,
      txt.platformShare + " (CP)",
      txt.partnerShare + " (CP)",
      ...(hasDetailedData ? [] : [txt.status]),
    ].join("\t");

    const rows = dataSource.map((record: any) => {
      if (hasDetailedData) {
        const productName = getProductNameFromRecord(record, language);
        const date = new Date(record.created_at).toISOString().split("T")[0];
        const productType = record.partner_products?.product_type || "—";
        const splitPercent = record.revenue_split_snapshot
          ? `${Math.round(Number(record.revenue_split_snapshot) * 100)}%`
          : "—";

        return [
          date,
          productName,
          getProductTypeLabel(productType),
          record.user_id?.substring(0, 8) || "—",
          record.user_membership_tier || "—",
          record.original_cp_price || "—",
          record.cp_paid || "—",
          splitPercent,
          record.platform_income || "—",
          record.partner_income || "—",
        ].join("\t");
      } else {
        const productName = getProductNameFromRecord(record, language);
        const date = new Date(record.created_at).toISOString().split("T")[0];
        const productType = record.partner_products?.product_type || "—";
        const splitPlatform = record.partner_products?.revenue_split_platform;
        const splitPercent = splitPlatform
          ? `${Math.round(Number(splitPlatform) * 100)}/${Math.round((1 - Number(splitPlatform)) * 100)}`
          : "—";
        const status = getStatusLabel(record.settlement_status);

        return [
          date,
          productName,
          getProductTypeLabel(productType),
          record.order_user_id?.substring(0, 8) || "—",
          "—",
          record.cp_amount || "—",
          record.cp_amount || "—",
          splitPercent,
          record.platform_share || "—",
          record.partner_share || "—",
          status,
        ].join("\t");
      }
    });

    const xlsContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([xlsContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `revenue_report_${new Date().toISOString().split("T")[0]}.xls`;
    anchor.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    toast.success(language === "en" ? "Excel exported" : language === "zh-CN" ? "已导出 Excel" : "已匯出 Excel");
  };

  const summaryCards = [
    {
      label: txt.pendingSettlement,
      value: `${pendingSettlement.toLocaleString()} CP`,
      icon: Clock,
      color: "text-amber-600",
      bgAccent: "bg-amber-50",
    },
    {
      label: txt.settledThisMonth,
      value: `${settledThisMonth.toLocaleString()} CP`,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgAccent: "bg-emerald-50",
    },
    {
      label: txt.lifetimeRevenue,
      value: `${lifetimeRevenue.toLocaleString()} CP`,
      icon: TrendingUp,
      color: "text-sky-600",
      bgAccent: "bg-sky-50",
    },
  ];

  if (loadingPartner) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Wallet className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-lg font-semibold text-slate-800">{txt.noPartner}</p>
        <p className="text-sm text-slate-500">{txt.noPartnerDesc}</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{txt.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{txt.desc}</p>
        </div>
        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={revenueRecords.length === 0 && detailedSales.length === 0}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {txt.exportMenu}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[160px] py-1">
                <button
                  onClick={handleExportCsv}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  {txt.exportCsv}
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-emerald-500" />
                  {txt.exportExcel}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", card.bgAccent, card.color)}>
                <card.icon className="w-[18px] h-[18px]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm">
        <div className="border-b border-slate-100 px-5 flex gap-1">
          <button
            onClick={() => setActiveTab("products")}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === "products"
                ? "border-sky-500 text-sky-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {txt.revenueByProduct}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === "history"
                ? "border-sky-500 text-sky-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {txt.settlementHistory}
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === "all"
                ? "border-sky-500 text-sky-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {txt.allRecords}
          </button>
        </div>

        {loadingRevenue ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : revenueRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">{txt.noRevenue}</p>
            <p className="text-xs text-slate-400 max-w-xs text-center">{txt.noRevenueDesc}</p>
          </div>
        ) : activeTab === "products" ? (
          /* Revenue by Product */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">{txt.productName}</th>
                  <th className="px-5 py-3 font-medium">{txt.type}</th>
                  <th className="px-5 py-3 font-medium text-right">{txt.totalSales}</th>
                  <th className="px-5 py-3 font-medium text-right">{txt.totalRevenue}</th>
                  <th className="px-5 py-3 font-medium text-right">{txt.pendingAmount}</th>
                  <th className="px-5 py-3 font-medium text-right">{txt.settledAmount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {productRevenueSummaries.map((summary) => (
                  <tr key={summary.productId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-800 font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{summary.productName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium",
                          summary.productType === "document"
                            ? "border-sky-200 text-sky-600 bg-sky-50"
                            : "border-violet-200 text-violet-600 bg-violet-50"
                        )}
                      >
                        <span className="flex items-center gap-1">
                          {summary.productType === "document" ? (
                            <FileText className="w-3 h-3" />
                          ) : (
                            <Link2 className="w-3 h-3" />
                          )}
                          {getProductTypeLabel(summary.productType)}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-600 font-mono">
                      {summary.salesCount}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-900 font-semibold font-mono">
                      {summary.totalRevenue.toLocaleString()} <span className="text-slate-400 text-xs">CP</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-amber-600 font-mono">
                      {summary.pendingAmount.toLocaleString()} <span className="text-amber-400 text-xs">CP</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-emerald-600 font-mono">
                      {summary.settledAmount.toLocaleString()} <span className="text-emerald-400 text-xs">CP</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === "history" ? (
          /* Settlement History */
          <div className="overflow-x-auto">
            {settledRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <CheckCircle2 className="w-8 h-8 text-slate-200" />
                <p className="text-sm text-slate-400">{txt.noSettlements}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-5 py-3 font-medium">{txt.date}</th>
                    <th className="px-5 py-3 font-medium">{txt.product}</th>
                    <th className="px-5 py-3 font-medium">{txt.type}</th>
                    <th className="px-5 py-3 font-medium text-right">{txt.amount}</th>
                    <th className="px-5 py-3 font-medium text-center">{txt.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {settledRecords.map((record: any) => {
                    const productType = record.partner_products?.product_type || "document";
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                          {formatDate(record.settled_at || record.created_at)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-800 font-medium max-w-[200px] truncate">
                          {getProductNameFromRecord(record, language)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              productType === "document"
                                ? "border-sky-200 text-sky-600 bg-sky-50"
                                : "border-violet-200 text-violet-600 bg-violet-50"
                            )}
                          >
                            {getProductTypeLabel(productType)}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right text-emerald-700 font-semibold font-mono">
                          +{record.partner_share?.toLocaleString()} <span className="text-emerald-500 text-xs">CP</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-medium px-2 py-0.5",
                              SETTLEMENT_COLORS.settled
                            )}
                          >
                            {txt.settled}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* All Records - detailed view with more columns */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">{txt.date}</th>
                  <th className="px-4 py-3 font-medium">{txt.product}</th>
                  <th className="px-4 py-3 font-medium">{txt.type}</th>
                  <th className="px-4 py-3 font-medium text-right">{txt.originalPrice}</th>
                  <th className="px-4 py-3 font-medium text-right">{txt.partnerShare}</th>
                  <th className="px-4 py-3 font-medium text-right">{txt.platformShare}</th>
                  <th className="px-4 py-3 font-medium text-center">{txt.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {revenueRecords.map((record: any) => {
                  const productType = record.partner_products?.product_type || "document";
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap text-xs">
                        {formatDate(record.created_at)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-800 font-medium max-w-[180px] truncate">
                        {getProductNameFromRecord(record, language)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            productType === "document"
                              ? "border-sky-200 text-sky-600 bg-sky-50"
                              : "border-violet-200 text-violet-600 bg-violet-50"
                          )}
                        >
                          {getProductTypeLabel(productType)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-600 font-mono text-xs">
                        {record.cp_amount?.toLocaleString()} <span className="text-slate-400">CP</span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-emerald-700 font-semibold font-mono text-xs">
                        {record.partner_share?.toLocaleString()} <span className="text-emerald-500">CP</span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-500 font-mono text-xs">
                        {record.platform_share?.toLocaleString()} <span className="text-slate-400">CP</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5",
                            SETTLEMENT_COLORS[record.settlement_status] || ""
                          )}
                        >
                          {getStatusLabel(record.settlement_status)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getProductNameFromRecord(record: any, language: string): string {
  const product = record.partner_products;
  if (!product) return "—";
  if (language === "en" && product.product_name_en) return product.product_name_en;
  if (language === "zh-CN" && product.product_name_zh_cn) return product.product_name_zh_cn;
  return product.product_name_zh_tw || "—";
}
