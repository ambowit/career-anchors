import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2, Save, RotateCcw, GraduationCap, Briefcase, Award, Crown, Rocket } from "lucide-react";
import { CAREER_STAGE_DEFAULTS, type StageDefault } from "@/data/careerStageDefaults";

const TXT = {
  en: {
    sectionTitle: "Career Stage Descriptions",
    sectionDesc: "Define the descriptive text for each career stage. These descriptions are used in reports to contextualize assessment results for the reader's career phase.",
    saving: "Saving...",
    saved: "Saved",
    saveError: "Save failed",
    reset: "Reset to default",
    resetConfirm: "Reset this stage to default text? Current edits will be lost.",
    resetDone: "Reset to default",
    langTab: { "zh-TW": "繁體中文", "zh-CN": "简体中文", en: "English" },
    titleLabel: "Stage Title",
    descLabel: "Stage Description",
    lastUpdated: "Last updated",
    noChanges: "No changes to save",
    saveBtn: "Save",
  },
  "zh-TW": {
    sectionTitle: "職場階段描述",
    sectionDesc: "定義每個職場階段的描述文字。這些描述用於報告中，為讀者的職涯階段提供測評結果的背景說明。",
    saving: "儲存中...",
    saved: "已儲存",
    saveError: "儲存失敗",
    reset: "重置為預設",
    resetConfirm: "確定要重置此階段為預設文字嗎？當前修改將會丟失。",
    resetDone: "已重置為預設",
    langTab: { "zh-TW": "繁體中文", "zh-CN": "简体中文", en: "English" },
    titleLabel: "階段標題",
    descLabel: "階段描述",
    lastUpdated: "最後更新",
    noChanges: "沒有需要儲存的修改",
    saveBtn: "儲存",
  },
  "zh-CN": {
    sectionTitle: "职场阶段描述",
    sectionDesc: "定义每个职场阶段的描述文字。这些描述用于报告中，为读者的职涯阶段提供测评结果的背景说明。",
    saving: "保存中...",
    saved: "已保存",
    saveError: "保存失败",
    reset: "重置为默认",
    resetConfirm: "确定要重置此阶段为默认文字吗？当前修改将会丢失。",
    resetDone: "已重置为默认",
    langTab: { "zh-TW": "繁體中文", "zh-CN": "简体中文", en: "English" },
    titleLabel: "阶段标题",
    descLabel: "阶段描述",
    lastUpdated: "最后更新",
    noChanges: "没有需要保存的修改",
    saveBtn: "保存",
  },
};

interface StageRow {
  id: string;
  stage_key: string;
  title_zh_tw: string;
  title_zh_cn: string;
  title_en: string;
  description_zh_tw: string;
  description_zh_cn: string;
  description_en: string;
  updated_at: string;
}

const STAGE_ORDER = ["entry", "mid", "senior", "executive", "entrepreneur"];

const STAGE_ICONS: Record<string, typeof GraduationCap> = {
  entry: GraduationCap,
  mid: Briefcase,
  senior: Award,
  executive: Crown,
  entrepreneur: Rocket,
};

const STAGE_COLORS: Record<string, { bg: string; icon: string; border: string }> = {
  entry: { bg: "bg-sky-50", icon: "text-sky-600", border: "border-sky-200" },
  mid: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-200" },
  senior: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200" },
  executive: { bg: "bg-violet-50", icon: "text-violet-600", border: "border-violet-200" },
  entrepreneur: { bg: "bg-rose-50", icon: "text-rose-600", border: "border-rose-200" },
};

type EditLang = "zh-TW" | "zh-CN" | "en";

export default function CareerStageDescriptionsTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const txt = TXT[language] || TXT["zh-TW"];

  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editLang, setEditLang] = useState<EditLang>(language === "en" ? "en" : language === "zh-CN" ? "zh-CN" : "zh-TW");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [resetStageKey, setResetStageKey] = useState<string | null>(null);

  // Fetch existing rows
  const { data: stageRows = [], isLoading, refetch } = useQuery({
    queryKey: ["career-stage-descriptions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("career_stage_descriptions")
        .select("*")
        .order("stage_key");
      if (error) throw error;
      return (data || []) as StageRow[];
    },
  });

  // Auto-seed defaults if table is empty
  const seedMutation = useMutation({
    mutationFn: async () => {
      const rows = CAREER_STAGE_DEFAULTS.map((defaultRow) => ({
        stage_key: defaultRow.stage_key,
        title_zh_tw: defaultRow.title_zh_tw,
        title_zh_cn: defaultRow.title_zh_cn,
        title_en: defaultRow.title_en,
        description_zh_tw: defaultRow.description_zh_tw,
        description_zh_cn: defaultRow.description_zh_cn,
        description_en: defaultRow.description_en,
        updated_by: user?.id || null,
      }));
      const { error } = await (supabase as any).from("career_stage_descriptions").upsert(rows, { onConflict: "stage_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-stage-descriptions"] });
    },
  });

  useEffect(() => {
    if (!isLoading && !seedMutation.isPending) {
      const existingKeys = new Set(stageRows.map((r) => r.stage_key));
      const hasMissing = CAREER_STAGE_DEFAULTS.some((d) => !existingKeys.has(d.stage_key));
      if (hasMissing) {
        seedMutation.mutate();
      }
    }
  }, [isLoading, stageRows.length]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ stageKey, titleField, descField, titleValue, descValue }: {
      stageKey: string; titleField: string; descField: string; titleValue: string; descValue: string;
    }) => {
      const { error } = await (supabase as any)
        .from("career_stage_descriptions")
        .update({
          [titleField]: titleValue,
          [descField]: descValue,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("stage_key", stageKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-stage-descriptions"] });
      toast.success(txt.saved);
      setEditingStage(null);
    },
    onError: (error: any) => toast.error(error.message || txt.saveError),
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: async (stageKey: string) => {
      const defaultData = CAREER_STAGE_DEFAULTS.find((defaultRow) => defaultRow.stage_key === stageKey);
      if (!defaultData) return;
      const { error } = await (supabase as any)
        .from("career_stage_descriptions")
        .update({
          title_zh_tw: defaultData.title_zh_tw,
          title_zh_cn: defaultData.title_zh_cn,
          title_en: defaultData.title_en,
          description_zh_tw: defaultData.description_zh_tw,
          description_zh_cn: defaultData.description_zh_cn,
          description_en: defaultData.description_en,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("stage_key", stageKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-stage-descriptions"] });
      toast.success(txt.resetDone);
      setResetStageKey(null);
      setEditingStage(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleStartEdit = (stageKey: string) => {
    const row = stageRows.find((stageRow) => stageRow.stage_key === stageKey);
    if (!row) return;
    setEditingStage(stageKey);
    const currentLang = editLang;
    setEditTitle(row[`title_${currentLang.replace("-", "_").toLowerCase()}` as keyof StageRow] as string || "");
    setEditDescription(row[`description_${currentLang.replace("-", "_").toLowerCase()}` as keyof StageRow] as string || "");
  };

  const handleLangSwitch = (newLang: EditLang) => {
    setEditLang(newLang);
    if (editingStage) {
      const row = stageRows.find((stageRow) => stageRow.stage_key === editingStage);
      if (!row) return;
      const langSuffix = newLang === "zh-TW" ? "zh_tw" : newLang === "zh-CN" ? "zh_cn" : "en";
      setEditTitle(row[`title_${langSuffix}` as keyof StageRow] as string || "");
      setEditDescription(row[`description_${langSuffix}` as keyof StageRow] as string || "");
    }
  };

  const handleSave = () => {
    if (!editingStage) return;
    const langSuffix = editLang === "zh-TW" ? "zh_tw" : editLang === "zh-CN" ? "zh_cn" : "en";
    saveMutation.mutate({
      stageKey: editingStage,
      titleField: `title_${langSuffix}`,
      descField: `description_${langSuffix}`,
      titleValue: editTitle,
      descValue: editDescription,
    });
  };

  const getDisplayTitle = (row: StageRow): string => {
    if (language === "en") return row.title_en || row.title_zh_tw;
    if (language === "zh-CN") return row.title_zh_cn || row.title_zh_tw;
    return row.title_zh_tw;
  };

  const getDisplayDescription = (row: StageRow): string => {
    if (language === "en") return row.description_en || row.description_zh_tw;
    if (language === "zh-CN") return row.description_zh_cn || row.description_zh_tw;
    return row.description_zh_tw;
  };

  const sortedRows = STAGE_ORDER
    .map((key) => stageRows.find((row) => row.stage_key === key))
    .filter(Boolean) as StageRow[];

  if (isLoading || seedMutation.isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl p-5 border border-slate-200">
        <h2 className="text-base font-bold text-slate-800">{txt.sectionTitle}</h2>
        <p className="text-sm text-slate-500 mt-1">{txt.sectionDesc}</p>
      </div>

      {/* Stage cards */}
      <div className="space-y-4">
        {sortedRows.map((row, index) => {
          const Icon = STAGE_ICONS[row.stage_key] || Briefcase;
          const colors = STAGE_COLORS[row.stage_key] || STAGE_COLORS.entry;
          const isEditing = editingStage === row.stage_key;

          return (
            <motion.div
              key={row.stage_key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={cn(
                "bg-white border rounded-xl overflow-hidden transition-all",
                isEditing ? `${colors.border} shadow-md` : "border-slate-200 hover:border-slate-300"
              )}
            >
              {/* Card header */}
              <div
                className={cn("flex items-center gap-4 p-5 cursor-pointer", isEditing && colors.bg)}
                onClick={() => isEditing ? setEditingStage(null) : handleStartEdit(row.stage_key)}
              >
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", colors.bg)}>
                  <Icon className={cn("w-5 h-5", colors.icon)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">{getDisplayTitle(row)}</h3>
                  {!isEditing && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                      {getDisplayDescription(row).slice(0, 120)}...
                    </p>
                  )}
                </div>
                {row.updated_at && !isEditing && (
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {txt.lastUpdated}: {new Date(row.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Edit panel */}
              {isEditing && (
                <div className="px-5 pb-5 space-y-4">
                  {/* Language tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                    {(["zh-TW", "zh-CN", "en"] as EditLang[]).map((langOption) => (
                      <button
                        key={langOption}
                        onClick={() => handleLangSwitch(langOption)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                          editLang === langOption
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        {txt.langTab[langOption]}
                      </button>
                    ))}
                  </div>

                  {/* Title input */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{txt.titleLabel}</label>
                    <input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  {/* Description textarea */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{txt.descLabel}</label>
                    <textarea
                      value={editDescription}
                      onChange={(event) => setEditDescription(event.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-y leading-relaxed"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setResetStageKey(row.stage_key)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {txt.reset}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:shadow-lg transition-all"
                      style={{ backgroundColor: "#1a3a5c" }}
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {saveMutation.isPending ? txt.saving : txt.saveBtn}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Reset confirm dialog */}
      {resetStageKey && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setResetStageKey(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-sm text-slate-700 mb-6">{txt.resetConfirm}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setResetStageKey(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {language === "en" ? "Cancel" : language === "zh-CN" ? "取消" : "取消"}
              </button>
              <button
                onClick={() => resetMutation.mutate(resetStageKey)}
                disabled={resetMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50"
              >
                {resetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : txt.reset}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
