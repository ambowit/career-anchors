import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/** Production domain for participant-facing assessment links */
export const SITE_ORIGIN = "https://www.scpc-career.com";

/**
 * Returns today's date formatted for the given product language.
 * Used in PDF filenames so the date reads naturally in the user's locale.
 */
export function getLocalDateString(language: string): string {
  const locale = language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  return new Date().toLocaleDateString(locale);
}

/**
 * Resolves the display name for reports by checking multiple data sources.
 * Priority: profile.full_name > auth metadata > email prefix > generic fallback.
 */
/**
 * Resolves work experience years from multiple sources with career-stage fallback.
 * Priority: profile DB value > zustand local store > career-stage inference > null.
 */
export function resolveWorkExperienceYears(
  profileYears: number | null | undefined,
  zustandYears: number | null | undefined,
  careerStage: string | null | undefined,
): number | null {
  if (typeof profileYears === "number" && profileYears > 0) return profileYears;
  if (typeof zustandYears === "number" && zustandYears > 0) return zustandYears;
  // Infer a representative value from career stage when no explicit years available
  if (careerStage) {
    const stageToYears: Record<string, number> = {
      early: 3,
      entry: 3,
      mid: 8,
      senior: 15,
      executive: 18,
      entrepreneur: 12,
      hr: 8,
    };
    const inferred = stageToYears[careerStage];
    if (inferred) return inferred;
  }
  return null;
}

export function resolveUserDisplayName(
  profile: { full_name?: string | null } | null,
  user: { user_metadata?: Record<string, unknown>; email?: string | null } | null,
  language: string,
): string {
  if (profile?.full_name) return profile.full_name;
  const metaName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  if (typeof metaName === "string" && metaName.trim()) return metaName.trim();
  if (user?.email) {
    const prefix = user.email.split("@")[0];
    if (prefix && prefix.length > 1) return prefix;
  }
  return language === "en" ? "User" : "用戶";
}

