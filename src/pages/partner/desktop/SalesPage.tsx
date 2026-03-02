import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  Loader2,
  ShoppingCart,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TimePeriod = "day" | "month" | "year" | "all";

const TXT = {
  en: {
    title: "Sales Data",
    desc: "Track your product sales performance",
    todaySales: "Today Sales",
    monthSales: "This Month",
    yearSales: "This Year",
    totalSales: "Lifetime",
    todayRevenue: "Today Revenue",
    monthRevenue: "Monthly Revenue",
    yearRevenue: "Annual Revenue",
    totalRevenue: "Lifetime Revenue",
    ordersTable: "Sales Records",
    search: "Search by product name...",
    noOrders: "No sales yet",
    noOrdersDesc: "Orders will appear here once customers purchase your products",
    date: "Date",
    product: "Product",
    type: "Type",
    cpPaid: "CP Paid",
    originalPrice: "Original Price",
    platformShare: "Platform",
    partnerShare: "Your Share",
    status: "Status",
    pending: "Pending",
    settled: "Settled",
    cancelled: "Cancelled",
    cpUnit: "CP",
    noPartner: "Partner Account Not Found",
    noPartnerDesc: "Your partner account is being set up. Please contact support.",
    loadMore: "Load More",
    filterAll: "All",
    filterDay: "Today",
    filterMonth: "Month",
    filterYear: "Year",
    filterProduct: "All Products",
    orders: "orders",
    document: "Doc",
    link: "Link",
    salesCount: "Sales",
    revenueAmount: "Revenue",
  },
  "zh-TW": {
    title: "銷售數據",
    desc: "追蹤您的產品銷售表現",
    todaySales: "今日銷量",
    monthSales: "本月銷量",
    yearSales: "年度銷量",
    totalSales: "累計銷量",
    todayRevenue: "今日收入",
    monthRevenue: "本月收入",
    yearRevenue: "年度收入",
    totalRevenue: "累計收入",
    ordersTable: "銷售記錄",
    search: "依產品名稱搜尋...",
    noOrders: "尚無銷售數據",
    noOrdersDesc: "當客戶購買您的產品後，訂單將顯示在此",
    date: "日期",
    product: "產品",
    type: "類型",
    cpPaid: "實付 CP",
    originalPrice: "原價",
    platformShare: "平台分成",
    partnerShare: "您的分成",
    status: "狀態",
    pending: "待結算",
    settled: "已結算",
    cancelled: "已取消",
    cpUnit: "CP",
    noPartner: "找不到合作方帳戶",
    noPartnerDesc: "您的合作方帳戶正在設定中，請聯繫管理員。",
    loadMore: "載入更多",
    filterAll: "全部",
    filterDay: "今日",
    filterMonth: "本月",
    filterYear: "年度",
    filterProduct: "全部產品",
    orders: "筆",
    document: "文檔",
    link: "連結",
    salesCount: "銷量",
    revenueAmount: "收入",
  },
  "zh-CN": {
    title: "销售数据",
    desc: "追踪您的产品销售表现",
    todaySales: "今日销量",
    monthSales: "本月销量",
    yearSales: "年度销量",
    totalSales: "累计销量",
    todayRevenue: "今日收入",
    monthRevenue: "本月收入",
    yearRevenue: "年度收入",
    totalRevenue: "累计收入",
    ordersTable: "销售记录",
    search: "按产品名称搜索...",
    noOrders: "暂无销售数据",
    noOrdersDesc: "当客户购买您的产品后，订单将显示在此",
    date: "日期",
    product: "产品",
    type: "类型",
    cpPaid: "实付 CP",
    originalPrice: "原价",
    platformShare: "平台分成",
    partnerShare: "您的分成",
    status: "状态",
    pending: "待结算",
    settled: "已结算",
    cancelled: "已取消",
    cpUnit: "CP",
    noPartner: "找不到合作方账户",
    noPartnerDesc: "您的合作方账户正在设定中，请联系管理员。",
    loadMore: "加载更多",
    filterAll: "全部",
    filterDay: "今日",
    filterMonth: "本月",
    filterYear: "年度",
    filterProduct: "全部产品",
    orders: "笔",
    document: "文档",
    link: "链接",
    salesCount: "销量",
    revenueAmount: "收入",
  },
};

const SETTLEMENT_COLORS: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  settled: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-200 bg-slate-50 text-slate-500",
};

function getStartOfDay(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getStartOfMonth(): Date {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getStartOfYear(): Date {
  const date = new Date();
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function SalesPage() {
  const { session } = useAuth();
  const { language } = useLanguage();
  const txt = TXT[language] || TXT["zh-TW"];
  const userId = session?.user?.id;
  const [search, setSearch] = useState("");
  const [displayLimit, setDisplayLimit] = useState(30);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [productFilter, setProductFilter] = useState<string>("all");

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

  const { data: salesRecords = [], isLoading: loadingSales } = useQuery({
    queryKey: ["partner-sales-data", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_revenue")
        .select("*, partner_products(product_name_zh_tw, product_name_zh_cn, product_name_en, product_type)")
        .eq("partner_id", partnerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId,
  });

  const { data: partnerProducts = [] } = useQuery({
    queryKey: ["partner-product-list", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_products")
        .select("id, product_name_zh_tw, product_name_zh_cn, product_name_en")
        .eq("partner_id", partnerId!)
        .order("product_name_zh_tw");
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId,
  });

  const dayStart = useMemo(() => getStartOfDay(), []);
  const monthStart = useMemo(() => getStartOfMonth(), []);
  const yearStart = useMemo(() => getStartOfYear(), []);

  const computeStats = (records: typeof salesRecords, startDate?: Date) => {
    const filtered = startDate
      ? records.filter((record) => new Date(record.created_at) >= startDate)
      : records;
    return {
      count: filtered.length,
      revenue: filtered.reduce((sum, record) => sum + (record.partner_share || 0), 0),
    };
  };

  const todayStats = useMemo(() => computeStats(salesRecords, dayStart), [salesRecords, dayStart]);
  const monthStats = useMemo(() => computeStats(salesRecords, monthStart), [salesRecords, monthStart]);
  const yearStats = useMemo(() => computeStats(salesRecords, yearStart), [salesRecords, yearStart]);
  const totalStats = useMemo(() => computeStats(salesRecords), [salesRecords]);

  const getProductName = (record: Record<string, unknown>): string => {
    const product = record.partner_products as Record<string, string> | null;
    if (!product) return "—";
    if (language === "en" && product.product_name_en) return product.product_name_en;
    if (language === "zh-CN" && product.product_name_zh_cn) return product.product_name_zh_cn;
    return product.product_name_zh_tw || "—";
  };

  const getProductNameById = (productId: string): string => {
    const product = partnerProducts.find((p: Record<string, unknown>) => p.id === productId);
    if (!product) return "—";
    if (language === "en" && product.product_name_en) return product.product_name_en;
    if (language === "zh-CN" && product.product_name_zh_cn) return product.product_name_zh_cn;
    return product.product_name_zh_tw || "—";
  };

  const filteredRecords = useMemo(() => {
    let records = salesRecords;
    if (timePeriod === "day") records = records.filter((r) => new Date(r.created_at) >= dayStart);
    else if (timePeriod === "month") records = records.filter((r) => new Date(r.created_at) >= monthStart);
    else if (timePeriod === "year") records = records.filter((r) => new Date(r.created_at) >= yearStart);
    if (productFilter !== "all") records = records.filter((r) => r.product_id === productFilter);
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      records = records.filter((r) => getProductName(r).toLowerCase().includes(searchLower));
    }
    return records;
  }, [salesRecords, timePeriod, productFilter, search, dayStart, monthStart, yearStart]);

  const displayedRecords = filteredRecords.slice(0, displayLimit);

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = { pending: txt.pending, settled: txt.settled, cancelled: txt.cancelled };
    return map[status] || status;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      language === "en" ? "en-US" : language === "zh-CN" ? "zh-CN" : "zh-TW",
      { year: "numeric", month: "short", day: "numeric" }
    );
  };

  const salesMetrics = [
    { label: txt.todaySales, value: todayStats.count, icon: Calendar, color: "text-sky-600", bgColor: "bg-sky-50" },
    { label: txt.monthSales, value: monthStats.count, icon: BarChart3, color: "text-emerald-600", bgColor: "bg-emerald-50" },
    { label: txt.yearSales, value: yearStats.count, icon: TrendingUp, color: "text-violet-600", bgColor: "bg-violet-50" },
    { label: txt.totalSales, value: totalStats.count, icon: ShoppingCart, color: "text-slate-700", bgColor: "bg-slate-100" },
  ];

  const revenueMetrics = [
    { label: txt.todayRevenue, value: todayStats.revenue, icon: DollarSign, color: "text-sky-600", bgColor: "bg-sky-50" },
    { label: txt.monthRevenue, value: monthStats.revenue, icon: DollarSign, color: "text-emerald-600", bgColor: "bg-emerald-50" },
    { label: txt.yearRevenue, value: yearStats.revenue, icon: DollarSign, color: "text-violet-600", bgColor: "bg-violet-50" },
    { label: txt.totalRevenue, value: totalStats.revenue, icon: DollarSign, color: "text-slate-700", bgColor: "bg-slate-100" },
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
          <ShoppingCart className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-lg font-semibold text-slate-800">{txt.noPartner}</p>
        <p className="text-sm text-slate-500">{txt.noPartnerDesc}</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{txt.title}</h1>
        <p className="text-sm text-slate-500 mt-1">{txt.desc}</p>
      </div>

      {/* Sales Count Metrics */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{txt.salesCount}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {salesMetrics.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.bgColor, stat.color)}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}<span className="text-xs text-slate-400 ml-1">{txt.orders}</span></p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Revenue Metrics */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{txt.revenueAmount}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {revenueMetrics.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 + 0.2 }}
              className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.bgColor, stat.color)}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}<span className="text-xs text-slate-400 ml-1">CP</span></p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-800">{txt.ordersTable}</h2>
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Time filter */}
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(["all", "day", "month", "year"] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    timePeriod === period ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {period === "all" ? txt.filterAll : period === "day" ? txt.filterDay : period === "month" ? txt.filterMonth : txt.filterYear}
                </button>
              ))}
            </div>
            {/* Product filter */}
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                value={productFilter}
                onChange={(event) => setProductFilter(event.target.value)}
                className="pl-8 pr-6 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 appearance-none cursor-pointer"
              >
                <option value="all">{txt.filterProduct}</option>
                {partnerProducts.map((product: Record<string, unknown>) => (
                  <option key={product.id as string} value={product.id as string}>
                    {getProductNameById(product.id as string)}
                  </option>
                ))}
              </select>
            </div>
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={txt.search}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 bg-white"
              />
            </div>
          </div>
        </div>

        {loadingSales ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">{txt.noOrders}</p>
            <p className="text-xs text-slate-400 max-w-xs text-center">{txt.noOrdersDesc}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-5 py-3 font-medium">{txt.date}</th>
                    <th className="px-5 py-3 font-medium">{txt.product}</th>
                    <th className="px-5 py-3 font-medium">{txt.type}</th>
                    <th className="px-5 py-3 font-medium text-right">{txt.cpPaid}</th>
                    <th className="px-5 py-3 font-medium text-right">{txt.platformShare}</th>
                    <th className="px-5 py-3 font-medium text-right">{txt.partnerShare}</th>
                    <th className="px-5 py-3 font-medium text-center">{txt.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayedRecords.map((record: Record<string, unknown>) => {
                    const product = record.partner_products as Record<string, string> | null;
                    const productType = product?.product_type;
                    return (
                      <tr key={record.id as string} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{formatDate(record.created_at as string)}</td>
                        <td className="px-5 py-3.5 text-slate-800 font-medium max-w-[200px] truncate">{getProductName(record)}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className={cn("text-[10px]", productType === "document" ? "border-sky-200 text-sky-600 bg-sky-50" : "border-violet-200 text-violet-600 bg-violet-50")}>
                            {productType === "document" ? txt.document : txt.link}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-700 font-mono">
                          {(record.cp_amount as number)?.toLocaleString()} <span className="text-slate-400 text-xs">CP</span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-500 font-mono">
                          {(record.platform_share as number)?.toLocaleString()} <span className="text-slate-400 text-xs">CP</span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-emerald-700 font-semibold font-mono">
                          +{(record.partner_share as number)?.toLocaleString()} <span className="text-emerald-500 text-xs">CP</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge variant="outline" className={cn("text-[10px] font-medium px-2 py-0.5", SETTLEMENT_COLORS[(record.settlement_status as string)] || SETTLEMENT_COLORS.pending)}>
                            {getStatusLabel(record.settlement_status as string)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredRecords.length > displayLimit && (
              <div className="p-4 border-t border-slate-100 flex justify-center">
                <button
                  onClick={() => setDisplayLimit((prev) => prev + 30)}
                  className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors"
                >
                  {txt.loadMore}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
