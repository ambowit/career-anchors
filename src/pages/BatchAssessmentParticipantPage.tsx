import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Target,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  KeyRound,
  User,
  Building2,
  Mail,
  Briefcase,
  PauseCircle,
  Download,
  Lock,
  GripVertical,
  Heart,
  Sparkles,
  Share2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  QUESTIONS_DATA,
  DIMENSION_CODES,
  DIMENSION_NAMES,
  LIKERT_OPTIONS,
  LIKERT_VALUES,
  CONFLICT_ANCHOR_PAIRS,
  standardizeScores,
} from "@/data/questions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  IDEAL_CARDS,
  CATEGORY_CONFIG,
  getCardLabel,
  getCategoryLabel,
  shuffleCards,
  type IdealCard,
  type CardCategory,
} from "@/data/idealCards";
import { downloadV3ReportAsPdf, type V3DownloadParams } from "@/lib/reportV3Download";
import {
  generateCombinedFusionHTML,
  fetchIdealCardGeneratorData,
  fetchAiCardDescriptions,
  COMBINED_FUSION_CSS,
  type CombinedFusionData,
} from "@/lib/reportFusionDownload";
import { generateV3Report, type V3ReportInput } from "@/lib/reportV3Generator";
import { CPC_REPORT_CSS, CPC_WEB_BODY_RESET } from "@/lib/reportDesignSystem";
import { generateIdealCardReportHTML, downloadReportWithCover } from "@/lib/exportReport";
import type { Language } from "@/hooks/useLanguage";

// ─── Types ────────────────────────────────────────

type PageView =
  | "loading"
  | "invalid"
  | "expired"
  | "paused"
  | "landing"
  | "verify"
  | "identity"
  | "assessment"
  | "completing"
  | "ideal-card-intro"
  | "ideal-card-select"
  | "ideal-card-pick"
  | "ideal-card-rank"
  | "ideal-card-completing"
  | "generating-report"
  | "report"
  | "results";

interface BatchData {
  id: string;
  batch_name: string;
  organization_name: string;
  assessment_type: string;
  status: string;
  batch_slug: string;
  access_code: string;
  language: string;
  instructions: string;
  start_time: string;
  end_time: string;
  allow_repeat_entry: boolean;
  allow_resume: boolean;
  allow_view_report: boolean;
  employee_report_access_mode: "view_and_download" | "view_only" | "hidden";
  max_code_attempts: number;
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

function getScoreLevel(score: number): { level: AnchorResult["level"]; label: Record<Language, string> } {
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

function text(language: Language, zhCn: string, zhTw: string, en: string): string {
  if (language === "en") return en;
  if (language === "zh-TW") return zhTw;
  return zhCn;
}

// ─── Radar Chart ──────────────────────────────────

function BatchRadarChart({ scores, language }: { scores: Record<string, number>; language: Language }) {
  const centerX = 200;
  const centerY = 200;
  const maxRadius = 150;
  const anchors = DIMENSION_CODES;
  const angleStep = (2 * Math.PI) / anchors.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
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
      {gridLevels.map(level => {
        const points = anchors.map((_, index) => getPoint(index, level));
        const path = points.map((point, index) =>
          `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
        ).join(" ") + " Z";
        return <path key={level} d={path} fill="none" stroke="#E9ECEF" strokeWidth={1} />;
      })}
      {anchors.map((_, index) => {
        const point = getPoint(index, 100);
        return <line key={`axis-${index}`} x1={centerX} y1={centerY} x2={point.x} y2={point.y} stroke="#E9ECEF" strokeWidth={1} />;
      })}
      <path d={dataPath} fill="rgba(28, 40, 87, 0.15)" stroke="#1C2857" strokeWidth={2.5} />
      {dataPoints.map((point, index) => (
        <circle key={`point-${index}`} cx={point.x} cy={point.y} r={4} fill="#1C2857" stroke="white" strokeWidth={2} />
      ))}
      {anchors.map((anchor, index) => {
        const labelPoint = getPoint(index, 120);
        const name = DIMENSION_NAMES[anchor]?.[language] || anchor;
        const score = scores[anchor] || 0;
        return (
          <g key={`label-${index}`}>
            <text x={labelPoint.x} y={labelPoint.y - 8} textAnchor="middle" fontSize={11} fontWeight={600} fill="#1C2857">{anchor}</text>
            <text x={labelPoint.x} y={labelPoint.y + 8} textAnchor="middle" fontSize={10} fill="#666">{score}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Storage key helpers
const SESSION_STORAGE_KEY = "scpc_batch_session_";
function getSessionKey(batchSlug: string) { return SESSION_STORAGE_KEY + batchSlug; }

// ─── Main Component ──────────────────────────────

export default function BatchAssessmentParticipantPage() {
  const { slug } = useParams<{ slug: string }>();
  const [view, setView] = useState<PageView>("loading");
  const [batchData, setBatchData] = useState<BatchData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Verify
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [codeAttempts, setCodeAttempts] = useState(0);
  const [codeLocked, setCodeLocked] = useState(false);
  const [codeError, setCodeError] = useState("");

  // Identity
  const [participantName, setParticipantName] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [workYearsInput, setWorkYearsInput] = useState("");
  const [workYears, setWorkYears] = useState<number | null>(null);

  // Session
  const [sessionToken, setSessionToken] = useState("");
  const [sessionId, setSessionId] = useState("");

  // Assessment
  const [questions, setQuestions] = useState<AnonQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnonAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Results
  const [anchorResults, setAnchorResults] = useState<AnchorResult[]>([]);
  const [displayScores, setDisplayScores] = useState<Record<string, number>>({});
  const [mainAnchor, setMainAnchor] = useState("");
  const [conflictPairs, setConflictPairs] = useState<[string, string][]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
const [isGeneratingShare, setIsGeneratingShare] = useState(false);

  // Ideal Card states (for combined assessment)
  const [idealSelectedPhase1, setIdealSelectedPhase1] = useState<Set<number>>(new Set());
  const [idealSelectedPhase2, setIdealSelectedPhase2] = useState<Set<number>>(new Set());
  const [idealRankedCards, setIdealRankedCards] = useState<IdealCard[]>([]);
  const [careerAnchorScores, setCareerAnchorScores] = useState<Record<string, number>>({});
  const [fullReportHtml, setFullReportHtml] = useState("");
  const [fullReportCss, setFullReportCss] = useState("");
  const [fullReportHtmlForPdf, setFullReportHtmlForPdf] = useState("");
  const [reportNumber, setReportNumber] = useState("");
  const [reportGenStep, setReportGenStep] = useState("");

  const startTimeRef = useRef<number>(Date.now());

  const language = (batchData?.language || "zh-TW") as Language;
  const currentQuestion = questions[currentIndex] || null;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0;

  // ─── Batch Validation ──────────────────────────

  useEffect(() => {
    if (!slug) {
      setErrorMessage(text("zh-TW" as Language, "链接无效", "連結無效", "Invalid link"));
      setView("invalid");
      return;
    }

    async function validateBatch() {
      try {
        const { data, error } = await supabase
          .from("scpc_assessment_batches")
          .select("*")
          .eq("batch_slug", slug)
          .single();

        if (error || !data) {
          setErrorMessage(text("zh-TW" as Language, "未找到此施测批次", "未找到此施測批次", "Assessment batch not found"));
          setView("invalid");
          return;
        }

        const batch = data as BatchData;
        setBatchData(batch);

        // Log link visit
        supabase.from("scpc_batch_access_logs").insert({
          batch_id: batch.id,
          event_type: "link_visit",
          ip_address: "",
        });

        // Check status
        if (batch.status === "draft") {
          setErrorMessage(text("zh-TW" as Language, "此批次尚未开放", "此批次尚未開放", "This batch is not yet active"));
          setView("invalid");
          return;
        }
        if (batch.status === "paused") {
          setErrorMessage(text("zh-TW" as Language, "此批次已暂停", "此批次已暫停", "This batch is currently paused"));
          setView("paused");
          return;
        }
        if (batch.status === "closed" || batch.status === "archived") {
          setErrorMessage(text("zh-TW" as Language, "此批次已结束", "此批次已結束", "This batch has ended"));
          setView("expired");
          return;
        }

        // Check time window
        const now = new Date();
        if (new Date(batch.start_time) > now) {
          setErrorMessage(text("zh-TW" as Language,
            `此批次将于 ${new Date(batch.start_time).toLocaleString()} 开放`,
            `此批次將於 ${new Date(batch.start_time).toLocaleString()} 開放`,
            `This batch opens at ${new Date(batch.start_time).toLocaleString()}`
          ));
          setView("invalid");
          return;
        }
        if (new Date(batch.end_time) < now) {
          setErrorMessage(text("zh-TW" as Language, "此批次已过期", "此批次已過期", "This batch has expired"));
          setView("expired");
          return;
        }

        // Check for resume — look for existing session_token in sessionStorage
        const storedToken = sessionStorage.getItem(getSessionKey(slug!));
        if (storedToken && batch.allow_resume) {
          const { data: existingSession } = await supabase
            .from("scpc_assessment_sessions")
            .select("*")
            .eq("session_token", storedToken)
            .eq("batch_id", batch.id)
            .single();

          if (existingSession && existingSession.status === "in_progress") {
            // Resume session
            setSessionToken(existingSession.session_token);
            setSessionId(existingSession.id);
            setParticipantName(existingSession.participant_name || "");
            setDepartment(existingSession.department || "");
            setEmail(existingSession.email || "");
            setWorkYears(existingSession.work_years);

            const savedAnswers = (existingSession.answers || []) as AnonAnswer[];
            const savedIndex = existingSession.current_question_index || 0;

            // Rebuild questions in a deterministic order for resume
            const questionList = buildQuestions(batch.language as Language);
            setQuestions(questionList);
            setAnswers(savedAnswers);
            setCurrentIndex(savedIndex);
            startTimeRef.current = Date.now();
            setView("assessment");
            return;
          }

          if (existingSession && existingSession.status === "completed") {
            if (!batch.allow_repeat_entry) {
              setErrorMessage(text(batch.language as Language, "您已完成此批次施测", "您已完成此批次施測", "You have already completed this assessment"));
              setView("invalid");
              return;
            }
            // Allow repeat — clear old session token
            sessionStorage.removeItem(getSessionKey(slug!));
          }
        }

        setView("landing");
      } catch {
        setErrorMessage(text("zh-TW" as Language, "验证链接时出错", "驗證連結時發生錯誤", "Error validating link"));
        setView("invalid");
      }
    }

    validateBatch();
  }, [slug]);

  // ─── Code Verification ─────────────────────────

  const handleVerifyCode = useCallback(async () => {
    if (!batchData || codeLocked) return;

    const inputCode = accessCodeInput.trim().toUpperCase();
    if (inputCode.length < 4) {
      setCodeError(text(language, "请输入完整验证码", "請輸入完整驗證碼", "Please enter the full access code"));
      return;
    }

    if (inputCode !== batchData.access_code) {
      const newAttempts = codeAttempts + 1;
      setCodeAttempts(newAttempts);

      // Log failed attempt
      supabase.from("scpc_batch_access_logs").insert({
        batch_id: batchData.id,
        event_type: "code_verify_fail",
        metadata: { attempt: newAttempts },
      });

      if (newAttempts >= batchData.max_code_attempts) {
        setCodeLocked(true);
        setCodeError(text(language,
          "验证码错误次数过多，已锁定",
          "驗證碼錯誤次數過多，已鎖定",
          "Too many failed attempts. Access locked."
        ));
      } else {
        const remaining = batchData.max_code_attempts - newAttempts;
        setCodeError(text(language,
          `验证码错误，还剩 ${remaining} 次机会`,
          `驗證碼錯誤，還剩 ${remaining} 次機會`,
          `Wrong code. ${remaining} attempts remaining.`
        ));
      }
      return;
    }

    // Success
    setCodeError("");
    supabase.from("scpc_batch_access_logs").insert({
      batch_id: batchData.id,
      event_type: "code_verify_success",
    });
    setView("identity");
  }, [batchData, accessCodeInput, codeAttempts, codeLocked, language]);

  // ─── Identity Submit ───────────────────────────

  const handleIdentitySubmit = useCallback(async () => {
    if (!batchData || !participantName.trim() || workYears === null) return;

    try {
      const { data: session, error } = await supabase
        .from("scpc_assessment_sessions")
        .insert({
          batch_id: batchData.id,
          participant_name: participantName.trim(),
          department: department.trim(),
          email: email.trim(),
          work_years: workYears,
          status: "in_progress",
          answers: [],
          current_question_index: 0,
        })
        .select()
        .single();

      if (error || !session) {
        console.error("Failed to create session:", error);
        return;
      }

      setSessionToken(session.session_token);
      setSessionId(session.id);

      // Store token for resume
      if (slug) {
        sessionStorage.setItem(getSessionKey(slug), session.session_token);
      }

      // Log assessment start
      supabase.from("scpc_batch_access_logs").insert({
        batch_id: batchData.id,
        event_type: "assessment_start",
        metadata: { session_id: session.id },
      });

      // Route based on assessment type
      if (batchData.assessment_type === "life_card") {
        // Life card only — skip career anchor questions, go directly to card selection
        startTimeRef.current = Date.now();
        setView("ideal-card-intro");
      } else {
        // career_anchor or combined — start with career anchor questions
        const questionList = buildQuestions(language);
        setQuestions(questionList);
        startTimeRef.current = Date.now();
        setView("assessment");
      }
    } catch (error) {
      console.error("Session creation error:", error);
    }
  }, [batchData, participantName, department, email, workYears, language, slug]);

  // ─── Answer Handling ───────────────────────────

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

      const nextIndex = currentIndex + 1;

      // Save progress to DB
      if (sessionId) {
        supabase
          .from("scpc_assessment_sessions")
          .update({
            answers: newAnswers,
            current_question_index: nextIndex,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId);
      }

      if (currentIndex >= totalQuestions - 1) {
        completeAssessment(newAnswers);
      } else {
        setCurrentIndex(nextIndex);
      }
    }, 200);
  }, [currentQuestion, answers, currentIndex, totalQuestions, sessionId]);

  const handleGoBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setAnswers(prev => prev.slice(0, -1));
    }
  }, [currentIndex]);

  // ─── Complete Assessment ───────────────────────

  const completeAssessment = useCallback(async (finalAnswers: AnonAnswer[]) => {
    setView("completing");

    const rawScores = calculateRawScores(finalAnswers);
    const normalizedScores = standardizeScores(rawScores);
    setDisplayScores(normalizedScores);

    const sorted = Object.entries(normalizedScores).sort(([, a], [, b]) => b - a);
    const primaryAnchor = sorted[0][0];
    setMainAnchor(primaryAnchor);

    const conflicts: [string, string][] = [];
    for (const [anchorA, anchorB] of CONFLICT_ANCHOR_PAIRS) {
      if ((normalizedScores[anchorA] || 0) >= 65 && (normalizedScores[anchorB] || 0) >= 65) {
        conflicts.push([anchorA, anchorB]);
      }
    }
    setConflictPairs(conflicts);

    const results: AnchorResult[] = sorted.map(([code, score]) => {
      const { level, label } = getScoreLevel(score);
      return {
        code,
        name: DIMENSION_NAMES[code]?.[language] || code,
        score,
        level,
        levelLabel: label[language],
      };
    });
    setAnchorResults(results);

    // Calculate duration
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    // Save result to DB
    if (batchData && sessionId) {
      try {
        await supabase.from("scpc_assessment_results").insert({
          session_id: sessionId,
          batch_id: batchData.id,
          participant_name: participantName,
          department,
          email,
          work_years: workYears,
          calculated_scores: normalizedScores,
          main_anchor: primaryAnchor,
          conflict_pairs: conflicts,
          duration_seconds: durationSeconds,
          value_ranking: [],
        });

        await supabase
          .from("scpc_assessment_sessions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            answers: finalAnswers,
            current_question_index: totalQuestions,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId);

        supabase.from("scpc_batch_access_logs").insert({
          batch_id: batchData.id,
          event_type: "assessment_complete",
          metadata: { session_id: sessionId, duration_seconds: durationSeconds },
        });
      } catch (error) {
        console.error("Failed to save batch assessment result:", error);
      }
    }

    if (batchData?.assessment_type === "combined") {
      setCareerAnchorScores(normalizedScores);
      setTimeout(() => setView("ideal-card-intro"), 1200);
    } else {
      // career_anchor or life_card only → generate full report
      setTimeout(() => setView("generating-report"), 1200);
    }
  }, [batchData, sessionId, participantName, department, email, workYears, language, totalQuestions]);

  // ─── Work Years Handler ────────────────────────

  const handleWorkYearsChange = useCallback((rawValue: string) => {
    if (rawValue === "") {
      setWorkYearsInput("");
      setWorkYears(null);
      return;
    }
    const cleaned = rawValue.replace(/\D/g, "");
    if (cleaned === "") return;
    const years = Math.min(parseInt(cleaned, 10), 50);
    setWorkYearsInput(String(years));
    setWorkYears(years);
  }, []);

  // ─── Assessment type label ─────────────────────

  const assessmentTypeLabel = useMemo(() => {
    if (!batchData) return "";
    const type = batchData.assessment_type;
    if (type === "career_anchor") return text(language, "SCPC 职业锚测评", "SCPC 職業錨測評", "SCPC Career Anchor Assessment");
    if (type === "life_card") return text(language, "人生卡测评", "人生卡測評", "Espresso Card Assessment");
    return text(language, "整合测评", "整合測評", "Integration Assessment");
  }, [batchData, language]);

  // ─── Ideal Card Memos & Handlers (combined assessment) ────

  const shuffledIdealCards = useMemo(() => shuffleCards(IDEAL_CARDS), []);

  const idealPhase2Cards = useMemo(() => {
    const selected = shuffledIdealCards.filter((card) => idealSelectedPhase1.has(card.id));
    return shuffleCards(selected);
  }, [shuffledIdealCards, idealSelectedPhase1]);

  const handleIdealTogglePhase1 = useCallback((cardId: number) => {
    setIdealSelectedPhase1((prev) => {
      const updated = new Set(prev);
      if (updated.has(cardId)) {
        updated.delete(cardId);
      } else {
        if (updated.size < 30) updated.add(cardId);
      }
      return updated;
    });
  }, []);

  const handleIdealTogglePhase2 = useCallback((cardId: number) => {
    setIdealSelectedPhase2((prev) => {
      const updated = new Set(prev);
      if (updated.has(cardId)) {
        updated.delete(cardId);
      } else {
        if (updated.size < 10) updated.add(cardId);
      }
      return updated;
    });
  }, []);

  const handleIdealGoToPhase2 = useCallback(() => {
    setView("ideal-card-pick");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleIdealGoToRank = useCallback(() => {
    const selected = IDEAL_CARDS.filter((card) => idealSelectedPhase2.has(card.id));
    setIdealRankedCards(selected);
    setView("ideal-card-rank");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [idealSelectedPhase2]);

  const handleIdealBackToSelect = useCallback(() => {
    setIdealSelectedPhase2(new Set());
    setView("ideal-card-select");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleIdealBackToPick = useCallback(() => {
    setView("ideal-card-pick");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const completeIdealCardAssessment = useCallback(async () => {
    setView("ideal-card-completing");

    const idealCardResults = idealRankedCards.map((card, index) => ({
      rank: index + 1,
      cardId: card.id,
      category: card.category,
      label: getCardLabel(card, language),
      labelEn: card.en,
    }));

    const categoryDistribution: Record<string, number> = { intrinsic: 0, lifestyle: 0, interpersonal: 0, material: 0 };
    idealCardResults.forEach(card => {
      categoryDistribution[card.category] = (categoryDistribution[card.category] || 0) + 1;
    });

    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    const assessmentType = batchData?.assessment_type || "combined";

    if (sessionId && batchData) {
      try {
        if (assessmentType === "life_card") {
          // Standalone life_card: CREATE a new result record
          // (completeAssessment was never called, so no record exists yet)
          await supabase.from("scpc_assessment_results").insert({
            session_id: sessionId,
            batch_id: batchData.id,
            participant_name: participantName,
            department,
            email,
            work_years: workYears,
            calculated_scores: {},
            main_anchor: "",
            conflict_pairs: [],
            value_ranking: idealCardResults,
            duration_seconds: durationSeconds,
          });

          // Mark session as completed
          await supabase
            .from("scpc_assessment_sessions")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", sessionId);

          supabase.from("scpc_batch_access_logs").insert({
            batch_id: batchData.id,
            event_type: "assessment_complete",
            metadata: { session_id: sessionId, duration_seconds: durationSeconds },
          });
        } else {
          // Combined: UPDATE existing record created by completeAssessment
          const { error: updateError } = await supabase
            .from("scpc_assessment_results")
            .update({ value_ranking: idealCardResults })
            .eq("session_id", sessionId);

          if (updateError) {
            console.error("Failed to update value_ranking via UPDATE, falling back to upsert:", updateError);
            // Fallback: try updating with batch_id as additional filter
            const { error: retryError } = await supabase
              .from("scpc_assessment_results")
              .update({ value_ranking: idealCardResults })
              .eq("session_id", sessionId)
              .eq("batch_id", batchData.id);
            if (retryError) {
              console.error("Retry update also failed:", retryError);
            }
          }
        }
      } catch (error) {
        console.error("Failed to save value_ranking to assessment result:", error);
      }

      // Also save to ideal_card_results table (best-effort, for backward compat)
      try {
        await supabase.from("ideal_card_results").insert({
          user_id: null,
          ranked_cards: idealCardResults,
          top10_cards: idealCardResults.slice(0, 10),
          category_distribution: categoryDistribution,
        });
      } catch (error) {
        console.error("Failed to save ideal card results:", error);
      }
    }

    // Generate full report
    setTimeout(() => setView("generating-report"), 1000);
  }, [idealRankedCards, language, sessionId, batchData, participantName, department, email, workYears]);

  // ─── Report Generation Effect ──────────────────

  useEffect(() => {
    if (view !== "generating-report") return;
    let cancelled = false;

    const generateReport = async () => {
      const assessmentType = batchData?.assessment_type || "career_anchor";
      const stageFromYears = workYears === null ? "mid" : workYears <= 5 ? "early" : workYears <= 10 ? "mid" : "senior";

      if (assessmentType === "combined") {
        // 3-chapter fusion report
        setReportGenStep(text(language, "正在加载卡片数据...", "正在載入卡片資料...", "Loading card data..."));
        const rankedForReport = idealRankedCards.map((card, index) => ({
          rank: index + 1,
          cardId: card.id,
          category: card.category as CardCategory,
          label: getCardLabel(card, language),
          labelEn: card.en,
        }));

        const { quadrantMap, spectrumMap } = await fetchIdealCardGeneratorData(rankedForReport, language);

        setReportGenStep(text(language, "正在生成AI分析...", "正在生成AI分析...", "Generating AI analysis..."));
        let aiDescriptions: Record<number, string> = {};
        if (Object.keys(quadrantMap).length > 0) {
          try {
            aiDescriptions = await fetchAiCardDescriptions(rankedForReport, quadrantMap, language);
          } catch { /* best-effort */ }
        }

        setReportGenStep(text(language, "正在生成整合报告...", "正在生成整合報告...", "Generating integrated report..."));
        const combinedData: CombinedFusionData = {
          anchorScores: careerAnchorScores,
          careerStage: stageFromYears,
          rankedCards: rankedForReport,
          quadrantContents: Object.keys(quadrantMap).length > 0 ? quadrantMap : undefined,
          spectrumTypes: Object.keys(spectrumMap).length > 0 ? spectrumMap : undefined,
          aiDescriptions: Object.keys(aiDescriptions).length > 0 ? aiDescriptions : undefined,
          userId: sessionId || "batch-participant",
          userName: participantName || (language === "en" ? "Participant" : "受測者"),
          workExperienceYears: workYears,
          language,
          assessmentDate: new Date().toISOString().slice(0, 10),
        };

        const result = await generateCombinedFusionHTML(combinedData);
        if (cancelled || !result) return;

        // Extract inner content for web display (new inline format has no <body> tags)
        const rootTag = '<div class="cpc-report-root">';
        const rootIdx = result.fullHtml.indexOf(rootTag);
        const webContent = rootIdx !== -1
          ? result.fullHtml.substring(rootIdx + rootTag.length, result.fullHtml.lastIndexOf("</div>")).trim()
          : result.fullHtml;
        setFullReportHtml(webContent);
        setFullReportCss(COMBINED_FUSION_CSS);
        setFullReportHtmlForPdf(result.fullHtml);
        setReportNumber(result.reportNumber);

      } else if (assessmentType === "career_anchor") {
        // Full career anchor V3 report
        setReportGenStep(text(language, "正在生成职业锚报告...", "正在生成職業錨報告...", "Generating career anchor report..."));
        const reportInput: V3ReportInput = {
          scores: displayScores,
          careerStage: stageFromYears,
          userName: participantName || (language === "en" ? "Participant" : "受測者"),
          workExperienceYears: workYears,
          userId: sessionId || "batch-participant",
          assessmentDate: new Date().toISOString().slice(0, 10),
          reportType: "career_anchor",
        };
        const output = await generateV3Report(reportInput, language as "en" | "zh-TW" | "zh-CN");
        if (cancelled) return;

        setFullReportHtml(output.bodyHtml);
        setFullReportCss(CPC_REPORT_CSS);
        setReportNumber(output.reportNumber);

      } else if (assessmentType === "life_card") {
        // Full ideal life card report
        setReportGenStep(text(language, "正在生成理想人生卡报告...", "正在生成理想人生卡報告...", "Generating Espresso Card report..."));
        const rankedForReport = idealRankedCards.map((card, index) => ({
          rank: index + 1,
          cardId: card.id,
          category: card.category as CardCategory,
        }));

        const { quadrantMap, spectrumMap } = await fetchIdealCardGeneratorData(
          rankedForReport.map(r => ({ ...r, label: "", labelEn: "" })),
          language,
        );

        let aiDescriptions: Record<number, string> = {};
        if (Object.keys(quadrantMap).length > 0) {
          try {
            aiDescriptions = await fetchAiCardDescriptions(
              rankedForReport.map(r => ({ ...r, label: "", labelEn: "" })),
              quadrantMap,
              language,
            );
          } catch { /* best-effort */ }
        }

        const reportBodyHtml = generateIdealCardReportHTML(
          {
            rankedCards: rankedForReport,
            userName: participantName || (language === "en" ? "Participant" : "受測者"),
            createdAt: new Date().toISOString(),
            quadrantContents: Object.keys(quadrantMap).length > 0 ? quadrantMap : undefined,
            spectrumTypes: Object.keys(spectrumMap).length > 0 ? spectrumMap : undefined,
            aiDescriptions: Object.keys(aiDescriptions).length > 0 ? aiDescriptions : undefined,
          },
          language,
        );

        if (cancelled) return;
        // Extract body content
        const bodyMatch = reportBodyHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        setFullReportHtml(bodyMatch ? bodyMatch[1] : reportBodyHtml);
        setFullReportCss(CPC_REPORT_CSS);
        setReportNumber("");
      }

      if (!cancelled) setView("report");
    };

    generateReport().catch((err) => {
      console.error("[BatchReport] Generation failed:", err);
      if (!cancelled) setView("results"); // Fallback to simplified results
    });

    return () => { cancelled = true; };
  }, [view, batchData, language, displayScores, careerAnchorScores, idealRankedCards, workYears, sessionId, participantName]);

  // ─── Render: Loading ───────────────────────────

  if (view === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(28, 40, 87, 0.1)" }}>
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#1C2857" }} />
          </div>
          <p className="text-sm text-muted-foreground">
            {text("zh-TW" as Language, "验证批次中...", "驗證批次中...", "Validating batch...")}
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Invalid / Expired / Paused ────────

  if (view === "invalid" || view === "expired" || view === "paused") {
    const iconMap = { expired: Clock, paused: PauseCircle, invalid: AlertTriangle };
    const colorMap = { expired: "#E47E22", paused: "#2980B9", invalid: "#C0392B" };
    const bgMap = { expired: "#FFF3E0", paused: "#E3F2FD", invalid: "#FDECEA" };
    const titleMap = {
      expired: text(language, "施测已过期", "施測已過期", "Assessment Expired"),
      paused: text(language, "施测已暂停", "施測已暫停", "Assessment Paused"),
      invalid: text(language, "链接无效", "連結無效", "Invalid Link"),
    };
    const Icon = iconMap[view];
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: bgMap[view] }}>
            <Icon className="h-8 w-8" style={{ color: colorMap[view] }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#1C2857" }}>{titleMap[view]}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{errorMessage}</p>
          <p className="text-xs text-muted-foreground/60">
            {text(language, "如有疑问，请联系管理员", "如有疑問，請聯繫管理員", "Contact your administrator for help")}
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Landing ──────────────────────────

  if (view === "landing" && batchData) {
    const deadline = new Date(batchData.end_time);
    const deadlineStr = `${deadline.getFullYear()}/${deadline.getMonth() + 1}/${deadline.getDate()} ${String(deadline.getHours()).padStart(2, "0")}:${String(deadline.getMinutes()).padStart(2, "0")}`;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "linear-gradient(160deg, #f4f6f8 0%, #e6ebf1 50%, #dfe5ee 100%)" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-lg w-full space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "rgba(28, 40, 87, 0.08)", color: "#1C2857" }}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {text(language, "企业施测", "企業施測", "Enterprise Assessment")}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="px-8 pt-8 pb-6 text-center" style={{ background: "linear-gradient(180deg, #1C2857 0%, #263268 100%)" }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4" style={{ backgroundColor: "rgba(181, 210, 96, 0.2)", color: "#B5D260" }}>
                {assessmentTypeLabel}
              </div>
              <h1 className="text-xl font-bold text-white leading-tight mb-2">{batchData.batch_name}</h1>
              {batchData.organization_name && (
                <p className="text-sm text-white/60">{batchData.organization_name}</p>
              )}
            </div>

            <div className="px-8 py-6 space-y-5">
              {batchData.instructions && (
                <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F9FB" }}>
                  <p className="text-sm leading-relaxed" style={{ color: "#444" }}>{batchData.instructions}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: "#F0F2F5", color: "#555" }}>
                  <Clock className="w-3.5 h-3.5" />
                  {batchData.assessment_type === "life_card"
                    ? text(language, "约 10-15 分钟", "約 10-15 分鐘", "~10-15 min")
                    : batchData.assessment_type === "combined"
                    ? text(language, "约 25-35 分钟", "約 25-35 分鐘", "~25-35 min")
                    : text(language, "约 15-20 分钟", "約 15-20 分鐘", "~15-20 min")}
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: "#F0F2F5", color: "#555" }}>
                  <Target className="w-3.5 h-3.5" />
                  {batchData.assessment_type === "life_card"
                    ? text(language, "70 张价值卡", "70 張價值卡", "70 Value Cards")
                    : batchData.assessment_type === "combined"
                    ? text(language, "40 道题 + 70 张卡", "40 道題 + 70 張卡", "40 Qs + 70 Cards")
                    : text(language, "40 道题目", "40 道題目", "40 Questions")}
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: "#F0F2F5", color: "#555" }}>
                  <Clock className="w-3.5 h-3.5" />
                  {text(language, `截止: ${deadlineStr}`, `截止: ${deadlineStr}`, `Deadline: ${deadlineStr}`)}
                </div>
              </div>

              <div className="rounded-xl p-4 border" style={{ borderColor: "#E9ECEF", backgroundColor: "#FAFBFC" }}>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {batchData.assessment_type === "life_card"
                    ? text(language,
                        "您将从70张理想人生卡中筛选出最重要的价值观。没有对错之分，请依据真实感受选择。请向管理员获取验证码以开始施测。",
                        "您將從70張理想人生卡中篩選出最重要的價值觀。沒有對錯之分，請依據真實感受選擇。請向管理員獲取驗證碼以開始施測。",
                        "Select your most important values from 70 Espresso Cards. There are no right or wrong answers. Contact your administrator for the access code."
                      )
                    : text(language,
                        "这不是能力测评，也不是性格测试。请选择真实倾向，而非社会期待或「正确答案」。请向管理员获取验证码以开始施测。",
                        "這不是能力測評，也不是性格測試。請選擇真實傾向，而非社會期待或「正確答案」。請向管理員獲取驗證碼以開始施測。",
                        "This is not an ability test or personality quiz. Choose your true preferences. Contact your administrator for the access code."
                      )
                  }
                </p>
              </div>

              <button onClick={() => setView("verify")} className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: "#1C2857" }}>
                {text(language, "输入验证码开始", "輸入驗證碼開始", "Enter Access Code")}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground/50">SCPC — Strategic Career Planning Consultant</p>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Verify Code ──────────────────────

  if (view === "verify" && batchData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "linear-gradient(160deg, #f4f6f8 0%, #e6ebf1 50%, #dfe5ee 100%)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "rgba(28, 40, 87, 0.08)" }}>
              <KeyRound className="w-7 h-7" style={{ color: "#1C2857" }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "#1C2857" }}>
              {text(language, "输入验证码", "輸入驗證碼", "Enter Access Code")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {text(language, "请输入管理员提供的 6 位验证码", "請輸入管理員提供的 6 位驗證碼", "Enter the 6-character code from your administrator")}
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={accessCodeInput}
              onChange={(event) => {
                setAccessCodeInput(event.target.value.toUpperCase());
                setCodeError("");
              }}
              onKeyDown={(event) => { if (event.key === "Enter") handleVerifyCode(); }}
              placeholder="XXXXXX"
              maxLength={6}
              disabled={codeLocked}
              className={cn(
                "w-full px-4 py-4 rounded-xl border-2 text-center text-2xl font-mono font-bold tracking-[0.3em] transition-all outline-none",
                codeLocked ? "bg-gray-50 cursor-not-allowed" : ""
              )}
              style={{
                borderColor: codeError ? "#C0392B" : accessCodeInput ? "#1C2857" : "#E9ECEF",
                color: "#1C2857",
              }}
              autoFocus
            />
            {codeError && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-center font-medium" style={{ color: "#C0392B" }}>
                {codeError}
              </motion.p>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setView("landing"); setAccessCodeInput(""); setCodeError(""); }} className="flex-1 py-3.5 rounded-xl border text-sm font-medium hover:bg-gray-50 transition-colors" style={{ borderColor: "#E9ECEF", color: "#666" }}>
              {text(language, "返回", "返回", "Back")}
            </button>
            <button onClick={handleVerifyCode} disabled={codeLocked || accessCodeInput.length < 4} className={cn("flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2", codeLocked || accessCodeInput.length < 4 ? "text-white/50 cursor-not-allowed" : "text-white hover:opacity-90")} style={{ backgroundColor: codeLocked || accessCodeInput.length < 4 ? "#9CA3AF" : "#1C2857" }}>
              {text(language, "验证", "驗證", "Verify")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Identity Form ────────────────────

  if (view === "identity" && batchData) {
    const canSubmit = participantName.trim().length > 0 && workYears !== null;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "linear-gradient(160deg, #f4f6f8 0%, #e6ebf1 50%, #dfe5ee 100%)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-bold" style={{ color: "#1C2857" }}>
              {text(language, "填写个人信息", "填寫個人資訊", "Personal Information")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {text(language, "请填写以下信息以开始施测", "請填寫以下資訊以開始施測", "Fill in the details below to start the assessment")}
            </p>
          </div>

          <div className="space-y-4">
            {/* Name (required) */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#444" }}>
                <User className="w-3.5 h-3.5" />
                {text(language, "姓名", "姓名", "Name")}
                <span style={{ color: "#C0392B" }}>*</span>
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                placeholder={text(language, "请输入您的姓名", "請輸入您的姓名", "Enter your name")}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:border-[#1C2857]"
                style={{ borderColor: "#E9ECEF" }}
              />
            </div>

            {/* Department (optional) */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#444" }}>
                <Building2 className="w-3.5 h-3.5" />
                {text(language, "部门", "部門", "Department")}
              </label>
              <input
                type="text"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                placeholder={text(language, "选填", "選填", "Optional")}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:border-[#1C2857]"
                style={{ borderColor: "#E9ECEF" }}
              />
            </div>

            {/* Email (optional) */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#444" }}>
                <Mail className="w-3.5 h-3.5" />
                {text(language, "邮箱", "電子郵件", "Email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={text(language, "选填", "選填", "Optional")}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:border-[#1C2857]"
                style={{ borderColor: "#E9ECEF" }}
              />
            </div>

            {/* Work Years (required) */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#444" }}>
                <Briefcase className="w-3.5 h-3.5" />
                {text(language, "工作年资", "工作年資", "Work Experience")}
                <span style={{ color: "#C0392B" }}>*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={workYearsInput}
                  onChange={(event) => handleWorkYearsChange(event.target.value)}
                  placeholder={text(language, "请输入年数", "請輸入年數", "Years")}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:border-[#1C2857]"
                  style={{ borderColor: "#E9ECEF" }}
                />
                {workYears !== null && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#999" }}>
                    {text(language, "年", "年", "years")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setView("verify")} className="flex-1 py-3.5 rounded-xl border text-sm font-medium hover:bg-gray-50 transition-colors" style={{ borderColor: "#E9ECEF", color: "#666" }}>
              {text(language, "返回", "返回", "Back")}
            </button>
            <button onClick={handleIdentitySubmit} disabled={!canSubmit} className={cn("flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2", canSubmit ? "text-white hover:opacity-90" : "text-white/50 cursor-not-allowed")} style={{ backgroundColor: canSubmit ? "#1C2857" : "#9CA3AF" }}>
              {text(language, "开始测评", "開始測評", "Start Assessment")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Assessment ────────────────────────

  if (view === "assessment" && currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F4F6F8" }}>
        <header className="h-14 px-4 sm:px-8 flex items-center justify-between border-b bg-white/90 backdrop-blur-sm" style={{ borderColor: "#E9ECEF" }}>
          <button onClick={handleGoBack} disabled={currentIndex === 0} className={cn("flex items-center gap-1.5 text-sm font-medium transition-colors", currentIndex === 0 ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground")}>
            <ArrowLeft className="w-4 h-4" />
            {text(language, "上一题", "上一題", "Previous")}
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "rgba(28, 40, 87, 0.06)", color: "#1C2857" }}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {text(language, "企业施测", "企業施測", "Enterprise")}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 sm:w-32 h-2 bg-white rounded-full overflow-hidden border" style={{ borderColor: "#E0E4EA" }}>
                <motion.div className="h-full rounded-full" style={{ backgroundColor: "#1C2857" }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: "#1C2857" }}>{currentIndex + 1}/{totalQuestions}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div className="mb-5">
                  <div className="inline-flex px-3.5 py-1.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "#1C2857" }}>
                    {text(language, "问题", "問題", "Q")} {currentIndex + 1} / {totalQuestions}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8 relative overflow-hidden" style={{ borderColor: "#E4E8EE" }}>
                  <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl" style={{ backgroundColor: "#B5D260" }} />
                  <h2 className="text-lg sm:text-xl font-semibold leading-relaxed mb-8" style={{ color: "#1C2857" }}>{currentQuestion.text}</h2>
                  <div className="space-y-2.5">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedOption === option.value;
                      return (
                        <motion.button key={index} onClick={() => handleOptionClick(option.value)} whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }} className="w-full text-left p-4 rounded-xl border-2 transition-all duration-150 focus:outline-none" style={{ borderColor: isSelected ? "#B5D260" : "#E9ECEF", backgroundColor: isSelected ? "rgba(181, 210, 96, 0.08)" : "white" }}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm transition-colors" style={{ backgroundColor: isSelected ? "#B5D260" : "#F0F2F5", color: isSelected ? "white" : "#888" }}>{index + 1}</div>
                            <span className="font-medium text-sm sm:text-base" style={{ color: "#1C2857" }}>{option.label}</span>
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

  // ─── Render: Completing ────────────────────────

  if (view === "completing") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5">
          <motion.div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(181, 210, 96, 0.15)" }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: "#B5D260" }} />
          </motion.div>
          <div>
            <p className="text-lg font-bold" style={{ color: "#1C2857" }}>
              {text(language, "测评完成！", "測評完成！", "Assessment Complete!")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {text(language, "正在生成您的报告...", "正在生成您的報告...", "Generating your report...")}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Ideal Card Intro ──────────────────

  if (view === "ideal-card-intro") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "linear-gradient(160deg, #f4f6f8 0%, #e6ebf1 50%, #dfe5ee 100%)" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-lg w-full space-y-6">
          <div className="bg-white rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="px-8 pt-8 pb-6 text-center" style={{ background: "linear-gradient(180deg, #1C2857 0%, #263268 100%)" }}>
              <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(181,210,96,0.2)" }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Heart className="w-8 h-8" style={{ color: "#B5D260" }} />
              </motion.div>
              <h1 className="text-xl font-bold text-white mb-2">
                {text(language, "理想人生卡测评", "理想人生卡測評", "Espresso Cards")}
              </h1>
              <p className="text-sm text-white/60">
                {batchData?.assessment_type === "life_card"
                  ? text(language, "探索你的人生价值观", "探索你的人生價值觀", "Discover your life values")
                  : text(language, "第二阶段 — 探索你的人生价值观", "第二階段 — 探索你的人生價值觀", "Phase 2 — Discover your life values")}
              </p>
            </div>
            <div className="px-8 py-6 space-y-5">
              <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F9FB" }}>
                <p className="text-sm leading-relaxed" style={{ color: "#444" }}>
                  {text(language,
                    "接下来，你将从70张理想人生卡中筛选出最重要的价值观。分三步进行：选出30张 → 精选10张 → 按优先级排序。",
                    "接下來，你將從70張理想人生卡中篩選出最重要的價值觀。分三步進行：選出30張 → 精選10張 → 按優先級排序。",
                    "Next, select your most important values from 70 Espresso Cards in 3 steps: Pick 30 → Narrow to 10 → Rank them."
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: "#F0F2F5", color: "#555" }}>
                  <Clock className="w-3.5 h-3.5" />
                  {text(language, "约 10-15 分钟", "約 10-15 分鐘", "~10-15 min")}
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: "#F0F2F5", color: "#555" }}>
                  <Target className="w-3.5 h-3.5" />
                  {text(language, "70 张价值卡", "70 張價值卡", "70 value cards")}
                </div>
              </div>
              <button onClick={() => { setView("ideal-card-select"); window.scrollTo({ top: 0 }); }} className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90" style={{ backgroundColor: "#1C2857" }}>
                <Sparkles className="w-4 h-4" />
                {text(language, "开始理想人生卡测评", "開始理想人生卡測評", "Start Espresso Cards")}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground/50">SCPC — Strategic Career Planning Consultant</p>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Ideal Card Select (30 from 70) ────

  if (view === "ideal-card-select") {
    const selectCount = idealSelectedPhase1.size;
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F4F6F8" }}>
        <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-sm" style={{ borderColor: "#E9ECEF" }}>
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold" style={{ color: "#1C2857" }}>
                {text(language, "第一轮：选出30张", "第一輪：選出30張", "Round 1: Pick 30 Cards")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {text(language, "从70张中选出最重要的30张", "從70張中選出最重要的30張", "Pick 30 most important from 70")}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold" style={{ backgroundColor: selectCount === 30 ? "#fce4ec" : "#f1f5f9", color: selectCount === 30 ? "#e74c6f" : "#64748b" }}>
              <Heart className="w-3.5 h-3.5" />
              <span>{selectCount}/30</span>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <BatchCardGrid cards={shuffledIdealCards} selectedIds={idealSelectedPhase1} onToggle={handleIdealTogglePhase1} language={language} />
        </div>
        <div className="sticky bottom-0 z-30 border-t bg-white/95 backdrop-blur-sm" style={{ borderColor: "#E9ECEF", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="max-w-5xl mx-auto px-4 py-3">
            <button onClick={handleIdealGoToPhase2} disabled={selectCount !== 30} className={cn("w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm", selectCount === 30 ? "text-white hover:opacity-90" : "text-white/50 cursor-not-allowed")} style={{ backgroundColor: selectCount === 30 ? "#1C2857" : "#9CA3AF" }}>
              {text(language, "进入第二轮", "進入第二輪", "Continue to Round 2")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Ideal Card Pick (10 from 30) ──────

  if (view === "ideal-card-pick") {
    const pickCount = idealSelectedPhase2.size;
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F4F6F8" }}>
        <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-sm" style={{ borderColor: "#E9ECEF" }}>
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={handleIdealBackToSelect} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "#1C2857" }}>
                  {text(language, "第二轮：精选10张", "第二輪：精選10張", "Round 2: Pick 10 Cards")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {text(language, "从30张中精选最核心的10张", "從30張中精選最核心的10張", "Narrow to the 10 most essential")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold" style={{ backgroundColor: pickCount === 10 ? "#fce4ec" : "#f1f5f9", color: pickCount === 10 ? "#e74c6f" : "#64748b" }}>
              <Heart className="w-3.5 h-3.5" />
              <span>{pickCount}/10</span>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <BatchCardGrid cards={idealPhase2Cards} selectedIds={idealSelectedPhase2} onToggle={handleIdealTogglePhase2} language={language} />
        </div>
        <div className="sticky bottom-0 z-30 border-t bg-white/95 backdrop-blur-sm" style={{ borderColor: "#E9ECEF", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="max-w-5xl mx-auto px-4 py-3 flex gap-3">
            <button onClick={handleIdealBackToSelect} className="flex items-center gap-1.5 px-4 py-3.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {text(language, "上一步", "上一步", "Previous")}
            </button>
            <button onClick={handleIdealGoToRank} disabled={pickCount !== 10} className={cn("flex-1 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm", pickCount === 10 ? "text-white hover:opacity-90" : "text-white/50 cursor-not-allowed")} style={{ backgroundColor: pickCount === 10 ? "#1C2857" : "#9CA3AF" }}>
              {text(language, "进入排序", "進入排序", "Continue to Ranking")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Ideal Card Rank (top 10) ──────────

  if (view === "ideal-card-rank") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F4F6F8" }}>
        <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-sm" style={{ borderColor: "#E9ECEF" }}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
            <button onClick={handleIdealBackToPick} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "#1C2857" }}>
                {text(language, "第三轮：按优先级排序", "第三輪：按優先級排序", "Round 3: Rank by Priority")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {text(language, "拖动排列，第1名是你最重要的价值", "拖動排列，第1名是你最重要的價值", "Drag to rank — #1 is your most important value")}
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Reorder.Group axis="y" values={idealRankedCards} onReorder={setIdealRankedCards} className="flex flex-col gap-3">
            {idealRankedCards.map((card, index) => (
              <BatchRankItem key={card.id} card={card} rank={index + 1} language={language} />
            ))}
          </Reorder.Group>
          <p className="text-xs text-center mt-4 text-muted-foreground">
            {text(language, "拖动卡片重新排序", "拖動卡片重新排序", "Drag cards to reorder")}
          </p>
        </div>
        <div className="sticky bottom-0 z-30 border-t bg-white/95 backdrop-blur-sm" style={{ borderColor: "#E9ECEF", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex gap-3">
            <button onClick={handleIdealBackToPick} className="flex items-center gap-1.5 px-4 py-3.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {text(language, "上一步", "上一步", "Previous")}
            </button>
            <button onClick={completeIdealCardAssessment} className="flex-1 py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 text-sm hover:opacity-90 transition-all" style={{ backgroundColor: "#1C2857" }}>
              <CheckCircle2 className="w-4 h-4" />
              {text(language, "完成并查看结果", "完成並查看結果", "Complete & View Results")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Ideal Card Completing ─────────────

  if (view === "ideal-card-completing") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5">
          <motion.div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(181, 210, 96, 0.15)" }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: "#B5D260" }} />
          </motion.div>
          <div>
            <p className="text-lg font-bold" style={{ color: "#1C2857" }}>
              {text(language, "价值卡测评完成！", "價值卡測評完成！", "Espresso Cards Complete!")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {batchData?.assessment_type === "life_card"
                ? text(language, "正在生成人生卡报告...", "正在生成人生卡報告...", "Generating Espresso Card report...")
                : text(language, "正在生成整合测评报告...", "正在生成整合測評報告...", "Generating integrated report...")}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Generating Report ─────────────────

  if (view === "generating-report") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5 w-72">
          <Loader2 className="w-10 h-10 animate-spin mx-auto" style={{ color: "#1C2857" }} />
          <div className="space-y-2">
            <h2 className="text-base font-bold" style={{ color: "#1C2857" }}>
              {text(language, "正在生成报告", "正在生成報告", "Generating Report")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {reportGenStep || text(language, "请稍候...", "請稍候...", "Please wait...")}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Full Report ───────────────────────

  if (view === "report" && fullReportHtml) {
    const reportAccessMode = batchData?.employee_report_access_mode || "view_and_download";
    const showReport = batchData?.allow_view_report !== false && reportAccessMode !== "hidden";
    const canDownload = reportAccessMode === "view_and_download";

    if (!showReport) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(28, 40, 87, 0.08)" }}>
              <Lock className="h-8 w-8" style={{ color: "#1C2857" }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: "#1C2857" }}>
              {text(language, "您已完成本次测评", "您已完成本次測評", "Assessment Complete")}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {text(language,
                "该报告仅供企业管理员查看。\n如有需要，请联系机构管理员或 HR。",
                "該報告僅供企業管理員查看。\n如有需要，請聯繫機構管理員或 HR。",
                "This report is only available to your organization's administrator.\nPlease contact your HR or administrator if needed."
              )}
            </p>
            <p className="text-xs text-muted-foreground/50">SCPC — Strategic Career Planning Consultant</p>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f8f8f6" }}>
        {/* Sticky top bar */}
        <div
          className="sticky top-0 z-30 border-b backdrop-blur-md"
          style={{ backgroundColor: "rgba(248,248,246,0.92)", borderColor: "#e5e5e0", paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1C2857" }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold" style={{ color: "#1C2857" }}>
                {text(language, "测评报告", "測評報告", "Assessment Report")}
              </span>
            </div>
          </div>
        </div>

        {/* Full report HTML */}
        <div className="max-w-[900px] mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <style dangerouslySetInnerHTML={{ __html: fullReportCss + CPC_WEB_BODY_RESET }} />
          <div
            className="cpc-report-root bg-white rounded-lg shadow-sm"
            dangerouslySetInnerHTML={{ __html: fullReportHtml }}
          />
        </div>

        {/* Bottom bar */}
        <div className="max-w-[900px] mx-auto px-4 pb-12 pt-4" style={{ paddingBottom: "calc(3rem + env(safe-area-inset-bottom, 0px))" }}>
          <div className="flex justify-center gap-3">
            {canDownload ? (
              <>
              <button
                onClick={async () => {
                  setIsGeneratingPdf(true);
                  try {
                    const stageFromYears = workYears === null ? "mid" : workYears <= 5 ? "early" : workYears <= 10 ? "mid" : "senior";
                    const assessmentType = batchData?.assessment_type || "career_anchor";
                    if (assessmentType === "combined") {
                      const fusionHtmlForPdf = fullReportHtmlForPdf || `<style>${COMBINED_FUSION_CSS}</style><div class="cpc-report-root">${fullReportHtml}</div>`;
                      await downloadReportWithCover(
                        fusionHtmlForPdf,
                        {
                          reportType: "fusion",
                          userName: participantName || (language === "en" ? "Participant" : "受測者"),
                          workExperienceYears: workYears,
                          careerStage: stageFromYears,
                          reportVersion: "professional",
                          language,
                          userId: sessionId || "batch-participant",
                          reportNumber,
                        },
                        `SCPC-Fusion-Report-${reportNumber}-${new Date().toISOString().slice(0, 10)}.pdf`,
                      );
                    } else if (assessmentType === "life_card") {
                      const lifeCardHtmlForPdf = `<style>${fullReportCss}</style><div class="cpc-report-root">${fullReportHtml}</div>`;
                      await downloadReportWithCover(
                        lifeCardHtmlForPdf,
                        {
                          reportType: "ideal_card",
                          userName: participantName || (language === "en" ? "Participant" : "受測者"),
                          workExperienceYears: workYears,
                          careerStage: stageFromYears,
                          reportVersion: "professional",
                          language,
                          userId: sessionId || "batch-participant",
                          reportNumber,
                        },
                        `SCPC-Espresso-Card-Report-${reportNumber}-${new Date().toISOString().slice(0, 10)}.pdf`,
                      );
                    } else {
                      const pdfParams: V3DownloadParams = {
                        scores: displayScores,
                        careerStage: stageFromYears,
                        userName: participantName,
                        workExperienceYears: workYears,
                        userId: sessionId || "batch-participant",
                        language: language as "en" | "zh-TW" | "zh-CN",
                        assessmentDate: new Date().toISOString().slice(0, 10),
                      };
                      await downloadV3ReportAsPdf(pdfParams);
                    }
                  } catch (pdfError) {
                    console.error("PDF generation failed:", pdfError);
                    toast.error(text(language, "报告下载失败，请稍后重试", "報告下載失敗，請稍後重試", "Report download failed. Please try again."));
                  } finally {
                    setIsGeneratingPdf(false);
                  }
                }}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#1C2857" }}
              >
                {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isGeneratingPdf
                  ? text(language, "下载中...", "下載中...", "Downloading...")
                  : text(language, "下载完整报告", "下載完整報告", "Download Full Report")}
              </button>
              <button
                onClick={async () => {
                  setIsGeneratingShare(true);
                  try {
                    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
                    const { error: upsertError } = await supabase
                      .from("scpc_assessment_results")
                      .update({ share_token: token } as Record<string, unknown>)
                      .eq("session_id", sessionId)
                      .eq("batch_id", batchData?.id || "");
                    if (upsertError) throw upsertError;
                    const shareUrl = `${window.location.origin}/shared-report/${token}`;
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success(text(language, "分享链接已复制到剪贴板", "分享連結已複製到剪貼簿", "Share link copied to clipboard"));
                  } catch (shareError) {
                    console.error("Share token generation failed:", shareError);
                    toast.error(text(language, "分享链接生成失败", "分享連結產生失敗", "Failed to generate share link"));
                  } finally {
                    setIsGeneratingShare(false);
                  }
                }}
                disabled={isGeneratingShare}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
                style={{ borderColor: "#1C2857", color: "#1C2857" }}
              >
                {isGeneratingShare ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                {isGeneratingShare
                  ? text(language, "生成中...", "產生中...", "Generating...")
                  : text(language, "分享报告", "分享報告", "Share Report")}
              </button>
              </>
            ) : (
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {text(language, "该报告仅支持在线查看，不支持下载。", "該報告僅支持在線查看，不支持下載。", "This report can be viewed online but cannot be downloaded.")}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground/50">
                  {text(language, "报告下载权限由企业管理员设置。", "報告下載權限由企業管理員設定。", "Download permission is managed by your administrator.")}
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground/50 text-center mt-6">SCPC — Strategic Career Planning Consultant</p>
        </div>
      </div>
    );
  }

  // ─── Render: Results (Fallback) ─────────────────

  if (view === "results" && anchorResults.length > 0) {
    const topAnchor = anchorResults[0];
    const reportAccessMode = batchData?.employee_report_access_mode || "view_and_download";
    const showReport = batchData?.allow_view_report !== false && reportAccessMode !== "hidden";
    const canDownload = reportAccessMode === "view_and_download";

    if (!showReport) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(28, 40, 87, 0.08)" }}>
              <Lock className="h-8 w-8" style={{ color: "#1C2857" }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: "#1C2857" }}>
              {text(language, "您已完成本次测评", "您已完成本次測評", "Assessment Complete")}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {text(language,
                "该报告仅供企业管理员查看。\n如有需要，请联系机构管理员或 HR。",
                "該報告僅供企業管理員查看。\n如有需要，請聯繫機構管理員或 HR。",
                "This report is only available to your organization's administrator.\nPlease contact your HR or administrator if needed."
              )}
            </p>
            <p className="text-xs text-muted-foreground/50">SCPC — Strategic Career Planning Consultant</p>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #F4F6F8 0%, #EAEEF3 100%)" }}>
        <header className="bg-white/80 backdrop-blur-sm border-b" style={{ borderColor: "#E4E8EE" }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1C2857" }}>
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold" style={{ color: "#1C2857" }}>
                {text(language, "测评结果", "測評結果", "Assessment Results")}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "rgba(28, 40, 87, 0.06)", color: "#1C2857" }}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {text(language, "企业施测", "企業施測", "Enterprise")}
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Intro */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8" style={{ borderColor: "#E9ECEF" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              {text(language,
                "这不是能力测评，也不是性格测试。你的分数不代表你强或弱，而代表：在长期职业选择中，哪些条件如果反复被忽视，你会逐渐痛苦、消耗，甚至离开。",
                "這不是能力測評，也不是性格測試。你的分數不代表你強或弱，而代表：在長期職業選擇中，哪些條件如果反覆被忽視，你會逐漸痛苦、消耗，甚至離開。",
                "This is not an ability test. Your scores represent which career conditions, if repeatedly neglected, would lead to gradual dissatisfaction and burnout."
              )}
            </p>
          </motion.div>

          {/* Radar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8" style={{ borderColor: "#E9ECEF" }}>
            <h2 className="text-base font-bold mb-4" style={{ color: "#1C2857" }}>
              {text(language, "职业锚雷达图", "職業錨雷達圖", "Career Anchor Radar")}
            </h2>
            <BatchRadarChart scores={displayScores} language={language} />
            <p className="text-xs text-center mt-3 text-muted-foreground">
              {text(language,
                "越接近外圈，代表越难被牺牲；越靠近中心，代表你对此相对灵活。",
                "越接近外圈，代表越難被犧牲；越靠近中心，代表你對此相對靈活。",
                "Closer to the edge = harder to compromise; closer to center = more flexible."
              )}
            </p>
          </motion.div>

          {/* Main Anchor */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: "#E9ECEF" }}>
            <div className="px-6 sm:px-8 py-5" style={{ background: "linear-gradient(135deg, #1C2857, #2A3A6E)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 mb-1">{text(language, "你的核心职业锚", "你的核心職業錨", "Your Core Career Anchor")}</p>
                  <h3 className="text-lg font-bold text-white">{topAnchor.code} — {topAnchor.name}</h3>
                </div>
                <div className="text-3xl font-bold text-white/90">{topAnchor.score}</div>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8" style={{ borderColor: "#E9ECEF" }}>
            <h2 className="text-base font-bold mb-5" style={{ color: "#1C2857" }}>
              {text(language, "八维度得分详情", "八維度得分詳情", "8-Dimension Score Details")}
            </h2>
            <div className="space-y-3">
              {anchorResults.map((anchor, index) => (
                <motion.div key={anchor.code} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + index * 0.04 }} className="flex items-center gap-3">
                  <div className="w-8 text-xs font-bold text-center" style={{ color: "#1C2857" }}>{anchor.code}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: "#333" }}>{anchor.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: getLevelColor(anchor.level) + "14", color: getLevelColor(anchor.level) }}>{anchor.levelLabel}</span>
                        <span className="text-sm font-bold" style={{ color: "#1C2857" }}>{anchor.score}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ backgroundColor: "#F0F2F5" }}>
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: getLevelColor(anchor.level) }} initial={{ width: 0 }} animate={{ width: `${anchor.score}%` }} transition={{ duration: 0.6, delay: 0.4 + index * 0.05 }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Conflict Warning */}
          {conflictPairs.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8" style={{ borderColor: "#E9ECEF" }}>
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
                      "Many professionals experience this tension. It's a natural challenge requiring conscious navigation."
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Ideal Card Top 3 — only for combined assessment */}
          {batchData?.assessment_type === "combined" && idealRankedCards.length >= 3 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8" style={{ borderColor: "#E9ECEF" }}>
              <h2 className="text-base font-bold mb-4" style={{ color: "#1C2857" }}>
                {text(language, "理想人生卡 — 排名前三", "理想人生卡 — 排名前三", "Espresso Cards — Top 3")}
              </h2>
              <div className="space-y-3">
                {idealRankedCards.slice(0, 3).map((card, index) => {
                  const cardCfg = CATEGORY_CONFIG[card.category];
                  const cardLabel = getCardLabel(card, language);
                  return (
                    <div key={card.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: cardCfg.bgColor, border: `1.5px solid ${cardCfg.borderColor}` }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: "linear-gradient(145deg, #FFD700, #FFA000)", color: "#5D4037" }}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "#1C2857" }}>{cardLabel}</div>
                        <div className="text-xs mt-0.5" style={{ color: cardCfg.color }}>{getCategoryLabel(card.category, language)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Report Actions — download permission */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8" style={{ borderColor: "#E9ECEF" }}>
            {canDownload ? (
              <div className="text-center space-y-3">
                <p className="text-sm font-medium" style={{ color: "#1C2857" }}>
                  {text(language, "您的报告已生成", "您的報告已生成", "Your report is ready")}
                </p>
                <button
                  onClick={async () => {
                    setIsGeneratingPdf(true);
                    try {
                      const stageFromYears = workYears === null ? "mid" : workYears <= 5 ? "early" : workYears <= 10 ? "mid" : "senior";
                      const pdfParams: V3DownloadParams = {
                        scores: displayScores,
                        careerStage: stageFromYears,
                        userName: participantName,
                        workExperienceYears: workYears,
                        userId: sessionId || "batch-participant",
                        language: language as "en" | "zh-TW" | "zh-CN",
                        assessmentDate: new Date().toISOString().slice(0, 10),
                      };
                      await downloadV3ReportAsPdf(pdfParams);
                    } catch (pdfError) {
                      console.error("PDF generation failed:", pdfError);
                      toast.error(text(language, "报告下载失败，请稍后重试", "報告下載失敗，請稍後重試", "Report download failed. Please try again."));
                    } finally {
                      setIsGeneratingPdf(false);
                    }
                  }}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "#1C2857" }}
                >
                  {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isGeneratingPdf
                    ? text(language, "下载中...", "下載中...", "Downloading...")
                    : text(language, "下载报告", "下載報告", "Download Report")}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {text(language, "该报告支持查看，不支持下载。", "該報告支持查看，不支持下載。", "This report can be viewed but cannot be downloaded.")}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  {text(language, "报告下载权限由企业管理员设置。", "報告下載權限由企業管理員設定。", "Report download permission is managed by your organization administrator.")}
                </p>
                <button
                  disabled
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white/50 cursor-not-allowed"
                  style={{ backgroundColor: "#9CA3AF" }}
                >
                  <Download className="w-4 h-4" />
                  {text(language, "下载报告", "下載報告", "Download Report")}
                </button>
              </div>
            )}
          </motion.div>

          {/* Closing */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="rounded-2xl p-6 text-center" style={{ backgroundColor: "rgba(28, 40, 87, 0.04)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
              {text(language,
                "这个结果不是给你一个标准答案，而是帮你更清楚地知道：如果你要走很远，哪些要素是您的核心坚持。",
                "這個結果不是給你一個標準答案，而是幫你更清楚地知道：如果你要走很遠，哪些要素是您的核心堅持。",
                "This result helps you understand which elements are your core commitments in your career journey."
              )}
            </p>
            <p className="text-xs text-muted-foreground/50 mt-4">SCPC — Strategic Career Planning Consultant</p>
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

// ─── Batch Card Grid ──────────────────────────────

function BatchCardGrid({
  cards,
  selectedIds,
  onToggle,
  language,
}: {
  cards: IdealCard[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  language: Language;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
      {cards.map((card) => {
        const isSelected = selectedIds.has(card.id);
        const cfg = CATEGORY_CONFIG[card.category];
        const label = getCardLabel(card, language);
        return (
          <motion.button
            key={card.id}
            onClick={() => onToggle(card.id)}
            whileTap={{ scale: 0.96 }}
            className="relative text-left rounded-xl border transition-all p-3 min-h-[64px]"
            style={
              isSelected
                ? { backgroundColor: "#fef2f2", borderColor: "#e74c6f", borderWidth: 2, boxShadow: "0 4px 16px rgba(231,76,111,0.2)", transform: "translateY(-1px)" }
                : { backgroundColor: "white", borderColor: "#e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }
            }
          >
            {isSelected && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#e74c6f" }}>
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
            <span className="text-sm font-medium leading-snug block pr-5 text-slate-700">{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Batch Rank Item ──────────────────────────────

function BatchRankItem({ card, rank, language }: { card: IdealCard; rank: number; language: Language }) {
  const cfg = CATEGORY_CONFIG[card.category];
  const label = getCardLabel(card, language);
  const categoryLabel = getCategoryLabel(card.category, language);
  const isTopThree = rank <= 3;
  return (
    <Reorder.Item value={card} className="relative cursor-grab active:cursor-grabbing" style={{ touchAction: "none" }}
      whileDrag={{ scale: 1.03, zIndex: 50, boxShadow: `0 20px 40px ${cfg.color}30, 0 8px 16px rgba(0,0,0,0.1)` }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}>
      <div className="relative rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: `linear-gradient(135deg, ${cfg.bgColor} 0%, white 35%, ${cfg.bgColor}cc 70%, ${cfg.bgColor} 100%)`,
          boxShadow: [`0 4px 12px ${cfg.color}0c`, `inset 0 1px 0 rgba(255,255,255,0.85)`].join(", "),
          border: `1.5px solid ${cfg.borderColor}70`,
        }}>
        <div className="flex items-center gap-3 px-5 py-4">
          <GripVertical className="w-4 h-4 flex-shrink-0 opacity-30" style={{ color: cfg.color }} />
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm"
            style={isTopThree
              ? { background: "linear-gradient(145deg, #FFD700 0%, #FFC107 45%, #FFA000 100%)", color: "#5D4037", boxShadow: "0 3px 10px rgba(255,160,0,0.4)" }
              : { background: "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.7))", color: "#94a3b8", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}>
            {rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base text-slate-800 leading-tight truncate">{label}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-xs font-medium" style={{ color: cfg.color }}>{categoryLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}
