import { useState } from "react";
import { cn } from "@/lib/utils";
import { type Language } from "@/hooks/useLanguage";
import type { StoredAnswer } from "@/hooks/useAssessmentResults";
import { QUESTIONS_DATA, LIKERT_OPTIONS } from "@/data/questions";
import { DIMENSIONS } from "@/hooks/useAssessment";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

const questionMap = new Map(QUESTIONS_DATA.map(q => [q.id, q]));

const getDimensionName = (code: string, language: Language): string => {
  return DIMENSIONS[code as keyof typeof DIMENSIONS]?.[language] || code;
};

const getLikertLabel = (value: number, language: Language): string => {
  const options = LIKERT_OPTIONS[language];
  return options[value] || String(value);
};

// Color for each Likert value (0-3)
const likertColors = [
  "bg-red-500/15 text-red-700 border-red-200",
  "bg-orange-500/15 text-orange-700 border-orange-200",
  "bg-sky-500/15 text-sky-700 border-sky-200",
  "bg-green-500/15 text-green-700 border-green-200",
];

// Dimension badge colors  
const dimensionColorMap: Record<string, string> = {
  TF: "bg-blue-500/10 text-blue-700",
  GM: "bg-purple-500/10 text-purple-700",
  AU: "bg-teal-500/10 text-teal-700",
  SE: "bg-amber-500/10 text-amber-700",
  EC: "bg-rose-500/10 text-rose-700",
  SV: "bg-emerald-500/10 text-emerald-700",
  CH: "bg-orange-500/10 text-orange-700",
  LS: "bg-cyan-500/10 text-cyan-700",
};

interface AnswerDetailSectionProps {
  answers: StoredAnswer[] | null;
  language: Language;
  isEn: boolean;
  showWeight?: boolean;
}

export default function AnswerDetailSection({ answers, language, isEn, showWeight = false }: AnswerDetailSectionProps) {
  const [groupByDimension, setGroupByDimension] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!answers || answers.length === 0) {
    return (
      <div className="mt-2 p-4 bg-muted/10 rounded-lg text-center">
        <FileText className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          {isEn ? "Answer details not available for this assessment" : "该测评无答题详情（历史数据）"}
        </p>
      </div>
    );
  }

  // Group answers by dimension if needed
  const groupedAnswers = groupByDimension
    ? Object.entries(
        answers.reduce((acc, answer) => {
          const dim = answer.dimension;
          if (!acc[dim]) acc[dim] = [];
          acc[dim].push(answer);
          return acc;
        }, {} as Record<string, StoredAnswer[]>)
      ).sort(([a], [b]) => a.localeCompare(b))
    : null;

  const renderAnswer = (answer: StoredAnswer, index: number) => {
    const question = questionMap.get(answer.questionId);
    const questionText = question?.text[language] || answer.questionId;
    const answerLabel = getLikertLabel(answer.value, language);
    const dimensionColor = dimensionColorMap[answer.dimension] || "bg-muted/10 text-foreground";
    const valueColor = likertColors[answer.value] || "bg-muted/10 text-foreground";

    return (
      <div 
        key={answer.questionId} 
        className="flex items-start gap-4 py-3 px-4 hover:bg-muted/5 rounded-lg transition-colors"
      >
        {/* Index */}
        <div className="w-7 h-7 rounded-full bg-muted/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-medium text-muted-foreground">
            {index + 1}
          </span>
        </div>

        {/* Question & Answer */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">
            {questionText}
          </p>
          <div className="flex items-center gap-3 mt-2">
            {/* Dimension Badge */}
            {!groupByDimension && (
              <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", dimensionColor)}>
                {getDimensionName(answer.dimension, language)}
              </span>
            )}
            {/* Answer Badge */}
            <span className={cn("px-2.5 py-0.5 text-xs font-medium rounded-full border", valueColor)}>
              {answerLabel}
            </span>
            {/* Weight indicator — only visible to super admin */}
            {showWeight && answer.weight > 1.5 && (
              <span className="text-xs text-muted-foreground">
                {isEn ? `weight: ${answer.weight}` : `权重: ${answer.weight}`}
              </span>
            )}
          </div>
        </div>

        {/* Score dot */}
        <div className="flex items-center gap-1 flex-shrink-0 mt-1">
          {[0, 1, 2, 3].map(dotValue => (
            <div
              key={dotValue}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-colors",
                dotValue <= answer.value
                  ? "bg-primary"
                  : "bg-muted/20"
              )}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <h4 className="text-sm font-medium text-foreground">
            {isEn ? "Answer Details" : "答題詳情"}
          </h4>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        
        {!isCollapsed && (
          <div className="flex items-center gap-1 bg-muted/10 rounded-lg p-1">
            <button
              onClick={() => setGroupByDimension(false)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                !groupByDimension 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isEn ? "By Order" : "按顺序"}
            </button>
            <button
              onClick={() => setGroupByDimension(true)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                groupByDimension 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isEn ? "By Dimension" : "按维度"}
            </button>
          </div>
        )}
      </div>

      {/* Answer List */}
      {!isCollapsed && (
        <div className="border border-border rounded-lg overflow-hidden">
          {groupByDimension && groupedAnswers ? (
            groupedAnswers.map(([dimension, dimAnswers]) => (
              <div key={dimension}>
                {/* Dimension Header */}
                <div className={cn(
                  "px-4 py-2.5 flex items-center justify-between",
                  dimensionColorMap[dimension] || "bg-muted/10"
                )}>
                  <span className="text-sm font-semibold">
                    {getDimensionName(dimension, language)}
                  </span>
                  <span className="text-xs opacity-70">
                    {dimAnswers.length} {isEn ? "questions" : "题"}
                  </span>
                </div>
                <div className="divide-y divide-border/50">
                  {dimAnswers.map((answer, index) => renderAnswer(answer, index))}
                </div>
              </div>
            ))
          ) : (
            <div className="divide-y divide-border/50">
              {answers.map((answer, index) => renderAnswer(answer, index))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
