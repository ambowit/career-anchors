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
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  FileText,
  Sparkles,
  Briefcase,
  Shield,
  AlertTriangle,
  Heart,
  Save,
  X,
  GripVertical,
  Languages,
} from "lucide-react";

// ─── Types ───────────────────────────────────────

interface LifeCard {
  id: string;
  name_zh_cn: string;
  name_zh_tw: string;
  name_en: string;
  short_description_zh_cn: string;
  short_description_zh_tw: string;
  short_description_en: string;
  category: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface TextBlock {
  id: string;
  card_id: string;
  core_value_text: string;
  career_tendency_text: string;
  strength_potential_text: string;
  development_advice_text: string;
  risk_warning_text: string;
  language: string;
  version: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

type CardFormData = {
  name_zh_cn: string;
  name_zh_tw: string;
  name_en: string;
  short_description_zh_cn: string;
  short_description_zh_tw: string;
  short_description_en: string;
  category: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

type TextBlockFormData = {
  core_value_text: string;
  career_tendency_text: string;
  strength_potential_text: string;
  development_advice_text: string;
  risk_warning_text: string;
};

// ─── Constants ───────────────────────────────────

const CATEGORIES = [
  "intrinsic",
  "material",
  "social",
  "growth",
  "freedom",
  "security",
  "creative",
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  intrinsic: <Heart className="w-3.5 h-3.5" />,
  material: <Briefcase className="w-3.5 h-3.5" />,
  social: <Sparkles className="w-3.5 h-3.5" />,
  growth: <ChevronRight className="w-3.5 h-3.5" />,
  freedom: <Shield className="w-3.5 h-3.5" />,
  security: <Shield className="w-3.5 h-3.5" />,
  creative: <Sparkles className="w-3.5 h-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  intrinsic: "bg-rose-50 text-rose-700 border-rose-200",
  material: "bg-amber-50 text-amber-700 border-amber-200",
  social: "bg-blue-50 text-blue-700 border-blue-200",
  growth: "bg-emerald-50 text-emerald-700 border-emerald-200",
  freedom: "bg-violet-50 text-violet-700 border-violet-200",
  security: "bg-slate-50 text-slate-700 border-slate-200",
  creative: "bg-orange-50 text-orange-700 border-orange-200",
};

const TEXT_BLOCK_LANGS: Array<{ code: string; label: Record<Language, string> }> = [
  { code: "zh-TW", label: { "zh-TW": "繁體中文", "zh-CN": "繁体中文", en: "Traditional Chinese" } },
  { code: "zh-CN", label: { "zh-TW": "簡體中文", "zh-CN": "简体中文", en: "Simplified Chinese" } },
  { code: "en", label: { "zh-TW": "English", "zh-CN": "English", en: "English" } },
];

// ─── i18n ────────────────────────────────────────

function useText() {
  const { language } = useTranslation();
  const textMap: Record<Language, Record<string, string>> = {
    "zh-TW": {
      pageTitle: "理想人生卡管理",
      pageDesc: "管理理想人生卡內容與解讀文本，支援新增、編輯、啟用/停用",
      searchPlaceholder: "搜尋卡片名稱...",
      addCard: "新增卡片",
      totalCards: "卡片總數",
      activeCards: "已啟用",
      categories: "分類數",
      withTextBlocks: "有解讀文本",
      name: "名稱",
      description: "描述",
      category: "分類",
      icon: "圖標",
      sortOrder: "排序",
      status: "狀態",
      actions: "操作",
      active: "啟用",
      inactive: "停用",
      allCategories: "全部分類",
      editCard: "編輯卡片",
      createCard: "新增卡片",
      save: "儲存",
      cancel: "取消",
      deleteConfirm: "確定要刪除此卡片？相關的解讀文本也會一併刪除。",
      deleteSuccess: "卡片已刪除",
      saveSuccess: "卡片已儲存",
      toggleSuccess: "狀態已更新",
      textBlocks: "解讀文本",
      manageTextBlocks: "管理解讀文本",
      coreValue: "核心價值",
      careerTendency: "職業傾向",
      strengthPotential: "優勢潛能",
      developmentAdvice: "發展建議",
      riskWarning: "風險提醒",
      version: "版本",
      textBlockSaved: "解讀文本已儲存",
      noTextBlock: "尚未建立此語言的解讀文本",
      createTextBlock: "建立解讀文本",
      nameCn: "名稱（簡中）",
      nameTw: "名稱（繁中）",
      nameEn: "名稱（英文）",
      descCn: "描述（簡中）",
      descTw: "描述（繁中）",
      descEn: "描述（英文）",
      intrinsic: "內在價值",
      material: "物質需求",
      social: "社交關係",
      growth: "成長發展",
      freedom: "自由獨立",
      security: "安全穩定",
      creative: "創造表達",
    },
    "zh-CN": {
      pageTitle: "理想人生卡管理",
      pageDesc: "管理理想人生卡内容与解读文本，支持新增、编辑、启用/停用",
      searchPlaceholder: "搜索卡片名称...",
      addCard: "新增卡片",
      totalCards: "卡片总数",
      activeCards: "已启用",
      categories: "分类数",
      withTextBlocks: "有解读文本",
      name: "名称",
      description: "描述",
      category: "分类",
      icon: "图标",
      sortOrder: "排序",
      status: "状态",
      actions: "操作",
      active: "启用",
      inactive: "停用",
      allCategories: "全部分类",
      editCard: "编辑卡片",
      createCard: "新增卡片",
      save: "保存",
      cancel: "取消",
      deleteConfirm: "确定要删除此卡片？相关的解读文本也会一并删除。",
      deleteSuccess: "卡片已删除",
      saveSuccess: "卡片已保存",
      toggleSuccess: "状态已更新",
      textBlocks: "解读文本",
      manageTextBlocks: "管理解读文本",
      coreValue: "核心价值",
      careerTendency: "职业倾向",
      strengthPotential: "优势潜能",
      developmentAdvice: "发展建议",
      riskWarning: "风险提醒",
      version: "版本",
      textBlockSaved: "解读文本已保存",
      noTextBlock: "尚未建立此语言的解读文本",
      createTextBlock: "建立解读文本",
      nameCn: "名称（简中）",
      nameTw: "名称（繁中）",
      nameEn: "名称（英文）",
      descCn: "描述（简中）",
      descTw: "描述（繁中）",
      descEn: "描述（英文）",
      intrinsic: "内在价值",
      material: "物质需求",
      social: "社交关系",
      growth: "成长发展",
      freedom: "自由独立",
      security: "安全稳定",
      creative: "创造表达",
    },
    en: {
      pageTitle: "Life Card Management",
      pageDesc: "Manage ideal life card content and interpretation text blocks",
      searchPlaceholder: "Search card name...",
      addCard: "Add Card",
      totalCards: "Total Cards",
      activeCards: "Active",
      categories: "Categories",
      withTextBlocks: "With Text Blocks",
      name: "Name",
      description: "Description",
      category: "Category",
      icon: "Icon",
      sortOrder: "Sort Order",
      status: "Status",
      actions: "Actions",
      active: "Active",
      inactive: "Inactive",
      allCategories: "All Categories",
      editCard: "Edit Card",
      createCard: "Add Card",
      save: "Save",
      cancel: "Cancel",
      deleteConfirm: "Are you sure you want to delete this card? Related text blocks will also be removed.",
      deleteSuccess: "Card deleted",
      saveSuccess: "Card saved",
      toggleSuccess: "Status updated",
      textBlocks: "Text Blocks",
      manageTextBlocks: "Manage Text Blocks",
      coreValue: "Core Value",
      careerTendency: "Career Tendency",
      strengthPotential: "Strength & Potential",
      developmentAdvice: "Development Advice",
      riskWarning: "Risk Warning",
      version: "Version",
      textBlockSaved: "Text block saved",
      noTextBlock: "No text block for this language yet",
      createTextBlock: "Create Text Block",
      nameCn: "Name (Simplified)",
      nameTw: "Name (Traditional)",
      nameEn: "Name (English)",
      descCn: "Description (Simplified)",
      descTw: "Description (Traditional)",
      descEn: "Description (English)",
      intrinsic: "Intrinsic Value",
      material: "Material Needs",
      social: "Social Relations",
      growth: "Growth & Dev",
      freedom: "Freedom",
      security: "Security",
      creative: "Creative",
    },
  };
  return textMap[language];
}

// ─── Card Form Component ─────────────────────────

function CardForm({
  initialData,
  onSave,
  onCancel,
  isSaving,
  txt,
}: {
  initialData: CardFormData | null;
  onSave: (data: CardFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
  txt: Record<string, string>;
}) {
  const [form, setForm] = useState<CardFormData>(
    initialData || {
      name_zh_cn: "",
      name_zh_tw: "",
      name_en: "",
      short_description_zh_cn: "",
      short_description_zh_tw: "",
      short_description_en: "",
      category: "intrinsic",
      icon: "heart",
      sort_order: 1,
      is_active: true,
    }
  );

  const updateField = useCallback(
    (field: keyof CardFormData, value: string | number | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">
          {initialData ? txt.editCard : txt.createCard}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Names */}
        <div className="grid grid-cols-3 gap-4">
          {(["zh-TW", "zh-CN", "en"] as const).map((lang) => {
            const fieldKey = `name_${lang.replace("-", "_").toLowerCase()}` as keyof CardFormData;
            const labelKey = lang === "zh-CN" ? "nameCn" : lang === "zh-TW" ? "nameTw" : "nameEn";
            return (
              <div key={lang}>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">{txt[labelKey]}</label>
                <input
                  type="text"
                  value={form[fieldKey] as string}
                  onChange={(e) => updateField(fieldKey, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
            );
          })}
        </div>

        {/* Descriptions */}
        <div className="grid grid-cols-3 gap-4">
          {(["zh-TW", "zh-CN", "en"] as const).map((lang) => {
            const fieldKey = `short_description_${lang.replace("-", "_").toLowerCase()}` as keyof CardFormData;
            const labelKey = lang === "zh-CN" ? "descCn" : lang === "zh-TW" ? "descTw" : "descEn";
            return (
              <div key={lang}>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">{txt[labelKey]}</label>
                <textarea
                  value={form[fieldKey] as string}
                  onChange={(e) => updateField(fieldKey, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                />
              </div>
            );
          })}
        </div>

        {/* Category + Icon + Sort */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">{txt.category}</label>
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {txt[category] || category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">{txt.icon}</label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => updateField("icon", e.target.value)}
              placeholder="e.g. heart, star, briefcase"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">{txt.sortOrder}</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => updateField("sort_order", Number(e.target.value))}
              min={1}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateField("is_active", e.target.checked)}
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
          disabled={isSaving || !form.name_zh_tw.trim()}
          className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {txt.save}
        </button>
      </div>
    </div>
  );
}

// ─── Text Block Editor Component ─────────────────

function TextBlockEditor({
  cardId,
  cardName,
  txt,
  onClose,
}: {
  cardId: string;
  cardName: string;
  txt: Record<string, string>;
  onClose: () => void;
}) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeLang, setActiveLang] = useState(TEXT_BLOCK_LANGS[0].code);

  const { data: textBlocks = [], isLoading } = useQuery({
    queryKey: ["life-card-text-blocks", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_card_text_blocks")
        .select("*")
        .eq("card_id", cardId)
        .eq("is_active", true)
        .order("language");
      if (error) throw error;
      return (data || []) as TextBlock[];
    },
  });

  const currentBlock = useMemo(
    () => textBlocks.find((block) => block.language === activeLang),
    [textBlocks, activeLang]
  );

  const [form, setForm] = useState<TextBlockFormData>({
    core_value_text: "",
    career_tendency_text: "",
    strength_potential_text: "",
    development_advice_text: "",
    risk_warning_text: "",
  });

  // Sync form when currentBlock or activeLang changes
  useMemo(() => {
    if (currentBlock) {
      setForm({
        core_value_text: currentBlock.core_value_text || "",
        career_tendency_text: currentBlock.career_tendency_text || "",
        strength_potential_text: currentBlock.strength_potential_text || "",
        development_advice_text: currentBlock.development_advice_text || "",
        risk_warning_text: currentBlock.risk_warning_text || "",
      });
    } else {
      setForm({
        core_value_text: "",
        career_tendency_text: "",
        strength_potential_text: "",
        development_advice_text: "",
        risk_warning_text: "",
      });
    }
  }, [currentBlock, activeLang]);

  const saveMutation = useMutation({
    mutationFn: async (data: TextBlockFormData) => {
      if (currentBlock) {
        // Update existing
        const { error } = await supabase
          .from("life_card_text_blocks")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentBlock.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("life_card_text_blocks")
          .insert({
            card_id: cardId,
            ...data,
            language: activeLang,
            version: 1,
            is_active: true,
            created_by: user?.id || "",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-card-text-blocks", cardId] });
      queryClient.invalidateQueries({ queryKey: ["life-cards-with-blocks"] });
      toast.success(txt.textBlockSaved);
    },
  });

  const textFields: Array<{ key: keyof TextBlockFormData; label: string; icon: React.ReactNode }> = [
    { key: "core_value_text", label: txt.coreValue, icon: <Heart className="w-4 h-4 text-rose-500" /> },
    { key: "career_tendency_text", label: txt.careerTendency, icon: <Briefcase className="w-4 h-4 text-blue-500" /> },
    { key: "strength_potential_text", label: txt.strengthPotential, icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
    { key: "development_advice_text", label: txt.developmentAdvice, icon: <FileText className="w-4 h-4 text-emerald-500" /> },
    { key: "risk_warning_text", label: txt.riskWarning, icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Languages className="w-5 h-5 text-indigo-500" />
          <div>
            <h3 className="font-semibold text-slate-800">{txt.manageTextBlocks}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{cardName}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Language tabs */}
      <div className="px-6 pt-4 flex gap-1 border-b border-slate-100">
        {TEXT_BLOCK_LANGS.map((lang) => {
          const hasContent = textBlocks.some((block) => block.language === lang.code);
          return (
            <button
              key={lang.code}
              onClick={() => setActiveLang(lang.code)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative",
                activeLang === lang.code
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              {lang.label[language]}
              {hasContent && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="p-6 space-y-4">
          {!currentBlock && (
            <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
              {txt.noTextBlock}
            </div>
          )}

          {textFields.map(({ key, label, icon }) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                {icon}
                {label}
              </label>
              <textarea
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none leading-relaxed"
                placeholder={`${label}...`}
              />
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {currentBlock ? txt.save : txt.createTextBlock}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────

export default function LifeCardManagementPage() {
  const { language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const txt = useText();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [editingCard, setEditingCard] = useState<LifeCard | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedTextBlock, setExpandedTextBlock] = useState<string | null>(null);

  // ─── Queries ────────────────────────────────

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["life-cards-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_cards")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as LifeCard[];
    },
  });

  const { data: textBlockCounts = {} } = useQuery({
    queryKey: ["life-cards-with-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_card_text_blocks")
        .select("card_id")
        .eq("is_active", true);
      if (error) throw error;
      const countMap: Record<string, number> = {};
      (data || []).forEach((row: { card_id: string }) => {
        countMap[row.card_id] = (countMap[row.card_id] || 0) + 1;
      });
      return countMap;
    },
  });

  // ─── Mutations ──────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: CardFormData }) => {
      if (id) {
        const { error } = await supabase
          .from("life_cards")
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("life_cards")
          .insert({ ...data, created_by: user?.id || "" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-cards-admin"] });
      toast.success(txt.saveSuccess);
      setEditingCard(null);
      setIsCreating(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (cardId: string) => {
      // Delete text blocks first
      await supabase.from("life_card_text_blocks").delete().eq("card_id", cardId);
      const { error } = await supabase.from("life_cards").delete().eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-cards-admin"] });
      queryClient.invalidateQueries({ queryKey: ["life-cards-with-blocks"] });
      toast.success(txt.deleteSuccess);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("life_cards")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-cards-admin"] });
      toast.success(txt.toggleSuccess);
    },
  });

  // ─── Computed ───────────────────────────────

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch =
        !searchQuery ||
        card.name_zh_tw.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.name_zh_cn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.name_en.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !filterCategory || card.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [cards, searchQuery, filterCategory]);

  const stats = useMemo(() => {
    const activeCount = cards.filter((card) => card.is_active).length;
    const uniqueCategories = new Set(cards.map((card) => card.category)).size;
    const withBlocks = Object.keys(textBlockCounts).length;
    return { total: cards.length, active: activeCount, categories: uniqueCategories, withBlocks };
  }, [cards, textBlockCounts]);

  const getCardName = useCallback(
    (card: LifeCard) => {
      if (language === "en") return card.name_en || card.name_zh_tw;
      if (language === "zh-CN") return card.name_zh_cn || card.name_zh_tw;
      return card.name_zh_tw;
    },
    [language]
  );

  const getCardDesc = useCallback(
    (card: LifeCard) => {
      if (language === "en") return card.short_description_en || card.short_description_zh_tw;
      if (language === "zh-CN") return card.short_description_zh_cn || card.short_description_zh_tw;
      return card.short_description_zh_tw;
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
            setEditingCard(null);
          }}
          className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {txt.addCard}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: txt.totalCards, value: stats.total, color: "text-blue-600" },
          { label: txt.activeCards, value: stats.active, color: "text-emerald-600" },
          { label: txt.categories, value: stats.categories, color: "text-violet-600" },
          { label: txt.withTextBlocks, value: stats.withBlocks, color: "text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
            <div className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Create / Edit Form */}
      {(isCreating || editingCard) && (
        <CardForm
          initialData={
            editingCard
              ? {
                  name_zh_cn: editingCard.name_zh_cn,
                  name_zh_tw: editingCard.name_zh_tw,
                  name_en: editingCard.name_en,
                  short_description_zh_cn: editingCard.short_description_zh_cn,
                  short_description_zh_tw: editingCard.short_description_zh_tw,
                  short_description_en: editingCard.short_description_en,
                  category: editingCard.category,
                  icon: editingCard.icon,
                  sort_order: editingCard.sort_order,
                  is_active: editingCard.is_active,
                }
              : null
          }
          onSave={(data) => saveMutation.mutate({ id: editingCard?.id, data })}
          onCancel={() => {
            setIsCreating(false);
            setEditingCard(null);
          }}
          isSaving={saveMutation.isPending}
          txt={txt}
        />
      )}

      {/* Text Block Editor */}
      {expandedTextBlock && (
        <TextBlockEditor
          cardId={expandedTextBlock}
          cardName={getCardName(cards.find((card) => card.id === expandedTextBlock)!)}
          txt={txt}
          onClose={() => setExpandedTextBlock(null)}
        />
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={txt.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        >
          <option value="">{txt.allCategories}</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {txt[category] || category}
            </option>
          ))}
        </select>
      </div>

      {/* Card List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {txt.name}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">
                  {txt.category}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">
                  {txt.textBlocks}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">
                  {txt.status}
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">
                  {txt.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCards.map((card) => {
                const blockCount = textBlockCounts[card.id] || 0;
                return (
                  <tr key={card.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-400 font-mono">{card.sort_order}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-sm text-slate-800">{getCardName(card)}</div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {getCardDesc(card)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium",
                          CATEGORY_COLORS[card.category] || "bg-slate-50 text-slate-600 border-slate-200"
                        )}
                      >
                        <span className="flex items-center gap-1">
                          {CATEGORY_ICONS[card.category]}
                          {txt[card.category] || card.category}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("text-xs font-medium", blockCount > 0 ? "text-emerald-600" : "text-slate-400")}>
                        {blockCount}/3
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleMutation.mutate({ id: card.id, isActive: !card.is_active })}
                        className="transition-colors"
                      >
                        {card.is_active ? (
                          <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50">
                            {txt.active}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 bg-slate-50">
                            {txt.inactive}
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setExpandedTextBlock(expandedTextBlock === card.id ? null : card.id)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            expandedTextBlock === card.id
                              ? "bg-indigo-100 text-indigo-600"
                              : "hover:bg-slate-100 text-slate-500"
                          )}
                          title={txt.manageTextBlocks}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCard(card);
                            setIsCreating(false);
                          }}
                          className="p-2 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                          title={txt.editCard}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(txt.deleteConfirm)) {
                              deleteMutation.mutate(card.id);
                            }
                          }}
                          className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCards.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-400 text-sm">
                    {searchQuery || filterCategory
                      ? language === "en"
                        ? "No cards match your filters"
                        : language === "zh-TW"
                          ? "沒有符合篩選條件的卡片"
                          : "没有符合筛选条件的卡片"
                      : language === "en"
                        ? "No cards yet. Click 'Add Card' to create one."
                        : language === "zh-TW"
                          ? "尚未建立卡片，點擊「新增卡片」開始"
                          : "尚未建立卡片，点击「新增卡片」开始"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}