import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AssessmentResult, Answer } from "@/hooks/useAssessment";
import { getCoreAdvantageAnchors } from "@/hooks/useAssessment";
import { DIMENSION_CODES, standardizeScores } from "@/data/questions";

export interface StoredAnswer {
  questionId: string;
  value: number;
  dimension: string;
  weight: number;
}

export interface StoredAssessmentResult {
  id: string;
  user_id: string;
  score_tf: number;
  score_gm: number;
  score_au: number;
  score_se: number;
  score_ec: number;
  score_sv: number;
  score_ch: number;
  score_ls: number;
  main_anchor: string;
  conflict_anchors: string[] | null;
  risk_index: number;
  stability: string;
  question_count: number;
  completion_time_seconds: number | null;
  answers: StoredAnswer[] | null;
  created_at: string;
}

export function useAssessmentHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["assessment-results", user?.id],
    queryFn: async (): Promise<StoredAssessmentResult[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("assessment_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as StoredAssessmentResult[];
    },
    enabled: !!user,
  });
}

export function useLatestAssessmentResult() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["assessment-results", user?.id, "latest"],
    queryFn: async (): Promise<StoredAssessmentResult | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("assessment_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as StoredAssessmentResult | null;
    },
    enabled: !!user,
  });
}

export function useAssessmentResultById(resultId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["assessment-results", resultId],
    queryFn: async (): Promise<StoredAssessmentResult | null> => {
      if (!user || !resultId) return null;

      const { data, error } = await supabase
        .from("assessment_results")
        .select("*")
        .eq("id", resultId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as StoredAssessmentResult;
    },
    enabled: !!user && !!resultId,
  });
}

interface SaveAssessmentParams {
  result: AssessmentResult;
  questionCount: number;
  completionTimeSeconds?: number;
  answers?: Answer[];
}

export function useSaveAssessmentResult() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ result, questionCount, completionTimeSeconds, answers }: SaveAssessmentParams) => {
      if (!user) throw new Error("User not authenticated");

      // Flatten conflict anchors array for storage
      const flatConflicts = result.conflictAnchors && result.conflictAnchors.length > 0
        ? result.conflictAnchors.flat()
        : [];

      // Compute raw scores from answers for DB storage
      // (result.scores is standardized 0-100; DB stores raw weighted scores)
      const rawScores: Record<string, number> = {};
      DIMENSION_CODES.forEach(dim => { rawScores[dim] = 0; });
      if (answers) {
        answers.forEach(answer => {
          if (answer.dimension in rawScores) {
            rawScores[answer.dimension] += answer.value * answer.weight;
          }
        });
      }
      // Round to 1 decimal
      DIMENSION_CODES.forEach(dim => {
        rawScores[dim] = Math.round(rawScores[dim] * 10) / 10;
      });

      // Compute secondary anchor (second-highest standardized score)
      const standardized = standardizeScores(rawScores);
      const sortedDimensions = Object.entries(standardized)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
      const mainAnchorCode = result.mainAnchor || sortedDimensions[0]?.[0] || "TF";
      const secondaryAnchorCode = sortedDimensions.find(([dim]) => dim !== mainAnchorCode)?.[0] || null;

      const insertData = {
        user_id: user.id,
        score_tf: rawScores.TF || 0,
        score_gm: rawScores.GM || 0,
        score_au: rawScores.AU || 0,
        score_se: rawScores.SE || 0,
        score_ec: rawScores.EC || 0,
        score_sv: rawScores.SV || 0,
        score_ch: rawScores.CH || 0,
        score_ls: rawScores.LS || 0,
        main_anchor: mainAnchorCode,
        secondary_anchor: secondaryAnchorCode,
        conflict_anchors: flatConflicts,
        risk_index: result.riskIndex ?? 0,
        stability: result.stability || "unclear",
        question_count: questionCount,
        completion_time_seconds: completionTimeSeconds || null,
        organization_id: profile?.organization_id || null,
        consultant_id: profile?.consultant_id || null,
        answers: answers ? answers.map(a => ({
          questionId: a.questionId,
          value: a.value,
          dimension: a.dimension,
          weight: a.weight,
        })) : [],
      };

      const { data, error } = await supabase
        .from("assessment_results")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-results"] });
    },
  });
}

export function useDeleteAssessmentResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resultId: string) => {
      const { error } = await supabase
        .from("assessment_results")
        .delete()
        .eq("id", resultId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-results"] });
    },
  });
}

export function convertStoredToResult(stored: StoredAssessmentResult): AssessmentResult {
  // Convert flat conflict array back to pairs
  const flatConflicts = stored.conflict_anchors || [];
  const conflictPairs: [string, string][] = [];
  for (let i = 0; i < flatConflicts.length; i += 2) {
    if (flatConflicts[i + 1]) {
      conflictPairs.push([flatConflicts[i], flatConflicts[i + 1]]);
    }
  }

  // DB stores raw scores; convert to standardized 0-100 for display
  const rawScores: Record<string, number> = {
    TF: stored.score_tf,
    GM: stored.score_gm,
    AU: stored.score_au,
    SE: stored.score_se,
    EC: stored.score_ec,
    SV: stored.score_sv,
    CH: stored.score_ch,
    LS: stored.score_ls,
  };
  const displayScores = standardizeScores(rawScores);

  const coreAdvantageAnchors = getCoreAdvantageAnchors(displayScores);

  return {
    scores: displayScores,
    mainAnchor: stored.main_anchor,
    coreAdvantageAnchors,
    conflictAnchors: conflictPairs,
    riskIndex: stored.risk_index,
    stability: stored.stability as "mature" | "developing" | "unclear",
    interpretation: {}, // Will be recalculated if needed
  };
}
