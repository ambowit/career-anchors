import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Copy, ToggleLeft, ToggleRight,
  Loader2, Clock, CheckCircle2, XCircle,
  KeyRound, Users, Eye, ChevronDown, ChevronUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface OrgVerificationCodesProps {
  organizationId: string;
  organizationName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface AssessmentCode {
  id: string;
  organization_id: string;
  code: string;
  label: string | null;
  max_uses: number;
  used_count: number;
  max_uses_career_anchor: number;
  used_count_career_anchor: number;
  max_uses_ideal_card: number;
  used_count_ideal_card: number;
  max_uses_combined: number;
  used_count_combined: number;
  is_active: boolean;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface CodeUsageRecord {
  id: string;
  code_id: string;
  user_id: string;
  assessment_type: string;
  used_at: string;
  user_email?: string;
  user_name?: string;
}

function generateRandomCode(length = 8): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let index = 0; index < length; index++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function formatDateTime(dateString: string, language: string): string {
  const date = new Date(dateString);
  if (language === "en") {
    return date.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }
  return date.toLocaleDateString("zh-TW", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function OrgVerificationCodes({
  organizationId,
  organizationName,
  isOpen,
  onClose,
}: OrgVerificationCodesProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCode, setNewCode] = useState(generateRandomCode());
  const [newLabel, setNewLabel] = useState("");
  const [newMaxUsesCareerAnchor, setNewMaxUsesCareerAnchor] = useState("10");
  const [newMaxUsesIdealCard, setNewMaxUsesIdealCard] = useState("10");
  const [newMaxUsesCombined, setNewMaxUsesCombined] = useState("10");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [expandedCodeId, setExpandedCodeId] = useState<string | null>(null);

  // Fetch codes for this org
  const { data: codes, isLoading: codesLoading } = useQuery({
    queryKey: ["org_assessment_codes", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_assessment_codes")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AssessmentCode[];
    },
    enabled: isOpen,
  });

  // Fetch usage records for expanded code
  const { data: usageRecords, isLoading: usageLoading } = useQuery({
    queryKey: ["org_assessment_code_usage", expandedCodeId],
    queryFn: async () => {
      if (!expandedCodeId) return [];
      const { data, error } = await supabase
        .from("org_assessment_code_usage")
        .select("*")
        .eq("code_id", expandedCodeId)
        .order("used_at", { ascending: false });
      if (error) throw error;

      // Fetch user profiles for usage records
      const userIds = [...new Set(data.map((record: CodeUsageRecord) => record.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const profileMap = new Map(
          (profiles || []).map((profile: { id: string; full_name: string | null; email: string | null }) => [
            profile.id,
            { name: profile.full_name, email: profile.email },
          ])
        );

        return data.map((record: CodeUsageRecord) => {
          const profile = profileMap.get(record.user_id);
          return {
            ...record,
            user_name: profile?.name || null,
            user_email: profile?.email || null,
          };
        }) as CodeUsageRecord[];
      }

      return data as CodeUsageRecord[];
    },
    enabled: !!expandedCodeId,
  });

  // Create code mutation
  const createCodeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("org_assessment_codes")
        .insert({
          organization_id: organizationId,
          code: newCode.trim().toUpperCase(),
          label: newLabel.trim() || null,
          max_uses: (parseInt(newMaxUsesCareerAnchor) || 0) + (parseInt(newMaxUsesIdealCard) || 0) + (parseInt(newMaxUsesCombined) || 0),
          max_uses_career_anchor: parseInt(newMaxUsesCareerAnchor) || 0,
          max_uses_ideal_card: parseInt(newMaxUsesIdealCard) || 0,
          max_uses_combined: parseInt(newMaxUsesCombined) || 0,
          expires_at: newExpiresAt ? new Date(newExpiresAt).toISOString() : null,
          created_by: user?.id || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org_assessment_codes", organizationId] });
      toast.success(
        language === "en" ? "Verification code created" :
        language === "zh-TW" ? "驗證碼已建立" : "验证码已创建"
      );
      resetCreateForm();
    },
    onError: (error: Error) => {
      if (error.message?.includes("unique")) {
        toast.error(
          language === "en" ? "This code already exists for this organization" :
          language === "zh-TW" ? "此驗證碼在該機構已存在" : "此验证码在该机构已存在"
        );
      } else {
        toast.error(
          language === "en" ? "Failed to create code" :
          language === "zh-TW" ? "建立驗證碼失敗" : "创建验证码失败"
        );
      }
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ codeId, currentActive }: { codeId: string; currentActive: boolean }) => {
      const { error } = await supabase
        .from("org_assessment_codes")
        .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
        .eq("id", codeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org_assessment_codes", organizationId] });
    },
  });

  function resetCreateForm() {
    setShowCreateForm(false);
    setNewCode(generateRandomCode());
    setNewLabel("");
    setNewMaxUsesCareerAnchor("10");
    setNewMaxUsesIdealCard("10");
    setNewMaxUsesCombined("10");
    setNewExpiresAt("");
  }

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      toast.success(
        language === "en" ? "Code copied" :
        language === "zh-TW" ? "已複製" : "已复制"
      );
    });
  }

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    if (!isOpen || !organizationId) return;

    const channel = supabase
      .channel(`org-codes-${organizationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "org_assessment_codes", filter: `organization_id=eq.${organizationId}` },
        () => { queryClient.invalidateQueries({ queryKey: ["org_assessment_codes", organizationId] }); }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "org_assessment_code_usage" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["org_assessment_codes", organizationId] });
          if (expandedCodeId) {
            queryClient.invalidateQueries({ queryKey: ["org_assessment_code_usage", expandedCodeId] });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, organizationId, expandedCodeId, queryClient]);

  const stats = useMemo(() => {
    if (!codes) return { total: 0, active: 0, totalUsed: 0, totalRemaining: 0 };
    const activeOnes = codes.filter((code) => code.is_active);
    const totalUsed = codes.reduce((sum, code) => sum + code.used_count_career_anchor + code.used_count_ideal_card + code.used_count_combined, 0);
    const totalMax = codes.reduce((sum, code) => sum + code.max_uses_career_anchor + code.max_uses_ideal_card + code.max_uses_combined, 0);
    return { total: codes.length, active: activeOnes.length, totalUsed, totalRemaining: Math.max(totalMax - totalUsed, 0) };
  }, [codes]);

  const assessmentTypeLabel = (assessmentType: string) => {
    const labels: Record<string, Record<string, string>> = {
      career_anchor: { en: "Career Anchor", "zh-TW": "職業錨", "zh-CN": "职业锚" },
      ideal_card: { en: "Espresso Card", "zh-TW": "理想人生卡", "zh-CN": "理想人生卡" },
      combined: { en: "Combined", "zh-TW": "整合測評", "zh-CN": "整合测评" },
    };
    const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
    return labels[assessmentType]?.[langKey] || assessmentType;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <KeyRound className="w-4.5 h-4.5 text-red-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {language === "en" ? "Verification Codes" :
                   language === "zh-TW" ? "驗證碼管理" : "验证码管理"}
                </h2>
                <p className="text-xs text-muted-foreground">{organizationName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-muted/20 rounded-lg">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b border-border shrink-0">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{stats.total}</div>
              <div className="text-[10px] text-muted-foreground">
                {language === "en" ? "Total Codes" : language === "zh-TW" ? "驗證碼總數" : "验证码总数"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.active}</div>
              <div className="text-[10px] text-muted-foreground">
                {language === "en" ? "Active" : language === "zh-TW" ? "啟用中" : "启用中"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{stats.totalUsed}</div>
              <div className="text-[10px] text-muted-foreground">
                {language === "en" ? "Total Used" : language === "zh-TW" ? "已使用" : "已使用"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-600">{stats.totalRemaining}</div>
              <div className="text-[10px] text-muted-foreground">
                {language === "en" ? "Remaining" : language === "zh-TW" ? "剩餘次數" : "剩余次数"}
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Create button / form */}
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 mb-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                {language === "en" ? "Create New Code" :
                 language === "zh-TW" ? "建立新驗證碼" : "创建新验证码"}
              </button>
            ) : (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-muted/30 border border-border rounded-lg p-4 mb-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">
                    {language === "en" ? "New Verification Code" :
                     language === "zh-TW" ? "新驗證碼" : "新验证码"}
                  </span>
                  <button onClick={resetCreateForm} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {/* Code field */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {language === "en" ? "Code" : language === "zh-TW" ? "驗證碼" : "验证码"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCode}
                        onChange={(event) => setNewCode(event.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        maxLength={16}
                      />
                      <button
                        onClick={() => setNewCode(generateRandomCode())}
                        className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-xs font-medium transition-colors"
                      >
                        {language === "en" ? "Random" : language === "zh-TW" ? "隨機" : "随机"}
                      </button>
                    </div>
                  </div>

                  {/* Label */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {language === "en" ? "Label (optional)" :
                       language === "zh-TW" ? "標籤（選填）" : "标签（选填）"}
                    </label>
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(event) => setNewLabel(event.target.value)}
                      placeholder={language === "en" ? "e.g. Q1 Batch" : "例如：第一批"}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  {/* Per-type max uses */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      {language === "en" ? "Max Uses per Assessment Type" :
                       language === "zh-TW" ? "各測評類型最大使用次數" : "各测评类型最大使用次数"}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-1">
                          {language === "en" ? "Career Anchor" : language === "zh-TW" ? "職業錨" : "职业锚"}
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={newMaxUsesCareerAnchor}
                          onChange={(event) => setNewMaxUsesCareerAnchor(event.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-1">
                          {language === "en" ? "Espresso Card" : language === "zh-TW" ? "理想人生卡" : "理想人生卡"}
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={newMaxUsesIdealCard}
                          onChange={(event) => setNewMaxUsesIdealCard(event.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-1">
                          {language === "en" ? "Combined" : language === "zh-TW" ? "聯合測評" : "联合测评"}
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={newMaxUsesCombined}
                          onChange={(event) => setNewMaxUsesCombined(event.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expires at */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      {language === "en" ? "Expiry Date (optional)" :
                       language === "zh-TW" ? "到期日期（選填）" : "到期日期（选填）"}
                    </label>
                    <input
                      type="datetime-local"
                      value={newExpiresAt}
                      onChange={(event) => setNewExpiresAt(event.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={resetCreateForm}
                      className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {language === "en" ? "Cancel" : "取消"}
                    </button>
                    <button
                      onClick={() => createCodeMutation.mutate()}
                      disabled={!newCode.trim() || createCodeMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {createCodeMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {language === "en" ? "Create" : language === "zh-TW" ? "建立" : "创建"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Codes list */}
            {codesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : !codes || codes.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {language === "en" ? "No verification codes yet" :
                 language === "zh-TW" ? "尚無驗證碼" : "暂无验证码"}
              </div>
            ) : (
              <div className="space-y-2">
                {codes.map((codeItem) => {
                  const totalUsedAllTypes = codeItem.used_count_career_anchor + codeItem.used_count_ideal_card + codeItem.used_count_combined;
                  const totalMaxAllTypes = codeItem.max_uses_career_anchor + codeItem.max_uses_ideal_card + codeItem.max_uses_combined;
                  const remaining = Math.max(totalMaxAllTypes - totalUsedAllTypes, 0);
                  const isExpired = codeItem.expires_at && new Date(codeItem.expires_at) < new Date();
                  const isExhausted = remaining === 0;
                  const isEffectivelyInactive = !codeItem.is_active || isExpired || isExhausted;
                  const isExpanded = expandedCodeId === codeItem.id;

                  return (
                    <div
                      key={codeItem.id}
                      className={cn(
                        "border rounded-lg transition-colors",
                        isEffectivelyInactive
                          ? "border-border/50 bg-muted/10"
                          : "border-border bg-card"
                      )}
                    >
                      {/* Code row */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        {/* Code + label */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code
                              className={cn(
                                "text-sm font-mono tracking-wider font-semibold",
                                isEffectivelyInactive ? "text-muted-foreground" : "text-foreground"
                              )}
                            >
                              {codeItem.code}
                            </code>
                            <button
                              onClick={() => handleCopyCode(codeItem.code)}
                              className="p-1 hover:bg-muted/30 rounded"
                              title="Copy"
                            >
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            </button>
                            {/* Status badges */}
                            {!codeItem.is_active && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                                {language === "en" ? "Disabled" : language === "zh-TW" ? "已停用" : "已停用"}
                              </span>
                            )}
                            {isExpired && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">
                                {language === "en" ? "Expired" : language === "zh-TW" ? "已過期" : "已过期"}
                              </span>
                            )}
                            {isExhausted && !isExpired && codeItem.is_active && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                                {language === "en" ? "Exhausted" : language === "zh-TW" ? "已用完" : "已用完"}
                              </span>
                            )}
                          </div>
                          {codeItem.label && (
                            <div className="text-xs text-muted-foreground mt-0.5">{codeItem.label}</div>
                          )}
                        </div>

                        {/* Per-type usage counters */}
                        <div className="shrink-0 flex gap-2">
                          {([
                            { key: "career_anchor", maxField: "max_uses_career_anchor" as const, usedField: "used_count_career_anchor" as const, label: language === "en" ? "Anchor" : "錨" },
                            { key: "ideal_card", maxField: "max_uses_ideal_card" as const, usedField: "used_count_ideal_card" as const, label: language === "en" ? "Card" : "卡" },
                            { key: "combined", maxField: "max_uses_combined" as const, usedField: "used_count_combined" as const, label: language === "en" ? "Combo" : "合" },
                          ] as const).map((typeItem) => {
                            const maxVal = codeItem[typeItem.maxField];
                            const usedVal = codeItem[typeItem.usedField];
                            if (maxVal === 0) return null;
                            const isFull = usedVal >= maxVal;
                            return (
                              <div key={typeItem.key} className="text-center w-12">
                                <div className={cn("text-xs font-semibold", isFull ? "text-red-500" : "text-foreground")}>
                                  {usedVal}/{maxVal}
                                </div>
                                <div className="text-[9px] text-muted-foreground leading-tight">{typeItem.label}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Expiry */}
                        {codeItem.expires_at && (
                          <div className="text-center shrink-0 hidden sm:block">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatDateTime(codeItem.expires_at, language)}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Toggle active */}
                          <button
                            onClick={() => toggleActiveMutation.mutate({
                              codeId: codeItem.id,
                              currentActive: codeItem.is_active,
                            })}
                            disabled={toggleActiveMutation.isPending}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              codeItem.is_active
                                ? "hover:bg-red-50 text-green-600"
                                : "hover:bg-green-50 text-muted-foreground"
                            )}
                            title={codeItem.is_active
                              ? (language === "en" ? "Deactivate" : language === "zh-TW" ? "停用" : "停用")
                              : (language === "en" ? "Activate" : language === "zh-TW" ? "啟用" : "启用")
                            }
                          >
                            {codeItem.is_active
                              ? <ToggleRight className="w-4 h-4" />
                              : <ToggleLeft className="w-4 h-4" />
                            }
                          </button>

                          {/* Expand usage */}
                          <button
                            onClick={() => setExpandedCodeId(isExpanded ? null : codeItem.id)}
                            className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground"
                            title={language === "en" ? "Usage history" : language === "zh-TW" ? "使用記錄" : "使用记录"}
                          >
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4" />
                              : <Eye className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </div>

                      {/* Expanded usage history */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 border-t border-border/50">
                              <div className="text-xs font-medium text-muted-foreground mt-3 mb-2">
                                {language === "en" ? "Usage History" :
                                 language === "zh-TW" ? "使用記錄" : "使用记录"}
                              </div>
                              {usageLoading ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                </div>
                              ) : !usageRecords || usageRecords.length === 0 ? (
                                <div className="text-xs text-muted-foreground py-3 text-center">
                                  {language === "en" ? "No usage records yet" :
                                   language === "zh-TW" ? "尚無使用記錄" : "暂无使用记录"}
                                </div>
                              ) : (
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                  {usageRecords.map((record) => (
                                    <div
                                      key={record.id}
                                      className="flex items-center justify-between px-3 py-2 bg-muted/20 rounded-md"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                                        <span className="text-xs text-foreground truncate">
                                          {record.user_name || record.user_email || record.user_id.slice(0, 8)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                                          {assessmentTypeLabel(record.assessment_type)}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          {formatDateTime(record.used_at, language)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
