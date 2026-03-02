import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  AlertTriangle, 
  Target, 
  Zap,
  Shield,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Users,
  TrendingUp,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";

export default function HRInterpretationPage() {
  const { language } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  // Multilingual content
  const content = {
    "zh-CN": {
      // Header
      pageLabel: "HR 专业解读",
      title: "SCPC 职业锚评测：组织发展视角",
      subtitle: "用于长期路径匹配与风险预判，而非能力评估或筛选",
      
      // Position Statement (Section 1)
      positionTitle: "工具定位声明",
      positionMain: "SCPC 职业锚评测不是能力、绩效或潜力评估工具。它用于识别：在长期职业发展中，哪些结构性条件如果被反复忽视，将显著增加内耗、抗拒或流失风险。",
      positionPoints: [
        { wrong: "分数 = 优劣", right: "分数 = 约束强度" },
        { wrong: "分数 = 胜任力", right: "分数 = 长期敏感度" },
        { wrong: "高分 = 优势", right: "高分 = 高敏感区" },
      ],
      
      // Score Interpretation (Section 2)
      scoreTitle: "如何理解 0–100 分",
      scoreIntro: "这是『长期不可妥协程度』的刻度。分数越高，代表该维度越难被长期牺牲。高分不是优势，而是高敏感区。",
      scoreLevels: [
        {
          range: "80–100",
          label: "非常强的结构性约束",
          desc: "长期违反将高概率导致：disengagement / resistance / exit",
          color: "destructive",
        },
        {
          range: "65–79",
          label: "高敏感约束",
          desc: "短期可通过补偿或阶段性安排缓冲，但不适合长期忽视",
          color: "warning",
        },
        {
          range: "45–64",
          label: "条件性约束",
          desc: "可通过岗位设计、管理方式或节奏调整满足",
          color: "blue",
        },
        {
          range: "<45",
          label: "非核心维度",
          desc: "不应作为激励或路径设计重点",
          color: "muted",
        },
      ],
      
      // High-Sensitivity Anchor (Section 3)
      primaryTitle: "高敏感锚的 HR 用法",
      primaryDefinition: "高敏感锚不是岗位偏好，而是长期留任与有效投入的底线条件。",
      primaryQuestions: [
        "该岗位 / 路径的长期结构，是否会持续违反此锚？",
        "若当前暂时不匹配，是否存在明确的过渡、补偿或调整节点？",
        "如果不调整，风险更可能体现为：能力不足？态度问题？还是结构性不匹配？",
      ],
      primaryEmphasis: "高敏感锚必须被视为『路径设计的前提条件』，而非发展选项。",
      
      // Conflict Anchors (Section 5)
      conflictTitle: "冲突锚的组织解读",
      conflictDefinition: "冲突锚不代表摇摆或不成熟，而代表在长期路径上存在内在张力。",
      conflictNature: [
        "冲突锚 = 风险信号，而非问题本身",
        "风险通常在 2–5 年内累积显现",
      ],
      conflictSymptoms: [
        "职业反复横跳",
        "对任何路径都不完全满意",
        "阶段性高投入后快速消耗",
      ],
      conflictApproach: "HR 的正确做法不是『解决冲突』，而是：识别、预期、设计缓冲机制",
      conflictExamples: [
        "双通道设计",
        "阶段性角色",
        "明确再评估节点",
      ],
      
      // Correct Usage (Section 6)
      usageTitle: "SCPC 在 HR 场景中的正确用途",
      recommendedLabel: "推荐使用",
      recommendedUses: [
        "干部 / 高潜人才盘点",
        "晋升前路径适配性讨论",
        "专家 vs 管理双通道设计",
        "继任计划的稳定性评估",
        "长期留任与发展风险识别",
      ],
      prohibitedLabel: "禁止用途",
      prohibitedUses: [
        "招聘一票否决",
        "绩效评价",
        "人员排序或打分",
        "『不适合我们公司』的标签化判断",
      ],
      
      // Decision Aid Questions (Section 7)
      questionsTitle: "HR 决策辅助问题",
      questionsIntro: "在做路径决策时，可使用以下问题：",
      decisionQuestions: [
        "这个岗位未来 3–5 年的结构，是否会持续踩到该员工的高分锚？",
        "如果沿当前路径继续发展，更可能带来稳定投入，还是累积内耗？",
        "当员工表现下滑或抗拒时，我们是否过早将其归因为能力或态度问题？",
      ],
      
      // Closing (Section 8)
      closingQuote: "SCPC 职业锚评测不是用来预测谁会成功，而是帮助组织减少因路径错配而导致的隐性失败。",
      closingNote: "它服务于可持续发展，而非短期最优配置。",
      
      // Navigation
      backToResults: "返回结果",
      downloadGuide: "下载 HR 使用指南",
    },
    "zh-TW": {
      pageLabel: "HR 專業解讀",
      title: "SCPC 職業錨評測：組織發展視角",
      subtitle: "用於長期路徑對應與風險預判，而非能力評估或篩選",
      
      positionTitle: "工具定位聲明",
      positionMain: "SCPC 職業錨評測不是能力、績效或潛力評估工具。它用於識別：在長期職業發展中，哪些結構性條件如果被反覆忽視，將顯著增加內耗、抗拒或流失風險。",
      positionPoints: [
        { wrong: "分數 = 優劣", right: "分數 = 約束強度" },
        { wrong: "分數 = 勝任力", right: "分數 = 長期敏感度" },
        { wrong: "高分 = 優勢", right: "高分 = 高敏感區" },
      ],
      
      scoreTitle: "如何理解 0–100 分",
      scoreIntro: "這是『長期不可妥協程度』的刻度。分數越高，代表該維度越難被長期犧牲。高分不是優勢，而是高敏感區。",
      scoreLevels: [
        {
          range: "80–100",
          label: "非常強的結構性約束",
          desc: "長期違反將高機率導致：脫離 / 抗拒 / 離職",
          color: "destructive",
        },
        {
          range: "65–79",
          label: "高敏感約束",
          desc: "短期可通過補償或階段性安排緩衝，但不適合長期忽視",
          color: "warning",
        },
        {
          range: "45–64",
          label: "條件性約束",
          desc: "可通過職位設計、管理方式或節奏調整滿足",
          color: "blue",
        },
        {
          range: "<45",
          label: "非核心維度",
          desc: "不應作為激勵或路徑設計重點",
          color: "muted",
        },
      ],
      
      primaryTitle: "高敏感錨的 HR 用法",
      primaryDefinition: "高敏感錨不是職位偏好，而是長期留任與有效投入的底線條件。",
      primaryQuestions: [
        "該職位 / 路徑的長期結構，是否會持續違反此錨？",
        "若當前暫時不對應，是否存在明確的過渡、補償或調整節點？",
        "如果不調整，風險更可能體現為：能力不足？態度問題？還是結構性不對應？",
      ],
      primaryEmphasis: "高敏感錨必須被視為『路徑設計的前提條件』，而非發展選項。",
      
      conflictTitle: "衝突錨的組織解讀",
      conflictDefinition: "衝突錨不代表搖擺或不成熟，而代表在長期路徑上存在內在張力。",
      conflictNature: [
        "衝突錨 = 風險信號，而非問題本身",
        "風險通常在 2–5 年內累積顯現",
      ],
      conflictSymptoms: [
        "職業反覆橫跳",
        "對任何路徑都不完全滿意",
        "階段性高投入後快速消耗",
      ],
      conflictApproach: "HR 的正確做法不是『解決衝突』，而是：識別、預期、設計緩衝機制",
      conflictExamples: [
        "雙通道設計",
        "階段性角色",
        "明確再評估節點",
      ],
      
      usageTitle: "SCPC 在 HR 場景中的正確用途",
      recommendedLabel: "推薦使用",
      recommendedUses: [
        "幹部 / 高潛人才盤點",
        "晉升前路徑適配性討論",
        "專家 vs 管理雙通道設計",
        "繼任計劃的穩定性評估",
        "長期留任與發展風險識別",
      ],
      prohibitedLabel: "禁止用途",
      prohibitedUses: [
        "招聘一票否決",
        "績效評價",
        "人員排序或打分",
        "『不適合我們公司』的標籤化判斷",
      ],
      
      questionsTitle: "HR 決策輔助問題",
      questionsIntro: "在做路徑決策時，可使用以下問題：",
      decisionQuestions: [
        "這個職位未來 3–5 年的結構，是否會持續踩到該員工的高分錨？",
        "如果沿當前路徑繼續發展，更可能帶來穩定投入，還是累積內耗？",
        "當員工表現下滑或抗拒時，我們是否過早將其歸因為能力或態度問題？",
      ],
      
      closingQuote: "SCPC 職業錨評測不是用來預測誰會成功，而是幫助組織減少因路徑錯配而導致的隱性失敗。",
      closingNote: "它服務於永續性發展，而非短期最優配置。",
      
      backToResults: "返回結果",
      downloadGuide: "下載 HR 使用指南",
    },
    "en": {
      pageLabel: "HR Professional Guide",
      title: "SCPC Career Anchors: Organizational Development Perspective",
      subtitle: "For long-term path alignment and risk prediction, not ability assessment or screening",
      
      positionTitle: "Tool Positioning Statement",
      positionMain: "SCPC Career Anchor Assessment is not a tool for evaluating ability, performance, or potential. It identifies: which structural conditions, if repeatedly ignored in long-term career development, will significantly increase the risk of burnout, resistance, or attrition.",
      positionPoints: [
        { wrong: "Score = Quality", right: "Score = Constraint Intensity" },
        { wrong: "Score = Competency", right: "Score = Long-term Sensitivity" },
        { wrong: "High Score = Advantage", right: "High Score = High Sensitivity Zone" },
      ],
      
      scoreTitle: "How to Interpret 0–100 Scores",
      scoreIntro: "This is a scale of 'long-term non-negotiability.' Higher scores mean this dimension is harder to sacrifice long-term. High scores are not advantages—they are high-sensitivity zones.",
      scoreLevels: [
        {
          range: "80–100",
          label: "Very Strong Structural Constraint",
          desc: "Long-term violation will likely lead to: disengagement / resistance / exit",
          color: "destructive",
        },
        {
          range: "65–79",
          label: "High-Sensitivity Constraint",
          desc: "Can be buffered short-term through compensation or phased arrangements, but not suitable for long-term neglect",
          color: "warning",
        },
        {
          range: "45–64",
          label: "Conditional Constraint",
          desc: "Can be satisfied through job design, management approach, or pace adjustment",
          color: "blue",
        },
        {
          range: "<45",
          label: "Non-Core Dimension",
          desc: "Should not be the focus of incentive or path design",
          color: "muted",
        },
      ],
      
      primaryTitle: "HR Application of High-Sensitivity Anchor",
      primaryDefinition: "The high-sensitivity anchor is not a job preference—it's the baseline condition for long-term retention and effective engagement.",
      primaryQuestions: [
        "Will the long-term structure of this position/path continuously violate this anchor?",
        "If there's a current mismatch, are there clear transition, compensation, or adjustment points?",
        "If not adjusted, is the risk more likely to manifest as: skill gap? attitude problem? or structural mismatch?",
      ],
      primaryEmphasis: "The high-sensitivity anchor must be treated as a 'prerequisite for path design,' not a development option.",
      
      conflictTitle: "Organizational Interpretation of Conflict Anchors",
      conflictDefinition: "Conflict anchors do not indicate indecision or immaturity—they represent inherent tension in the long-term path.",
      conflictNature: [
        "Conflict anchor = Risk signal, not the problem itself",
        "Risk typically accumulates and manifests within 2–5 years",
      ],
      conflictSymptoms: [
        "Frequent career pivots",
        "Never fully satisfied with any path",
        "Rapid burnout after periods of high engagement",
      ],
      conflictApproach: "The correct HR approach is not to 'resolve conflict,' but to: identify, anticipate, and design buffer mechanisms",
      conflictExamples: [
        "Dual-track design",
        "Phased roles",
        "Clear re-evaluation points",
      ],
      
      usageTitle: "Correct Use of SCPC in HR Scenarios",
      recommendedLabel: "Recommended Uses",
      recommendedUses: [
        "Executive / High-potential talent review",
        "Pre-promotion path fit discussions",
        "Expert vs. Management dual-track design",
        "Succession planning stability assessment",
        "Long-term retention and development risk identification",
      ],
      prohibitedLabel: "Prohibited Uses",
      prohibitedUses: [
        "Hiring veto",
        "Performance evaluation",
        "Personnel ranking or scoring",
        "'Not a fit for our company' labeling decisions",
      ],
      
      questionsTitle: "HR Decision-Aid Questions",
      questionsIntro: "When making path decisions, use these questions:",
      decisionQuestions: [
        "Will this position's structure over the next 3–5 years continuously step on this employee's high-score anchor?",
        "If continuing on the current path, is stable engagement or accumulated burnout more likely?",
        "When employee performance declines or resistance appears, are we too quick to attribute it to ability or attitude issues?",
      ],
      
      closingQuote: "SCPC Career Anchor Assessment is not for predicting who will succeed—it helps organizations reduce hidden failures caused by path mismatches.",
      closingNote: "It serves sustainable development, not short-term optimal allocation.",
      
      backToResults: "Back to Results",
      downloadGuide: "Download HR Guide",
    },
  };

  const txt = content[language];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const motionProps = prefersReducedMotion
    ? {}
    : { initial: "hidden", animate: "visible" };

  // Score level colors
  const getLevelStyles = (color: string) => {
    switch (color) {
      case "destructive":
        return "bg-destructive/10 border-destructive/30 text-destructive";
      case "warning":
        return "bg-warning/10 border-warning/30 text-warning";
      case "blue":
        return "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400";
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Back Navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/results"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {txt.backToResults}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{txt.pageLabel}</span>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <motion.section
        className="pt-12 pb-10 px-6 border-b border-border bg-muted/30"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="data-label text-primary mb-3">{txt.pageLabel}</div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground mb-3 leading-tight">
            {txt.title}
          </h1>
          <p className="text-muted-foreground">
            {txt.subtitle}
          </p>
        </div>
      </motion.section>

      {/* Main Content */}
      <motion.div
        className="max-w-4xl mx-auto px-6 py-10 space-y-12"
        variants={prefersReducedMotion ? undefined : containerVariants}
        {...motionProps}
      >
        {/* Section 1: Position Statement */}
        <motion.section
          className="p-6 bg-destructive/5 border border-destructive/20 rounded-lg"
          variants={prefersReducedMotion ? undefined : itemVariants}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{txt.positionTitle}</h2>
          </div>
          
          <p className="text-foreground leading-relaxed mb-6">
            {txt.positionMain}
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            {txt.positionPoints.map((point, i) => (
              <div key={i} className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-2 text-sm text-destructive mb-2">
                  <XCircle className="w-4 h-4" />
                  <span className="line-through">{point.wrong}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>{point.right}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Section 2: Score Interpretation */}
        <motion.section variants={prefersReducedMotion ? undefined : itemVariants}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{txt.scoreTitle}</h2>
          </div>
          
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {txt.scoreIntro}
          </p>
          
          <div className="space-y-3">
            {txt.scoreLevels.map((level, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border ${getLevelStyles(level.color)}`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="font-mono text-lg font-bold w-20">{level.range}</div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">{level.label}</div>
                    <div className="text-sm opacity-80">{level.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Section 3: High-Sensitivity Anchor */}
        <motion.section variants={prefersReducedMotion ? undefined : itemVariants}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{txt.primaryTitle}</h2>
          </div>
          
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-6">
            <p className="text-foreground font-medium">
              {txt.primaryDefinition}
            </p>
          </div>
          
          <div className="space-y-3 mb-6">
            {txt.primaryQuestions.map((question, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">{i + 1}</span>
                </div>
                <p className="text-foreground leading-relaxed">{question}</p>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-muted border border-border rounded-lg">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Shield className="w-5 h-5 text-primary" />
              <span>{txt.primaryEmphasis}</span>
            </div>
          </div>
        </motion.section>

        {/* Section 5: Conflict Anchors */}
        <motion.section variants={prefersReducedMotion ? undefined : itemVariants}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{txt.conflictTitle}</h2>
          </div>
          
          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg mb-6">
            <p className="text-foreground font-medium">
              {txt.conflictDefinition}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                {language === "en" ? "Nature" : language === "zh-TW" ? "本質" : "本质"}
              </div>
              <ul className="space-y-2">
                {txt.conflictNature.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                {language === "en" ? "Common Symptoms" : language === "zh-TW" ? "常見表現" : "常见表现"}
              </div>
              <ul className="space-y-2">
                {txt.conflictSymptoms.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-muted border border-border rounded-lg mb-4">
            <p className="text-foreground font-medium mb-3">
              {txt.conflictApproach}
            </p>
            <div className="flex flex-wrap gap-2">
              {txt.conflictExamples.map((example, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-background border border-border rounded-full text-sm text-muted-foreground"
                >
                  {example}
                </span>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Section 6: Correct Usage */}
        <motion.section variants={prefersReducedMotion ? undefined : itemVariants}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{txt.usageTitle}</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recommended */}
            <div className="p-5 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">{txt.recommendedLabel}</span>
              </div>
              <ul className="space-y-2">
                {txt.recommendedUses.map((use, i) => (
                  <li key={i} className="flex items-start gap-2 text-foreground text-sm">
                    <span className="text-primary mt-0.5">✓</span>
                    {use}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Prohibited */}
            <div className="p-5 bg-destructive/5 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-destructive" />
                <span className="font-semibold text-foreground">{txt.prohibitedLabel}</span>
              </div>
              <ul className="space-y-2">
                {txt.prohibitedUses.map((use, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <span className="text-destructive mt-0.5">✗</span>
                    {use}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Section 7: Decision Aid Questions */}
        <motion.section variants={prefersReducedMotion ? undefined : itemVariants}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{txt.questionsTitle}</h2>
          </div>
          
          <p className="text-muted-foreground mb-6">
            {txt.questionsIntro}
          </p>
          
          <div className="space-y-4">
            {txt.decisionQuestions.map((question, i) => (
              <div
                key={i}
                className="p-5 bg-card border-l-4 border-l-primary border border-border rounded-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-semibold">
                    {i + 1}
                  </div>
                  <p className="text-foreground leading-relaxed font-medium">
                    {question}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Section 8: Closing */}
        <motion.section
          className="pt-8 border-t border-border"
          variants={prefersReducedMotion ? undefined : itemVariants}
        >
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex p-3 rounded-full bg-primary/10 mb-6">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            
            <blockquote className="text-xl font-display text-foreground mb-4 leading-relaxed">
              "{txt.closingQuote}"
            </blockquote>
            
            <p className="text-muted-foreground font-medium">
              {txt.closingNote}
            </p>
          </div>
        </motion.section>

        {/* Navigation */}
        <motion.div
          className="flex justify-center pt-8"
          variants={prefersReducedMotion ? undefined : itemVariants}
        >
          <Link
            to="/results"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {txt.backToResults}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
