import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CardCategory } from "@/data/idealCards";

export interface StoredIdealCardResult {
  id: string;
  user_id: string;
  ranked_cards: Array<{
    rank: number;
    cardId: number;
    category: CardCategory;
    label?: string;
    labelEn?: string;
  }>;
  top10_cards: Array<{
    rank: number;
    cardId: number;
    category: CardCategory;
    label?: string;
    labelEn?: string;
  }>;
  category_distribution: Record<string, number>;
  created_at: string;
}

export function useIdealCardHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ideal-card-results", user?.id],
    queryFn: async (): Promise<StoredIdealCardResult[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("ideal_card_results")
        .select("id, user_id, ranked_cards, top10_cards, category_distribution, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as StoredIdealCardResult[];
    },
    enabled: !!user,
  });
}
