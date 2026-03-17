import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Loader2, Cloud, CloudOff, Target, Compass, ShieldCheck } from "lucide-react";
import { useAssessment, DIMENSIONS, type Answer, type AdaptivePhase } from "@/hooks/useAssessment";
import { 
  useAssessmentProgress, 
  useSaveAssessmentProgress, 
  useClearAssessmentProgress 
} from "@/hooks/useAssessmentProgress";
import { useSaveAssessmentResult } from "@/hooks/useAssessmentResults";
import { useCompleteAssignment } from "@/hooks/useMyAssignments";
import { useAuth } from "@/hooks/useAuth";
import { useTestAuth } from "@/hooks/useTestAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
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

// Phase configuration (SCPC v2 adaptive phases)
const PHASE_CONFIG = {
  coverage: { icon: Target, colorHue: "75", labelZh: "锚点覆盖", labelZhTW: "錨點覆蓋", labelEn: "Coverage" },
  separation: { icon: Compass, colorHue: "228", labelZh: "建立分差", labelZhTW: "建立分差", labelEn: "Separate" },
  focus: { icon: Target, colorHue: "35", labelZh: "聚焦比较", labelZhTW: "聚焦比較", labelEn: "Focus" },
  review: { icon: ShieldCheck, colorHue: "0", labelZh: "复核确认", labelZhTW: "複核確認", labelEn: "Review" },
  complete: { icon: Target, colorHue: "75", labelZh: "完成", labelZhTW: "完成", labelEn: "Done" },
};

export default function MobileAssessmentPage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { isTestLoggedIn } = useTestAuth();
  const saveResultMutation = useSaveAssessmentResult();
  const completeAssignmentMutation = useCompleteAssignment();
  const saveProgressMutation = useSaveAssessmentProgress();
  const clearProgressMutation = useClearAssessmentProgress();
  const { data: savedProgress, isLoading: isLoadingProgress } = useAssessmentProgress();
  
  const startTimeRef = useRef<number>(Date.now());
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const hasCheckedProgressRef = useRef(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const lastSavedRef = useRef<string>("");
  // Stable refs — updated every render, read inside effects to avoid stale closures
  const userRef = useRef(user);
  userRef.current = user;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const languageRef = useRef(language);
  languageRef.current = language;
  const saveProgressRef = useRef(saveProgressMutation);
  saveProgressRef.current = saveProgressMutation;
  const clearProgressRef = useRef(clearProgressMutation);
  clearProgressRef.current = clearProgressMutation;
  
  const isLoggedIn = !!user || isTestLoggedIn;

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    progress,
    phase,
    isComplete,
    answers,
    submitAnswer,
    goBack,
    calculateResults,
    getDimensionName,
    getQuestionOrder,
    restoreProgress,
    assessmentMode,
  } = useAssessment();

  // Ref guarantees the completion effect always reads the latest answers
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Question type labels
  const questionTypeLabels = {
    likert: { label: t("assessment.questionTypes.likert"), color: "hsl(75, 55%, 45%)" },
    choice: { label: t("assessment.questionTypes.choice"), color: "hsl(35, 90%, 45%)" },
    scenario: { label: t("assessment.questionTypes.scenario"), color: "hsl(228, 51%, 45%)" },
  };

  // Phase config - in full mode, always show a single label
  const FULL_MODE_CONFIG = {
    icon: Target,
    colorHue: "228",
    labelZh: "完整测评",
    labelZhTW: "完整測評",
    labelEn: "Full Assessment",
  };
  const phaseConfig = FULL_MODE_CONFIG;
  const PhaseIcon = phaseConfig.icon;

  // Check for saved progress
  useEffect(() => {
    if (hasCheckedProgressRef.current || answers.length > 0) return;
    if (isLoadingProgress) return;
    
    if (user && savedProgress) {
      hasCheckedProgressRef.current = true;
      if (savedProgress.answers.length >= 3) {
        setShowResumeDialog(true);
        setShowIntro(false);
      } else if (savedProgress.answers.length > 0) {
        clearProgressRef.current.mutate();
      }
    } else {
      // No progress found or not logged in — mark as checked
      hasCheckedProgressRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingProgress, savedProgress, user, answers.length]);

  const handleResume = useCallback(() => {
    if (savedProgress) {
      if (savedProgress.answers.length >= totalQuestions) {
        clearProgressRef.current.mutateAsync().catch(() => {});
        navigateRef.current("/results");
        setShowResumeDialog(false);
        return;
      }
      restoreProgress(
        savedProgress.answers,
        savedProgress.current_index,
        savedProgress.question_order
      );
    }
    setShowResumeDialog(false);
    setShowIntro(false);
  }, [savedProgress, restoreProgress, totalQuestions]);

  const handleStartNew = useCallback(async () => {
    await clearProgressRef.current.mutateAsync();
    setShowResumeDialog(false);
    setShowIntro(false);
  }, []);

  // Auto-save progress
  useEffect(() => {
    if (!userRef.current || answers.length === 0 || isComplete) return;

    const progressKey = `${currentIndex}-${answers.length}`;
    if (progressKey === lastSavedRef.current) return;

    const saveTimer = setTimeout(() => {
      const questionOrder = getQuestionOrder();
      saveProgressRef.current.mutate({
        currentIndex,
        answers,
        questionOrder,
      });
      lastSavedRef.current = progressKey;
    }, 2000);

    return () => clearTimeout(saveTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, answers, isComplete]);

  // Handle completion — only fires once when isComplete flips to true
  useEffect(() => {
    if (!isComplete || isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);

    const runCompletion = async () => {
      const latestAnswers = answersRef.current;
      const results = calculateResults();
      const completionTimeSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      const currentUser = userRef.current;
      const currentLanguage = languageRef.current;

      sessionStorage.setItem("assessmentResults", JSON.stringify(results));

      if (currentUser) {
        try {
          const savedResult = await saveResultMutation.mutateAsync({
            result: results,
            questionCount: totalQuestions,
            completionTimeSeconds,
            answers: latestAnswers,
          });
          sessionStorage.setItem("currentResultId", savedResult.id);
          
          try {
            await completeAssignmentMutation.mutateAsync(savedResult.id);
          } catch (assignmentError) {
            console.warn("Assignment status update skipped:", assignmentError);
          }
          
          await clearProgressRef.current.mutateAsync();
          // Clear pending CP transaction — assessment completed successfully
          sessionStorage.removeItem("pending_cp_transaction_id");
          toast.success(currentLanguage === "en" ? "Results saved" : currentLanguage === "zh-TW" ? "測評結果已儲存" : "测评结果已保存");
        } catch (error) {
          console.error("Failed to save:", error);
          toast.error(currentLanguage === "en" ? "Failed to save" : currentLanguage === "zh-TW" ? "儲存失敗" : "保存失败");
        }
      }

      const isCombinedAssessment = sessionStorage.getItem('scpc_combined_assessment') === 'true';
      navigateRef.current(isCombinedAssessment ? "/ideal-card-test" : "/results");
    };

    runCompletion();
    // Only trigger when isComplete flips to true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const handleOptionClick = (value: number) => {
    setSelectedOption(value);
    setTimeout(() => {
      submitAnswer(value);
      setSelectedOption(null);
    }, 200);
  };

  const handleSaveAndExit = useCallback(async () => {
    if (userRef.current && answers.length > 0 && !isComplete) {
      const questionOrder = getQuestionOrder();
      await saveProgressRef.current.mutateAsync({
        currentIndex,
        answers,
        questionOrder,
      });
      const currentLang = languageRef.current;
      toast.success(
        currentLang === "en" ? "Progress saved" : currentLang === "zh-TW" ? "進度已儲存" : "进度已保存"
      );
    }
    navigateRef.current("/");
  }, [answers, isComplete, currentIndex, getQuestionOrder]);

  // Listen for save-and-exit event from MainLayout header button
  useEffect(() => {
    const handler = () => { handleSaveAndExit(); };
    window.addEventListener("save-and-exit", handler);
    return () => window.removeEventListener("save-and-exit", handler);
  }, [handleSaveAndExit]);

  const handleBack = () => {
    if (showIntro) {
      navigate("/");
    } else if (currentIndex === 0) {
      setShowIntro(true);
    } else {
      goBack();
    }
  };

  // Intro screen
  if (showIntro && !showResumeDialog) {
    return (
      <div className="min-h-screen bg-background flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <header className="flex items-center px-4 h-14 border-b border-border bg-background">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 text-muted-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="ml-2 font-medium text-foreground">{t("assessment.title")}</span>
        </header>

        <div className="flex-1 px-5 py-8 flex flex-col">
          <div className="flex-1">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{ backgroundColor: "hsl(75, 55%, 60%)" }}
            >
              <Target className="w-8 h-8" style={{ color: "hsl(228, 51%, 15%)" }} />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-4">{t("assessment.title")}</h1>
            
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">{t("assessment.intro")}</p>
              <p className="leading-relaxed">{t("assessment.instruction")}</p>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  <Target className="w-4 h-4" />
                </div>
                <span className="text-foreground">
                  {language === "en" ? "40 comprehensive questions" : language === "zh-TW" ? "40道完整測評題目" : "40道完整测评题目"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="text-foreground">{t("assessment.estimatedTime")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  <Cloud className="w-4 h-4" />
                </div>
                <span className="text-foreground">{t("assessment.autoSave")}</span>
              </div>
            </div>
          </div>

          <div style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1rem)" }}>
            <button
              onClick={() => setShowIntro(false)}
              className="w-full py-4 font-semibold rounded-xl text-base transition-all active:scale-[0.98]"
              style={{ backgroundColor: "hsl(228, 51%, 23%)", color: "white" }}
            >
              {t("assessment.startButton")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show completion/saving screen to prevent further interaction
  if (isComplete || isSaving) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-3"
        >
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "hsl(75, 55%, 50%)" }} />
          <p className="text-base font-medium" style={{ color: "hsl(228, 51%, 25%)" }}>
            {language === "en" ? "Assessment Complete!" : language === "zh-TW" ? "測評完成！" : "测评完成！"}
          </p>
          <p className="text-sm text-muted-foreground">
            {language === "en" ? "Saving your results..." : language === "zh-TW" ? "正在儲存您的結果..." : "正在保存您的结果..."}
          </p>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (isLoadingProgress || !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: "hsl(75, 55%, 50%)" }} />
          <p className="text-sm text-muted-foreground">{t("assessment.checkingProgress")}</p>
        </div>
      </div>
    );
  }

  const typeConfig = questionTypeLabels[currentQuestion.type as keyof typeof questionTypeLabels] || questionTypeLabels.likert;

  return (
    <>
      {/* Resume Dialog */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent className="rounded-2xl mx-4">
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

      <div className="min-h-screen bg-background flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-border bg-background">
          <button onClick={handleBack} className="p-2 -ml-2 text-muted-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            {/* Phase indicator */}
            <div 
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: `hsl(${phaseConfig.colorHue}, 55%, 95%)`,
                color: `hsl(${phaseConfig.colorHue}, 55%, 40%)`
              }}
            >
              <PhaseIcon className="w-3 h-3" />
              {language === "en" ? phaseConfig.labelEn : language === "zh-TW" ? phaseConfig.labelZhTW : phaseConfig.labelZh}
            </div>
            
            {/* Sync status */}
            {isLoggedIn && (
              <div className="text-muted-foreground">
                {saveProgressMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveProgressMutation.isError ? (
                  <CloudOff className="w-4 h-4 text-destructive" />
                ) : answers.length > 0 ? (
                  <Cloud className="w-4 h-4" style={{ color: "hsl(75, 55%, 50%)" }} />
                ) : null}
              </div>
            )}
          </div>
        </header>

        {/* Progress Bar */}
        <div className="px-4 py-3 bg-background">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{t("assessment.question")} {currentIndex + 1}/{totalQuestions}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: `hsl(${phaseConfig.colorHue}, 55%, 50%)` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 px-4 py-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >


              {/* Question Text */}
              <h2 className="text-lg font-semibold text-foreground leading-relaxed mb-6">
                {currentQuestion.text}
              </h2>

              {/* Options */}
              <div className="space-y-3 pb-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedOption === option.value;
                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleOptionClick(option.value)}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all",
                        "focus:outline-none touch-manipulation"
                      )}
                      style={{
                        borderColor: isSelected ? "hsl(75, 55%, 50%)" : "hsl(75, 55%, 85%)",
                        backgroundColor: isSelected ? "hsl(75, 55%, 95%)" : "hsl(75, 55%, 99%)",
                        WebkitTapHighlightColor: "transparent",
                        minHeight: "56px",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                          style={{
                            backgroundColor: isSelected ? "hsl(75, 55%, 50%)" : "hsl(75, 55%, 92%)",
                            color: isSelected ? "white" : "hsl(75, 55%, 40%)",
                          }}
                        >
                          {index + 1}
                        </div>
                        <span className="font-medium text-sm text-foreground">
                          {option.label}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer spacer for safe area */}
        <div 
          className="border-t border-border bg-background/80"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.5rem)" }}
        />
      </div>
    </>
  );
}
