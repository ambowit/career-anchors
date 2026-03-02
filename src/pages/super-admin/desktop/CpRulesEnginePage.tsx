import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, ArrowUp, ArrowDown, Save, Loader2, History,
  ChevronDown, ChevronUp, Eye, X, Plus, Clock,
  Wallet, Gift, Star, Shield, Users, UserPlus, Zap,
  Calendar, AlertCircle, CheckCircle2, ToggleLeft, ToggleRight,
  FileText, Percent, Hash, Ban,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type LangKey = "en" | "zh-TW" | "zh-CN";

// ─── Types ────────────────────────────────────────
interface CpRuleVersion {
  id: string;
  rule_type: string;
  version: number;
  config_json: Record<string, unknown>;
  description: string;
  effective_at: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface RechargePackage {
  id: string;
  package_name_zh_tw: string;
  package_name_zh_cn: string;
  package_name_en: string;
  price_amount: number;
  currency: string;
  cp_amount: number;
  bonus_cp_amount: number;
  is_active: boolean;
  sort_order: number;
}

// ─── Labels ───────────────────────────────────────
const TXT: Record<string, Record<LangKey, string>> = {
  pageTitle: { en: "CP Rules Engine", "zh-TW": "CP 規則引擎", "zh-CN": "CP 规则引擎" },
  pageDesc: {
    en: "Configure deduction order, referral rewards, and recharge bonuses with versioned rule management",
    "zh-TW": "配置扣點順序、推薦獎勵、充值贈送規則，支持版本化管理",
    "zh-CN": "配置扣点顺序、推荐奖励、充值赠送规则，支持版本化管理",
  },
  tabDeduction: { en: "Deduction Order", "zh-TW": "扣點順序", "zh-CN": "扣点顺序" },
  tabReferral: { en: "Referral Rewards", "zh-TW": "推薦獎勵", "zh-CN": "推荐奖励" },
  tabBonus: { en: "Recharge Bonus", "zh-TW": "充值贈送", "zh-CN": "充值赠送" },
  // Deduction Order
  currentOrder: { en: "Current Deduction Order", "zh-TW": "當前扣點順序", "zh-CN": "当前扣点顺序" },
  deductionDesc: {
    en: "Drag items to rearrange. When a user consumes CP, the system deducts in this order.",
    "zh-TW": "調整順序後，系統將按此順序扣點。用戶消費 CP 時，依序從各帳本扣除。",
    "zh-CN": "调整顺序后，系统将按此顺序扣点。用户消费 CP 时，依序从各账本扣除。",
  },
  paidCp: { en: "Paid CP", "zh-TW": "充值購買 CP", "zh-CN": "充值购买 CP" },
  bonusCp: { en: "Recharge Bonus CP", "zh-TW": "充值贈送 CP", "zh-CN": "充值赠送 CP" },
  activityCp: { en: "Activity Reward CP", "zh-TW": "活動獎勵 CP", "zh-CN": "活动奖励 CP" },
  paidCpDesc: { en: "Purchased with real currency, refundable", "zh-TW": "用戶以真實貨幣購買，可退費", "zh-CN": "用户以真实货币购买，可退费" },
  bonusCpDesc: { en: "Bonus from recharges, non-refundable", "zh-TW": "充值時贈送，不可退費", "zh-CN": "充值时赠送，不可退费" },
  activityCpDesc: { en: "From activities/referrals, non-refundable", "zh-TW": "活動/推薦獲得，不可退費", "zh-CN": "活动/推荐获得，不可退费" },
  expireFirst: { en: "Expire-first-deduct-first within same category", "zh-TW": "同類先過期先扣", "zh-CN": "同类先过期先扣" },
  expireFirstDesc: {
    en: "When enabled, CP entries expiring sooner will be deducted first within the same category (FIFO by expiry).",
    "zh-TW": "啟用後，同一類別中即將到期的 CP 批次會優先被扣除（按到期時間先進先出）。",
    "zh-CN": "启用后，同一类别中即将到期的 CP 批次会优先被扣除（按到期时间先进先出）。",
  },
  // Referral Reward
  triggerEvents: { en: "Trigger Events", "zh-TW": "觸發事件", "zh-CN": "触发事件" },
  evtRegister: { en: "Referral Registration", "zh-TW": "推薦註冊", "zh-CN": "推荐注册" },
  evtFirstRecharge: { en: "First Recharge", "zh-TW": "首筆充值", "zh-CN": "首笔充值" },
  evtFirstConsumption: { en: "First Consumption", "zh-TW": "首次消費", "zh-CN": "首次消费" },
  evtCompleteAssessment: { en: "Complete Assessment", "zh-TW": "完成測評", "zh-CN": "完成测评" },
  recipients: { en: "Reward Recipients", "zh-TW": "獎勵對象", "zh-CN": "奖励对象" },
  recipientReferrer: { en: "Referrer only", "zh-TW": "僅推薦人", "zh-CN": "仅推荐人" },
  recipientReferred: { en: "Referred only", "zh-TW": "僅被推薦人", "zh-CN": "仅被推荐人" },
  recipientBoth: { en: "Both parties", "zh-TW": "雙方", "zh-CN": "双方" },
  rewardAmount: { en: "Reward Amount (CP)", "zh-TW": "獎勵數量（CP）", "zh-CN": "奖励数量（CP）" },
  rewardMode: { en: "Reward Mode", "zh-TW": "獎勵模式", "zh-CN": "奖励模式" },
  modeFixed: { en: "Fixed amount", "zh-TW": "固定數量", "zh-CN": "固定数量" },
  modePercent: { en: "Percentage of recharge", "zh-TW": "按充值比例", "zh-CN": "按充值比例" },
  percentValue: { en: "Percentage (%)", "zh-TW": "比例（%）", "zh-CN": "比例（%）" },
  // Conditions
  conditions: { en: "Conditions", "zh-TW": "發放條件", "zh-CN": "发放条件" },
  condVerified: { en: "Identity verified", "zh-TW": "實名驗證", "zh-CN": "实名验证" },
  condEmailVerified: { en: "Email verified", "zh-TW": "郵箱驗證", "zh-CN": "邮箱验证" },
  condMinRecharge: { en: "Min recharge threshold", "zh-TW": "最低充值門檻", "zh-CN": "最低充值门槛" },
  // Anti-fraud
  antiFraud: { en: "Anti-Fraud Limits", "zh-TW": "反作弊限制", "zh-CN": "反作弊限制" },
  dailyLimit: { en: "Daily limit per user", "zh-TW": "每人每日上限", "zh-CN": "每人每日上限" },
  monthlyLimit: { en: "Monthly limit per user", "zh-TW": "每人每月上限", "zh-CN": "每人每月上限" },
  sameDeviceLimit: { en: "Same device restriction", "zh-TW": "同設備限制", "zh-CN": "同设备限制" },
  sameIpLimit: { en: "Same IP restriction", "zh-TW": "同 IP 限制", "zh-CN": "同 IP 限制" },
  // Validity & Approval
  validityMonths: { en: "Reward CP validity (months)", "zh-TW": "獎勵 CP 有效期（月）", "zh-CN": "奖励 CP 有效期（月）" },
  approvalMode: { en: "Approval Mode", "zh-TW": "審核方式", "zh-CN": "审核方式" },
  approvalAuto: { en: "Auto-grant", "zh-TW": "自動發放", "zh-CN": "自动发放" },
  approvalManual: { en: "Manual review", "zh-TW": "人工審核", "zh-CN": "人工审核" },
  // Recharge Bonus
  bonusConfig: { en: "Bonus CP per Package", "zh-TW": "各充值包贈送 CP", "zh-CN": "各充值包赠送 CP" },
  bonusConfigDesc: {
    en: "Set bonus CP for each recharge package. Leave 0 for no bonus.",
    "zh-TW": "為每個充值包設定贈送 CP 數量。設為 0 表示不贈送。",
    "zh-CN": "为每个充值包设定赠送 CP 数量。设为 0 表示不赠送。",
  },
  packageName: { en: "Package", "zh-TW": "充值包", "zh-CN": "充值包" },
  price: { en: "Price", "zh-TW": "價格", "zh-CN": "价格" },
  baseCp: { en: "Base CP", "zh-TW": "基礎 CP", "zh-CN": "基础 CP" },
  bonusAmount: { en: "Bonus CP", "zh-TW": "贈送 CP", "zh-CN": "赠送 CP" },
  bonusCap: { en: "Bonus Cap", "zh-TW": "贈送上限", "zh-CN": "赠送上限" },
  activityPeriod: { en: "Activity Period", "zh-TW": "活動期", "zh-CN": "活动期" },
  startDate: { en: "Start Date", "zh-TW": "開始日期", "zh-CN": "开始日期" },
  endDate: { en: "End Date", "zh-TW": "結束日期", "zh-CN": "结束日期" },
  noPackages: { en: "No active recharge packages", "zh-TW": "暫無啟用的充值包", "zh-CN": "暂无启用的充值包" },
  // Common
  save: { en: "Save as New Version", "zh-TW": "儲存為新版本", "zh-CN": "保存为新版本" },
  cancel: { en: "Cancel", "zh-TW": "取消", "zh-CN": "取消" },
  saved: { en: "Rule version saved", "zh-TW": "規則版本已儲存", "zh-CN": "规则版本已保存" },
  error: { en: "Error saving rule", "zh-TW": "儲存失敗", "zh-CN": "保存失败" },
  versionHistory: { en: "Version History", "zh-TW": "版本歷史", "zh-CN": "版本历史" },
  version: { en: "Version", "zh-TW": "版本", "zh-CN": "版本" },
  effectiveAt: { en: "Effective At", "zh-TW": "生效時間", "zh-CN": "生效时间" },
  status: { en: "Status", "zh-TW": "狀態", "zh-CN": "状态" },
  active: { en: "Active", "zh-TW": "生效中", "zh-CN": "生效中" },
  inactive: { en: "Inactive", "zh-TW": "已停用", "zh-CN": "已停用" },
  description: { en: "Description", "zh-TW": "說明", "zh-CN": "说明" },
  descPlaceholder: { en: "Briefly describe this change...", "zh-TW": "簡述此次變更...", "zh-CN": "简述此次变更..." },
  viewConfig: { en: "View Config", "zh-TW": "查看配置", "zh-CN": "查看配置" },
  activate: { en: "Activate", "zh-TW": "啟用", "zh-CN": "启用" },
  noHistory: { en: "No version history yet", "zh-TW": "暫無版本歷史", "zh-CN": "暂无版本历史" },
  currentConfig: { en: "Current Active Config", "zh-TW": "當前生效配置", "zh-CN": "当前生效配置" },
  noActiveConfig: { en: "No active configuration. Create one below.", "zh-TW": "尚無生效配置，請在下方新增。", "zh-CN": "尚无生效配置，请在下方新增。" },
  configJson: { en: "Configuration JSON", "zh-TW": "配置 JSON", "zh-CN": "配置 JSON" },
  close: { en: "Close", "zh-TW": "關閉", "zh-CN": "关闭" },
  activated: { en: "Version activated", "zh-TW": "版本已啟用", "zh-CN": "版本已启用" },
  unlimited: { en: "Unlimited", "zh-TW": "無限制", "zh-CN": "无限制" },
};

function label(key: string, langKey: LangKey): string {
  return TXT[key]?.[langKey] ?? key;
}

// ─── CP Type Info ─────────────────────────────────
const CP_TYPES = [
  { code: "paid", icon: Wallet, colorBg: "bg-sky-50", colorText: "text-sky-700", colorBorder: "border-sky-200" },
  { code: "bonus", icon: Gift, colorBg: "bg-violet-50", colorText: "text-violet-700", colorBorder: "border-violet-200" },
  { code: "activity", icon: Star, colorBg: "bg-amber-50", colorText: "text-amber-700", colorBorder: "border-amber-200" },
];

function cpTypeName(code: string, langKey: LangKey): string {
  const map: Record<string, Record<LangKey, string>> = {
    paid: { en: "Paid CP", "zh-TW": "充值購買 CP", "zh-CN": "充值购买 CP" },
    bonus: { en: "Recharge Bonus CP", "zh-TW": "充值贈送 CP", "zh-CN": "充值赠送 CP" },
    activity: { en: "Activity Reward CP", "zh-TW": "活動獎勵 CP", "zh-CN": "活动奖励 CP" },
  };
  return map[code]?.[langKey] ?? code;
}

function cpTypeDesc(code: string, langKey: LangKey): string {
  const map: Record<string, Record<LangKey, string>> = {
    paid: TXT.paidCpDesc,
    bonus: TXT.bonusCpDesc,
    activity: TXT.activityCpDesc,
  };
  return map[code]?.[langKey] ?? "";
}

// ─── Shared Styles ────────────────────────────────
const inputClass = "w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-colors";

// ─── Data Hooks ───────────────────────────────────
function useRuleVersions(ruleType: string) {
  return useQuery({
    queryKey: ["cp-rules-versions", ruleType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cp_rules_versions")
        .select("*")
        .eq("rule_type", ruleType)
        .order("version", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CpRuleVersion[];
    },
  });
}

function useRechargePackages() {
  return useQuery({
    queryKey: ["recharge-packages-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recharge_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as RechargePackage[];
    },
  });
}

// ─── Small shared components ──────────────────────
function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-5", className)}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {description && <p className="text-xs text-muted-foreground ml-6">{description}</p>}
    </div>
  );
}

function ActiveBadge({ isActive, langKey }: { isActive: boolean; langKey: LangKey }) {
  return (
    <span className={cn(
      "text-[11px] px-2 py-0.5 rounded-full font-medium",
      isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
    )}>
      {isActive ? label("active", langKey) : label("inactive", langKey)}
    </span>
  );
}

function DescriptionInput({ value, onChange, langKey }: { value: string; onChange: (value: string) => void; langKey: LangKey }) {
  return (
    <div className="mt-4">
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label("description", langKey)}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label("descPlaceholder", langKey)}
        className={inputClass}
      />
    </div>
  );
}

// ─── Version History ──────────────────────────────
function VersionHistorySection({
  ruleType, langKey, onActivate,
}: {
  ruleType: string; langKey: LangKey; onActivate: (versionId: string) => void;
}) {
  const { data: versions = [], isLoading } = useRuleVersions(ruleType);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{label("noHistory", langKey)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {versions.map((version) => (
        <div key={version.id} className="border border-border rounded-lg overflow-hidden">
          <div
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/5 cursor-pointer transition-colors"
            onClick={() => setExpandedId(expandedId === version.id ? null : version.id)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs font-mono text-muted-foreground bg-muted/20 px-2 py-0.5 rounded">
                v{version.version}
              </span>
              <ActiveBadge isActive={version.is_active} langKey={langKey} />
              {version.description && (
                <span className="text-xs text-muted-foreground truncate">{version.description}</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] text-muted-foreground">
                {new Date(version.effective_at).toLocaleDateString(langKey === "en" ? "en-US" : langKey === "zh-TW" ? "zh-TW" : "zh-CN")}
              </span>
              {!version.is_active && (
                <button
                  onClick={(event) => { event.stopPropagation(); onActivate(version.id); }}
                  className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
                >
                  {label("activate", langKey)}
                </button>
              )}
              {expandedId === version.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
          </div>
          <AnimatePresence>
            {expandedId === version.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 pt-1 border-t border-border/50">
                  <pre className="text-xs text-muted-foreground bg-muted/10 rounded-lg p-3 overflow-x-auto max-h-48">
                    {JSON.stringify(version.config_json, null, 2)}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Tab 1: Deduction Order ──────────────────────
// ═══════════════════════════════════════════════════
function DeductionOrderTab({ langKey }: { langKey: LangKey }) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data: versions = [] } = useRuleVersions("DEDUCTION_ORDER");

  const activeVersion = useMemo(() => versions.find((v) => v.is_active), [versions]);
  const activeConfig = activeVersion?.config_json as { order?: string[]; expire_first?: boolean } | undefined;

  const [order, setOrder] = useState<string[]>(activeConfig?.order ?? ["paid", "bonus", "activity"]);
  const [expireFirst, setExpireFirst] = useState(activeConfig?.expire_first ?? true);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync when active version changes
  const activeOrderString = JSON.stringify(activeConfig?.order ?? ["paid", "bonus", "activity"]);
  const activeExpireFirst = activeConfig?.expire_first ?? true;

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrder(newOrder);
  };

  const hasChanges = JSON.stringify(order) !== activeOrderString || expireFirst !== activeExpireFirst;

  const handleSave = async () => {
    setSaving(true);
    const nextVersion = (versions[0]?.version ?? 0) + 1;
    const configJson = { order, expire_first: expireFirst };

    // Deactivate current active version
    if (activeVersion) {
      await supabase.from("cp_rules_versions").update({ is_active: false }).eq("id", activeVersion.id);
    }

    const { error } = await supabase.from("cp_rules_versions").insert({
      rule_type: "DEDUCTION_ORDER",
      version: nextVersion,
      config_json: configJson,
      description: description || `Deduction order: ${order.join(" → ")}`,
      effective_at: new Date().toISOString(),
      is_active: true,
      created_by: profile?.id ?? null,
    });

    setSaving(false);
    if (error) {
      toast.error(label("error", langKey));
    } else {
      toast.success(label("saved", langKey));
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["cp-rules-versions", "DEDUCTION_ORDER"] });
    }
  };

  const handleActivateVersion = async (versionId: string) => {
    if (activeVersion) {
      await supabase.from("cp_rules_versions").update({ is_active: false }).eq("id", activeVersion.id);
    }
    const { error } = await supabase.from("cp_rules_versions").update({ is_active: true }).eq("id", versionId);
    if (error) {
      toast.error(label("error", langKey));
    } else {
      toast.success(label("activated", langKey));
      queryClient.invalidateQueries({ queryKey: ["cp-rules-versions", "DEDUCTION_ORDER"] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Order Editor */}
      <SectionCard>
        <SectionTitle icon={Settings} title={label("currentOrder", langKey)} description={label("deductionDesc", langKey)} />

        <div className="space-y-2">
          {order.map((code, index) => {
            const cpType = CP_TYPES.find((c) => c.code === code);
            if (!cpType) return null;
            const Icon = cpType.icon;
            return (
              <motion.div
                key={code}
                layout
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                  cpType.colorBg, cpType.colorBorder
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-0.5 rounded hover:bg-black/5 disabled:opacity-20 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === order.length - 1}
                    className="p-0.5 rounded hover:bg-black/5 disabled:opacity-20 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>

                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", cpType.colorBg)}>
                  <Icon className={cn("w-4 h-4", cpType.colorText)} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{cpTypeName(code, langKey)}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-black/5 text-muted-foreground font-mono">
                      #{index + 1}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{cpTypeDesc(code, langKey)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Expire-first option */}
        <div className="mt-5 p-4 rounded-xl bg-muted/10 border border-border">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setExpireFirst(!expireFirst)}
              className="mt-0.5 flex-shrink-0"
            >
              {expireFirst
                ? <ToggleRight className="w-6 h-6 text-emerald-500" />
                : <ToggleLeft className="w-6 h-6 text-muted-foreground" />
              }
            </button>
            <div>
              <p className="text-sm font-medium text-foreground">{label("expireFirst", langKey)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label("expireFirstDesc", langKey)}</p>
            </div>
          </div>
        </div>

        <DescriptionInput value={description} onChange={setDescription} langKey={langKey} />

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {label("save", langKey)}
          </button>
        </div>
      </SectionCard>

      {/* Version History */}
      <SectionCard>
        <SectionTitle icon={History} title={label("versionHistory", langKey)} />
        <VersionHistorySection ruleType="DEDUCTION_ORDER" langKey={langKey} onActivate={handleActivateVersion} />
      </SectionCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Tab 2: Referral Rewards ─────────────────────
// ═══════════════════════════════════════════════════
const TRIGGER_EVENT_OPTIONS = [
  { key: "referral_register", labelKey: "evtRegister", icon: UserPlus },
  { key: "first_recharge", labelKey: "evtFirstRecharge", icon: Wallet },
  { key: "first_consumption", labelKey: "evtFirstConsumption", icon: Zap },
  { key: "complete_assessment", labelKey: "evtCompleteAssessment", icon: FileText },
];

const RECIPIENT_OPTIONS = [
  { value: "referrer", labelKey: "recipientReferrer" },
  { value: "referred", labelKey: "recipientReferred" },
  { value: "both", labelKey: "recipientBoth" },
];

const CONDITION_OPTIONS = [
  { key: "identity_verified", labelKey: "condVerified" },
  { key: "email_verified", labelKey: "condEmailVerified" },
  { key: "min_recharge", labelKey: "condMinRecharge" },
];

interface ReferralConfig {
  trigger_events: string[];
  recipients: string;
  reward_mode: "fixed" | "percent";
  reward_amount: number;
  percent_value: number;
  conditions: string[];
  min_recharge_threshold: number;
  anti_fraud: {
    daily_limit: number;
    monthly_limit: number;
    same_device: boolean;
    same_ip: boolean;
  };
  validity_months: number;
  approval_mode: "auto" | "manual";
}

const DEFAULT_REFERRAL: ReferralConfig = {
  trigger_events: ["referral_register"],
  recipients: "referrer",
  reward_mode: "fixed",
  reward_amount: 50,
  percent_value: 5,
  conditions: [],
  min_recharge_threshold: 0,
  anti_fraud: { daily_limit: 5, monthly_limit: 20, same_device: false, same_ip: false },
  validity_months: 24,
  approval_mode: "auto",
};

function ReferralRewardTab({ langKey }: { langKey: LangKey }) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data: versions = [] } = useRuleVersions("REFERRAL_REWARD");

  const activeVersion = useMemo(() => versions.find((v) => v.is_active), [versions]);
  const activeConfig = activeVersion?.config_json as ReferralConfig | undefined;

  const [config, setConfig] = useState<ReferralConfig>(activeConfig ?? DEFAULT_REFERRAL);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleTrigger = (key: string) => {
    setConfig((prev) => ({
      ...prev,
      trigger_events: prev.trigger_events.includes(key)
        ? prev.trigger_events.filter((k) => k !== key)
        : [...prev.trigger_events, key],
    }));
  };

  const toggleCondition = (key: string) => {
    setConfig((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(key)
        ? prev.conditions.filter((k) => k !== key)
        : [...prev.conditions, key],
    }));
  };

  const handleSave = async () => {
    if (config.trigger_events.length === 0) {
      toast.error(langKey === "en" ? "Select at least one trigger event" : "請至少選擇一個觸發事件");
      return;
    }
    setSaving(true);
    const nextVersion = (versions[0]?.version ?? 0) + 1;

    if (activeVersion) {
      await supabase.from("cp_rules_versions").update({ is_active: false }).eq("id", activeVersion.id);
    }

    const { error } = await supabase.from("cp_rules_versions").insert({
      rule_type: "REFERRAL_REWARD",
      version: nextVersion,
      config_json: config as unknown as Record<string, unknown>,
      description: description || `Referral reward v${nextVersion}`,
      effective_at: new Date().toISOString(),
      is_active: true,
      created_by: profile?.id ?? null,
    });

    setSaving(false);
    if (error) {
      toast.error(label("error", langKey));
    } else {
      toast.success(label("saved", langKey));
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["cp-rules-versions", "REFERRAL_REWARD"] });
    }
  };

  const handleActivateVersion = async (versionId: string) => {
    if (activeVersion) {
      await supabase.from("cp_rules_versions").update({ is_active: false }).eq("id", activeVersion.id);
    }
    const { error } = await supabase.from("cp_rules_versions").update({ is_active: true }).eq("id", versionId);
    if (error) {
      toast.error(label("error", langKey));
    } else {
      toast.success(label("activated", langKey));
      queryClient.invalidateQueries({ queryKey: ["cp-rules-versions", "REFERRAL_REWARD"] });
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard>
        {/* Active Badge */}
        {activeVersion && (
          <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {label("currentConfig", langKey)} &mdash; v{activeVersion.version}
          </div>
        )}

        {/* Trigger Events */}
        <SectionTitle icon={Zap} title={label("triggerEvents", langKey)} />
        <div className="grid grid-cols-2 gap-2 mb-5">
          {TRIGGER_EVENT_OPTIONS.map(({ key, labelKey: labelKeyVal, icon: EvtIcon }) => {
            const isSelected = config.trigger_events.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleTrigger(key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                  isSelected ? "bg-red-50 border-red-200 text-red-700" : "bg-muted/5 border-border text-muted-foreground hover:bg-muted/10"
                )}
              >
                <EvtIcon className="w-4 h-4 flex-shrink-0" />
                {label(labelKeyVal, langKey)}
              </button>
            );
          })}
        </div>

        {/* Recipients */}
        <SectionTitle icon={Users} title={label("recipients", langKey)} />
        <div className="flex gap-2 mb-5">
          {RECIPIENT_OPTIONS.map(({ value, labelKey: labelKeyVal }) => (
            <button
              key={value}
              onClick={() => setConfig((prev) => ({ ...prev, recipients: value }))}
              className={cn(
                "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                config.recipients === value ? "bg-red-50 border-red-200 text-red-700" : "bg-muted/5 border-border text-muted-foreground hover:bg-muted/10"
              )}
            >
              {label(labelKeyVal, langKey)}
            </button>
          ))}
        </div>

        {/* Reward Amount */}
        <SectionTitle icon={Gift} title={label("rewardAmount", langKey)} />
        <div className="space-y-3 mb-5">
          <div className="flex gap-2">
            <button
              onClick={() => setConfig((prev) => ({ ...prev, reward_mode: "fixed" }))}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                config.reward_mode === "fixed" ? "bg-red-50 border-red-200 text-red-700" : "bg-muted/5 border-border text-muted-foreground"
              )}
            >
              <Hash className="w-3.5 h-3.5" />
              {label("modeFixed", langKey)}
            </button>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, reward_mode: "percent" }))}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                config.reward_mode === "percent" ? "bg-red-50 border-red-200 text-red-700" : "bg-muted/5 border-border text-muted-foreground"
              )}
            >
              <Percent className="w-3.5 h-3.5" />
              {label("modePercent", langKey)}
            </button>
          </div>

          {config.reward_mode === "fixed" ? (
            <div className="max-w-xs">
              <label className="text-xs text-muted-foreground mb-1 block">{label("rewardAmount", langKey)}</label>
              <input
                type="number"
                min="0"
                value={config.reward_amount}
                onChange={(event) => setConfig((prev) => ({ ...prev, reward_amount: Number(event.target.value) || 0 }))}
                className={inputClass}
              />
            </div>
          ) : (
            <div className="max-w-xs">
              <label className="text-xs text-muted-foreground mb-1 block">{label("percentValue", langKey)}</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={config.percent_value}
                onChange={(event) => setConfig((prev) => ({ ...prev, percent_value: Number(event.target.value) || 0 }))}
                className={inputClass}
              />
            </div>
          )}
        </div>

        {/* Conditions */}
        <SectionTitle icon={Shield} title={label("conditions", langKey)} />
        <div className="space-y-2 mb-5">
          {CONDITION_OPTIONS.map(({ key, labelKey: labelKeyVal }) => {
            const isChecked = config.conditions.includes(key);
            return (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCondition(key)}
                  className="w-4 h-4 rounded border-border text-red-500 focus:ring-red-400"
                />
                <span className="text-sm text-foreground">{label(labelKeyVal, langKey)}</span>
              </label>
            );
          })}
          {config.conditions.includes("min_recharge") && (
            <div className="ml-6 max-w-xs">
              <input
                type="number"
                min="0"
                value={config.min_recharge_threshold}
                onChange={(event) => setConfig((prev) => ({ ...prev, min_recharge_threshold: Number(event.target.value) || 0 }))}
                className={inputClass}
                placeholder="CP"
              />
            </div>
          )}
        </div>

        {/* Anti-Fraud */}
        <SectionTitle icon={Ban} title={label("antiFraud", langKey)} />
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{label("dailyLimit", langKey)}</label>
            <input
              type="number"
              min="0"
              value={config.anti_fraud.daily_limit}
              onChange={(event) => setConfig((prev) => ({ ...prev, anti_fraud: { ...prev.anti_fraud, daily_limit: Number(event.target.value) || 0 } }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{label("monthlyLimit", langKey)}</label>
            <input
              type="number"
              min="0"
              value={config.anti_fraud.monthly_limit}
              onChange={(event) => setConfig((prev) => ({ ...prev, anti_fraud: { ...prev.anti_fraud, monthly_limit: Number(event.target.value) || 0 } }))}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.anti_fraud.same_device}
              onChange={(event) => setConfig((prev) => ({ ...prev, anti_fraud: { ...prev.anti_fraud, same_device: event.target.checked } }))}
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm text-foreground">{label("sameDeviceLimit", langKey)}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.anti_fraud.same_ip}
              onChange={(event) => setConfig((prev) => ({ ...prev, anti_fraud: { ...prev.anti_fraud, same_ip: event.target.checked } }))}
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm text-foreground">{label("sameIpLimit", langKey)}</span>
          </label>
        </div>

        {/* Validity & Approval */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <SectionTitle icon={Clock} title={label("validityMonths", langKey)} />
            <input
              type="number"
              min="1"
              max="120"
              value={config.validity_months}
              onChange={(event) => setConfig((prev) => ({ ...prev, validity_months: Number(event.target.value) || 24 }))}
              className={inputClass}
            />
          </div>
          <div>
            <SectionTitle icon={CheckCircle2} title={label("approvalMode", langKey)} />
            <div className="flex gap-2">
              <button
                onClick={() => setConfig((prev) => ({ ...prev, approval_mode: "auto" }))}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-center",
                  config.approval_mode === "auto" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-muted/5 border-border text-muted-foreground"
                )}
              >
                {label("approvalAuto", langKey)}
              </button>
              <button
                onClick={() => setConfig((prev) => ({ ...prev, approval_mode: "manual" }))}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-center",
                  config.approval_mode === "manual" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-muted/5 border-border text-muted-foreground"
                )}
              >
                {label("approvalManual", langKey)}
              </button>
            </div>
          </div>
        </div>

        <DescriptionInput value={description} onChange={setDescription} langKey={langKey} />

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {label("save", langKey)}
          </button>
        </div>
      </SectionCard>

      {/* Version History */}
      <SectionCard>
        <SectionTitle icon={History} title={label("versionHistory", langKey)} />
        <VersionHistorySection ruleType="REFERRAL_REWARD" langKey={langKey} onActivate={handleActivateVersion} />
      </SectionCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Tab 3: Recharge Bonus ──────────────────────
// ═══════════════════════════════════════════════════
interface BonusConfig {
  package_bonuses: Record<string, { bonus_cp: number; cap: number }>;
  activity_start: string;
  activity_end: string;
}

function RechargeBonusTab({ langKey }: { langKey: LangKey }) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data: versions = [] } = useRuleVersions("RECHARGE_BONUS");
  const { data: packages = [], isLoading: packagesLoading } = useRechargePackages();

  const activeVersion = useMemo(() => versions.find((v) => v.is_active), [versions]);
  const activeConfig = activeVersion?.config_json as BonusConfig | undefined;

  const [packageBonuses, setPackageBonuses] = useState<Record<string, { bonus_cp: number; cap: number }>>(
    activeConfig?.package_bonuses ?? {}
  );
  const [activityStart, setActivityStart] = useState(activeConfig?.activity_start ?? "");
  const [activityEnd, setActivityEnd] = useState(activeConfig?.activity_end ?? "");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const updatePackageBonus = (packageId: string, field: "bonus_cp" | "cap", value: number) => {
    setPackageBonuses((prev) => ({
      ...prev,
      [packageId]: {
        ...prev[packageId],
        bonus_cp: prev[packageId]?.bonus_cp ?? 0,
        cap: prev[packageId]?.cap ?? 0,
        [field]: value,
      },
    }));
  };

  const packageDisplayName = (pkg: RechargePackage): string => {
    if (langKey === "en") return pkg.package_name_en;
    if (langKey === "zh-TW") return pkg.package_name_zh_tw;
    return pkg.package_name_zh_cn;
  };

  const handleSave = async () => {
    setSaving(true);
    const nextVersion = (versions[0]?.version ?? 0) + 1;
    const configJson: BonusConfig = {
      package_bonuses: packageBonuses,
      activity_start: activityStart,
      activity_end: activityEnd,
    };

    if (activeVersion) {
      await supabase.from("cp_rules_versions").update({ is_active: false }).eq("id", activeVersion.id);
    }

    const { error } = await supabase.from("cp_rules_versions").insert({
      rule_type: "RECHARGE_BONUS",
      version: nextVersion,
      config_json: configJson as unknown as Record<string, unknown>,
      description: description || `Recharge bonus v${nextVersion}`,
      effective_at: new Date().toISOString(),
      is_active: true,
      created_by: profile?.id ?? null,
    });

    setSaving(false);
    if (error) {
      toast.error(label("error", langKey));
    } else {
      toast.success(label("saved", langKey));
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["cp-rules-versions", "RECHARGE_BONUS"] });
    }
  };

  const handleActivateVersion = async (versionId: string) => {
    if (activeVersion) {
      await supabase.from("cp_rules_versions").update({ is_active: false }).eq("id", activeVersion.id);
    }
    const { error } = await supabase.from("cp_rules_versions").update({ is_active: true }).eq("id", versionId);
    if (error) {
      toast.error(label("error", langKey));
    } else {
      toast.success(label("activated", langKey));
      queryClient.invalidateQueries({ queryKey: ["cp-rules-versions", "RECHARGE_BONUS"] });
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard>
        {activeVersion && (
          <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {label("currentConfig", langKey)} &mdash; v{activeVersion.version}
          </div>
        )}

        <SectionTitle icon={Gift} title={label("bonusConfig", langKey)} description={label("bonusConfigDesc", langKey)} />

        {packagesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Gift className="w-8 h-8 mx-auto mb-2 opacity-30" />
            {label("noPackages", langKey)}
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/5">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">{label("packageName", langKey)}</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">{label("price", langKey)}</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">{label("baseCp", langKey)}</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-4 py-2.5">{label("bonusAmount", langKey)}</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-4 py-2.5">{label("bonusCap", langKey)}</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => {
                  const bonus = packageBonuses[pkg.id] ?? { bonus_cp: pkg.bonus_cp_amount, cap: 0 };
                  return (
                    <tr key={pkg.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-foreground">{packageDisplayName(pkg)}</div>
                        <div className="text-[11px] text-muted-foreground">{pkg.currency}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-foreground">
                        {Number(pkg.price_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-foreground">
                        {pkg.cp_amount.toLocaleString()} CP
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={bonus.bonus_cp}
                          onChange={(event) => updatePackageBonus(pkg.id, "bonus_cp", Number(event.target.value) || 0)}
                          className="w-24 mx-auto block px-2 py-1.5 bg-muted/10 border border-border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={bonus.cap}
                          onChange={(event) => updatePackageBonus(pkg.id, "cap", Number(event.target.value) || 0)}
                          className="w-24 mx-auto block px-2 py-1.5 bg-muted/10 border border-border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                          placeholder={label("unlimited", langKey)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Activity Period */}
        <div className="mt-5">
          <SectionTitle icon={Calendar} title={label("activityPeriod", langKey)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{label("startDate", langKey)}</label>
              <input
                type="date"
                value={activityStart}
                onChange={(event) => setActivityStart(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{label("endDate", langKey)}</label>
              <input
                type="date"
                value={activityEnd}
                onChange={(event) => setActivityEnd(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <DescriptionInput value={description} onChange={setDescription} langKey={langKey} />

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {label("save", langKey)}
          </button>
        </div>
      </SectionCard>

      {/* Version History */}
      <SectionCard>
        <SectionTitle icon={History} title={label("versionHistory", langKey)} />
        <VersionHistorySection ruleType="RECHARGE_BONUS" langKey={langKey} onActivate={handleActivateVersion} />
      </SectionCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Main Page ────────────────────────────────────
// ═══════════════════════════════════════════════════
type TabKey = "deduction_order" | "referral_reward" | "recharge_bonus";

export default function CpRulesEnginePage() {
  const { language } = useTranslation();
  const langKey: LangKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const [activeTab, setActiveTab] = useState<TabKey>("deduction_order");

  const tabs: { key: TabKey; labelKey: string; icon: React.ElementType }[] = [
    { key: "deduction_order", labelKey: "tabDeduction", icon: Settings },
    { key: "referral_reward", labelKey: "tabReferral", icon: Users },
    { key: "recharge_bonus", labelKey: "tabBonus", icon: Gift },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">{label("pageTitle", langKey)}</h1>
        <p className="text-sm text-muted-foreground">{label("pageDesc", langKey)}</p>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 bg-muted/10 p-1 rounded-xl mb-6 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label(tab.labelKey, langKey)}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "deduction_order" && <DeductionOrderTab langKey={langKey} />}
          {activeTab === "referral_reward" && <ReferralRewardTab langKey={langKey} />}
          {activeTab === "recharge_bonus" && <RechargeBonusTab langKey={langKey} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
