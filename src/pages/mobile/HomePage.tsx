import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Target,
  Shield,
  Lightbulb,
  Clock,
  User,
  ChevronDown,
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
  Lock,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useTestAuth,
  getWorkExperienceDescription,
  type LanguageKey,
} from "@/hooks/useTestAuth";

import { useTranslation, type Language } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/desktop/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { useOrgAssessmentPermissions } from "@/hooks/useOrgAssessmentPermissions";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import { useQueryClient } from "@tanstack/react-query";
import { useCpPurchase } from "@/hooks/useCpPurchase";
import CpPurchaseModal from "@/components/desktop/CpPurchaseModal";

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
  const location = useLocation();
  const { t, language } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const {
    careerStage,
    workYears,
    isExecutive,
    isEntrepreneur,
    assessmentMode,
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
  const { isCpPointsEnabled } = useFeaturePermissions();
  const queryClient = useQueryClient();
  const cpPurchase = useCpPurchase();
  const { data: orgPermissions } = useOrgAssessmentPermissions();
  const [showVerifyCode, setShowVerifyCode] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [pendingTargetPath, setPendingTargetPath] = useState<string | null>(null);
  const isCareerAnchorEnabled = orgPermissions?.enableCareerAnchor !== false;
  const isIdealCardEnabled = orgPermissions?.enableIdealCard !== false;
  const isCombinedEnabled = orgPermissions?.enableCombined !== false;

  // Auto-refund CP if user abandoned a previous assessment without completing
  useEffect(() => {
    const pendingTxnId = sessionStorage.getItem("pending_cp_transaction_id");
    if (!pendingTxnId || !user?.id) return;
    supabase.functions
      .invoke("refund-cp", {
        body: { user_id: user.id, transaction_id: pendingTxnId, reason: "Assessment abandoned" },
      })
      .then(({ data }) => {
        if (data?.success) {
          sessionStorage.removeItem("pending_cp_transaction_id");
          queryClient.invalidateQueries({ queryKey: ["cp-wallet"] });
          queryClient.invalidateQueries({ queryKey: ["cp-transactions"] });
          toast.info(
            language === "zh-TW"
              ? "\u5DF2\u9000\u9084\u672A\u5B8C\u6210\u6E2C\u8A55\u7684 CP \u9EDE"
              : language === "en"
                ? "CP refunded for incomplete assessment"
                : "\u5DF2\u9000\u8FD8\u672A\u5B8C\u6210\u6D4B\u8BC4\u7684 CP \u70B9"
          );
        } else {
          sessionStorage.removeItem("pending_cp_transaction_id");
        }
      })
      .catch(() => {
        sessionStorage.removeItem("pending_cp_transaction_id");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
      // On mobile, always stay on the user home — admin consoles are desktop-only
      refreshProfile?.();
    } catch (error) {
      toast.error(language === "en" ? "Login failed" : language === "zh-TW" ? "登入失敗" : "登录失败");
    } finally {
      setEmailLoading(false);
    }
  };

  // Detect navigation state to trigger assessment flow from bottom nav
  useEffect(() => {
    if ((location.state as any)?.startAssessment) {
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, '');
      handleStartAssessment();
    }
  }, [location.state]);

  const handleStartAssessment = async () => {
    if (!user) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setShowRoleDropdown(true);
        return;
      }
    }
    setSelectedEntry(null);
    setShowCareerStage(true);
  };

  const handleStartSpecificAssessment = async (entryType: 'career_anchor' | 'ideal_card' | 'combined') => {
    if (!user) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSelectedEntry(entryType);
        setShowRoleDropdown(true);
        return;
      }
    }
    setSelectedEntry(entryType);
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

    // If not logged in, just navigate
    if (!user) {
      navigate(targetPath);
      return;
    }

    // CP purchase gate (when CP feature is enabled for this org/user)
    if (isCpPointsEnabled) {
      const serviceNameMap: Record<string, Record<string, string>> = {
        career_anchor: { en: "Career Anchor Assessment", "zh-TW": "職業錨測評", "zh-CN": "职业锨测评" },
        ideal_card: { en: "Espresso Card Assessment", "zh-TW": "理想人生卡測評", "zh-CN": "理想人生卡测评" },
        combined: { en: "Integration Assessment", "zh-TW": "整合測評", "zh-CN": "整合测评" },
      };
      const cpPriceMap: Record<string, number> = { career_anchor: 100, ideal_card: 80, combined: 150 };
      const descriptionMap: Record<string, Record<string, string>> = {
        career_anchor: { en: "Complete career anchor assessment", "zh-TW": "完成職業錨測評", "zh-CN": "完成职业锨测评" },
        ideal_card: { en: "Complete Espresso Card assessment", "zh-TW": "完成理想人生卡測評", "zh-CN": "完成理想人生卡测评" },
        combined: { en: "Complete integration assessment (3 reports)", "zh-TW": "完成整合測評（3份報告）", "zh-CN": "完成整合测评（3份报告）" },
      };
      cpPurchase.initiatePurchase(
        {
          serviceType: "assessment",
          serviceName: serviceNameMap[selectedEntry][language] || serviceNameMap[selectedEntry]["zh-CN"],
          cpPrice: cpPriceMap[selectedEntry],
          description: descriptionMap[selectedEntry][language] || descriptionMap[selectedEntry]["zh-CN"],
        },
        () => navigate(targetPath),
      );
      return;
    }

    // Org users with CP disabled → verification code gate
    if (profile?.organization_id) {
      setPendingTargetPath(targetPath);
      setShowVerifyCode(true);
      return;
    }

    // Individual users without org — navigate directly
    navigate(targetPath);
  };

  const handleVerifyCode = async () => {
    if (!verifyCode.trim() || !user || !profile?.organization_id) return;
    setVerifyLoading(true);
    const trimmedCode = verifyCode.trim().toUpperCase();
    const { data: codeRow, error } = await supabase
      .from("org_assessment_codes")
      .select("id, max_uses, used_count, max_uses_career_anchor, used_count_career_anchor, max_uses_ideal_card, used_count_ideal_card, max_uses_combined, used_count_combined, is_active, expires_at, organization_id")
      .eq("code", trimmedCode)
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !codeRow) {
      toast.error(language === "en" ? "Invalid authorization code" : language === "zh-TW" ? "\u6388\u6B0A\u78BC\u7121\u6548" : "\u6388\u6743\u7801\u65E0\u6548");
      setVerifyLoading(false);
      return;
    }

    // Check expiry
    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
      toast.error(language === "en" ? "Authorization code has expired" : language === "zh-TW" ? "\u6388\u6B0A\u78BC\u5DF2\u904E\u671F" : "\u6388\u6743\u7801\u5DF2\u8FC7\u671F");
      setVerifyLoading(false);
      return;
    }

    // Per-type limit check
    const assessmentType = selectedEntry || "career_anchor";
    const typeMaxField = assessmentType === "career_anchor" ? "max_uses_career_anchor"
      : assessmentType === "ideal_card" ? "max_uses_ideal_card" : "max_uses_combined";
    const typeUsedField = assessmentType === "career_anchor" ? "used_count_career_anchor"
      : assessmentType === "ideal_card" ? "used_count_ideal_card" : "used_count_combined";
    const typeMax = (codeRow as Record<string, number>)[typeMaxField] ?? codeRow.max_uses;
    const typeUsed = (codeRow as Record<string, number>)[typeUsedField] ?? codeRow.used_count;

    if (typeMax > 0 && typeUsed >= typeMax) {
      toast.error(language === "zh-TW" ? "\u6E2C\u8A66\u78BC\u6578\u91CF\u5DF2\u9054\u4E0A\u9650" : language === "zh-CN" ? "\u6D4B\u8BD5\u7801\u6570\u91CF\u5DF2\u8FBE\u4E0A\u9650" : "Assessment quota reached");
      setVerifyLoading(false);
      return;
    }

    // Per-type increment
    const updatePayload: Record<string, unknown> = {
      [typeUsedField]: typeUsed + 1,
      used_count: codeRow.used_count + 1,
      updated_at: new Date().toISOString(),
    };
    const { error: updateError } = await supabase
      .from("org_assessment_codes")
      .update(updatePayload)
      .eq("id", codeRow.id);

    if (updateError) {
      toast.error(language === "en" ? "Verification failed" : language === "zh-TW" ? "\u9A57\u8B49\u5931\u6557" : "\u9A8C\u8BC1\u5931\u8D25");
      setVerifyLoading(false);
      return;
    }

    // Auto-deactivate only when ALL types exhausted
    const newCareerUsed = assessmentType === "career_anchor" ? codeRow.used_count_career_anchor + 1 : codeRow.used_count_career_anchor;
    const newCardUsed = assessmentType === "ideal_card" ? codeRow.used_count_ideal_card + 1 : codeRow.used_count_ideal_card;
    const newComboUsed = assessmentType === "combined" ? codeRow.used_count_combined + 1 : codeRow.used_count_combined;
    const allExhausted =
      (codeRow.max_uses_career_anchor <= 0 || newCareerUsed >= codeRow.max_uses_career_anchor) &&
      (codeRow.max_uses_ideal_card <= 0 || newCardUsed >= codeRow.max_uses_ideal_card) &&
      (codeRow.max_uses_combined <= 0 || newComboUsed >= codeRow.max_uses_combined);
    if (allExhausted) {
      await supabase.from("org_assessment_codes").update({ is_active: false }).eq("id", codeRow.id);
    }

    // Record usage
    await supabase.from("org_assessment_code_usage").insert({
      code_id: codeRow.id,
      user_id: user.id,
      assessment_type: assessmentType,
    });

    setVerifyLoading(false);
    setShowVerifyCode(false);
    setVerifyCode("");
    toast.success(language === "en" ? "Verified successfully" : language === "zh-TW" ? "\u9A57\u8B49\u6210\u529F" : "\u9A8C\u8BC1\u6210\u529F");

    if (pendingTargetPath) {
      navigate(pendingTargetPath);
      setPendingTargetPath(null);
    }
  };

  const canStartAssessment = selectedEntry !== null;

  const isLoggedIn = !!user;

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
        title: "核心锚识别",
        description: "识别得分>80的核心锚点",
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
        description: "违背核心锚的职业代价",
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
        title: "核心錨識別",
        description: "識別得分>80的核心錨點",
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
        description: "違背核心錨的職業代價",
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
        title: "Core Anchors",
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
              user
                ? "bg-white/90 shadow-sm"
                : "bg-white/70 border border-white/50"
            )}
            style={{ color: "hsl(228, 51%, 23%)" }}
          >
            {user ? (
              <>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    backgroundColor: "hsl(75, 55%, 45%)",
                    color: "white",
                  }}
                >
                  {(user.email || "U").charAt(0).toUpperCase()}
                </div>
                <span>{user.user_metadata?.full_name || user.email?.split("@")[0]}</span>
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
                  {isLoggedIn ? (
                    /* ── Logged-in user menu ── */
                    <div className="p-3">
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ backgroundColor: "hsl(75, 55%, 45%)", color: "white" }}
                        >
                          {(user?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </div>
                          {profile?.organization_name && (
                            <div className="text-xs mt-0.5 truncate" style={{ color: "hsl(228, 51%, 40%)" }}>
                              {profile.organization_name}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          setShowRoleDropdown(false);
                          try {
                            await supabase.auth.signOut();
                            toast.success(language === "en" ? "Logged out" : language === "zh-TW" ? "已登出" : "已退出登录");
                            refreshProfile?.();
                          } catch {
                            toast.error(language === "en" ? "Logout failed" : language === "zh-TW" ? "登出失敗" : "退出失败");
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {language === "en" ? "Log Out" : language === "zh-TW" ? "登出" : "退出登录"}
                      </button>
                    </div>
                  ) : (
                    /* ── Email/Password Login ── */
                    <div className="p-3">
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
                ? "Espresso Card"
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
                    ? "Espresso Card"
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
            className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center"
            onClick={() => { setShowCareerStage(false); setSelectedEntry(null); }}
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
                        "flex items-center gap-1 px-2 py-2 rounded-lg border transition-all text-[11px] font-medium whitespace-nowrap",
                        "border-border text-muted-foreground/40 cursor-not-allowed opacity-50"
                      )}>
                        <input type="checkbox" checked={false} disabled className="sr-only" />
                        <Crown className="w-3 h-3" />
                        {language === "en" ? "Exec" : "高管"}
                      </label>
                      <label className={cn(
                        "flex items-center gap-1 px-2 py-2 rounded-lg border transition-all text-[11px] font-medium whitespace-nowrap",
                        "border-border text-muted-foreground/40 cursor-not-allowed opacity-50"
                      )}>
                        <input type="checkbox" checked={false} disabled className="sr-only" />
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

                {/* Assessment Type Selection */}
                <div className="mb-2.5">
                  <p className="text-sm font-semibold text-foreground mb-0.5">
                    {language === "en" ? "Select Assessment Type" : language === "zh-TW" ? "選擇測評類型" : "选择测评类型"}
                  </p>
                </div>

                    {/* Entry Card 1: Ideal Life Card */}
                    <div className="mb-2">
                      <button
                        onClick={() => isIdealCardEnabled && setSelectedEntry('ideal_card')}
                        disabled={!isIdealCardEnabled}
                        className={cn(
                          "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left",
                          !isIdealCardEnabled
                            ? "border-border/50 bg-muted/30 opacity-50 cursor-not-allowed"
                            : selectedEntry === 'ideal_card'
                              ? "border-rose-400 bg-rose-50"
                              : "border-border bg-card"
                        )}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                          style={{ backgroundColor: !isIdealCardEnabled ? "#94a3b8" : selectedEntry === 'ideal_card' ? "#e74c6f" : "#cbd5e1", color: "white" }}
                        >
                          {!isIdealCardEnabled ? <Lock className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn("font-semibold text-sm", !isIdealCardEnabled ? "text-muted-foreground" : "text-foreground")}>
                            {language === "en" ? "Espresso Card" : language === "zh-TW" ? "理想人生卡測評" : "理想人生卡测评"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {!isIdealCardEnabled
                              ? (language === "en" ? "Not authorized" : language === "zh-TW" ? "未授權" : "未授权")
                              : (language === "en" ? "1 report" : language === "zh-TW" ? "1份報告" : "1份报告")
                            }
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
                        onClick={() => isCareerAnchorEnabled && setSelectedEntry('career_anchor')}
                        disabled={!isCareerAnchorEnabled}
                        className={cn(
                          "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left",
                          !isCareerAnchorEnabled
                            ? "border-border/50 bg-muted/30 opacity-50 cursor-not-allowed"
                            : selectedEntry === 'career_anchor'
                              ? "bg-sky-50"
                              : "border-border bg-card"
                        )}
                        style={!isCareerAnchorEnabled ? {} : selectedEntry === 'career_anchor' ? { borderColor: "hsl(205, 70%, 55%)" } : {}}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                          style={{ backgroundColor: !isCareerAnchorEnabled ? "#94a3b8" : selectedEntry === 'career_anchor' ? "#3498db" : "#cbd5e1", color: "white" }}
                        >
                          {!isCareerAnchorEnabled ? <Lock className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn("font-semibold text-sm", !isCareerAnchorEnabled ? "text-muted-foreground" : "text-foreground")}>
                            {language === "en" ? "Career Anchor Assessment" : language === "zh-TW" ? "職業錨測評" : "职业锚测评"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {!isCareerAnchorEnabled
                              ? (language === "en" ? "Not authorized" : language === "zh-TW" ? "未授權" : "未授权")
                              : (language === "en" ? "1 report" : language === "zh-TW" ? "1份報告" : "1份报告")
                            }
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
                        onClick={() => isCombinedEnabled && setSelectedEntry('combined')}
                        disabled={!isCombinedEnabled}
                        className={cn(
                          "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left relative overflow-hidden",
                          !isCombinedEnabled
                            ? "border-border/50 bg-muted/30 opacity-50 cursor-not-allowed"
                            : selectedEntry === 'combined'
                              ? "border-violet-500 bg-violet-50"
                              : "border-border bg-card"
                        )}
                      >
                        {isCombinedEnabled && (
                          <div className="absolute top-0 right-0">
                            <div className="px-1.5 py-0.5 text-[9px] font-bold text-white rounded-bl-lg" style={{ backgroundColor: "#7c3aed" }}>
                              {language === "en" ? "BEST" : language === "zh-TW" ? "推薦" : "推荐"}
                            </div>
                          </div>
                        )}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                          style={{ backgroundColor: !isCombinedEnabled ? "#94a3b8" : selectedEntry === 'combined' ? "#7c3aed" : "#cbd5e1", color: "white" }}
                        >
                          {!isCombinedEnabled ? <Lock className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn("font-semibold text-sm", !isCombinedEnabled ? "text-muted-foreground" : "text-foreground")}>
                            {language === "en" ? "Integration Assessment" : language === "zh-TW" ? "整合測評" : "整合测评"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {!isCombinedEnabled
                              ? (language === "en" ? "Not authorized" : language === "zh-TW" ? "未授權" : "未授权")
                              : (language === "en" ? "3 reports" : language === "zh-TW" ? "3份報告" : "3份报告")
                            }
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
                      ? "text-white active:scale-[0.98]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                  style={
                    canStartAssessment
                      ? { backgroundColor: "hsl(228, 51%, 23%)" }
                      : {}
                  }
                >
                  {canStartAssessment
                    ? <>{t("home.startAssessment")} <ArrowRight className="w-4 h-4" /></>
                    : (language === "en" ? "Please select an assessment type" : language === "zh-TW" ? "請先選擇測評類型" : "请先选择测评类型")
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification Code Dialog — for org users with CP disabled */}
      <AnimatePresence>
        {showVerifyCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-6"
            onClick={() => { setShowVerifyCode(false); setVerifyCode(""); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "hsl(75, 55%, 90%)" }}>
                  <Lock className="w-6 h-6" style={{ color: "hsl(228, 51%, 23%)" }} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {language === "en" ? "Enter Authorization Code" : language === "zh-TW" ? "\u8F38\u5165\u6388\u6B0A\u9A57\u8B49\u78BC" : "\u8F93\u5165\u6388\u6743\u9A8C\u8BC1\u7801"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === "en" ? "Please enter the code provided by your organization admin." : language === "zh-TW" ? "\u8ACB\u8F38\u5165\u7D44\u7E54\u7BA1\u7406\u54E1\u63D0\u4F9B\u7684\u6388\u6B0A\u78BC\u3002" : "\u8BF7\u8F93\u5165\u7EC4\u7EC7\u7BA1\u7406\u5458\u63D0\u4F9B\u7684\u6388\u6743\u7801\u3002"}
                </p>
              </div>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                placeholder={language === "en" ? "Authorization code" : language === "zh-TW" ? "\u6388\u6B0A\u78BC" : "\u6388\u6743\u7801"}
                className="w-full px-4 py-3 rounded-xl border-2 border-border text-center text-lg font-mono tracking-widest bg-card text-foreground outline-none focus:border-primary mb-4"
                maxLength={20}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && verifyCode.trim() && handleVerifyCode()}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowVerifyCode(false); setVerifyCode(""); }}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium transition-all active:scale-[0.98]"
                >
                  {language === "en" ? "Cancel" : language === "zh-TW" ? "\u53D6\u6D88" : "\u53D6\u6D88"}
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={!verifyCode.trim() || verifyLoading}
                  className="flex-1 py-3 rounded-xl text-white font-medium transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ backgroundColor: "hsl(228, 51%, 23%)" }}
                >
                  {verifyLoading
                    ? (language === "en" ? "Verifying..." : language === "zh-TW" ? "\u9A57\u8B49\u4E2D..." : "\u9A8C\u8BC1\u4E2D...")
                    : (language === "en" ? "Confirm" : language === "zh-TW" ? "\u78BA\u8A8D" : "\u786E\u8BA4")
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CP Purchase Modal */}
      <CpPurchaseModal
        isOpen={cpPurchase.showPurchaseModal}
        serviceName={cpPurchase.pendingService?.serviceName || ""}
        originalPrice={cpPurchase.pendingService?.cpPrice || 0}
        discountedPrice={cpPurchase.getDiscountedPrice(cpPurchase.pendingService?.cpPrice || 0)}
        discountRate={cpPurchase.discountRate}
        totalBalance={cpPurchase.totalBalance}
        isPurchasing={cpPurchase.isPurchasing}
        onConfirm={cpPurchase.confirmPurchase}
        onCancel={cpPurchase.cancelPurchase}
      />
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
