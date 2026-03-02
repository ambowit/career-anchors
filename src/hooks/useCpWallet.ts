import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CpWallet {
  id: string;
  user_id: string;
  balance_paid: number;
  balance_recharge_bonus: number;
  balance_activity: number;
  total_balance: number;
  lifetime_recharged: number;
  created_at: string;
  updated_at: string;
}

export interface MembershipTier {
  id: string;
  tier_code: string;
  tier_name_zh_tw: string;
  tier_name_zh_cn: string;
  tier_name_en: string;
  recharge_threshold_12m: number;
  single_recharge_threshold: number | null;
  discount_rate: number;
  benefits: unknown[];
  sort_order: number;
  icon_emoji: string | null;
  color_hex: string | null;
  is_active: boolean;
}

export interface UserMembership {
  id: string;
  user_id: string;
  current_tier_id: string;
  tier_achieved_at: string;
  has_purchase_history: boolean;
  rolling_12m_recharge_total: number;
  rolling_12m_start_date: string;
  next_evaluation_date: string;
  previous_tier_id: string | null;
  current_tier: MembershipTier;
  previous_tier: MembershipTier | null;
}

export interface CpTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  cp_type: string;
  amount: number;
  balance_after: number;
  balance_after_paid: number;
  balance_after_bonus: number;
  balance_after_activity: number;
  paid_used: number;
  bonus_used: number;
  activity_used: number;
  related_order_id: string | null;
  related_ledger_id: string | null;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CpLedgerEntry {
  id: string;
  user_id: string;
  cp_type: string;
  original_amount: number;
  remaining_amount: number;
  expires_at: string;
  status: string;
  acquired_at: string;
}

export function useCpWallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const walletQuery = useQuery({
    queryKey: ["cp-wallet", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("cp_wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as CpWallet | null;
    },
    enabled: !!userId,
  });

  const membershipQuery = useQuery({
    queryKey: ["cp-membership", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_memberships")
        .select(`
          *,
          current_tier:membership_tiers!current_tier_id(*)
        `)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as UserMembership | null;
    },
    enabled: !!userId,
  });

  const allTiersQuery = useQuery({
    queryKey: ["membership-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_tiers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as MembershipTier[];
    },
  });

  const transactionsQuery = useQuery({
    queryKey: ["cp-transactions", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("cp_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as CpTransaction[];
    },
    enabled: !!userId,
  });

  const expiringEntriesQuery = useQuery({
    queryKey: ["cp-expiring", userId],
    queryFn: async () => {
      if (!userId) return [];
      const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("cp_ledger_entries")
        .select("id, user_id, cp_type, original_amount, remaining_amount, expires_at, status, acquired_at")
        .eq("user_id", userId)
        .eq("status", "active")
        .gte("remaining_amount", 0.01)
        .lte("expires_at", thirtyDaysLater)
        .order("expires_at", { ascending: true });
      if (error) throw error;
      return data as CpLedgerEntry[];
    },
    enabled: !!userId,
  });

  // Real-time subscription for wallet balance changes
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`cp_wallet_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cp_wallets", filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["cp-wallet", userId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cp_transactions", filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["cp-transactions", userId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_memberships", filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["cp-membership", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const nextTier = (() => {
    if (!membershipQuery.data?.current_tier || !allTiersQuery.data) return null;
    const currentSortOrder = membershipQuery.data.current_tier.sort_order;
    const higherTiers = allTiersQuery.data
      .filter((tier) => tier.sort_order > currentSortOrder && tier.is_active)
      .sort((tierA, tierB) => tierA.sort_order - tierB.sort_order);
    return higherTiers.length > 0 ? higherTiers[0] : null;
  })();

  const tierProgressPercent = (() => {
    if (!nextTier || !membershipQuery.data) return 100;
    const currentTotal = membershipQuery.data.rolling_12m_recharge_total;
    const targetThreshold = nextTier.recharge_threshold_12m;
    if (targetThreshold <= 0) return 100;
    return Math.min(Math.round((currentTotal / targetThreshold) * 100), 100);
  })();

  const totalExpiringCp = expiringEntriesQuery.data?.reduce(
    (sum, entry) => sum + Number(entry.remaining_amount),
    0
  ) ?? 0;

  // Monthly stats computed from transactions
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthIso = monthStart.toISOString();

  const monthlyStats = (() => {
    const txns = transactionsQuery.data ?? [];
    const thisMonth = txns.filter((t) => t.created_at >= monthIso);
    let consumedTotal = 0;
    let consumedPaid = 0;
    let consumedBonus = 0;
    let consumedActivity = 0;
    let rechargedTotal = 0;

    for (const t of thisMonth) {
      if (t.transaction_type === "consumption") {
        consumedTotal += Math.abs(Number(t.amount));
        consumedPaid += Number(t.paid_used || 0);
        consumedBonus += Number(t.bonus_used || 0);
        consumedActivity += Number(t.activity_used || 0);
      }
      if (t.transaction_type === "recharge" && t.cp_type === "paid") {
        rechargedTotal += Number(t.amount);
      }
    }

    return { consumedTotal, consumedPaid, consumedBonus, consumedActivity, rechargedTotal };
  })();

  return {
    wallet: walletQuery.data ?? null,
    membership: membershipQuery.data ?? null,
    allTiers: allTiersQuery.data ?? [],
    transactions: transactionsQuery.data ?? [],
    expiringEntries: expiringEntriesQuery.data ?? [],
    nextTier,
    tierProgressPercent,
    totalExpiringCp,
    monthlyStats,
    loading: walletQuery.isLoading || membershipQuery.isLoading,
    error: walletQuery.error || membershipQuery.error,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ["cp-wallet", userId] });
      queryClient.invalidateQueries({ queryKey: ["cp-membership", userId] });
      queryClient.invalidateQueries({ queryKey: ["cp-transactions", userId] });
      queryClient.invalidateQueries({ queryKey: ["cp-expiring", userId] });
    },
  };
}
