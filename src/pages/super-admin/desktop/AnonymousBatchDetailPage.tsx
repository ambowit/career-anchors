import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Copy, Download, XCircle, RefreshCw, Clock, Eye,
  Link2, CheckCircle2, BarChart3, Users, Loader2,
  Activity, Ban, FileBarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { copyToClipboard } from "@/lib/clipboard";
import { SITE_ORIGIN } from "@/lib/utils";
import {
  ASSESSMENT_TYPE_LABELS, BATCH_STATUS_LABELS, LINK_STATUS_LABELS,
  type BatchStatus, type LinkStatus, type AssessmentType,
} from "@/data/anonymousAssessmentMockData";

const PRIMARY = "#1C2857";
const ACCENT_ORANGE = "#E47E22";
const ACCENT_YELLOW = "#E6B63D";
const ACCENT_GREEN = "#20A87B";

export default function AnonymousBatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState("links");

  const t = (en: string, zhTw: string) => language === "en" ? en : zhTw;

  // Fetch batch
  const { data: batch, isLoading: batchLoading } = useQuery({
    queryKey: ["anonymous-batch", batchId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("anonymous_assessment_batches")
        .select("*")
        .eq("id", batchId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!batchId,
  });

  // Fetch links for this batch
  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ["anonymous-links", batchId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("anonymous_assessment_links")
        .select("*")
        .eq("batch_id", batchId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!batchId,
  });

  // Fetch responses for charts
  const { data: responses = [] } = useQuery({
    queryKey: ["anonymous-responses", batchId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("anonymous_assessment_responses")
        .select("calculated_scores, submitted_at")
        .eq("batch_id", batchId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!batchId,
  });

  // Fetch existing report if any
  const { data: existingReport } = useQuery({
    queryKey: ["anonymous-report", batchId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("anonymous_batch_reports")
        .select("*")
        .eq("batch_id", batchId)
        .order("generated_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!batchId,
  });

  // Disable link mutation
  const disableLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await (supabase as any)
        .from("anonymous_assessment_links")
        .update({ status: "disabled" })
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anonymous-links", batchId] });
      toast.success(t("Link disabled", "連結已停用"));
    },
  });

  // Link stats
  const linkStats = useMemo(() => {
    const total = links.length;
    const completed = links.filter((l: any) => l.status === "completed").length;
    const inProgress = links.filter((l: any) => l.status === "in_progress").length;
    const unused = links.filter((l: any) => l.status === "unused").length;
    const disabled = links.filter((l: any) => l.status === "disabled").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, unused, disabled, rate };
  }, [links]);

  // Daily completions for chart
  const dailyCompletions = useMemo(() => {
    const completedLinks = links.filter((l: any) => l.status === "completed" && l.completed_at);
    const dayMap: Record<string, number> = {};
    for (const link of completedLinks) {
      const day = new Date(link.completed_at).toLocaleDateString(language === "en" ? "en-US" : "zh-TW", { month: "short", day: "numeric" });
      dayMap[day] = (dayMap[day] || 0) + 1;
    }
    return Object.entries(dayMap).map(([day, count]) => ({ day, count }));
  }, [links, language]);

  // Aggregate distribution for insight tab
  const scoreDistribution = useMemo(() => {
    if (responses.length === 0 || !batch) return null;
    if (batch.assessment_type === "career_anchor") {
      const anchors = ["TF", "GM", "AU", "SE", "EC", "SV", "CH", "LS"];
      const anchorNames: Record<string, string> = language === "en"
        ? { TF: "Technical", GM: "Management", AU: "Autonomy", SE: "Security", EC: "Entrepreneurial", SV: "Service", CH: "Challenge", LS: "Lifestyle" }
        : { TF: "技術能力", GM: "管理", AU: "自主獨立", SE: "安全穩定", EC: "創業", SV: "服務奉獻", CH: "挑戰", LS: "生活方式" };
      const totals: Record<string, number> = {};
      const counts: Record<string, number> = {};
      anchors.forEach((a) => { totals[a] = 0; counts[a] = 0; });
      for (const resp of responses) {
        const scores = resp.calculated_scores as Record<string, number> | null;
        if (!scores) continue;
        let maxKey = "";
        let maxVal = -1;
        for (const anchor of anchors) {
          const val = scores[anchor] || 0;
          totals[anchor] += val;
          if (val > maxVal) { maxVal = val; maxKey = anchor; }
        }
        if (maxKey) counts[maxKey] = (counts[maxKey] || 0) + 1;
      }
      return {
        type: "career_anchor" as const,
        data: anchors.map((anchor) => ({
          code: anchor,
          name: anchorNames[anchor],
          average: responses.length > 0 ? Math.round(totals[anchor] / responses.length) : 0,
          primaryCount: counts[anchor] || 0,
        })),
      };
    }
    if (batch.assessment_type === "life_card") {
      const valueCounts: Record<string, number> = {};
      for (const resp of responses) {
        const scores = resp.calculated_scores as Record<string, unknown> | null;
        if (!scores) continue;
        const topValues = (scores.top_values || []) as string[];
        for (const val of topValues) {
          valueCounts[val] = (valueCounts[val] || 0) + 1;
        }
      }
      return {
        type: "life_card" as const,
        data: Object.entries(valueCounts)
          .sort(([, countA], [, countB]) => countB - countA)
          .slice(0, 10)
          .map(([value, count]) => ({ value, count })),
      };
    }
    if (batch.assessment_type === "fusion") {
      const alignmentBuckets = [0, 0, 0, 0, 0]; // 0-20, 20-40, 40-60, 60-80, 80-100
      for (const resp of responses) {
        const scores = resp.calculated_scores as Record<string, number> | null;
        if (!scores?.alignment_score) continue;
        const bucketIndex = Math.min(Math.floor(scores.alignment_score / 20), 4);
        alignmentBuckets[bucketIndex]++;
      }
      return {
        type: "fusion" as const,
        data: alignmentBuckets.map((count, index) => ({ range: `${index * 20}-${(index + 1) * 20}`, count })),
      };
    }
    return null;
  }, [responses, batch, language]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString(language === "en" ? "en-US" : "zh-TW", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (batchLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  if (!batch) {
    return <div className="text-center py-20 text-slate-500">{t("Batch not found", "批次不存在")}</div>;
  }

  const statusConfig = BATCH_STATUS_LABELS[batch.status as BatchStatus];
  const typeLabel = language === "en" ? ASSESSMENT_TYPE_LABELS[batch.assessment_type as AssessmentType]?.en : ASSESSMENT_TYPE_LABELS[batch.assessment_type as AssessmentType]?.zhTw;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/super-admin/anonymous-assessment")}>
          <ArrowLeft className="w-4 h-4 mr-1" />{t("Back", "返回")}
        </Button>
      </div>

      {/* Batch Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>{batch.batch_name}</h1>
              <Badge className={`text-xs font-medium border ${statusConfig?.color || ""}`} variant="outline">
                {statusConfig ? (language === "en" ? statusConfig.en : statusConfig.zhTw) : batch.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 max-w-2xl">{batch.description || t("No description", "無描述")}</p>
            <div className="flex items-center gap-6 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{typeLabel}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(batch.created_at)}</span>
              {batch.expires_at && <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{t("Expires:", "截止：")}{formatDate(batch.expires_at)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["anonymous-links", batchId] })}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />{t("Refresh", "重新整理")}
            </Button>
            {existingReport && (
              <Button size="sm" style={{ backgroundColor: PRIMARY }} className="text-white" onClick={() => navigate(`/super-admin/anonymous-assessment/${batchId}/report`)}>
                <FileBarChart className="w-3.5 h-3.5 mr-1.5" />{t("View Report", "查看報告")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: t("Total Links", "總連結數"), value: linkStats.total, icon: Link2, color: PRIMARY },
          { label: t("Used", "已使用"), value: linkStats.inProgress + linkStats.completed, icon: Activity, color: ACCENT_ORANGE },
          { label: t("Completed", "已完成"), value: linkStats.completed, icon: CheckCircle2, color: ACCENT_GREEN },
          { label: t("In Progress", "進行中"), value: linkStats.inProgress, icon: Clock, color: ACCENT_YELLOW },
          { label: t("Completion Rate", "完成率"), value: `${linkStats.rate}%`, icon: BarChart3, color: "#6366F1" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
              <span className="text-xs text-slate-500">{card.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100/80 border border-slate-200">
          <TabsTrigger value="links">{t("Link Management", "連結管理")}</TabsTrigger>
          <TabsTrigger value="distribution">{t("Response Distribution", "回收分佈")}</TabsTrigger>
          <TabsTrigger value="insights">{t("Group Insights", "群體洞察")}</TabsTrigger>
          <TabsTrigger value="report">{t("Report Output", "報告輸出")}</TabsTrigger>
        </TabsList>

        {/* Tab 1: Link Management */}
        <TabsContent value="links" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {linksLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{t("Link / Token", "連結 / Token")}</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">{t("Status", "狀態")}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{t("Started", "開始時間")}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{t("Completed", "完成時間")}</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">{t("Actions", "操作")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link: any, index: number) => {
                      const linkUrl = `${SITE_ORIGIN}/a/${link.token}`;
                      const statusConfig2 = LINK_STATUS_LABELS[link.status as LinkStatus];
                      return (
                        <tr key={link.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 text-xs text-slate-400">{index + 1}</td>
                          <td className="px-4 py-2.5"><code className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded font-mono">{linkUrl}</code></td>
                          <td className="px-4 py-2.5 text-center">
                            <Badge className={`text-[10px] ${statusConfig2?.color || ""}`} variant="outline">
                              {statusConfig2 ? (language === "en" ? statusConfig2.en : statusConfig2.zhTw) : link.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(link.started_at)}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(link.completed_at)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={async () => { const ok = await copyToClipboard(linkUrl); if (ok) toast.success(t("Copied!", "已複製！")); else toast.error(t("Copy failed", "複製失敗")); }}>
                                <Copy className="w-3 h-3" />
                              </Button>
                              {link.status !== "disabled" && link.status !== "completed" && (
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700" onClick={() => disableLinkMutation.mutate(link.id)}>
                                  <Ban className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {links.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">{t("No links generated yet", "尚未生成連結")}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Response Distribution */}
        <TabsContent value="distribution" className="mt-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">{t("Completion Funnel", "完成漏斗")}</h3>
            <div className="space-y-3">
              {[
                { label: t("Total Links", "總連結"), value: linkStats.total, rate: 100, color: PRIMARY },
                { label: t("Started", "已開始"), value: linkStats.inProgress + linkStats.completed, rate: linkStats.total > 0 ? Math.round(((linkStats.inProgress + linkStats.completed) / linkStats.total) * 100) : 0, color: ACCENT_ORANGE },
                { label: t("Completed", "已完成"), value: linkStats.completed, rate: linkStats.total > 0 ? Math.round((linkStats.completed / linkStats.total) * 100) : 0, color: ACCENT_GREEN },
              ].map((stage) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <div className="w-24 text-xs font-medium text-slate-600">{stage.label}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stage.rate}%`, backgroundColor: stage.color }} />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">{stage.value} ({stage.rate}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {dailyCompletions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">{t("Daily Completions", "每日完成數")}</h3>
              <div className="flex items-end gap-2 h-32">
                {dailyCompletions.map((day) => {
                  const maxCount = Math.max(...dailyCompletions.map((d) => d.count), 1);
                  const heightPercent = (day.count / maxCount) * 100;
                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-semibold" style={{ color: PRIMARY }}>{day.count}</span>
                      <div className="w-full rounded-t-md transition-all" style={{ height: `${heightPercent}%`, backgroundColor: PRIMARY, minHeight: 4 }} />
                      <span className="text-[10px] text-slate-400 mt-1">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">{t("Status Distribution", "狀態分佈")}</h3>
            <div className="h-8 flex rounded-lg overflow-hidden border border-slate-200">
              {[
                { count: linkStats.completed, color: ACCENT_GREEN, label: t("Completed", "已完成") },
                { count: linkStats.inProgress, color: ACCENT_ORANGE, label: t("In Progress", "進行中") },
                { count: linkStats.unused, color: "#94A3B8", label: t("Unused", "未使用") },
                { count: linkStats.disabled, color: "#EF4444", label: t("Disabled", "已停用") },
              ].filter((segment) => segment.count > 0).map((segment) => {
                const widthPercent = linkStats.total > 0 ? (segment.count / linkStats.total) * 100 : 0;
                return (
                  <div key={segment.label} className="flex items-center justify-center transition-all" style={{ width: `${widthPercent}%`, backgroundColor: segment.color }} title={`${segment.label}: ${segment.count}`}>
                    {widthPercent > 8 && <span className="text-[10px] text-white font-medium">{segment.count}</span>}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              {[
                { label: t("Completed", "已完成"), color: ACCENT_GREEN, count: linkStats.completed },
                { label: t("In Progress", "進行中"), color: ACCENT_ORANGE, count: linkStats.inProgress },
                { label: t("Unused", "未使用"), color: "#94A3B8", count: linkStats.unused },
                { label: t("Disabled", "已停用"), color: "#EF4444", count: linkStats.disabled },
              ].map((legend) => (
                <span key={legend.label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: legend.color }} />
                  <span className="text-slate-500">{legend.label} ({legend.count})</span>
                </span>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Group Insights */}
        <TabsContent value="insights" className="mt-4 space-y-4">
          {responses.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <div className="font-medium text-slate-500">{t("No responses yet", "尚無回覆數據")}</div>
              <div className="text-xs text-slate-400 mt-1">{t("Group insights will appear after participants complete their assessments", "待參與者完成測評後將顯示群體洞察")}</div>
            </div>
          ) : scoreDistribution?.type === "career_anchor" ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">{t("Career Anchor Distribution", "職業錨分佈")}</h3>
              <div className="flex items-end gap-3 h-44 mb-4">
                {scoreDistribution.data.map((anchor: any) => {
                  const maxAvg = Math.max(...scoreDistribution.data.map((d: any) => d.average), 1);
                  const heightPercent = (anchor.average / maxAvg) * 100;
                  return (
                    <div key={anchor.code} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[11px] font-bold" style={{ color: PRIMARY }}>{anchor.average}</span>
                      <div className="w-full rounded-t-lg transition-all" style={{ height: `${heightPercent}%`, backgroundColor: PRIMARY, minHeight: 6 }} />
                      <span className="text-[10px] text-slate-500 mt-1.5 text-center leading-tight">{anchor.name}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5">{anchor.primaryCount} {t("primary", "首選")}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : scoreDistribution?.type === "life_card" ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">{t("Value Clusters", "價值觀集群")}</h3>
              <div className="space-y-3">
                {scoreDistribution.data.map((cluster: any) => {
                  const maxCount = Math.max(...scoreDistribution.data.map((d: any) => d.count), 1);
                  return (
                    <div key={cluster.value} className="flex items-center gap-3">
                      <div className="w-28 text-xs font-medium text-slate-600 text-right truncate">{cluster.value}</div>
                      <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(cluster.count / maxCount) * 100}%`, backgroundColor: ACCENT_ORANGE }} />
                      </div>
                      <span className="text-xs font-semibold w-8 text-right" style={{ color: ACCENT_ORANGE }}>{cluster.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : scoreDistribution?.type === "fusion" ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">{t("Alignment Score Distribution", "對齊度分佈")}</h3>
              <div className="flex items-end gap-3 h-40">
                {scoreDistribution.data.map((bucket: any) => {
                  const maxCount = Math.max(...scoreDistribution.data.map((d: any) => d.count), 1);
                  const heightPercent = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
                  return (
                    <div key={bucket.range} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-bold" style={{ color: "#6366F1" }}>{bucket.count}</span>
                      <div className="w-full rounded-t-lg" style={{ height: `${heightPercent}%`, backgroundColor: "#6366F1", minHeight: 4 }} />
                      <span className="text-[10px] text-slate-400 mt-1">{bucket.range}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* Tab 4: Report Output */}
        <TabsContent value="report" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
            <FileBarChart className="w-12 h-12 mx-auto mb-4" style={{ color: PRIMARY }} />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {existingReport ? t("Report Available", "報告已生成") : t("Generate Group Analysis Report", "生成群體分析報告")}
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              {existingReport
                ? t("AI-generated analysis report is ready. Click below to view.", "AI 群體分析報告已就緒，點擊下方查看完整內容。")
                : t("Run AI-powered analysis on all completed responses", "對所有已完成回覆進行 AI 驅動的群體分析")}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate(`/super-admin/anonymous-assessment/${batchId}/report`)}
                style={{ backgroundColor: PRIMARY }}
                className="text-white shadow-lg"
              >
                <FileBarChart className="w-4 h-4 mr-2" />
                {existingReport ? t("View Report", "查看報告") : t("Generate Report", "生成報告")}
              </Button>
              {existingReport && (
                <Button variant="outline" size="lg" onClick={() => toast.success(t("Exported!", "已匯出！"))}>
                  <Download className="w-4 h-4 mr-2" />{t("Export PDF", "匯出 PDF")}
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
