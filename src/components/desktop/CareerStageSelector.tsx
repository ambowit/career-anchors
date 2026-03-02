import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, ArrowRight, Crown, Rocket } from "lucide-react";
import { useTestAuth, getWorkExperienceDescription, type LanguageKey } from "@/hooks/useTestAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

interface CareerStageSelectorProps {
  onComplete?: () => void;
}

export default function CareerStageSelector({ onComplete }: CareerStageSelectorProps) {
  const { workYears, isExecutive, isEntrepreneur, setWorkYears, setIsExecutive, setIsEntrepreneur } = useTestAuth();
  const { t, language } = useTranslation();
  const [inputValue, setInputValue] = useState(workYears !== null ? String(workYears) : "");

  const handleYearsChange = (rawValue: string) => {
    // Allow empty input
    if (rawValue === "") {
      setInputValue("");
      setWorkYears(null);
      return;
    }
    // Only allow digits
    const cleaned = rawValue.replace(/\D/g, "");
    if (cleaned === "") return;
    const years = Math.min(parseInt(cleaned, 10), 50);
    setInputValue(String(years));
    setWorkYears(years);
  };

  const handleContinue = () => {
    if (workYears !== null && onComplete) {
      onComplete();
    }
  };

  const description = getWorkExperienceDescription(workYears, isExecutive, isEntrepreneur, language as LanguageKey);

  const yearsLabel = language === "en" ? "Years of Work Experience" : language === "zh-TW" ? "職場工作年資" : "职场工作年资";
  const yearsPlaceholder = language === "en" ? "Enter years" : language === "zh-TW" ? "請輸入年數" : "请输入年数";
  const yearUnit = language === "en" ? "years" : language === "zh-TW" ? "年" : "年";
  const executiveLabel = language === "en" ? "Executive / Senior Management" : language === "zh-TW" ? "高管" : "高管";
  const entrepreneurLabel = language === "en" ? "Entrepreneur" : language === "zh-TW" ? "創業者" : "创业者";
  const previewLabel = language === "en" ? "Your profile:" : language === "zh-TW" ? "報告描述預覽：" : "报告描述预览：";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t("careerStage.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("careerStage.subtitle")}
        </p>
      </div>

      {/* Work Years Input */}
      <div className="mb-5">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
          <Briefcase className="w-4 h-4 text-primary" />
          {yearsLabel}
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={(event) => handleYearsChange(event.target.value)}
            placeholder={yearsPlaceholder}
            className={cn(
              "w-full px-4 py-3.5 rounded-xl border-2 bg-card text-foreground text-lg font-medium",
              "transition-all outline-none",
              "placeholder:text-muted-foreground/50 placeholder:font-normal placeholder:text-base",
              workYears !== null
                ? "border-accent focus:border-accent"
                : "border-border focus:border-primary"
            )}
          />
          {workYears !== null && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {yearUnit}
            </span>
          )}
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2.5 mb-5">
        <label
          className={cn(
            "flex items-center gap-3.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
            isExecutive ? "border-accent bg-accent/10" : "border-border bg-card hover:border-accent/50"
          )}
        >
          <input
            type="checkbox"
            checked={isExecutive}
            onChange={(event) => setIsExecutive(event.target.checked)}
            className="sr-only"
          />
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
              isExecutive ? "bg-amber-500 text-white" : "bg-muted/20 text-muted-foreground"
            )}
          >
            <Crown className="w-4.5 h-4.5" />
          </div>
          <span className={cn("font-medium text-sm", isExecutive ? "text-foreground" : "text-foreground")}>
            {executiveLabel}
          </span>
          <div className={cn(
            "ml-auto w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
            isExecutive ? "border-accent bg-accent" : "border-muted-foreground/30"
          )}>
            {isExecutive && (
              <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </label>

        <label
          className={cn(
            "flex items-center gap-3.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
            isEntrepreneur ? "border-accent bg-accent/10" : "border-border bg-card hover:border-accent/50"
          )}
        >
          <input
            type="checkbox"
            checked={isEntrepreneur}
            onChange={(event) => setIsEntrepreneur(event.target.checked)}
            className="sr-only"
          />
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
              isEntrepreneur ? "bg-emerald-500 text-white" : "bg-muted/20 text-muted-foreground"
            )}
          >
            <Rocket className="w-4.5 h-4.5" />
          </div>
          <span className={cn("font-medium text-sm", isEntrepreneur ? "text-foreground" : "text-foreground")}>
            {entrepreneurLabel}
          </span>
          <div className={cn(
            "ml-auto w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
            isEntrepreneur ? "border-accent bg-accent" : "border-muted-foreground/30"
          )}>
            {isEntrepreneur && (
              <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </label>
      </div>

      {/* Preview */}
      {description && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-5 p-4 rounded-xl bg-primary/5 border border-primary/20"
        >
          <p className="text-xs text-muted-foreground mb-1">{previewLabel}</p>
          <p className="text-sm font-medium text-foreground">{description}</p>
        </motion.div>
      )}

      <button
        onClick={handleContinue}
        disabled={workYears === null}
        className={cn(
          "w-full mt-2 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all",
          workYears !== null
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {t("home.startAssessment")}
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
