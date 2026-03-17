import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, Target, AlertTriangle, User, ChevronDown, LogOut, Briefcase, Crown, Compass, BarChart3, FileText, Zap, ListChecks, Heart, Layers, Gem, Mail, Lock, Eye, EyeOff, Loader2, ClipboardList, Gift, Wallet } from "lucide-react";
import { useTestAuth, getWorkExperienceDescription, type LanguageKey } from "@/hooks/useTestAuth";
import { useAuth } from "@/hooks/useAuth";
import { getConsolePath, findConsoleRoleFromProfile } from "@/lib/permissions";
import { navigateToConsoleWithSwap } from "@/lib/consoleUtils";
import type { RoleType } from "@/lib/permissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMyPendingAssignments } from "@/hooks/useMyAssignments";

import { useQueryClient } from "@tanstack/react-query";
import { useCpPurchase } from "@/hooks/useCpPurchase";
import CpPurchaseModal from "@/components/desktop/CpPurchaseModal";
import { useOrgAssessmentPermissions } from "@/hooks/useOrgAssessmentPermissions";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";


import { useTranslation, type Language } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/desktop/LanguageSwitcher";
import { cn } from "@/lib/utils";

const LOGO_URL = "https://b.ux-cdn.com/uxarts/20260210/bd2fe8a1fd4d4cd5bcca019a03911b22.png";



export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();
  const { careerStage, workYears, isExecutive, isEntrepreneur, assessmentMode, setCareerStage, setWorkYears, setIsExecutive, setIsEntrepreneur, setAssessmentMode } = useTestAuth();
  const [yearsInputValue, setYearsInputValue] = useState(workYears !== null ? String(workYears) : "");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showCareerStage, setShowCareerStage] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<'ideal_card' | 'career_anchor' | 'combined' | null>(null);

  const { user, profile, signInWithEmail, signOut, refreshProfile } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const { data: pendingAssignments } = useMyPendingAssignments();

  const { isCpPointsEnabled } = useFeaturePermissions();
  const queryClient = useQueryClient();
  const cpPurchase = useCpPurchase();
  const { data: orgPermissions } = useOrgAssessmentPermissions();
  const isCareerAnchorEnabled = orgPermissions?.enableCareerAnchor !== false;
  const isIdealCardEnabled = orgPermissions?.enableIdealCard !== false;
  const isCombinedEnabled = orgPermissions?.enableCombined !== false;

  const [showVerifyCode, setShowVerifyCode] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [pendingTargetPath, setPendingTargetPath] = useState<string | null>(null);

  useEffect(() => {
    if ((location.state as any)?.scrollToAssessment) {
      // Clear the state to prevent re-scrolling on re-renders
      window.history.replaceState({}, '');
      setTimeout(() => {
        document.getElementById('assessment-select')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [location.state]);

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
          // Refund failed — still clear storage so it doesn't retry endlessly
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
    const { error } = await signInWithEmail(loginEmail, loginPassword);
    setEmailLoading(false);
    if (error) {
      toast.error(language === "en" ? `Login failed: ${error.message}` : language === "zh-TW" ? `登入失敗：${error.message}` : `登录失败：${error.message}`);
    } else {
      setShowRoleDropdown(false);
      setLoginEmail("");
      setLoginPassword("");
      toast.success(language === "en" ? "Logged in" : language === "zh-TW" ? "登入成功" : "登录成功");
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role_type, additional_roles, organization_id, department_id")
          .eq("id", currentUser.id)
          .single();
        if (userProfile) {
          const navigated = await navigateToConsoleWithSwap(
            { ...userProfile, id: currentUser.id } as any,
            refreshProfile,
            navigate,
          );
          if (!navigated) {
            // Roles that stay on homepage (employee, client, individual):
            // go directly to career stage selection
            setShowCareerStage(true);
          }
        } else {
          setShowCareerStage(true);
        }
      }
    }
  };

  const handleLoginKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") handleEmailLogin();
  };

  const handleStartAssessment = async () => {
    if (!user) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setShowRoleDropdown(true);
        return;
      }
    }
    setShowCareerStage(true);
  };

  const scrollToAssessmentSelect = () => {
    document.getElementById('assessment-select')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleStartSpecificAssessment = async (entryType: 'career_anchor' | 'ideal_card' | 'combined') => {
    if (!user) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Remember which entry they wanted so after login we can pre-select
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
      // Clear any stale combined flag
      sessionStorage.removeItem('scpc_combined_assessment');
    } else if (selectedEntry === 'career_anchor') {
      targetPath = '/assessment';
      sessionStorage.removeItem('scpc_combined_assessment');
    } else {
      // combined
      targetPath = '/assessment';
      sessionStorage.setItem('scpc_combined_assessment', 'true');
    }

    // If not logged in, just navigate (login gate handled elsewhere)
    if (!user) {
      navigate(targetPath);
      return;
    }

    // CP purchase gate (when CP feature is enabled)
    if (isCpPointsEnabled) {
    const serviceNameMap: Record<string, Record<string, string>> = {
      career_anchor: { en: "Career Anchor Assessment", "zh-TW": "職業錨測評", "zh-CN": "职业锚测评" },
      ideal_card: { en: "Espresso Card Assessment", "zh-TW": "理想人生卡測評", "zh-CN": "理想人生卡测评" },
      combined: { en: "Integration Assessment (Anchor + Espresso Card)", "zh-TW": "整合測評（職業錨＋理想人生卡）", "zh-CN": "整合测评（职业锚＋理想人生卡）" },
    };
    const cpPriceMap = { career_anchor: 100, ideal_card: 80, combined: 150 };
    const descriptionMap = {
      career_anchor: { en: "Complete career anchor assessment", "zh-TW": "完成職業錨測評", "zh-CN": "完成职业锚测评" },
      ideal_card: { en: "Complete Espresso Card assessment", "zh-TW": "完成理想人生卡測評", "zh-CN": "完成理想人生卡测评" },
      combined: { en: "Complete integration assessment (3 reports)", "zh-TW": "完成整合測評（生成3份報告）", "zh-CN": "完成整合测评（生成3份报告）" },
    };

    const assessmentService = {
      serviceType: "assessment",
      serviceName: serviceNameMap[selectedEntry][language] || serviceNameMap[selectedEntry]["zh-CN"],
      cpPrice: cpPriceMap[selectedEntry],
      description: descriptionMap[selectedEntry][language] || descriptionMap[selectedEntry]["zh-CN"],
    };

    cpPurchase.initiatePurchase(assessmentService, () => {
      navigate(targetPath);
    });
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
    "en": {
      TF: "Pursues expertise in a specific field, values professional depth over management breadth",
      GM: "Desires to integrate others' work, take responsibility, and climb the organizational ladder",
      AU: "Needs to work in their own way, struggles with organizational rules and others' control",
      SE: "Values job security and predictability, willing to sacrifice other things for stability",
      EC: "Strong urge to create their own business, needs to prove they can create new value",
      SV: "Work must reflect core values, pursues positive impact on others and society",
      CH: "Motivated by difficult problems and competition, needs to conquer new challenges",
      LS: "Seeks work-life balance, career must serve overall lifestyle",
    },
  };

  const outputs: Record<Language, Array<{ icon: typeof Compass; title: string; description: string }>> = {
    "zh-CN": [
      { icon: Compass, title: "职业锚雷达图", description: "8维度标准化得分可视化，清晰呈现你的职业价值取向分布" },
      { icon: Target, title: "核心锚识别", description: "识别得分>80的核心锚点，明确你的核心职业驱动力" },
      { icon: AlertTriangle, title: "冲突锚警示", description: "识别逻辑上互斥却同时高分的锚点，揭示潜在的内心冲突" },
      { icon: FileText, title: "不适合清单", description: "明确列出你不适合的工作类型和容易痛苦的组织环境" },
      { icon: BarChart3, title: "长期发展分析", description: "如果违背核心锚，3-10年后可能面临的职业代价与心理成本" },
      { icon: Zap, title: "行动路径建议", description: "可执行的学习方向、转型路径和验证方式" },
    ],
    "zh-TW": [
      { icon: Compass, title: "職業錨雷達圖", description: "8維度標準化得分視覺化，清晰呈現你的職業價值取向分佈" },
      { icon: Target, title: "核心錨識別", description: "識別得分>80的核心錨點，明確你的核心職業驅動力" },
      { icon: AlertTriangle, title: "衝突錨警示", description: "識別邏輯上互斥卻同時高分的錨點，揭示潛在的內心衝突" },
      { icon: FileText, title: "不適合清單", description: "明確列出你不適合的工作類型和容易痛苦的組織環境" },
      { icon: BarChart3, title: "長期發展分析", description: "如果違背核心錨，3-10年後可能面臨的職業代價與心理成本" },
      { icon: Zap, title: "行動路徑建議", description: "可執行的學習方向、轉型路徑和驗證方式" },
    ],
    "en": [
      { icon: Compass, title: "Career Anchor Radar", description: "Visualized 8-dimension standardized scores showing your career value orientation" },
      { icon: Target, title: "Core Anchors", description: "Identifies anchors scoring >80, revealing your core career drivers" },
      { icon: AlertTriangle, title: "Conflict Anchor Warnings", description: "Identifies logically contradictory high-scoring anchors, revealing inner conflicts" },
      { icon: FileText, title: "Unsuitable Environments", description: "Explicitly lists job types and environments that don't match your anchors" },
      { icon: BarChart3, title: "Long-term Risk Analysis", description: "Career and psychological costs of ignoring core anchors over 3-10 years" },
      { icon: Zap, title: "Action Path Suggestions", description: "Executable learning directions, transition paths, and validation methods" },
    ],
  };

  const heroContent: Record<Language, { title: string[]; subtitle: string; warning: string }> = {
    "zh-CN": {
      title: ["探索你最值得坚持与发展的", "职涯核心需求"],
      subtitle: "基于 Edgar Schein 职业锚理论，透过系统化专业测评，帮助你清晰看见自己长期稳定且深层的职业驱动力。这不只是性格测验，而是一套协助你做出更成熟职涯选择的专业决策工具。\n\n让你的每一次选择，都更靠近真正适合你的未来。",
      warning: "请选择真实倾向，而非社会期待。本测评不会迎合你，会明确指出「不适合」的选项，并强调违背核心锚点的长期代价。所有结论基于测评数据与逻辑推导，不使用 MBTI、星座或任何性格标签化语言。",
    },
    "zh-TW": {
      title: ["探索你最值得堅持與發展的", "職涯核心需求"],
      subtitle: "基於 Edgar Schein 職業錨理論，透過系統化專業測評，幫助你清晰看見自己長期穩定且深層的職業驅動力。這不只是性格測驗，而是一套協助你做出更成熟職涯選擇的專業決策工具。\n\n讓你的每一次選擇，都更靠近真正適合你的未來。",
      warning: "請選擇真實傾向，而非社會期待。本測評不會迎合你，會明確指出「不適合」的選項，並強調違背核心錨點的長期代價。所有結論基於測評數據與邏輯推導，不使用 MBTI、星座或任何性格標籤化語言。",
    },
    "en": {
      title: ["Explore the Career Needs", "Most Worth Pursuing & Developing"],
      subtitle: "Based on Edgar Schein's Career Anchor Theory, this systematic professional assessment helps you clearly see your long-term, stable, and deep career drivers. This is more than a personality test—it's a professional decision-making tool to help you make more mature career choices.\n\nLet every choice you make bring you closer to the future that truly fits you.",
      warning: "Please choose your true preferences, not social expectations. This assessment won't pander to you—it will clearly point out 'unsuitable' options and emphasize the long-term costs of going against your core anchors.",
    },
  };

  const workExpDescription = getWorkExperienceDescription(workYears, isExecutive, isEntrepreneur, language as LanguageKey);

  const yearsLabel = language === "en" ? "Years of Work Experience" : language === "zh-TW" ? "職場工作年資" : "职场工作年资";
  const yearsPlaceholder = language === "en" ? "Enter years" : language === "zh-TW" ? "請輸入年數" : "请输入年数";
  const yearUnit = language === "en" ? "years" : "年";
  const executiveLabel = language === "en" ? "Executive" : language === "zh-TW" ? "高管" : "高管";
  const entrepreneurLabel = language === "en" ? "Entrepreneur" : language === "zh-TW" ? "創業者" : "创业者";
  const previewLabel = language === "en" ? "Your profile:" : language === "zh-TW" ? "報告描述預覽：" : "报告描述预览：";

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="SCPC Logo" className="h-10 w-auto" />
            <span className="text-sm font-semibold text-slate-700">SCPC Career Anchors AI Assessment</span>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={scrollToAssessmentSelect}
              className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition-all hover:shadow-lg"
              style={{ backgroundColor: "#1a3a5c" }}
            >
              {t("home.startAssessment")}
            </button>
            
            <LanguageSwitcher />
            
            {/* Login / User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-medium text-sm transition-all border bg-white border-slate-200 hover:shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {(profile?.full_name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-slate-700 max-w-[100px] truncate">{profile?.full_name || user.email?.split("@")[0]}</span>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-slate-400 transition-transform",
                    showRoleDropdown && "rotate-180"
                  )} />
                </button>
                <AnimatePresence>
                  {showRoleDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowRoleDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl z-50 overflow-hidden border border-slate-200 py-2"
                      >
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-800 truncate">{profile?.full_name || user.email}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => { navigate("/history"); setShowRoleDropdown(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          {language === "en" ? "Assessment History" : language === "zh-TW" ? "測評記錄" : "测评记录"}
                        </button>
                        <button
                          onClick={() => { navigate("/change-password"); setShowRoleDropdown(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          {language === "en" ? "Change Password" : language === "zh-TW" ? "修改密碼" : "修改密码"}
                        </button>
                        <button
                          onClick={() => { navigate("/messages"); setShowRoleDropdown(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          {language === "en" ? "Messages" : language === "zh-TW" ? "訊息" : "消息"}
                        </button>
                        {isCpPointsEnabled && (
                          <button
                            onClick={() => { navigate("/cp-wallet"); setShowRoleDropdown(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            {language === "en" ? "CP Wallet" : language === "zh-TW" ? "CP 錢包" : "CP 钱包"}
                          </button>
                        )}
                        {isCpPointsEnabled && (
                          <button
                            onClick={() => { navigate("/referral"); setShowRoleDropdown(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            {language === "en" ? "Referral Rewards" : language === "zh-TW" ? "推薦獎勵" : "推荐奖励"}
                          </button>
                        )}
                        {(() => {
                          if (!profile) return null;
                          const consoleInfo = findConsoleRoleFromProfile(profile);
                          if (!consoleInfo) return null;
                          return (
                            <button
                              onClick={async () => {
                                setShowRoleDropdown(false);
                                await navigateToConsoleWithSwap(profile, refreshProfile, navigate);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-sky-600 hover:bg-slate-50 transition-colors font-medium"
                            >
                              {language === "en" ? "Go to Console" : language === "zh-TW" ? "進入工作台" : "进入工作台"}
                            </button>
                          );
                        })()}
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            onClick={async () => { await signOut(); setShowRoleDropdown(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5 inline mr-2" />
                            {language === "en" ? "Sign Out" : language === "zh-TW" ? "登出" : "退出登录"}
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-medium text-sm transition-all border bg-slate-50 border-slate-200 hover:bg-white hover:shadow-sm"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600">{language === "en" ? "Login" : language === "zh-TW" ? "登入" : "登录"}</span>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-slate-400 transition-transform",
                    showRoleDropdown && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {showRoleDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowRoleDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl z-50 overflow-hidden border border-slate-200"
                      >
                        <div className="max-h-[480px] overflow-y-auto">
                          {/* Login Form */}
                          <div className="p-4 space-y-3">
                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider px-1">
                              {language === "en" ? "Account Login" : language === "zh-TW" ? "帳號登入" : "账号登录"}
                            </div>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="email"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                onKeyDown={handleLoginKeyDown}
                                placeholder={language === "en" ? "Email" : language === "zh-TW" ? "信箱" : "邮箱"}
                                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition-all"
                              />
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type={showPassword ? "text" : "password"}
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                onKeyDown={handleLoginKeyDown}
                                placeholder={language === "en" ? "Password" : language === "zh-TW" ? "密碼" : "密码"}
                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <button
                              onClick={handleEmailLogin}
                              disabled={emailLoading}
                              className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                              style={{ backgroundColor: "#1a3a5c" }}
                            >
                              {emailLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  {language === "en" ? "Logging in..." : language === "zh-TW" ? "登入中..." : "登录中..."}
                                </>
                              ) : (
                                language === "en" ? "Login" : language === "zh-TW" ? "登入" : "登录"
                              )}
                            </button>
                          </div>


                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </nav>
      {/* Pending Assignment Banner */}
      {user && pendingAssignments && pendingAssignments.length > 0 && (
        <div className="pt-20">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200"
          >
            <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    {language === "en"
                      ? `You have ${pendingAssignments.length} pending assessment${pendingAssignments.length > 1 ? "s" : ""}`
                      : language === "zh-TW"
                        ? `您有 ${pendingAssignments.length} 項待完成的測評任務`
                        : `您有 ${pendingAssignments.length} 项待完成的测评任务`}
                  </p>
                  <p className="text-xs text-amber-700">
                    {pendingAssignments[0].assignerName && (
                      <span>
                        {language === "en"
                          ? `Assigned by ${pendingAssignments[0].assignerName}`
                          : language === "zh-TW"
                            ? `由 ${pendingAssignments[0].assignerName} 派發`
                            : `由 ${pendingAssignments[0].assignerName} 派发`}
                      </span>
                    )}
                    {pendingAssignments[0].due_date && (
                      <span className="ml-2">
                        {language === "en" ? "Due: " : language === "zh-TW" ? "截止：" : "截止："}
                        {new Date(pendingAssignments[0].due_date).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCareerStage(true)}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center gap-2"
              >
                {language === "en" ? "Start Now" : language === "zh-TW" ? "立即開始" : "立即开始"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-40 right-0 w-96 h-96 bg-gradient-to-br from-sky-200/40 to-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-slate-200/50 to-sky-100/40 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-8">
                <Compass className="w-4 h-4" />
                Career Anchors Assessment
              </div>

              <h1
                className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-tight mb-8 text-slate-900"
                style={{
                  fontSize: "40px",
                  fontStyle: "normal",
                  fontWeight: "700",
                  textAlign: "start",
                  lineHeight: "1.4"
                }}>
                {heroContent[language].title[0]}
                <br />
                <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent" style={{ fontSize: "56px" }}>
                  {heroContent[language].title[1]}
                </span>
              </h1>

              <div className="text-lg text-slate-600 leading-relaxed mb-10 max-w-xl space-y-3">
                {heroContent[language].subtitle.split("\n\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 mb-10">
                <button
                  onClick={scrollToAssessmentSelect}
                  className="inline-flex items-center gap-3 px-8 py-4 font-semibold rounded-xl text-white transition-all hover:shadow-xl hover:scale-[1.02] group"
                  style={{ backgroundColor: "#1a3a5c" }}
                >
                  {t("home.startAssessment")}
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>


            </motion.div>

            {/* Right - Decorative Element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:flex items-center justify-center"
            >
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-blue-500/20 rounded-full blur-3xl scale-150" />
                {/* Abstract Career Compass Graphic */}
                <div className="relative z-10 w-80 h-80 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-sky-200/50" />
                  <div className="absolute inset-8 rounded-full border-2 border-sky-300/40" />
                  <div className="absolute inset-16 rounded-full border-2 border-sky-400/30 bg-gradient-to-br from-white/80 to-sky-50/50 backdrop-blur-sm" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl font-bold bg-gradient-to-br from-slate-700 to-slate-900 bg-clip-text text-transparent">8</div>
                      <div className="text-sm font-medium text-slate-600 mt-1">
                        {language === "en" ? "Career Anchors" : language === "zh-TW" ? "職業錨維度" : "职业锚维度"}
                      </div>
                    </div>
                  </div>
                  {/* Anchor Points */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                    <div
                      key={i}
                      className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg"
                      style={{
                        top: `${50 - 42 * Math.cos((deg * Math.PI) / 180)}%`,
                        left: `${50 + 42 * Math.sin((deg * Math.PI) / 180)}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Warning Notice */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">
                  {language === "en" ? "Before You Begin" : language === "zh-TW" ? "測評前須知" : "测评前须知"}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {heroContent[language].warning}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* 8 Career Anchors */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm font-medium mb-6">
              Edgar Schein's Model
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {language === "en" ? "Eight Career Anchors" : language === "zh-TW" ? "八大職業錨模型" : "八大职业锚模型"}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {language === "en" 
                ? "Discover which career anchor resonates most with your core values and motivations"
                : language === "zh-TW"
                  ? "探索哪個職業錨最能反映你的核心價值觀和動機"
                  : "探索哪个职业锚最能反映你的核心价值观和动机"}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {careerAnchors.map((anchor, index) => (
              <motion.div
                key={anchor.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-200 hover:border-sky-300 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div 
                  className="text-sm font-bold mb-4 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-colors"
                  style={{ backgroundColor: "#1a3a5c" }}
                >
                  {anchor.id.toString().padStart(2, "0")}
                </div>
                <h3 className="font-semibold text-slate-800 mb-3 group-hover:text-sky-700 transition-colors">
                  {t(`assessment.dimensions.${anchor.key}`)}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {anchorDescriptions[language][anchor.key]}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Dual-Core Assessment: Career Anchors + Ideal Life Card */}
      <section id="assessment-select" className="py-24 px-6 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-100 to-rose-100 text-slate-700 text-sm font-medium mb-6">
              <Layers className="w-4 h-4" />
              {language === "en" ? "Dual-Core Assessment" : language === "zh-TW" ? "雙核驅動" : "双核驱动"}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {language === "en" ? "Career Anchors + Life Values" : language === "zh-TW" ? "職業錨 + 人生價值觀" : "职业锚 + 人生价值观"}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {language === "en" 
                ? "Beyond career assessment — a dual-engine system that integrates professional drivers with life aspirations for truly holistic career decisions."
                : language === "zh-TW"
                  ? "不止於職業測評——雙引擎系統將職業驅動力與人生理想整合，做出真正全面的職涯決策。"
                  : "不止于职业测评——双引擎系统将职业驱动力与人生理想整合，做出真正全面的职涯决策。"}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Career Anchors Core */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative p-8 rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white overflow-hidden group hover:border-sky-300 transition-colors"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-sky-100/50 rounded-full blur-3xl -translate-y-10 translate-x-10" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: "#1a3a5c" }}>
                    <Compass className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Core 1</div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {language === "en" ? "Career Anchor Assessment" : language === "zh-TW" ? "職業錨測評" : "职业锚测评"}
                    </h3>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed mb-6">
                  {language === "en" 
                    ? "Based on Edgar Schein's theory, systematically evaluates 8 career anchor dimensions to identify your non-negotiable professional core drivers — the values you should never sacrifice in your career."
                    : language === "zh-TW"
                      ? "基於 Edgar Schein 理論，系統化評估8大職業錨維度，識別你不可妥協的職業核心驅動力——那些在職涯中最不該犧牲的價值。"
                      : "基于 Edgar Schein 理论，系统化评估8大职业锚维度，识别你不可妥协的职业核心驱动力——那些在职涯中最不该牺牲的价值。"}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["TF", "GM", "AU", "SE", "EC", "SV", "CH", "LS"].map((key) => (
                    <span key={key} className="px-3 py-1 rounded-full bg-white/80 border border-sky-200 text-xs font-medium text-slate-700">
                      {t(`assessment.dimensions.${key}`)}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleStartSpecificAssessment('career_anchor')}
                  disabled={!isCareerAnchorEnabled}
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all group",
                    isCareerAnchorEnabled
                      ? "text-white hover:shadow-lg hover:scale-[1.02]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                  style={isCareerAnchorEnabled ? { backgroundColor: "#1a3a5c" } : {}}
                >
                  {!isCareerAnchorEnabled && <Lock className="w-3.5 h-3.5" />}
                  {language === "en" ? "Start Assessment" : language === "zh-TW" ? "開始測評" : "开始测评"}
                  {isCareerAnchorEnabled && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                </button>
                {!isCareerAnchorEnabled && (
                  <p className="text-xs text-slate-400 mt-2">
                    {language === "en" ? "Not available for your organization" : language === "zh-TW" ? "您的機構未授權此測評" : "您的机构未授权此测评"}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Ideal Life Card Core */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative p-8 rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white overflow-hidden group hover:border-rose-300 transition-colors"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-rose-100/50 rounded-full blur-3xl -translate-y-10 translate-x-10" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: "#e74c6f" }}>
                    <Heart className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Core 2</div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {language === "en" ? "Espresso Card" : language === "zh-TW" ? "理想人生卡" : "理想人生卡"}
                    </h3>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed mb-6">
                  {language === "en" 
                    ? "Go beyond professional anchors to explore your deeper life aspirations. Through curated value cards, discover what truly matters to you across career, relationships, growth, and well-being — creating an integrated life-career compass."
                    : language === "zh-TW"
                      ? "超越職業錨，探索更深層的人生理想。透過精選價值卡片，發現在職業、關係、成長和幸福感之間，什麼對你真正重要——構建整合的人生-職涯指南針。"
                      : "超越职业锚，探索更深层的人生理想。通过精选价值卡片，发现在职业、关系、成长和幸福感之间，什么对你真正重要——构建整合的人生-职涯指南针。"}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(language === "en" 
                    ? ["Life Purpose", "Self-Growth", "Relationships", "Well-being", "Social Impact", "Freedom", "Legacy", "Balance"]
                    : language === "zh-TW"
                      ? ["人生使命", "自我成長", "人際關係", "幸福感", "社會影響", "自由", "傳承", "平衡"]
                      : ["人生使命", "自我成长", "人际关系", "幸福感", "社会影响", "自由", "传承", "平衡"]
                  ).map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-white/80 border border-rose-200 text-xs font-medium text-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleStartSpecificAssessment('ideal_card')}
                  disabled={!isIdealCardEnabled}
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all group",
                    isIdealCardEnabled
                      ? "text-white hover:shadow-lg hover:scale-[1.02]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                  style={isIdealCardEnabled ? { backgroundColor: "#e74c6f" } : {}}
                >
                  {!isIdealCardEnabled && <Lock className="w-3.5 h-3.5" />}
                  {language === "en" ? "Start Assessment" : language === "zh-TW" ? "開始測評" : "开始测评"}
                  {isIdealCardEnabled && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                </button>
                {!isIdealCardEnabled && (
                  <p className="text-xs text-slate-400 mt-2">
                    {language === "en" ? "Not available for your organization" : language === "zh-TW" ? "您的機構未授權此測評" : "您的机构未授权此测评"}
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Connecting Line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-center"
          >
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
                <Compass className="w-5 h-5 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-white/40">+</div>
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <p className="text-white/90 font-medium">
              {language === "en" 
                ? "When career anchors meet life values, your decisions become truly aligned."
                : language === "zh-TW"
                  ? "當職業錨遇上人生價值觀，你的決策才能真正一致。"
                  : "当职业锚遇上人生价值观，你的决策才能真正一致。"}
            </p>
            <p className="text-white/60 text-sm mt-2 mb-5">
              {language === "en" 
                ? "Choose the Combined Assessment to get all three reports: Career Anchor, Espresso Card, and Fusion Analysis."
                : language === "zh-TW"
                  ? "選擇「整合測評」即可獲得三份完整報告：職業錨、理想人生卡、整合分析。"
                  : "选择“整合测评”即可获得三份完整报告：职业锚、理想人生卡、整合分析。"}
            </p>
            <button
              onClick={() => handleStartSpecificAssessment('combined')}
              disabled={!isCombinedEnabled}
              className={cn(
                "inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all group",
                isCombinedEnabled
                  ? "bg-gradient-to-r from-sky-400 to-rose-400 text-white hover:shadow-lg hover:scale-[1.02]"
                  : "bg-slate-600 text-slate-400 cursor-not-allowed"
              )}
            >
              {!isCombinedEnabled && <Lock className="w-3.5 h-3.5" />}
              {language === "en" ? "Start Integration Assessment" : language === "zh-TW" ? "開始整合測評" : "开始整合测评"}
              {isCombinedEnabled && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
            </button>
            {!isCombinedEnabled && (
              <p className="text-white/40 text-xs mt-2">
                {language === "en" ? "Not available for your organization" : language === "zh-TW" ? "您的機構未授權此測評" : "您的机构未授权此测评"}
              </p>
            )}
          </motion.div>
        </div>
      </section>
      {/* Outputs */}
      <section className="py-24 px-6 bg-gradient-to-br from-slate-50 to-sky-50">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-6">
              Assessment Results
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              {language === "en" ? "What You'll Receive" : language === "zh-TW" ? "測評結果包含" : "测评结果包含"}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outputs[language].map((output, index) => {
              const IconComponent = output.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white"
                    style={{ backgroundColor: "#3498db" }}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">{output.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{output.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      {/* Bottom CTA */}
      <section 
        className="py-24 px-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #0f2744 100%)" }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-sky-400 blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {language === "en" ? "Ready to Discover Your Career Anchor?" : language === "zh-TW" ? "準備好發現你的職業錨了嗎？" : "准备好发现你的职业锚了吗？"}
            </h2>
            <p className="text-white/80 mb-10 max-w-lg mx-auto text-lg">
              {language === "en" 
                ? "Take the assessment and avoid wasting years on the wrong career path."
                : language === "zh-TW" 
                  ? "完成測評，避免在錯誤的職業道路上浪費多年時光。"
                  : "完成测评，避免在错误的职业道路上浪费多年时光。"}
            </p>
            <button
              onClick={scrollToAssessmentSelect}
              className="inline-flex items-center gap-3 px-10 py-5 font-semibold rounded-xl transition-all group shadow-2xl hover:shadow-sky-500/25 hover:scale-[1.02]"
              style={{ backgroundColor: "#3498db", color: "white" }}
            >
              {t("home.startAssessment")}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </section>
      {/* Footer */}
      <footer className="py-8 px-6 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="SCPC" className="h-8 w-auto" />
            <span className="text-sm text-slate-500">Career Anchors AI Assessment</span>
          </div>
          <div className="text-sm text-slate-500">
            {language === "en" 
              ? "Based on Edgar Schein's Career Anchor Theory"
              : language === "zh-TW"
                ? "基於 Edgar Schein 職業錨理論"
                : "基于 Edgar Schein 职业锚理论"}
          </div>
        </div>
      </footer>
      {/* Career Stage Modal */}
      <AnimatePresence>
        {showCareerStage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => { setShowCareerStage(false); setSelectedEntry(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Fixed Header */}
              <div className="text-center px-8 pt-8 pb-4 flex-shrink-0">
                <img src={LOGO_URL} alt="SCPC" className="h-12 w-auto mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {t("careerStage.title")}
                </h3>
                <p className="text-sm text-slate-600">
                  {t("careerStage.subtitle")}
                </p>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-8 overscroll-contain">

              {/* Work Experience + Role Row */}
              <div className="mb-5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Briefcase className="w-4 h-4 text-sky-500" />
                  {yearsLabel}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative" style={{ flex: "1 1 0", minWidth: 0 }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={yearsInputValue}
                      onChange={(event) => handleYearsChange(event.target.value)}
                      placeholder={yearsPlaceholder}
                      className="w-full px-4 py-3 rounded-xl border-2 bg-white text-slate-800 text-lg font-medium transition-all outline-none placeholder:text-slate-300 placeholder:font-normal placeholder:text-base border-slate-200 focus:border-sky-500"
                    />
                    {workYears !== null && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{yearUnit}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <label className={cn(
                      "flex items-center gap-1 px-2.5 py-2.5 rounded-lg border transition-all text-xs font-medium whitespace-nowrap",
                      "border-slate-200 text-slate-300 cursor-not-allowed opacity-50"
                    )}>
                      <input type="checkbox" checked={false} disabled className="sr-only" />
                      <Crown className="w-3.5 h-3.5" />
                      {executiveLabel}
                    </label>
                    <label className={cn(
                      "flex items-center gap-1 px-2.5 py-2.5 rounded-lg border transition-all text-xs font-medium whitespace-nowrap",
                      "border-slate-200 text-slate-300 cursor-not-allowed opacity-50"
                    )}>
                      <input type="checkbox" checked={false} disabled className="sr-only" />
                      <Zap className="w-3.5 h-3.5" />
                      {entrepreneurLabel}
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {workExpDescription && (
                <div className="mb-5 p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                  <p className="text-xs text-slate-400 mb-1">{previewLabel}</p>
                  <p className="text-sm font-medium text-slate-800">{workExpDescription}</p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-slate-200 my-5" />

              {/* Assessment Type Selection — hidden when entering from a specific assessment button */}
              {!selectedEntry && (
                <>
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      {language === "en" ? "Select Assessment Type" : language === "zh-TW" ? "選擇測評類型" : "选择测评类型"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {language === "en" ? "Choose one entry point below" : language === "zh-TW" ? "請選擇以下一個入口" : "请选择以下一个入口"}
                    </p>
                  </div>

                  {/* Entry Card 1: Ideal Life Card */}
                  <div className="mb-2.5">
                    <button
                      onClick={() => isIdealCardEnabled && setSelectedEntry('ideal_card')}
                      disabled={!isIdealCardEnabled}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                        !isIdealCardEnabled
                          ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                          : selectedEntry === 'ideal_card'
                            ? "border-rose-400 bg-rose-50 shadow-sm"
                            : "border-slate-200 hover:border-rose-300 hover:bg-slate-50"
                      )}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                        style={{ backgroundColor: !isIdealCardEnabled ? "#94a3b8" : selectedEntry === 'ideal_card' ? "#e74c6f" : "#cbd5e1", color: "white" }}
                      >
                        {!isIdealCardEnabled ? <Lock className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("font-semibold text-sm", !isIdealCardEnabled ? "text-slate-400" : "text-slate-800")}>
                          {language === "en" ? "Espresso Card" : language === "zh-TW" ? "理想人生卡測評" : "理想人生卡测评"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {!isIdealCardEnabled
                            ? (language === "en" ? "Not authorized" : language === "zh-TW" ? "未授權" : "未授权")
                            : (language === "en" ? "Discover your core life values (1 report)" : language === "zh-TW" ? "探索人生核心價值觀（1份報告）" : "探索人生核心价值观（1份报告）")
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
                  <div className="mb-2.5">
                    <button
                      onClick={() => isCareerAnchorEnabled && setSelectedEntry('career_anchor')}
                      disabled={!isCareerAnchorEnabled}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                        !isCareerAnchorEnabled
                          ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                          : selectedEntry === 'career_anchor'
                            ? "border-sky-500 bg-sky-50 shadow-sm"
                            : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"
                      )}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                        style={{ backgroundColor: !isCareerAnchorEnabled ? "#94a3b8" : selectedEntry === 'career_anchor' ? "#3498db" : "#cbd5e1", color: "white" }}
                      >
                        {!isCareerAnchorEnabled ? <Lock className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("font-semibold text-sm", !isCareerAnchorEnabled ? "text-slate-400" : "text-slate-800")}>
                          {language === "en" ? "Career Anchor Assessment" : language === "zh-TW" ? "職業錨測評" : "职业锚测评"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {!isCareerAnchorEnabled
                            ? (language === "en" ? "Not authorized" : language === "zh-TW" ? "未授權" : "未授权")
                            : (language === "en" ? "Identify non-negotiable career drivers (1 report)" : language === "zh-TW" ? "識別不可妥協的職業驅動力（1份報告）" : "识别不可妥协的职业驱动力（1份报告）")
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
                  <div className="mb-4">
                    <button
                      onClick={() => isCombinedEnabled && setSelectedEntry('combined')}
                      disabled={!isCombinedEnabled}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden",
                        !isCombinedEnabled
                          ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                          : selectedEntry === 'combined'
                            ? "border-violet-500 bg-violet-50 shadow-sm"
                            : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"
                      )}
                    >
                      {isCombinedEnabled && (
                        <div className="absolute top-0 right-0">
                          <div className="px-2 py-0.5 text-[10px] font-bold text-white rounded-bl-lg" style={{ backgroundColor: "#7c3aed" }}>
                            {language === "en" ? "RECOMMENDED" : language === "zh-TW" ? "推薦" : "推荐"}
                          </div>
                        </div>
                      )}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                        style={{ backgroundColor: !isCombinedEnabled ? "#94a3b8" : selectedEntry === 'combined' ? "#7c3aed" : "#cbd5e1", color: "white" }}
                      >
                        {!isCombinedEnabled ? <Lock className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("font-semibold text-sm", !isCombinedEnabled ? "text-slate-400" : "text-slate-800")}>
                          {language === "en" ? "Integration Assessment" : language === "zh-TW" ? "整合測評" : "整合测评"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {!isCombinedEnabled
                            ? (language === "en" ? "Not authorized" : language === "zh-TW" ? "未授權" : "未授权")
                            : (language === "en" ? "Anchor + Espresso Card + Integration Analysis (3 reports)" : language === "zh-TW" ? "職業錨＋理想人生卡＋整合分析（3份報告）" : "职业锚＋理想人生卡＋整合分析（3份报告）")
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

                  {/* No assessments notice */}
                  {!isCareerAnchorEnabled && !isIdealCardEnabled && !isCombinedEnabled && (
                    <div className="py-8 text-center">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">
                        {language === "en" ? "No assessments available for your organization. Please contact your administrator." : language === "zh-TW" ? "您的機構目前沒有可用的測評，請聯繫管理員。" : "您的机构目前没有可用的测评，请联系管理员。"}
                      </p>
                    </div>
                  )}
                </>              
              )}
              {/* When entering from a specific assessment button, show the selected type as a badge */}
              {selectedEntry && (
                <div className="mb-4 p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                  <p className="text-xs text-slate-400 mb-1">
                    {language === "en" ? "Assessment Type" : language === "zh-TW" ? "測評類型" : "测评类型"}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedEntry === 'career_anchor' 
                      ? (language === "en" ? "Career Anchor Assessment" : language === "zh-TW" ? "職業錨測評" : "职业锚测评")
                      : selectedEntry === 'ideal_card'
                        ? (language === "en" ? "Espresso Card" : language === "zh-TW" ? "理想人生卡測評" : "理想人生卡测评")
                        : (language === "en" ? "Integration Assessment" : language === "zh-TW" ? "整合測評" : "整合测评")
                    }
                  </p>
                </div>
              )}

              </div>{/* End Scrollable Content */}

              {/* Fixed Bottom Button */}
              <div className="px-8 pt-4 pb-8 flex-shrink-0">
              <button
                onClick={handleCareerStageContinue}
                disabled={!canStartAssessment}
                className={cn(
                  "w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-white",
                  canStartAssessment
                    ? "shadow-lg hover:shadow-xl hover:scale-[1.01]"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
                style={canStartAssessment ? { backgroundColor: "#1a3a5c" } : {}}
              >
                {t("home.startAssessment")}
                <ArrowRight className="w-4 h-4" />
              </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* CP Purchase Gate Modal */}
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

      {/* Verification Code Dialog — for org users with CP disabled */}
      <AnimatePresence>
        {showVerifyCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center"
            onClick={() => { setShowVerifyCode(false); setVerifyCode(""); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "hsl(75, 55%, 90%)" }}>
                  <Lock className="w-7 h-7" style={{ color: "hsl(228, 51%, 23%)" }} />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {language === "en" ? "Enter Authorization Code" : language === "zh-TW" ? "\u8F38\u5165\u6388\u6B0A\u9A57\u8B49\u78BC" : "\u8F93\u5165\u6388\u6743\u9A8C\u8BC1\u7801"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {language === "en" ? "Please enter the code provided by your organization admin." : language === "zh-TW" ? "\u8ACB\u8F38\u5165\u7D44\u7E54\u7BA1\u7406\u54E1\u63D0\u4F9B\u7684\u6388\u6B0A\u78BC\u3002" : "\u8BF7\u8F93\u5165\u7EC4\u7EC7\u7BA1\u7406\u5458\u63D0\u4F9B\u7684\u6388\u6743\u7801\u3002"}
                </p>
              </div>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                placeholder={language === "en" ? "Authorization code" : language === "zh-TW" ? "\u6388\u6B0A\u78BC" : "\u6388\u6743\u7801"}
                className="w-full px-4 py-3 rounded-xl border-2 border-border text-center text-xl font-mono tracking-[0.3em] bg-card text-foreground outline-none focus:border-primary mb-6"
                maxLength={20}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && verifyCode.trim() && handleVerifyCode()}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowVerifyCode(false); setVerifyCode(""); }}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium transition-all hover:bg-muted"
                >
                  {language === "en" ? "Cancel" : language === "zh-TW" ? "\u53D6\u6D88" : "\u53D6\u6D88"}
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={!verifyCode.trim() || verifyLoading}
                  className="flex-1 py-3 rounded-xl text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
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
    </div>
  );
}
