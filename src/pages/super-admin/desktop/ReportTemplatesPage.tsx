import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Edit, Trash2, X, Save, CheckCircle2, Clock,
  Loader2, Layers, FileText, BarChart3, Target, Compass,
  AlertTriangle, Zap, Heart, Archive, Eye, GripVertical,
  ToggleLeft, ToggleRight, Copy, Lock, Unlock, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

/* ─── i18n ──────────────────────────────────────────────── */
const TXT = {
  en: {
    pageTitle: "Template Builder",
    pageDesc: "Create and manage report templates for all assessment types",
    createTemplate: "New Template",
    allCategories: "All",
    lifeCard: "Espresso Card",
    careerAnchor: "Career Anchor",
    combined: "Combined",
    searchPlaceholder: "Search templates...",
    noTemplates: "No templates yet",
    noTemplatesDesc: "Create your first template to get started",
    // Template card
    version: "Version",
    published: "Published",
    draft: "Draft",
    archived: "Archived",
    sections: "sections",
    usageCount: "reports generated",
    // Actions
    publish: "Publish",
    unpublish: "Unpublish",
    archive: "Archive",
    restore: "Restore",
    rename: "Rename",
    duplicate: "Duplicate",
    delete: "Delete",
    deleteConfirm: "Are you sure? This will permanently delete the template and all its sections. This cannot be undone.",
    archiveConfirm: "This template will be archived. Historical reports will be preserved.",
    // Create/Edit modal
    createTitle: "Create Template",
    editTitle: "Edit Template",
    templateName: "Template Name",
    templateNamePlaceholder: "Enter template name",
    category: "Category",
    versionLabel: "Version",
    versionPlaceholder: "e.g. V1",
    description: "Description",
    descriptionPlaceholder: "Optional description",
    save: "Save",
    cancel: "Cancel",
    // Section editor
    editSections: "Edit Sections",
    addSection: "Add Section",
    sectionName: "Section Name",
    sectionType: "Type",
    content: "Content",
    contentPlaceholder: "Enter section content (super-admin authored text only, no AI modification)",
    mappingKey: "Mapping Key",
    active: "Active",
    locked: "Locked",
    // Section types
    STATIC_TEXT: "Static Text",
    SCORE_RANGE_MATCH: "Score Range",
    DUAL_MATCH: "Dual Anchor",
    TRI_MATCH: "Tri-Anchor",
    FUSION_MATCH: "Fusion Match",
    CHART_BLOCK: "Chart",
    TABLE_BLOCK: "Table",
    USER_INFO_BLOCK: "Cover Info",
    // Feedback
    createSuccess: "Template created",
    updateSuccess: "Template updated",
    publishSuccess: "Template published",
    unpublishSuccess: "Template unpublished",
    archiveSuccess: "Template archived",
    restoreSuccess: "Template restored",
    duplicateSuccess: "Template duplicated",
    deleteSuccess: "Template deleted",
    error: "Operation failed",
    showArchived: "Show archived",
    default: "Default",
    setDefault: "Set as Default",
  },
  "zh-TW": {
    pageTitle: "模板生成器",
    pageDesc: "建立與管理所有測評類型的報告模板",
    createTemplate: "新增模板",
    allCategories: "全部",
    lifeCard: "理想人生卡",
    careerAnchor: "職業錨",
    combined: "綜合",
    searchPlaceholder: "搜尋模板...",
    noTemplates: "尚無模板",
    noTemplatesDesc: "建立第一個模板開始",
    version: "版本",
    published: "已發布",
    draft: "草稿",
    archived: "已歸檔",
    sections: "區塊",
    usageCount: "報告已產生",
    publish: "發布",
    unpublish: "取消發布",
    archive: "歸檔",
    restore: "恢復",
    rename: "重命名",
    duplicate: "複製",
    delete: "刪除",
    deleteConfirm: "確定要永久刪除嗎？此模板及所有區塊將被永久刪除，此操作無法撤銷。",
    archiveConfirm: "此模板將被歸檔，歷史報告不受影響。",
    createTitle: "建立模板",
    editTitle: "編輯模板",
    templateName: "模板名稱",
    templateNamePlaceholder: "輸入模板名稱",
    category: "分類",
    versionLabel: "版本",
    versionPlaceholder: "例如 V1",
    description: "描述",
    descriptionPlaceholder: "可選描述",
    save: "儲存",
    cancel: "取消",
    editSections: "管理區塊",
    addSection: "新增區塊",
    sectionName: "區塊名稱",
    sectionType: "類型",
    content: "內容",
    contentPlaceholder: "輸入區塊內容（僅限超管確認文本，禁止AI改寫）",
    mappingKey: "匹配鍵",
    active: "啟用",
    locked: "鎖定",
    STATIC_TEXT: "靜態文字",
    SCORE_RANGE_MATCH: "分數區間匹配",
    DUAL_MATCH: "雙錨匹配",
    TRI_MATCH: "三錨匹配",
    FUSION_MATCH: "整合匹配",
    CHART_BLOCK: "圖表",
    TABLE_BLOCK: "表格",
    USER_INFO_BLOCK: "封面資訊",
    createSuccess: "模板已建立",
    updateSuccess: "模板已更新",
    publishSuccess: "模板已發布",
    unpublishSuccess: "模板已取消發布",
    archiveSuccess: "模板已歸檔",
    restoreSuccess: "模板已恢復",
    duplicateSuccess: "模板已複製",
    deleteSuccess: "模板已刪除",
    error: "操作失敗",
    showArchived: "顯示已歸檔",
    default: "預設",
    setDefault: "設為預設",
  },
  "zh-CN": {
    pageTitle: "模板生成器",
    pageDesc: "创建与管理所有测评类型的报告模板",
    createTemplate: "新增模板",
    allCategories: "全部",
    lifeCard: "理想人生卡",
    careerAnchor: "职业锚",
    combined: "综合",
    searchPlaceholder: "搜索模板...",
    noTemplates: "暂无模板",
    noTemplatesDesc: "创建第一个模板开始",
    version: "版本",
    published: "已发布",
    draft: "草稿",
    archived: "已归档",
    sections: "区块",
    usageCount: "报告已生成",
    publish: "发布",
    unpublish: "取消发布",
    archive: "归档",
    restore: "恢复",
    rename: "重命名",
    duplicate: "复制",
    delete: "删除",
    deleteConfirm: "确定要永久删除吗？此模板及所有区块将被永久删除，此操作无法撤销。",
    archiveConfirm: "此模板将被归档，历史报告不受影响。",
    createTitle: "创建模板",
    editTitle: "编辑模板",
    templateName: "模板名称",
    templateNamePlaceholder: "输入模板名称",
    category: "分类",
    versionLabel: "版本",
    versionPlaceholder: "例如 V1",
    description: "描述",
    descriptionPlaceholder: "可选描述",
    save: "保存",
    cancel: "取消",
    editSections: "管理区块",
    addSection: "新增区块",
    sectionName: "区块名称",
    sectionType: "类型",
    content: "内容",
    contentPlaceholder: "输入区块内容（仅限超管确认文本，禁止AI改写）",
    mappingKey: "匹配键",
    active: "启用",
    locked: "锁定",
    STATIC_TEXT: "静态文字",
    SCORE_RANGE_MATCH: "分数区间匹配",
    DUAL_MATCH: "双锚匹配",
    TRI_MATCH: "三锚匹配",
    FUSION_MATCH: "整合匹配",
    CHART_BLOCK: "图表",
    TABLE_BLOCK: "表格",
    USER_INFO_BLOCK: "封面信息",
    createSuccess: "模板已创建",
    updateSuccess: "模板已更新",
    publishSuccess: "模板已发布",
    unpublishSuccess: "模板已取消发布",
    archiveSuccess: "模板已归档",
    restoreSuccess: "模板已恢复",
    duplicateSuccess: "模板已复制",
    deleteSuccess: "模板已删除",
    error: "操作失败",
    showArchived: "显示已归档",
    default: "预设",
    setDefault: "设为预设",
  },
};

const CATEGORY_OPTIONS = [
  { value: "LIFE_CARD", icon: Heart, color: "text-rose-600 bg-rose-50 border-rose-200" },
  { value: "CAREER_ANCHOR", icon: Compass, color: "text-sky-600 bg-sky-50 border-sky-200" },
  { value: "COMBINED", icon: Layers, color: "text-violet-600 bg-violet-50 border-violet-200" },
] as const;

const SECTION_TYPES = [
  "STATIC_TEXT", "SCORE_RANGE_MATCH", "DUAL_MATCH", "TRI_MATCH",
  "FUSION_MATCH", "CHART_BLOCK", "TABLE_BLOCK", "USER_INFO_BLOCK",
] as const;

const SECTION_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  STATIC_TEXT: FileText,
  SCORE_RANGE_MATCH: Target,
  DUAL_MATCH: Layers,
  TRI_MATCH: AlertTriangle,
  FUSION_MATCH: Zap,
  CHART_BLOCK: BarChart3,
  TABLE_BLOCK: BarChart3,
  USER_INFO_BLOCK: Eye,
};

type TemplateCategory = "LIFE_CARD" | "CAREER_ANCHOR" | "COMBINED";

interface TemplateRow {
  id: string;
  template_name: string;
  template_category: TemplateCategory;
  version: string;
  description: string;
  is_published: boolean;
  is_archived: boolean;
  is_default: boolean;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sections?: SectionRow[];
}

interface SectionRow {
  id: string;
  template_id: string;
  section_name: string;
  section_name_en: string;
  display_order: number;
  section_type: string;
  mapping_key: string;
  content: string;
  content_en: string;
  is_locked: boolean;
  is_active: boolean;
}

/* ─── Default sections by category ─── */
function getDefaultSections(category: TemplateCategory): Omit<SectionRow, "id" | "template_id">[] {
  const base = { mapping_key: "", content: "", content_en: "", is_locked: false, is_active: true };
  if (category === "CAREER_ANCHOR") {
    return [
      { ...base, section_name: "封面資訊", section_name_en: "Cover Info", display_order: 0, section_type: "USER_INFO_BLOCK" },
      { ...base, section_name: "雷達圖", section_name_en: "Radar Chart", display_order: 1, section_type: "CHART_BLOCK", mapping_key: "radar" },
      { ...base, section_name: "分數區間解讀", section_name_en: "Score Range Analysis", display_order: 2, section_type: "SCORE_RANGE_MATCH", mapping_key: "score_range" },
      { ...base, section_name: "雙錨組合分析", section_name_en: "Dual Anchor Analysis", display_order: 3, section_type: "DUAL_MATCH", mapping_key: "dual_anchor" },
      { ...base, section_name: "三錨模型", section_name_en: "Tri-Anchor Model", display_order: 4, section_type: "TRI_MATCH", mapping_key: "tri_anchor" },
      { ...base, section_name: "行動建議", section_name_en: "Action Suggestions", display_order: 5, section_type: "STATIC_TEXT" },
    ];
  }
  if (category === "LIFE_CARD") {
    return [
      { ...base, section_name: "封面資訊", section_name_en: "Cover Info", display_order: 0, section_type: "USER_INFO_BLOCK" },
      { ...base, section_name: "Top 10 價值排序", section_name_en: "Top 10 Values", display_order: 1, section_type: "TABLE_BLOCK", mapping_key: "top10" },
      { ...base, section_name: "類別分佈圖", section_name_en: "Category Distribution", display_order: 2, section_type: "CHART_BLOCK", mapping_key: "category_dist" },
      { ...base, section_name: "核心價值解讀", section_name_en: "Core Values Interpretation", display_order: 3, section_type: "STATIC_TEXT" },
      { ...base, section_name: "取向分析", section_name_en: "Orientation Analysis", display_order: 4, section_type: "STATIC_TEXT" },
    ];
  }
  // COMBINED
  return [
    { ...base, section_name: "封面資訊", section_name_en: "Cover Info", display_order: 0, section_type: "USER_INFO_BLOCK" },
    { ...base, section_name: "整合定位", section_name_en: "Fusion Positioning", display_order: 1, section_type: "FUSION_MATCH", mapping_key: "fusion_position" },
    { ...base, section_name: "驅動力匹配", section_name_en: "Drive Match", display_order: 2, section_type: "FUSION_MATCH", mapping_key: "drive_match" },
    { ...base, section_name: "衝突風險", section_name_en: "Conflict Risk", display_order: 3, section_type: "STATIC_TEXT" },
    { ...base, section_name: "發展路徑", section_name_en: "Development Path", display_order: 4, section_type: "STATIC_TEXT" },
  ];
}

/* ═══════════════════════════════════════════════════════════ */
export default function ReportTemplatesPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const txt = TXT[language] || TXT["zh-TW"];

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<TemplateCategory | "ALL">("ALL");
  const [showArchived, setShowArchived] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);
  const [editingSections, setEditingSections] = useState<TemplateRow | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);

  // ─── Form state ───
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<TemplateCategory>("CAREER_ANCHOR");
  const [formVersion, setFormVersion] = useState("V1");
  const [formDescription, setFormDescription] = useState("");

  /* ─── Queries ─── */
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["report-templates", filterCategory, showArchived],
    queryFn: async () => {
      let query = supabase
        .from("report_templates")
        .select("*, sections:report_template_sections(*)")
        .order("created_at", { ascending: false });

      if (filterCategory !== "ALL") {
        query = query.eq("template_category", filterCategory);
      }
      if (!showArchived) {
        query = query.eq("is_archived", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TemplateRow[];
    },
  });

  const filtered = templates.filter((tpl) => {
    if (!search) return true;
    const lower = search.toLowerCase();
    return tpl.template_name.toLowerCase().includes(lower) || tpl.description?.toLowerCase().includes(lower);
  });

  /* ─── Mutations ─── */
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: created, error } = await supabase
        .from("report_templates")
        .insert({
          template_name: formName.trim(),
          template_category: formCategory,
          version: formVersion.trim() || "V1",
          description: formDescription.trim(),
          created_by: user?.id,
          updated_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert default sections
      const defaultSections = getDefaultSections(formCategory).map((sec) => ({
        ...sec,
        template_id: created.id,
      }));
      if (defaultSections.length > 0) {
        const { error: secError } = await supabase.from("report_template_sections").insert(defaultSections);
        if (secError) throw secError;
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
      setShowCreateModal(false);
      resetForm();
      toast.success(txt.createSuccess);
    },
    onError: () => toast.error(txt.error),
  });

  const updateMutation = useMutation({
    mutationFn: async (template: TemplateRow) => {
      const { error } = await supabase
        .from("report_templates")
        .update({
          template_name: template.template_name,
          version: template.version,
          description: template.description,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
      setEditingTemplate(null);
      toast.success(txt.updateSuccess);
    },
    onError: () => toast.error(txt.error),
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ templateId, publish }: { templateId: string; publish: boolean }) => {
      const { error } = await supabase
        .from("report_templates")
        .update({ is_published: publish, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq("id", templateId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
      toast.success(vars.publish ? txt.publishSuccess : txt.unpublishSuccess);
    },
    onError: () => toast.error(txt.error),
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ templateId, archive }: { templateId: string; archive: boolean }) => {
      const { error } = await supabase
        .from("report_templates")
        .update({ is_archived: archive, is_published: archive ? false : undefined, updated_by: user?.id })
        .eq("id", templateId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
      setDeleteConfirmId(null);
      toast.success(vars.archive ? txt.archiveSuccess : txt.restoreSuccess);
    },
    onError: () => toast.error(txt.error),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      // Delete sections first
      const { error: secError } = await supabase
        .from("report_template_sections")
        .delete()
        .eq("template_id", templateId);
      if (secError) throw secError;
      // Delete template
      const { error } = await supabase
        .from("report_templates")
        .delete()
        .eq("id", templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
      setPermanentDeleteId(null);
      toast.success(txt.deleteSuccess);
    },
    onError: () => toast.error(txt.error),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (source: TemplateRow) => {
      const { data: created, error } = await supabase
        .from("report_templates")
        .insert({
          template_name: `${source.template_name} (copy)`,
          template_category: source.template_category,
          version: source.version,
          description: source.description,
          created_by: user?.id,
          updated_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;

      if (source.sections && source.sections.length > 0) {
        const copiedSections = source.sections.map((sec) => ({
          template_id: created.id,
          section_name: sec.section_name,
          section_name_en: sec.section_name_en,
          display_order: sec.display_order,
          section_type: sec.section_type,
          mapping_key: sec.mapping_key,
          content: sec.content,
          content_en: sec.content_en,
          is_locked: false,
          is_active: sec.is_active,
        }));
        await supabase.from("report_template_sections").insert(copiedSections);
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
      toast.success(txt.duplicateSuccess);
    },
    onError: () => toast.error(txt.error),
  });

  /* ─── Section mutations ─── */
  const saveSectionsMutation = useMutation({
    mutationFn: async (sections: SectionRow[]) => {
      for (const sec of sections) {
        const { error } = await supabase
          .from("report_template_sections")
          .update({
            section_name: sec.section_name,
            section_name_en: sec.section_name_en,
            display_order: sec.display_order,
            section_type: sec.section_type,
            mapping_key: sec.mapping_key,
            content: sec.content,
            content_en: sec.content_en,
            is_locked: sec.is_locked,
            is_active: sec.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sec.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
      setEditingSections(null);
      toast.success(txt.updateSuccess);
    },
    onError: () => toast.error(txt.error),
  });

  const addSectionMutation = useMutation({
    mutationFn: async ({ templateId, maxOrder }: { templateId: string; maxOrder: number }) => {
      const { error } = await supabase.from("report_template_sections").insert({
        template_id: templateId,
        section_name: "新區塊",
        section_name_en: "New Section",
        display_order: maxOrder + 1,
        section_type: "STATIC_TEXT",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
      toast.success(txt.createSuccess);
    },
    onError: () => toast.error(txt.error),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase.from("report_template_sections").delete().eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
    },
  });

  const resetForm = useCallback(() => {
    setFormName("");
    setFormCategory("CAREER_ANCHOR");
    setFormVersion("V1");
    setFormDescription("");
  }, []);

  const getCategoryLabel = (category: TemplateCategory): string => {
    const map: Record<TemplateCategory, string> = {
      LIFE_CARD: txt.lifeCard,
      CAREER_ANCHOR: txt.careerAnchor,
      COMBINED: txt.combined,
    };
    return map[category] || category;
  };

  const getCategoryConfig = (category: TemplateCategory) =>
    CATEGORY_OPTIONS.find((c) => c.value === category) || CATEGORY_OPTIONS[1];

  /* ═══════════════════════════════ RENDER ═══════════════════════════════ */
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{txt.pageTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">{txt.pageDesc}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
          style={{ backgroundColor: "#1a3a5c" }}
        >
          <Plus className="w-4 h-4" /> {txt.createTemplate}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setFilterCategory("ALL")}
            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              filterCategory === "ALL" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {txt.allCategories}
          </button>
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                filterCategory === cat.value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <cat.icon className="w-3 h-3" />
              {getCategoryLabel(cat.value)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={txt.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>

        {/* Show archived toggle */}
        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
            className="rounded border-slate-300"
          />
          {txt.showArchived}
        </label>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
            <FileText className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-600">{txt.noTemplates}</p>
          <p className="text-xs text-slate-400">{txt.noTemplatesDesc}</p>
        </div>
      )}

      {/* Template Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl, index) => {
            const catCfg = getCategoryConfig(tpl.template_category);
            const sectionCount = tpl.sections?.filter((s) => s.is_active).length || 0;
            return (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={cn(
                  "relative bg-white border rounded-xl p-5 shadow-sm transition-all hover:shadow-md group",
                  tpl.is_archived ? "opacity-60 border-slate-200" : "border-slate-200/80"
                )}
              >
                {/* Category badge */}
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className={cn("text-[10px] px-2 h-6 gap-1", catCfg.color)}>
                    <catCfg.icon className="w-3 h-3" />
                    {getCategoryLabel(tpl.template_category)}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {tpl.is_default && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">{txt.default}</Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]",
                        tpl.is_archived ? "border-slate-300 text-slate-400" :
                        tpl.is_published ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                        "border-amber-200 bg-amber-50 text-amber-600"
                      )}
                    >
                      {tpl.is_archived ? txt.archived : tpl.is_published ? txt.published : txt.draft}
                    </Badge>
                  </div>
                </div>

                {/* Name & meta */}
                <h3 className="text-sm font-bold text-slate-800 mb-1 line-clamp-1">{tpl.template_name}</h3>
                {tpl.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{tpl.description}</p>}

                <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-4">
                  <span>{txt.version}: {tpl.version}</span>
                  <span>·</span>
                  <span>{sectionCount} {txt.sections}</span>
                  {tpl.usage_count > 0 && (
                    <>
                      <span>·</span>
                      <span>{tpl.usage_count} {txt.usageCount}</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setEditingSections(tpl)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" /> {txt.editSections}
                  </button>
                  <button
                    onClick={() => {
                      setEditingTemplate(tpl);
                      setFormName(tpl.template_name);
                      setFormVersion(tpl.version);
                      setFormDescription(tpl.description || "");
                      setFormCategory(tpl.template_category);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    title={txt.rename}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => togglePublishMutation.mutate({ templateId: tpl.id, publish: !tpl.is_published })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    title={tpl.is_published ? txt.unpublish : txt.publish}
                  >
                    {tpl.is_published ? <ToggleRight className="w-3.5 h-3.5 text-emerald-500" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => duplicateMutation.mutate(tpl)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    title={txt.duplicate}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {tpl.is_archived ? (
                    <button
                      onClick={() => archiveMutation.mutate({ templateId: tpl.id, archive: false })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                      title={txt.restore}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(tpl.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                      title={txt.archive}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setPermanentDeleteId(tpl.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                    title={txt.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ CREATE / EDIT MODAL ═══ */}
      <AnimatePresence>
        {(showCreateModal || editingTemplate) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => { setShowCreateModal(false); setEditingTemplate(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingTemplate ? txt.editTitle : txt.createTitle}
                </h3>
                <button
                  onClick={() => { setShowCreateModal(false); setEditingTemplate(null); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="px-6 pb-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{txt.templateName}</label>
                  <input
                    value={formName}
                    onChange={(event) => setFormName(event.target.value)}
                    placeholder={txt.templateNamePlaceholder}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                {!editingTemplate && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{txt.category}</label>
                    <div className="flex gap-2">
                      {CATEGORY_OPTIONS.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setFormCategory(cat.value)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border transition-all",
                            formCategory === cat.value ? cn(cat.color, "ring-2 ring-offset-1") : "border-slate-200 text-slate-500 hover:border-slate-300"
                          )}
                        >
                          <cat.icon className="w-4 h-4" />
                          {getCategoryLabel(cat.value)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{txt.versionLabel}</label>
                    <input
                      value={formVersion}
                      onChange={(event) => setFormVersion(event.target.value)}
                      placeholder={txt.versionPlaceholder}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{txt.description}</label>
                    <input
                      value={formDescription}
                      onChange={(event) => setFormDescription(event.target.value)}
                      placeholder={txt.descriptionPlaceholder}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => { setShowCreateModal(false); setEditingTemplate(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {txt.cancel}
                </button>
                <button
                  onClick={() => {
                    if (!formName.trim()) return;
                    if (editingTemplate) {
                      updateMutation.mutate({
                        ...editingTemplate,
                        template_name: formName.trim(),
                        version: formVersion.trim(),
                        description: formDescription.trim(),
                      });
                    } else {
                      createMutation.mutate();
                    }
                  }}
                  disabled={!formName.trim() || createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:shadow-lg"
                  style={{ backgroundColor: "#1a3a5c" }}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : txt.save}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SECTION EDITOR MODAL ═══ */}
      <AnimatePresence>
        {editingSections && (
          <SectionEditorModal
            template={editingSections}
            txt={txt}
            language={language}
            onClose={() => setEditingSections(null)}
            onSave={(sections) => saveSectionsMutation.mutate(sections)}
            onAdd={(templateId, maxOrder) => addSectionMutation.mutate({ templateId, maxOrder })}
            onDelete={(sectionId) => deleteSectionMutation.mutate(sectionId)}
            saving={saveSectionsMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirmId(null)}
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
              <p className="text-sm text-slate-700 mb-6">{txt.archiveConfirm}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {txt.cancel}
                </button>
                <button
                  onClick={() => archiveMutation.mutate({ templateId: deleteConfirmId, archive: true })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600"
                >
                  {txt.archive}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PERMANENT DELETE CONFIRMATION ═══ */}
      <AnimatePresence>
        {permanentDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setPermanentDeleteId(null)}
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
              <p className="text-sm text-slate-700 mb-6">{txt.deleteConfirm}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPermanentDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {txt.cancel}
                </button>
                <button
                  onClick={() => permanentDeleteMutation.mutate(permanentDeleteId)}
                  disabled={permanentDeleteMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
                >
                  {permanentDeleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : txt.delete}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* Section Editor Modal Component                              */
/* ═══════════════════════════════════════════════════════════ */
function SectionEditorModal({
  template,
  txt,
  language,
  onClose,
  onSave,
  onAdd,
  onDelete,
  saving,
}: {
  template: TemplateRow;
  txt: Record<string, string>;
  language: string;
  onClose: () => void;
  onSave: (sections: SectionRow[]) => void;
  onAdd: (templateId: string, maxOrder: number) => void;
  onDelete: (sectionId: string) => void;
  saving: boolean;
}) {
  const [localSections, setLocalSections] = useState<SectionRow[]>(
    [...(template.sections || [])].sort((a, b) => a.display_order - b.display_order)
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updateSection = (sectionId: string, updates: Partial<SectionRow>) => {
    setLocalSections((prev) =>
      prev.map((sec) => (sec.id === sectionId ? { ...sec, ...updates } : sec))
    );
  };

  const handleDelete = (sectionId: string) => {
    setLocalSections((prev) => prev.filter((sec) => sec.id !== sectionId));
    onDelete(sectionId);
  };

  const maxOrder = localSections.reduce((max, sec) => Math.max(max, sec.display_order), -1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">{txt.editSections}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{template.template_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Sections list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {localSections.map((sec, idx) => {
            const IconCmp = SECTION_TYPE_ICONS[sec.section_type] || FileText;
            const isExpanded = expandedId === sec.id;
            return (
              <div
                key={sec.id}
                className={cn(
                  "border rounded-xl transition-all",
                  sec.is_active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"
                )}
              >
                {/* Section header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : sec.id)}
                >
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  <span className="text-xs text-slate-400 font-mono w-5">{idx + 1}</span>
                  <IconCmp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700 flex-1 truncate">{sec.section_name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 h-5 border-slate-200 text-slate-400">
                    {(txt as Record<string, string>)[sec.section_type] || sec.section_type}
                  </Badge>
                  {sec.is_locked && <Lock className="w-3 h-3 text-amber-500" />}
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isExpanded && "rotate-180")} />
                </div>

                {/* Expanded editor */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 mb-1 block">{txt.sectionName}</label>
                            <input
                              value={sec.section_name}
                              onChange={(event) => updateSection(sec.id, { section_name: event.target.value })}
                              disabled={sec.is_locked}
                              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-50"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 mb-1 block">{txt.sectionType}</label>
                            <select
                              value={sec.section_type}
                              onChange={(event) => updateSection(sec.id, { section_type: event.target.value })}
                              disabled={sec.is_locked}
                              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-50"
                            >
                              {SECTION_TYPES.map((st) => (
                                <option key={st} value={st}>{(txt as Record<string, string>)[st] || st}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 mb-1 block">{txt.mappingKey}</label>
                          <input
                            value={sec.mapping_key}
                            onChange={(event) => updateSection(sec.id, { mapping_key: event.target.value })}
                            disabled={sec.is_locked}
                            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-50"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 mb-1 block">{txt.content}</label>
                          <textarea
                            value={sec.content}
                            onChange={(event) => updateSection(sec.id, { content: event.target.value })}
                            disabled={sec.is_locked}
                            rows={3}
                            placeholder={txt.contentPlaceholder}
                            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none disabled:bg-slate-50"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sec.is_active}
                                onChange={(event) => updateSection(sec.id, { is_active: event.target.checked })}
                                className="rounded border-slate-300"
                              />
                              {txt.active}
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sec.is_locked}
                                onChange={(event) => updateSection(sec.id, { is_locked: event.target.checked })}
                                className="rounded border-slate-300"
                              />
                              {txt.locked}
                            </label>
                          </div>
                          <button
                            onClick={() => handleDelete(sec.id)}
                            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> {txt.delete}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => onAdd(template.id, maxOrder)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50"
          >
            <Plus className="w-3.5 h-3.5" /> {txt.addSection}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              {txt.cancel}
            </button>
            <button
              onClick={() => onSave(localSections)}
              disabled={saving}
              className="px-6 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:shadow-lg"
              style={{ backgroundColor: "#1a3a5c" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : txt.save}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
