import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, CloudOff, Cloud, Sparkles, Target, Compass, ShieldCheck } from "lucide-react";
import { useAssessment, DIMENSIONS, type Answer, type AdaptivePhase } from "@/hooks/useAssessment";
import { DIMENSION_NAMES } from "@/data/questions";
import { useSaveAssessmentResult } from "@/hooks/useAssessmentResults";
import { useCompleteAssignment } from "@/hooks/useMyAssignments";
import { useAssessmentProgress, useSaveAssessmentProgress, useClearAssessmentProgress } from "@/hooks/useAssessmentProgress";
import { useAuth } from "@/hooks/useAuth";
import { useTestAuth } from "@/hooks/useTestAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Phase configuration for visual display (SCPC v2 adaptive phases)
const PHASE_CONFIG = {
  coverage: {
    icon: Target,
    colorHue: "75",
    labelZh: "锚点覆盖",
    labelZhTW: "錨點覆蓋",
    labelEn: "Anchor Coverage",
    descZh: "覆盖所有职业锚维度",
    descZhTW: "覆蓋所有職業錨維度",
    descEn: "Covering all career anchor dimensions",
  },
  separation: {
    icon: Compass,
    colorHue: "228",
    labelZh: "建立分差",
    labelZhTW: "建立分差",
    labelEn: "Building Separation",
    descZh: "深入理解您的选择倾向",
    descZhTW: "深入理解您的選擇傾向",
    descEn: "Understanding your preference patterns",
  },
  focus: {
    icon: Target,
    colorHue: "35",
    labelZh: "聚焦比较",
    labelZhTW: "聚焦比較",
    labelEn: "Focused Comparison",
    descZh: "聚焦主要锚点对比",
    descZhTW: "聚焦主要錨點對比",
    descEn: "Comparing top anchor candidates",
  },
  review: {
    icon: ShieldCheck,
    colorHue: "0",
    labelZh: "复核确认",
    labelZhTW: "複核確認",
    labelEn: "Final Review",
    descZh: "验证高敏感锚稳定性",
    descZhTW: "驗證高敏感錨穩定性",
    descEn: "Verifying high-sensitivity anchor stability",
  },
  complete: {
    icon: Target,
    colorHue: "75",
    labelZh: "完成",
    labelZhTW: "完成",
    labelEn: "Complete",
    descZh: "",
    descZhTW: "",
    descEn: "",
  },
};

export default function AssessmentPage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { isTestLoggedIn, testRole, careerStage } = useTestAuth();
  const saveResultMutation = useSaveAssessmentResult();
  const completeAssignmentMutation = useCompleteAssignment();
  const saveProgressMutation = useSaveAssessmentProgress();
  const clearProgressMutation = useClearAssessmentProgress();
  const { data: savedProgress, isLoading: isLoadingProgress } = useAssessmentProgress();
  
  const startTimeRef = useRef<number>(Date.now());
  const [isSaving, setIsSaving] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const hasCheckedProgressRef = useRef(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const lastSavedRef = useRef<string>("");
  
  const isLoggedIn = !!user || isTestLoggedIn;
  
  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    progress,
    phase,
    isComplete,
    answers,
    anchorStatuses,
    submitAnswer,
    goBack,
    calculateResults,
    getDimensionName,
    getQuestionOrder,
    restoreProgress,
    getPhaseDisplayName,
    assessmentMode,
  } = useAssessment();

  // Question type labels - multilingual
  const questionTypeLabels = {
    likert: { 
      label: t("assessment.questionTypes.likert"), 
      color: "hsl(75, 55%, 45%)", 
      bg: "hsl(75, 55%, 95%)" 
    },
    choice: { 
      label: t("assessment.questionTypes.choice"), 
      color: "hsl(35, 90%, 45%)", 
      bg: "hsl(35, 90%, 95%)" 
    },
    scenario: { 
      label: t("assessment.questionTypes.scenario"), 
      color: "hsl(228, 51%, 45%)", 
      bg: "hsl(228, 51%, 95%)" 
    },
  };

  useEffect(() => {
    if (hasCheckedProgressRef.current || answers.length > 0) return;
    
    if (!isLoadingProgress && user && savedProgress) {
      hasCheckedProgressRef.current = true;
      if (savedProgress.answers.length >= 3) {
        setShowResumeDialog(true);
      } else if (savedProgress.answers.length > 0) {
        clearProgressMutation.mutate();
      }
    } else if (!isLoadingProgress && !user) {
      hasCheckedProgressRef.current = true;
    }
  }, [isLoadingProgress, savedProgress, user, answers.length, clearProgressMutation]);

  const handleResume = useCallback(() => {
    if (savedProgress) {
      restoreProgress(
        savedProgress.answers,
        savedProgress.current_index
      );
    }
    setShowResumeDialog(false);
  }, [savedProgress, restoreProgress]);

  const handleStartNew = useCallback(async () => {
    await clearProgressMutation.mutateAsync();
    setShowResumeDialog(false);
  }, [clearProgressMutation]);

  useEffect(() => {
    if (!user || answers.length === 0 || isComplete) return;

    const progressKey = `${currentIndex}-${answers.length}`;
    if (progressKey === lastSavedRef.current) return;

    const saveTimer = setTimeout(() => {
      const questionOrder = getQuestionOrder();
      saveProgressMutation.mutate({
        currentIndex,
        answers,
        questionOrder,
      });
      lastSavedRef.current = progressKey;
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [user, currentIndex, answers, isComplete, saveProgressMutation, getQuestionOrder]);

  useEffect(() => {
    const handleComplete = async () => {
      if (!isComplete || isSaving) return;
      
      setIsSaving(true);
      const results = calculateResults();
      const completionTimeSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

      sessionStorage.setItem("assessmentResults", JSON.stringify(results));

      if (user) {
        try {
          const savedResult = await saveResultMutation.mutateAsync({
            result: results,
            questionCount: totalQuestions,
            completionTimeSeconds,
            answers,
          });
          sessionStorage.setItem("currentResultId", savedResult.id);
          
          // Mark any pending assignment as completed
          try {
            await completeAssignmentMutation.mutateAsync(savedResult.id);
          } catch (assignmentError) {
            // Non-critical: assignment update failure shouldn't block the flow
            console.warn("Assignment status update skipped:", assignmentError);
          }
          
          await clearProgressMutation.mutateAsync();
          
          toast.success(language === "en" ? "Results saved to cloud" : language === "zh-TW" ? "測評結果已儲存到雲端" : "测评结果已保存到云端");
        } catch (error) {
          console.error("Failed to save assessment result:", error);
          toast.error(language === "en" ? "Failed to save results" : language === "zh-TW" ? "結果儲存失敗" : "结果保存失败");
        }
      }

      // Navigate to ideal card test if combined assessment, otherwise to results
      const isCombinedAssessment = sessionStorage.getItem('scpc_combined_assessment') === 'true';
      if (isCombinedAssessment) {
        navigate("/ideal-card-test");
      } else {
        navigate("/results");
      }
    };

    handleComplete();
  }, [isComplete, isSaving, calculateResults, navigate, user, saveResultMutation, totalQuestions, clearProgressMutation, language]);

  const handleSaveAndExit = useCallback(async () => {
    if (user && answers.length > 0 && !isComplete) {
      const questionOrder = getQuestionOrder();
      await saveProgressMutation.mutateAsync({
        currentIndex,
        answers,
        questionOrder,
      });
      toast.success(
        language === "en" ? "Progress saved" : language === "zh-TW" ? "進度已儲存" : "进度已保存"
      );
    }
    navigate("/");
  }, [user, answers, isComplete, currentIndex, getQuestionOrder, saveProgressMutation, language, navigate]);

  // Listen for save-and-exit event from MainLayout header button
  useEffect(() => {
    const handler = () => { handleSaveAndExit(); };
    window.addEventListener("save-and-exit", handler);
    return () => window.removeEventListener("save-and-exit", handler);
  }, [handleSaveAndExit]);

  const handleOptionClick = (value: number) => {
    setSelectedOption(value);
    setTimeout(() => {
      submitAnswer(value);
      setSelectedOption(null);
    }, 200);
  };

  const getCareerStageLabel = (stage: string) => {
    const stages: Record<string, string> = {
      entry: t("careerStage.entry"),
      mid: t("careerStage.mid"),
      senior: t("careerStage.senior"),
      hr: t("careerStage.hr"),
    };
    return stages[stage] || stage;
  };

  // Get phase config - in full mode, always show a single consistent label
  const FULL_MODE_CONFIG = {
    icon: Target,
    colorHue: "228",
    labelZh: "完整测评",
    labelZhTW: "完整測評",
    labelEn: "Full Assessment",
    descZh: "完成全40道题目",
    descZhTW: "完成全40道題目",
    descEn: "Complete all 40 questions",
  };
  const phaseConfig = FULL_MODE_CONFIG;
  const PhaseIcon = phaseConfig.icon;

  if (isLoadingProgress && user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "hsl(75, 55%, 98%)" }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: "hsl(75, 55%, 90%)" }}
          >
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "hsl(75, 55%, 45%)" }} />
          </div>
          <p className="text-muted-foreground">{t("assessment.checkingProgress")}</p>
        </motion.div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "hsl(75, 55%, 98%)" }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: "hsl(75, 55%, 90%)" }}
          >
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "hsl(75, 55%, 45%)" }} />
          </div>
          <p className="text-muted-foreground">
            {language === "en" ? "Loading questions..." : language === "zh-TW" ? "正在載入題目..." : "正在加载题目..."}
          </p>
        </motion.div>
      </div>
    );
  }

  const typeConfig = questionTypeLabels[currentQuestion.type as keyof typeof questionTypeLabels] || questionTypeLabels.likert;

  return (
    <>
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("assessment.resumeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("assessment.resumeDesc", { count: savedProgress?.answers.length || 0 })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartNew} className="rounded-xl">
              {t("assessment.restartButton")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResume} className="rounded-xl">
              {t("assessment.resumeButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div 
        className="min-h-screen flex"
        style={{ backgroundColor: "hsl(75, 55%, 98%)" }}
      >
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="h-16 px-8 flex items-center justify-between border-b bg-white/80 backdrop-blur-sm" style={{ borderColor: "hsl(75, 55%, 88%)" }}>
            <button
              onClick={handleSaveAndExit}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("assessment.saveExit")}
            </button>

            {/* Progress Info */}
            <div className="flex items-center gap-6">
              {/* Adaptive Phase Indicator */}
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: `hsl(${phaseConfig.colorHue}, 55%, 95%)`,
                  color: `hsl(${phaseConfig.colorHue}, 55%, 40%)`
                }}
              >
                <PhaseIcon className="w-4 h-4" />
                {language === "en" ? phaseConfig.labelEn : language === "zh-TW" ? phaseConfig.labelZhTW : phaseConfig.labelZh}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{t("assessment.progress")}</span>
                <div className="w-32 h-2 bg-white rounded-full overflow-hidden border" style={{ borderColor: "hsl(75, 55%, 80%)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: `hsl(${phaseConfig.colorHue}, 55%, 50%)` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-sm font-medium" style={{ color: "hsl(75, 55%, 40%)" }}>
                  {currentIndex + 1}/{totalQuestions}
                </span>
              </div>

              {/* Sync Status */}
              {isLoggedIn && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {saveProgressMutation.isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t("assessment.syncing")}
                    </>
                  ) : saveProgressMutation.isError ? (
                    <>
                      <CloudOff className="h-3 w-3 text-destructive" />
                      {t("assessment.syncFailed")}
                    </>
                  ) : answers.length > 0 ? (
                    <>
                      <Cloud className="h-3 w-3" style={{ color: "hsl(75, 55%, 50%)" }} />
                      {t("assessment.synced")}
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </header>

          {/* Question Area */}
          <div className="flex-1 flex items-center justify-center px-8 py-12">
            <div className="w-full max-w-2xl">
              {/* Question Header */}
              <motion.div 
                key={`header-${currentIndex}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center justify-between"
              >
                <div 
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: "hsl(228, 51%, 23%)", color: "white" }}
                >
                  {t("assessment.question")} {currentIndex + 1} {t("assessment.of")} {totalQuestions}
                </div>
                <div className="flex items-center gap-2" />
              </motion.div>

              {/* Question Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg border p-8 md:p-10 relative overflow-hidden"
                  style={{ borderColor: "hsl(75, 55%, 85%)" }}
                >
                  {/* Decorative accent */}
                  <div 
                    className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
                    style={{ backgroundColor: typeConfig.color }}
                  />

                  {/* Question Text */}
                  <h2 
                    className="text-xl md:text-2xl font-semibold leading-relaxed mb-10"
                    style={{ color: "hsl(228, 51%, 20%)" }}
                  >
                    {currentQuestion.text}
                  </h2>

                  {/* Options - 4-point Likert scale */}
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedOption === option.value;
                      return (
                        <motion.button
                          key={index}
                          onClick={() => handleOptionClick(option.value)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={cn(
                            "w-full text-left p-5 rounded-xl border-2 transition-all duration-150",
                            "focus:outline-none"
                          )}
                          style={{
                            borderColor: isSelected ? "hsl(75, 55%, 50%)" : "hsl(75, 55%, 85%)",
                            backgroundColor: isSelected ? "hsl(75, 55%, 95%)" : "white",
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div 
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm transition-colors"
                              )}
                              style={{
                                backgroundColor: isSelected ? "hsl(75, 55%, 50%)" : "hsl(75, 55%, 92%)",
                                color: isSelected ? "white" : "hsl(75, 55%, 40%)",
                              }}
                            >
                              {index + 1}
                            </div>
                            <span 
                              className="font-medium text-base"
                              style={{ color: "hsl(228, 51%, 25%)" }}
                            >
                              {option.label}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={goBack}
                  disabled={currentIndex === 0}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    currentIndex === 0 
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-muted-foreground hover:text-foreground hover:bg-white"
                  )}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {language === "en" ? "Previous" : language === "zh-TW" ? "上一題" : "上一题"}
                </button>

                <div className="w-1" /> {/* Spacer */}

                <div className="w-24" /> {/* Spacer for alignment */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
