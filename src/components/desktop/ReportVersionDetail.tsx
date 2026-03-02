import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Rocket, Lock, FileText, Combine, Triangle, BarChart3,
  Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Info,
  Users,
} from "lucide-react";
import {
  ANCHOR_TYPES, SECTION_TYPES, ARCHETYPE_NAMES, CONTENT_LANGUAGES,
  TIERS, CAREER_STAGES,
  getAnchorLabel, getSectionLabel, getTierLabel, getRangeDisplay,
  getCareerStageLabel, getCategoryLabel, getCategoryColor,
} from "@/lib/reportConstants";

const TXT = {
  en: {
    back: "Back to List",
    overview: "Overview",
    scoreRanges: "Score Ranges",
    textBlocks: "Text Blocks",
    combinations: "Dual Anchor",
    triAnchors: "Tri-Anchor",
    publish: "Publish",
    lockVersion: "Lock Version",
    publishConfirm: "Publishing will activate this version for its category. Any currently active version in the same category will be locked. Continue?",
    lockConfirm: "Locking prevents all future edits. Continue?",
    publishSuccess: "Version published — now active for this category",
    lockSuccess: "Version locked",
    draft: "Draft", active: "Active", locked: "Locked",
    draftInfo: "Draft — add content for each career stage before publishing.",
    activeInfo: "Active — this generator is used for new report generation in this category.",
    lockedInfo: "Locked — no modifications allowed. Create a new version to make changes.",
    anchorType: "Anchor Type", sectionType: "Section Type", language: "Language",
    scoreRange: "Score Range", textContent: "Text Content (Original Attachment)",
    sourceAttachment: "Source Attachment", save: "Save", cancel: "Cancel",
    add: "Add", edit: "Edit", delete: "Delete",
    addTextBlock: "Add Text Block", editTextBlock: "Edit Text Block",
    saveSuccess: "Saved", deleteSuccess: "Deleted",
    deleteConfirm: "Delete this entry?",
    emptySlot: "No text block — click to add",
    anchor1: "High-Sens Anchor", anchor2: "Second Anchor", anchor3: "Third Anchor",
    combinationCode: "Combination Code", tier: "Tier",
    addCombination: "Add Combination", addTriAnchor: "Add Tri-Anchor",
    triCode: "Tri-Code", archetypeName: "Archetype Name",
    noData: "No data yet", rangeLabel: "Label", rangeDesc: "Description",
    blocks: "Text Blocks", combos: "Combinations", tris: "Tri-Anchors",
    confirmAction: "Confirm",
    careerStage: "Career Stage",
    category: "Category",
  },
  "zh-TW": {
    back: "返回列表",
    overview: "概覽",
    scoreRanges: "分數區間",
    textBlocks: "文本塊",
    combinations: "雙錨組合",
    triAnchors: "三錨結構",
    publish: "發布",
    lockVersion: "鎖定版本",
    publishConfirm: "發布後此版本將成為該類別的啟用版本，同類別中原有的啟用版本將被自動鎖定。確定繼續？",
    lockConfirm: "鎖定後無法再修改。確定繼續？",
    publishSuccess: "版本已發布 — 已成為該類別的啟用生成器",
    lockSuccess: "版本已鎖定",
    draft: "草稿", active: "啟用中", locked: "已鎖定",
    draftInfo: "草稿狀態 — 請為每個職業階段添加內容後再發布。",
    activeInfo: "啟用中 — 此生成器將用於該類別新報告的自動生成。",
    lockedInfo: "已鎖定 — 不允許修改。如需修改請創建新版本。",
    anchorType: "錨點類型", sectionType: "內容類型", language: "語言",
    scoreRange: "分數區間", textContent: "文本內容（附件原文）",
    sourceAttachment: "來源附件", save: "保存", cancel: "取消",
    add: "新增", edit: "編輯", delete: "刪除",
    addTextBlock: "新增文本塊", editTextBlock: "編輯文本塊",
    saveSuccess: "已保存", deleteSuccess: "已刪除",
    deleteConfirm: "確定刪除此項？",
    emptySlot: "尚無文本塊 — 點擊新增",
    anchor1: "高敏感錨", anchor2: "次高分錨", anchor3: "第三錨點",
    combinationCode: "組合代碼", tier: "分級",
    addCombination: "新增組合", addTriAnchor: "新增三錨",
    triCode: "三錨代碼", archetypeName: "模型名稱",
    noData: "暫無資料", rangeLabel: "標籤", rangeDesc: "描述",
    blocks: "文本塊", combos: "組合", tris: "三錨",
    confirmAction: "確認",
    careerStage: "職業階段",
    category: "類別",
  },
  "zh-CN": {
    back: "返回列表",
    overview: "概览",
    scoreRanges: "分数区间",
    textBlocks: "文本块",
    combinations: "双锚组合",
    triAnchors: "三锚结构",
    publish: "发布",
    lockVersion: "锁定版本",
    publishConfirm: "发布后此版本将成为该类别的启用版本，同类别中原有的启用版本将被自动锁定。确定继续？",
    lockConfirm: "锁定后无法再修改。确定继续？",
    publishSuccess: "版本已发布 — 已成为该类别的启用生成器",
    lockSuccess: "版本已锁定",
    draft: "草稿", active: "启用中", locked: "已锁定",
    draftInfo: "草稿状态 — 请为每个职业阶段添加内容后再发布。",
    activeInfo: "启用中 — 此生成器将用于该类别新报告的自动生成。",
    lockedInfo: "已锁定 — 不允许修改。如需修改请创建新版本。",
    anchorType: "锚点类型", sectionType: "内容类型", language: "语言",
    scoreRange: "分数区间", textContent: "文本内容（附件原文）",
    sourceAttachment: "来源附件", save: "保存", cancel: "取消",
    add: "新增", edit: "编辑", delete: "删除",
    addTextBlock: "新增文本块", editTextBlock: "编辑文本块",
    saveSuccess: "已保存", deleteSuccess: "已删除",
    deleteConfirm: "确定删除此项？",
    emptySlot: "暂无文本块 — 点击新增",
    anchor1: "高敏感锚", anchor2: "次高分锚", anchor3: "第三锚点",
    combinationCode: "组合代码", tier: "分级",
    addCombination: "新增组合", addTriAnchor: "新增三锚",
    triCode: "三锚代码", archetypeName: "模型名称",
    noData: "暂无数据", rangeLabel: "标签", rangeDesc: "描述",
    blocks: "文本块", combos: "组合", tris: "三锚",
    confirmAction: "确认",
    careerStage: "职业阶段",
    category: "类别",
  },
} as const;

const STATUS_ICONS = { draft: Info, active: CheckCircle2, locked: Lock };
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  locked: "bg-slate-100 text-slate-600 border-slate-300",
};

const STAGE_ICONS: Record<string, string> = {
  entry: "bg-sky-50 text-sky-600 border-sky-200",
  mid: "bg-amber-50 text-amber-600 border-amber-200",
  senior: "bg-emerald-50 text-emerald-600 border-emerald-200",
  executive: "bg-purple-50 text-purple-600 border-purple-200",
};

interface ReportVersionDetailProps {
  versionId: string;
  onBack: () => void;
}

export default function ReportVersionDetail({ versionId, onBack }: ReportVersionDetailProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const txt = TXT[language as keyof typeof TXT] || TXT["zh-TW"];

  // Career stage filter — primary dimension
  const [filterStage, setFilterStage] = useState("entry");

  // Filters for text blocks
  const [filterAnchor, setFilterAnchor] = useState("TF");
  const [filterSection, setFilterSection] = useState("anchor_explanation");
  const [filterLang, setFilterLang] = useState("zh-TW");

  // Dialog states
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; editing: any | null; scoreMin: number; scoreMax: number }>({
    open: false, editing: null, scoreMin: 0, scoreMax: 0,
  });
  const [comboDialog, setComboDialog] = useState(false);
  const [triDialog, setTriDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string; onConfirm: () => void }>({
    open: false, action: "", onConfirm: () => {},
  });

  // Form states
  const [formText, setFormText] = useState("");
  const [formSource, setFormSource] = useState("");
  const [comboForm, setComboForm] = useState({ anchor1: "TF", anchor2: "GM", code: "", tier: "tier_1", text: "", lang: "zh-TW", source: "" });
  const [triForm, setTriForm] = useState({ anchor1: "TF", anchor2: "GM", anchor3: "AU", code: "", archetype: ARCHETYPE_NAMES[0], text: "", lang: "zh-TW", source: "" });

  // ─── Data Queries ────────────────────────────────────────
  const { data: version } = useQuery({
    queryKey: ["report-version", versionId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("report_versions").select("*").eq("id", versionId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: scoreRanges = [] } = useQuery({
    queryKey: ["anchor-score-ranges", versionId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("anchor_score_ranges").select("*").eq("version_id", versionId).order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allTextBlocks = [] } = useQuery({
    queryKey: ["anchor-text-blocks", versionId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("anchor_text_blocks").select("*").eq("version_id", versionId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: combinations = [] } = useQuery({
    queryKey: ["anchor-combinations", versionId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("anchor_combination_mapping").select("*").eq("version_id", versionId).order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: triAnchors = [] } = useQuery({
    queryKey: ["anchor-tri-mappings", versionId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("anchor_tri_mapping").select("*").eq("version_id", versionId).order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const isLocked = version?.status === "locked" || version?.status === "active";

  // Filtered text blocks — by anchor + section + language + career stage
  const filteredBlocks = useMemo(() => {
    return allTextBlocks.filter((block: any) =>
      block.anchor_type === filterAnchor &&
      block.section_type === filterSection &&
      block.language === filterLang &&
      block.career_stage === filterStage
    );
  }, [allTextBlocks, filterAnchor, filterSection, filterLang, filterStage]);

  // Filtered combinations by career stage
  const filteredCombinations = useMemo(() => {
    return combinations.filter((combo: any) => combo.career_stage === filterStage);
  }, [combinations, filterStage]);

  // Filtered tri-anchors by career stage
  const filteredTriAnchors = useMemo(() => {
    return triAnchors.filter((tri: any) => tri.career_stage === filterStage);
  }, [triAnchors, filterStage]);

  // Per-stage content stats
  const stageStats = useMemo(() => {
    const stats: Record<string, { blocks: number; combos: number; tris: number }> = {};
    CAREER_STAGES.forEach((stage) => {
      stats[stage.code] = {
        blocks: allTextBlocks.filter((block: any) => block.career_stage === stage.code).length,
        combos: combinations.filter((combo: any) => combo.career_stage === stage.code).length,
        tris: triAnchors.filter((tri: any) => tri.career_stage === stage.code).length,
      };
    });
    return stats;
  }, [allTextBlocks, combinations, triAnchors]);

  // ─── Mutations ───────────────────────────────────────────
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["report-version", versionId] });
    queryClient.invalidateQueries({ queryKey: ["anchor-text-blocks", versionId] });
    queryClient.invalidateQueries({ queryKey: ["anchor-combinations", versionId] });
    queryClient.invalidateQueries({ queryKey: ["anchor-tri-mappings", versionId] });
    queryClient.invalidateQueries({ queryKey: ["report-version-stats"] });
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      // Deactivate other active versions of the SAME category
      await (supabase as any).from("report_versions")
        .update({ status: "locked", locked_at: new Date().toISOString() })
        .eq("assessment_type", version.assessment_type)
        .eq("status", "active");
      // Activate this version
      await (supabase as any).from("report_versions")
        .update({ status: "active", published_at: new Date().toISOString() })
        .eq("id", versionId);
      // Lock all content
      await (supabase as any).from("anchor_text_blocks").update({ is_locked: true }).eq("version_id", versionId);
      await (supabase as any).from("anchor_combination_mapping").update({ is_locked: true }).eq("version_id", versionId);
      await (supabase as any).from("anchor_tri_mapping").update({ is_locked: true }).eq("version_id", versionId);
    },
    onSuccess: () => { invalidateAll(); toast.success(txt.publishSuccess); },
  });

  const lockMutation = useMutation({
    mutationFn: async () => {
      await (supabase as any).from("report_versions")
        .update({ status: "locked", locked_at: new Date().toISOString() })
        .eq("id", versionId);
    },
    onSuccess: () => { invalidateAll(); toast.success(txt.lockSuccess); },
  });

  const saveBlockMutation = useMutation({
    mutationFn: async (params: { id?: string; scoreMin: number; scoreMax: number }) => {
      if (params.id) {
        const { error } = await (supabase as any).from("anchor_text_blocks")
          .update({ original_text_block: formText, source_attachment: formSource || null, updated_at: new Date().toISOString() })
          .eq("id", params.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("anchor_text_blocks").insert({
          version_id: versionId,
          anchor_type: filterAnchor,
          section_type: filterSection,
          language: filterLang,
          career_stage: filterStage,
          score_min: params.scoreMin,
          score_max: params.scoreMax,
          original_text_block: formText,
          source_attachment: formSource || null,
          created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidateAll();
      setBlockDialog({ open: false, editing: null, scoreMin: 0, scoreMax: 0 });
      setFormText("");
      setFormSource("");
      toast.success(txt.saveSuccess);
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await (supabase as any).from("anchor_text_blocks").delete().eq("id", blockId);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success(txt.deleteSuccess); },
  });

  const saveComboMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("anchor_combination_mapping").insert({
        version_id: versionId,
        anchor_1: comboForm.anchor1,
        anchor_2: comboForm.anchor2,
        combination_code: comboForm.code,
        tier: comboForm.tier,
        original_text_block: comboForm.text,
        language: comboForm.lang,
        career_stage: filterStage,
        source_attachment: comboForm.source || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setComboDialog(false);
      setComboForm({ anchor1: "TF", anchor2: "GM", code: "", tier: "tier_1", text: "", lang: "zh-TW", source: "" });
      toast.success(txt.saveSuccess);
    },
  });

  const deleteComboMutation = useMutation({
    mutationFn: async (comboId: string) => {
      const { error } = await (supabase as any).from("anchor_combination_mapping").delete().eq("id", comboId);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success(txt.deleteSuccess); },
  });

  const saveTriMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("anchor_tri_mapping").insert({
        version_id: versionId,
        anchor_1: triForm.anchor1,
        anchor_2: triForm.anchor2,
        anchor_3: triForm.anchor3,
        tri_code: triForm.code,
        archetype_name: triForm.archetype,
        original_text_block: triForm.text,
        language: triForm.lang,
        career_stage: filterStage,
        source_attachment: triForm.source || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setTriDialog(false);
      setTriForm({ anchor1: "TF", anchor2: "GM", anchor3: "AU", code: "", archetype: ARCHETYPE_NAMES[0], text: "", lang: "zh-TW", source: "" });
      toast.success(txt.saveSuccess);
    },
  });

  const deleteTriMutation = useMutation({
    mutationFn: async (triId: string) => {
      const { error } = await (supabase as any).from("anchor_tri_mapping").delete().eq("id", triId);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success(txt.deleteSuccess); },
  });

  // ─── Helpers ─────────────────────────────────────────────
  const openBlockDialog = (range: any, existingBlock?: any) => {
    if (existingBlock) {
      setFormText(existingBlock.original_text_block);
      setFormSource(existingBlock.source_attachment || "");
      setBlockDialog({ open: true, editing: existingBlock, scoreMin: range.score_min, scoreMax: range.score_max });
    } else {
      setFormText("");
      setFormSource("");
      setBlockDialog({ open: true, editing: null, scoreMin: range.score_min, scoreMax: range.score_max });
    }
  };

  const statusLabel = version?.status === "draft" ? txt.draft : version?.status === "active" ? txt.active : txt.locked;
  const statusInfo = version?.status === "draft" ? txt.draftInfo : version?.status === "active" ? txt.activeInfo : txt.lockedInfo;
  const StatusIcon = STATUS_ICONS[version?.status as keyof typeof STATUS_ICONS] || Info;

  if (!version) return null;

  // ─── Career Stage Tab Bar (shared by text/combo/tri tabs) ───
  const CareerStageTabs = () => (
    <div className="flex items-center gap-2 mb-4">
      <Users className="w-4 h-4 text-slate-400" />
      <span className="text-xs font-medium text-slate-500 mr-1">{txt.careerStage}:</span>
      {CAREER_STAGES.map((stage) => {
        const isActive = filterStage === stage.code;
        const count = stageStats[stage.code];
        const total = (count?.blocks || 0) + (count?.combos || 0) + (count?.tris || 0);
        return (
          <button
            key={stage.code}
            onClick={() => setFilterStage(stage.code)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5",
              isActive
                ? STAGE_ICONS[stage.code]
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            )}
          >
            {getCareerStageLabel(stage.code, language)}
            {total > 0 && (
              <span className={cn(
                "inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold",
                isActive ? "bg-white/60 text-current" : "bg-slate-100 text-slate-500"
              )}>
                {total}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {txt.back}
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">
                {version.version_number}
              </h1>
              <Badge variant="outline" className={cn("text-xs", getCategoryColor(version.assessment_type))}>
                {getCategoryLabel(version.assessment_type, language)}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[version.status])}>
                {statusLabel}
              </Badge>
            </div>
            {version.description && <p className="text-sm text-slate-500 mt-0.5">{version.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {version.status === "draft" && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setConfirmDialog({ open: true, action: txt.publishConfirm, onConfirm: () => publishMutation.mutate() })}
            >
              <Rocket className="w-4 h-4 mr-2" />{txt.publish}
            </Button>
          )}
          {version.status === "active" && (
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: true, action: txt.lockConfirm, onConfirm: () => lockMutation.mutate() })}
            >
              <Lock className="w-4 h-4 mr-2" />{txt.lockVersion}
            </Button>
          )}
        </div>
      </div>

      {/* Status banner */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border text-sm",
        version.status === "draft" ? "bg-amber-50 border-amber-200 text-amber-800" :
        version.status === "active" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
        "bg-slate-50 border-slate-200 text-slate-600"
      )}>
        <StatusIcon className="w-4 h-4 flex-shrink-0" />
        {statusInfo}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="textBlocks">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />{txt.overview}</TabsTrigger>
          <TabsTrigger value="scoreRanges" className="gap-1.5">{txt.scoreRanges}</TabsTrigger>
          <TabsTrigger value="textBlocks" className="gap-1.5"><FileText className="w-3.5 h-3.5" />{txt.textBlocks}</TabsTrigger>
          <TabsTrigger value="combinations" className="gap-1.5"><Combine className="w-3.5 h-3.5" />{txt.combinations}</TabsTrigger>
          <TabsTrigger value="triAnchors" className="gap-1.5"><Triangle className="w-3.5 h-3.5" />{txt.triAnchors}</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ──────────────────────────────── */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-5 text-center">
              <div className="text-3xl font-bold text-indigo-600">{allTextBlocks.length}</div>
              <div className="text-sm text-slate-500 mt-1">{txt.blocks}</div>
            </Card>
            <Card className="p-5 text-center">
              <div className="text-3xl font-bold text-sky-600">{combinations.length}</div>
              <div className="text-sm text-slate-500 mt-1">{txt.combos}</div>
            </Card>
            <Card className="p-5 text-center">
              <div className="text-3xl font-bold text-violet-600">{triAnchors.length}</div>
              <div className="text-sm text-slate-500 mt-1">{txt.tris}</div>
            </Card>
          </div>

          {/* Per-stage breakdown */}
          <Card className="mt-4 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              {txt.careerStage}
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {CAREER_STAGES.map((stage) => {
                const count = stageStats[stage.code];
                return (
                  <div key={stage.code} className={cn("rounded-lg border p-3", STAGE_ICONS[stage.code])}>
                    <div className="text-xs font-semibold mb-2">
                      {getCareerStageLabel(stage.code, language)}
                    </div>
                    <div className="text-xs space-y-0.5 opacity-80">
                      <div>{count?.blocks || 0} {txt.blocks}</div>
                      <div>{count?.combos || 0} {txt.combos}</div>
                      <div>{count?.tris || 0} {txt.tris}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="mt-4 p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">{txt.category}:</span> <span className="font-medium">{getCategoryLabel(version.assessment_type, language)}</span></div>
              <div><span className="text-slate-500">Version:</span> <span className="font-medium">{version.version_number}</span></div>
              <div><span className="text-slate-500">Created:</span> <span className="font-medium">{new Date(version.created_at).toLocaleString()}</span></div>
              {version.published_at && <div><span className="text-slate-500">Published:</span> <span className="font-medium">{new Date(version.published_at).toLocaleString()}</span></div>}
              {version.locked_at && <div><span className="text-slate-500">Locked:</span> <span className="font-medium">{new Date(version.locked_at).toLocaleString()}</span></div>}
            </div>
          </Card>
        </TabsContent>

        {/* ─── Score Ranges Tab ──────────────────────────── */}
        <TabsContent value="scoreRanges" className="mt-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">{txt.scoreRange}</TableHead>
                  <TableHead>{txt.rangeLabel} (EN)</TableHead>
                  <TableHead>{txt.rangeLabel} (繁中)</TableHead>
                  <TableHead>{txt.rangeLabel} (简中)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoreRanges.map((range: any) => (
                  <TableRow key={range.id}>
                    <TableCell className="font-mono font-bold text-indigo-700">
                      {getRangeDisplay(range.score_min, range.score_max)}
                    </TableCell>
                    <TableCell className="text-sm">{range.range_label_en}</TableCell>
                    <TableCell className="text-sm">{range.range_label_zh_tw}</TableCell>
                    <TableCell className="text-sm">{range.range_label_zh_cn}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── Text Blocks Tab ───────────────────────────── */}
        <TabsContent value="textBlocks" className="mt-4 space-y-4">
          {/* Career Stage Tabs */}
          <CareerStageTabs />

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="w-48">
              <Label className="text-xs text-slate-500 mb-1 block">{txt.anchorType}</Label>
              <Select value={filterAnchor} onValueChange={setFilterAnchor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANCHOR_TYPES.map(anchor => (
                    <SelectItem key={anchor.code} value={anchor.code}>
                      {anchor.code} — {getAnchorLabel(anchor.code, language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label className="text-xs text-slate-500 mb-1 block">{txt.sectionType}</Label>
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map(section => (
                    <SelectItem key={section.code} value={section.code}>
                      {getSectionLabel(section.code, language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Label className="text-xs text-slate-500 mb-1 block">{txt.language}</Label>
              <Select value={filterLang} onValueChange={setFilterLang}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_LANGUAGES.map(contentLanguage => (
                    <SelectItem key={contentLanguage.code} value={contentLanguage.code}>{contentLanguage.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Score range slots */}
          <div className="space-y-3">
            {scoreRanges.map((range: any) => {
              const existingBlock = filteredBlocks.find(
                (block: any) => block.score_min === range.score_min && block.score_max === range.score_max
              );
              return (
                <Card key={range.id} className={cn("p-4", existingBlock ? "border-emerald-200 bg-emerald-50/30" : "border-dashed border-slate-300")}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs bg-white">
                        {getRangeDisplay(range.score_min, range.score_max)}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {language === "zh-TW" ? range.range_label_zh_tw :
                         language === "zh-CN" ? range.range_label_zh_cn : range.range_label_en}
                      </span>
                    </div>
                    {!isLocked && existingBlock && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openBlockDialog(range, existingBlock)}>
                          <Pencil className="w-3 h-3 mr-1" />{txt.edit}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500 hover:text-red-700"
                          onClick={() => setConfirmDialog({ open: true, action: txt.deleteConfirm, onConfirm: () => deleteBlockMutation.mutate(existingBlock.id) })}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {existingBlock ? (
                    <div className="bg-white rounded border border-emerald-100 p-3">
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{existingBlock.original_text_block}</p>
                      {existingBlock.source_attachment && (
                        <p className="text-[10px] text-slate-400 mt-2">{txt.sourceAttachment}: {existingBlock.source_attachment}</p>
                      )}
                    </div>
                  ) : (
                    <button
                      className="w-full py-6 rounded border-2 border-dashed border-slate-200 text-slate-400 text-sm hover:border-indigo-300 hover:text-indigo-500 transition-colors disabled:opacity-50"
                      onClick={() => openBlockDialog(range)}
                      disabled={isLocked}
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      {txt.emptySlot}
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── Combinations Tab ──────────────────────────── */}
        <TabsContent value="combinations" className="mt-4 space-y-4">
          <CareerStageTabs />

          {!isLocked && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setComboDialog(true)} className="bg-sky-600 hover:bg-sky-700">
                <Plus className="w-4 h-4 mr-1" />{txt.addCombination}
              </Button>
            </div>
          )}
          {filteredCombinations.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">{txt.noData}</Card>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">{txt.anchor1}</TableHead>
                    <TableHead className="w-24">{txt.anchor2}</TableHead>
                    <TableHead className="w-24">{txt.combinationCode}</TableHead>
                    <TableHead className="w-20">{txt.tier}</TableHead>
                    <TableHead className="w-20">{txt.language}</TableHead>
                    <TableHead>{txt.textContent}</TableHead>
                    {!isLocked && <TableHead className="w-16" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCombinations.map((combo: any) => (
                    <TableRow key={combo.id}>
                      <TableCell className="font-mono text-xs font-bold">{combo.anchor_1}</TableCell>
                      <TableCell className="font-mono text-xs font-bold">{combo.anchor_2}</TableCell>
                      <TableCell className="font-mono text-xs">{combo.combination_code}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{getTierLabel(combo.tier, language)}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{combo.language}</TableCell>
                      <TableCell className="text-xs max-w-sm truncate">{combo.original_text_block}</TableCell>
                      {!isLocked && (
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500"
                            onClick={() => setConfirmDialog({ open: true, action: txt.deleteConfirm, onConfirm: () => deleteComboMutation.mutate(combo.id) })}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ─── Tri-Anchors Tab ───────────────────────────── */}
        <TabsContent value="triAnchors" className="mt-4 space-y-4">
          <CareerStageTabs />

          {!isLocked && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setTriDialog(true)} className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-1" />{txt.addTriAnchor}
              </Button>
            </div>
          )}
          {filteredTriAnchors.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">{txt.noData}</Card>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">{txt.anchor1}</TableHead>
                    <TableHead className="w-20">{txt.anchor2}</TableHead>
                    <TableHead className="w-20">{txt.anchor3}</TableHead>
                    <TableHead className="w-20">{txt.triCode}</TableHead>
                    <TableHead className="w-48">{txt.archetypeName}</TableHead>
                    <TableHead className="w-20">{txt.language}</TableHead>
                    <TableHead>{txt.textContent}</TableHead>
                    {!isLocked && <TableHead className="w-16" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTriAnchors.map((tri: any) => (
                    <TableRow key={tri.id}>
                      <TableCell className="font-mono text-xs font-bold">{tri.anchor_1}</TableCell>
                      <TableCell className="font-mono text-xs font-bold">{tri.anchor_2}</TableCell>
                      <TableCell className="font-mono text-xs font-bold">{tri.anchor_3}</TableCell>
                      <TableCell className="font-mono text-xs">{tri.tri_code}</TableCell>
                      <TableCell className="text-xs font-medium">{tri.archetype_name}</TableCell>
                      <TableCell className="text-xs">{tri.language}</TableCell>
                      <TableCell className="text-xs max-w-sm truncate">{tri.original_text_block}</TableCell>
                      {!isLocked && (
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500"
                            onClick={() => setConfirmDialog({ open: true, action: txt.deleteConfirm, onConfirm: () => deleteTriMutation.mutate(tri.id) })}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Text Block Dialog ──────────────────────────── */}
      <Dialog open={blockDialog.open} onOpenChange={(open) => { if (!open) setBlockDialog({ open: false, editing: null, scoreMin: 0, scoreMax: 0 }); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{blockDialog.editing ? txt.editTextBlock : txt.addTextBlock}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2 flex-wrap text-xs text-slate-500">
              <Badge variant="outline" className={cn("text-[10px]", STAGE_ICONS[filterStage])}>
                {getCareerStageLabel(filterStage, language)}
              </Badge>
              <Badge variant="outline">{getAnchorLabel(filterAnchor, language)}</Badge>
              <Badge variant="outline">{getSectionLabel(filterSection, language)}</Badge>
              <Badge variant="outline">{filterLang}</Badge>
              <Badge variant="outline" className="font-mono">{getRangeDisplay(blockDialog.scoreMin, blockDialog.scoreMax)}</Badge>
            </div>
            <div className="space-y-2">
              <Label>{txt.textContent}</Label>
              <Textarea
                value={formText}
                onChange={event => setFormText(event.target.value)}
                rows={10}
                className="font-mono text-sm"
                placeholder="Paste the original attachment text here..."
              />
              <p className="text-[10px] text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Raw text only — no AI rewriting, no formatting changes, no summarization.
              </p>
            </div>
            <div className="space-y-2">
              <Label>{txt.sourceAttachment}</Label>
              <Input
                value={formSource}
                onChange={event => setFormSource(event.target.value)}
                placeholder="e.g. Attachment A - Section 3.2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialog({ open: false, editing: null, scoreMin: 0, scoreMax: 0 })}>
              {txt.cancel}
            </Button>
            <Button
              onClick={() => saveBlockMutation.mutate({ id: blockDialog.editing?.id, scoreMin: blockDialog.scoreMin, scoreMax: blockDialog.scoreMax })}
              disabled={!formText.trim() || saveBlockMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {txt.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Combination Dialog ─────────────────────────── */}
      <Dialog open={comboDialog} onOpenChange={setComboDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{txt.addCombination}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Badge variant="outline" className={cn("text-[10px]", STAGE_ICONS[filterStage])}>
              {getCareerStageLabel(filterStage, language)}
            </Badge>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{txt.anchor1}</Label>
                <Select value={comboForm.anchor1} onValueChange={value => setComboForm(previous => ({ ...previous, anchor1: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ANCHOR_TYPES.map(anchor => <SelectItem key={anchor.code} value={anchor.code}>{anchor.code} — {getAnchorLabel(anchor.code, language)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{txt.anchor2}</Label>
                <Select value={comboForm.anchor2} onValueChange={value => setComboForm(previous => ({ ...previous, anchor2: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ANCHOR_TYPES.map(anchor => <SelectItem key={anchor.code} value={anchor.code}>{anchor.code} — {getAnchorLabel(anchor.code, language)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">{txt.combinationCode}</Label>
                <Input value={comboForm.code} onChange={event => setComboForm(previous => ({ ...previous, code: event.target.value }))} placeholder="e.g. TF-GM" />
              </div>
              <div>
                <Label className="text-xs">{txt.tier}</Label>
                <Select value={comboForm.tier} onValueChange={value => setComboForm(previous => ({ ...previous, tier: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIERS.map(tier => <SelectItem key={tier.code} value={tier.code}>{getTierLabel(tier.code, language)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{txt.language}</Label>
                <Select value={comboForm.lang} onValueChange={value => setComboForm(previous => ({ ...previous, lang: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTENT_LANGUAGES.map(contentLanguage => <SelectItem key={contentLanguage.code} value={contentLanguage.code}>{contentLanguage.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">{txt.textContent}</Label>
              <Textarea value={comboForm.text} onChange={event => setComboForm(previous => ({ ...previous, text: event.target.value }))} rows={8} className="font-mono text-sm" />
            </div>
            <div>
              <Label className="text-xs">{txt.sourceAttachment}</Label>
              <Input value={comboForm.source} onChange={event => setComboForm(previous => ({ ...previous, source: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComboDialog(false)}>{txt.cancel}</Button>
            <Button
              onClick={() => saveComboMutation.mutate()}
              disabled={!comboForm.code.trim() || !comboForm.text.trim() || saveComboMutation.isPending}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {txt.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Tri-Anchor Dialog ──────────────────────────── */}
      <Dialog open={triDialog} onOpenChange={setTriDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{txt.addTriAnchor}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Badge variant="outline" className={cn("text-[10px]", STAGE_ICONS[filterStage])}>
              {getCareerStageLabel(filterStage, language)}
            </Badge>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">{txt.anchor1}</Label>
                <Select value={triForm.anchor1} onValueChange={value => setTriForm(previous => ({ ...previous, anchor1: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ANCHOR_TYPES.map(anchor => <SelectItem key={anchor.code} value={anchor.code}>{anchor.code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{txt.anchor2}</Label>
                <Select value={triForm.anchor2} onValueChange={value => setTriForm(previous => ({ ...previous, anchor2: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ANCHOR_TYPES.map(anchor => <SelectItem key={anchor.code} value={anchor.code}>{anchor.code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{txt.anchor3}</Label>
                <Select value={triForm.anchor3} onValueChange={value => setTriForm(previous => ({ ...previous, anchor3: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ANCHOR_TYPES.map(anchor => <SelectItem key={anchor.code} value={anchor.code}>{anchor.code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">{txt.triCode}</Label>
                <Input value={triForm.code} onChange={event => setTriForm(previous => ({ ...previous, code: event.target.value }))} placeholder="e.g. TF-GM-AU" />
              </div>
              <div>
                <Label className="text-xs">{txt.archetypeName}</Label>
                <Select value={triForm.archetype} onValueChange={value => setTriForm(previous => ({ ...previous, archetype: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ARCHETYPE_NAMES.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{txt.language}</Label>
                <Select value={triForm.lang} onValueChange={value => setTriForm(previous => ({ ...previous, lang: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTENT_LANGUAGES.map(contentLanguage => <SelectItem key={contentLanguage.code} value={contentLanguage.code}>{contentLanguage.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">{txt.textContent}</Label>
              <Textarea value={triForm.text} onChange={event => setTriForm(previous => ({ ...previous, text: event.target.value }))} rows={8} className="font-mono text-sm" />
            </div>
            <div>
              <Label className="text-xs">{txt.sourceAttachment}</Label>
              <Input value={triForm.source} onChange={event => setTriForm(previous => ({ ...previous, source: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriDialog(false)}>{txt.cancel}</Button>
            <Button
              onClick={() => saveTriMutation.mutate()}
              disabled={!triForm.code.trim() || !triForm.text.trim() || saveTriMutation.isPending}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {txt.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Confirm Dialog ─────────────────────────────── */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => { if (!open) setConfirmDialog({ open: false, action: "", onConfirm: () => {} }); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {txt.confirmAction}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-2">{confirmDialog.action}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, action: "", onConfirm: () => {} })}>
              {txt.cancel}
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ open: false, action: "", onConfirm: () => {} }); }}
            >
              {txt.confirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
