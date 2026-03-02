import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation, type Language } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Layers,
  ChevronDown,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────

interface LifeCardBasic {
  id: string;
  name_zh_cn: string;
  name_zh_tw: string;
  name_en: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

interface FusionRule {
  id: string;
  card_id_1: string;
  card_id_2: string;
  card_id_3: string;
  combination_text_zh_cn: string;
  combination_text_zh_tw: string;
  combination_text_en: string;
  version: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

type FusionFormData = {
  card_id_1: string;
  card_id_2: string;
  card_id_3: string;
  combination_text_zh_cn: string;
  combination_text_zh_tw: string;
  combination_text_en: string;
  is_active: boolean;
};

// ─── i18n ────────────────────────────────────────

function useText() {
  const { language } = useTranslation();
  const textMap: Record<Language, Record<string, string>> = {
    "zh-TW": {
      pageTitle: "融合規則配置器",
      pageDesc: "管理前 3 名卡片的組合解讀文本，為用戶生成融合分析報告",
      addRule: "新增規則",
      totalRules: "規則總數",
      activeRules: "已啟用",
      uniqueCombinations: "不重複組合",
      searchPlaceholder: "搜尋卡片名稱...",
      card1: "卡片 1（第一名）",
      card2: "卡片 2（第二名）",
      card3: "卡片 3（第三名）",
      selectCard: "選擇卡片",
      combinationText: "組合解讀文本",
      textZhTw: "繁體中文解讀",
      textZhCn: "簡體中文解讀",
      textEn: "英文解讀",
      editRule: "編輯規則",
      createRule: "新增規則",
      save: "儲存",
      cancel: "取消",
      deleteConfirm: "確定要刪除此融合規則？",
      deleteSuccess: "規則已刪除",
      saveSuccess: "規則已儲存",
      toggleSuccess: "狀態已更新",
      active: "啟用",
      inactive: "停用",
      version: "版本",
      duplicateWarning: "此卡片組合已存在規則",
      sameCardWarning: "三張卡片不能重複",
      noCards: "請先在「理想人生卡管理」頁面新增卡片",
      combination: "組合",
      rank: "名次",
    },
    "zh-CN": {
      pageTitle: "融合规则配置器",
      pageDesc: "管理前 3 名卡片的组合解读文本，为用户生成融合分析报告",
      addRule: "新增规则",
      totalRules: "规则总数",
      activeRules: "已启用",
      uniqueCombinations: "不重复组合",
      searchPlaceholder: "搜索卡片名称...",
      card1: "卡片 1（第一名）",
      card2: "卡片 2（第二名）",
      card3: "卡片 3（第三名）",
      selectCard: "选择卡片",
      combinationText: "组合解读文本",
      textZhTw: "繁体中文解读",
      textZhCn: "简体中文解读",
      textEn: "英文解读",
      editRule: "编辑规则",
      createRule: "新增规则",
      save: "保存",
      cancel: "取消",
      deleteConfirm: "确定要删除此融合规则？",
      deleteSuccess: "规则已删除",
      saveSuccess: "规则已保存",
      toggleSuccess: "状态已更新",
      active: "启用",
      inactive: "停用",
      version: "版本",
      duplicateWarning: "此卡片组合已存在规则",
      sameCardWarning: "三张卡片不能重复",
      noCards: "请先在「理想人生卡管理」页面新增卡片",
      combination: "组合",
      rank: "名次",
    },
    en: {
      pageTitle: "Fusion Rules Configurator",
      pageDesc: "Manage top 3 card combination interpretation text for fusion analysis reports",
      addRule: "Add Rule",
      totalRules: "Total Rules",
      activeRules: "Active",
      uniqueCombinations: "Unique Combos",
      searchPlaceholder: "Search card name...",
      card1: "Card 1 (1st Place)",
      card2: "Card 2 (2nd Place)",
      card3: "Card 3 (3rd Place)",
      selectCard: "Select card",
      combinationText: "Combination Text",
      textZhTw: "Traditional Chinese Text",
      textZhCn: "Simplified Chinese Text",
      textEn: "English Text",
      editRule: "Edit Rule",
      createRule: "Add Rule",
      save: "Save",
      cancel: "Cancel",
      deleteConfirm: "Are you sure you want to delete this fusion rule?",
      deleteSuccess: "Rule deleted",
      saveSuccess: "Rule saved",
      toggleSuccess: "Status updated",
      active: "Active",
      inactive: "Inactive",
      version: "Version",
      duplicateWarning: "A rule for this card combination already exists",
      sameCardWarning: "All three cards must be different",
      noCards: "Please add cards in Life Card Management first",
      combination: "Combination",
      rank: "Rank",
    },
  };
  return textMap[language];
}

// ─── Card Picker Component ───────────────────────

function CardPicker({
  label,
  value,
  onChange,
  cards,
  excludeIds,
  language,
}: {
  label: string;
  value: string;
  onChange: (cardId: string) => void;
  cards: LifeCardBasic[];
  excludeIds: string[];
  language: Language;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState("");

  const selectedCard = cards.find((card) => card.id === value);

  const getCardName = useCallback(
    (card: LifeCardBasic) => {
      if (language === "en") return card.name_en || card.name_zh_tw;
      if (language === "zh-CN") return card.name_zh_cn || card.name_zh_tw;
      return card.name_zh_tw;
    },
    [language]
  );

  const filteredCards = useMemo(
    () =>
      cards
        .filter((card) => card.is_active && !excludeIds.includes(card.id))
        .filter(
          (card) =>
            !filterText ||
            getCardName(card).toLowerCase().includes(filterText.toLowerCase())
        ),
    [cards, excludeIds, filterText, getCardName]
  );

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-2.5 text-sm border rounded-lg flex items-center justify-between transition-all text-left",
          isOpen
            ? "border-blue-400 ring-2 ring-blue-500/20"
            : "border-slate-200 hover:border-slate-300",
          value ? "text-slate-800" : "text-slate-400"
        )}
      >
        <span className="truncate">
          {selectedCard ? getCardName(selectedCard) : label}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-40 max-h-64 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-slate-100">
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter..."
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => {
                    onChange(card.id);
                    setIsOpen(false);
                    setFilterText("");
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-sm text-left hover:bg-blue-50 transition-colors flex items-center gap-2",
                    card.id === value && "bg-blue-50 text-blue-700 font-medium"
                  )}
                >
                  <span className="text-xs text-slate-400 w-6 flex-shrink-0">#{card.sort_order}</span>
                  <span className="truncate">{getCardName(card)}</span>
                  <Badge variant="outline" className="text-[9px] ml-auto flex-shrink-0 border-slate-200 text-slate-500">
                    {card.category}
                  </Badge>
                </button>
              ))}
              {filteredCards.length === 0 && (
                <div className="px-3 py-4 text-xs text-slate-400 text-center">No cards available</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Fusion Form Component ───────────────────────

function FusionRuleForm({
  initialData,
  cards,
  onSave,
  onCancel,
  isSaving,
  txt,
  language,
}: {
  initialData: FusionFormData | null;
  cards: LifeCardBasic[];
  onSave: (data: FusionFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
  txt: Record<string, string>;
  language: Language;
}) {
  const [form, setForm] = useState<FusionFormData>(
    initialData || {
      card_id_1: "",
      card_id_2: "",
      card_id_3: "",
      combination_text_zh_cn: "",
      combination_text_zh_tw: "",
      combination_text_en: "",
      is_active: true,
    }
  );

  const hasDuplicate = form.card_id_1 && form.card_id_2 && form.card_id_3 &&
    new Set([form.card_id_1, form.card_id_2, form.card_id_3]).size < 3;

  const isValid =
    form.card_id_1 &&
    form.card_id_2 &&
    form.card_id_3 &&
    !hasDuplicate &&
    form.combination_text_zh_tw.trim();

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-slate-800">
            {initialData ? txt.editRule : txt.createRule}
          </h3>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Card selection */}
        <div>
          <div className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            {txt.combination}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <CardPicker
              label={txt.card1}
              value={form.card_id_1}
              onChange={(value) => setForm((prev) => ({ ...prev, card_id_1: value }))}
              cards={cards}
              excludeIds={[form.card_id_2, form.card_id_3].filter(Boolean)}
              language={language}
            />
            <CardPicker
              label={txt.card2}
              value={form.card_id_2}
              onChange={(value) => setForm((prev) => ({ ...prev, card_id_2: value }))}
              cards={cards}
              excludeIds={[form.card_id_1, form.card_id_3].filter(Boolean)}
              language={language}
            />
            <CardPicker
              label={txt.card3}
              value={form.card_id_3}
              onChange={(value) => setForm((prev) => ({ ...prev, card_id_3: value }))}
              cards={cards}
              excludeIds={[form.card_id_1, form.card_id_2].filter(Boolean)}
              language={language}
            />
          </div>
          {hasDuplicate && (
            <p className="mt-2 text-xs text-red-500">{txt.sameCardWarning}</p>
          )}
        </div>

        {/* Combination text (3 languages) */}
        <div className="space-y-4">
          <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-500" />
            {txt.combinationText}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">{txt.textZhTw}</label>
            <textarea
              value={form.combination_text_zh_tw}
              onChange={(e) => setForm((prev) => ({ ...prev, combination_text_zh_tw: e.target.value }))}
              rows={5}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none leading-relaxed"
              placeholder={`${txt.textZhTw}...`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">{txt.textZhCn}</label>
            <textarea
              value={form.combination_text_zh_cn}
              onChange={(e) => setForm((prev) => ({ ...prev, combination_text_zh_cn: e.target.value }))}
              rows={5}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none leading-relaxed"
              placeholder={`${txt.textZhCn}...`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">{txt.textEn}</label>
            <textarea
              value={form.combination_text_en}
              onChange={(e) => setForm((prev) => ({ ...prev, combination_text_en: e.target.value }))}
              rows={5}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none leading-relaxed"
              placeholder={`${txt.textEn}...`}
            />
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
          </label>
          <span className="text-sm text-slate-600">
            {form.is_active ? txt.active : txt.inactive}
          </span>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {txt.cancel}
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={isSaving || !isValid}
          className="px-5 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {txt.save}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────

export default function FusionRulesPage() {
  const { language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const txt = useText();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingRule, setEditingRule] = useState<FusionRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // ─── Queries ────────────────────────────────

  const { data: cards = [] } = useQuery({
    queryKey: ["life-cards-basic"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_cards")
        .select("id, name_zh_cn, name_zh_tw, name_en, category, sort_order, is_active")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as LifeCardBasic[];
    },
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["fusion-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fusion_life_card_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as FusionRule[];
    },
  });

  // ─── Mutations ──────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: FusionFormData }) => {
      if (id) {
        const { error } = await supabase
          .from("fusion_life_card_rules")
          .update({
            card_id_1: data.card_id_1,
            card_id_2: data.card_id_2,
            card_id_3: data.card_id_3,
            combination_text_zh_cn: data.combination_text_zh_cn,
            combination_text_zh_tw: data.combination_text_zh_tw,
            combination_text_en: data.combination_text_en,
            is_active: data.is_active,
          })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("fusion_life_card_rules")
          .insert({
            ...data,
            version: 1,
            created_by: user?.id || "",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fusion-rules"] });
      toast.success(txt.saveSuccess);
      setEditingRule(null);
      setIsCreating(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase.from("fusion_life_card_rules").delete().eq("id", ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fusion-rules"] });
      toast.success(txt.deleteSuccess);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("fusion_life_card_rules")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fusion-rules"] });
      toast.success(txt.toggleSuccess);
    },
  });

  // ─── Helpers ────────────────────────────────

  const cardMap = useMemo(() => {
    const map: Record<string, LifeCardBasic> = {};
    cards.forEach((card) => {
      map[card.id] = card;
    });
    return map;
  }, [cards]);

  const getCardName = useCallback(
    (cardId: string) => {
      const card = cardMap[cardId];
      if (!card) return "—";
      if (language === "en") return card.name_en || card.name_zh_tw;
      if (language === "zh-CN") return card.name_zh_cn || card.name_zh_tw;
      return card.name_zh_tw;
    },
    [cardMap, language]
  );

  const filteredRules = useMemo(() => {
    if (!searchQuery) return rules;
    const lowerQuery = searchQuery.toLowerCase();
    return rules.filter((rule) => {
      const names = [
        getCardName(rule.card_id_1),
        getCardName(rule.card_id_2),
        getCardName(rule.card_id_3),
      ].join(" ");
      return names.toLowerCase().includes(lowerQuery);
    });
  }, [rules, searchQuery, getCardName]);

  const stats = useMemo(() => {
    const activeCount = rules.filter((rule) => rule.is_active).length;
    const uniqueSets = new Set(
      rules.map((rule) => [rule.card_id_1, rule.card_id_2, rule.card_id_3].sort().join("-"))
    );
    return { total: rules.length, active: activeCount, unique: uniqueSets.size };
  }, [rules]);

  const getCombinationPreview = useCallback(
    (rule: FusionRule) => {
      if (language === "en") return rule.combination_text_en || rule.combination_text_zh_tw;
      if (language === "zh-CN") return rule.combination_text_zh_cn || rule.combination_text_zh_tw;
      return rule.combination_text_zh_tw;
    },
    [language]
  );

  // ─── Render ─────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{txt.pageTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">{txt.pageDesc}</p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingRule(null);
          }}
          disabled={cards.length === 0}
          className="px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {txt.addRule}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: txt.totalRules, value: stats.total, color: "text-violet-600" },
          { label: txt.activeRules, value: stats.active, color: "text-emerald-600" },
          { label: txt.uniqueCombinations, value: stats.unique, color: "text-blue-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
            <div className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* No cards warning */}
      {cards.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 text-sm text-amber-700">
          {txt.noCards}
        </div>
      )}

      {/* Create / Edit Form */}
      {(isCreating || editingRule) && (
        <FusionRuleForm
          initialData={
            editingRule
              ? {
                  card_id_1: editingRule.card_id_1,
                  card_id_2: editingRule.card_id_2,
                  card_id_3: editingRule.card_id_3,
                  combination_text_zh_cn: editingRule.combination_text_zh_cn,
                  combination_text_zh_tw: editingRule.combination_text_zh_tw,
                  combination_text_en: editingRule.combination_text_en,
                  is_active: editingRule.is_active,
                }
              : null
          }
          cards={cards}
          onSave={(data) => saveMutation.mutate({ id: editingRule?.id, data })}
          onCancel={() => {
            setIsCreating(false);
            setEditingRule(null);
          }}
          isSaving={saveMutation.isPending}
          txt={txt}
          language={language}
        />
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={txt.searchPlaceholder}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white"
        />
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors"
            >
              <div className="px-5 py-4 flex items-start gap-4">
                {/* Card combination visual */}
                <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                  {[rule.card_id_1, rule.card_id_2, rule.card_id_3].map((cardId, index) => (
                    <div key={cardId} className="flex items-center gap-1.5">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-slate-400 font-medium mb-0.5">
                          #{index + 1}
                        </span>
                        <div className="px-2.5 py-1.5 bg-violet-50 border border-violet-100 rounded-md text-xs font-medium text-violet-700 max-w-[120px] truncate">
                          {getCardName(cardId)}
                        </div>
                      </div>
                      {index < 2 && <ArrowRight className="w-3.5 h-3.5 text-slate-300 mt-3" />}
                    </div>
                  ))}
                </div>

                {/* Text preview */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {getCombinationPreview(rule) || (
                      <span className="text-slate-400 italic">No text</span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.is_active })}
                    className="transition-colors"
                  >
                    {rule.is_active ? (
                      <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50">
                        {txt.active}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 bg-slate-50">
                        {txt.inactive}
                      </Badge>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setIsCreating(false);
                    }}
                    className="p-2 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                    title={txt.editRule}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(txt.deleteConfirm)) {
                        deleteMutation.mutate(rule.id);
                      }
                    }}
                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredRules.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-16 text-center">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">
                {searchQuery
                  ? language === "en"
                    ? "No rules match your search"
                    : language === "zh-TW"
                      ? "沒有符合搜尋條件的規則"
                      : "没有符合搜索条件的规则"
                  : language === "en"
                    ? "No fusion rules yet. Click 'Add Rule' to create one."
                    : language === "zh-TW"
                      ? "尚未建立融合規則，點擊「新增規則」開始"
                      : "尚未建立融合规则，点击「新增规则」开始"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}