import { motion } from "framer-motion";
import { Building2, UserCog, User, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import { useSubscriptions } from "@/hooks/useAdminData";

export default function SubscriptionsPage() {
  const { language } = useTranslation();
  const { data: subscriptions, isLoading } = useSubscriptions();
  const subs = subscriptions || [];

  const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
    active: { label: language === "en" ? "Active" : "有效", icon: CheckCircle2, color: "text-green-600" },
    trial: { label: language === "en" ? "Trial" : language === "zh-TW" ? "試用" : "试用", icon: Clock, color: "text-amber-600" },
    expired: { label: language === "en" ? "Expired" : language === "zh-TW" ? "已過期" : "已过期", icon: XCircle, color: "text-red-600" },
    cancelled: { label: language === "en" ? "Cancelled" : "已取消", icon: XCircle, color: "text-red-600" },
  };

  const typeIcons: Record<string, typeof Building2> = { organization: Building2, consultant: UserCog, individual: User };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatAmount = (amount: number | null, currency: string | null, billingCycle: string | null) => {
    if (!amount) return "Free";
    const formatted = `${currency?.toUpperCase() || "$"}${amount.toLocaleString()}`;
    if (billingCycle === "yearly") return `${formatted}/yr`;
    if (billingCycle === "monthly") return `${formatted}/mo`;
    return formatted;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try { return new Date(dateString).toLocaleDateString(); } catch { return dateString; }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "Subscriptions" : language === "zh-TW" ? "訂閱管理" : "订阅管理"}</h1>
        <p className="text-sm text-muted-foreground">{language === "en" ? "Manage plans and billing for all entities" : language === "zh-TW" ? "管理所有實體的方案和計費" : "管理所有实体的套餐和计费"}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{subs.length}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Total Subscriptions" : language === "zh-TW" ? "總訂閱數" : "总订阅数"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{subs.filter(s => s.status === "active").length}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Active" : "有效"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600">{subs.filter(s => s.status === "trial").length}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Trial" : language === "zh-TW" ? "試用中" : "试用中"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{subs.filter(s => s.status === "expired" || s.status === "cancelled").length}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Expired" : language === "zh-TW" ? "已過期" : "已过期"}</div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Entity" : language === "zh-TW" ? "實體" : "实体"}</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Plan" : language === "zh-TW" ? "方案" : "套餐"}</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Billing" : language === "zh-TW" ? "計費" : "计费"}</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Amount" : language === "zh-TW" ? "金額" : "金额"}</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Expires" : "到期"}</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Status" : language === "zh-TW" ? "狀態" : "状态"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subs.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">{language === "en" ? "No subscriptions found" : language === "zh-TW" ? "暫無訂閱資料" : "暂无订阅数据"}</td></tr>
            ) : subs.map((sub) => {
              const subStatus = (sub.status as keyof typeof statusConfig) || "active";
              const status = statusConfig[subStatus] || statusConfig.active;
              const StatusIcon = status.icon;
              const TypeIcon = typeIcons[sub.entity_type || ""] || User;
              return (
                <tr key={sub.id} className="hover:bg-muted/10">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <TypeIcon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{sub.entityName || "—"}</div>
                        <div className="text-xs text-muted-foreground capitalize">{sub.entity_type || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">{sub.plan_type || "—"}</span></td>
                  <td className="px-5 py-4 text-sm text-muted-foreground capitalize">{sub.billing_cycle || "—"}</td>
                  <td className="px-5 py-4 text-sm font-medium text-foreground">{formatAmount(sub.amount, sub.currency, sub.billing_cycle)}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(sub.expires_at)}</td>
                  <td className="px-5 py-4">
                    <span className={cn("flex items-center gap-1 text-xs font-medium", status.color)}>
                      <StatusIcon className="w-3.5 h-3.5" /> {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
