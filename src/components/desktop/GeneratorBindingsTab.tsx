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
  Plus, Link2, Unlink, Search, Loader2, User, Building2,
  AlertTriangle, Briefcase, Sparkles, Combine, Filter,
} from "lucide-react";
import { getCategoryLabel, getCategoryColor } from "@/lib/reportConstants";

/* ─── i18n ─── */
const TXT = {
  en: {
    title: "Generator Bindings",
    desc: "Bind report generators to specific users or organizations. Bound targets use the designated generator instead of the global active one.",
    addBinding: "Add Binding",
    noBindings: "No bindings yet",
    noBindingsDesc: "All users currently use the global active generator for each category.",
    bindingTypeLabel: "Binding Type",
    bindingTypeUser: "User",
    bindingTypeOrg: "Organization",
    selectGenerator: "Select Generator",
    selectUser: "Select User",
    selectOrg: "Select Organization",
    searchUser: "Search by name or email...",
    searchOrg: "Search organization name...",
    generatorLabel: "Generator",
    targetLabel: "Target",
    typeLabel: "Type",
    boundAtLabel: "Bound At",
    actionsLabel: "Actions",
    unbind: "Unbind",
    unbindConfirm: "Are you sure you want to remove this binding? The target will revert to using the global active generator.",
    unbindSuccess: "Binding removed",
    bindSuccess: "Binding created successfully",
    bindError: "Failed to create binding",
    cancel: "Cancel",
    confirm: "Bind",
    priority: "Priority: User binding > Organization binding > Global active",
    filterAll: "All",
    filterUser: "Users",
    filterOrg: "Organizations",
    noGenerators: "No generators available",
    noUsers: "No users found",
    noOrgs: "No organizations found",
    alreadyBound: "This target is already bound to a generator for this category. Creating a new binding will replace the existing one.",
  },
  "zh-TW": {
    title: "綁定管理",
    desc: "將報告生成器綁定到特定用戶或機構。被綁定的目標將使用指定的生成器，而非全局啟用的生成器。",
    addBinding: "新增綁定",
    noBindings: "尚無綁定",
    noBindingsDesc: "所有用戶目前都使用每個類別的全局啟用生成器。",
    bindingTypeLabel: "綁定類型",
    bindingTypeUser: "用戶",
    bindingTypeOrg: "機構",
    selectGenerator: "選擇生成器",
    selectUser: "選擇用戶",
    selectOrg: "選擇機構",
    searchUser: "搜尋姓名或郵箱...",
    searchOrg: "搜尋機構名稱...",
    generatorLabel: "生成器",
    targetLabel: "目標",
    typeLabel: "類型",
    boundAtLabel: "綁定時間",
    actionsLabel: "操作",
    unbind: "解除綁定",
    unbindConfirm: "確定要解除此綁定嗎？目標將恢復使用全局啟用的生成器。",
    unbindSuccess: "綁定已解除",
    bindSuccess: "綁定創建成功",
    bindError: "綁定創建失敗",
    cancel: "取消",
    confirm: "綁定",
    priority: "優先順序：用戶綁定 > 機構綁定 > 全局啟用",
    filterAll: "全部",
    filterUser: "用戶",
    filterOrg: "機構",
    noGenerators: "暫無可用生成器",
    noUsers: "未找到用戶",
    noOrgs: "未找到機構",
    alreadyBound: "此目標已綁定了此類別的生成器。新增綁定將替換現有綁定。",
  },
  "zh-CN": {
    title: "绑定管理",
    desc: "将报告生成器绑定到特定用户或机构。被绑定的目标将使用指定的生成器，而非全局启用的生成器。",
    addBinding: "新增绑定",
    noBindings: "暂无绑定",
    noBindingsDesc: "所有用户目前都使用每个类别的全局启用生成器。",
    bindingTypeLabel: "绑定类型",
    bindingTypeUser: "用户",
    bindingTypeOrg: "机构",
    selectGenerator: "选择生成器",
    selectUser: "选择用户",
    selectOrg: "选择机构",
    searchUser: "搜索姓名或邮箱...",
    searchOrg: "搜索机构名称...",
    generatorLabel: "生成器",
    targetLabel: "目标",
    typeLabel: "类型",
    boundAtLabel: "绑定时间",
    actionsLabel: "操作",
    unbind: "解除绑定",
    unbindConfirm: "确定要解除此绑定吗？目标将恢复使用全局启用的生成器。",
    unbindSuccess: "绑定已解除",
    bindSuccess: "绑定创建成功",
    bindError: "绑定创建失败",
    cancel: "取消",
    confirm: "绑定",
    priority: "优先顺序：用户绑定 > 机构绑定 > 全局启用",
    filterAll: "全部",
    filterUser: "用户",
    filterOrg: "机构",
    noGenerators: "暂无可用生成器",
    noUsers: "未找到用户",
    noOrgs: "未找到机构",
    alreadyBound: "此目标已绑定了此类别的生成器。新增绑定将替换现有绑定。",
  },
};

const CATEGORY_ICONS: Record<string, typeof Briefcase> = {
  CAREER_ANCHOR: Briefcase,
  LIFE_CARD: Sparkles,
  COMBINED: Combine,
};

export default function GeneratorBindingsTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const txt = TXT[language] || TXT["zh-TW"];

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [unbindId, setUnbindId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "user" | "organization">("all");

  // Add binding form state
  const [bindType, setBindType] = useState<"user" | "organization">("user");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [targetSearch, setTargetSearch] = useState("");

  /* ═══ QUERIES ═══ */

  const { data: bindings = [], isLoading: bindingsLoading } = useQuery({
    queryKey: ["generator-bindings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("generator_bindings")
        .select("*, version:report_versions(id, version_number, assessment_type, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Enrich with target names
      const enriched = await Promise.all(
        (data || []).map(async (binding: any) => {
          if (binding.binding_type === "user") {
            const { data: profile } = await (supabase as any)
              .from("profiles")
              .select("full_name, email")
              .eq("id", binding.target_id)
              .single();
            return { ...binding, target_name: profile?.full_name || profile?.email || binding.target_id };
          } else {
            const { data: org } = await (supabase as any)
              .from("organizations")
              .select("name")
              .eq("id", binding.target_id)
              .single();
            return { ...binding, target_name: org?.name || binding.target_id };
          }
        })
      );
      return enriched;
    },
  });

  const filteredBindings = useMemo(() => {
    if (typeFilter === "all") return bindings;
    return bindings.filter((binding: any) => binding.binding_type === typeFilter);
  }, [bindings, typeFilter]);

  const { data: allVersions = [] } = useQuery({
    queryKey: ["all-report-versions-for-binding"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("report_versions")
        .select("id, version_number, assessment_type, status")
        .order("assessment_type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: showAddDialog,
  });

  const { data: searchedUsers = [] } = useQuery({
    queryKey: ["binding-search-users", targetSearch],
    queryFn: async () => {
      if (!targetSearch.trim()) return [];
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, email, organization_id")
        .or(`full_name.ilike.%${targetSearch}%,email.ilike.%${targetSearch}%`)
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: showAddDialog && bindType === "user" && targetSearch.trim().length > 0,
  });

  const { data: searchedOrgs = [] } = useQuery({
    queryKey: ["binding-search-orgs", targetSearch],
    queryFn: async () => {
      if (!targetSearch.trim()) {
        const { data, error } = await (supabase as any)
          .from("organizations")
          .select("id, name")
          .order("name")
          .limit(50);
        if (error) throw error;
        return data || [];
      }
      const { data, error } = await (supabase as any)
        .from("organizations")
        .select("id, name")
        .ilike("name", `%${targetSearch}%`)
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: showAddDialog && bindType === "organization",
  });

  /* ═══ MUTATIONS ═══ */

  const createBindingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVersionId || !selectedTargetId) throw new Error("Missing selection");

      // Check for existing binding with same assessment_type for this target
      const selectedVersion = allVersions.find((version: any) => version.id === selectedVersionId);
      if (selectedVersion) {
        // Find all versions of the same assessment_type
        const sameTypeVersionIds = allVersions
          .filter((version: any) => version.assessment_type === selectedVersion.assessment_type)
          .map((version: any) => version.id);

        // Remove existing bindings for this target + assessment_type
        if (sameTypeVersionIds.length > 0) {
          await (supabase as any)
            .from("generator_bindings")
            .delete()
            .eq("binding_type", bindType)
            .eq("target_id", selectedTargetId)
            .in("version_id", sameTypeVersionIds);
        }
      }

      const { error } = await (supabase as any)
        .from("generator_bindings")
        .insert({
          version_id: selectedVersionId,
          binding_type: bindType,
          target_id: selectedTargetId,
          bound_by: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generator-bindings"] });
      setShowAddDialog(false);
      resetForm();
      toast.success(txt.bindSuccess);
    },
    onError: (error: any) => toast.error(error.message || txt.bindError),
  });

  const unbindMutation = useMutation({
    mutationFn: async (bindingId: string) => {
      const { error } = await (supabase as any)
        .from("generator_bindings")
        .delete()
        .eq("id", bindingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generator-bindings"] });
      setUnbindId(null);
      toast.success(txt.unbindSuccess);
    },
    onError: (error: any) => toast.error(error.message),
  });

  function resetForm() {
    setBindType("user");
    setSelectedVersionId("");
    setSelectedTargetId("");
    setTargetSearch("");
  }

  /* ═══ RENDER ═══ */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{txt.desc}</p>
          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {txt.priority}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddDialog(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:shadow-lg transition-all"
          style={{ backgroundColor: "#1a3a5c" }}
        >
          <Plus className="w-4 h-4" /> {txt.addBinding}
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        {(["all", "user", "organization"] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setTypeFilter(filterType)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5",
              typeFilter === filterType
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            )}
          >
            {filterType === "all" && txt.filterAll}
            {filterType === "user" && <><User className="w-3 h-3" /> {txt.filterUser}</>}
            {filterType === "organization" && <><Building2 className="w-3 h-3" /> {txt.filterOrg}</>}
          </button>
        ))}
      </div>

      {/* Bindings list */}
      {bindingsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filteredBindings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Link2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">{txt.noBindings}</p>
          <p className="text-xs text-slate-400 mt-1">{txt.noBindingsDesc}</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{txt.generatorLabel}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{txt.typeLabel}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{txt.targetLabel}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{txt.boundAtLabel}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">{txt.actionsLabel}</th>
              </tr>
            </thead>
            <tbody>
              {filteredBindings.map((binding: any) => {
                const CatIcon = CATEGORY_ICONS[binding.version?.assessment_type] || Briefcase;
                return (
                  <tr key={binding.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CatIcon className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-800">{binding.version?.version_number || "—"}</span>
                        <Badge variant="outline" className={cn("text-[10px]", getCategoryColor(binding.version?.assessment_type))}>
                          {getCategoryLabel(binding.version?.assessment_type, language)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-[10px]",
                        binding.binding_type === "user"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}>
                        {binding.binding_type === "user" ? (
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {txt.bindingTypeUser}</span>
                        ) : (
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {txt.bindingTypeOrg}</span>
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{binding.target_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(binding.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setUnbindId(binding.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title={txt.unbind}
                      >
                        <Unlink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Add Binding Dialog ─── */}
      <AnimatePresence>
        {showAddDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setShowAddDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-600" />
                {txt.addBinding}
              </h3>

              {/* Binding Type Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-2 block">{txt.bindingTypeLabel}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setBindType("user"); setSelectedTargetId(""); setTargetSearch(""); }}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                      bindType === "user"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <User className={cn("w-5 h-5", bindType === "user" ? "text-blue-600" : "text-slate-400")} />
                    <span className={cn("text-sm font-medium", bindType === "user" ? "text-blue-700" : "text-slate-600")}>
                      {txt.bindingTypeUser}
                    </span>
                  </button>
                  <button
                    onClick={() => { setBindType("organization"); setSelectedTargetId(""); setTargetSearch(""); }}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                      bindType === "organization"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <Building2 className={cn("w-5 h-5", bindType === "organization" ? "text-emerald-600" : "text-slate-400")} />
                    <span className={cn("text-sm font-medium", bindType === "organization" ? "text-emerald-700" : "text-slate-600")}>
                      {txt.bindingTypeOrg}
                    </span>
                  </button>
                </div>
              </div>

              {/* Generator Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{txt.selectGenerator}</label>
                <select
                  value={selectedVersionId}
                  onChange={(event) => setSelectedVersionId(event.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200 bg-white"
                >
                  <option value="">{txt.selectGenerator}</option>
                  {allVersions.map((version: any) => (
                    <option key={version.id} value={version.id}>
                      {version.version_number} — {getCategoryLabel(version.assessment_type, language)} [{version.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                  {bindType === "user" ? txt.selectUser : txt.selectOrg}
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={targetSearch}
                    onChange={(event) => { setTargetSearch(event.target.value); setSelectedTargetId(""); }}
                    placeholder={bindType === "user" ? txt.searchUser : txt.searchOrg}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                {/* Results list */}
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                  {bindType === "user" ? (
                    searchedUsers.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">
                        {targetSearch.trim() ? txt.noUsers : txt.searchUser}
                      </div>
                    ) : (
                      searchedUsers.map((userItem: any) => (
                        <button
                          key={userItem.id}
                          onClick={() => setSelectedTargetId(userItem.id)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0",
                            selectedTargetId === userItem.id && "bg-blue-50 hover:bg-blue-50"
                          )}
                        >
                          <div>
                            <span className="font-medium text-slate-800">{userItem.full_name || "—"}</span>
                            <span className="text-xs text-slate-400 ml-2">{userItem.email}</span>
                          </div>
                          {selectedTargetId === userItem.id && (
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </button>
                      ))
                    )
                  ) : (
                    searchedOrgs.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">{txt.noOrgs}</div>
                    ) : (
                      searchedOrgs.map((orgItem: any) => (
                        <button
                          key={orgItem.id}
                          onClick={() => setSelectedTargetId(orgItem.id)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0",
                            selectedTargetId === orgItem.id && "bg-emerald-50 hover:bg-emerald-50"
                          )}
                        >
                          <span className="font-medium text-slate-800">{orgItem.name}</span>
                          {selectedTargetId === orgItem.id && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </button>
                      ))
                    )
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {txt.cancel}
                </button>
                <button
                  onClick={() => createBindingMutation.mutate()}
                  disabled={!selectedVersionId || !selectedTargetId || createBindingMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:shadow-lg transition-all"
                  style={{ backgroundColor: "#1a3a5c" }}
                >
                  {createBindingMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    txt.confirm
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Unbind Confirm Dialog ─── */}
      <AnimatePresence>
        {unbindId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setUnbindId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Unlink className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-slate-700 mb-6">{txt.unbindConfirm}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUnbindId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {txt.cancel}
                </button>
                <button
                  onClick={() => unbindMutation.mutate(unbindId)}
                  disabled={unbindMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
                >
                  {unbindMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    txt.unbind
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
