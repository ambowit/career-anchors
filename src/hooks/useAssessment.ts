import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { type Language, useLanguage } from "@/hooks/useLanguage";
import {
  QUESTIONS_DATA,
  DIMENSION_NAMES,
  DIMENSION_CODES,
  LIKERT_OPTIONS,
  LIKERT_VALUES,
  SCORE_INTERPRETATION,
  CONFLICT_ANCHOR_PAIRS,
  ADAPTIVE_THRESHOLDS,
  TIE_BREAK_ORDER,
  standardizeScores,
  type QuestionData,
  type DiagnosticRole,
} from "@/data/questions";
import { useTestAuth, type AssessmentMode } from "@/hooks/useTestAuth";

export interface Question {
  id: string;
  type: "likert";
  dimension: string;
  weight: number;
  diagnosticRole: DiagnosticRole;
  text: string;
  options: {
    value: number;
    label: string;
    subLabel?: string;
  }[];
}

export interface Answer {
  questionId: string;
  value: number;
  dimension: string;
  weight: number;
}

export const DIMENSIONS = DIMENSION_NAMES;

// =============================================
// Adaptive assessment phases (SCPC v2)
// =============================================
// coverage   → Phase 1: 8 questions (1 per anchor, prefer highest weight)
// separation → Phase 2: 4 more questions (top2 + bottom2 anchors)
// focus      → Phase 4: 2 questions/round from Top1 & Top2 only
// review     → Review Mode: strict highest-weight from Top1 & Top2 (≥ soft_cap)
// complete   → Assessment finished
export type AdaptivePhase = "coverage" | "separation" | "focus" | "review" | "complete";

// Legacy compatibility alias
export type AnchorClarity = "clear" | "uncertain" | "conflict";

export interface AnchorStatus {
  dimension: string;
  score: number;
  clarity: AnchorClarity;
  questionsAnswered: number;
  consistency: number;
}

export interface AssessmentResult {
  scores: Record<string, number>;
  mainAnchor: string | null; // Highest-scoring anchor (internal/DB use)
  highSensitivityAnchors: string[]; // All anchors with score > 80
  conflictAnchors: [string, string][];
  riskIndex: number;
  stability: "mature" | "developing" | "unclear";
  interpretation: Record<string, {
    level: "nonNegotiable" | "highSensitive" | "conditional" | "nonCore";
    label: string;
    score: number;
  }>;
  totalQuestionsAnswered?: number;
  adaptiveEfficiency?: number;
  salienceQuestionIds?: string[];
  hasConflict?: boolean;
}

// High-sensitivity anchor threshold: strictly > 80
export const HIGH_SENSITIVITY_THRESHOLD = 80;

// Determine high-sensitivity anchors (score > 80, strictly greater than)
export function getHighSensitivityAnchors(scores: Record<string, number>): string[] {
  return Object.entries(scores)
    .filter(([, score]) => score > HIGH_SENSITIVITY_THRESHOLD)
    .sort(([, a], [, b]) => b - a)
    .map(([dim]) => dim);
}

// Determine if close anchors form dual/triple anchor pattern (diff ≤ 5)
export function getClusterAnchors(scores: Record<string, number>): string[] {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  if (sorted.length < 2) return sorted.map(([dim]) => dim);
  const cluster = [sorted[0][0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[0][1] - sorted[i][1] <= 5) {
      cluster.push(sorted[i][0]);
    } else {
      break;
    }
  }
  return cluster;
}

// =============================================
// Core algorithm helpers
// =============================================

function buildLocalizedQuestion(questionData: QuestionData, language: Language): Question {
  return {
    id: questionData.id,
    type: questionData.type,
    dimension: questionData.dimension,
    weight: questionData.weight,
    diagnosticRole: questionData.diagnosticRole,
    text: questionData.text[language],
    options: LIKERT_OPTIONS[language].map((label, index) => ({
      value: LIKERT_VALUES[index],
      label,
    })),
  };
}

function getInitialLanguage(): Language {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("language-storage");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.language) return parsed.state.language;
      } catch {
        // ignore
      }
    }
  }
  return "zh-CN";
}

// Deterministic shuffle using Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

// =============================================
// Internal scoring: raw_score[anchor] = Σ(answer_value × weight)
// Not normalized, not exposed to user
// =============================================
function calculateCurrentScores(answers: Answer[]): Record<string, number> {
  const scores: Record<string, number> = {};
  DIMENSION_CODES.forEach(dim => {
    scores[dim] = 0;
  });

  answers.forEach((answer) => {
    if (answer.dimension in scores) {
      scores[answer.dimension] += answer.value * answer.weight;
    }
  });

  // Round to 1 decimal for clean comparisons
  Object.keys(scores).forEach(dim => {
    scores[dim] = Math.round(scores[dim] * 10) / 10;
  });

  return scores;
}

// =============================================
// Get available (unanswered, active) questions for an anchor
// =============================================
function getAvailableQuestionsForAnchor(
  anchor: string,
  answeredIds: Set<string>
): QuestionData[] {
  return QUESTIONS_DATA.filter(
    q => q.dimension === anchor && q.status === "active" && !answeredIds.has(q.id)
  );
}

// =============================================
// Pick highest-weight question from a set
// If multiple share the highest weight, random among those
// =============================================
function pickHighestWeightQuestion(questions: QuestionData[]): QuestionData | null {
  if (questions.length === 0) return null;
  const maxWeight = Math.max(...questions.map(q => q.weight));
  const candidates = questions.filter(q => q.weight === maxWeight);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// =============================================
// Phase 1: Coverage — 1 question per anchor (8 total)
// Prefer highest weight, random among equal-weight ties
// =============================================
function selectCoverageQuestions(answeredIds: Set<string>): QuestionData[] {
  const selected: QuestionData[] = [];
  for (const anchor of DIMENSION_CODES) {
    const available = getAvailableQuestionsForAnchor(anchor, answeredIds);
    const pick = pickHighestWeightQuestion(available);
    if (pick) selected.push(pick);
  }
  return shuffleArray(selected);
}

// =============================================
// Phase 2: Separation — Top2 + Bottom2 anchors, 1 question each (4 total)
// =============================================
function selectSeparationQuestions(
  answers: Answer[],
  answeredIds: Set<string>
): QuestionData[] {
  const scores = calculateCurrentScores(answers);
  const sorted = Object.entries(scores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
  const top2Anchors = sorted.slice(0, 2).map(([dim]) => dim);
  const bottom2Anchors = sorted.slice(-2).map(([dim]) => dim);

  // Merge and deduplicate (in case there are fewer than 4 distinct anchors)
  const targetAnchors = [...new Set([...top2Anchors, ...bottom2Anchors])];

  const selected: QuestionData[] = [];
  for (const anchor of targetAnchors) {
    const available = getAvailableQuestionsForAnchor(anchor, answeredIds);
    const pick = pickHighestWeightQuestion(available);
    if (pick) selected.push(pick);
  }
  return shuffleArray(selected);
}

// =============================================
// Stability check (SCPC v2 formula)
//
// delta = raw_score[Top1] - raw_score[Top2]
// avg_weight_answered = mean weight of ALL answered questions
// avg_weight_top2 = mean weight of Top1 & Top2 answered questions
// threshold = 2 × avg_weight_answered + 1 × avg_weight_top2
//
// Stable when: delta ≥ threshold
// =============================================
interface StabilityResult {
  isStable: boolean;
  delta: number;
  threshold: number;
  top1Anchor: string;
  top2Anchor: string;
}

function evaluateStability(
  answers: Answer[],
  scores: Record<string, number>
): StabilityResult {
  const sorted = Object.entries(scores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
  const top1Anchor = sorted[0][0];
  const top2Anchor = sorted[1][0];
  const delta = sorted[0][1] - sorted[1][1];

  // Average weight of all answered questions
  const totalWeight = answers.reduce((sum, answer) => sum + answer.weight, 0);
  const avgWeightAnswered = answers.length > 0 ? totalWeight / answers.length : 0;

  // Average weight of Top1 & Top2 answered questions only
  const top2Answers = answers.filter(
    answer => answer.dimension === top1Anchor || answer.dimension === top2Anchor
  );
  const totalWeightTop2 = top2Answers.reduce((sum, answer) => sum + answer.weight, 0);
  const avgWeightTop2 = top2Answers.length > 0 ? totalWeightTop2 / top2Answers.length : 0;

  const threshold = 2 * avgWeightAnswered + 1 * avgWeightTop2;

  return {
    isStable: delta >= threshold,
    delta,
    threshold,
    top1Anchor,
    top2Anchor,
  };
}

// =============================================
// Phase 4: Focus — 2 questions from Top1 & Top2 only
// Rule: no more than 2 consecutive from same anchor
// Prefer higher weight questions
// =============================================
function selectFocusQuestions(
  answers: Answer[],
  answeredIds: Set<string>,
  top1Anchor: string,
  top2Anchor: string
): QuestionData[] {
  const { maxConsecutiveSameAnchor, focusBatchSize } = ADAPTIVE_THRESHOLDS;
  const selected: QuestionData[] = [];
  const usedIds = new Set(answeredIds);

  for (let questionIndex = 0; questionIndex < focusBatchSize; questionIndex++) {
    // Check last consecutive anchors (from answers + already selected in this batch)
    const recentDimensions = [
      ...answers.map(answer => answer.dimension),
      ...selected.map(question => question.dimension),
    ];
    const lastFewDimensions = recentDimensions.slice(-(maxConsecutiveSameAnchor));

    let candidateAnchors = [top1Anchor, top2Anchor];

    // If last N were all the same anchor, force switch
    if (
      lastFewDimensions.length >= maxConsecutiveSameAnchor &&
      lastFewDimensions.every(dim => dim === lastFewDimensions[0])
    ) {
      candidateAnchors = candidateAnchors.filter(
        anchor => anchor !== lastFewDimensions[0]
      );
    }

    // From candidate anchors, pick the highest-weight available question
    let bestQuestion: QuestionData | null = null;
    for (const anchor of candidateAnchors) {
      const available = getAvailableQuestionsForAnchor(anchor, usedIds);
      const pick = pickHighestWeightQuestion(available);
      if (pick && (!bestQuestion || pick.weight > bestQuestion.weight)) {
        bestQuestion = pick;
      }
    }

    if (bestQuestion) {
      selected.push(bestQuestion);
      usedIds.add(bestQuestion.id);
    }
  }

  return selected;
}

// =============================================
// Review Mode — strict: MUST pick highest weight remaining
// Only Top1 & Top2, 2 per round
// =============================================
function selectReviewQuestions(
  answers: Answer[],
  answeredIds: Set<string>,
  top1Anchor: string,
  top2Anchor: string
): QuestionData[] {
  const { focusBatchSize, maxConsecutiveSameAnchor } = ADAPTIVE_THRESHOLDS;
  const selected: QuestionData[] = [];
  const usedIds = new Set(answeredIds);

  for (let questionIndex = 0; questionIndex < focusBatchSize; questionIndex++) {
    const recentDimensions = [
      ...answers.map(answer => answer.dimension),
      ...selected.map(question => question.dimension),
    ];
    const lastFewDimensions = recentDimensions.slice(-(maxConsecutiveSameAnchor));

    let candidateAnchors = [top1Anchor, top2Anchor];
    if (
      lastFewDimensions.length >= maxConsecutiveSameAnchor &&
      lastFewDimensions.every(dim => dim === lastFewDimensions[0])
    ) {
      candidateAnchors = candidateAnchors.filter(
        anchor => anchor !== lastFewDimensions[0]
      );
    }

    // In review mode, MUST pick the absolute highest-weight remaining question
    let bestQuestion: QuestionData | null = null;
    for (const anchor of candidateAnchors) {
      const available = getAvailableQuestionsForAnchor(anchor, usedIds)
        .sort((questionA, questionB) => questionB.weight - questionA.weight);
      if (available.length > 0) {
        const topAvailable = available[0];
        if (!bestQuestion || topAvailable.weight > bestQuestion.weight) {
          bestQuestion = topAvailable;
        }
      }
    }

    if (bestQuestion) {
      selected.push(bestQuestion);
      usedIds.add(bestQuestion.id);
    }
  }

  return selected;
}

// =============================================
// Tie-breaking: deterministic, reproducible
//
// 1) Compare weight≥1.6 question contribution totals
// 2) Compare count of "3" answers
// 3) Compare most recent question contribution for that anchor
// 4) Fixed order: TF > GM > AU > SE > EC > SV > CH > LS
// =============================================
function breakTie(tiedAnchors: string[], answers: Answer[]): string {
  if (tiedAnchors.length === 1) return tiedAnchors[0];

  // Step 1: High-weight question contributions (weight ≥ 1.6)
  const highWeightContribution: Record<string, number> = {};
  for (const anchor of tiedAnchors) {
    highWeightContribution[anchor] = answers
      .filter(answer => answer.dimension === anchor && answer.weight >= ADAPTIVE_THRESHOLDS.highWeightThreshold)
      .reduce((sum, answer) => sum + answer.value * answer.weight, 0);
  }
  const maxHighWeight = Math.max(...tiedAnchors.map(anchor => highWeightContribution[anchor]));
  const afterStep1 = tiedAnchors.filter(anchor => highWeightContribution[anchor] === maxHighWeight);
  if (afterStep1.length === 1) return afterStep1[0];

  // Step 2: Count of "3" (maximum) answers
  const maxValueCount: Record<string, number> = {};
  for (const anchor of afterStep1) {
    maxValueCount[anchor] = answers.filter(
      answer => answer.dimension === anchor && answer.value === 3
    ).length;
  }
  const maxThrees = Math.max(...afterStep1.map(anchor => maxValueCount[anchor]));
  const afterStep2 = afterStep1.filter(anchor => maxValueCount[anchor] === maxThrees);
  if (afterStep2.length === 1) return afterStep2[0];

  // Step 3: Most recent question's contribution weight for each anchor
  const latestContribution: Record<string, number> = {};
  for (const anchor of afterStep2) {
    const anchorAnswers = answers.filter(answer => answer.dimension === anchor);
    const latestAnswer = anchorAnswers[anchorAnswers.length - 1];
    latestContribution[anchor] = latestAnswer ? latestAnswer.value * latestAnswer.weight : 0;
  }
  const maxLatest = Math.max(...afterStep2.map(anchor => latestContribution[anchor]));
  const afterStep3 = afterStep2.filter(anchor => latestContribution[anchor] === maxLatest);
  if (afterStep3.length === 1) return afterStep3[0];

  // Step 4: Fixed priority order TF > GM > AU > SE > EC > SV > CH > LS
  for (const anchor of TIE_BREAK_ORDER) {
    if (afterStep3.includes(anchor)) return anchor;
  }

  return afterStep3[0]; // Should never reach here
}

// =============================================
// Determine unique Primary Anchor
// =============================================
function determinePrimaryAnchor(
  answers: Answer[],
  scores: Record<string, number>
): string {
  const sorted = Object.entries(scores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
  const topScore = sorted[0][1];

  // Find all anchors tied at the top score
  const tiedAtTop = sorted.filter(([, score]) => score === topScore).map(([dim]) => dim);

  if (tiedAtTop.length === 1) {
    return tiedAtTop[0];
  }

  // Apply deterministic tie-breaking
  return breakTie(tiedAtTop, answers);
}

// =============================================
// Conflict identification
// Classic conflict pairs: SE×EC, GM×AU, CH×LS, TF×GM (small delta)
// Conflict = true when a conflict pair exists AND delta < threshold
// Does NOT change the primary anchor
// =============================================
function identifyConflicts(
  answers: Answer[],
  scores: Record<string, number>
): { hasConflict: boolean; conflictPairs: [string, string][] } {
  const stability = evaluateStability(answers, scores);
  const conflictPairs: [string, string][] = [];

  if (stability.delta < stability.threshold) {
    for (const [anchorA, anchorB] of CONFLICT_ANCHOR_PAIRS) {
      const top2Set = new Set([stability.top1Anchor, stability.top2Anchor]);
      if (top2Set.has(anchorA) && top2Set.has(anchorB)) {
        conflictPairs.push([anchorA, anchorB]);
      }
    }
  }

  return {
    hasConflict: conflictPairs.length > 0,
    conflictPairs,
  };
}

// =============================================
// Main hook
// =============================================
export function useAssessment() {
  const language = useLanguage((state) => state.language);
  // Mode is permanently locked to "full" — adaptive mode is disabled
  const mode: AssessmentMode = "full";
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [phase, setPhase] = useState<AdaptivePhase>("coverage");
  const [anchorStatuses, setAnchorStatuses] = useState<Map<string, AnchorStatus>>(new Map());

  // Initialize question queue based on mode
  const initialLanguage = getInitialLanguage();
  const [questionQueue, setQuestionQueue] = useState<Question[]>(() => {
    // Full mode: all 40 questions, shuffled
    const allQuestions = QUESTIONS_DATA.filter(q => q.status === "active");
    return shuffleArray(allQuestions).map(q => buildLocalizedQuestion(q, initialLanguage));
  });

  const [isComplete, setIsComplete] = useState(false);
  const answeredQuestionIds = useMemo(
    () => new Set(answers.map(answer => answer.questionId)),
    [answers]
  );

  // Update question text when language changes
  useEffect(() => {
    setQuestionQueue(prev =>
      prev.map(question => {
        const original = QUESTIONS_DATA.find(qd => qd.id === question.id);
        if (original) {
          return buildLocalizedQuestion(original, language);
        }
        return question;
      })
    );
  }, [language]);

  const currentQuestion = questionQueue[currentIndex] || null;
  const totalQuestions = questionQueue.length;

  // Progress: linear based on total questions
  const progress = totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0;

  // =============================================
  // Core: submit answer and trigger adaptive logic
  // =============================================
  const submitAnswer = useCallback(
    (value: number) => {
      if (!currentQuestion) return;

      const newAnswer: Answer = {
        questionId: currentQuestion.id,
        value,
        dimension: currentQuestion.dimension,
        weight: currentQuestion.weight,
      };

      const newAnswers = [...answers, newAnswer];
      setAnswers(newAnswers);

      const scores = calculateCurrentScores(newAnswers);
      const answeredCount = newAnswers.length;
      const newAnsweredIds = new Set(newAnswers.map(answer => answer.questionId));

      // Update anchor statuses for UI display (using standardized scores)
      const displayScores = standardizeScores(scores);
      const newStatuses = new Map<string, AnchorStatus>();
      DIMENSION_CODES.forEach(dim => {
        const dimAnswers = newAnswers.filter(answer => answer.dimension === dim);
        const dimScore = displayScores[dim] || 0;
        let consistency = 1.0;
        if (dimAnswers.length >= 2) {
          const values = dimAnswers.map(answer => answer.value);
          const mean = values.reduce((accumulator, value) => accumulator + value, 0) / values.length;
          const variance = values.reduce((accumulator, value) => accumulator + Math.pow(value - mean, 2), 0) / values.length;
          consistency = Math.max(0, 1 - variance / 2);
        }
        newStatuses.set(dim, {
          dimension: dim,
          score: dimScore,
          clarity: "clear",
          questionsAnswered: dimAnswers.length,
          consistency,
        });
      });
      setAnchorStatuses(newStatuses);

      // ===============================
      // Full mode: linear progression
      // ===============================
      if (mode === "full") {
        if (currentIndex >= questionQueue.length - 1) {
          setPhase("complete");
          setIsComplete(true);
        } else {
          setCurrentIndex(prev => prev + 1);
        }
        return;
      }

      // ===============================
      // Adaptive mode algorithm (SCPC v2)
      // ===============================
      const { softCap, hardCap, phase1Count, phase2Count } = ADAPTIVE_THRESHOLDS;

      // (4) Hard cap: 40 questions → force stop
      if (answeredCount >= hardCap) {
        setPhase("complete");
        setIsComplete(true);
        return;
      }

      // Phase 1 → Phase 2 transition: after 8 answers, add separation questions
      if (answeredCount === phase1Count && phase === "coverage") {
        const separationQuestions = selectSeparationQuestions(newAnswers, newAnsweredIds);
        if (separationQuestions.length > 0) {
          setQuestionQueue(prev => [
            ...prev,
            ...separationQuestions.map(q => buildLocalizedQuestion(q, language)),
          ]);
          setPhase("separation");
          setCurrentIndex(prev => prev + 1);
          return;
        }
      }

      // After Phase 2 (≥12 answers): stability checks begin
      if (answeredCount >= phase2Count) {
        // (1) Check stability after every answer from 12 onwards
        const stability = evaluateStability(newAnswers, scores);

        if (stability.isStable) {
          // Primary anchor is stable → stop immediately
          setPhase("complete");
          setIsComplete(true);
          return;
        }

        // At end of current queue → need more questions
        if (currentIndex >= questionQueue.length - 1) {
          if (answeredCount < softCap) {
            // (2) Phase 4: Focus — 2 questions from Top1 & Top2
            const focusQuestions = selectFocusQuestions(
              newAnswers, newAnsweredIds,
              stability.top1Anchor, stability.top2Anchor
            );
            if (focusQuestions.length > 0) {
              setQuestionQueue(prev => [
                ...prev,
                ...focusQuestions.map(q => buildLocalizedQuestion(q, language)),
              ]);
              setPhase("focus");
              setCurrentIndex(prev => prev + 1);
              return;
            }
            // No more questions available for focus → force complete
            setPhase("complete");
            setIsComplete(true);
            return;
          }

          // (3) Review Mode: ≥ soft_cap but < hard_cap
          const reviewQuestions = selectReviewQuestions(
            newAnswers, newAnsweredIds,
            stability.top1Anchor, stability.top2Anchor
          );
          if (reviewQuestions.length > 0) {
            setQuestionQueue(prev => [
              ...prev,
              ...reviewQuestions.map(q => buildLocalizedQuestion(q, language)),
            ]);
            setPhase("review");
            setCurrentIndex(prev => prev + 1);
            return;
          }
          // No more review questions available → force complete
          setPhase("complete");
          setIsComplete(true);
          return;
        }
      }

      // Default: advance to next question in queue
      setCurrentIndex(prev => prev + 1);
    },
    [currentIndex, currentQuestion, questionQueue, answers, phase, language, mode]
  );

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setAnswers(prev => prev.slice(0, -1));
    }
  }, [currentIndex]);

  // =============================================
  // Calculate final results
  // =============================================
  const calculateResults = useCallback((): AssessmentResult => {
    const rawScores = calculateCurrentScores(answers);

    // Determine unique Primary Anchor using RAW scores (internal logic)
    const primaryAnchor = determinePrimaryAnchor(answers, rawScores);

    // Identify structural conflicts using RAW scores
    const { hasConflict, conflictPairs } = identifyConflicts(answers, rawScores);

    // Convert to standardized 0-100 scores for display
    const displayScores = standardizeScores(rawScores);

    // Score interpretation using STANDARDIZED scores (0-100 scale)
    const interpretation: Record<string, {
      level: "nonNegotiable" | "highSensitive" | "conditional" | "nonCore";
      label: string;
      score: number;
    }> = {};

    Object.entries(displayScores).forEach(([dim, score]) => {
      let level: "nonNegotiable" | "highSensitive" | "conditional" | "nonCore";
      let label: string;

      const getLabelForLevel = (levelData: typeof SCORE_INTERPRETATION.nonNegotiable) => {
        if (language === "en") return levelData.labelEn;
        if (language === "zh-TW") return levelData.labelZhTW;
        return levelData.labelZh;
      };

      if (score >= SCORE_INTERPRETATION.nonNegotiable.min) {
        level = "nonNegotiable";
        label = getLabelForLevel(SCORE_INTERPRETATION.nonNegotiable);
      } else if (score >= SCORE_INTERPRETATION.highSensitive.min) {
        level = "highSensitive";
        label = getLabelForLevel(SCORE_INTERPRETATION.highSensitive);
      } else if (score >= SCORE_INTERPRETATION.conditional.min) {
        level = "conditional";
        label = getLabelForLevel(SCORE_INTERPRETATION.conditional);
      } else {
        level = "nonCore";
        label = getLabelForLevel(SCORE_INTERPRETATION.nonCore);
      }

      interpretation[dim] = { level, label, score };
    });

    // Stability assessment using RAW scores
    const stability = evaluateStability(answers, rawScores);
    let stabilityLevel: "mature" | "developing" | "unclear";
    if (stability.isStable && stability.delta >= stability.threshold * 1.5) {
      stabilityLevel = "mature";
    } else if (stability.isStable) {
      stabilityLevel = "developing";
    } else {
      stabilityLevel = "unclear";
    }

    // Risk index
    let riskIndex = 0;
    riskIndex += conflictPairs.length * 20;
    if (stabilityLevel === "unclear") riskIndex += 30;
    else if (stabilityLevel === "developing") riskIndex += 15;
    riskIndex = Math.min(100, riskIndex);

    // Adaptive efficiency
    const adaptiveEfficiency = Math.round((1 - answers.length / 40) * 100);

    // Salient questions (high-weight questions that were answered with "3")
    const salienceQuestionIds = answers
      .filter(answer => answer.weight >= ADAPTIVE_THRESHOLDS.highWeightThreshold && answer.value === 3)
      .map(answer => answer.questionId)
      .slice(0, 5);

    // Determine high-sensitivity anchors (> 80) using standardized scores
    const highSensitivityAnchors = getHighSensitivityAnchors(displayScores);

    return {
      scores: displayScores,
      mainAnchor: primaryAnchor,
      highSensitivityAnchors,
      conflictAnchors: conflictPairs,
      riskIndex,
      stability: stabilityLevel,
      interpretation,
      totalQuestionsAnswered: answers.length,
      adaptiveEfficiency,
      salienceQuestionIds,
      hasConflict,
    };
  }, [answers, language]);

  // Get dimension name in current language
  const getDimensionName = useCallback((dim: string) => {
    return DIMENSIONS[dim]?.[language] || dim;
  }, [language]);

  // Get phase display name
  const getPhaseDisplayName = useCallback(() => {
    const phaseNames: Record<AdaptivePhase, Record<string, string>> = {
      coverage: { en: "Anchor Coverage", "zh-CN": "锚点覆盖", "zh-TW": "錨點覆蓋" },
      separation: { en: "Building Separation", "zh-CN": "建立分差", "zh-TW": "建立分差" },
      focus: { en: "Focused Comparison", "zh-CN": "聚焦比较", "zh-TW": "聚焦比較" },
      review: { en: "Final Review", "zh-CN": "复核确认", "zh-TW": "複核確認" },
      complete: { en: "Complete", "zh-CN": "完成", "zh-TW": "完成" },
    };
    return phaseNames[phase]?.[language] || phaseNames[phase]?.["zh-CN"] || "";
  }, [phase, language]);

  // Restore progress from saved state
  // Rebuilds the question queue up to the current point
  const restoreProgress = useCallback((
    savedAnswers: Answer[],
    savedIndex: number
  ) => {
    setAnswers(savedAnswers);
    setCurrentIndex(savedIndex);

    const scores = calculateCurrentScores(savedAnswers);
    const savedAnsweredIds = new Set(savedAnswers.map(answer => answer.questionId));

    // Recalculate anchor statuses (using standardized scores for display)
    const displayScores = standardizeScores(scores);
    const newStatuses = new Map<string, AnchorStatus>();
    DIMENSION_CODES.forEach(dim => {
      const dimAnswers = savedAnswers.filter(answer => answer.dimension === dim);
      newStatuses.set(dim, {
        dimension: dim,
        score: displayScores[dim] || 0,
        clarity: "clear",
        questionsAnswered: dimAnswers.length,
        consistency: 1,
      });
    });
    setAnchorStatuses(newStatuses);

    // Full mode: rebuild all 40 questions in same order
    const count = savedAnswers.length;
    const allQuestions = QUESTIONS_DATA.filter(q => q.status === "active");
    setQuestionQueue(allQuestions.map(q => buildLocalizedQuestion(q, language)));
    setPhase(count >= 40 ? "complete" : "coverage");
  }, [language]);

  const getQuestionOrder = useCallback(() => {
    return questionQueue.map(question => question.id);
  }, [questionQueue]);

  return {
    currentQuestion,
    currentIndex,
    totalQuestions,
    progress,
    answers,
    phase,
    isComplete,
    anchorStatuses,
    getPhaseDisplayName,
    submitAnswer,
    goBack,
    calculateResults,
    getDimensionName,
    restoreProgress,
    getQuestionOrder,
    language,
    assessmentMode: "full" as AssessmentMode,
  };
}

// Export score interpretation thresholds
export { SCORE_INTERPRETATION, CONFLICT_ANCHOR_PAIRS };
