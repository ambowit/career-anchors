import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Pencil, X, Search, Lock, Plus, Trash2,
  ToggleLeft, ToggleRight, Star, Loader2, Crown, AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";

type LangKey = "en" | "zh-TW" | "zh-CN";

// ─── Types ────────────────────────────────────────
interface MembershipTier {
  id: string;
  tier_code: string;
  tier_name_zh_tw: string;
  tier_name_zh_cn: string;
  tier_name_en: string;
  recharge_threshold_12m: number;
  single_recharge_threshold: number | null;
  discount_rate: number;
  benefits: string[] | null;
  sort_order: number;
  icon_emoji: string;
  color_hex: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MembershipRule {
  id: string;
  rule_key: string;
  rule_value: unknown;
  rule_description_zh_tw: string;
  rule_description_zh_cn: string;
  rule_description_en: string;
  is_editable: boolean;
  is_system_locked: boolean;
  updated_by: string | null;
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
  description_zh_tw: string | null;
  description_zh_cn: string | null;
  description_en: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ─── Labels ───────────────────────────────────────
const TXT: Record<string, Record<LangKey, string>> = {
  pageTitle: { en: "Membership Rules Engine", "zh-TW": "會員規則引擎", "zh-CN": "会员规则引擎" },
  pageDesc: { en: "Manage membership tiers, system rules, and recharge packages", "zh-TW": "管理會員等級、系統規則和儲值包", "zh-CN": "管理会员等级、系统规则和充值包" },
  tabTiers: { en: "Membership Tiers", "zh-TW": "等級管理", "zh-CN": "等级管理" },
  tabRules: { en: "System Rules", "zh-TW": "規則配置", "zh-CN": "规则配置" },
  tabPackages: { en: "Recharge Packages", "zh-TW": "儲值包", "zh-CN": "充值包" },
  // Tiers
  tierCode: { en: "Code", "zh-TW": "代碼", "zh-CN": "代码" },
  tierName: { en: "Tier Name", "zh-TW": "等級名稱", "zh-CN": "等级名称" },
  threshold12m: { en: "12M Threshold", "zh-TW": "12個月門檻", "zh-CN": "12个月门槛" },
  singleThreshold: { en: "Single Threshold", "zh-TW": "單次門檻", "zh-CN": "单次门槛" },
  discountRate: { en: "Discount Rate", "zh-TW": "折扣率", "zh-CN": "折扣率" },
  benefits: { en: "Benefits", "zh-TW": "權益", "zh-CN": "权益" },
  sortOrder: { en: "Sort Order", "zh-TW": "排序", "zh-CN": "排序" },
  iconEmoji: { en: "Icon", "zh-TW": "圖示", "zh-CN": "图标" },
  colorHex: { en: "Color", "zh-TW": "顏色", "zh-CN": "颜色" },
  status: { en: "Status", "zh-TW": "狀態", "zh-CN": "状态" },
  actions: { en: "Actions", "zh-TW": "操作", "zh-CN": "操作" },
  active: { en: "Active", "zh-TW": "啟用", "zh-CN": "启用" },
  inactive: { en: "Inactive", "zh-TW": "停用", "zh-CN": "停用" },
  editTier: { en: "Edit Tier", "zh-TW": "編輯等級", "zh-CN": "编辑等级" },
  nameEn: { en: "Name (EN)", "zh-TW": "名稱 (EN)", "zh-CN": "名称 (EN)" },
  nameZhTw: { en: "Name (繁)", "zh-TW": "名稱 (繁體)", "zh-CN": "名称 (繁体)" },
  nameZhCn: { en: "Name (简)", "zh-TW": "名稱 (簡體)", "zh-CN": "名称 (简体)" },
  benefitsPlaceholder: { en: "One per line", "zh-TW": "每行一條", "zh-CN": "每行一条" },
  save: { en: "Save", "zh-TW": "儲存", "zh-CN": "保存" },
  cancel: { en: "Cancel", "zh-TW": "取消", "zh-CN": "取消" },
  saved: { en: "Saved", "zh-TW": "已儲存", "zh-CN": "已保存" },
  error: { en: "Error", "zh-TW": "錯誤", "zh-CN": "错误" },
  noData: { en: "No data", "zh-TW": "暫無資料", "zh-CN": "暂无数据" },
  // Rules
  ruleKey: { en: "Rule Key", "zh-TW": "規則鍵", "zh-CN": "规则键" },
  ruleDesc: { en: "Description", "zh-TW": "說明", "zh-CN": "说明" },
  ruleValue: { en: "Value", "zh-TW": "值", "zh-CN": "值" },
  editable: { en: "Editable", "zh-TW": "可編輯", "zh-CN": "可编辑" },
  systemLocked: { en: "System Locked", "zh-TW": "系統鎖定", "zh-CN": "系统锁定" },
  editRule: { en: "Edit Rule", "zh-TW": "編輯規則", "zh-CN": "编辑规则" },
  descEn: { en: "Description (EN)", "zh-TW": "說明 (EN)", "zh-CN": "说明 (EN)" },
  descZhTw: { en: "Description (繁)", "zh-TW": "說明 (繁體)", "zh-CN": "说明 (繁体)" },
  descZhCn: { en: "Description (简)", "zh-TW": "說明 (簡體)", "zh-CN": "说明 (简体)" },
  ruleValueJson: { en: "Value (JSON)", "zh-TW": "值 (JSON)", "zh-CN": "值 (JSON)" },
  invalidJson: { en: "Invalid JSON", "zh-TW": "JSON 格式錯誤", "zh-CN": "JSON 格式错误" },
  // Packages
  packageName: { en: "Package Name", "zh-TW": "包名稱", "zh-CN": "包名称" },
  price: { en: "Price", "zh-TW": "價格", "zh-CN": "价格" },
  currency: { en: "Currency", "zh-TW": "幣種", "zh-CN": "币种" },
  cpAmount: { en: "CP Amount", "zh-TW": "CP 數量", "zh-CN": "CP 数量" },
  bonusCp: { en: "Bonus CP", "zh-TW": "贈送 CP", "zh-CN": "赠送 CP" },
  featured: { en: "Featured", "zh-TW": "推薦", "zh-CN": "推荐" },
  addPackage: { en: "Add Package", "zh-TW": "新增儲值包", "zh-CN": "新增充值包" },
  editPackage: { en: "Edit Package", "zh-TW": "編輯儲值包", "zh-CN": "编辑充值包" },
  createPackage: { en: "Create Package", "zh-TW": "建立儲值包", "zh-CN": "创建充值包" },
  deleteConfirm: { en: "Deactivate this package?", "zh-TW": "確定停用此儲值包？", "zh-CN": "确定停用此充值包？" },
  deactivated: { en: "Package deactivated", "zh-TW": "儲值包已停用", "zh-CN": "充值包已停用" },
  activated: { en: "Package activated", "zh-TW": "儲值包已啟用", "zh-CN": "充值包已启用" },
  description: { en: "Description", "zh-TW": "說明", "zh-CN": "说明" },
  search: { en: "Search...", "zh-TW": "搜尋...", "zh-CN": "搜索..." },
  totalTiers: { en: "Total Tiers", "zh-TW": "等級總數", "zh-CN": "等级总数" },
  activeTiers: { en: "Active", "zh-TW": "啟用中", "zh-CN": "启用中" },
  totalRules: { en: "Total Rules", "zh-TW": "規則總數", "zh-CN": "规则总数" },
  editableRules: { en: "Editable", "zh-TW": "可編輯", "zh-CN": "可编辑" },
  totalPackages: { en: "Total Packages", "zh-TW": "儲值包總數", "zh-CN": "充值包总数" },
  activePackages: { en: "Active", "zh-TW": "啟用中", "zh-CN": "启用中" },
  featuredPackages: { en: "Featured", "zh-TW": "推薦中", "zh-CN": "推荐中" },
  required: { en: "Required", "zh-TW": "必填", "zh-CN": "必填" },
  optional: { en: "Optional", "zh-TW": "選填", "zh-CN": "选填" },
  none: { en: "None", "zh-TW": "無", "zh-CN": "无" },
};

function label(key: string, langKey: LangKey): string {
  return TXT[key]?.[langKey] ?? key;
}

// ─── Data Hooks ──────────────────────────────────
function useTiers() {
  return useQuery({
    queryKey: ["membership-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_tiers")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as MembershipTier[];
    },
  });
}

function useRules() {
  return useQuery({
    queryKey: ["membership-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_rules")
        .select("*")
        .order("rule_key");
      if (error) throw error;
      return data as MembershipRule[];
    },
  });
}

function usePackages() {
  return useQuery({
    queryKey: ["recharge-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recharge_packages")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as RechargePackage[];
    },
  });
}

// ─── Small shared components ──────────────────────
function StatCard({ label: cardLabel, value, color, delay = 0 }: { label: string; value: string | number; color: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="bg-card border border-border rounded-xl p-4">
      <div className="text-xs text-muted-foreground font-medium mb-1">{cardLabel}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </motion.div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 w-[620px] shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </motion.div>
    </motion.div>
  );
}

function FieldLabel({ text, required = false }: { text: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground mb-1.5 block">
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

const inputClass = "w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-colors";
const selectClass = inputClass;

// ═══════════════════════════════════════════════════
// ─── Tab 1: Tiers ─────────────────────────────────
// ═══════════════════════════════════════════════════
function TiersTab({ langKey }: { langKey: LangKey }) {
  const queryClient = useQueryClient();
  const { data: tiers = [], isLoading } = useTiers();
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    tier_name_en: "", tier_name_zh_tw: "", tier_name_zh_cn: "",
    recharge_threshold_12m: "", single_recharge_threshold: "",
    discount_rate: "", benefits: "", sort_order: "", icon_emoji: "", color_hex: "",
  });

  const updateMutation = useMutation({
    mutationFn: async ({ tierId, updates }: { tierId: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from("membership_tiers").update(updates).eq("id", tierId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-tiers"] });
      toast.success(label("saved", langKey));
      setEditingTier(null);
    },
    onError: () => toast.error(label("error", langKey)),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ tierId, isActive }: { tierId: string; isActive: boolean }) => {
      const { error } = await supabase.from("membership_tiers").update({ is_active: isActive }).eq("id", tierId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-tiers"] });
    },
  });

  const openEditModal = (tier: MembershipTier) => {
    setEditingTier(tier);
    setFormData({
      tier_name_en: tier.tier_name_en,
      tier_name_zh_tw: tier.tier_name_zh_tw,
      tier_name_zh_cn: tier.tier_name_zh_cn,
      recharge_threshold_12m: String(Number(tier.recharge_threshold_12m)),
      single_recharge_threshold: tier.single_recharge_threshold ? String(Number(tier.single_recharge_threshold)) : "",
      discount_rate: String(Number(tier.discount_rate)),
      benefits: (tier.benefits || []).join("\n"),
      sort_order: String(tier.sort_order),
      icon_emoji: tier.icon_emoji || "",
      color_hex: tier.color_hex || "",
    });
  };

  const handleSaveTier = () => {
    if (!editingTier) return;
    if (!formData.tier_name_en || !formData.tier_name_zh_tw || !formData.tier_name_zh_cn) {
      toast.error(label("required", langKey));
      return;
    }
    const benefitsArray = formData.benefits.split("\n").map((b) => b.trim()).filter(Boolean);
    updateMutation.mutate({
      tierId: editingTier.id,
      updates: {
        tier_name_en: formData.tier_name_en,
        tier_name_zh_tw: formData.tier_name_zh_tw,
        tier_name_zh_cn: formData.tier_name_zh_cn,
        recharge_threshold_12m: parseFloat(formData.recharge_threshold_12m) || 0,
        single_recharge_threshold: formData.single_recharge_threshold ? parseFloat(formData.single_recharge_threshold) : null,
        discount_rate: parseFloat(formData.discount_rate) || 1,
        benefits: benefitsArray.length > 0 ? benefitsArray : null,
        sort_order: parseInt(formData.sort_order) || 0,
        icon_emoji: formData.icon_emoji || null,
        color_hex: formData.color_hex || null,
      },
    });
  };

  const filteredTiers = tiers.filter((tier) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return tier.tier_code.toLowerCase().includes(term) || tier.tier_name_en.toLowerCase().includes(term) || tier.tier_name_zh_tw.includes(term);
  });

  const tierDisplayName = (tier: MembershipTier) => {
    if (langKey === "en") return tier.tier_name_en;
    if (langKey === "zh-TW") return tier.tier_name_zh_tw;
    return tier.tier_name_zh_cn;
  };

  const stats = {
    total: tiers.length,
    active: tiers.filter((t) => t.is_active).length,
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label={label("totalTiers", langKey)} value={stats.total} color="text-slate-700" delay={0} />
        <StatCard label={label("activeTiers", langKey)} value={stats.active} color="text-emerald-600" delay={0.05} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={label("search", langKey)} className={`${inputClass} pl-10`} />
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filteredTiers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm"><Crown className="w-10 h-10 mx-auto mb-3 opacity-30" />{label("noData", langKey)}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{label("iconEmoji", langKey)}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{label("tierCode", langKey)}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{label("tierName", langKey)}</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{label("threshold12m", langKey)}</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{label("discountRate", langKey)}</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">{label("sortOrder", langKey)}</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">{label("status", langKey)}</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{label("actions", langKey)}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTiers.map((tier) => (
                <tr key={tier.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${tier.color_hex}20` }}>
                      {tier.icon_emoji}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground">{tier.tier_code}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-foreground">{tierDisplayName(tier)}</div>
                    {tier.benefits && tier.benefits.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">{tier.benefits.length} {label("benefits", langKey).toLowerCase()}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-semibold text-foreground">
                    {Number(tier.recharge_threshold_12m).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {(Number(tier.discount_rate) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-center text-muted-foreground">{tier.sort_order}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tier.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {tier.is_active ? label("active", langKey) : label("inactive", langKey)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEditModal(tier)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/20 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActiveMutation.mutate({ tierId: tier.id, isActive: !tier.is_active })}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/20 transition-colors"
                      >
                        {tier.is_active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Edit Tier Modal */}
      <AnimatePresence>
        {editingTier && (
          <ModalOverlay onClose={() => setEditingTier(null)}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">{label("editTier", langKey)}: {editingTier.tier_code}</h3>
              <button onClick={() => setEditingTier(null)} className="p-1 rounded-lg hover:bg-muted/20"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel text={label("nameEn", langKey)} required />
                  <input value={formData.tier_name_en} onChange={(e) => setFormData({ ...formData, tier_name_en: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <FieldLabel text={label("nameZhTw", langKey)} required />
                  <input value={formData.tier_name_zh_tw} onChange={(e) => setFormData({ ...formData, tier_name_zh_tw: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <FieldLabel text={label("nameZhCn", langKey)} required />
                  <input value={formData.tier_name_zh_cn} onChange={(e) => setFormData({ ...formData, tier_name_zh_cn: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel text={label("threshold12m", langKey)} required />
                  <input type="number" min="0" value={formData.recharge_threshold_12m} onChange={(e) => setFormData({ ...formData, recharge_threshold_12m: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <FieldLabel text={label("singleThreshold", langKey)} />
                  <input type="number" min="0" value={formData.single_recharge_threshold} onChange={(e) => setFormData({ ...formData, single_recharge_threshold: e.target.value })} className={inputClass} placeholder={label("optional", langKey)} />
                </div>
                <div>
                  <FieldLabel text={label("discountRate", langKey)} required />
                  <input type="number" step="0.001" min="0" max="1" value={formData.discount_rate} onChange={(e) => setFormData({ ...formData, discount_rate: e.target.value })} className={inputClass} placeholder="0.900" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel text={label("iconEmoji", langKey)} />
                  <input value={formData.icon_emoji} onChange={(e) => setFormData({ ...formData, icon_emoji: e.target.value })} className={inputClass} placeholder="🥉" />
                </div>
                <div>
                  <FieldLabel text={label("colorHex", langKey)} />
                  <div className="flex gap-2">
                    <input value={formData.color_hex} onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })} className={`${inputClass} flex-1`} placeholder="#cd7f32" />
                    {formData.color_hex && (
                      <div className="w-9 h-9 rounded-lg border border-border flex-shrink-0" style={{ backgroundColor: formData.color_hex }} />
                    )}
                  </div>
                </div>
                <div>
                  <FieldLabel text={label("sortOrder", langKey)} />
                  <input type="number" min="0" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <FieldLabel text={label("benefits", langKey)} />
                <textarea value={formData.benefits} onChange={(e) => setFormData({ ...formData, benefits: e.target.value })} rows={4} className={inputClass} placeholder={label("benefitsPlaceholder", langKey)} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingTier(null)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/20 rounded-lg transition-colors">{label("cancel", langKey)}</button>
              <button onClick={handleSaveTier} disabled={updateMutation.isPending} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : label("save", langKey)}
              </button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Tab 2: Rules ─────────────────────────────────
// ═══════════════════════════════════════════════════
function RulesTab({ langKey }: { langKey: LangKey }) {
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading } = useRules();
  const [editingRule, setEditingRule] = useState<MembershipRule | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    rule_value: "",
    rule_description_en: "",
    rule_description_zh_tw: "",
    rule_description_zh_cn: "",
  });
  const [jsonError, setJsonError] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from("membership_rules").update(updates).eq("id", ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-rules"] });
      toast.success(label("saved", langKey));
      setEditingRule(null);
    },
    onError: () => toast.error(label("error", langKey)),
  });

  const openEditModal = (rule: MembershipRule) => {
    setEditingRule(rule);
    setJsonError(false);
    setFormData({
      rule_value: JSON.stringify(rule.rule_value, null, 2),
      rule_description_en: rule.rule_description_en || "",
      rule_description_zh_tw: rule.rule_description_zh_tw || "",
      rule_description_zh_cn: rule.rule_description_zh_cn || "",
    });
  };

  const handleSaveRule = () => {
    if (!editingRule) return;
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(formData.rule_value);
      setJsonError(false);
    } catch {
      setJsonError(true);
      toast.error(label("invalidJson", langKey));
      return;
    }
    updateMutation.mutate({
      ruleId: editingRule.id,
      updates: {
        rule_value: parsedValue,
        rule_description_en: formData.rule_description_en,
        rule_description_zh_tw: formData.rule_description_zh_tw,
        rule_description_zh_cn: formData.rule_description_zh_cn,
      },
    });
  };

  const ruleDescription = (rule: MembershipRule) => {
    if (langKey === "en") return rule.rule_description_en;
    if (langKey === "zh-TW") return rule.rule_description_zh_tw;
    return rule.rule_description_zh_cn;
  };

  const filteredRules = rules.filter((rule) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return rule.rule_key.toLowerCase().includes(term) || ruleDescription(rule).toLowerCase().includes(term);
  });

  const stats = {
    total: rules.length,
    editable: rules.filter((r) => r.is_editable).length,
  };

  const CP_TYPE_LABELS: Record<string, Record<LangKey, string>> = {
    paid: { en: "Paid CP", "zh-TW": "付費CP", "zh-CN": "付费CP" },
    recharge_bonus: { en: "Recharge Bonus CP", "zh-TW": "儲值贈與CP", "zh-CN": "充值赠与CP" },
    activity: { en: "Activity CP", "zh-TW": "活動贈與CP", "zh-CN": "活动赠与CP" },
  };

  const formatRuleValueReadable = (ruleKey: string, value: unknown): string => {
    if (value === null || value === undefined) return "—";
    const val = value as any;
    try {
      switch (ruleKey) {
        case "consultation_reward_cp":
          return val.amount != null ? `${val.amount} CP` : JSON.stringify(value);
        case "cp_deduction_order": {
          const order = val.order || [];
          return order.map((typeCode: string) => CP_TYPE_LABELS[typeCode]?.[langKey] || typeCode).join(" → ");
        }
        case "cp_no_cash_out":
        case "cp_no_cross_account":
        case "cp_no_cross_currency":
        case "cp_no_transfer":
          return val.enforced === true
            ? (langKey === "en" ? "Yes (enforced)" : "是（強制）")
            : (langKey === "en" ? "No" : "否");
        case "cp_three_ledger": {
          const types = val.types || [];
          return types.map((typeCode: string) => CP_TYPE_LABELS[typeCode]?.[langKey] || typeCode).join(langKey === "en" ? ", " : "、");
        }
        case "cp_validity_months":
          return val.months != null
            ? `${val.months} ${langKey === "en" ? "months" : langKey === "zh-TW" ? "個月" : "个月"}`
            : JSON.stringify(value);
        case "min_downgrade_tier": {
          const tierNames: Record<string, Record<LangKey, string>> = {
            silver: { en: "Silver", "zh-TW": "白銀", "zh-CN": "白银" },
            gold: { en: "Gold", "zh-TW": "黃金", "zh-CN": "黄金" },
            platinum: { en: "Platinum", "zh-TW": "白金", "zh-CN": "白金" },
            diamond: { en: "Diamond", "zh-TW": "鑽石", "zh-CN": "钻石" },
            bronze: { en: "Bronze", "zh-TW": "青銅", "zh-CN": "青铜" },
          };
          const code = val.tier_code || "";
          return tierNames[code]?.[langKey] || code || "—";
        }
        default:
          if (typeof value === "object") return JSON.stringify(value);
          return String(value);
      }
    } catch {
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label={label("totalRules", langKey)} value={stats.total} color="text-slate-700" delay={0} />
        <StatCard label={label("editableRules", langKey)} value={stats.editable} color="text-amber-600" delay={0.05} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={label("search", langKey)} className={`${inputClass} pl-10`} />
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filteredRules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm"><Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />{label("noData", langKey)}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{label("ruleKey", langKey)}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{label("ruleDesc", langKey)}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 max-w-[200px]">{label("ruleValue", langKey)}</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">{label("status", langKey)}</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{label("actions", langKey)}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground">{rule.rule_key}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{ruleDescription(rule)}</td>
                  <td className="px-5 py-3.5 max-w-[200px]">
                    <span className="text-xs text-foreground/80 block truncate font-medium">
                      {formatRuleValueReadable(rule.rule_key, rule.rule_value)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {rule.is_system_locked ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700 border border-red-200">
                        <Lock className="w-3 h-3" /> {label("systemLocked", langKey)}
                      </span>
                    ) : rule.is_editable ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {label("editable", langKey)}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                        Read-only
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {rule.is_editable && !rule.is_system_locked ? (
                      <button onClick={() => openEditModal(rule)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/20 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/40 inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Edit Rule Modal */}
      <AnimatePresence>
        {editingRule && (
          <ModalOverlay onClose={() => setEditingRule(null)}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">{label("editRule", langKey)}: <code className="text-sm bg-muted/20 px-2 py-0.5 rounded">{editingRule.rule_key}</code></h3>
              <button onClick={() => setEditingRule(null)} className="p-1 rounded-lg hover:bg-muted/20"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <FieldLabel text={label("ruleValueJson", langKey)} required />
                <textarea
                  value={formData.rule_value}
                  onChange={(e) => { setFormData({ ...formData, rule_value: e.target.value }); setJsonError(false); }}
                  rows={5}
                  className={`${inputClass} font-mono text-xs ${jsonError ? "border-red-400 ring-2 ring-red-400/30" : ""}`}
                />
                {jsonError && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{label("invalidJson", langKey)}</div>
                )}
              </div>
              <div>
                <FieldLabel text={label("descEn", langKey)} />
                <input value={formData.rule_description_en} onChange={(e) => setFormData({ ...formData, rule_description_en: e.target.value })} className={inputClass} />
              </div>
              <div>
                <FieldLabel text={label("descZhTw", langKey)} />
                <input value={formData.rule_description_zh_tw} onChange={(e) => setFormData({ ...formData, rule_description_zh_tw: e.target.value })} className={inputClass} />
              </div>
              <div>
                <FieldLabel text={label("descZhCn", langKey)} />
                <input value={formData.rule_description_zh_cn} onChange={(e) => setFormData({ ...formData, rule_description_zh_cn: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingRule(null)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/20 rounded-lg transition-colors">{label("cancel", langKey)}</button>
              <button onClick={handleSaveRule} disabled={updateMutation.isPending} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : label("save", langKey)}
              </button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Tab 3: Packages ──────────────────────────────
// ═══════════════════════════════════════════════════
function PackagesTab({ langKey }: { langKey: LangKey }) {
  const queryClient = useQueryClient();
  const { data: packages = [], isLoading } = usePackages();
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<RechargePackage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const EMPTY_FORM = {
    package_name_en: "", package_name_zh_tw: "", package_name_zh_cn: "",
    price_amount: "", currency: "TWD", cp_amount: "", bonus_cp_amount: "0",
    description_en: "", description_zh_tw: "", description_zh_cn: "",
    is_featured: false, sort_order: "0",
  };
  const [formData, setFormData] = useState(EMPTY_FORM);

  const createMutation = useMutation({
    mutationFn: async (packageData: Record<string, unknown>) => {
      const { error } = await supabase.from("recharge_packages").insert(packageData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recharge-packages"] });
      toast.success(label("saved", langKey));
      setShowModal(false);
    },
    onError: () => toast.error(label("error", langKey)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ packageId, updates }: { packageId: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from("recharge_packages").update(updates).eq("id", packageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recharge-packages"] });
      toast.success(label("saved", langKey));
      setShowModal(false);
      setEditingPackage(null);
    },
    onError: () => toast.error(label("error", langKey)),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ packageId, isActive }: { packageId: string; isActive: boolean }) => {
      const { error } = await supabase.from("recharge_packages").update({ is_active: isActive }).eq("id", packageId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recharge-packages"] });
      toast.success(variables.isActive ? label("activated", langKey) : label("deactivated", langKey));
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ packageId, isFeatured }: { packageId: string; isFeatured: boolean }) => {
      const { error } = await supabase.from("recharge_packages").update({ is_featured: isFeatured }).eq("id", packageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recharge-packages"] });
    },
  });

  const openCreateModal = () => {
    setEditingPackage(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (pkg: RechargePackage) => {
    setEditingPackage(pkg);
    setFormData({
      package_name_en: pkg.package_name_en,
      package_name_zh_tw: pkg.package_name_zh_tw,
      package_name_zh_cn: pkg.package_name_zh_cn,
      price_amount: String(Number(pkg.price_amount)),
      currency: pkg.currency,
      cp_amount: String(pkg.cp_amount),
      bonus_cp_amount: String(pkg.bonus_cp_amount),
      description_en: pkg.description_en || "",
      description_zh_tw: pkg.description_zh_tw || "",
      description_zh_cn: pkg.description_zh_cn || "",
      is_featured: pkg.is_featured,
      sort_order: String(pkg.sort_order),
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.package_name_en || !formData.package_name_zh_tw || !formData.package_name_zh_cn || !formData.price_amount || !formData.cp_amount) {
      toast.error(label("required", langKey));
      return;
    }
    const packageData = {
      package_name_en: formData.package_name_en,
      package_name_zh_tw: formData.package_name_zh_tw,
      package_name_zh_cn: formData.package_name_zh_cn,
      price_amount: parseFloat(formData.price_amount),
      currency: formData.currency,
      cp_amount: parseInt(formData.cp_amount),
      bonus_cp_amount: parseInt(formData.bonus_cp_amount) || 0,
      description_en: formData.description_en || null,
      description_zh_tw: formData.description_zh_tw || null,
      description_zh_cn: formData.description_zh_cn || null,
      is_featured: formData.is_featured,
      is_active: true,
      sort_order: parseInt(formData.sort_order) || 0,
    };

    if (editingPackage) {
      updateMutation.mutate({ packageId: editingPackage.id, updates: packageData });
    } else {
      createMutation.mutate(packageData);
    }
  };

  const packageDisplayName = (pkg: RechargePackage) => {
    if (langKey === "en") return pkg.package_name_en;
    if (langKey === "zh-TW") return pkg.package_name_zh_tw;
    return pkg.package_name_zh_cn;
  };

  const filteredPackages = packages.filter((pkg) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return packageDisplayName(pkg).toLowerCase().includes(term) || pkg.package_name_en.toLowerCase().includes(term);
  });

  const stats = {
    total: packages.length,
    active: packages.filter((p) => p.is_active).length,
    featured: packages.filter((p) => p.is_featured).length,
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label={label("totalPackages", langKey)} value={stats.total} color="text-slate-700" delay={0} />
        <StatCard label={label("activePackages", langKey)} value={stats.active} color="text-emerald-600" delay={0.05} />
        <StatCard label={label("featuredPackages", langKey)} value={stats.featured} color="text-amber-600" delay={0.1} />
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={label("search", langKey)} className={`${inputClass} pl-10`} />
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
          <Plus className="w-4 h-4" />
          {label("addPackage", langKey)}
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filteredPackages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm"><Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />{label("noData", langKey)}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{label("packageName", langKey)}</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{label("price", langKey)}</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{label("cpAmount", langKey)}</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{label("bonusCp", langKey)}</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">{label("featured", langKey)}</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">{label("sortOrder", langKey)}</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">{label("status", langKey)}</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{label("actions", langKey)}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.map((pkg) => (
                <tr key={pkg.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-foreground">{packageDisplayName(pkg)}</div>
                    {pkg.currency && <div className="text-xs text-muted-foreground mt-0.5">{pkg.currency}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-semibold text-foreground">
                    {Number(pkg.price_amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right text-foreground">
                    {pkg.cp_amount.toLocaleString()} CP
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right">
                    {pkg.bonus_cp_amount > 0 ? (
                      <span className="text-emerald-600 font-medium">+{pkg.bonus_cp_amount.toLocaleString()}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => toggleFeaturedMutation.mutate({ packageId: pkg.id, isFeatured: !pkg.is_featured })}
                      className="p-1 rounded-lg hover:bg-muted/20 transition-colors"
                    >
                      <Star className={`w-4 h-4 ${pkg.is_featured ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-center text-muted-foreground">{pkg.sort_order}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pkg.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {pkg.is_active ? label("active", langKey) : label("inactive", langKey)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEditModal(pkg)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/20 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActiveMutation.mutate({ packageId: pkg.id, isActive: !pkg.is_active })}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/20 transition-colors"
                      >
                        {pkg.is_active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Create / Edit Package Modal */}
      <AnimatePresence>
        {showModal && (
          <ModalOverlay onClose={() => { setShowModal(false); setEditingPackage(null); }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">
                {editingPackage ? label("editPackage", langKey) : label("createPackage", langKey)}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingPackage(null); }} className="p-1 rounded-lg hover:bg-muted/20"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel text={label("nameEn", langKey)} required />
                  <input value={formData.package_name_en} onChange={(e) => setFormData({ ...formData, package_name_en: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <FieldLabel text={label("nameZhTw", langKey)} required />
                  <input value={formData.package_name_zh_tw} onChange={(e) => setFormData({ ...formData, package_name_zh_tw: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <FieldLabel text={label("nameZhCn", langKey)} required />
                  <input value={formData.package_name_zh_cn} onChange={(e) => setFormData({ ...formData, package_name_zh_cn: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel text={label("price", langKey)} required />
                  <input type="number" min="0" step="0.01" value={formData.price_amount} onChange={(e) => setFormData({ ...formData, price_amount: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <FieldLabel text={label("currency", langKey)} />
                  <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className={selectClass}>
                    <option value="TWD">TWD</option>
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                    <option value="HKD">HKD</option>
                  </select>
                </div>
                <div>
                  <FieldLabel text={label("sortOrder", langKey)} />
                  <input type="number" min="0" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel text={label("cpAmount", langKey)} required />
                  <input type="number" min="0" value={formData.cp_amount} onChange={(e) => setFormData({ ...formData, cp_amount: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <FieldLabel text={label("bonusCp", langKey)} />
                  <input type="number" min="0" value={formData.bonus_cp_amount} onChange={(e) => setFormData({ ...formData, bonus_cp_amount: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <FieldLabel text={`${label("description", langKey)} (EN)`} />
                <input value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} className={inputClass} />
              </div>
              <div>
                <FieldLabel text={`${label("description", langKey)} (繁體)`} />
                <input value={formData.description_zh_tw} onChange={(e) => setFormData({ ...formData, description_zh_tw: e.target.value })} className={inputClass} />
              </div>
              <div>
                <FieldLabel text={`${label("description", langKey)} (簡體)`} />
                <input value={formData.description_zh_cn} onChange={(e) => setFormData({ ...formData, description_zh_cn: e.target.value })} className={inputClass} />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm text-foreground flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    {label("featured", langKey)}
                  </span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditingPackage(null); }} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/20 rounded-lg transition-colors">{label("cancel", langKey)}</button>
              <button onClick={handleSubmit} disabled={isPending} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : label("save", langKey)}
              </button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Main Page ────────────────────────────────────
// ═══════════════════════════════════════════════════
type TabKey = "tiers" | "rules" | "packages";

export default function MembershipRulesPage() {
  const { language } = useTranslation();
  const langKey: LangKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const [activeTab, setActiveTab] = useState<TabKey>("tiers");

  const tabs: { key: TabKey; labelKey: string; icon: React.ElementType }[] = [
    { key: "tiers", labelKey: "tabTiers", icon: Crown },
    { key: "rules", labelKey: "tabRules", icon: Layers },
    { key: "packages", labelKey: "tabPackages", icon: Star },
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
              }`}
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
          {activeTab === "tiers" && <TiersTab langKey={langKey} />}
          {activeTab === "rules" && <RulesTab langKey={langKey} />}
          {activeTab === "packages" && <PackagesTab langKey={langKey} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
