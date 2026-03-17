import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation, type Language } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Lock,
  Unlock,
  Sparkles,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Filter,
  Briefcase,
  Scale,
  TreePine,
  Eye,
  CheckCircle2,
  AlertCircle,
  Languages,
  Save,
  X,
  ShieldCheck,
  Database,
  Loader2,
  Wand2,
} from "lucide-react";
import { LIFE_CARD_INIT_DATA } from "@/data/lifeCardInitData";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── Constants ───────────────────────────────────

const PRIMARY = "#1C2857";
const GOLD = "#F6C343";
const PAGE_SIZE = 20;

type SpectrumType = "career" | "neutral" | "lifestyle";

interface LifeCardRow {
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
  spectrum_type: SpectrumType;
  content_locked: boolean;
  locked_by: string | null;
  locked_at: string | null;
  version_no: number;
}

interface QuadrantContent {
  id: string;
  card_id: string;
  language: string;
  quadrant_external: string;
  quadrant_internal: string;
  quadrant_career: string;
  quadrant_relationship: string;
  is_locked: boolean;
}

const SPECTRUM_CONFIG: Record<SpectrumType, { label: Record<Language, string>; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  career: {
    label: { "zh-TW": "工作職業導向", "zh-CN": "工作职业导向", en: "Career-Oriented" },
    color: "#1C2857",
    bgColor: "#EEF0F7",
    borderColor: "#C5CAE0",
    icon: <Briefcase className="w-3.5 h-3.5" />,
  },
  neutral: {
    label: { "zh-TW": "中性價值", "zh-CN": "中性价值", en: "Neutral Value" },
    color: "#8B6914",
    bgColor: "#FDF8E8",
    borderColor: "#E8D890",
    icon: <Scale className="w-3.5 h-3.5" />,
  },
  lifestyle: {
    label: { "zh-TW": "生活形態導向", "zh-CN": "生活形态导向", en: "Lifestyle-Oriented" },
    color: "#1B6B3A",
    bgColor: "#ECFDF0",
    borderColor: "#A3D9B1",
    icon: <TreePine className="w-3.5 h-3.5" />,
  },
};

const QUADRANT_KEYS = ["quadrant_external", "quadrant_internal", "quadrant_career", "quadrant_relationship"] as const;

const QUADRANT_LABELS: Record<string, Record<Language, string>> = {
  quadrant_external: { "zh-TW": "對外部環境的感知", "zh-CN": "对外部环境的感知", en: "External Environment Perception" },
  quadrant_internal: { "zh-TW": "對自我內在的思維", "zh-CN": "对自我内在的思维", en: "Internal Self Thinking" },
  quadrant_career: { "zh-TW": "對職業生涯的態度", "zh-CN": "对职业生涯的态度", en: "Career Attitude" },
  quadrant_relationship: { "zh-TW": "對家庭或朋友的具體行為", "zh-CN": "对家庭或朋友的具体行为", en: "Family/Friend Behaviors" },
};

const LANG_TABS = [
  { code: "zh-TW", label: { "zh-TW": "繁體中文（權威版）", "zh-CN": "繁体中文（权威版）", en: "Traditional Chinese (Authoritative)" } },
  { code: "zh-CN", label: { "zh-TW": "簡體中文", "zh-CN": "简体中文", en: "Simplified Chinese" } },
  { code: "en", label: { "zh-TW": "English", "zh-CN": "English", en: "English" } },
];

const CATEGORY_LABELS: Record<string, Record<Language, string>> = {
  intrinsic: { "zh-TW": "內在價值", "zh-CN": "内在价值", en: "Intrinsic" },
  interpersonal: { "zh-TW": "人際關係", "zh-CN": "人际关系", en: "Interpersonal" },
  lifestyle: { "zh-TW": "生活方式", "zh-CN": "生活方式", en: "Lifestyle" },
  material: { "zh-TW": "物質條件", "zh-CN": "物质条件", en: "Material" },
  social: { "zh-TW": "社交關係", "zh-CN": "社交关系", en: "Social" },
  growth: { "zh-TW": "成長發展", "zh-CN": "成长发展", en: "Growth" },
  freedom: { "zh-TW": "自由獨立", "zh-CN": "自由独立", en: "Freedom" },
  security: { "zh-TW": "安全穩定", "zh-CN": "安全稳定", en: "Security" },
  creative: { "zh-TW": "創造表達", "zh-CN": "创造表达", en: "Creative" },
};

// ─── Component ──────────────────────────────────

export default function LifeCardManagementPage() {
  const { user } = useAuth();
  const { language } = useTranslation();
  const queryClient = useQueryClient();

  const t = useCallback((en: string, tw: string, cn?: string) => {
    if (language === "en") return en;
    if (language === "zh-TW") return tw;
    return cn || tw;
  }, [language]);

  // ─── State ──────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [spectrumFilter, setSpectrumFilter] = useState<string>("all");
  const [lockFilter, setLockFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCard, setEditingCard] = useState<LifeCardRow | null>(null);
  const [editLangTab, setEditLangTab] = useState("zh-TW");
  const [quadrantDrafts, setQuadrantDrafts] = useState<Record<string, Record<string, string>>>({});
  const [spectrumDraft, setSpectrumDraft] = useState<SpectrumType>("neutral");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isBatchInitializing, setIsBatchInitializing] = useState(false);
  const [batchInitProgress, setBatchInitProgress] = useState(0);
  const [isBatchTranslating, setIsBatchTranslating] = useState(false);
  const [batchTranslateProgress, setBatchTranslateProgress] = useState(0);
  const [batchTranslateTotal, setBatchTranslateTotal] = useState(0);
  const [batchTranslateCurrent, setBatchTranslateCurrent] = useState(0);

  // ─── Queries ────────────────────────────────
  const { data: allCards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["life-cards-generator"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_cards")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as LifeCardRow[];
    },
  });

  const { data: allQuadrants = [] } = useQuery({
    queryKey: ["life-card-quadrants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_card_quadrant_contents")
        .select("*");
      if (error) throw error;
      return (data || []) as QuadrantContent[];
    },
  });

  // ─── Derived Data ───────────────────────────
  const quadrantsByCardAndLang = useMemo(() => {
    const map: Record<string, Record<string, QuadrantContent>> = {};
    for (const quadrant of allQuadrants) {
      if (!map[quadrant.card_id]) map[quadrant.card_id] = {};
      map[quadrant.card_id][quadrant.language] = quadrant;
    }
    return map;
  }, [allQuadrants]);

  const filteredCards = useMemo(() => {
    let result = allCards;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (card) =>
          card.name_zh_tw.toLowerCase().includes(query) ||
          card.name_zh_cn.toLowerCase().includes(query) ||
          card.name_en.toLowerCase().includes(query)
      );
    }
    if (spectrumFilter !== "all") {
      result = result.filter((card) => card.spectrum_type === spectrumFilter);
    }
    if (lockFilter === "locked") {
      result = result.filter((card) => card.content_locked);
    } else if (lockFilter === "unlocked") {
      result = result.filter((card) => !card.content_locked);
    }
    return result;
  }, [allCards, searchQuery, spectrumFilter, lockFilter]);

  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredCards.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredCards, currentPage]);

  const totalPages = Math.ceil(filteredCards.length / PAGE_SIZE);

  const stats = useMemo(() => {
    const careerCount = allCards.filter((c) => c.spectrum_type === "career").length;
    const neutralCount = allCards.filter((c) => c.spectrum_type === "neutral").length;
    const lifestyleCount = allCards.filter((c) => c.spectrum_type === "lifestyle").length;
    const lockedCount = allCards.filter((c) => c.content_locked).length;
    const withQuadrantsCount = allCards.filter((c) => {
      const cardQuadrants = quadrantsByCardAndLang[c.id];
      if (!cardQuadrants) return false;
      const twContent = cardQuadrants["zh-TW"];
      return twContent && (twContent.quadrant_external || twContent.quadrant_internal || twContent.quadrant_career || twContent.quadrant_relationship);
    }).length;
    return { total: allCards.length, careerCount, neutralCount, lifestyleCount, lockedCount, withQuadrantsCount };
  }, [allCards, quadrantsByCardAndLang]);

  // ─── Mutations ──────────────────────────────
  const updateSpectrumMutation = useMutation({
    mutationFn: async ({ cardId, spectrumType }: { cardId: string; spectrumType: SpectrumType }) => {
      const { error } = await supabase
        .from("life_cards")
        .update({ spectrum_type: spectrumType })
        .eq("id", cardId);
      if (error) throw error;
      await supabase.from("life_card_content_audit_logs").insert({
        card_id: cardId,
        action: "spectrum_change",
        field_changed: "spectrum_type",
        new_value: spectrumType,
        performed_by: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-cards-generator"] });
      toast.success(t("Spectrum type updated", "光譜類型已更新", "光谱类型已更新"));
    },
  });

  const saveQuadrantsMutation = useMutation({
    mutationFn: async ({ cardId, langCode, quadrants }: { cardId: string; langCode: string; quadrants: Record<string, string> }) => {
      const existing = quadrantsByCardAndLang[cardId]?.[langCode];
      if (existing) {
        const { error } = await supabase
          .from("life_card_quadrant_contents")
          .update({
            quadrant_external: quadrants.quadrant_external || "",
            quadrant_internal: quadrants.quadrant_internal || "",
            quadrant_career: quadrants.quadrant_career || "",
            quadrant_relationship: quadrants.quadrant_relationship || "",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("life_card_quadrant_contents")
          .insert({
            card_id: cardId,
            language: langCode,
            quadrant_external: quadrants.quadrant_external || "",
            quadrant_internal: quadrants.quadrant_internal || "",
            quadrant_career: quadrants.quadrant_career || "",
            quadrant_relationship: quadrants.quadrant_relationship || "",
            created_by: user?.id,
          });
        if (error) throw error;
      }
      await supabase.from("life_card_content_audit_logs").insert({
        card_id: cardId,
        action: "edit",
        field_changed: "quadrant_contents",
        language: langCode,
        performed_by: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-card-quadrants"] });
      toast.success(t("Quadrant content saved", "四象限內容已儲存", "四象限内容已保存"));
    },
  });

  const toggleLockMutation = useMutation({
    mutationFn: async ({ cardId, lock }: { cardId: string; lock: boolean }) => {
      const { error: cardError } = await supabase
        .from("life_cards")
        .update({
          content_locked: lock,
          locked_by: lock ? user?.id : null,
          locked_at: lock ? new Date().toISOString() : null,
        })
        .eq("id", cardId);
      if (cardError) throw cardError;

      if (lock) {
        const { error: quadrantError } = await supabase
          .from("life_card_quadrant_contents")
          .update({ is_locked: true, locked_by: user?.id, locked_at: new Date().toISOString() })
          .eq("card_id", cardId);
        if (quadrantError) throw quadrantError;
      } else {
        const { error: quadrantError } = await supabase
          .from("life_card_quadrant_contents")
          .update({ is_locked: false, locked_by: null, locked_at: null })
          .eq("card_id", cardId);
        if (quadrantError) throw quadrantError;
      }

      await supabase.from("life_card_content_audit_logs").insert({
        card_id: cardId,
        action: lock ? "lock" : "unlock",
        performed_by: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-cards-generator"] });
      queryClient.invalidateQueries({ queryKey: ["life-card-quadrants"] });
    },
  });

  const batchLockMutation = useMutation({
    mutationFn: async ({ lock }: { lock: boolean }) => {
      // Update all life_cards
      const { error: cardsError } = await supabase
        .from("life_cards")
        .update({
          content_locked: lock,
          locked_by: lock ? user?.id : null,
          locked_at: lock ? new Date().toISOString() : null,
        })
        .not("id", "is", null);
      if (cardsError) throw cardsError;

      // Update all quadrant contents
      const { error: quadrantsError } = await supabase
        .from("life_card_quadrant_contents")
        .update({
          is_locked: lock,
          locked_by: lock ? user?.id : null,
          locked_at: lock ? new Date().toISOString() : null,
        })
        .not("id", "is", null);
      if (quadrantsError) throw quadrantsError;
    },
    onSuccess: (_, { lock }) => {
      queryClient.invalidateQueries({ queryKey: ["life-cards-generator"] });
      queryClient.invalidateQueries({ queryKey: ["life-card-quadrants"] });
      toast.success(
        lock
          ? t("All cards locked", "全部卡片已鎖定", "全部卡片已锁定")
          : t("All cards unlocked", "全部卡片已解鎖", "全部卡片已解锁")
      );
    },
  });

  const saveSpectrumInEditMutation = useMutation({
    mutationFn: async ({ cardId, spectrumType }: { cardId: string; spectrumType: SpectrumType }) => {
      const { error } = await supabase
        .from("life_cards")
        .update({ spectrum_type: spectrumType })
        .eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-cards-generator"] });
    },
  });

  // ─── AI Translation ─────────────────────────
  const handleAITranslate = useCallback(async (cardId: string) => {
    const twContent = quadrantsByCardAndLang[cardId]?.["zh-TW"];
    if (!twContent || (!twContent.quadrant_external && !twContent.quadrant_internal && !twContent.quadrant_career && !twContent.quadrant_relationship)) {
      toast.error(t("Please fill in Traditional Chinese content first", "請先填寫繁體中文內容", "请先填写繁体中文内容"));
      return;
    }

    setIsGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("life-card-translate", {
        body: {
          quadrant_external: twContent.quadrant_external,
          quadrant_internal: twContent.quadrant_internal,
          quadrant_career: twContent.quadrant_career,
          quadrant_relationship: twContent.quadrant_relationship,
        },
      });

      if (error) throw error;

      const { simplified, english } = data;

      // Save zh-CN
      if (simplified) {
        await saveQuadrantsMutation.mutateAsync({
          cardId,
          langCode: "zh-CN",
          quadrants: {
            quadrant_external: simplified.quadrant_external || "",
            quadrant_internal: simplified.quadrant_internal || "",
            quadrant_career: simplified.quadrant_career || "",
            quadrant_relationship: simplified.quadrant_relationship || "",
          },
        });
      }

      // Save en
      if (english) {
        await saveQuadrantsMutation.mutateAsync({
          cardId,
          langCode: "en",
          quadrants: {
            quadrant_external: english.quadrant_external || "",
            quadrant_internal: english.quadrant_internal || "",
            quadrant_career: english.quadrant_career || "",
            quadrant_relationship: english.quadrant_relationship || "",
          },
        });
      }

      await supabase.from("life_card_content_audit_logs").insert({
        card_id: cardId,
        action: "ai_generate",
        field_changed: "zh-CN,en",
        performed_by: user?.id,
      });

      // Update drafts if editing
      if (simplified) {
        setQuadrantDrafts((prev) => ({ ...prev, "zh-CN": {
          quadrant_external: simplified.quadrant_external || "",
          quadrant_internal: simplified.quadrant_internal || "",
          quadrant_career: simplified.quadrant_career || "",
          quadrant_relationship: simplified.quadrant_relationship || "",
        }}));
      }
      if (english) {
        setQuadrantDrafts((prev) => ({ ...prev, en: {
          quadrant_external: english.quadrant_external || "",
          quadrant_internal: english.quadrant_internal || "",
          quadrant_career: english.quadrant_career || "",
          quadrant_relationship: english.quadrant_relationship || "",
        }}));
      }

      toast.success(t("AI translation completed", "AI 翻譯已完成", "AI 翻译已完成"));
    } catch (translationError) {
      console.error("AI translation error:", translationError);
      toast.error(t("AI translation failed", "AI 翻譯失敗", "AI 翻译失败"));
    } finally {
      setIsGeneratingAI(false);
    }
  }, [quadrantsByCardAndLang, saveQuadrantsMutation, t, user?.id]);

  // ─── Batch Initialize ─────────────────────────
  const handleBatchInitialize = useCallback(async () => {
    setIsBatchInitializing(true);
    setBatchInitProgress(0);

    const totalCards = allCards.length;
    let processedCount = 0;
    let updatedSpectrumCount = 0;
    let insertedQuadrantCount = 0;
    let skippedLockedCount = 0;

    for (const card of allCards) {
      const initEntry = LIFE_CARD_INIT_DATA[card.name_zh_tw];
      if (!initEntry) {
        processedCount++;
        setBatchInitProgress(Math.round((processedCount / totalCards) * 100));
        continue;
      }

      // Skip locked cards
      if (card.content_locked) {
        skippedLockedCount++;
        processedCount++;
        setBatchInitProgress(Math.round((processedCount / totalCards) * 100));
        continue;
      }

      // Update spectrum_type if different
      if (card.spectrum_type !== initEntry.spectrum) {
        const { error: spectrumError } = await supabase
          .from("life_cards")
          .update({ spectrum_type: initEntry.spectrum })
          .eq("id", card.id);
        if (!spectrumError) updatedSpectrumCount++;
      }

      // Upsert zh-TW quadrant content
      const existingTw = quadrantsByCardAndLang[card.id]?.["zh-TW"];
      if (existingTw) {
        await supabase
          .from("life_card_quadrant_contents")
          .update({
            quadrant_external: initEntry.quadrant_external,
            quadrant_internal: initEntry.quadrant_internal,
            quadrant_career: initEntry.quadrant_career,
            quadrant_relationship: initEntry.quadrant_relationship,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingTw.id);
      } else {
        await supabase
          .from("life_card_quadrant_contents")
          .insert({
            card_id: card.id,
            language: "zh-TW",
            quadrant_external: initEntry.quadrant_external,
            quadrant_internal: initEntry.quadrant_internal,
            quadrant_career: initEntry.quadrant_career,
            quadrant_relationship: initEntry.quadrant_relationship,
            created_by: user?.id,
          });
      }
      insertedQuadrantCount++;

      processedCount++;
      setBatchInitProgress(Math.round((processedCount / totalCards) * 100));
    }

    // Log audit
    await supabase.from("life_card_content_audit_logs").insert({
      card_id: allCards[0]?.id,
      action: "batch_init",
      field_changed: `spectrum:${updatedSpectrumCount},quadrants:${insertedQuadrantCount},skipped:${skippedLockedCount}`,
      performed_by: user?.id,
    });

    queryClient.invalidateQueries({ queryKey: ["life-cards-generator"] });
    queryClient.invalidateQueries({ queryKey: ["life-card-quadrants"] });

    toast.success(
      t(
        `Initialized ${insertedQuadrantCount} cards (${updatedSpectrumCount} spectrum updated, ${skippedLockedCount} locked skipped)`,
        `已初始化 ${insertedQuadrantCount} 張卡片（${updatedSpectrumCount} 張光譜更新、${skippedLockedCount} 張已鎖定跳過）`,
        `已初始化 ${insertedQuadrantCount} 张卡片（${updatedSpectrumCount} 张光谱更新、${skippedLockedCount} 张已锁定跳过）`
      )
    );

    setIsBatchInitializing(false);
  }, [allCards, quadrantsByCardAndLang, user?.id, queryClient, t]);

  // ─── Batch AI Translate ───────────────────────
  const handleBatchAITranslate = useCallback(async () => {
    // Find cards that have zh-TW content but missing zh-CN or en
    const cardsToTranslate = allCards.filter((card) => {
      if (card.content_locked) return false;
      const cardQuadrants = quadrantsByCardAndLang[card.id];
      if (!cardQuadrants) return false;
      const twContent = cardQuadrants["zh-TW"];
      if (!twContent) return false;
      const hasTwContent = !!(twContent.quadrant_external || twContent.quadrant_internal || twContent.quadrant_career || twContent.quadrant_relationship);
      if (!hasTwContent) return false;

      const cnContent = cardQuadrants["zh-CN"];
      const enContent = cardQuadrants["en"];
      const hasCn = cnContent && !!(cnContent.quadrant_external || cnContent.quadrant_internal || cnContent.quadrant_career || cnContent.quadrant_relationship);
      const hasEn = enContent && !!(enContent.quadrant_external || enContent.quadrant_internal || enContent.quadrant_career || enContent.quadrant_relationship);

      return !hasCn || !hasEn;
    });

    if (cardsToTranslate.length === 0) {
      toast.info(t("All cards already have translations", "所有卡片已有翻譯", "所有卡片已有翻译"));
      return;
    }

    setIsBatchTranslating(true);
    setBatchTranslateTotal(cardsToTranslate.length);
    setBatchTranslateCurrent(0);
    setBatchTranslateProgress(0);

    let successCount = 0;
    let failCount = 0;

    for (let cardIndex = 0; cardIndex < cardsToTranslate.length; cardIndex++) {
      const card = cardsToTranslate[cardIndex];
      const twContent = quadrantsByCardAndLang[card.id]["zh-TW"];

      setBatchTranslateCurrent(cardIndex + 1);
      setBatchTranslateProgress(Math.round(((cardIndex + 1) / cardsToTranslate.length) * 100));

      try {
        const { data, error } = await supabase.functions.invoke("life-card-translate", {
          body: {
            quadrant_external: twContent.quadrant_external,
            quadrant_internal: twContent.quadrant_internal,
            quadrant_career: twContent.quadrant_career,
            quadrant_relationship: twContent.quadrant_relationship,
          },
        });

        if (error) throw error;

        const { simplified, english } = data;

        // Save zh-CN
        if (simplified) {
          const existingCn = quadrantsByCardAndLang[card.id]?.["zh-CN"];
          if (existingCn) {
            await supabase.from("life_card_quadrant_contents")
              .update({
                quadrant_external: simplified.quadrant_external || "",
                quadrant_internal: simplified.quadrant_internal || "",
                quadrant_career: simplified.quadrant_career || "",
                quadrant_relationship: simplified.quadrant_relationship || "",
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingCn.id);
          } else {
            await supabase.from("life_card_quadrant_contents")
              .insert({
                card_id: card.id,
                language: "zh-CN",
                quadrant_external: simplified.quadrant_external || "",
                quadrant_internal: simplified.quadrant_internal || "",
                quadrant_career: simplified.quadrant_career || "",
                quadrant_relationship: simplified.quadrant_relationship || "",
                created_by: user?.id,
              });
          }
        }

        // Save en
        if (english) {
          const existingEn = quadrantsByCardAndLang[card.id]?.["en"];
          if (existingEn) {
            await supabase.from("life_card_quadrant_contents")
              .update({
                quadrant_external: english.quadrant_external || "",
                quadrant_internal: english.quadrant_internal || "",
                quadrant_career: english.quadrant_career || "",
                quadrant_relationship: english.quadrant_relationship || "",
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingEn.id);
          } else {
            await supabase.from("life_card_quadrant_contents")
              .insert({
                card_id: card.id,
                language: "en",
                quadrant_external: english.quadrant_external || "",
                quadrant_internal: english.quadrant_internal || "",
                quadrant_career: english.quadrant_career || "",
                quadrant_relationship: english.quadrant_relationship || "",
                created_by: user?.id,
              });
          }
        }

        successCount++;
      } catch {
        failCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ["life-card-quadrants"] });

    toast.success(
      t(
        `AI translation complete: ${successCount} succeeded, ${failCount} failed`,
        `AI 翻譯完成：${successCount} 張成功、${failCount} 張失敗`,
        `AI 翻译完成：${successCount} 张成功、${failCount} 张失败`
      )
    );

    setIsBatchTranslating(false);
  }, [allCards, quadrantsByCardAndLang, user?.id, queryClient, t]);

  // ─── Edit Modal Handlers ────────────────────
  const openEditModal = useCallback((card: LifeCardRow) => {
    setEditingCard(card);
    setSpectrumDraft(card.spectrum_type);
    setEditLangTab("zh-TW");

    const drafts: Record<string, Record<string, string>> = {};
    for (const lang of LANG_TABS) {
      const existing = quadrantsByCardAndLang[card.id]?.[lang.code];
      drafts[lang.code] = {
        quadrant_external: existing?.quadrant_external || "",
        quadrant_internal: existing?.quadrant_internal || "",
        quadrant_career: existing?.quadrant_career || "",
        quadrant_relationship: existing?.quadrant_relationship || "",
      };
    }
    setQuadrantDrafts(drafts);
  }, [quadrantsByCardAndLang]);

  const handleSaveCurrentLang = useCallback(async () => {
    if (!editingCard) return;
    const currentDraft = quadrantDrafts[editLangTab];
    if (!currentDraft) return;

    await saveQuadrantsMutation.mutateAsync({
      cardId: editingCard.id,
      langCode: editLangTab,
      quadrants: currentDraft,
    });

    if (spectrumDraft !== editingCard.spectrum_type) {
      await saveSpectrumInEditMutation.mutateAsync({
        cardId: editingCard.id,
        spectrumType: spectrumDraft,
      });
    }
  }, [editingCard, quadrantDrafts, editLangTab, spectrumDraft, saveQuadrantsMutation, saveSpectrumInEditMutation]);

  const handleSaveAllLangs = useCallback(async () => {
    if (!editingCard) return;
    for (const lang of LANG_TABS) {
      const draft = quadrantDrafts[lang.code];
      if (!draft) continue;
      const hasContent = draft.quadrant_external || draft.quadrant_internal || draft.quadrant_career || draft.quadrant_relationship;
      if (!hasContent) continue;
      await saveQuadrantsMutation.mutateAsync({
        cardId: editingCard.id,
        langCode: lang.code,
        quadrants: draft,
      });
    }
    if (spectrumDraft !== editingCard.spectrum_type) {
      await saveSpectrumInEditMutation.mutateAsync({
        cardId: editingCard.id,
        spectrumType: spectrumDraft,
      });
    }
    toast.success(t("All languages saved", "所有語言版本已儲存", "所有语言版本已保存"));
  }, [editingCard, quadrantDrafts, spectrumDraft, saveQuadrantsMutation, saveSpectrumInEditMutation, t]);

  const getQuadrantStatus = useCallback((cardId: string) => {
    const cardQuadrants = quadrantsByCardAndLang[cardId];
    if (!cardQuadrants) return { tw: false, cn: false, en: false };

    const hasContent = (langQuadrant: QuadrantContent | undefined) => {
      if (!langQuadrant) return false;
      return !!(langQuadrant.quadrant_external || langQuadrant.quadrant_internal || langQuadrant.quadrant_career || langQuadrant.quadrant_relationship);
    };

    return {
      tw: hasContent(cardQuadrants["zh-TW"]),
      cn: hasContent(cardQuadrants["zh-CN"]),
      en: hasContent(cardQuadrants["en"]),
    };
  }, [quadrantsByCardAndLang]);

  // ─── Render ─────────────────────────────────

  if (cardsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: PRIMARY }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>
          {t("Espresso Card Report Generator", "理想人生報告生成器", "理想人生报告生成器")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t(
            "Manage 70 Espresso Cards, four-quadrant content, spectrum classification, and content locking for formal report generation",
            "管理 70 張理想人生卡、四象限內容、光譜分類與內容鎖定，用於正式報告生成",
            "管理 70 张理想人生卡、四象限内容、光谱分类与内容锁定，用于正式报告生成"
          )}
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard label={t("Total Cards", "卡片總數", "卡片总数")} value={stats.total} color={PRIMARY} />
        <StatCard
          label={t("Career-Oriented", "職業導向", "职业导向")}
          value={stats.careerCount}
          color={SPECTRUM_CONFIG.career.color}
        />
        <StatCard
          label={t("Neutral Value", "中性價值", "中性价值")}
          value={stats.neutralCount}
          color={SPECTRUM_CONFIG.neutral.color}
        />
        <StatCard
          label={t("Lifestyle-Oriented", "生活導向", "生活导向")}
          value={stats.lifestyleCount}
          color={SPECTRUM_CONFIG.lifestyle.color}
        />
        <StatCard
          label={t("Content Locked", "已鎖定", "已锁定")}
          value={stats.lockedCount}
          color="#059669"
        />
        <StatCard
          label={t("Has Quadrant Content", "有四象限", "有四象限")}
          value={stats.withQuadrantsCount}
          color="#7C3AED"
        />
      </div>

      {/* Spectrum Distribution Bar */}
      <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E9ECEF" }}>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {t("Spectrum Distribution", "光譜分佈", "光谱分布")}
        </p>
        <div className="flex h-6 rounded-full overflow-hidden">
          {stats.total > 0 && (
            <>
              <div
                className="flex items-center justify-center text-white text-xs font-medium transition-all"
                style={{
                  width: `${(stats.careerCount / stats.total) * 100}%`,
                  backgroundColor: SPECTRUM_CONFIG.career.color,
                }}
              >
                {stats.careerCount > 0 && stats.careerCount}
              </div>
              <div
                className="flex items-center justify-center text-xs font-medium transition-all"
                style={{
                  width: `${(stats.neutralCount / stats.total) * 100}%`,
                  backgroundColor: GOLD,
                  color: "#5C4B13",
                }}
              >
                {stats.neutralCount > 0 && stats.neutralCount}
              </div>
              <div
                className="flex items-center justify-center text-white text-xs font-medium transition-all"
                style={{
                  width: `${(stats.lifestyleCount / stats.total) * 100}%`,
                  backgroundColor: SPECTRUM_CONFIG.lifestyle.color,
                }}
              >
                {stats.lifestyleCount > 0 && stats.lifestyleCount}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: SPECTRUM_CONFIG.career.color }}>
            <Briefcase className="w-3 h-3" /> {SPECTRUM_CONFIG.career.label[language]}
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: SPECTRUM_CONFIG.neutral.color }}>
            <Scale className="w-3 h-3" /> {SPECTRUM_CONFIG.neutral.label[language]}
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: SPECTRUM_CONFIG.lifestyle.color }}>
            <TreePine className="w-3 h-3" /> {SPECTRUM_CONFIG.lifestyle.label[language]}
          </div>
        </div>
      </div>

      {/* Batch Actions Bar */}
      {(isBatchInitializing || isBatchTranslating) && (
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E9ECEF" }}>
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: PRIMARY }} />
            <span className="text-sm font-medium" style={{ color: PRIMARY }}>
              {isBatchInitializing
                ? t("Initializing...", "初始化中...", "初始化中...")
                : t(
                    `Translating ${batchTranslateCurrent}/${batchTranslateTotal}...`,
                    `翻譯中 ${batchTranslateCurrent}/${batchTranslateTotal}...`,
                    `翻译中 ${batchTranslateCurrent}/${batchTranslateTotal}...`
                  )}
            </span>
          </div>
          <Progress
            value={isBatchInitializing ? batchInitProgress : batchTranslateProgress}
            className="h-2"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isBatchInitializing || isBatchTranslating}
              className="gap-1.5"
              style={{ borderColor: PRIMARY, color: PRIMARY }}
            >
              <Database className="w-3.5 h-3.5" />
              {t("Batch Initialize (zh-TW)", "批量初始化（繁中）", "批量初始化（繁中）")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("Batch Initialize Confirmation", "批量初始化確認", "批量初始化确认")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  "This will update spectrum types and fill zh-TW quadrant content for all 70 cards. Locked cards will be skipped. Existing zh-TW content will be overwritten.",
                  "將為全部 70 張卡片更新光譜歸屬並填入繁體中文四象限內容。已鎖定的卡片將被跳過。已有的繁中內容會被覆蓋。",
                  "将为全部 70 张卡片更新光谱归属并填入繁体中文四象限内容。已锁定的卡片将被跳过。已有的繁中内容会被覆盖。"
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Cancel", "取消", "取消")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBatchInitialize}
                style={{ backgroundColor: PRIMARY }}
              >
                {t("Confirm Initialize", "確認初始化", "确认初始化")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isBatchInitializing || isBatchTranslating}
              className="gap-1.5"
              style={{ borderColor: GOLD, color: "#8B6914" }}
            >
              <Wand2 className="w-3.5 h-3.5" />
              {t("Batch AI Translate (→SC/EN)", "批量 AI 翻譯（→簡/英）", "批量 AI 翻译（→简/英）")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("Batch AI Translation Confirmation", "批量 AI 翻譯確認", "批量 AI 翻译确认")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  "This will use AI to generate Simplified Chinese and English translations for all cards that have zh-TW content but are missing translations. Locked cards will be skipped. This may take a few minutes.",
                  "將使用 AI 為所有已有繁中內容但缺少簡中/英文翻譯的卡片生成翻譯。已鎖定的卡片將被跳過。此操作可能需要數分鐘。",
                  "将使用 AI 为所有已有繁中内容但缺少简中/英文翻译的卡片生成翻译。已锁定的卡片将被跳过。此操作可能需要数分钟。"
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Cancel", "取消", "取消")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBatchAITranslate}
                style={{ backgroundColor: "#8B6914" }}
              >
                {t("Confirm Translate", "確認翻譯", "确认翻译")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="h-5 w-px bg-border" />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isBatchInitializing || isBatchTranslating || batchLockMutation.isPending}
              className="gap-1.5"
              style={{ borderColor: "#059669", color: "#059669" }}
            >
              <Lock className="w-3.5 h-3.5" />
              {t("Lock All", "全部鎖定", "全部锁定")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("Lock All Cards Confirmation", "全部鎖定確認", "全部锁定确认")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  "This will lock all 70 cards and their quadrant content. Locked content cannot be edited until unlocked.",
                  "將鎖定全部 70 張卡片及其四象限內容。鎖定後內容無法編輯，須解鎖後才能修改。",
                  "将锁定全部 70 张卡片及其四象限内容。锁定后内容无法编辑，须解锁后才能修改。"
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Cancel", "取消", "取消")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => batchLockMutation.mutate({ lock: true })}
                style={{ backgroundColor: "#059669" }}
              >
                {t("Confirm Lock All", "確認全部鎖定", "确认全部锁定")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isBatchInitializing || isBatchTranslating || batchLockMutation.isPending}
              className="gap-1.5"
              style={{ borderColor: "#DC2626", color: "#DC2626" }}
            >
              <Unlock className="w-3.5 h-3.5" />
              {t("Unlock All", "全部解鎖", "全部解锁")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("Unlock All Cards Confirmation", "全部解鎖確認", "全部解锁确认")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  "This will unlock all 70 cards and their quadrant content, making them editable again.",
                  "將解鎖全部 70 張卡片及其四象限內容，使其可以再次編輯。",
                  "将解锁全部 70 张卡片及其四象限内容，使其可以再次编辑。"
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Cancel", "取消", "取消")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => batchLockMutation.mutate({ lock: false })}
                style={{ backgroundColor: "#DC2626" }}
              >
                {t("Confirm Unlock All", "確認全部解鎖", "确认全部解锁")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(inputEvent) => { setSearchQuery(inputEvent.target.value); setCurrentPage(1); }}
            placeholder={t("Search card name...", "搜尋卡片名稱...", "搜索卡片名称...")}
            className="pl-9"
          />
        </div>
        <Select value={spectrumFilter} onValueChange={(selectedValue) => { setSpectrumFilter(selectedValue); setCurrentPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Spectrum", "全部光譜", "全部光谱")}</SelectItem>
            <SelectItem value="career">{SPECTRUM_CONFIG.career.label[language]}</SelectItem>
            <SelectItem value="neutral">{SPECTRUM_CONFIG.neutral.label[language]}</SelectItem>
            <SelectItem value="lifestyle">{SPECTRUM_CONFIG.lifestyle.label[language]}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={lockFilter} onValueChange={(lockValue) => { setLockFilter(lockValue); setCurrentPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <Lock className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Status", "全部狀態", "全部状态")}</SelectItem>
            <SelectItem value="locked">{t("Locked", "已鎖定", "已锁定")}</SelectItem>
            <SelectItem value="unlocked">{t("Unlocked", "未鎖定", "未锁定")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {filteredCards.length} {t("cards", "張", "张")}
        </div>
      </div>

      {/* Card Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E9ECEF" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#E9ECEF", backgroundColor: "#F8F9FC" }}>
                <th className="text-left py-3 px-4 font-medium" style={{ color: PRIMARY }}>
                  {t("No.", "序號", "序号")}
                </th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: PRIMARY }}>
                  {t("Card Name", "卡片名稱", "卡片名称")}
                </th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: PRIMARY }}>
                  {t("Category", "分類", "分类")}
                </th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: PRIMARY }}>
                  {t("Spectrum", "光譜歸屬", "光谱归属")}
                </th>
                <th className="text-center py-3 px-4 font-medium" style={{ color: PRIMARY }}>
                  {t("Content", "內容狀態", "内容状态")}
                </th>
                <th className="text-center py-3 px-4 font-medium" style={{ color: PRIMARY }}>
                  {t("Lock", "鎖定", "锁定")}
                </th>
                <th className="text-center py-3 px-4 font-medium" style={{ color: PRIMARY }}>
                  {t("Actions", "操作", "操作")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCards.map((card) => {
                const quadrantStatus = getQuadrantStatus(card.id);
                const spectrumCfg = SPECTRUM_CONFIG[card.spectrum_type];
                return (
                  <tr key={card.id} className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors" style={{ borderColor: "#F0F0F0" }}>
                    <td className="py-3 px-4 text-muted-foreground">{card.sort_order}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium" style={{ color: PRIMARY }}>{card.name_zh_tw}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{card.name_en}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[card.category]?.[language] || card.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Select
                        value={card.spectrum_type}
                        onValueChange={(newSpectrumType) => updateSpectrumMutation.mutate({ cardId: card.id, spectrumType: newSpectrumType as SpectrumType })}
                        disabled={card.content_locked}
                      >
                        <SelectTrigger
                          className="h-7 text-xs w-[130px] border"
                          style={{ borderColor: spectrumCfg.borderColor, backgroundColor: spectrumCfg.bgColor, color: spectrumCfg.color }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(SPECTRUM_CONFIG) as SpectrumType[]).map((specKey) => (
                            <SelectItem key={specKey} value={specKey}>
                              <span className="flex items-center gap-1.5">
                                {SPECTRUM_CONFIG[specKey].icon}
                                {SPECTRUM_CONFIG[specKey].label[language]}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <LangDot filled={quadrantStatus.tw} label="繁" />
                        <LangDot filled={quadrantStatus.cn} label="简" />
                        <LangDot filled={quadrantStatus.en} label="EN" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleLockMutation.mutate({ cardId: card.id, lock: !card.content_locked })}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: card.content_locked ? "#ECFDF5" : "#FEF2F2",
                          color: card.content_locked ? "#059669" : "#DC2626",
                        }}
                      >
                        {card.content_locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {card.content_locked ? t("Locked", "已鎖定", "已锁定") : t("Unlocked", "未鎖定", "未锁定")}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openEditModal(card)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: PRIMARY }}
                      >
                        <Edit3 className="w-3 h-3" />
                        {t("Edit", "編輯", "编辑")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#E9ECEF" }}>
            <span className="text-xs text-muted-foreground">
              {t(
                `Page ${currentPage} of ${totalPages}`,
                `第 ${currentPage} / ${totalPages} 頁`,
                `第 ${currentPage} / ${totalPages} 页`
              )}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((previousPage) => Math.max(1, previousPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((previousPage) => Math.min(totalPages, previousPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingCard} onOpenChange={(isOpen) => { if (!isOpen) setEditingCard(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {editingCard && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3" style={{ color: PRIMARY }}>
                  <span className="text-lg font-bold">{editingCard.name_zh_tw}</span>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: SPECTRUM_CONFIG[editingCard.spectrum_type]?.borderColor,
                      backgroundColor: SPECTRUM_CONFIG[editingCard.spectrum_type]?.bgColor,
                      color: SPECTRUM_CONFIG[editingCard.spectrum_type]?.color,
                    }}
                  >
                    {SPECTRUM_CONFIG[editingCard.spectrum_type]?.icon}
                    <span className="ml-1">{SPECTRUM_CONFIG[editingCard.spectrum_type]?.label[language]}</span>
                  </Badge>
                  {editingCard.content_locked && (
                    <Badge className="text-xs" style={{ backgroundColor: "#ECFDF5", color: "#059669" }}>
                      <Lock className="w-3 h-3 mr-1" />
                      {t("Locked", "已鎖定", "已锁定")}
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              {/* Spectrum Selector */}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm font-medium" style={{ color: PRIMARY }}>
                  {t("Spectrum Type", "光譜歸屬", "光谱归属")}
                </span>
                <div className="flex gap-2">
                  {(Object.keys(SPECTRUM_CONFIG) as SpectrumType[]).map((specKey) => {
                    const specConfig = SPECTRUM_CONFIG[specKey];
                    const isSelected = spectrumDraft === specKey;
                    return (
                      <button
                        key={specKey}
                        onClick={() => setSpectrumDraft(specKey)}
                        disabled={editingCard.content_locked}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          editingCard.content_locked && "opacity-50 cursor-not-allowed"
                        )}
                        style={{
                          borderColor: isSelected ? specConfig.color : "#E9ECEF",
                          backgroundColor: isSelected ? specConfig.bgColor : "white",
                          color: specConfig.color,
                          borderWidth: isSelected ? 2 : 1,
                        }}
                      >
                        {specConfig.icon}
                        {specConfig.label[language]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Name Reference */}
              <div className="bg-gray-50 rounded-lg p-3 mt-2">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">{t("Traditional Chinese", "繁中", "繁中")}</span>
                    <p className="font-medium mt-0.5">{editingCard.name_zh_tw}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("Simplified Chinese", "簡中", "简中")}</span>
                    <p className="font-medium mt-0.5">{editingCard.name_zh_cn}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">English</span>
                    <p className="font-medium mt-0.5">{editingCard.name_en}</p>
                  </div>
                </div>
              </div>

              {/* Language Tabs with Quadrant Editor */}
              <Tabs value={editLangTab} onValueChange={setEditLangTab} className="mt-3">
                <div className="flex items-center justify-between">
                  <TabsList>
                    {LANG_TABS.map((langTab) => (
                      <TabsTrigger key={langTab.code} value={langTab.code} className="text-xs">
                        {langTab.label[language]}
                        {langTab.code === "zh-TW" && (
                          <ShieldCheck className="w-3 h-3 ml-1 text-amber-500" />
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* AI Translate Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAITranslate(editingCard.id)}
                    disabled={isGeneratingAI || editingCard.content_locked}
                    className="text-xs gap-1.5"
                    style={{ borderColor: GOLD, color: "#8B6914" }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isGeneratingAI
                      ? t("Generating...", "生成中...", "生成中...")
                      : t("AI Translate (TC→SC/EN)", "AI 翻譯（繁→簡/英）", "AI 翻译（繁→简/英）")}
                  </Button>
                </div>

                {LANG_TABS.map((langTab) => (
                  <TabsContent key={langTab.code} value={langTab.code} className="mt-3">
                    <div className="space-y-4">
                      {QUADRANT_KEYS.map((quadrantKey) => (
                        <div key={quadrantKey}>
                          <label className="text-sm font-medium flex items-center gap-2" style={{ color: PRIMARY }}>
                            <QuadrantIcon quadrantKey={quadrantKey} />
                            {QUADRANT_LABELS[quadrantKey][language]}
                          </label>
                          <Textarea
                            value={quadrantDrafts[langTab.code]?.[quadrantKey] || ""}
                            onChange={(textareaEvent) => {
                              setQuadrantDrafts((previousDrafts) => ({
                                ...previousDrafts,
                                [langTab.code]: {
                                  ...previousDrafts[langTab.code],
                                  [quadrantKey]: textareaEvent.target.value,
                                },
                              }));
                            }}
                            disabled={editingCard.content_locked}
                            placeholder={t(
                              `Enter ${QUADRANT_LABELS[quadrantKey].en} content...`,
                              `請輸入「${QUADRANT_LABELS[quadrantKey]["zh-TW"]}」內容...`,
                              `请输入「${QUADRANT_LABELS[quadrantKey]["zh-CN"]}」内容...`
                            )}
                            className="mt-1.5 min-h-[80px] text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#E9ECEF" }}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLockMutation.mutate({ cardId: editingCard.id, lock: !editingCard.content_locked })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={{
                      borderColor: editingCard.content_locked ? "#A3D9B1" : "#FCA5A5",
                      backgroundColor: editingCard.content_locked ? "#ECFDF5" : "#FEF2F2",
                      color: editingCard.content_locked ? "#059669" : "#DC2626",
                    }}
                  >
                    {editingCard.content_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {editingCard.content_locked
                      ? t("Unlock Content", "解鎖內容", "解锁内容")
                      : t("Lock Content", "鎖定內容", "锁定内容")}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingCard(null)}>
                    <X className="w-3.5 h-3.5 mr-1" />
                    {t("Close", "關閉", "关闭")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveCurrentLang}
                    disabled={editingCard.content_locked || saveQuadrantsMutation.isPending}
                    style={{ backgroundColor: PRIMARY }}
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {t("Save Current Language", "儲存當前語言", "保存当前语言")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAllLangs}
                    disabled={editingCard.content_locked || saveQuadrantsMutation.isPending}
                    style={{ backgroundColor: "#059669" }}
                  >
                    <Languages className="w-3.5 h-3.5 mr-1" />
                    {t("Save All Languages", "儲存全部語言", "保存全部语言")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border p-3" style={{ borderColor: "#E9ECEF" }}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}

function LangDot({ filled, label }: { filled: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-medium"
      style={{
        backgroundColor: filled ? "#ECFDF5" : "#F3F4F6",
        color: filled ? "#059669" : "#9CA3AF",
      }}
      title={filled ? `${label} ✓` : `${label} ✗`}
    >
      {filled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
    </span>
  );
}

function QuadrantIcon({ quadrantKey }: { quadrantKey: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    quadrant_external: <Eye className="w-3.5 h-3.5" style={{ color: "#2563EB" }} />,
    quadrant_internal: <Sparkles className="w-3.5 h-3.5" style={{ color: "#7C3AED" }} />,
    quadrant_career: <Briefcase className="w-3.5 h-3.5" style={{ color: "#1C2857" }} />,
    quadrant_relationship: <TreePine className="w-3.5 h-3.5" style={{ color: "#059669" }} />,
  };
  return <>{iconMap[quadrantKey] || null}</>;
}
