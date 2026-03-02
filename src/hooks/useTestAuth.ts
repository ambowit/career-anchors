import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";

// All 8 roles match RoleType from permissions.ts
export type UserRole =
  | "super_admin"
  | "org_admin"
  | "hr"
  | "department_manager"
  | "employee"
  | "consultant"
  | "client"
  | "individual"
  | "partner";

export type CareerStage = "early" | "mid" | "senior" | "executive" | "hr" | null;
export type AssessmentMode = "adaptive" | "full";
export type LanguageKey = "zh-CN" | "zh-TW" | "en";

// ─── Test Account Definitions ──────────────────────────────────────────

export interface TestAccount {
  name: Record<string, string>;
  email: string;
  password: string;
  category: "platform" | "organization" | "consultant" | "individual";
}

export const TEST_ACCOUNTS: Record<UserRole, TestAccount> = {
  super_admin: {
    name: { "zh-CN": "超级管理员", "zh-TW": "超級管理員", en: "Super Admin" },
    email: "superadmin@scpc.demo",
    password: "SCPC2024!SuperAdmin",
    category: "platform",
  },
  org_admin: {
    name: { "zh-CN": "机构管理员", "zh-TW": "機構管理員", en: "Org Admin" },
    email: "orgadmin@scpc.demo",
    password: "SCPC2024!OrgAdmin",
    category: "organization",
  },
  hr: {
    name: { "zh-CN": "HR专员", "zh-TW": "HR專員", en: "HR" },
    email: "hr@scpc.demo",
    password: "SCPC2024!HRTest",
    category: "organization",
  },
  department_manager: {
    name: { "zh-CN": "部门主管", "zh-TW": "部門主管", en: "Dept Manager" },
    email: "manager@scpc.demo",
    password: "SCPC2024!Manager",
    category: "organization",
  },
  employee: {
    name: { "zh-CN": "测试员工", "zh-TW": "測試員工", en: "Employee" },
    email: "employee@scpc.demo",
    password: "SCPC2024!Employee",
    category: "organization",
  },
  consultant: {
    name: { "zh-CN": "咨询师", "zh-TW": "諮詢師", en: "Consultant" },
    email: "consultant@scpc.demo",
    password: "SCPC2024!Consult",
    category: "consultant",
  },
  client: {
    name: { "zh-CN": "咨询客户", "zh-TW": "諮詢客戶", en: "Client" },
    email: "client@scpc.demo",
    password: "SCPC2024!Client",
    category: "consultant",
  },
  individual: {
    name: { "zh-CN": "个人用户", "zh-TW": "個人使用者", en: "Individual" },
    email: "user@scpc.demo",
    password: "SCPC2024!IndUser",
    category: "individual",
  },
  partner: {
    name: { "zh-CN": "合作方", "zh-TW": "合作方", en: "Partner" },
    email: "partner@scpc.demo",
    password: "SCPC2024!Partner",
    category: "platform",
  },
};

// ─── Role Helpers ───────────────────────────────────────────────────────

/** Does this role have a management console? */
export function isConsoleRole(role: UserRole): boolean {
  return ["super_admin", "org_admin", "hr", "department_manager", "consultant", "partner"].includes(role);
}

/** Is this a regular end-user role? (no console) */
export function isUserRole(role: UserRole): boolean {
  return ["employee", "client", "individual"].includes(role);
}


/** Console path for each role */
export function getTestConsolePath(role: UserRole): string {
  switch (role) {
    case "super_admin": return "/super-admin";
    case "org_admin":
    case "hr":
    case "department_manager": return "/org";
    case "consultant": return "/consultant";
    case "partner": return "/partner";
    default: return "/";
  }
}

/** Distinct avatar color per role */
export function getRoleColor(role: UserRole): string {
  switch (role) {
    case "super_admin": return "hsl(0, 65%, 48%)";
    case "org_admin": return "hsl(228, 51%, 23%)";
    case "hr": return "hsl(270, 50%, 50%)";
    case "department_manager": return "hsl(200, 60%, 45%)";
    case "consultant": return "hsl(340, 55%, 50%)";
    case "employee": return "hsl(150, 50%, 42%)";
    case "client": return "hsl(30, 65%, 50%)";
    case "individual": return "hsl(75, 55%, 45%)";
    case "partner": return "hsl(280, 55%, 50%)";
    default: return "hsl(220, 15%, 50%)";
  }
}

/** Two-letter initials per role */
export function getRoleInitials(role: UserRole): string {
  switch (role) {
    case "super_admin": return "SA";
    case "org_admin": return "OA";
    case "hr": return "HR";
    case "department_manager": return "DM";
    case "consultant": return "CS";
    case "employee": return "EM";
    case "client": return "CL";
    case "individual": return "IN";
    case "partner": return "PT";
    default: return "U";
  }
}

/** Category labels for grouping test accounts */
export function getCategoryLabel(category: string, language: LanguageKey): string {
  const labels: Record<string, Record<string, string>> = {
    platform: { "zh-CN": "平台级", "zh-TW": "平台級", en: "Platform" },
    organization: { "zh-CN": "企业级", "zh-TW": "企業級", en: "Organization" },
    consultant: { "zh-CN": "咨询级", "zh-TW": "諮詢級", en: "Consultant" },
    individual: { "zh-CN": "个人", "zh-TW": "個人", en: "Individual" },
  };
  return labels[category]?.[language] ?? category;
}

// ─── Career Stage Utilities ──────────────────────────────────────────

export function deriveCareerStage(workYears: number | null, isExecutive: boolean, isEntrepreneur: boolean): CareerStage {
  if (workYears === null) return null;
  if (isExecutive || isEntrepreneur) return "executive";
  if (workYears <= 5) return "early";
  if (workYears <= 10) return "mid";
  return "senior";
}

export function getWorkExperienceDescription(
  workYears: number | null,
  isExecutive: boolean,
  isEntrepreneur: boolean,
  language: LanguageKey,
): string {
  if (workYears === null) return "";

  const roleLabels: string[] = [];
  if (isExecutive) {
    roleLabels.push(language === "en" ? "executive" : language === "zh-TW" ? "高管" : "高管");
  }
  if (isEntrepreneur) {
    roleLabels.push(language === "en" ? "entrepreneur" : language === "zh-TW" ? "創業者" : "创业者");
  }

  if (language === "en") {
    let seniority: string;
    if (isExecutive || isEntrepreneur) {
      seniority = "executive/entrepreneur";
    } else if (workYears <= 5) {
      seniority = "early-career professional";
    } else if (workYears <= 10) {
      seniority = "mid-career professional";
    } else {
      seniority = "senior professional";
    }
    const roleStr = roleLabels.length > 0 ? ` and ${roleLabels.join("/")}` : "";
    return `As a ${seniority} with ${workYears} year${workYears !== 1 ? "s" : ""} of work experience${roleStr}`;
  }

  const isTW = language === "zh-TW";
  let seniority: string;
  if (isExecutive || isEntrepreneur) {
    seniority = isTW ? "高管/創業者" : "高管/创业者";
  } else if (workYears <= 5) {
    seniority = isTW ? "職場新人" : "职场新人";
  } else if (workYears <= 10) {
    seniority = isTW ? "有一定經驗的職場人士" : "有一定经验的职场人士";
  } else {
    seniority = isTW ? "資深職場人士" : "资深职场人士";
  }
  const roleStr = roleLabels.length > 0 ? `、${roleLabels.join("/")}` : "";
  const yearUnit = isTW ? "年" : "年";
  const prefix = isTW ? "作為擁有" : "作为拥有";
  const expStr = isTW ? "工作經驗的" : "工作经验的";
  return `${prefix}${workYears}${yearUnit}${expStr}${seniority}${roleStr}`;
}

// ─── Zustand Store ───────────────────────────────────────────────────

interface TestAuthState {
  isTestLoggedIn: boolean;
  testRole: UserRole;
  careerStage: CareerStage;
  workYears: number | null;
  isExecutive: boolean;
  isEntrepreneur: boolean;
  assessmentMode: AssessmentMode;
  includeCareerAnchor: boolean;
  includeIdealCard: boolean;
  isLoading: boolean;
  error: string | null;
}

interface TestAuthActions {
  testLogin: (role: UserRole) => Promise<void>;
  testLogout: () => Promise<void>;
  setCareerStage: (stage: CareerStage) => Promise<void>;
  setWorkYears: (years: number | null) => void;
  setIsExecutive: (value: boolean) => void;
  setIsEntrepreneur: (value: boolean) => void;
  setAssessmentMode: (mode: AssessmentMode) => void;
  setIncludeCareerAnchor: (include: boolean) => void;
  setIncludeIdealCard: (include: boolean) => void;
  clearError: () => void;
}

type TestAuthStore = TestAuthState & TestAuthActions;

export const useTestAuth = create<TestAuthStore>()(
  persist(
    (set, get) => ({
      isTestLoggedIn: false,
      testRole: "individual" as UserRole,
      careerStage: null,
      workYears: null,
      isExecutive: false,
      isEntrepreneur: false,
      assessmentMode: "full" as AssessmentMode,
      includeCareerAnchor: true,
      includeIdealCard: false,
      isLoading: false,
      error: null,

      testLogin: async (role: UserRole) => {
        set({ isLoading: true, error: null });

        const account = TEST_ACCOUNTS[role];

        try {
          // Sign in (or sign up if first time)
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: account.email,
            password: account.password,
          });

          let userId: string | null = null;

          if (signInError) {
            if (signInError.message.includes("Invalid login credentials")) {
              // Create the test account
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: account.email,
                password: account.password,
                options: {
                  data: {
                    full_name: account.name["zh-CN"],
                    role: isConsoleRole(role) ? "admin" : "user",
                  },
                },
              });

              if (signUpError) throw signUpError;

              if (signUpData.user && !signUpData.session) {
                const { error: retryError } = await supabase.auth.signInWithPassword({
                  email: account.email,
                  password: account.password,
                });
                if (retryError) {
                  console.log("Account created, email verification may be required");
                }
              }

              userId = signUpData.user?.id ?? null;
            } else {
              throw signInError;
            }
          } else {
            userId = signInData.user?.id ?? null;
          }

          // Ensure we have the current user
          if (!userId) {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            userId = currentUser?.id ?? null;
          }

          if (userId) {
            // Use SECURITY DEFINER RPC to bootstrap test account
            // This bypasses RLS to create demo org and set profile role
            const needsOrg = ["org_admin", "hr", "department_manager", "employee"].includes(role);

            const { data: setupResult, error: setupError } = await supabase.rpc(
              "setup_test_account",
              {
                p_user_id: userId,
                p_email: account.email,
                p_full_name: account.name["zh-CN"],
                p_role: isConsoleRole(role) ? "admin" : "user",
                p_role_type: role,
                p_needs_org: needsOrg,
              }
            );

            if (setupError) {
              console.error("Failed to setup test account:", setupError);
            }
          }

          set({
            isTestLoggedIn: true,
            testRole: role,
            careerStage: null,
            workYears: null,
            isExecutive: false,
            isEntrepreneur: false,
            assessmentMode: "full",
            includeCareerAnchor: true,
            includeIdealCard: false,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Login failed";
          set({
            isLoading: false,
            error: errorMessage,
            isTestLoggedIn: false,
          });
          console.error("Test login error:", error);
        }
      },

      testLogout: async () => {
        set({ isLoading: true });

        try {
          await supabase.auth.signOut();
          set({
            isTestLoggedIn: false,
            testRole: "individual",
            careerStage: null,
            workYears: null,
            isExecutive: false,
            isEntrepreneur: false,
            assessmentMode: "full",
            includeCareerAnchor: true,
            includeIdealCard: false,
            isLoading: false,
          });
        } catch (error) {
          console.error("Logout error:", error);
          set({ isLoading: false });
        }
      },

      setCareerStage: async (stage: CareerStage) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("profiles").update({
            career_stage: stage,
            updated_at: new Date().toISOString(),
          }).eq("id", user.id);
        }

        set({ careerStage: stage });
      },

      setWorkYears: (years: number | null) => {
        const state = get();
        const derivedStage = deriveCareerStage(years, state.isExecutive, state.isEntrepreneur);
        set({ workYears: years, careerStage: derivedStage });
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from("profiles").update({
              career_stage: derivedStage,
              updated_at: new Date().toISOString(),
            }).eq("id", user.id);
          }
        });
      },

      setIsExecutive: (value: boolean) => {
        const state = get();
        const derivedStage = deriveCareerStage(state.workYears, value, state.isEntrepreneur);
        set({ isExecutive: value, careerStage: derivedStage });
      },

      setIsEntrepreneur: (value: boolean) => {
        const state = get();
        const derivedStage = deriveCareerStage(state.workYears, state.isExecutive, value);
        set({ isEntrepreneur: value, careerStage: derivedStage });
      },

      setAssessmentMode: (mode: AssessmentMode) => {
        set({ assessmentMode: mode });
      },

      setIncludeCareerAnchor: (include: boolean) => {
        set({ includeCareerAnchor: include });
      },

      setIncludeIdealCard: (include: boolean) => {
        set({ includeIdealCard: include });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "test-auth-storage",
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>;
        if (version < 2) {
          // Migrate old "user" | "admin" roles to new system
          const oldRole = state.testRole as string;
          return {
            ...state,
            testRole: oldRole === "admin" ? "super_admin" : "individual",
            isTestLoggedIn: false, // Force re-login with new system
          };
        }
        return state;
      },
      partialize: (state) => ({
        isTestLoggedIn: state.isTestLoggedIn,
        testRole: state.testRole,
        careerStage: state.careerStage,
        workYears: state.workYears,
        isExecutive: state.isExecutive,
        isEntrepreneur: state.isEntrepreneur,
        assessmentMode: state.assessmentMode,
        includeCareerAnchor: state.includeCareerAnchor,
        includeIdealCard: state.includeIdealCard,
      }),
    }
  )
);



// ─── Profile Helper ──────────────────────────────────────────────────

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}
