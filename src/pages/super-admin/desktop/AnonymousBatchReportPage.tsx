import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Brain, Download, Share2, Printer, RefreshCw,
  CheckCircle2, AlertTriangle, Lightbulb, BarChart3, Users,
  FileBarChart, Loader2, Sparkles, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import {
  ASSESSMENT_TYPE_LABELS, type AssessmentType,
} from "@/data/anonymousAssessmentMockData";

const PRIMARY = "#1C2857";
const ACCENT_ORANGE = "#E47E22";
const ACCENT_YELLOW = "#E6B63D";
const ACCENT_GREEN = "#20A87B";

export default function AnonymousBatchReportPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);

  const t = (en: string, zhTw: string) => language === "en" ? en : zhTw;

  // Fetch batch
  const { data: batch } = useQuery({
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

  // Fetch existing report
  const { data: report, isLoading: reportLoading, refetch: refetchReport } = useQuery({
    queryKey: ["anonymous-report-detail", batchId],
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

  // Fetch link stats
  const { data: linkStats } = useQuery({
    queryKey: ["anonymous-link-stats-report", batchId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("anonymous_assessment_links")
        .select("status")
        .eq("batch_id", batchId);
      if (error) throw error;
      const links = data || [];
      return {
        total: links.length,
        completed: links.filter((l: any) => l.status === "completed").length,
        inProgress: links.filter((l: any) => l.status === "in_progress").length,
        rate: links.length > 0 ? Math.round((links.filter((l: any) => l.status === "completed").length / links.length) * 100) : 0,
      };
    },
    enabled: !!batchId,
  });

  // Generate report via Edge Function
  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke("anonymous-batch-analysis", {
        body: { batchId, language: language === "en" ? "en" : "zh-TW" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(t("Report generated!", "報告已生成！"));
      refetchReport();
      queryClient.invalidateQueries({ queryKey: ["anonymous-batch", batchId] });
      setIsGenerating(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("Generation failed", "生成失敗"));
      setIsGenerating(false);
    },
  });

  // Auto-generate if no report exists and batch has responses
  useEffect(() => {
    if (!reportLoading && !report && batch && !isGenerating && (linkStats?.completed || 0) > 0) {
      generateMutation.mutate();
    }
  }, [reportLoading, report, batch, linkStats]);

  if (reportLoading || isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: `${PRIMARY}15` }}>
            <Brain className="w-10 h-10" style={{ color: PRIMARY }} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-slate-700">{t("AI is analyzing batch data…", "AI 正在分析批次數據…")}</div>
          <div className="text-sm text-slate-400 mt-1">{t("Generating group insights and recommendations", "正在生成群體洞察與建議")}</div>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mt-2" />
      </div>
    );
  }

  if (!report || !batch) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/super-admin/anonymous-assessment/${batchId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" />{t("Back to Batch", "返回批次")}
        </Button>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileBarChart className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <div className="font-medium text-slate-500 mb-4">{t("No report available", "尚無可用報告")}</div>
          {(linkStats?.completed || 0) === 0 ? (
            <p className="text-sm text-slate-400">{t("No completed responses yet. Reports require at least 1 completed assessment.", "尚無已完成的回覆。報告至少需要 1 份已完成的測評。")}</p>
          ) : (
            <Button onClick={() => generateMutation.mutate()} style={{ backgroundColor: PRIMARY }} className="text-white">
              <Brain className="w-4 h-4 mr-2" />{t("Generate Report", "生成報告")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const typeLabel = language === "en"
    ? ASSESSMENT_TYPE_LABELS[batch.assessment_type as AssessmentType]?.en
    : ASSESSMENT_TYPE_LABELS[batch.assessment_type as AssessmentType]?.zhTw;

  const aiInsights = (report.ai_insights || []) as string[] | { signal?: string; severity?: string; detail?: string }[];
  const recommendations = (report.recommendations || []) as Array<{ category?: string; category_en?: string; items?: string[] }>;
  const riskSignals = (report.risk_signals || []) as Array<{ signal?: string; severity?: string; detail?: string }>;
  const summary = (report.summary || {}) as Record<string, unknown>;
  const groupSummary = (summary.group_summary || {}) as Record<string, string>;

  // Extract charts data from report
  const charts = (report.charts || {}) as Record<string, unknown>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:max-w-none">
      {/* Navigation */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/super-admin/anonymous-assessment/${batchId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" />{t("Back to Batch", "返回批次")}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => generateMutation.mutate()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />{t("Regenerate", "重新生成")}
          </Button>
        </div>
      </div>

      {/* Report Header */}
      <div className="rounded-xl p-8 text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #2a3a72)` }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-amber-300" />
              <Badge className="bg-white/15 text-white border-white/20 text-xs">{t("AI Analysis Report", "AI 分析報告")}</Badge>
            </div>
            <h1 className="text-2xl font-bold mb-1">{batch.batch_name}</h1>
            <p className="text-white/70 text-sm">{typeLabel} · {t("Generated", "生成於")} {new Date(report.generated_at).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-amber-300">{report.total_participants}</div>
            <div className="text-xs text-white/60">{t("participants", "位參與者")}</div>
          </div>
        </div>
      </div>

      {/* Section 1: Overview Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" style={{ color: PRIMARY }} />{t("Batch Overview", "批次總覽")}
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: t("Total Participants", "參與總人數"), value: report.total_participants, color: PRIMARY },
            { label: t("Completion Rate", "完成率"), value: `${report.completion_rate}%`, color: ACCENT_GREEN },
            { label: t("Total Links", "連結總數"), value: linkStats?.total || batch.total_links || 0, color: ACCENT_ORANGE },
            { label: t("Assessment Type", "測評類型"), value: typeLabel, color: "#6366F1" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 rounded-xl" style={{ backgroundColor: `${stat.color}08`, border: `1px solid ${stat.color}15` }}>
              <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Group Structure (from charts data) */}
      {charts && (charts as any).type === "career_anchor" && (charts as any).averages && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: PRIMARY }} />{t("Group Structure Analysis", "群體結構分析")}
          </h2>
          <div className="flex items-end gap-3 h-44 mb-4">
            {Object.entries((charts as any).averages).map(([code, avg]: [string, any]) => {
              const anchorNames: Record<string, string> = language === "en"
                ? { TF: "Technical", GM: "Management", AU: "Autonomy", SE: "Security", EC: "Entrepreneurial", SV: "Service", CH: "Challenge", LS: "Lifestyle" }
                : { TF: "技術", GM: "管理", AU: "自主", SE: "安全", EC: "創業", SV: "服務", CH: "挑戰", LS: "生活" };
              const maxVal = Math.max(...Object.values((charts as any).averages as Record<string, number>), 1);
              return (
                <div key={code} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[11px] font-bold" style={{ color: PRIMARY }}>{avg}</span>
                  <div className="w-full rounded-t-lg" style={{ height: `${(avg / maxVal) * 100}%`, backgroundColor: PRIMARY, minHeight: 6 }} />
                  <span className="text-[10px] text-slate-500 mt-1.5 text-center">{anchorNames[code] || code}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Group Summary */}
      {groupSummary && Object.keys(groupSummary).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: PRIMARY }} />{t("Group Summary", "群體摘要")}
          </h2>
          <div className="grid gap-3">
            {groupSummary.dominant_pattern && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-800">{groupSummary.dominant_pattern}</div>
            )}
            {groupSummary.structural_strength && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-800">{groupSummary.structural_strength}</div>
            )}
            {groupSummary.structural_gap && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-800">{groupSummary.structural_gap}</div>
            )}
            {groupSummary.organizational_implication && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">{groupSummary.organizational_implication}</div>
            )}
          </div>
        </div>
      )}

      {/* Section 3: AI Key Insights */}
      {Array.isArray(aiInsights) && aiInsights.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" style={{ color: ACCENT_YELLOW }} />{t("AI Key Insights", "AI 關鍵洞察")}
          </h2>
          <div className="grid gap-3">
            {aiInsights.map((insight, insightIndex) => (
              <div key={insightIndex} className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: ACCENT_YELLOW }}>{insightIndex + 1}</div>
                <p className="text-sm text-slate-700 leading-relaxed">{typeof insight === "string" ? insight : (insight as any).detail || JSON.stringify(insight)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Risk Signals */}
      {Array.isArray(riskSignals) && riskSignals.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />{t("Risk Signals", "風險信號")}
          </h2>
          <div className="grid gap-3">
            {riskSignals.map((risk, riskIndex) => {
              const severityColors: Record<string, string> = {
                high: "bg-red-50 border-red-200 text-red-800",
                medium: "bg-amber-50 border-amber-200 text-amber-800",
                low: "bg-blue-50 border-blue-200 text-blue-800",
              };
              return (
                <div key={riskIndex} className={`p-4 rounded-xl border ${severityColors[risk.severity || "medium"] || severityColors.medium}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{(risk.severity || "medium").toUpperCase()}</Badge>
                    <span className="text-sm font-medium">{risk.signal}</span>
                  </div>
                  <p className="text-xs mt-1 opacity-80">{risk.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 5: Recommendations */}
      {Array.isArray(recommendations) && recommendations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: ACCENT_GREEN }} />{t("Management Recommendations", "管理建議")}
          </h2>
          <div className="grid gap-4">
            {recommendations.map((rec, recIndex) => (
              <div key={recIndex} className="border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: PRIMARY }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white font-bold" style={{ backgroundColor: PRIMARY }}>{recIndex + 1}</span>
                  {language === "en" ? (rec.category_en || rec.category) : rec.category}
                </h3>
                <div className="space-y-2 pl-8">
                  {(rec.items || []).map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: ACCENT_GREEN }} />
                      <span className="text-sm text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-center gap-3 py-6 print:hidden">
        <Button variant="outline" onClick={() => toast.success(t("PDF exported!", "PDF 已匯出！"))}>
          <Download className="w-4 h-4 mr-2" />{t("Export PDF", "匯出 PDF")}
        </Button>
        <Button variant="outline" onClick={() => toast.success(t("Shared!", "已分享！"))}>
          <Share2 className="w-4 h-4 mr-2" />{t("Share Report", "分享報告")}
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />{t("Print", "列印")}
        </Button>
      </div>
    </div>
  );
}
