import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Language } from "@/hooks/useLanguage";

// Certification Types
export interface CertificationType {
  id: string;
  type_code: string;
  type_name_zh_tw: string;
  type_name_zh_cn: string;
  type_name_en: string;
  description_zh_tw: string;
  description_zh_cn: string;
  description_en: string;
  level: number;
  validity_years: number;
  cdu_requirement: number;
  price_ntd: number;
  sort_order: number;
  is_active: boolean;
}

export function useCertificationTypes() {
  return useQuery({
    queryKey: ["certification-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certification_types")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as CertificationType[];
    },
  });
}

// CP Packages
export interface CpPackage {
  id: string;
  package_code: string;
  package_name_zh_tw: string;
  package_name_zh_cn: string;
  package_name_en: string;
  cp_amount: number;
  price_ntd: number;
  bonus_cp: number;
  discount_percent: number;
  description_zh_tw: string;
  description_zh_cn: string;
  description_en: string;
  valid_days: number | null;
  sort_order: number;
  is_active: boolean;
}

export function useCpPackages() {
  return useQuery({
    queryKey: ["cp-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cp_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as CpPackage[];
    },
  });
}

// Assessment Questions
export interface AssessmentQuestion {
  id: string;
  question_number: number;
  question_text_zh_tw: string;
  question_text_zh_cn: string;
  question_text_en: string;
  anchor_code: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export function useAssessmentQuestions() {
  return useQuery({
    queryKey: ["assessment-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_questions")
        .select("*")
        .eq("is_active", true)
        .order("question_number", { ascending: true });
      
      if (error) throw error;
      return data as AssessmentQuestion[];
    },
  });
}

// System Settings
export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: unknown;
  setting_type: string;
  description: string;
  is_public: boolean;
  category: string;
}

export function useSystemSettings(isPublicOnly = true) {
  return useQuery({
    queryKey: ["system-settings", isPublicOnly],
    queryFn: async () => {
      let query = supabase.from("system_settings").select("*");
      
      if (isPublicOnly) {
        query = query.eq("is_public", true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as SystemSetting[];
    },
  });
}

// FAQ
export interface FaqItem {
  id: string;
  question_zh_tw: string;
  question_zh_cn: string;
  question_en: string;
  answer_zh_tw: string;
  answer_zh_cn: string;
  answer_en: string;
  category: string;
  sort_order: number;
  is_published: boolean;
}

export function useFaq() {
  return useQuery({
    queryKey: ["faq"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as FaqItem[];
    },
  });
}

// Helper functions for multilingual content
export function getLocalizedName(
  item: { 
    type_name_zh_tw?: string; 
    type_name_zh_cn?: string; 
    type_name_en?: string;
    package_name_zh_tw?: string;
    package_name_zh_cn?: string;
    package_name_en?: string;
  }, 
  language: Language
): string {
  if ("type_name_zh_tw" in item) {
    switch (language) {
      case "zh-TW": return item.type_name_zh_tw || "";
      case "zh-CN": return item.type_name_zh_cn || "";
      case "en": return item.type_name_en || "";
      default: return item.type_name_zh_tw || "";
    }
  }
  if ("package_name_zh_tw" in item) {
    switch (language) {
      case "zh-TW": return item.package_name_zh_tw || "";
      case "zh-CN": return item.package_name_zh_cn || "";
      case "en": return item.package_name_en || "";
      default: return item.package_name_zh_tw || "";
    }
  }
  return "";
}

export function getLocalizedDescription(
  item: { 
    description_zh_tw?: string; 
    description_zh_cn?: string; 
    description_en?: string;
  }, 
  language: Language
): string {
  switch (language) {
    case "zh-TW": return item.description_zh_tw || "";
    case "zh-CN": return item.description_zh_cn || "";
    case "en": return item.description_en || "";
    default: return item.description_zh_tw || "";
  }
}

export function getLocalizedQuestion(
  item: { 
    question_text_zh_tw?: string; 
    question_text_zh_cn?: string; 
    question_text_en?: string;
    question_zh_tw?: string;
    question_zh_cn?: string;
    question_en?: string;
  }, 
  language: Language
): string {
  if ("question_text_zh_tw" in item) {
    switch (language) {
      case "zh-TW": return item.question_text_zh_tw || "";
      case "zh-CN": return item.question_text_zh_cn || "";
      case "en": return item.question_text_en || "";
      default: return item.question_text_zh_tw || "";
    }
  }
  if ("question_zh_tw" in item) {
    switch (language) {
      case "zh-TW": return item.question_zh_tw || "";
      case "zh-CN": return item.question_zh_cn || "";
      case "en": return item.question_en || "";
      default: return item.question_zh_tw || "";
    }
  }
  return "";
}

export function getLocalizedAnswer(
  item: { 
    answer_zh_tw?: string; 
    answer_zh_cn?: string; 
    answer_en?: string;
  }, 
  language: Language
): string {
  switch (language) {
    case "zh-TW": return item.answer_zh_tw || "";
    case "zh-CN": return item.answer_zh_cn || "";
    case "en": return item.answer_en || "";
    default: return item.answer_zh_tw || "";
  }
}
