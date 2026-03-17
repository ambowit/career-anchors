/**
 * Report Data Fetcher — V3 Template-First Data Layer
 *
 * Priority order for every content block:
 *   1. Database (Supabase tables managed by super-admin)
 *   2. Hardcoded fallback (careerStageDefaults / stageInterpretations)
 *   3. null  →  signals the caller that AI generation is needed
 *
 * AI must NEVER rewrite existing database or hardcoded text.
 */

import { supabase } from "@/integrations/supabase/client";
import { CAREER_STAGE_DEFAULTS } from "@/data/careerStageDefaults";
import {
  getStageInterpretation,
  type CareerStage,
  type StageInterpretation,
} from "@/data/stageInterpretations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LangKey = "en" | "zh-TW" | "zh-CN";

export interface CareerStageDescription {
  title: string;
  description: string;
}

export interface AnchorTextBlocks {
  anchor_explanation?: string;
  career_advice?: string;
  risk_warning?: string;
  development_path?: string;
}

export interface DualAnchorResult {
  combinationCode: string;
  tier: string;
  text: string;
}

export interface TriAnchorResult {
  triCode: string;
  archetypeName: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Language column helpers
// ---------------------------------------------------------------------------

const LANG_TO_TITLE_COL: Record<LangKey, string> = {
  "zh-CN": "title_zh_cn",
  "zh-TW": "title_zh_tw",
  en: "title_en",
};

const LANG_TO_DESC_COL: Record<LangKey, string> = {
  "zh-CN": "description_zh_cn",
  "zh-TW": "description_zh_tw",
  en: "description_en",
};

/**
 * Map database career stage key to the key used by stageInterpretations.ts.
 * Database: entry | mid | senior | executive
 * Fallback:  early | mid | senior | executive
 */
function toFallbackStageKey(databaseStageKey: string): CareerStage {
  if (databaseStageKey === "entry") return "early";
  return databaseStageKey as CareerStage;
}

/**
 * Map a 0-100 score to the band labels used by stageInterpretations.ts.
 */
function toScoreBand(score: number): "high" | "moderate" | "low" {
  if (score >= 80) return "high";
  if (score >= 60) return "moderate";
  return "low";
}

// ---------------------------------------------------------------------------
// 1. Career Stage Description  (Chapter 2)
// ---------------------------------------------------------------------------

/**
 * Fetch the career stage overview text used in Chapter 2.
 *
 * Source priority:
 *   1. `career_stage_descriptions` table
 *   2. `CAREER_STAGE_DEFAULTS` hardcoded array
 */
export async function fetchCareerStageDescription(
  stageKey: string,
  language: LangKey,
): Promise<CareerStageDescription | null> {
  // Normalize legacy "early" → "entry" (some older profiles store "early" as career_stage)
  const normalizedKey = stageKey === "early" ? "entry" : stageKey;

  const titleCol = LANG_TO_TITLE_COL[language];
  const descCol = LANG_TO_DESC_COL[language];

  // --- Priority 1: Database ---
  const { data, error } = await supabase
    .from("career_stage_descriptions")
    .select(`${titleCol}, ${descCol}`)
    .eq("stage_key", normalizedKey)
    .maybeSingle();

  if (!error && data) {
    const title = (data as Record<string, string>)[titleCol];
    const description = (data as Record<string, string>)[descCol];
    if (title && description) {
      return { title, description };
    }
  }

  // --- Priority 2: Hardcoded fallback ---
  const fallback = CAREER_STAGE_DEFAULTS.find(
    (stage) => stage.stage_key === normalizedKey,
  );
  if (fallback) {
    const titleKey = titleCol as keyof typeof fallback;
    const descKey = descCol as keyof typeof fallback;
    const title = fallback[titleKey] as string;
    const description = fallback[descKey] as string;
    if (title && description) {
      return { title, description };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// 2. Anchor Text Blocks  (Chapters 5, 8, 9)
// ---------------------------------------------------------------------------

/**
 * Fetch expert-written text blocks for a specific anchor at a given score
 * and career stage.
 *
 * Returns an object keyed by section_type (anchor_explanation, career_advice,
 * risk_warning, development_path). Missing sections are omitted.
 *
 * Source priority:
 *   1. `anchor_text_blocks` table (filtered by score range)
 *   2. `stageInterpretations.ts` hardcoded data
 */
export async function fetchAnchorTextBlocks(
  anchorType: string,
  score: number,
  careerStage: string,
  language: LangKey,
  versionId?: string | null,
): Promise<AnchorTextBlocks | null> {
  // --- Priority 1: Database ---
  let query = supabase
    .from("anchor_text_blocks")
    .select("section_type, original_text_block")
    .eq("anchor_type", anchorType)
    .eq("career_stage", careerStage)
    .eq("language", language)
    .lte("score_min", score)
    .gte("score_max", score);
  if (versionId) {
    query = query.eq("version_id", versionId);
  }
  const { data, error } = await query;

  if (!error && data && data.length > 0) {
    const blocks: AnchorTextBlocks = {};
    for (const row of data) {
      const sectionType = row.section_type as keyof AnchorTextBlocks;
      if (row.original_text_block) {
        blocks[sectionType] = row.original_text_block;
      }
    }
    // Only return if we got at least one section
    if (Object.keys(blocks).length > 0) {
      return blocks;
    }
  }

  // --- Priority 2: Hardcoded fallback ---
  const fallbackStage = toFallbackStageKey(careerStage);
  const interpretation: StageInterpretation | null = getStageInterpretation(
    anchorType,
    fallbackStage,
    score,
  );

  if (interpretation) {
    const langKey = language as string;
    const blocks: AnchorTextBlocks = {};

    // Map stageInterpretation fields → AnchorTextBlocks keys
    if (interpretation.meaning?.[langKey]) {
      blocks.anchor_explanation = interpretation.meaning[langKey];
    }
    if (interpretation.development?.[langKey]) {
      blocks.career_advice = interpretation.development[langKey];
    }
    if (interpretation.risk?.[langKey]) {
      blocks.risk_warning = interpretation.risk[langKey];
    }
    // Characteristics → development_path (array joined to prose)
    if (interpretation.characteristics?.[langKey]?.length) {
      blocks.development_path = interpretation.characteristics[langKey].join(
        language === "en" ? "; " : "；",
      );
    }

    if (Object.keys(blocks).length > 0) {
      return blocks;
    }
  }

  // Both sources empty → caller should flag for AI generation
  return null;
}

// ---------------------------------------------------------------------------
// 3. Dual-Anchor Combination Text  (Chapter 6)
// ---------------------------------------------------------------------------

/**
 * Fetch the dual-anchor combination interpretation for Chapter 6.
 *
 * Checks both (A,B) and (B,A) orderings because the database may store
 * anchors in either order.
 *
 * No hardcoded fallback — returns null to signal AI generation is needed.
 */
export async function fetchDualAnchorText(
  anchor1: string,
  anchor2: string,
  careerStage: string,
  language: LangKey,
  versionId?: string | null,
): Promise<DualAnchorResult | null> {
  // Query both orderings with a single OR filter
  let query = supabase
    .from("anchor_combination_mapping")
    .select("combination_code, tier, original_text_block")
    .eq("career_stage", careerStage)
    .eq("language", language)
    .or(
      `and(anchor_1.eq.${anchor1},anchor_2.eq.${anchor2}),and(anchor_1.eq.${anchor2},anchor_2.eq.${anchor1})`,
    )
    .limit(1);
  if (versionId) {
    query = query.eq("version_id", versionId);
  }
  const { data, error } = await query.maybeSingle();

  if (error || !data || !data.original_text_block) {
    return null;
  }

  return {
    combinationCode: data.combination_code ?? "",
    tier: data.tier ?? "",
    text: data.original_text_block,
  };
}

// ---------------------------------------------------------------------------
// 4. Triple-Anchor Archetype Text  (Chapter 7)
// ---------------------------------------------------------------------------

/**
 * Fetch the triple-anchor archetype interpretation for Chapter 7.
 *
 * Checks all 6 permutations of (A,B,C) because the database may store
 * the three anchors in any canonical order.
 *
 * No hardcoded fallback — returns null to signal AI generation is needed.
 */
export async function fetchTriAnchorText(
  anchor1: string,
  anchor2: string,
  anchor3: string,
  careerStage: string,
  language: LangKey,
  versionId?: string | null,
): Promise<TriAnchorResult | null> {
  // Build OR filter for all 6 permutations of the 3 anchors
  const permutations = generatePermutations([anchor1, anchor2, anchor3]);
  const orClauses = permutations
    .map(
      ([a, b, c]) =>
        `and(anchor_1.eq.${a},anchor_2.eq.${b},anchor_3.eq.${c})`,
    )
    .join(",");

  let query = supabase
    .from("anchor_tri_mapping")
    .select("tri_code, archetype_name, original_text_block")
    .eq("career_stage", careerStage)
    .eq("language", language)
    .or(orClauses)
    .limit(1);
  if (versionId) {
    query = query.eq("version_id", versionId);
  }
  const { data, error } = await query.maybeSingle();

  if (error || !data || !data.original_text_block) {
    return null;
  }

  return {
    triCode: data.tri_code ?? "",
    archetypeName: data.archetype_name ?? "",
    text: data.original_text_block,
  };
}

/**
 * Generate all permutations of a 3-element array.
 */
function generatePermutations(
  items: [string, string, string],
): [string, string, string][] {
  const [a, b, c] = items;
  return [
    [a, b, c],
    [a, c, b],
    [b, a, c],
    [b, c, a],
    [c, a, b],
    [c, b, a],
  ];
}

// ---------------------------------------------------------------------------
// 5. Active Report Version
// ---------------------------------------------------------------------------

/**
 * Return the UUID of the report version for a given assessment type,
 * respecting binding priority:
 *   1. User-level binding  (generator_bindings where binding_type = 'user')
 *   2. Org-level binding   (generator_bindings where binding_type = 'organization')
 *   3. Global active version (report_versions where status = 'active')
 *
 * When userId / organizationId are omitted the function falls back
 * directly to the global active version (backward-compatible).
 */
export async function fetchActiveReportVersion(
  assessmentType: "CAREER_ANCHOR" | "LIFE_CARD" | "COMBINED",
  userId?: string | null,
  organizationId?: string | null,
): Promise<string | null> {
  // Fire all 3 priority queries in parallel instead of sequentially
  const [userBindingResult, orgBindingResult, globalResult] = await Promise.all([
    // Priority 1: User-level binding
    userId
      ? (supabase as any)
          .from("generator_bindings")
          .select("version_id, version:report_versions(assessment_type)")
          .eq("binding_type", "user")
          .eq("target_id", userId)
          .limit(50)
      : Promise.resolve({ data: null }),
    // Priority 2: Org-level binding
    organizationId
      ? (supabase as any)
          .from("generator_bindings")
          .select("version_id, version:report_versions(assessment_type)")
          .eq("binding_type", "organization")
          .eq("target_id", organizationId)
          .limit(50)
      : Promise.resolve({ data: null }),
    // Priority 3: Global active version
    supabase
      .from("report_versions")
      .select("id")
      .eq("assessment_type", assessmentType)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
  ]);

  // Evaluate in priority order
  if (userBindingResult.data?.length > 0) {
    const matched = userBindingResult.data.find(
      (binding: any) => binding.version?.assessment_type === assessmentType,
    );
    if (matched) return matched.version_id;
  }

  if (orgBindingResult.data?.length > 0) {
    const matched = orgBindingResult.data.find(
      (binding: any) => binding.version?.assessment_type === assessmentType,
    );
    if (matched) return matched.version_id;
  }

  if (!globalResult.error && globalResult.data) {
    return globalResult.data.id;
  }

  return null;
}

// ---------------------------------------------------------------------------
// 6. Batch helpers — convenience wrappers for the report generator
// ---------------------------------------------------------------------------

/**
 * Fetch text blocks for ALL 8 anchors in one call.
 * Returns a map of anchor_type → AnchorTextBlocks | null.
 */
export async function fetchAllAnchorTextBlocks(
  scores: Record<string, number>,
  careerStage: string,
  language: LangKey,
  versionId?: string | null,
): Promise<Record<string, AnchorTextBlocks | null>> {
  const entries = Object.entries(scores);
  const results = await Promise.all(
    entries.map(([anchor, score]) =>
      fetchAnchorTextBlocks(anchor, score, careerStage, language, versionId),
    ),
  );

  const output: Record<string, AnchorTextBlocks | null> = {};
  entries.forEach(([anchor], index) => {
    output[anchor] = results[index];
  });
  return output;
}

/**
 * Determine whether a dual-anchor chapter should be generated.
 * Condition: top 2 anchors both ≥ 65 OR their score difference ≤ 5.
 */
export function shouldGenerateDualAnchor(
  sortedScores: [string, number][],
): boolean {
  if (sortedScores.length < 2) return false;
  const [, firstScore] = sortedScores[0];
  const [, secondScore] = sortedScores[1];
  return (firstScore >= 65 && secondScore >= 65) ||
    Math.abs(firstScore - secondScore) <= 5;
}

/**
 * Sort scores descending and return as ordered tuples.
 */
export function sortScoresDescending(
  scores: Record<string, number>,
): [string, number][] {
  return Object.entries(scores).sort(
    ([, scoreA], [, scoreB]) => scoreB - scoreA,
  );
}
