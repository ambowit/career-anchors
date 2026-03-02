import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Message {
  id: string;
  sender_id: string | null;
  recipient_id: string;
  subject: string;
  content: string;
  message_type: "system" | "notification" | "personal" | "report_share" | "assessment_assign" | "reminder";
  channel: "org_internal" | "consultant_client" | "platform_user" | "system";
  is_read: boolean;
  metadata: Record<string, unknown>;
  organization_id: string | null;
  created_at: string;
  sender?: { full_name: string; email: string; role_type: string; avatar_url: string } | null;
  recipient?: { full_name: string; email: string; role_type: string; avatar_url: string } | null;
}

export function useInboxMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["messages", "inbox", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Message[];
    },
    enabled: !!user,
  });
}

export function useSentMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["messages", "sent", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Message[];
    },
    enabled: !!user,
  });
}

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["messages", "unread-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (messageData: {
      recipient_id: string;
      subject: string;
      content: string;
      message_type?: Message["message_type"];
      channel?: Message["channel"];
      metadata?: Record<string, unknown>;
      organization_id?: string | null;
    }) => {
      const { error } = await supabase.from("messages").insert({
        sender_id: user?.id,
        recipient_id: messageData.recipient_id,
        subject: messageData.subject,
        content: messageData.content,
        message_type: messageData.message_type || "personal",
        channel: messageData.channel || "system",
        metadata: messageData.metadata || {},
        organization_id: messageData.organization_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

// Super admin: fetch ALL messages for monitoring
export function useAllMessages(filters?: {
  channel?: string;
  messageType?: string;
  dateRange?: string;
}) {
  return useQuery({
    queryKey: ["messages", "all", filters],
    queryFn: async () => {
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.channel && filters.channel !== "all") {
        query = query.eq("channel", filters.channel);
      }
      if (filters?.messageType && filters.messageType !== "all") {
        query = query.eq("message_type", filters.messageType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Message[];
    },
  });
}
