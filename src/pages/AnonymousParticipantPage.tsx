import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  ChevronRight,
  Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  QUESTIONS_DATA,
  DIMENSION_CODES,
  DIMENSION_NAMES,
  LIKERT_OPTIONS,
  LIKERT_VALUES,
  CONFLICT_ANCHOR_PAIRS,
  SCORE_INTERPRETATION,
  standardizeScores,
  type QuestionData,
} from "@/data/questions";
import { cn } from "@/lib/utils";
import type { Language } from "@/hooks/useLanguage";

// ─── Types ────────────────────────────────────────

type PageView = "loading" | "invalid" | "expired" | "landing" | "identity" | "workYears" | "assessment" | "completing" | "results";

interface BatchInfo {
  id: string;
  batchName: string;
  description: string;
  assessmentType: string;
  instructions: string;
  language: Language;
  optionalIdentityEnabled: boolean;
  reportVisibility: string;
  expiresAt: string | null;
  status: string;
}

interface LinkInfo {
  id: string;
  token: string;
  status: string;
  batchId: string;
}

interface AnonAnswer {
  questionId: string;
  value: number;
  dimension: string;
  weight: number;
}

interface AnonQuestion {
  id: string;
  text: string;
  dimension: string;
  weight: number;
  options: { value: number; label: string }[];
}

interface AnchorResult {
  code: string;
  name: string;
  score: number;
  level: "coreAdvantage" | "highSensitive" | "moderate" | "nonCore";
  levelLabel: string;
}

// ─── Helpers ──────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function buildQuestions(language: Language): AnonQuestion[] {
  const activeQuestions = QUESTIONS_DATA.filter(question => question.status === "active");
  return shuffleArray(activeQuestions).map(questionData => ({
    id: questionData.id,
    text: questionData.text[language],
    dimension: questionData.dimension,
    weight: questionData.weight,
    options: LIKERT_OPTIONS[language].map((label, index) => ({
      value: LIKERT_VALUES[index],
      label,
    })),
  }));
}

function calculateRawScores(answers: AnonAnswer[]): Record<string, number> {
  const scores: Record<string, number> = {};
  DIMENSION_CODES.forEach(dim => { scores[dim] = 0; });
  answers.forEach(answer => {
    if (answer.dimension in scores) {
      scores[answer.dimension] += answer.value * answer.weight;
    }
  });
  Object.keys(scores).forEach(dim => {
    scores[dim] = Math.round(scores[dim] * 10) / 10;
  });
  return scores;
}

function getScoreLevel(score: number): { level: "coreAdvantage" | "highSensitive" | "moderate" | "nonCore"; label: Record<Language, string> } {
  if (score >= 80) return { level: "coreAdvantage", label: { "zh-CN": "核心优势锚点", "zh-TW": "核心優勢錨點", en: "Core Advantage" } };
  if (score >= 65) return { level: "highSensitive", label: { "zh-CN": "核心锚", "zh-TW": "核心錨", en: "Core Anchor" } };
  if (score >= 45) return { level: "moderate", label: { "zh-CN": "中度影响", "zh-TW": "中度影響", en: "Moderate Influence" } };
  return { level: "nonCore", label: { "zh-CN": "非核心维度", "zh-TW": "非核心維度", en: "Non-core" } };
}

function getLevelColor(level: string): string {
  switch (level) {
    case "coreAdvantage": return "#C0392B";
    case "highSensitive": return "#E47E22";
    case "moderate": return "#2980B9";
    case "nonCore": return "#95A5A6";
    default: return "#95A5A6";
  }
}

// Text helper
function text(language: Language, zhCn: string, zhTw: string, en: string): string {
  if (language === "en") return en;
  if (language === "zh-TW") return zhTw;
  return zhCn;
}

// ─── SVG Radar Chart ─────────────────────────────

function AnonRadarChart({ scores, language }: { scores: Record<string, number>; language: Language }) {
  const centerX = 200;
  const centerY = 200;
  const maxRadius = 150;
  const anchors = DIMENSION_CODES;
  const angleStep = (2 * Math.PI) / anchors.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const gridLevels = [25, 50, 75, 100];

  const dataPoints = anchors.map((_, index) => {
    const score = scores[anchors[index]] || 0;
    return getPoint(index, score);
  });

  const dataPath = dataPoints.map((point, index) =>
    `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
  ).join(" ") + " Z";

  return (
    <svg viewBox="0 0 400 400" className="w-full max-w-[360px] mx-auto">
      {/* Grid circles */}
      {gridLevels.map(level => {
        const points = anchors.map((_, index) => getPoint(index, level));
        const path = points.map((point, index) =>
          `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
        ).join(" ") + " Z";
        return (
          <path key={level} d={path} fill="none" stroke="#E9ECEF" strokeWidth={1} />
        );
      })}

      {/* Axis lines */}
      {anchors.map((_, index) => {
        const point = getPoint(index, 100);
        return (
          <line key={`axis-${index}`} x1={centerX} y1={centerY} x2={point.x} y2={point.y}
            stroke="#E9ECEF" strokeWidth={1} />
        );
      })}

      {/* Data polygon */}
      <path d={dataPath} fill="rgba(28, 40, 87, 0.15)" stroke="#1C2857" strokeWidth={2.5} />

      {/* Data points */}
      {dataPoints.map((point, index) => (
        <circle key={`point-${index}`} cx={point.x} cy={point.y} r={4}
          fill="#1C2857" stroke="white" strokeWidth={2} />
      ))}

      {/* Labels */}
      {anchors.map((anchor, index) => {
        const labelPoint = getPoint(index, 120);
        const name = DIMENSION_NAMES[anchor]?.[language] || anchor;
        const score = scores[anchor] || 0;
        return (
          <g key={`label-${index}`}>
            <text x={labelPoint.x} y={labelPoint.y - 8}
              textAnchor="middle" fontSize={11} fontWeight={600} fill="#1C2857">
              {anchor}
            </text>
            <text x={labelPoint.x} y={labelPoint.y + 8}
              textAnchor="middle" fontSize={10} fill="#666">
              {score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main Component ──────────────────────────────

export default function AnonymousParticipantPage() {
  const { token } = useParams<{ token: string }>();
  const [view, setView] = useState<PageView>("loading");
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Identity
  const [participantName, setParticipantName] = useState("");

  // Work years
  const [participantWorkYears, setParticipantWorkYears] = useState<number | null>(null);
  const [workYearsInput, setWorkYearsInput] = useState("");

  // Assessment state
  const [questions, setQuestions] = useState<AnonQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnonAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Results state
  const [anchorResults, setAnchorResults] = useState<AnchorResult[]>([]);
  const [displayScores, setDisplayScores] = useState<Record<string, number>>({});
  const [mainAnchor, setMainAnchor] = useState<string>("");
  const [conflictPairs, setConflictPairs] = useState<[string, string][]>([]);

  const startTimeRef = useRef<number>(Date.now());

  const language = batchInfo?.language || "zh-TW";
  const currentQuestion = questions[currentIndex] || null;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0;

  // ─── Token Validation ───────────────────────────
  useEffect(() => {
    if (!token) {
      setErrorMessage(text("zh-TW", "链接无效", "連結無效", "Invalid link"));
      setView("invalid");
      return;
    }

    async function validateToken() {
      try {
        // Look up the link by token
        const { data: linkData, error: linkError } = await supabase
          .from("anonymous_assessment_links")
          .select("id, token, status, batch_id")
          .eq("token", token)
          .single();

        if (linkError || !linkData) {
          setErrorMessage(text("zh-TW", "未找到此测评链接", "未找到此測評連結", "Assessment link not found"));
          setView("invalid");
          return;
        }

        // Check link status
        if (linkData.status === "completed") {
          setErrorMessage(text("zh-TW", "此测评链接已使用完毕", "此測評連結已使用完畢", "This assessment link has already been used"));
          setView("invalid");
          return;
        }

        if (linkData.status === "disabled") {
          setErrorMessage(text("zh-TW", "此测评链接已被停用", "此測評連結已被停用", "This assessment link has been disabled"));
          setView("invalid");
          return;
        }

        // Fetch batch info
        const { data: batchData, error: batchError } = await supabase
          .from("anonymous_assessment_batches")
          .select("*")
          .eq("id", linkData.batch_id)
          .single();

        if (batchError) {
          console.error("[AnonymousAssessment] Batch query error:", batchError.message, batchError.code, batchError.details);
          setErrorMessage(text("zh-TW", "测评批次查询失败", "測評批次查詢失敗", "Failed to load assessment batch"));
          setView("invalid");
          return;
        }

        if (!batchData) {
          console.error("[AnonymousAssessment] Batch not found for id:", linkData.batch_id);
          setErrorMessage(text("zh-TW", "测评批次不存在", "測評批次不存在", "Assessment batch not found"));
          setView("invalid");
          return;
        }

        // Check batch status
        if (batchData.status === "closed" || batchData.status === "draft") {
          setErrorMessage(
            batchData.status === "closed"
              ? text("zh-TW", "此测评已关闭", "此測評已關閉", "This assessment has been closed")
              : text("zh-TW", "此测评尚未开放", "此測評尚未開放", "This assessment is not yet available")
          );
          setView("invalid");
          return;
        }

        // Check expiry
        if (batchData.expires_at && new Date(batchData.expires_at) < new Date()) {
          setErrorMessage(text("zh-TW", "此测评已过期", "此測評已過期", "This assessment has expired"));
          setView("expired");
          return;
        }

        const batch: BatchInfo = {
          id: batchData.id,
          batchName: batchData.batch_name,
          description: batchData.description || "",
          assessmentType: batchData.assessment_type,
          instructions: batchData.instructions || "",
          language: (batchData.language || "zh-TW") as Language,
          optionalIdentityEnabled: batchData.optional_identity_enabled || false,
          reportVisibility: batchData.report_visibility || "personal_only",
          expiresAt: batchData.expires_at,
          status: batchData.status,
        };

        const link: LinkInfo = {
          id: linkData.id,
          token: linkData.token,
          status: linkData.status,
          batchId: linkData.batch_id,
        };

        setBatchInfo(batch);
        setLinkInfo(link);

        // If link is already in_progress, they might be revisiting
        // Let them start fresh for now
        setView("landing");
      } catch {
        setErrorMessage(text("zh-TW", "验证链接时出错", "驗證連結時發生錯誤", "Error validating link"));
        setView("invalid");
      }
    }

    validateToken();
  }, [token]);

  // ─── Start Assessment ───────────────────────────
  const handleStartAssessment = useCallback(async () => {
    if (!batchInfo || !linkInfo) return;

    // If identity is enabled, go to identity step first
    if (batchInfo.optionalIdentityEnabled && view === "landing") {
      setView("identity");
      return;
    }

    // Go to work years step
    setView("workYears");
  }, [batchInfo, linkInfo, view]);

  const handleIdentitySubmit = useCallback(() => {
    if (!batchInfo || !linkInfo) return;
    // After identity, go to work years step
    setView("workYears");
  }, [batchInfo, linkInfo]);

  const handleWorkYearsSubmit = useCallback(async () => {
    if (!batchInfo || !linkInfo || participantWorkYears === null) return;

    // Build questions in batch language
    const questionList = buildQuestions(batchInfo.language);
    setQuestions(questionList);
    startTimeRef.current = Date.now();

    // Update link status to in_progress
    try {
      await supabase
        .from("anonymous_assessment_links")
        .update({
          status: "in_progress",
          started_at: new Date().toISOString(),
          last_opened_at: new Date().toISOString(),
          ...(participantName ? { participant_name: participantName } : {}),
        })
        .eq("id", linkInfo.id);
    } catch {
      // Non-blocking — proceed even if status update fails
    }

    setView("assessment");
  }, [batchInfo, linkInfo, participantName, participantWorkYears]);

  // ─── Submit Answer ──────────────────────────────
  const handleOptionClick = useCallback((value: number) => {
    if (!currentQuestion) return;
    setSelectedOption(value);

    setTimeout(() => {
      const newAnswer: AnonAnswer = {
        questionId: currentQuestion.id,
        value,
        dimension: currentQuestion.dimension,
        weight: currentQuestion.weight,
      };

      const newAnswers = [...answers, newAnswer];
      setAnswers(newAnswers);
      setSelectedOption(null);

      if (currentIndex >= totalQuestions - 1) {
        // Assessment complete
        completeAssessment(newAnswers);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 200);
  }, [currentQuestion, answers, currentIndex, totalQuestions]);

  // ─── Go Back ────────────────────────────────────
  const handleGoBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setAnswers(prev => prev.slice(0, -1));
    }
  }, [currentIndex]);

  // ─── Complete Assessment ────────────────────────
  const completeAssessment = useCallback(async (finalAnswers: AnonAnswer[]) => {
    setView("completing");

    const rawScores = calculateRawScores(finalAnswers);
    const normalizedScores = standardizeScores(rawScores);
    setDisplayScores(normalizedScores);

    // Determine main anchor
    const sorted = Object.entries(normalizedScores).sort(([, a], [, b]) => b - a);
    const primaryAnchor = sorted[0][0];
    setMainAnchor(primaryAnchor);

    // Detect conflicts
    const conflicts: [string, string][] = [];
    for (const [anchorA, anchorB] of CONFLICT_ANCHOR_PAIRS) {
      if ((normalizedScores[anchorA] || 0) >= 65 && (normalizedScores[anchorB] || 0) >= 65) {
        conflicts.push([anchorA, anchorB]);
      }
    }
    setConflictPairs(conflicts);

    // Build anchor results
    const lang = batchInfo?.language || "zh-TW";
    const results: AnchorResult[] = sorted.map(([code, score]) => {
      const { level, label } = getScoreLevel(score);
      return {
        code,
        name: DIMENSION_NAMES[code]?.[lang] || code,
        score,
        level,
        levelLabel: label[lang],
      };
    });
    setAnchorResults(results);

    // Save to database
    if (linkInfo && batchInfo) {
      try {
        // Insert response
        await supabase
          .from("anonymous_assessment_responses")
          .insert({
            link_id: linkInfo.id,
            batch_id: batchInfo.id,
            answers: finalAnswers,
            calculated_scores: { ...normalizedScores, work_years: participantWorkYears },
          });

        // Update link status to completed
        await supabase
          .from("anonymous_assessment_links")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", linkInfo.id);
      } catch (error) {
        console.error("Failed to save anonymous assessment:", error);
      }
    }

    // Short delay for UX feel
    setTimeout(() => setView("results"), 1200);
  }, [batchInfo, linkInfo, participantWorkYears]);

  // ─── Render: Loading ────────────────────────────
  if (view === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: "rgba(28, 40, 87, 0.1)" }}>
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#1C2857" }} />
          </div>
          <p className="text-sm text-muted-foreground">驗證連結中...</p>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Invalid / Expired ──────────────────
  if (view === "invalid" || view === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: view === "expired" ? "#FFF3E0" : "#FDECEA" }}>
            {view === "expired"
              ? <Clock className="h-8 w-8" style={{ color: "#E47E22" }} />
              : <AlertTriangle className="h-8 w-8" style={{ color: "#C0392B" }} />
            }
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#1C2857" }}>
            {view === "expired"
              ? text(language, "测评已过期", "測評已過期", "Assessment Expired")
              : text(language, "链接无效", "連結無效", "Invalid Link")
            }
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{errorMessage}</p>
          <div className="pt-2">
            <p className="text-xs text-muted-foreground/60">
              {text(language, "如有疑问，请联系管理员", "如有疑問，請聯繫管理員", "If you have questions, please contact your administrator")}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Landing ────────────────────────────
  if (view === "landing" && batchInfo) {
    const assessmentTypeLabel = batchInfo.assessmentType === "career_anchor"
      ? text(language, "SCPC 职业锚测评", "SCPC 職業錨測評", "SCPC Career Anchor Assessment")
      : batchInfo.assessmentType === "life_card"
        ? text(language, "人生卡测评", "人生卡測評", "Espresso Card Assessment")
        : text(language, "整合测评", "整合測評", "Integration Assessment");

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: "linear-gradient(160deg, #f4f6f8 0%, #e6ebf1 50%, #dfe5ee 100%)" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full space-y-6"
        >
          {/* Brand Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: "rgba(28, 40, 87, 0.08)", color: "#1C2857" }}>
              <Shield className="w-3.5 h-3.5" />
              {text(language, "匿名测评", "匿名測評", "Anonymous Assessment")}
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 text-center" style={{ background: "linear-gradient(180deg, #1C2857 0%, #263268 100%)" }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4"
                style={{ backgroundColor: "rgba(181, 210, 96, 0.2)", color: "#B5D260" }}>
                {assessmentTypeLabel}
              </div>
              <h1 className="text-xl font-bold text-white leading-tight mb-2">
                {batchInfo.batchName}
              </h1>
              {batchInfo.description && (
                <p className="text-sm text-white/60 leading-relaxed max-w-sm mx-auto">
                  {batchInfo.description}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-5">
              {/* Instructions */}
              {batchInfo.instructions && (
                <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F9FB" }}>
                  <p className="text-sm leading-relaxed" style={{ color: "#444" }}>
                    {batchInfo.instructions}
                  </p>
                </div>
              )}

              {/* Info chips */}
              <div className="flex flex-wrap gap-3 justify-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: "#F0F2F5", color: "#555" }}>
                  <Clock className="w-3.5 h-3.5" />
                  {text(language, "约 15-20 分钟", "約 15-20 分鐘", "About 15-20 min")}
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: "#F0F2F5", color: "#555" }}>
                  <Target className="w-3.5 h-3.5" />
                  {text(language, "40 道题目", "40 道題目", "40 Questions")}
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: "#F0F2F5", color: "#555" }}>
                  <Lock className="w-3.5 h-3.5" />
                  {text(language, "完全匿名", "完全匿名", "Fully Anonymous")}
                </div>
              </div>

              {/* Important note */}
              <div className="rounded-xl p-4 border" style={{ borderColor: "#E9ECEF", backgroundColor: "#FAFBFC" }}>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {text(language,
                    "这不是能力测评，也不是性格测试。请选择真实倾向，而非社会期待或「正确答案」。您的回答完全匿名，不会与任何个人信息关联。",
                    "這不是能力測評，也不是性格測試。請選擇真實傾向，而非社會期待或「正確答案」。您的回答完全匿名，不會與任何個人資訊關聯。",
                    "This is not an ability test or personality quiz. Please choose your true preferences, not social expectations. Your responses are fully anonymous."
                  )}
                </p>
              </div>

              {/* Start button */}
              <button
                onClick={handleStartAssessment}
                className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: "#1C2857" }}
              >
                {text(language, "开始测评", "開始測評", "Start Assessment")}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground/50">
            SCPC — Strategic Career Planning Consultant
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Identity Input ─────────────────────
  if (view === "identity" && batchInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: "linear-gradient(160deg, #f4f6f8 0%, #e6ebf1 50%, #dfe5ee 100%)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-lg font-bold" style={{ color: "#1C2857" }}>
              {text(language, "可选: 填写姓名", "可選: 填寫姓名", "Optional: Enter Your Name")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {text(language,
                "您可以选择填写姓名以便后续一对一回馈。留空则完全匿名。",
                "您可以選擇填寫姓名以便後續一對一回饋。留空則完全匿名。",
                "You may enter your name for personalized follow-up. Leave blank for full anonymity."
              )}
            </p>
          </div>

          <input
            type="text"
            value={participantName}
            onChange={event => setParticipantName(event.target.value)}
            placeholder={text(language, "您的姓名（可选）", "您的姓名（可選）", "Your name (optional)")}
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: "#E9ECEF", focusRingColor: "#1C2857" }}
          />

          <div className="flex gap-3">
            <button
              onClick={() => setView("landing")}
              className="flex-1 py-3 rounded-xl border text-sm font-medium hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#E9ECEF", color: "#666" }}
            >
              {text(language, "返回", "返回", "Back")}
            </button>
            <button
              onClick={handleIdentitySubmit}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#1C2857" }}
            >
              {text(language, "开始测评", "開始測評", "Continue")}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Work Years Input ───────────────────
  if (view === "workYears" && batchInfo) {
    const handleWorkYearsInputChange = (rawValue: string) => {
      if (rawValue === "") {
        setWorkYearsInput("");
        setParticipantWorkYears(null);
        return;
      }
      const cleaned = rawValue.replace(/\D/g, "");
      if (cleaned === "") return;
      const years = Math.min(parseInt(cleaned, 10), 50);
      setWorkYearsInput(String(years));
      setParticipantWorkYears(years);
    };

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: "linear-gradient(160deg, #f4f6f8 0%, #e6ebf1 50%, #dfe5ee 100%)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: "rgba(28, 40, 87, 0.08)" }}>
              <svg className="w-7 h-7" style={{ color: "#1C2857" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h2 className="text-lg font-bold" style={{ color: "#1C2857" }}>
              {text(language, "请输入您的工作年资", "請輸入您的工作年資", "Enter Your Work Experience")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {text(language,
                "工作年资将帮助系统为您提供更精准的职业阶段分析。",
                "工作年資將幫助系統為您提供更精準的職業階段分析。",
                "Your work experience helps the system provide more accurate career stage analysis."
              )}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "#444" }}>
              {text(language, "工作年资", "工作年資", "Years of Work Experience")}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={workYearsInput}
                onChange={(event) => handleWorkYearsInputChange(event.target.value)}
                placeholder={text(language, "请输入年数", "請輸入年數", "Enter years")}
                className="w-full px-4 py-3.5 rounded-xl border-2 text-lg font-medium transition-all outline-none"
                style={{
                  borderColor: participantWorkYears !== null ? "#1C2857" : "#E9ECEF",
                  color: "#1C2857",
                }}
                autoFocus
              />
              {participantWorkYears !== null && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#999" }}>
                  {text(language, "年", "年", "years")}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (batchInfo.optionalIdentityEnabled) {
                  setView("identity");
                } else {
                  setView("landing");
                }
              }}
              className="flex-1 py-3.5 rounded-xl border text-sm font-medium hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#E9ECEF", color: "#666" }}
            >
              {text(language, "返回", "返回", "Back")}
            </button>
            <button
              onClick={handleWorkYearsSubmit}
              disabled={participantWorkYears === null}
              className={cn(
                "flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                participantWorkYears !== null
                  ? "text-white hover:opacity-90"
                  : "text-white/50 cursor-not-allowed"
              )}
              style={{ backgroundColor: participantWorkYears !== null ? "#1C2857" : "#9CA3AF" }}
            >
              {text(language, "开始测评", "開始測評", "Start Assessment")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Assessment ─────────────────────────
  if (view === "assessment" && currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#F4F6F8" }}>
        {/* Top bar */}
        <header className="h-14 px-4 sm:px-8 flex items-center justify-between border-b bg-white/90 backdrop-blur-sm"
          style={{ borderColor: "#E9ECEF" }}>
          <button
            onClick={handleGoBack}
            disabled={currentIndex === 0}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium transition-colors",
              currentIndex === 0 ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            {text(language, "上一题", "上一題", "Previous")}
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: "rgba(28, 40, 87, 0.06)", color: "#1C2857" }}>
              <Target className="w-3.5 h-3.5" />
              {text(language, "匿名测评", "匿名測評", "Anonymous")}
            </div>

            <div className="flex items-center gap-2">
              <div className="w-24 sm:w-32 h-2 bg-white rounded-full overflow-hidden border" style={{ borderColor: "#E0E4EA" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: "#1C2857" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-xs font-semibold" style={{ color: "#1C2857" }}>
                {currentIndex + 1}/{totalQuestions}
              </span>
            </div>
          </div>
        </header>

        {/* Question area */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Question number */}
                <div className="mb-5">
                  <div className="inline-flex px-3.5 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: "#1C2857" }}>
                    {text(language, "问题", "問題", "Q")} {currentIndex + 1} / {totalQuestions}
                  </div>
                </div>

                {/* Question card */}
                <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8 relative overflow-hidden"
                  style={{ borderColor: "#E4E8EE" }}>
                  <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl" style={{ backgroundColor: "#B5D260" }} />

                  <h2 className="text-lg sm:text-xl font-semibold leading-relaxed mb-8" style={{ color: "#1C2857" }}>
                    {currentQuestion.text}
                  </h2>

                  <div className="space-y-2.5">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedOption === option.value;
                      return (
                        <motion.button
                          key={index}
                          onClick={() => handleOptionClick(option.value)}
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          className="w-full text-left p-4 rounded-xl border-2 transition-all duration-150 focus:outline-none"
                          style={{
                            borderColor: isSelected ? "#B5D260" : "#E9ECEF",
                            backgroundColor: isSelected ? "rgba(181, 210, 96, 0.08)" : "white",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm transition-colors"
                              style={{
                                backgroundColor: isSelected ? "#B5D260" : "#F0F2F5",
                                color: isSelected ? "white" : "#888",
                              }}
                            >
                              {index + 1}
                            </div>
                            <span className="font-medium text-sm sm:text-base" style={{ color: "#1C2857" }}>
                              {option.label}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Completing ─────────────────────────
  if (view === "completing") {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-5"
        >
          <motion.div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: "rgba(181, 210, 96, 0.15)" }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: "#B5D260" }} />
          </motion.div>
          <div>
            <p className="text-lg font-bold" style={{ color: "#1C2857" }}>
              {text(language, "测评完成！", "測評完成！", "Assessment Complete!")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {text(language, "正在生成您的个人报告...", "正在生成您的個人報告...", "Generating your personal report...")}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Results ────────────────────────────
  if (view === "results" && anchorResults.length > 0) {
    const topAnchor = anchorResults[0];
    const coreAnchors = anchorResults.filter(anchor => anchor.level === "coreAdvantage");
    const highAnchors = anchorResults.filter(anchor => anchor.level === "highSensitive");

    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #F4F6F8 0%, #EAEEF3 100%)" }}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b" style={{ borderColor: "#E4E8EE" }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#1C2857" }}>
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold" style={{ color: "#1C2857" }}>
                {text(language, "测评结果", "測評結果", "Assessment Results")}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: "rgba(28, 40, 87, 0.06)", color: "#1C2857" }}>
              <Shield className="w-3.5 h-3.5" />
              {text(language, "匿名", "匿名", "Anonymous")}
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8"
            style={{ borderColor: "#E9ECEF" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              {text(language,
                "这不是能力测评，也不是性格测试。你的分数不代表你强或弱，而代表：在长期职业选择中，哪些条件如果反复被忽视，你会逐渐痛苦、消耗，甚至离开。",
                "這不是能力測評，也不是性格測試。你的分數不代表你強或弱，而代表：在長期職業選擇中，哪些條件如果反覆被忽視，你會逐漸痛苦、消耗，甚至離開。",
                "This is not an ability test or personality quiz. Your scores represent which career conditions, if repeatedly neglected, would lead to gradual dissatisfaction and burnout."
              )}
            </p>
          </motion.div>

          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8"
            style={{ borderColor: "#E9ECEF" }}
          >
            <h2 className="text-base font-bold mb-4" style={{ color: "#1C2857" }}>
              {text(language, "职业锚雷达图", "職業錨雷達圖", "Career Anchor Radar")}
            </h2>
            <AnonRadarChart scores={displayScores} language={language} />
            <p className="text-xs text-center mt-3 text-muted-foreground">
              {text(language,
                "越接近外圈，代表越难被牺牲；越靠近中心，代表你对此相对灵活。",
                "越接近外圈，代表越難被犧牲；越靠近中心，代表你對此相對靈活。",
                "Closer to the edge = harder to compromise; closer to center = more flexible."
              )}
            </p>
          </motion.div>

          {/* Main Anchor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border overflow-hidden"
            style={{ borderColor: "#E9ECEF" }}
          >
            <div className="px-6 sm:px-8 py-5" style={{ background: "linear-gradient(135deg, #1C2857, #2A3A6E)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 mb-1">
                    {text(language, "你的核心职业锚", "你的核心職業錨", "Your Core Career Anchor")}
                  </p>
                  <h3 className="text-lg font-bold text-white">
                    {topAnchor.code} — {topAnchor.name}
                  </h3>
                </div>
                <div className="text-3xl font-bold text-white/90">
                  {topAnchor.score}
                </div>
              </div>
            </div>
            <div className="px-6 sm:px-8 py-5">
              <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                {text(language,
                  "最不愿放弃的自我概念中的核心要素。",
                  "最不願放棄的自我概念中的核心要素。",
                  "The core element of your self-concept you are least willing to give up."
                )}
              </p>
            </div>
          </motion.div>

          {/* All Scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8"
            style={{ borderColor: "#E9ECEF" }}
          >
            <h2 className="text-base font-bold mb-5" style={{ color: "#1C2857" }}>
              {text(language, "八维度得分详情", "八維度得分詳情", "8-Dimension Score Details")}
            </h2>
            <div className="space-y-3">
              {anchorResults.map((anchor, index) => (
                <motion.div
                  key={anchor.code}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.04 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 text-xs font-bold text-center" style={{ color: "#1C2857" }}>
                    {anchor.code}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: "#333" }}>{anchor.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: getLevelColor(anchor.level) + "14",
                            color: getLevelColor(anchor.level),
                          }}>
                          {anchor.levelLabel}
                        </span>
                        <span className="text-sm font-bold" style={{ color: "#1C2857" }}>{anchor.score}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ backgroundColor: "#F0F2F5" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: getLevelColor(anchor.level) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${anchor.score}%` }}
                        transition={{ duration: 0.6, delay: 0.4 + index * 0.05 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Conflict Warning */}
          {conflictPairs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8"
              style={{ borderColor: "#E9ECEF" }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#E47E22" }} />
                <div>
                  <h3 className="text-sm font-bold mb-2" style={{ color: "#E47E22" }}>
                    {text(language, "检测到结构性冲突", "偵測到結構性衝突", "Structural Conflict Detected")}
                  </h3>
                  {conflictPairs.map(([anchorA, anchorB], index) => (
                    <p key={index} className="text-sm text-muted-foreground mb-1">
                      {DIMENSION_NAMES[anchorA]?.[language]} × {DIMENSION_NAMES[anchorB]?.[language]}
                    </p>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {text(language,
                      "很多认真思考职业的人都会有这种拉扯。这不是你不够好，而是任何人长期这样都会内耗。",
                      "很多認真思考職業的人都會有這種拉扯。這不是你不夠好，而是任何人長期這樣都會內耗。",
                      "Many thoughtful professionals experience this tension. It's not a weakness — it's a natural challenge that requires conscious navigation."
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Closing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: "rgba(28, 40, 87, 0.04)" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
              {text(language,
                "这个结果不是给你一个标准答案，而是帮你更清楚地知道：如果你要走很远，哪些要素是您的核心坚持。",
                "這個結果不是給你一個標準答案，而是幫你更清楚地知道：如果你要走很遠，哪些要素是您的核心堅持。",
                "This result isn't a definitive answer — it helps you understand which elements are your core commitments if you want to go far in your career."
              )}
            </p>
            <p className="text-xs text-muted-foreground/50 mt-4">
              SCPC — Strategic Career Planning Consultant
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}