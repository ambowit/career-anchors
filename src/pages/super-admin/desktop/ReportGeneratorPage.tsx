import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Plus, FileText, ChevronRight, Clock, Layers, Blocks,
  Search, Loader2, Trash2, Edit, Copy, Link2,
  FileBarChart, AlertTriangle, Briefcase, Sparkles, Combine,
} from "lucide-react";
import {
  DEFAULT_SCORE_RANGES, ASSESSMENT_CATEGORIES,
  getCategoryLabel as getCatLabel, getCategoryColor,
} from "@/lib/reportConstants";
import ReportVersionDetail from "@/components/desktop/ReportVersionDetail";
import CareerStageDescriptionsTab from "@/components/desktop/CareerStageDescriptionsTab";
import GeneratorBindingsTab from "@/components/desktop/GeneratorBindingsTab";

/* ─── i18n ─── */
const TXT = {
  en: {
    pageTitle: "Report Builder",
    pageDesc: "Create report generators by category. Once published, reports are auto-generated for all users. Only one active generator per category.",
    tabVersions: "Generators",
    tabReports: "Generated Reports",
    tabStages: "Career Stages",
    tabBindings: "Bindings",
    createVersion: "Create Generator",
    versionNumber: "Version Number",
    versionPlaceholder: "e.g. V1, V2",
    description: "Description",
    descriptionPlaceholder: "Optional description",
    category: "Report Category",
    categoryPlaceholder: "Select category",
    create: "Create",
    cancel: "Cancel",
    draft: "Draft", active: "Active", locked: "Locked",
    noVersions: "No generators yet. Create one to start building report content.",
    createSuccess: "Generator created with default score ranges",
    createError: "Failed to create generator",
    textBlocks: "text blocks",
    combinations: "combos",
    triAnchors: "tri-anchors",
    deleteVersion: "Delete",
    deleteVersionConfirm: "Are you sure you want to permanently delete this generator? All associated text blocks, score ranges, combinations, and tri-anchor mappings will be removed. This cannot be undone.",
    duplicateVersion: "Duplicate",
    duplicateVersionSuccess: "Generator duplicated successfully",
    duplicateVersionError: "Failed to duplicate generator",
    deleteVersionSuccess: "Generator deleted",
    editVersion: "Edit",
    editVersionSuccess: "Generator updated",
    noReports: "No reports generated yet",
    noReportsDesc: "Reports are automatically generated when users complete assessments with an active generator.",
    reportNo: "Report #",
    generatedAt: "Generated",
    categoryLabel: "Category",
    template: "Template",
    user: "User",
    actions: "Actions",
    deleteReport: "Delete",
    deleteReportConfirm: "Are you sure you want to permanently delete this report record?",
    deleteReportSuccess: "Report deleted",
    searchReports: "Search by report # or user...",
    career_anchor: "Career Anchor",
    ideal_card: "Espresso Card",
    combined: "Combined",
    save: "Save",
    filterAll: "All Categories",
  },
  "zh-TW": {
    pageTitle: "報告生成器",
    pageDesc: "按類別創建報告生成器。發布後，所有測評人員的報告根據啟用的生成器自動生成。每個類別同一時間只能有一個生成器啟用。",
    tabVersions: "生成器",
    tabReports: "已生成報告",
    tabStages: "職場階段",
    tabBindings: "綁定管理",
    createVersion: "創建生成器",
    versionNumber: "版本號",
    versionPlaceholder: "例如 V1、V2",
    description: "描述",
    descriptionPlaceholder: "可選描述",
    category: "報告類別",
    categoryPlaceholder: "選擇類別",
    create: "創建",
    cancel: "取消",
    draft: "草稿", active: "啟用中", locked: "已鎖定",
    noVersions: "尚無生成器。創建一個開始建立報告內容。",
    createSuccess: "生成器已建立",
    createError: "生成器建立失敗",
    textBlocks: "文本塊",
    combinations: "組合",
    triAnchors: "三錨",
    deleteVersion: "刪除",
    deleteVersionConfirm: "確定要永久刪除此生成器嗎？所有相關的文本塊、分數區間、組合和三錨映射都將被刪除，此操作無法撤銷。",
    duplicateVersion: "複製",
    duplicateVersionSuccess: "生成器已複製",
    duplicateVersionError: "生成器複製失敗",
    deleteVersionSuccess: "生成器已刪除",
    editVersion: "編輯",
    editVersionSuccess: "生成器已更新",
    noReports: "尚未生成報告",
    noReportsDesc: "報告在用戶完成測評後，根據啟用的生成器自動生成。",
    reportNo: "報告 #",
    generatedAt: "生成日期",
    categoryLabel: "類別",
    template: "模板",
    user: "用戶",
    actions: "操作",
    deleteReport: "刪除",
    deleteReportConfirm: "確定要永久刪除此報告記錄嗎？",
    deleteReportSuccess: "報告已刪除",
    searchReports: "搜尋報告編號或用戶...",
    career_anchor: "職業錨",
    ideal_card: "理想人生卡",
    combined: "綜合",
    save: "儲存",
    filterAll: "全部類別",
  },
  "zh-CN": {
    pageTitle: "报告生成器",
    pageDesc: "按类别创建报告生成器。发布后，所有测评人员的报告根据启用的生成器自动生成。每个类别同一时间只能有一个生成器启用。",
    tabVersions: "生成器",
    tabReports: "已生成报告",
    tabStages: "职场阶段",
    tabBindings: "绑定管理",
    createVersion: "创建生成器",
    versionNumber: "版本号",
    versionPlaceholder: "例如 V1、V2",
    description: "描述",
    descriptionPlaceholder: "可选描述",
    category: "报告类别",
    categoryPlaceholder: "选择类别",
    create: "创建",
    cancel: "取消",
    draft: "草稿", active: "启用中", locked: "已锁定",
    noVersions: "暂无生成器。创建一个开始建立报告内容。",
    createSuccess: "生成器已创建",
    createError: "生成器创建失败",
    textBlocks: "文本块",
    combinations: "组合",
    triAnchors: "三锚",
    deleteVersion: "删除",
    deleteVersionConfirm: "确定要永久删除此生成器吗？所有相关的文本块、分数区间、组合和三锚映射都将被删除，此操作无法撤销。",
    duplicateVersion: "复制",
    duplicateVersionSuccess: "生成器已复制",
    duplicateVersionError: "生成器复制失败",
    deleteVersionSuccess: "生成器已删除",
    editVersion: "编辑",
    editVersionSuccess: "生成器已更新",
    noReports: "尚未生成报告",
    noReportsDesc: "报告在用户完成测评后，根据启用的生成器自动生成。",
    reportNo: "报告 #",
    generatedAt: "生成日期",
    categoryLabel: "类别",
    template: "模板",
    user: "用户",
    actions: "操作",
    deleteReport: "删除",
    deleteReportConfirm: "确定要永久删除此报告记录吗？",
    deleteReportSuccess: "报告已删除",
    searchReports: "搜索报告编号或用户...",
    career_anchor: "职业锚",
    ideal_card: "理想人生卡",
    combined: "综合",
    save: "保存",
    filterAll: "全部类别",
  },
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  locked: "bg-slate-100 text-slate-600 border-slate-300",
};

const CATEGORY_ICONS: Record<string, typeof Briefcase> = {
  CAREER_ANCHOR: Briefcase,
  LIFE_CARD: Sparkles,
  COMBINED: Combine,
};

export default function ReportGeneratorPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const txt = TXT[language] || TXT["zh-TW"];

  const [activeTab, setActiveTab] = useState<"versions" | "reports" | "stages" | "bindings">("versions");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [reportSearch, setReportSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newVersionNumber, setNewVersionNumber] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("CAREER_ANCHOR");

  // Edit / delete
  const [deleteVersionId, setDeleteVersionId] = useState<string | null>(null);
  const [editingVersion, setEditingVersion] = useState<any | null>(null);
  const [editVersionNumber, setEditVersionNumber] = useState("");
  const [editVersionDescription, setEditVersionDescription] = useState("");
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);

  /* ═══ QUERIES ═══ */

  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ["report-versions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("report_versions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "versions",
  });

  const filteredVersions = useMemo(() => {
    if (categoryFilter === "all") return versions;
    return versions.filter((version: any) => version.assessment_type === categoryFilter);
  }, [versions, categoryFilter]);

  const { data: versionStats = {} } = useQuery({
    queryKey: ["report-version-stats"],
    queryFn: async () => {
      const stats: Record<string, { blocks: number; combos: number; tris: number }> = {};
      for (const version of versions) {
        const [blocksResult, combosResult, trisResult] = await Promise.all([
          (supabase as any).from("anchor_text_blocks").select("id", { count: "exact", head: true }).eq("version_id", version.id),
          (supabase as any).from("anchor_combination_mapping").select("id", { count: "exact", head: true }).eq("version_id", version.id),
          (supabase as any).from("anchor_tri_mapping").select("id", { count: "exact", head: true }).eq("version_id", version.id),
        ]);
        stats[version.id] = { blocks: blocksResult.count || 0, combos: combosResult.count || 0, tris: trisResult.count || 0 };
      }
      return stats;
    },
    enabled: versions.length > 0 && activeTab === "versions",
  });

  const { data: recentReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["all-generated-reports"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("generated_anchor_reports")
        .select("*, user:profiles(full_name, email), template:report_templates(template_name, template_category)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "reports",
  });

  const filteredReports = useMemo(() => {
    if (!reportSearch.trim()) return recentReports;
    const lower = reportSearch.toLowerCase();
    return recentReports.filter((report: any) =>
      report.report_number?.toLowerCase().includes(lower) ||
      report.user?.full_name?.toLowerCase().includes(lower) ||
      report.user?.email?.toLowerCase().includes(lower)
    );
  }, [recentReports, reportSearch]);

  /* ═══ MUTATIONS ═══ */

  const createVersionMutation = useMutation({
    mutationFn: async () => {
      const { data: version, error: versionError } = await (supabase as any)
        .from("report_versions")
        .insert({
          assessment_type: newCategory,
          version_number: newVersionNumber.trim(),
          description: newDescription.trim() || null,
          created_by: user?.id,
        })
        .select()
        .single();
      if (versionError) throw versionError;

      const rangeRows = DEFAULT_SCORE_RANGES.map((range) => ({ version_id: version.id, ...range }));
      const { error: rangesError } = await (supabase as any).from("anchor_score_ranges").insert(rangeRows);
      if (rangesError) throw rangesError;
      return version;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-versions"] });
      setShowCreateDialog(false);
      setNewVersionNumber("");
      setNewDescription("");
      setNewCategory("CAREER_ANCHOR");
      toast.success(txt.createSuccess);
    },
    onError: (error: any) => toast.error(error.message || txt.createError),
  });

  const deleteVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      await (supabase as any).from("anchor_text_blocks").delete().eq("version_id", versionId);
      await (supabase as any).from("anchor_score_ranges").delete().eq("version_id", versionId);
      await (supabase as any).from("anchor_combination_mapping").delete().eq("version_id", versionId);
      await (supabase as any).from("anchor_tri_mapping").delete().eq("version_id", versionId);
      const { error } = await (supabase as any).from("report_versions").delete().eq("id", versionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-versions"] });
      queryClient.invalidateQueries({ queryKey: ["report-version-stats"] });
      setDeleteVersionId(null);
      toast.success(txt.deleteVersionSuccess);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const editVersionMutation = useMutation({
    mutationFn: async () => {
      if (!editingVersion) return;
      const { error } = await (supabase as any)
        .from("report_versions")
        .update({
          version_number: editVersionNumber.trim(),
          description: editVersionDescription.trim() || null,
        })
        .eq("id", editingVersion.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-versions"] });
      setEditingVersion(null);
      toast.success(txt.editVersionSuccess);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const duplicateVersionMutation = useMutation({
    mutationFn: async (sourceVersionId: string) => {
      // 1. Read source version
      const { data: source, error: sourceError } = await (supabase as any)
        .from("report_versions")
        .select("*")
        .eq("id", sourceVersionId)
        .single();
      if (sourceError || !source) throw new Error(sourceError?.message || "Source not found");

      // 2. Create new version as draft with "(Copy)" suffix
      const { data: newVersion, error: newVersionError } = await (supabase as any)
        .from("report_versions")
        .insert({
          assessment_type: source.assessment_type,
          version_number: `${source.version_number} (Copy)`,
          description: source.description || null,
          created_by: user?.id,
          status: "draft",
        })
        .select()
        .single();
      if (newVersionError) throw newVersionError;

      // 3. Copy score ranges
      const { data: ranges } = await (supabase as any)
        .from("anchor_score_ranges")
        .select("*")
        .eq("version_id", sourceVersionId);
      if (ranges && ranges.length > 0) {
        const rangeRows = ranges.map((rangeItem: any) => {
          const { id, version_id, created_at, ...rest } = rangeItem;
          return { ...rest, version_id: newVersion.id };
        });
        await (supabase as any).from("anchor_score_ranges").insert(rangeRows);
      }

      // 4. Copy text blocks
      const { data: blocks } = await (supabase as any)
        .from("anchor_text_blocks")
        .select("*")
        .eq("version_id", sourceVersionId);
      if (blocks && blocks.length > 0) {
        const blockRows = blocks.map((blockItem: any) => {
          const { id, version_id, created_at, updated_at, is_locked, ...rest } = blockItem;
          return { ...rest, version_id: newVersion.id, is_locked: false, created_by: user?.id };
        });
        await (supabase as any).from("anchor_text_blocks").insert(blockRows);
      }

      // 5. Copy combination mappings
      const { data: combos } = await (supabase as any)
        .from("anchor_combination_mapping")
        .select("*")
        .eq("version_id", sourceVersionId);
      if (combos && combos.length > 0) {
        const comboRows = combos.map((comboItem: any) => {
          const { id, version_id, created_at, is_locked, ...rest } = comboItem;
          return { ...rest, version_id: newVersion.id, is_locked: false, created_by: user?.id };
        });
        await (supabase as any).from("anchor_combination_mapping").insert(comboRows);
      }

      // 6. Copy tri-anchor mappings
      const { data: tris } = await (supabase as any)
        .from("anchor_tri_mapping")
        .select("*")
        .eq("version_id", sourceVersionId);
      if (tris && tris.length > 0) {
        const triRows = tris.map((triItem: any) => {
          const { id, version_id, created_at, is_locked, ...rest } = triItem;
          return { ...rest, version_id: newVersion.id, is_locked: false, created_by: user?.id };
        });
        await (supabase as any).from("anchor_tri_mapping").insert(triRows);
      }

      return newVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-versions"] });
      queryClient.invalidateQueries({ queryKey: ["report-version-stats"] });
      toast.success(txt.duplicateVersionSuccess);
    },
    onError: (error: any) => toast.error(error.message || txt.duplicateVersionError),
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await (supabase as any)
        .from("generated_anchor_reports")
        .delete()
        .eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-generated-reports"] });
      setDeleteReportId(null);
      toast.success(txt.deleteReportSuccess);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const getReportCategoryLabel = (assessmentType: string): string => {
    const map: Record<string, string> = {
      career_anchor: txt.career_anchor,
      ideal_card: txt.ideal_card,
      combined: txt.combined,
    };
    return map[assessmentType] || assessmentType;
  };

  if (selectedVersionId) {
    return <ReportVersionDetail versionId={selectedVersionId} onBack={() => setSelectedVersionId(null)} />;
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { draft: txt.draft, active: txt.active, locked: txt.locked };
    return labels[status] || status;
  };

  /* ═══ RENDER ═══ */
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Blocks className="w-7 h-7 text-indigo-600" />
          {txt.pageTitle}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{txt.pageDesc}</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("versions")}
          className={cn("px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
            activeTab === "versions" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Layers className="w-4 h-4" /> {txt.tabVersions}
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={cn("px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
            activeTab === "reports" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <FileBarChart className="w-4 h-4" /> {txt.tabReports}
        </button>
        <button
          onClick={() => setActiveTab("stages")}
          className={cn("px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
            activeTab === "stages" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Briefcase className="w-4 h-4" /> {txt.tabStages}
        </button>
        <button
          onClick={() => setActiveTab("bindings")}
          className={cn("px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
            activeTab === "bindings" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Link2 className="w-4 h-4" /> {txt.tabBindings}
        </button>
      </div>

      {/* ═══ VERSIONS TAB ═══ */}
      {activeTab === "versions" && (
        <div className="space-y-4">
          {/* Toolbar: category filter + create button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCategoryFilter("all")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                  categoryFilter === "all"
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                )}
              >
                {txt.filterAll}
              </button>
              {ASSESSMENT_CATEGORIES.map((cat) => {
                const CatIcon = CATEGORY_ICONS[cat.code] || Briefcase;
                return (
                  <button
                    key={cat.code}
                    onClick={() => setCategoryFilter(cat.code)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5",
                      categoryFilter === cat.code
                        ? getCategoryColor(cat.code)
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                    )}
                  >
                    <CatIcon className="w-3 h-3" />
                    {getCatLabel(cat.code, language)}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:shadow-lg transition-all"
              style={{ backgroundColor: "#1a3a5c" }}
            >
              <Plus className="w-4 h-4" /> {txt.createVersion}
            </button>
          </div>

          {versionsLoading ? (
            <div className="grid gap-4">
              {[1, 2].map((idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-24 mb-3" />
                  <div className="h-4 bg-slate-100 rounded w-48" />
                </div>
              ))}
            </div>
          ) : filteredVersions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">{txt.noVersions}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredVersions.map((version: any) => {
                const stats = versionStats[version.id];
                const CatIcon = CATEGORY_ICONS[version.assessment_type] || Briefcase;
                return (
                  <div
                    key={version.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => setSelectedVersionId(version.id)}
                      >
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                          version.assessment_type === "CAREER_ANCHOR" ? "bg-indigo-50" :
                          version.assessment_type === "LIFE_CARD" ? "bg-rose-50" : "bg-violet-50"
                        )}>
                          <CatIcon className={cn("w-6 h-6",
                            version.assessment_type === "CAREER_ANCHOR" ? "text-indigo-600" :
                            version.assessment_type === "LIFE_CARD" ? "text-rose-600" : "text-violet-600"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-base font-bold text-slate-900">
                              {version.version_number}
                            </h3>
                            <Badge variant="outline" className={cn("text-[10px]", getCategoryColor(version.assessment_type))}>
                              {getCatLabel(version.assessment_type, language)}
                            </Badge>
                            <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[version.status])}>
                              {getStatusLabel(version.status)}
                            </Badge>
                          </div>
                          {version.description && <p className="text-sm text-slate-500 mt-0.5">{version.description}</p>}
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(version.created_at).toLocaleDateString()}
                            </span>
                            {stats && (
                              <>
                                <span>{stats.blocks} {txt.textBlocks}</span>
                                <span>{stats.combos} {txt.combinations}</span>
                                <span>{stats.tris} {txt.triAnchors}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            duplicateVersionMutation.mutate(version.id);
                          }}
                          disabled={duplicateVersionMutation.isPending}
                          className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title={txt.duplicateVersion}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditingVersion(version);
                            setEditVersionNumber(version.version_number);
                            setEditVersionDescription(version.description || "");
                          }}
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title={txt.editVersion}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteVersionId(version.id);
                          }}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title={txt.deleteVersion}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight
                          className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors cursor-pointer"
                          onClick={() => setSelectedVersionId(version.id)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Create Generator Dialog ─── */}
          <AnimatePresence>
            {showCreateDialog && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                onClick={() => setShowCreateDialog(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
                  onClick={(event) => event.stopPropagation()}
                >
                  <h3 className="text-lg font-bold text-slate-900">{txt.createVersion}</h3>

                  {/* Category Selection */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-2 block">{txt.category}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ASSESSMENT_CATEGORIES.map((cat) => {
                        const CatIcon = CATEGORY_ICONS[cat.code] || Briefcase;
                        const isSelected = newCategory === cat.code;
                        return (
                          <button
                            key={cat.code}
                            onClick={() => setNewCategory(cat.code)}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center",
                              isSelected
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            )}
                          >
                            <CatIcon className={cn("w-5 h-5",
                              isSelected ? "text-indigo-600" : "text-slate-400"
                            )} />
                            <span className={cn("text-xs font-medium",
                              isSelected ? "text-indigo-700" : "text-slate-600"
                            )}>
                              {getCatLabel(cat.code, language)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{txt.versionNumber}</label>
                    <input
                      value={newVersionNumber}
                      onChange={(event) => setNewVersionNumber(event.target.value)}
                      placeholder={txt.versionPlaceholder}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{txt.description}</label>
                    <textarea
                      value={newDescription}
                      onChange={(event) => setNewDescription(event.target.value)}
                      placeholder={txt.descriptionPlaceholder}
                      rows={3}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowCreateDialog(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      {txt.cancel}
                    </button>
                    <button
                      onClick={() => createVersionMutation.mutate()}
                      disabled={!newVersionNumber.trim() || createVersionMutation.isPending}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:shadow-lg"
                      style={{ backgroundColor: "#1a3a5c" }}
                    >
                      {createVersionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : txt.create}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Edit Dialog ─── */}
          <AnimatePresence>
            {editingVersion && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                onClick={() => setEditingVersion(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
                  onClick={(event) => event.stopPropagation()}
                >
                  <h3 className="text-lg font-bold text-slate-900">{txt.editVersion}</h3>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{txt.versionNumber}</label>
                    <input
                      value={editVersionNumber}
                      onChange={(event) => setEditVersionNumber(event.target.value)}
                      placeholder={txt.versionPlaceholder}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{txt.description}</label>
                    <textarea
                      value={editVersionDescription}
                      onChange={(event) => setEditVersionDescription(event.target.value)}
                      placeholder={txt.descriptionPlaceholder}
                      rows={3}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setEditingVersion(null)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      {txt.cancel}
                    </button>
                    <button
                      onClick={() => editVersionMutation.mutate()}
                      disabled={!editVersionNumber.trim() || editVersionMutation.isPending}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:shadow-lg"
                      style={{ backgroundColor: "#1a3a5c" }}
                    >
                      {editVersionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : txt.save}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Delete Confirm ─── */}
          <AnimatePresence>
            {deleteVersionId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                onClick={() => setDeleteVersionId(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-sm text-slate-700 mb-6">{txt.deleteVersionConfirm}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteVersionId(null)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      {txt.cancel}
                    </button>
                    <button
                      onClick={() => deleteVersionMutation.mutate(deleteVersionId)}
                      disabled={deleteVersionMutation.isPending}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
                    >
                      {deleteVersionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : txt.deleteVersion}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ═══ STAGES TAB ═══ */}
      {activeTab === "stages" && <CareerStageDescriptionsTab />}

      {/* ═══ BINDINGS TAB ═══ */}
      {activeTab === "bindings" && <GeneratorBindingsTab />}

      {/* ═══ REPORTS TAB ═══ */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={reportSearch}
              onChange={(event) => setReportSearch(event.target.value)}
              placeholder={txt.searchReports}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {reportsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <FileBarChart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm font-semibold text-slate-500">{txt.noReports}</p>
              <p className="text-xs text-slate-400 mt-1">{txt.noReportsDesc}</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{txt.reportNo}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{txt.categoryLabel}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{txt.user}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{txt.template}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{txt.generatedAt}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">{txt.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report: any) => (
                    <tr key={report.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">{report.report_number}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">
                          {getReportCategoryLabel(report.assessment_type || report.report_type)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{report.user?.full_name || report.user?.email || "\u2014"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{report.template?.template_name || "\u2014"}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setDeleteReportId(report.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title={txt.deleteReport}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <AnimatePresence>
            {deleteReportId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                onClick={() => setDeleteReportId(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-sm text-slate-700 mb-6">{txt.deleteReportConfirm}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteReportId(null)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      {txt.cancel}
                    </button>
                    <button
                      onClick={() => deleteReportMutation.mutate(deleteReportId)}
                      disabled={deleteReportMutation.isPending}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
                    >
                      {deleteReportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : txt.deleteReport}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
