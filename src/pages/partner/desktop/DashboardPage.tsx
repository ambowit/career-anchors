import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, BarChart3, DollarSign, Clock, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TXT = {
  en: {
    title: "Partner Dashboard",
    desc: "Overview of your products and revenue",
    totalProducts: "Total Products",
    approvedProducts: "Approved",
    pendingSales: "Pending Revenue",
    totalRevenue: "Total Revenue (CP)",
    recentActivity: "Recent Activity",
    noActivity: "No activity yet",
    noPartner: "Partner Account Not Found",
    noPartnerDesc: "Your partner account is being set up. Please contact support.",
    pendingApproval: "Your partner account is pending approval.",
    cpUnit: "CP",
  },
  "zh-TW": {
    title: "合作方總覽",
    desc: "您的產品與收入概覽",
    totalProducts: "產品總數",
    approvedProducts: "已上架",
    pendingSales: "待結算收入",
    totalRevenue: "累計收入 (CP)",
    recentActivity: "近期動態",
    noActivity: "暫無動態",
    noPartner: "找不到合作方帳戶",
    noPartnerDesc: "您的合作方帳戶正在設定中，請聯繫管理員。",
    pendingApproval: "您的合作方帳戶正在等待審核。",
    cpUnit: "CP",
  },
  "zh-CN": {
    title: "合作方总览",
    desc: "您的产品与收入概览",
    totalProducts: "产品总数",
    approvedProducts: "已上架",
    pendingSales: "待结算收入",
    totalRevenue: "累计收入 (CP)",
    recentActivity: "近期动态",
    noActivity: "暂无动态",
    noPartner: "找不到合作方账户",
    noPartnerDesc: "您的合作方账户正在设定中，请联系管理员。",
    pendingApproval: "您的合作方账户正在等待审核。",
    cpUnit: "CP",
  },
} as const;

export default function PartnerDashboardPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const textContent = TXT[language] || TXT["zh-TW"];

  const { data: partner, isLoading } = useQuery({
    queryKey: ["partner-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("product_partners")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: products } = useQuery({
    queryKey: ["partner-products-stats", partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data, error } = await supabase
        .from("partner_products")
        .select("id, review_status, is_active, total_sales, total_revenue_cp")
        .eq("partner_id", partner.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!partner?.id,
  });

  const { data: revenueRecords } = useQuery({
    queryKey: ["partner-revenue-stats", partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data, error } = await supabase
        .from("partner_revenue")
        .select("partner_share, settlement_status, created_at")
        .eq("partner_id", partner.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!partner?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">{textContent.noPartner}</h2>
          <p className="text-sm text-slate-500">{textContent.noPartnerDesc}</p>
        </div>
      </div>
    );
  }

  if (partner.status === "pending") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">{textContent.pendingApproval}</h2>
          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Pending</Badge>
        </div>
      </div>
    );
  }

  const totalProducts = products?.length || 0;
  const approvedProducts = products?.filter((product) => product.review_status === "approved" && product.is_active).length || 0;
  const totalRevenueCp = products?.reduce((sum, product) => sum + (product.total_revenue_cp || 0), 0) || 0;
  const pendingRevenue = revenueRecords?.filter((record) => record.settlement_status === "pending")
    .reduce((sum, record) => sum + (record.partner_share || 0), 0) || 0;

  const stats = [
    { label: textContent.totalProducts, value: totalProducts, icon: Package, color: "text-slate-700" },
    { label: textContent.approvedProducts, value: approvedProducts, icon: TrendingUp, color: "text-emerald-600" },
    { label: textContent.pendingSales, value: `${pendingRevenue} ${textContent.cpUnit}`, icon: Clock, color: "text-amber-600" },
    { label: textContent.totalRevenue, value: `${totalRevenueCp.toLocaleString()} ${textContent.cpUnit}`, icon: DollarSign, color: "text-sky-600" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{textContent.title}</h1>
        <p className="text-sm text-slate-500 mt-1">{textContent.desc}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
                <stat.icon className={cn("w-4.5 h-4.5", stat.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent revenue activity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-xl border border-slate-200 p-5"
      >
        <h3 className="text-sm font-semibold text-slate-700 mb-4">{textContent.recentActivity}</h3>
        {revenueRecords && revenueRecords.length > 0 ? (
          <div className="space-y-3">
            {revenueRecords.slice(0, 5).map((record, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-600">
                  +{record.partner_share} {textContent.cpUnit}
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      record.settlement_status === "settled"
                        ? "border-emerald-200 text-emerald-600 bg-emerald-50"
                        : "border-amber-200 text-amber-600 bg-amber-50"
                    )}
                  >
                    {record.settlement_status}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {new Date(record.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-4 text-center">{textContent.noActivity}</p>
        )}
      </motion.div>
    </div>
  );
}
