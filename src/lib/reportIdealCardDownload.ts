/**
 * Unified Ideal Life Card Report Download Utility
 *
 * Fetches the latest ideal card results from the database and
 * generates a professional PDF report with cover page.
 *
 * Quadrant content and spectrum data are fetched from the generator
 * (life_cards + life_card_quadrant_contents) so the report uses
 * locked editorial content rather than AI-invented descriptions.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  downloadReportWithCover,
  generateIdealCardReportHTML,
} from "@/lib/exportReport";
import type { Language } from "@/hooks/useLanguage";
import { IDEAL_CARDS, type CardCategory } from "@/data/idealCards";
import { getLocalDateString } from "@/lib/utils";
import {
  reportProgressStart,
  reportProgressUpdate,
  reportProgressEnd,
  getStepLabel,
} from "@/lib/reportProgressStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoredRankedCard {
  rank: number;
  cardId: number;
  category: CardCategory;
  label?: string;
  labelEn?: string;
}

export interface QuadrantContent {
  external: string;
  internal: string;
  career: string;
  relationship: string;
}

// ---------------------------------------------------------------------------
// Fetch quadrant content + spectrum from generator DB
// ---------------------------------------------------------------------------

async function fetchGeneratorData(
  rankedCards: StoredRankedCard[],
  language: Language,
): Promise<{
  quadrantMap: Record<number, QuadrantContent>;
  spectrumMap: Record<number, "career" | "neutral" | "lifestyle">;
}> {
  const cardIds = rankedCards.map((card) => card.cardId);
  const quadrantMap: Record<number, QuadrantContent> = {};
  const spectrumMap: Record<number, "career" | "neutral" | "lifestyle"> = {};

  // Step A: Fetch life_cards by sort_order to get UUIDs and spectrum_type
  const { data: lifeCards, error: lifeCardError } = await supabase
    .from("life_cards")
    .select("id, sort_order, spectrum_type")
    .in("sort_order", cardIds);

  if (lifeCardError || !lifeCards || lifeCards.length === 0) {
    console.warn("[IdealCard Report] Could not fetch life_cards for generator data:", lifeCardError);
    return { quadrantMap, spectrumMap };
  }

  // Build sort_order → UUID mapping and populate spectrumMap
  const sortOrderToUuid: Record<number, string> = {};
  for (const lifeCard of lifeCards) {
    const sortOrder = lifeCard.sort_order as number;
    sortOrderToUuid[sortOrder] = lifeCard.id as string;
    if (lifeCard.spectrum_type) {
      spectrumMap[sortOrder] = lifeCard.spectrum_type as "career" | "neutral" | "lifestyle";
    }
  }

  // Step B: Fetch quadrant contents for these card UUIDs in the right language
  const lifeCardUuids = Object.values(sortOrderToUuid);
  if (lifeCardUuids.length === 0) return { quadrantMap, spectrumMap };

  const { data: quadrants, error: quadrantError } = await supabase
    .from("life_card_quadrant_contents")
    .select("card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked")
    .in("card_id", lifeCardUuids)
    .eq("language", language);

  if (quadrantError || !quadrants) {
    console.warn("[IdealCard Report] Could not fetch quadrant contents:", quadrantError);
    return { quadrantMap, spectrumMap };
  }

  // Build UUID → sort_order reverse map for lookup
  const uuidToSortOrder: Record<string, number> = {};
  for (const [sortOrder, uuid] of Object.entries(sortOrderToUuid)) {
    uuidToSortOrder[uuid] = Number(sortOrder);
  }

  // Populate quadrantMap keyed by idealCard.id (= sort_order)
  for (const quadrant of quadrants) {
    const sortOrder = uuidToSortOrder[quadrant.card_id as string];
    if (sortOrder === undefined) continue;

    quadrantMap[sortOrder] = {
      external: (quadrant.quadrant_external as string) || "",
      internal: (quadrant.quadrant_internal as string) || "",
      career: (quadrant.quadrant_career as string) || "",
      relationship: (quadrant.quadrant_relationship as string) || "",
    };
  }

  console.log("[IdealCard Report] Generator data fetched", {
    spectrumCount: Object.keys(spectrumMap).length,
    quadrantCount: Object.keys(quadrantMap).length,
  });

  return { quadrantMap, spectrumMap };
}

// ---------------------------------------------------------------------------
// Primary download function — fetches latest from DB → generates PDF
// ---------------------------------------------------------------------------

export async function downloadLatestIdealCardReport(
  userId: string,
  userName: string,
  careerStage: string,
  language: Language,
  aiDescriptions?: Record<number, string>,
  workExperienceYears?: number | null,
): Promise<boolean> {
  reportProgressStart(getStepLabel("generating", language));
  // Step 1: Try to fetch from database (ideal_card_results table)
  const { data: latestRecord, error } = await supabase
    .from("ideal_card_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Step 2: Fallback to sessionStorage if DB has no data
  let rankedCards: StoredRankedCard[] = [];

  if (latestRecord?.ranked_cards) {
    rankedCards = latestRecord.ranked_cards as StoredRankedCard[];
  } else {
    const storedData = sessionStorage.getItem("idealCardResults");
    if (storedData) {
      rankedCards = JSON.parse(storedData) as StoredRankedCard[];
    }
  }

  reportProgressUpdate(15, getStepLabel("generating", language));
  if (rankedCards.length === 0) {
    console.error("[IdealCard Report] No results found for user:", userId, error);
    reportProgressEnd();
    return false;
  }
  console.log("[IdealCard Report] Data source:", latestRecord ? "database" : "sessionStorage", "cards:", rankedCards.length);

  // Step 3: Fetch generator data (quadrant content + spectrum types)
  const { quadrantMap, spectrumMap } = await fetchGeneratorData(rankedCards, language);

  // Step 4: Generate HTML
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const reportHtml = generateIdealCardReportHTML(
    {
      rankedCards: rankedCards.map((card) => ({
        rank: card.rank,
        cardId: card.cardId,
        category: card.category,
      })),
      userName: userName || undefined,
      createdAt: new Date().toLocaleString(
        isEn ? "en-US" : isTW ? "zh-TW" : "zh-CN",
      ),
      quadrantContents: Object.keys(quadrantMap).length > 0 ? quadrantMap : undefined,
      spectrumTypes: Object.keys(spectrumMap).length > 0 ? spectrumMap : undefined,
      aiDescriptions: aiDescriptions && Object.keys(aiDescriptions).length > 0 ? aiDescriptions : undefined,
    },
    language,
  );

  reportProgressUpdate(25, getStepLabel("generating", language));
  // Step 5: Download with professional cover page
  await downloadReportWithCover(
    reportHtml,
    {
      reportType: "ideal_card",
      userName: userName || (isEn ? "User" : "用戶"),
      workExperienceYears: workExperienceYears ?? null,
      careerStage: careerStage || "mid",
      reportVersion: "professional",
      language,
      userId,
    },
    `SCPC-Espresso-Card-Report-${getLocalDateString(language)}.pdf`,
    false,
    30,
  );

  return true;
}
