import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Tag, Edit, Trash2, X, Save,
  Loader2, AlertTriangle, ToggleLeft, ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type ModalMode = "add" | "edit" | "delete" | null;

interface FeaturePermissions {
  career_anchor: boolean;
  ideal_card: boolean;
  combined: boolean;
  report_download: boolean;
  analytics: boolean;
  client_management: boolean;
  consultant_notes: boolean;
  trend_analysis: boolean;
  certification: boolean;
  cdu_records: boolean;
  message: boolean;
  anonymous_assessment: boolean;
  cp_points: boolean;
}

const DEFAULT_PERMISSIONS: FeaturePermissions = {
  career_anchor: false,
  ideal_card: false,
  combined: false,
  report_download: false,
  analytics: false,
  client_management: false,
  consultant_notes: false,
  trend_analysis: false,
  certification: false,
  cdu_records: false,
  message: false,
  anonymous_assessment: false,
  cp_points: false,
};

interface OrgTypeFormData {
  id: string;
  code: string;
  nameZhCn: string;
  nameZhTw: string;
  nameEn: string;
  descriptionZhCn: string;
  descriptionZhTw: string;
  descriptionEn: string;
  defaultFeaturePermissions: FeaturePermissions;
  isActive: boolean;
  sortOrder: number;
}

const initialFormData: OrgTypeFormData = {
  id: "",
  code: "",
  nameZhCn: "",
  nameZhTw: "",
  nameEn: "",
  descriptionZhCn: "",
  descriptionZhTw: "",
  descriptionEn: "",
  defaultFeaturePermissions: { ...DEFAULT_PERMISSIONS },
  isActive: true,
  sortOrder: 0,
};

interface FeatureKeyInfo {
  key: keyof FeaturePermissions;
  labelEn: string;
  labelZhTw: string;
  labelZhCn: string;
  descEn: string;
  descZhTw: string;
  descZhCn: string;
}

const FEATURE_KEYS: FeatureKeyInfo[] = [
  { key: "career_anchor", labelEn: "Career Anchor", labelZhTw: "職業錨測評", labelZhCn: "职业锚测评", descEn: "8-dimension career anchor assessment", descZhTw: "8維度職業錨測評", descZhCn: "8维度职业锚测评" },
  { key: "ideal_card", labelEn: "Espresso Card", labelZhTw: "理想人生卡", labelZhCn: "理想人生卡", descEn: "Core life values card sorting", descZhTw: "核心人生價值卡排序", descZhCn: "核心人生价值卡排序" },
  { key: "combined", labelEn: "Integration Assessment", labelZhTw: "整合測評", labelZhCn: "整合测评", descEn: "Anchor + Espresso Card + Integration", descZhTw: "職業錨＋人生卡＋整合", descZhCn: "职业锚＋人生卡＋整合" },
  { key: "report_download", labelEn: "Report Download", labelZhTw: "報告下載", labelZhCn: "报告下载", descEn: "Download assessment reports", descZhTw: "下載測評報告", descZhCn: "下载测评报告" },
  { key: "analytics", labelEn: "Analytics", labelZhTw: "資料分析", labelZhCn: "数据分析", descEn: "Data analytics and insights", descZhTw: "資料分析與洞察", descZhCn: "数据分析与洞察" },
  { key: "client_management", labelEn: "Client Management", labelZhTw: "客戶管理", labelZhCn: "客户管理", descEn: "Manage client profiles", descZhTw: "管理客戶檔案", descZhCn: "管理客户档案" },
  { key: "consultant_notes", labelEn: "Consultant Notes", labelZhTw: "諮詢筆記", labelZhCn: "咨询笔记", descEn: "Internal consultation notes", descZhTw: "內部諮詢筆記", descZhCn: "内部咨询笔记" },
  { key: "trend_analysis", labelEn: "Trend Analysis", labelZhTw: "趨勢分析", labelZhCn: "趋势分析", descEn: "Long-term assessment trends", descZhTw: "長期測評趨勢", descZhCn: "长期测评趋势" },
  { key: "certification", labelEn: "Certification", labelZhTw: "認證管理", labelZhCn: "认证管理", descEn: "Professional certification", descZhTw: "專業認證管理", descZhCn: "专业认证管理" },
  { key: "cdu_records", labelEn: "CDU Records", labelZhTw: "CDU 記錄", labelZhCn: "CDU 记录", descEn: "Continuing development units", descZhTw: "持續發展學分", descZhCn: "持续发展学分" },
  { key: "message", labelEn: "Messaging", labelZhTw: "訊息功能", labelZhCn: "消息功能", descEn: "In-platform messaging", descZhTw: "平台內訊息", descZhCn: "平台内消息" },
  { key: "anonymous_assessment", labelEn: "Anonymous Assessment", labelZhTw: "匿名測評", labelZhCn: "匿名测评", descEn: "Anonymous batch assessment", descZhTw: "匿名批次測評", descZhCn: "匿名批次测评" },
{ key: "cp_points", labelEn: "CP Points System", labelZhTw: "CP 點數系統", labelZhCn: "CP 点数系统", descEn: "Career points wallet & recharge", descZhTw: "生涯點錢包與充值", descZhCn: "生涯点钱包与充值" },
];

export default function OrgTypesPage() {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formData, setFormData] = useState<OrgTypeFormData>(initialFormData);

  const { data: orgTypes, isLoading } = useQuery({
    queryKey: ["organization_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_types")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Array<{
        id: string;
        code: string;
        name_zh_cn: string;
        name_zh_tw: string;
        name_en: string;
        description_zh_cn: string;
        description_zh_tw: string;
        description_en: string;
        default_feature_permissions: Record<string, boolean>;
        is_active: boolean;
        sort_order: number;
        created_at: string;
        updated_at: string;
      }>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formValues: OrgTypeFormData) => {
      const { error } = await supabase.from("organization_types").insert({
        code: formValues.code,
        name_zh_cn: formValues.nameZhCn,
        name_zh_tw: formValues.nameZhTw,
        name_en: formValues.nameEn,
        description_zh_cn: formValues.descriptionZhCn,
        description_zh_tw: formValues.descriptionZhTw,
        description_en: formValues.descriptionEn,
        default_feature_permissions: formValues.defaultFeaturePermissions,
        is_active: formValues.isActive,
        sort_order: formValues.sortOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization_types"] });
      toast.success(language === "en" ? "Organization type created" : language === "zh-TW" ? "機構類型已建立" : "机构类型已创建");
      setModalMode(null);
    },
    onError: () => {
      toast.error(language === "en" ? "Failed to create" : language === "zh-TW" ? "建立失敗" : "创建失败");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formValues: OrgTypeFormData) => {
      const { error } = await supabase
        .from("organization_types")
        .update({
          code: formValues.code,
          name_zh_cn: formValues.nameZhCn,
          name_zh_tw: formValues.nameZhTw,
          name_en: formValues.nameEn,
          description_zh_cn: formValues.descriptionZhCn,
          description_zh_tw: formValues.descriptionZhTw,
          description_en: formValues.descriptionEn,
          default_feature_permissions: formValues.defaultFeaturePermissions,
          is_active: formValues.isActive,
          sort_order: formValues.sortOrder,
          updated_at: new Date().toISOString(),
        })
        .eq("id", formValues.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization_types"] });
      toast.success(language === "en" ? "Organization type updated" : language === "zh-TW" ? "機構類型已更新" : "机构类型已更新");
      setModalMode(null);
    },
    onError: () => {
      toast.error(language === "en" ? "Failed to update" : language === "zh-TW" ? "更新失敗" : "更新失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (typeId: string) => {
      const { error } = await supabase.from("organization_types").delete().eq("id", typeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization_types"] });
      toast.success(language === "en" ? "Organization type deleted" : language === "zh-TW" ? "機構類型已刪除" : "机构类型已删除");
      setModalMode(null);
    },
    onError: () => {
      toast.error(language === "en" ? "Failed to delete" : language === "zh-TW" ? "刪除失敗" : "删除失败");
    },
  });

  const dataList = orgTypes || [];
  const filtered = dataList.filter((orgType) => {
    const name = language === "en" ? orgType.name_en : language === "zh-TW" ? orgType.name_zh_tw : orgType.name_zh_cn;
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || orgType.code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getDisplayName = (orgType: typeof dataList[0]) =>
    language === "en" ? orgType.name_en : language === "zh-TW" ? orgType.name_zh_tw : orgType.name_zh_cn;

  const getDescription = (orgType: typeof dataList[0]) =>
    language === "en" ? orgType.description_en : language === "zh-TW" ? orgType.description_zh_tw : orgType.description_zh_cn;

  const countEnabledPermissions = (permissions: Record<string, boolean>) =>
    Object.values(permissions).filter(Boolean).length;

  const openAdd = () => {
    setFormData({ ...initialFormData, sortOrder: dataList.length + 1 });
    setModalMode("add");
  };

  const openEdit = (orgType: typeof dataList[0]) => {
    const permissions = orgType.default_feature_permissions || {};
    setFormData({
      id: orgType.id,
      code: orgType.code,
      nameZhCn: orgType.name_zh_cn,
      nameZhTw: orgType.name_zh_tw,
      nameEn: orgType.name_en,
      descriptionZhCn: orgType.description_zh_cn,
      descriptionZhTw: orgType.description_zh_tw,
      descriptionEn: orgType.description_en,
      defaultFeaturePermissions: { ...DEFAULT_PERMISSIONS, ...permissions } as FeaturePermissions,
      isActive: orgType.is_active,
      sortOrder: orgType.sort_order,
    });
    setModalMode("edit");
  };

  const openDelete = (orgType: typeof dataList[0]) => {
    setFormData({ ...initialFormData, id: orgType.id, code: orgType.code, nameZhCn: orgType.name_zh_cn, nameZhTw: orgType.name_zh_tw, nameEn: orgType.name_en });
    setModalMode("delete");
  };

  const handleSave = () => {
    if (!formData.code || !formData.nameZhCn || !formData.nameZhTw || !formData.nameEn) {
      toast.error(language === "en" ? "Code and names are required" : language === "zh-TW" ? "代碼和名稱為必填" : "代码和名称为必填");
      return;
    }
    if (modalMode === "add") {
      createMutation.mutate(formData);
    } else if (modalMode === "edit") {
      updateMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate(formData.id);
  };

  const togglePermission = (key: keyof FeaturePermissions) => {
    setFormData({
      ...formData,
      defaultFeaturePermissions: {
        ...formData.defaultFeaturePermissions,
        [key]: !formData.defaultFeaturePermissions[key],
      },
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {language === "en" ? "Organization Types" : language === "zh-TW" ? "機構類型" : "机构类型"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === "en"
              ? "Define organization types with default feature permission templates"
              : language === "zh-TW"
              ? "定義機構類型及其預設功能權限模板"
              : "定义机构类型及其默认功能权限模板"}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {language === "en" ? "Add Type" : language === "zh-TW" ? "新增類型" : "新增类型"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{dataList.length}</div>
          <div className="text-xs text-muted-foreground">
            {language === "en" ? "Total Types" : language === "zh-TW" ? "類型總數" : "类型总数"}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{dataList.filter(t => t.is_active).length}</div>
          <div className="text-xs text-muted-foreground">
            {language === "en" ? "Active" : language === "zh-TW" ? "啟用中" : "启用中"}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{FEATURE_KEYS.length}</div>
          <div className="text-xs text-muted-foreground">
            {language === "en" ? "Feature Keys" : language === "zh-TW" ? "功能權限項" : "功能权限项"}
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={language === "en" ? "Search types..." : language === "zh-TW" ? "搜尋機構類型..." : "搜索机构类型..."}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
        />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">
                {language === "en" ? "Type" : language === "zh-TW" ? "類型" : "类型"}
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">
                {language === "en" ? "Code" : language === "zh-TW" ? "代碼" : "代码"}
              </th>
              <th className="text-center px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">
                {language === "en" ? "Permissions" : language === "zh-TW" ? "權限數" : "权限数"}
              </th>
              <th className="text-center px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">
                {language === "en" ? "Sort" : language === "zh-TW" ? "排序" : "排序"}
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">
                {language === "en" ? "Status" : language === "zh-TW" ? "狀態" : "状态"}
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase">
                {language === "en" ? "Actions" : "操作"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {language === "en" ? "No organization types found" : language === "zh-TW" ? "暫無機構類型" : "暂无机构类型"}
                </td>
              </tr>
            ) : filtered.map((orgType) => {
              const enabledCount = countEnabledPermissions(orgType.default_feature_permissions);
              return (
                <tr key={orgType.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-violet-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{getDisplayName(orgType)}</div>
                        <div className="text-xs text-muted-foreground max-w-[240px] truncate">{getDescription(orgType)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-muted text-muted-foreground">{orgType.code}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={cn(
                      "text-sm font-semibold",
                      enabledCount === FEATURE_KEYS.length ? "text-green-600" : enabledCount > 0 ? "text-amber-600" : "text-muted-foreground"
                    )}>
                      {enabledCount} / {FEATURE_KEYS.length}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center text-sm text-muted-foreground">{orgType.sort_order}</td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      "flex items-center gap-1.5 text-xs font-medium",
                      orgType.is_active ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {orgType.is_active
                        ? <><ToggleRight className="w-3.5 h-3.5" /> {language === "en" ? "Active" : language === "zh-TW" ? "啟用" : "启用"}</>
                        : <><ToggleLeft className="w-3.5 h-3.5" /> {language === "en" ? "Inactive" : language === "zh-TW" ? "停用" : "停用"}</>}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(orgType)} className="p-1.5 hover:bg-muted/20 rounded-lg" title={language === "en" ? "Edit" : "編輯"}>
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => openDelete(orgType)} className="p-1.5 hover:bg-destructive/10 rounded-lg" title={language === "en" ? "Delete" : "刪除"}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {(modalMode === "add" || modalMode === "edit") && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setModalMode(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  {modalMode === "add"
                    ? (language === "en" ? "Add Organization Type" : language === "zh-TW" ? "新增機構類型" : "新增机构类型")
                    : (language === "en" ? "Edit Organization Type" : language === "zh-TW" ? "編輯機構類型" : "编辑机构类型")}
                </h2>
                <button onClick={() => setModalMode(null)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Code + Sort */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      {language === "en" ? "Code" : language === "zh-TW" ? "代碼" : "代码"} *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(event) => setFormData({ ...formData, code: event.target.value })}
                      placeholder="enterprise"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      {language === "en" ? "Sort Order" : language === "zh-TW" ? "排序" : "排序"}
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(event) => setFormData({ ...formData, sortOrder: parseInt(event.target.value) || 0 })}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                </div>

                {/* Names */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {language === "en" ? "Name (Simplified Chinese)" : language === "zh-TW" ? "名稱（簡體中文）" : "名称（简体中文）"} *
                  </label>
                  <input
                    type="text"
                    value={formData.nameZhCn}
                    onChange={(event) => setFormData({ ...formData, nameZhCn: event.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {language === "en" ? "Name (Traditional Chinese)" : language === "zh-TW" ? "名稱（繁體中文）" : "名称（繁体中文）"} *
                  </label>
                  <input
                    type="text"
                    value={formData.nameZhTw}
                    onChange={(event) => setFormData({ ...formData, nameZhTw: event.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {language === "en" ? "Name (English)" : language === "zh-TW" ? "名稱（英文）" : "名称（英文）"} *
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(event) => setFormData({ ...formData, nameEn: event.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                {/* Descriptions */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    {language === "en" ? "Descriptions" : language === "zh-TW" ? "描述" : "描述"}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">{language === "en" ? "Simplified Chinese" : language === "zh-TW" ? "簡體中文" : "简体中文"}</label>
                      <input type="text" value={formData.descriptionZhCn} onChange={(event) => setFormData({ ...formData, descriptionZhCn: event.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">{language === "en" ? "Traditional Chinese" : language === "zh-TW" ? "繁體中文" : "繁体中文"}</label>
                      <input type="text" value={formData.descriptionZhTw} onChange={(event) => setFormData({ ...formData, descriptionZhTw: event.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">English</label>
                      <input type="text" value={formData.descriptionEn} onChange={(event) => setFormData({ ...formData, descriptionEn: event.target.value })} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                    </div>
                  </div>
                </div>

                {/* Active toggle */}
                <div className="border-t border-border pt-4">
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {language === "en" ? "Active" : language === "zh-TW" ? "啟用" : "启用"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        formData.isActive ? "bg-green-500" : "bg-muted"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                        formData.isActive ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </label>
                </div>

                {/* Feature Permissions */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      {language === "en" ? "Default Feature Permissions" : language === "zh-TW" ? "預設功能權限" : "默认功能权限"}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {countEnabledPermissions(formData.defaultFeaturePermissions)} / {FEATURE_KEYS.length}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {language === "en"
                      ? "These permissions are pre-filled when creating an organization with this type."
                      : language === "zh-TW"
                      ? "使用此類型建立機構時，將預填這些功能權限。"
                      : "使用此类型创建机构时，将预填这些功能权限。"}
                  </p>
                  <div className="space-y-2">
                    {FEATURE_KEYS.map((feature) => {
                      const featureLabel = language === "en" ? feature.labelEn : language === "zh-TW" ? feature.labelZhTw : feature.labelZhCn;
                      const featureDesc = language === "en" ? feature.descEn : language === "zh-TW" ? feature.descZhTw : feature.descZhCn;
                      const isEnabled = formData.defaultFeaturePermissions[feature.key];
                      return (
                        <label
                          key={feature.key}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/10 transition-colors cursor-pointer"
                        >
                          <div>
                            <div className="text-sm font-medium text-foreground">{featureLabel}</div>
                            <div className="text-xs text-muted-foreground">{featureDesc}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePermission(feature.key)}
                            className={cn(
                              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ml-3",
                              isEnabled ? "bg-green-500" : "bg-muted"
                            )}
                          >
                            <span className={cn(
                              "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm",
                              isEnabled ? "translate-x-[18px]" : "translate-x-[3px]"
                            )} />
                          </button>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                  {language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving
                    ? (language === "en" ? "Saving..." : language === "zh-TW" ? "儲存中..." : "保存中...")
                    : (language === "en" ? "Save" : language === "zh-TW" ? "儲存" : "保存")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {modalMode === "delete" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setModalMode(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-sm"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {language === "en" ? "Delete Type" : language === "zh-TW" ? "刪除類型" : "删除类型"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {language === "en"
                  ? `Are you sure you want to delete "${formData.nameEn}" (${formData.code})?`
                  : language === "zh-TW"
                  ? `確定要刪除「${formData.nameZhTw}」（${formData.code}）嗎？`
                  : `确定要删除「${formData.nameZhCn}」（${formData.code}）吗？`}
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                  {language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleteMutation.isPending
                    ? (language === "en" ? "Deleting..." : language === "zh-TW" ? "刪除中..." : "删除中...")
                    : (language === "en" ? "Delete" : language === "zh-TW" ? "刪除" : "删除")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
