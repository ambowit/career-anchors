import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Target,
  Shield,
  Lightbulb,
  Clock,
  User,
  ChevronDown,
  LogOut,
  Check,
  ListChecks,
  Sparkles,
  Heart,
  AlertTriangle,
  Compass,
  FileText,
  BarChart3,
  Zap,
  Layers,
  Briefcase,
  Crown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useTestAuth,
  getWorkExperienceDescription,
  isConsoleRole,
  isUserRole,
  getTestConsolePath,
  getRoleColor,
  getRoleInitials,
  getCategoryLabel,
  TEST_ACCOUNTS,
  type UserRole,
  type CareerStage,
  type AssessmentMode,
  type LanguageKey,
} from "@/hooks/useTestAuth";

import { useTranslation, type Language } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/desktop/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getConsolePath } from "@/lib/permissions";

const LOGO_URL =
  "https://b.ux-cdn.com/uxarts/20260210/bd2fe8a1fd4d4cd5bcca019a03911b22.png";

// Anchor color palette for visual variety
const ANCHOR_COLORS = [
  { background: "#eef4ff", text: "#1a3a5c", badge: "#3b82f6" },
  { background: "#fef3e2", text: "#7c3a00", badge: "#f59e0b" },
  { background: "#ecfdf5", text: "#065f46", badge: "#10b981" },
  { background: "#fef2f2", text: "#7f1d1d", badge: "#ef4444" },
  { background: "#f5f3ff", text: "#4c1d95", badge: "#8b5cf6" },
  { background: "#fff7ed", text: "#7c2d12", badge: "#f97316" },
  { background: "#f0fdfa", text: "#134e4a", badge: "#14b8a6" },
  { background: "#fdf4ff", text: "#701a75", badge: "#d946ef" },
];

export default function MobileHomePage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const {
    isTestLoggedIn,
    testRole,

    careerStage,
    workYears,
    isExecutive,
    isEntrepreneur,
    assessmentMode,
    testLogin,
    testLogout,
    setWorkYears,
    setIsExecutive,
    setIsEntrepreneur,
    setAssessmentMode,
  } = useTestAuth();
  const [yearsInputValue, setYearsInputValue] = useState(workYears !== null ? String(workYears) : "");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showCareerStage, setShowCareerStage] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<'ideal_card' | 'career_anchor' | 'combined' | null>(null);
  const anchorsScrollRef = useRef<HTMLDivElement>(null);

  // Roles grouped by category for the dropdown
  const ROLES_BY_CATEGORY: Record<string, UserRole[]> = {
    platform: ["super_admin", "partner"],
    organization: ["org_admin", "hr", "department_manager", "employee"],
    consultant: ["consultant", "client"],
    individual: ["individual"],
  };
  const CATEGORY_ORDER = ["platform", "organization", "consultant", "individual"];

  const testUserName = isTestLoggedIn ? TEST_ACCOUNTS[testRole]?.name[language as LanguageKey] ?? testRole : "";

  const handleRoleSelect = async (role: UserRole) => {
    await testLogin(role);
    await refreshProfile();
    setShowRoleDropdown(false);
    if (isConsoleRole(role)) {
      navigate(getTestConsolePath(role));
    } else if (isUserRole(role)) {
      setShowCareerStage(true);
    }
  };

  const handleEmailLogin = async () => {
    if (!loginEmail || !loginPassword) return;
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      setShowRoleDropdown(false);
      setLoginEmail("");
      setLoginPassword("");
      toast.success(language === "en" ? "Logged in" : language === "zh-TW" ? "登入成功" : "登录成功");
      // Check role and navigate or show career stage
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role_type")
          .eq("id", currentUser.id)
          .single();
        const consolePath = getConsolePath((userProfile?.role_type || "individual") as any);
        if (consolePath !== "/") {
          navigate(consolePath);
        } else {
          setShowCareerStage(true);
        }
      }
    } catch (error) {
      toast.error(language === "en" ? "Login failed" : language === "zh-TW" ? "登入失敗" : "登录失败");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleStartAssessment = async () => {
    if (isTestLoggedIn && isConsoleRole(testRole)) {
      navigate(getTestConsolePath(testRole));
      return;
    }
    if (!isTestLoggedIn && !user) {
      // Fallback: check Supabase session directly
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setShowRoleDropdown(true);
        return;
      }
    }
    setShowCareerStage(true);
  };

  const handleYearsChange = (rawValue: string) => {
    if (rawValue === "") {
      setYearsInputValue("");
      setWorkYears(null);
      return;
    }
    const cleaned = rawValue.replace(/\D/g, "");
    if (cleaned === "") return;
    const years = Math.min(parseInt(cleaned, 10), 50);
    setYearsInputValue(String(years));
    setWorkYears(years);
  };

  const handleCareerStageContinue = () => {
    setShowCareerStage(false);
    if (!selectedEntry) return;

    let targetPath: string;
    if (selectedEntry === 'ideal_card') {
      targetPath = '/ideal-card-test';
      sessionStorage.removeItem('scpc_combined_assessment');
    } else if (selectedEntry === 'career_anchor') {
      targetPath = '/assessment';
      sessionStorage.removeItem('scpc_combined_assessment');
    } else {
      targetPath = '/assessment';
      sessionStorage.setItem('scpc_combined_assessment', 'true');
    }
    navigate(targetPath);
  };

  const canStartAssessment = selectedEntry !== null;

  const isLoggedIn = user || isTestLoggedIn;

  // Career anchors data
  const careerAnchors = [
    { id: 1, key: "TF" },
    { id: 2, key: "GM" },
    { id: 3, key: "AU" },
    { id: 4, key: "SE" },
    { id: 5, key: "EC" },
    { id: 6, key: "SV" },
    { id: 7, key: "CH" },
    { id: 8, key: "LS" },
  ];

  const anchorDescriptions: Record<Language, Record<string, string>> = {
    "zh-CN": {
      TF: "追求在特定领域成为专家，重视专业深度胜过管理宽度",
      GM: "渴望整合他人工作、承担责任，追求组织层级的晋升",
      AU: "需要按自己的方式工作，难以忍受组织规则和他人控制",
      SE: "重视职业稳定性和可预测性，愿意为安全感牺牲其他",
      EC: "有强烈冲动创建自己的事业，需要证明自己能创造新价值",
      SV: "工作必须体现核心价值观，追求对他人和社会的积极影响",
      CH: "被困难问题和竞争激励，需要不断征服新挑战来获得满足",
      LS: "追求工作与生活的平衡，职业必须服务于整体生活方式",
    },
    "zh-TW": {
      TF: "追求在特定領域成為專家，重視專業深度勝過管理寬度",
      GM: "渴望整合他人工作、承擔責任，追求組織層級的晉升",
      AU: "需要按自己的方式工作，難以忍受組織規則和他人控制",
      SE: "重視職業穩定性和可預測性，願意為安全感犧牲其他",
      EC: "有強烈衝動創建自己的事業，需要證明自己能創造新價值",
      SV: "工作必須體現核心價值觀，追求對他人和社會的積極影響",
      CH: "被困難問題和競爭激勵，需要不斷征服新挑戰來獲得滿足",
      LS: "追求工作與生活的平衡，職業必須服務於整體生活方式",
    },
    en: {
      TF: "Pursues expertise in a specific field, values depth over breadth",
      GM: "Desires to integrate others' work and climb the organizational ladder",
      AU: "Needs to work in their own way, struggles with rules and control",
      SE: "Values job security and predictability, willing to sacrifice for stability",
      EC: "Strong urge to create their own business and prove new value",
      SV: "Work must reflect core values, pursues positive social impact",
      CH: "Motivated by difficult problems, needs to conquer new challenges",
      LS: "Seeks work-life balance, career must serve overall lifestyle",
    },
  };

  const outputs: Record<
    Language,
    Array<{
      icon: typeof Compass;
      title: string;
      description: string;
    }>
  > = {
    "zh-CN": [
      {
        icon: Compass,
        title: "职业锚雷达图",
        description: "8维度标准化得分可视化",
      },
      {
        icon: Target,
        title: "高敏感锚识别",
        description: "识别得分>80的高敏感锚点",
      },
      {
        icon: AlertTriangle,
        title: "冲突锚警示",
        description: "揭示潜在的内心冲突",
      },
      {
        icon: FileText,
        title: "不适合清单",
        description: "不适合的工作类型和环境",
      },
      {
        icon: BarChart3,
        title: "长期风险分析",
        description: "违背高敏感锚的职业代价",
      },
      {
        icon: Zap,
        title: "行动路径建议",
        description: "学习方向与转型路径",
      },
    ],
    "zh-TW": [
      {
        icon: Compass,
        title: "職業錨雷達圖",
        description: "8維度標準化得分視覺化",
      },
      {
        icon: Target,
        title: "高敏感錨識別",
        description: "識別得分>80的高敏感錨點",
      },
      {
        icon: AlertTriangle,
        title: "衝突錨警示",
        description: "揭示潛在的內心衝突",
      },
      {
        icon: FileText,
        title: "不適合清單",
        description: "不適合的工作類型和環境",
      },
      {
        icon: BarChart3,
        title: "長期風險分析",
        description: "違背高敏感錨的職業代價",
      },
      {
        icon: Zap,
        title: "行動路徑建議",
        description: "學習方向與轉型路徑",
      },
    ],
    en: [
      {
        icon: Compass,
        title: "Career Radar Chart",
        description: "Visualized 8-dimension scores",
      },
      {
        icon: Target,
        title: "High-Sensitivity Anchors",
        description: "Identify anchors scoring >80",
      },
      {
        icon: AlertTriangle,
        title: "Conflict Warnings",
        description: "Reveal inner contradictions",
      },
      {
        icon: FileText,
        title: "Unsuitable List",
        description: "Jobs & environments to avoid",
      },
      {
        icon: BarChart3,
        title: "Risk Analysis",
        description: "Costs of ignoring key anchors",
      },
      {
        icon: Zap,
        title: "Action Paths",
        description: "Learning & transition plans",
      },
    ],
  };

  const warningText: Record<Language, string> = {
    "zh-CN":
      "请选择真实倾向，而非社会期待。本测评不会迎合你，会明确指出「不适合」的选项，并强调违背核心锚点的长期代价。",
    "zh-TW":
      "請選擇真實傾向，而非社會期待。本測評不會迎合你，會明確指出「不適合」的選項，並強調違背核心錨點的長期代價。",
    en: "Choose your true preferences, not social expectations. This assessment won't pander to you — it will point out 'unsuitable' options and emphasize long-term costs of going against your core anchors.",
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "hsl(75, 55%, 97%)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      {/* Hero Section */}
      <section
        className="relative px-5 pt-6 pb-8 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsl(75, 55%, 92%) 0%, hsl(75, 55%, 85%) 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30"
          style={{ background: "hsl(75, 55%, 60%)" }}
        />
        <div
          className="absolute bottom-0 -left-10 w-24 h-24 rounded-full opacity-20"
          style={{ background: "hsl(228, 51%, 23%)" }}
        />

        {/* Top Bar */}
        <div className="relative z-10 mb-6 flex items-center justify-between">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all",
              isTestLoggedIn
                ? "bg-white/90 shadow-sm"
                : "bg-white/70 border border-white/50"
            )}
            style={{ color: "hsl(228, 51%, 23%)" }}
          >
            {isTestLoggedIn ? (
              <>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    backgroundColor: getRoleColor(testRole),
                    color: "white",
                  }}
                >
                  {getRoleInitials(testRole)}
                </div>
                <span>{testUserName}</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4" />
                <span>{t("common.login")}</span>
              </>
            )}
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                showRoleDropdown && "rotate-180"
              )}
            />
          </button>
          <LanguageSwitcher />

          {/* Role Dropdown */}
          <AnimatePresence>
            {showRoleDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRoleDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg z-50 overflow-hidden border border-border max-h-[75vh] overflow-y-auto"
                >
                  {/* Email/Password Login */}
                  <div className="p-3 border-b border-border">
                    <div className="px-1 py-1 text-xs font-medium text-muted-foreground mb-2">
                      {language === "en" ? "Email Login" : language === "zh-TW" ? "信箱登入" : "邮箱登录"}
                    </div>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      placeholder={language === "en" ? "Email" : language === "zh-TW" ? "信箱" : "邮箱"}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground mb-2 outline-none focus:border-primary"
                      onKeyDown={(event) => event.key === "Enter" && handleEmailLogin()}
                    />
                    <div className="relative mb-2">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(event) => setLoginPassword(event.target.value)}
                        placeholder={language === "en" ? "Password" : language === "zh-TW" ? "密碼" : "密码"}
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-background text-foreground outline-none focus:border-primary pr-16"
                        onKeyDown={(event) => event.key === "Enter" && handleEmailLogin()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground px-1"
                      >
                        {showPassword ? (language === "en" ? "Hide" : language === "zh-TW" ? "隱藏" : "隐藏") : (language === "en" ? "Show" : language === "zh-TW" ? "顯示" : "显示")}
                      </button>
                    </div>
                    <button
                      onClick={handleEmailLogin}
                      disabled={emailLoading || !loginEmail || !loginPassword}
                      className="w-full py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
                      style={{ backgroundColor: "hsl(228, 51%, 23%)" }}
                    >
                      {emailLoading ? (language === "en" ? "Logging in..." : language === "zh-TW" ? "登入中..." : "登录中...") : (language === "en" ? "Login" : language === "zh-TW" ? "登入" : "登录")}
                    </button>
                  </div>

                  {/* Separator */}
                  <div className="px-4 py-2 flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {language === "en" ? "or use test account" : language === "zh-TW" ? "或使用測試帳號" : "或使用测试账户"}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Test Accounts by Category */}
                  <div className="p-2">
                    {CATEGORY_ORDER.map((category) => (
                      <div key={category} className="mb-1 last:mb-0">
                        <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {getCategoryLabel(category, language as LanguageKey)}
                        </div>
                        {ROLES_BY_CATEGORY[category].map((role) => {
                          const account = TEST_ACCOUNTS[role];
                          return (
                            <button
                              key={role}
                              onClick={() => handleRoleSelect(role)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent/10 transition-colors"
                            >
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                                style={{ backgroundColor: getRoleColor(role) }}
                              >
                                {getRoleInitials(role)}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {account.name[language as LanguageKey]}
                                </div>
                                <div className="text-[10px] text-muted-foreground truncate">
                                  {account.email}
                                </div>
                              </div>
                              {isConsoleRole(role) && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium flex-shrink-0">
                                  {language === "en" ? "Console" : "控制台"}
                                </span>
                              )}
                              {isTestLoggedIn && testRole === role && (
                                <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: getRoleColor(role) }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {isTestLoggedIn && (
                    <div className="border-t border-border p-2">
                      <button
                        onClick={() => {
                          testLogout();
                          setShowRoleDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t("common.logout")}</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src={LOGO_URL} alt="SCPC Logo" className="h-10 w-auto mb-4" />
          <h1
            className="text-2xl font-bold leading-tight mb-3"
            style={{ color: "hsl(228, 51%, 23%)" }}
          >
            {language === "en"
              ? "Explore the Career Needs Most Worth Pursuing"
              : language === "zh-TW"
                ? "探索你最值得堅持與發展的職涯底層需求"
                : "探索你最值得坚持与发展的职涯底层需求"}
          </h1>
          <p
            className="text-sm leading-relaxed mb-6"
            style={{ color: "hsl(228, 51%, 35%)" }}
          >
            {language === "en"
              ? "Based on Edgar Schein's Career Anchor Theory, helping you clearly see your long-term, deep career drivers. Let every choice bring you closer to the future that truly fits you."
              : language === "zh-TW"
                ? "基於 Edgar Schein 職業錨理論，透過系統化專業測評，讓你的每一次選擇都更靠近真正適合你的未來。"
                : "基于 Edgar Schein 职业锚理论，透过系统化专业测评，让你的每一次选择都更靠近真正适合你的未来。"}
          </p>

          <button
            onClick={handleStartAssessment}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base transition-all active:scale-95 shadow-md"
            style={{
              backgroundColor: "hsl(228, 51%, 23%)",
              color: "white",
            }}
          >
            {t("home.startAssessment")}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </section>

      {/* Stats Bar - Two Modes + Ideal Card */}
      <section
        className="px-5 py-4 border-b"
        style={{ backgroundColor: "white", borderColor: "hsl(75, 55%, 85%)" }}
      >
        <div className="flex justify-around text-center">
          <div>
            <Sparkles className="w-4 h-4 mx-auto mb-1" style={{ color: "#3498db" }} />
            <div
              className="text-sm font-bold"
              style={{ color: "hsl(228, 51%, 23%)" }}
            >
              16-28
            </div>
            <div className="text-[10px] text-muted-foreground">
              {language === "en"
                ? "Adaptive"
                : language === "zh-TW"
                  ? "自適應模式"
                  : "自适应模式"}
            </div>
          </div>
          <div
            className="w-px"
            style={{ backgroundColor: "hsl(75, 55%, 80%)" }}
          />
          <div>
            <ListChecks className="w-4 h-4 mx-auto mb-1" style={{ color: "#1a3a5c" }} />
            <div
              className="text-sm font-bold"
              style={{ color: "hsl(228, 51%, 23%)" }}
            >
              40
            </div>
            <div className="text-[10px] text-muted-foreground">
              {language === "en"
                ? "Full Mode"
                : language === "zh-TW"
                  ? "完整模式"
                  : "完整模式"}
            </div>
          </div>
          <div
            className="w-px"
            style={{ backgroundColor: "hsl(75, 55%, 80%)" }}
          />
          <div>
            <Heart className="w-4 h-4 mx-auto mb-1" style={{ color: "#e74c6f" }} />
            <div
              className="text-sm font-bold"
              style={{ color: "hsl(228, 51%, 23%)" }}
            >
              +
            </div>
            <div className="text-[10px] text-muted-foreground">
              {language === "en"
                ? "Ideal Card"
                : language === "zh-TW"
                  ? "理想人生卡"
                  : "理想人生卡"}
            </div>
          </div>
        </div>
      </section>

      {/* Warning Notice */}
      <section className="px-5 py-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: "#fef9ee",
            borderColor: "#fde68a",
          }}
        >
          <div className="flex gap-3">
            <AlertTriangle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: "#d97706" }}
            />
            <div>
              <h3
                className="font-semibold text-sm mb-1"
                style={{ color: "#92400e" }}
              >
                {language === "en"
                  ? "Before You Begin"
                  : language === "zh-TW"
                    ? "測評前須知"
                    : "测评前须知"}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "#a16207" }}>
                {warningText[language]}
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Eight Career Anchors */}
      <section className="px-5 pb-8">
        <div className="mb-4">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{
              backgroundColor: "hsl(75, 55%, 88%)",
              color: "hsl(228, 51%, 30%)",
            }}
          >
            Edgar Schein's Model
          </div>
          <h2
            className="text-lg font-bold"
            style={{ color: "hsl(228, 51%, 23%)" }}
          >
            {language === "en"
              ? "Eight Career Anchors"
              : language === "zh-TW"
                ? "八大職業錨模型"
                : "八大职业锚模型"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {language === "en"
              ? "Which anchor resonates with your core values?"
              : language === "zh-TW"
                ? "哪個職業錨最能反映你的核心價值觀？"
                : "哪个职业锚最能反映你的核心价值观？"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {careerAnchors.map((anchor, index) => {
            const colorSet = ANCHOR_COLORS[index];
            return (
              <motion.div
                key={anchor.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.04 }}
                className="p-3.5 rounded-xl border border-slate-100"
                style={{ backgroundColor: colorSet.background }}
              >
                <div
                  className="text-xs font-bold w-7 h-7 rounded-lg flex items-center justify-center text-white mb-2.5"
                  style={{ backgroundColor: colorSet.badge }}
                >
                  {anchor.id.toString().padStart(2, "0")}
                </div>
                <h3
                  className="font-semibold text-sm mb-1.5 leading-tight"
                  style={{ color: colorSet.text }}
                >
                  {t(`assessment.dimensions.${anchor.key}`)}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  {anchorDescriptions[language][anchor.key]}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Dual-Core Section */}
      <section className="px-5 py-6">
        <div className="mb-4">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{
              background: "linear-gradient(90deg, #e0f2fe, #fce7f3)",
              color: "hsl(228, 51%, 30%)",
            }}
          >
            <Layers className="w-3.5 h-3.5" />
            {language === "en"
              ? "Dual-Core Assessment"
              : language === "zh-TW"
                ? "雙核驅動"
                : "双核驱动"}
          </div>
          <h2
            className="text-lg font-bold mb-1"
            style={{ color: "hsl(228, 51%, 23%)" }}
          >
            {language === "en"
              ? "Career Anchors + Life Values"
              : language === "zh-TW"
                ? "職業錨 + 人生價值觀"
                : "职业锚 + 人生价值观"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {language === "en"
              ? "A dual-engine system integrating professional drivers with life aspirations."
              : language === "zh-TW"
                ? "將職業驅動力與人生理想整合的雙引擎系統。"
                : "将职业驱动力与人生理想整合的双引擎系统。"}
          </p>
        </div>

        <div className="space-y-3">
          {/* Career Anchor Core */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-4 rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: "#1a3a5c" }}
              >
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider">
                  Core 1
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {language === "en"
                    ? "Career Anchor Assessment"
                    : language === "zh-TW"
                      ? "職業錨測評"
                      : "职业锚测评"}
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === "en"
                ? "8 dimensions based on Edgar Schein's theory to identify your non-negotiable career drivers."
                : language === "zh-TW"
                  ? "基於 Edgar Schein 理論的8大維度，識別你不可妥協的職業核心驅動力。"
                  : "基于 Edgar Schein 理论的8大维度，识别你不可妥协的职业核心驱动力。"}
            </p>
          </motion.div>

          {/* Ideal Life Card Core */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: "#e74c6f" }}
              >
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">
                  Core 2
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {language === "en"
                    ? "Ideal Life Card"
                    : language === "zh-TW"
                      ? "理想人生卡"
                      : "理想人生卡"}
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === "en"
                ? "Explore deeper life aspirations across career, relationships, growth, and well-being for a complete life-career compass."
                : language === "zh-TW"
                  ? "探索職業、關係、成長和幸福感之間的深層人生理想，構建完整的人生-職涯指南針。"
                  : "探索职业、关系、成长和幸福感之间的深层人生理想，构建完整的人生-职涯指南针。"}
            </p>
          </motion.div>

          {/* Connecting message */}
          <div
            className="p-3 rounded-xl text-center"
            style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #0f2744 100%)" }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-white/40 font-bold">+</span>
              <Heart className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <p className="text-xs text-white/80 font-medium">
              {language === "en"
                ? "Career anchors + life values = truly aligned decisions"
                : language === "zh-TW"
                  ? "職業錨 + 人生價值觀 = 真正一致的決策"
                  : "职业锚 + 人生价值观 = 真正一致的决策"}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 py-8 bg-white">
        <h2
          className="text-lg font-bold mb-5"
          style={{ color: "hsl(228, 51%, 23%)" }}
        >
          {language === "en"
            ? "Not Your Average Personality Test"
            : language === "zh-TW"
              ? "這不是普通的性格測試"
              : "这不是普通的性格测试"}
        </h2>

        <div className="space-y-3">
          <FeatureCard
            icon={Target}
            title={t("home.features.adaptive")}
            description={t("home.features.adaptiveDesc")}
            delay={0.1}
          />
          <FeatureCard
            icon={Shield}
            title={t("home.features.scientific")}
            description={t("home.features.scientificDesc")}
            delay={0.2}
          />
          <FeatureCard
            icon={Lightbulb}
            title={t("home.features.personalized")}
            description={t("home.features.personalizedDesc")}
            delay={0.3}
          />
        </div>
      </section>

      {/* What You'll Receive */}
      <section
        className="py-8"
        style={{ backgroundColor: "hsl(75, 55%, 97%)" }}
      >
        <div className="px-5 mb-4">
          <h2
            className="text-lg font-bold"
            style={{ color: "hsl(228, 51%, 23%)" }}
          >
            {language === "en"
              ? "What You'll Receive"
              : language === "zh-TW"
                ? "測評結果包含"
                : "测评结果包含"}
          </h2>
        </div>

        {/* Horizontal scrolling cards */}
        <div
          ref={anchorsScrollRef}
          className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {outputs[language].map((output, index) => {
            const IconComponent = output.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex-shrink-0 w-[140px] snap-start bg-white p-4 rounded-xl border border-slate-100 shadow-sm"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 text-white"
                  style={{ backgroundColor: "#3498db" }}
                >
                  <IconComponent className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-semibold text-sm text-slate-800 mb-1 leading-tight">
                  {output.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {output.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        className="px-5 pt-10"
        style={{
          background: "linear-gradient(135deg, #1a3a5c 0%, #0f2744 100%)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 2.5rem)",
        }}
      >
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-3">
            {language === "en"
              ? "Ready to Discover Your Career Anchor?"
              : language === "zh-TW"
                ? "準備好發現你的職業錨了嗎？"
                : "准备好发现你的职业锚了吗？"}
          </h3>
          <p className="text-sm text-white/70 mb-6">
            {language === "en"
              ? "Avoid wasting years on the wrong career path."
              : language === "zh-TW"
                ? "避免在錯誤的職業道路上浪費多年時光。"
                : "避免在错误的职业道路上浪费多年时光。"}
          </p>
          <button
            onClick={handleStartAssessment}
            className="inline-flex items-center justify-center w-full gap-2 px-6 py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.98] shadow-md"
            style={{ backgroundColor: "#3498db", color: "white" }}
          >
            {t("home.startAssessment")}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <section
        className="px-5 py-6 text-center"
        style={{ backgroundColor: "hsl(75, 55%, 97%)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src={LOGO_URL} alt="SCPC" className="h-6 w-auto" />
          <span className="text-xs text-slate-500">Career Anchors</span>
        </div>
        <p className="text-xs text-slate-400">
          {language === "en"
            ? "Based on Edgar Schein's Career Anchor Theory"
            : language === "zh-TW"
              ? "基於 Edgar Schein 職業錨理論"
              : "基于 Edgar Schein 职业锚理论"}
        </p>
      </section>

      {/* Career Stage Selection Modal */}
      <AnimatePresence>
        {showCareerStage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => setShowCareerStage(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full bg-white rounded-t-3xl max-h-[90vh] flex flex-col"
              onClick={(event) => event.stopPropagation()}
            >
              {/* Fixed header */}
              <div className="px-6 pt-6 pb-3 flex-shrink-0">
                <div className="w-12 h-1 bg-border rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1 text-center">
                  {t("careerStage.title")}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {t("careerStage.subtitle")}
                </p>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto px-6 pb-3 overscroll-contain">
                {/* Work Years + Role Row */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2.5">
                    <Briefcase className="w-4 h-4" style={{ color: "hsl(75, 55%, 45%)" }} />
                    {language === "en" ? "Years of Work Experience" : language === "zh-TW" ? "職場工作年資" : "职场工作年资"}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative" style={{ flex: "1 1 0", minWidth: 0 }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={yearsInputValue}
                        onChange={(event) => handleYearsChange(event.target.value)}
                        placeholder={language === "en" ? "Enter years" : language === "zh-TW" ? "請輸入年數" : "请输入年数"}
                        className="w-full px-3 py-2.5 rounded-xl border-2 bg-card text-foreground text-base font-medium transition-all outline-none placeholder:text-muted-foreground/50 placeholder:font-normal placeholder:text-sm border-border focus:border-accent"
                        style={{ borderColor: workYears !== null ? "hsl(75, 55%, 50%)" : undefined }}
                      />
                      {workYears !== null && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                          {language === "en" ? "yrs" : "年"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <label className={cn(
                        "flex items-center gap-1 px-2 py-2 rounded-lg border cursor-pointer transition-all text-[11px] font-medium whitespace-nowrap",
                        isExecutive ? "border-amber-400 bg-amber-50 text-amber-700" : "border-border text-muted-foreground"
                      )}>
                        <input type="checkbox" checked={isExecutive} onChange={(event) => setIsExecutive(event.target.checked)} className="sr-only" />
                        <Crown className="w-3 h-3" />
                        {language === "en" ? "Exec" : "高管"}
                      </label>
                      <label className={cn(
                        "flex items-center gap-1 px-2 py-2 rounded-lg border cursor-pointer transition-all text-[11px] font-medium whitespace-nowrap",
                        isEntrepreneur ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground"
                      )}>
                        <input type="checkbox" checked={isEntrepreneur} onChange={(event) => setIsEntrepreneur(event.target.checked)} className="sr-only" />
                        <Zap className="w-3 h-3" />
                        {language === "en" ? "Founder" : language === "zh-TW" ? "創業" : "创业"}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {(() => {
                  const desc = getWorkExperienceDescription(workYears, isExecutive, isEntrepreneur, language as LanguageKey);
                  if (!desc) return null;
                  return (
                    <div className="mb-4 p-3 rounded-xl border" style={{ backgroundColor: "hsl(75, 55%, 96%)", borderColor: "hsl(75, 55%, 80%)" }}>
                      <p className="text-xs text-muted-foreground mb-1">{language === "en" ? "Your profile:" : language === "zh-TW" ? "報告描述預覽：" : "报告描述预览："}</p>
                      <p className="text-sm font-medium text-foreground">{desc}</p>
                    </div>
                  );
                })()}

                {/* Divider */}
                <div className="border-t border-border my-4" />

                {/* Assessment Entry Label */}
                <div className="mb-2.5">
                  <p className="text-sm font-semibold text-foreground mb-0.5">
                    {language === "en" ? "Select Assessment Type" : language === "zh-TW" ? "選擇測評類型" : "选择测评类型"}
                  </p>
                </div>

                {/* Entry Card 1: Ideal Life Card */}
                <div className="mb-2">
                  <button
                    onClick={() => setSelectedEntry(selectedEntry === 'ideal_card' ? null : 'ideal_card')}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left",
                      selectedEntry === 'ideal_card'
                        ? "border-rose-400 bg-rose-50"
                        : "border-border bg-card"
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                      style={{ backgroundColor: selectedEntry === 'ideal_card' ? "#e74c6f" : "#cbd5e1", color: "white" }}
                    >
                      <Heart className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground">
                        {language === "en" ? "Ideal Life Card" : language === "zh-TW" ? "理想人生卡測評" : "理想人生卡测评"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {language === "en" ? "1 report" : language === "zh-TW" ? "1份報告" : "1份报告"}
                      </div>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      selectedEntry === 'ideal_card' ? "border-rose-400 bg-rose-400" : "border-slate-300"
                    )}>
                      {selectedEntry === 'ideal_card' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                </div>

                {/* Entry Card 2: Career Anchor */}
                <div className="mb-2">
                  <button
                    onClick={() => setSelectedEntry(selectedEntry === 'career_anchor' ? null : 'career_anchor')}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left",
                      selectedEntry === 'career_anchor'
                        ? "bg-sky-50"
                        : "border-border bg-card"
                    )}
                    style={selectedEntry === 'career_anchor' ? { borderColor: "hsl(205, 70%, 55%)" } : {}}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                      style={{ backgroundColor: selectedEntry === 'career_anchor' ? "#3498db" : "#cbd5e1", color: "white" }}
                    >
                      <Compass className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground">
                        {language === "en" ? "Career Anchor Assessment" : language === "zh-TW" ? "職業錨測評" : "职业锚测评"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {language === "en" ? "1 report" : language === "zh-TW" ? "1份報告" : "1份报告"}
                      </div>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      selectedEntry === 'career_anchor' ? "border-sky-500 bg-sky-500" : "border-slate-300"
                    )}>
                      {selectedEntry === 'career_anchor' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                </div>

                {/* Entry Card 3: Combined Assessment */}
                <div className="mb-3">
                  <button
                    onClick={() => setSelectedEntry(selectedEntry === 'combined' ? null : 'combined')}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left relative overflow-hidden",
                      selectedEntry === 'combined'
                        ? "border-violet-500 bg-violet-50"
                        : "border-border bg-card"
                    )}
                  >
                    <div className="absolute top-0 right-0">
                      <div className="px-1.5 py-0.5 text-[9px] font-bold text-white rounded-bl-lg" style={{ backgroundColor: "#7c3aed" }}>
                        {language === "en" ? "BEST" : language === "zh-TW" ? "推薦" : "推荐"}
                      </div>
                    </div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                      style={{ backgroundColor: selectedEntry === 'combined' ? "#7c3aed" : "#cbd5e1", color: "white" }}
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground">
                        {language === "en" ? "Combined Assessment" : language === "zh-TW" ? "聯合測評" : "联合测评"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {language === "en" ? "3 reports" : language === "zh-TW" ? "3份報告" : "3份报告"}
                      </div>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      selectedEntry === 'combined' ? "border-violet-500 bg-violet-500" : "border-slate-300"
                    )}>
                      {selectedEntry === 'combined' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Fixed bottom button */}
              <div
                className="px-6 pt-3 flex-shrink-0"
                style={{
                  paddingBottom:
                    "max(env(safe-area-inset-bottom, 0px), 1.5rem)",
                }}
              >
                <button
                  onClick={handleCareerStageContinue}
                  disabled={!canStartAssessment}
                  className={cn(
                    "w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                    canStartAssessment
                      ? "text-white"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  style={
                    canStartAssessment
                      ? { backgroundColor: "hsl(228, 51%, 23%)" }
                      : {}
                  }
                >
                  {t("home.startAssessment")}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay?: number;
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: FeatureCardProps) {
  return (
    <motion.div
      className="flex gap-4 p-4 bg-white rounded-xl border shadow-sm"
      style={{ borderColor: "hsl(75, 55%, 85%)" }}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: "hsl(75, 55%, 90%)" }}
      >
        <Icon className="w-5 h-5" style={{ color: "hsl(75, 55%, 40%)" }} />
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
