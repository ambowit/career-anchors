import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ────────────────────────────────────────

export interface BatchAssessment {
  id: string;
  batch_name: string;
  organization_id: string | null;
  organization_name: string;
  assessment_type: "career_anchor" | "life_card" | "combined";
  status: "draft" | "active" | "paused" | "closed" | "archived";
  batch_slug: string;
  access_code: string;
  language: string;
  instructions: string;
  start_time: string;
  end_time: string;
  allow_repeat_entry: boolean;
  allow_resume: boolean;
  allow_view_report: boolean;
  employee_report_access_mode: "view_and_download" | "view_only" | "hidden";
  reminder_1_day: boolean;
  reminder_3_day: boolean;
  reminder_before_deadline: boolean;
  max_code_attempts: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BatchSession {
  id: string;
  batch_id: string;
  participant_name: string;
  department: string;
  email: string;
  work_years: number | null;
  status: "in_progress" | "completed" | "abandoned";
  session_token: string;
  answers: any;
  current_question_index: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface BatchResult {
  id: string;
  session_id: string;
  batch_id: string;
  participant_name: string;
  department: string;
  email: string;
  work_years: number | null;
  calculated_scores: Record<string, number>;
  main_anchor: string;
  conflict_pairs: [string, string][];
  duration_seconds: number;
  completed_at: string;
  value_ranking?: Array<{ rank: number; cardId: number; category: string; label?: string; labelEn?: string }>;
}

export interface CreateBatchInput {
  batch_name: string;
  organization_id: string | null;
  organization_name: string;
  assessment_type: string;
  language: string;
  instructions: string;
  start_time: string;
  end_time: string;
  allow_repeat_entry: boolean;
  allow_resume: boolean;
  allow_view_report: boolean;
  employee_report_access_mode: "view_and_download" | "view_only" | "hidden";
  reminder_1_day: boolean;
  reminder_3_day: boolean;
  reminder_before_deadline: boolean;
}

// ─── Helpers ──────────────────────────────────────

function generateSlug(batchName: string): string {
  const cleanName = batchName
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 20);
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${cleanName}-${randomSuffix}`;
}

function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 6; index++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ─── Hooks ────────────────────────────────────────

export function useBatchAssessments(isSuperAdmin: boolean) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["batch-assessments", isSuperAdmin, profile?.organization_id],
    queryFn: async () => {
      let query = supabase
        .from("scpc_assessment_batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isSuperAdmin && profile?.organization_id) {
        query = query.eq("organization_id", profile.organization_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BatchAssessment[];
    },
    enabled: !!profile,
  });
}

export function useBatchDetail(batchId: string | undefined) {
  return useQuery({
    queryKey: ["batch-assessment-detail", batchId],
    queryFn: async () => {
      if (!batchId) return null;
      const { data, error } = await supabase
        .from("scpc_assessment_batches")
        .select("*")
        .eq("id", batchId)
        .single();
      if (error) throw error;
      return data as BatchAssessment;
    },
    enabled: !!batchId,
  });
}

export function useBatchSessions(batchId: string | undefined) {
  return useQuery({
    queryKey: ["batch-sessions", batchId],
    queryFn: async () => {
      if (!batchId) return [];
      const { data, error } = await supabase
        .from("scpc_assessment_sessions")
        .select("*")
        .eq("batch_id", batchId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as BatchSession[];
    },
    enabled: !!batchId,
    refetchInterval: 15000,
  });
}

export function useBatchResults(batchId: string | undefined) {
  return useQuery({
    queryKey: ["batch-results", batchId],
    queryFn: async () => {
      if (!batchId) return [];
      const { data, error } = await supabase
        .from("scpc_assessment_results")
        .select("*")
        .eq("batch_id", batchId)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return (data || []) as BatchResult[];
    },
    enabled: !!batchId,
    refetchInterval: 15000,
  });
}

export function useBatchAccessLogs(batchId: string | undefined) {
  return useQuery({
    queryKey: ["batch-access-logs", batchId],
    queryFn: async () => {
      if (!batchId) return [];
      const { data, error } = await supabase
        .from("scpc_batch_access_logs")
        .select("*")
        .eq("batch_id", batchId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!batchId,
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateBatchInput) => {
      const batchSlug = generateSlug(input.batch_name);
      const accessCode = generateAccessCode();

      const { data, error } = await supabase
        .from("scpc_assessment_batches")
        .insert({
          ...input,
          batch_slug: batchSlug,
          access_code: accessCode,
          status: "draft",
          created_by: profile?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Log batch creation
      await supabase.from("scpc_batch_access_logs").insert({
        batch_id: data.id,
        event_type: "batch_created",
        metadata: { created_by: profile?.email },
      });

      return data as BatchAssessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-assessments"] });
    },
  });
}

export function useUpdateBatchStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchId, status }: { batchId: string; status: string }) => {
      const { error } = await supabase
        .from("scpc_assessment_batches")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", batchId);
      if (error) throw error;

      // Log status change
      const eventMap: Record<string, string> = {
        paused: "batch_paused",
        closed: "batch_closed",
      };
      if (eventMap[status]) {
        await supabase.from("scpc_batch_access_logs").insert({
          batch_id: batchId,
          event_type: eventMap[status],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["batch-assessment-detail"] });
    },
  });
}

export interface UpdateBatchInput {
  batchId: string;
  batch_name?: string;
  start_time?: string;
  end_time?: string;
  instructions?: string;
  allow_repeat_entry?: boolean;
  allow_resume?: boolean;
  allow_view_report?: boolean;
  employee_report_access_mode?: "view_and_download" | "view_only" | "hidden";
  reminder_1_day?: boolean;
  reminder_3_day?: boolean;
  reminder_before_deadline?: boolean;
}

export function useUpdateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ batchId, ...fields }: UpdateBatchInput) => {
      const { error } = await supabase
        .from("scpc_assessment_batches")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", batchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["batch-assessment-detail"] });
    },
  });
}

export function useResetAccessCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchId: string) => {
      const newCode = generateAccessCode();
      const { error } = await supabase
        .from("scpc_assessment_batches")
        .update({ access_code: newCode, updated_at: new Date().toISOString() })
        .eq("id", batchId);
      if (error) throw error;
      return newCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-assessment-detail"] });
    },
  });
}
