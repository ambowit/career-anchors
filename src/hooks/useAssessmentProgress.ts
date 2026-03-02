import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Answer } from "@/hooks/useAssessment";

interface AssessmentProgress {
  id: string;
  user_id: string;
  current_index: number;
  answers: Answer[];
  question_order: string[];
  started_at: string;
  updated_at: string;
}

export function useAssessmentProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["assessment-progress", user?.id],
    queryFn: async (): Promise<AssessmentProgress | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("assessment_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          answers: (data.answers as unknown as Answer[]) || [],
          question_order: data.question_order || [],
        };
      }
      return null;
    },
    enabled: !!user,
  });
}

interface SaveProgressParams {
  currentIndex: number;
  answers: Answer[];
  questionOrder: string[];
}

export function useSaveAssessmentProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ currentIndex, answers, questionOrder }: SaveProgressParams) => {
      if (!user) throw new Error("User not authenticated");

      const { data: existing } = await supabase
        .from("assessment_progress")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("assessment_progress")
          .update({
            current_index: currentIndex,
            answers: answers as unknown as Record<string, unknown>[],
            question_order: questionOrder,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("assessment_progress")
          .insert({
            user_id: user.id,
            current_index: currentIndex,
            answers: answers as unknown as Record<string, unknown>[],
            question_order: questionOrder,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-progress"] });
    },
  });
}

export function useClearAssessmentProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await supabase
        .from("assessment_progress")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-progress"] });
    },
  });
}
