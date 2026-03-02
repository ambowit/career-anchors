import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserReport {
  id: string;
  user_id: string;
  assessment_id: string | null;
  report_type: "assessment" | "comprehensive" | "trend" | "ideal_card";
  title: string;
  report_data: Record<string, unknown>;
  consultant_id: string | null;
  organization_id: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export function useMyReports() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-reports", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_reports")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as UserReport[];
    },
    enabled: !!user,
  });
}

export function useSaveReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (reportData: {
      assessment_id?: string;
      report_type: UserReport["report_type"];
      title: string;
      report_data: Record<string, unknown>;
      consultant_id?: string;
      organization_id?: string;
    }) => {
      const { error } = await supabase.from("user_reports").insert({
        user_id: user?.id,
        assessment_id: reportData.assessment_id || null,
        report_type: reportData.report_type,
        title: reportData.title,
        report_data: reportData.report_data,
        consultant_id: reportData.consultant_id || null,
        organization_id: reportData.organization_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-reports"] });
    },
  });
}

export function useArchiveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("user_reports")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-reports"] });
    },
  });
}
