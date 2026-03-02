import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface MyAssignment {
  id: string;
  assigned_by: string;
  assessment_version: string;
  status: string;
  due_date: string | null;
  notes: string;
  created_at: string;
  batch_id: string | null;
  target_description: string | null;
  organization_id: string | null;
  assignerName: string;
}

export function useMyPendingAssignments() {
  const { user } = useAuth();
  return useQuery<MyAssignment[]>({
    queryKey: ["my-assignments", "pending", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from("assessment_assignments")
        .select("*")
        .eq("assigned_to", user!.id)
        .in("status", ["pending", "in_progress"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (!assignments || assignments.length === 0) return [];

      // Fetch assigner names
      const assignerIds = [...new Set(assignments.map((a) => a.assigned_by))];
      let assignerMap = new Map<string, string>();
      if (assignerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", assignerIds);
        if (profiles) {
          profiles.forEach((p) =>
            assignerMap.set(p.id, p.full_name || p.email || "")
          );
        }
      }

      return assignments.map((a) => ({
        ...a,
        assignerName: assignerMap.get(a.assigned_by) || "",
      }));
    },
  });
}

export function useCompleteAssignment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessmentResultId: string) => {
      if (!user) return;

      // Find the earliest pending/in_progress assignment and mark completed
      const { data: assignments, error: fetchError } = await supabase
        .from("assessment_assignments")
        .select("id")
        .eq("assigned_to", user.id)
        .in("status", ["pending", "in_progress"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })
        .limit(1);

      if (fetchError) throw fetchError;
      if (!assignments || assignments.length === 0) return;

      const assignmentId = assignments[0].id;
      const { error: updateError } = await supabase
        .from("assessment_assignments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", assignmentId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["org", "assessments"] });
    },
  });
}
