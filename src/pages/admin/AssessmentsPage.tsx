import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Search,
  Filter,
  ArrowLeft,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation, type Language } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { standardizeScores } from "@/data/questions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StoredAssessmentResult, StoredAnswer } from "@/hooks/useAssessmentResults";
import { DIMENSIONS } from "@/hooks/useAssessment";
import { downloadReport, storedResultToReportData, downloadComprehensiveReport } from "@/lib/exportReport";
import AnswerDetailSection from "@/components/desktop/AnswerDetailSection";
import { FileText } from "lucide-react";
import { toast } from "sonner";

const getDimensionName = (code: string, language: Language): string => {
  return DIMENSIONS[code as keyof typeof DIMENSIONS]?.[language] || code;
};

const getStabilityText = (stability: string, language: Language): string => {
  const map: Record<string, Record<Language, string>> = {
    mature: { "zh-CN": "成熟", "zh-TW": "成熟", en: "Mature" },
    developing: { "zh-CN": "发展中", "zh-TW": "發展中", en: "Developing" },
    unclear: { "zh-CN": "不明确", "zh-TW": "不明確", en: "Unclear" },
  };
  return map[stability]?.[language] || stability;
};

const formatDuration = (seconds: number | null, isEn: boolean): string => {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return isEn ? `${mins}m ${secs}s` : `${mins}分${secs}秒`;
};

export default function AdminAssessmentsPage() {
  const { language } = useTranslation();
  const isEn = language === "en";
  const { profile } = useAuth();
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchor, setFilterAnchor] = useState<string>("");
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Fetch all assessment results, then enrich with user profiles separately
  const { data: assessments, isLoading } = useQuery({
    queryKey: ["admin-all-assessments"],
    queryFn: async (): Promise<(StoredAssessmentResult & { user_email?: string; user_name?: string; career_stage?: string })[]> => {
      // Step 1: Fetch all assessment results
      const { data: results, error: resultsError } = await supabase
        .from("assessment_results")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (resultsError) throw resultsError;
      if (!results || results.length === 0) return [];

      // Step 2: Fetch profiles for all unique user IDs
      const uniqueUserIds = [...new Set(results.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, career_stage")
        .in("id", uniqueUserIds);

      // Step 3: Build a lookup map
      const profileMap = new Map<string, { email: string; full_name: string; career_stage: string }>();
      (profiles || []).forEach(p => {
        profileMap.set(p.id, { email: p.email, full_name: p.full_name, career_stage: p.career_stage });
      });

      // Step 4: Merge
      return results.map(item => {
        const profile = profileMap.get(item.user_id);
        return {
          ...item,
          user_email: profile?.email,
          user_name: profile?.full_name,
          career_stage: profile?.career_stage,
        } as StoredAssessmentResult & { user_email?: string; user_name?: string; career_stage?: string };
      });
    },
  });

  const filteredAssessments = assessments?.filter(a => {
    const matchesSearch = !searchTerm || 
      a.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAnchor = !filterAnchor || a.main_anchor === filterAnchor;
    
    return matchesSearch && matchesAnchor;
  }) || [];

  const handleExportSingle = async (assessment: StoredAssessmentResult & { user_name?: string }) => {
    setExportingId(assessment.id);
    try {
      const reportData = storedResultToReportData(assessment, assessment.user_name);
      await downloadReport(reportData, language, `assessment-${assessment.id.slice(0, 8)}.pdf`);
      toast.success(isEn ? "Report exported" : "报告已导出");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(isEn ? "Export failed" : "导出失败");
    } finally {
      setExportingId(null);
    }
  };

  const [comprehensiveExportId, setComprehensiveExportId] = useState<string | null>(null);

  const handleExportComprehensive = async (assessment: StoredAssessmentResult & { user_name?: string; career_stage?: string }) => {
    setComprehensiveExportId(assessment.id);
    try {
      await downloadComprehensiveReport(assessment, language, assessment.user_name, assessment.career_stage);
      toast.success(isEn ? "Comprehensive report exported" : "完整版报告已导出");
    } catch (error) {
      console.error("Comprehensive export failed:", error);
      toast.error(isEn ? "Export failed" : "导出失败");
    } finally {
      setComprehensiveExportId(null);
    }
  };

  const anchorOptions = Object.keys(DIMENSIONS);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/admin/analytics"
          className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEn ? "Assessment Analysis" : "测评分析"}
          </h1>
          <p className="text-muted-foreground">
            {isEn ? "View all completed assessments and their detailed scores" : "查看所有已完成的测评及其详细评分"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={isEn ? "Search by user or ID..." : "搜索用户或ID..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={filterAnchor}
            onChange={(e) => setFilterAnchor(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-card border border-border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">{isEn ? "All Anchors" : "全部锚定"}</option>
            {anchorOptions.map(code => (
              <option key={code} value={code}>{getDimensionName(code, language)}</option>
            ))}
          </select>
        </div>

        <div className="text-sm text-muted-foreground">
          {isEn ? `${filteredAssessments.length} assessments` : `${filteredAssessments.length} 条测评`}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Assessment List */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredAssessments.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {isEn ? "No assessments found" : "未找到测评记录"}
            </div>
          ) : (
            filteredAssessments.map((assessment) => (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Summary Row */}
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/10 transition-colors"
                  onClick={() => setExpandedId(expandedId === assessment.id ? null : assessment.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* User Info */}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {(assessment.user_name?.[0] || assessment.user_email?.[0] || "U").toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {assessment.user_name || assessment.user_email || assessment.user_id.slice(0, 8)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(assessment.created_at).toLocaleString(isEn ? "en-US" : "zh-CN")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* High-Sensitivity Anchor Badge */}
                      <div className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full">
                        {getDimensionName(assessment.main_anchor, language)}
                      </div>

                      {/* Risk Index */}
                      <div className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-full hidden md:block",
                        assessment.risk_index > 50 
                          ? "bg-red-500/10 text-red-600" 
                          : assessment.risk_index > 25 
                            ? "bg-yellow-500/10 text-yellow-600" 
                            : "bg-green-500/10 text-green-600"
                      )}>
                        {isEn ? "Risk" : "风险"}: {assessment.risk_index.toFixed(0)}
                      </div>

                      {/* Stability */}
                      <div className="text-sm text-muted-foreground hidden lg:block">
                        {getStabilityText(assessment.stability, language)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportComprehensive(assessment);
                          }}
                          disabled={comprehensiveExportId === assessment.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-xs font-medium"
                          title={isEn ? "Download Comprehensive Report" : "下载完整版报告"}
                        >
                          {comprehensiveExportId === assessment.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          {isEn ? "Full Report" : "完整报告"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportSingle(assessment);
                          }}
                          disabled={exportingId === assessment.id}
                          className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
                          title={isEn ? "Export Summary" : "导出简要报告"}
                        >
                          {exportingId === assessment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Download className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        {expandedId === assessment.id ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === assessment.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-6">
                      {/* Meta Info */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 pb-6 border-b border-border">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">
                            {isEn ? "Questions" : "题目数"}
                          </div>
                          <div className="text-lg font-semibold text-foreground">
                            {assessment.question_count}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">
                            {isEn ? "Duration" : "用时"}
                          </div>
                          <div className="text-lg font-semibold text-foreground">
                            {formatDuration(assessment.completion_time_seconds, isEn)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">
                            {isEn ? "Stability" : "稳定性"}
                          </div>
                          <div className="text-lg font-semibold text-foreground">
                            {getStabilityText(assessment.stability, language)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">
                            {isEn ? "Risk Index" : "风险指数"}
                          </div>
                          <div className={cn(
                            "text-lg font-semibold",
                            assessment.risk_index > 50 
                              ? "text-red-600" 
                              : assessment.risk_index > 25 
                                ? "text-yellow-600" 
                                : "text-green-600"
                          )}>
                            {assessment.risk_index.toFixed(1)}
                          </div>
                        </div>
                      </div>

                      {/* Score Details */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-foreground mb-4">
                          {isEn ? "Dimension Scores" : "维度得分"}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {(() => {
                            const displayScores = standardizeScores({
                              TF: assessment.score_tf, GM: assessment.score_gm,
                              AU: assessment.score_au, SE: assessment.score_se,
                              EC: assessment.score_ec, SV: assessment.score_sv,
                              CH: assessment.score_ch, LS: assessment.score_ls,
                            });
                            return Object.entries(displayScores)
                            .sort(([, a], [, b]) => b - a)
                            .map(([code, score], index) => (
                              <div 
                                key={code} 
                                className={cn(
                                  "p-4 rounded-lg border",
                                  index === 0 
                                    ? "bg-primary/5 border-primary" 
                                    : index === 1 
                                      ? "bg-muted/10 border-muted/30"
                                      : "bg-card border-border"
                                )}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-foreground">
                                    {getDimensionName(code, language)}
                                  </span>
                                  <span className={cn(
                                    "text-lg font-bold",
                                    index === 0 ? "text-primary" : "text-foreground"
                                  )}>
                                    {Math.round(score)}
                                  </span>
                                </div>
                                <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      index === 0 
                                        ? "bg-primary" 
                                        : index === 1 
                                          ? "bg-secondary"
                                          : "bg-muted-foreground/30"
                                    )}
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Conflict Anchors */}
                      {assessment.conflict_anchors && assessment.conflict_anchors.length > 0 && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-6">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-700">
                              {isEn ? "Conflicting Anchors" : "冲突锚"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {assessment.conflict_anchors.map((code, idx) => (
                              <span 
                                key={idx}
                                className="px-3 py-1 bg-yellow-500/20 text-yellow-700 text-sm rounded-full"
                              >
                                {getDimensionName(code, language)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Question & Answer Details */}
                      <AnswerDetailSection 
                        answers={assessment.answers as StoredAnswer[] | null} 
                        language={language} 
                        isEn={isEn}
                        showWeight={profile?.role_type === 'super_admin'}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
