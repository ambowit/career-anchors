import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Target, 
  Layers, 
  AlertTriangle, 
  Clock, 
  Compass,
  ArrowRight,
  Shield,
} from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";

export default function HowToUsePage() {
  const { language } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  // Multilingual content
  const content = {
    "zh-CN": {
      // Header
      pageLabel: "使用指南",
      title: "如何用你的 SCPC 结果，做长期职业决策",
      subtitle: "这不是答案，而是一张『避免走错路』的导航图",
      reminder: "请记住：这份结果不是告诉你该做什么，而是告诉你，哪些东西不能被长期牺牲。",
      
      // Module 1: What is this result
      module1Title: "这份结果是什么",
      module1NotList: ["不是能力评估", "不是性格标签", "不是岗位推荐"],
      module1Is: "在真实职业取舍中，你最难长期放弃的核心需求。",
      module1Left: "短期选择",
      module1Right: "长期体验",
      module1Center: "SCPC 连接的是「长期体验」",
      
      // Module 2: How to read scores
      module2Title: "怎么看你的分数",
      module2Levels: [
        { level: "最外层", desc: "几乎不能妥协" },
        { level: "次外层", desc: "短期能忍，长期要补" },
        { level: "中间层", desc: "重要但可调整" },
        { level: "内层", desc: "不是你做决定的重点" },
      ],
      module2Note: "高分不是优势，低分不是短板。它们只是对你来说的重要程度不同。",
      
      // Module 3: High-Sensitivity Anchor
      module3Title: "如何使用你的「高敏感锚」",
      module3Subtitle: "你的高敏感锚，是一条『底线』",
      module3Points: [
        {
          trigger: "当你做重大选择前（转型 / 升职 / 创业）",
          action: "先问：「这个选择，会不会长期踩到我的高敏感锚？」",
        },
        {
          trigger: "当你持续感到抗拒、疲惫、麻木时",
          action: "不要立刻怀疑自己能力，先检查：「是不是某个底线被反复忽视了？」",
        },
        {
          trigger: "你可以暂时妥协",
          action: "但不能假设：「我可以永远忍下去。」",
        },
      ],
      
      // Module 5: Conflict
      module5Title: "如果你看到了『冲突』",
      module5Subtitle: "看到冲突，不是坏消息",
      module5Intro: "很多人会同时在意两种难以长期共存的需求。这不是犹豫，也不是不成熟，而是一种需要被认真对待的信号。",
      module5Points: [
        "不要假设「两边都能长期兼顾」",
        "重要选择时要特别谨慎",
        "可以通过阶段性设计来缓冲，而不是一次解决",
      ],
      
      // Module 6: When to revisit
      module6Title: "什么时候该重新看这份结果",
      module6Moments: [
        "转行前",
        "接受重要机会前",
        "长期不满意但说不清原因时",
        "职业阶段明显变化后",
      ],
      module6Note: "这不是每天看的东西，而是人生关键路口的参考。",
      
      // Closing
      closingQuote: "你不是不能做别的选择，而是当你走得够远，有些东西不能被反复牺牲。",
      closingNote: "SCPC 结果是长期参考，不是一次性结论。",
      
      // Navigation
      backToResults: "返回结果",
      viewDeepDive: "查看深度解读",
    },
    "zh-TW": {
      pageLabel: "使用指南",
      title: "如何用你的 SCPC 結果，做長期職業決策",
      subtitle: "這不是答案，而是一張「避免走錯路」的導航圖",
      reminder: "請記住：這份結果不是告訴你該做什麼，而是告訴你，哪些東西不能被長期犧牲。",
      
      module1Title: "這份結果是什麼",
      module1NotList: ["不是能力評估", "不是性格標籤", "不是職位推薦"],
      module1Is: "在真實職業取捨中，你最難長期放棄的核心需求。",
      module1Left: "短期選擇",
      module1Right: "長期體驗",
      module1Center: "SCPC 連接的是「長期體驗」",
      
      module2Title: "怎麼看你的分數",
      module2Levels: [
        { level: "最外層", desc: "幾乎不能妥協" },
        { level: "次外層", desc: "短期能忍，長期要補" },
        { level: "中間層", desc: "重要但可調整" },
        { level: "內層", desc: "不是你做決定的重點" },
      ],
      module2Note: "高分不是優勢，低分不是劣勢。它們只是對你來說的重要程度不同。",
      
      module3Title: "如何使用你的「高敏感錨」",
      module3Subtitle: "你的高敏感錨，是一條「底線」",
      module3Points: [
        {
          trigger: "當你做重大選擇前（轉型 / 升職 / 創業）",
          action: "先問：「這個選擇，會不會長期踩到我的高敏感錨？」",
        },
        {
          trigger: "當你持續感到抗拒、疲憊、麻木時",
          action: "不要立刻懷疑自己能力，先檢查：「是不是某個底線被反覆忽視了？」",
        },
        {
          trigger: "你可以暫時妥協",
          action: "但不能假設：「我可以永遠忍下去。」",
        },
      ],
      
      module5Title: "如果你看到了「衝突」",
      module5Subtitle: "看到衝突，不是壞消息",
      module5Intro: "很多人會同時在意兩種難以長期共存的需求。這不是猶豫，也不是不成熟，而是一種需要被認真對待的信號。",
      module5Points: [
        "不要假設「兩邊都能長期兼顧」",
        "重要選擇時要特別謹慎",
        "可以通過階段性設計來緩衝，而不是一次解決",
      ],
      
      module6Title: "什麼時候該重新看這份結果",
      module6Moments: [
        "轉行前",
        "接受重要機會前",
        "長期不滿意但說不清原因時",
        "職業階段明顯變化後",
      ],
      module6Note: "這不是每天看的東西，而是人生關鍵路口的參考。",
      
      closingQuote: "你不是不能做別的選擇，而是當你走得夠遠，有些東西不能被反覆犧牲。",
      closingNote: "SCPC 結果是長期參考，不是一次性結論。",
      
      backToResults: "返回結果",
      viewDeepDive: "查看深度解讀",
    },
    "en": {
      pageLabel: "Usage Guide",
      title: "How to Use Your SCPC Results for Long-term Career Decisions",
      subtitle: "This is not an answer—it's a navigation map to help you avoid the wrong path",
      reminder: "Remember: This result doesn't tell you what to do. It tells you what cannot be repeatedly sacrificed long-term.",
      
      module1Title: "What This Result Is",
      module1NotList: ["Not an ability assessment", "Not a personality label", "Not a job recommendation"],
      module1Is: "The core needs you find hardest to give up in real career trade-offs.",
      module1Left: "Short-term choices",
      module1Right: "Long-term experience",
      module1Center: "SCPC connects to 'long-term experience'",
      
      module2Title: "How to Read Your Scores",
      module2Levels: [
        { level: "Outermost", desc: "Almost impossible to compromise" },
        { level: "Second layer", desc: "Can endure short-term, needs attention long-term" },
        { level: "Middle layer", desc: "Important but adjustable" },
        { level: "Inner layer", desc: "Not your decision priority" },
      ],
      module2Note: "High scores aren't advantages, low scores aren't weaknesses. They simply represent different levels of importance to you.",
      
      module3Title: "How to Use Your High-Sensitivity Anchor",
      module3Subtitle: "Your high-sensitivity anchor is a 'bottom line'",
      module3Points: [
        {
          trigger: "Before major decisions (career change / promotion / starting a business)",
          action: "Ask first: 'Will this choice step on my high-sensitivity anchor long-term?'",
        },
        {
          trigger: "When you feel persistent resistance, fatigue, or numbness",
          action: "Don't immediately doubt your ability. First check: 'Is some bottom line being repeatedly ignored?'",
        },
        {
          trigger: "You can compromise temporarily",
          action: "But don't assume: 'I can endure this forever.'",
        },
      ],
      
      module5Title: "If You See a 'Conflict'",
      module5Subtitle: "Seeing conflict is not bad news",
      module5Intro: "Many people care about two needs that are hard to satisfy simultaneously long-term. This isn't indecision or immaturity—it's a signal that deserves serious attention.",
      module5Points: [
        "Don't assume 'I can balance both forever'",
        "Be especially careful during important decisions",
        "You can buffer through phased design, rather than solving everything at once",
      ],
      
      module6Title: "When to Revisit This Result",
      module6Moments: [
        "Before changing careers",
        "Before accepting important opportunities",
        "When persistently dissatisfied but can't explain why",
        "After a significant career stage change",
      ],
      module6Note: "This isn't something to check daily—it's a reference for life's key crossroads.",
      
      closingQuote: "It's not that you can't make other choices. It's that when you've walked far enough, some things cannot be repeatedly sacrificed.",
      closingNote: "SCPC results are long-term references, not one-time conclusions.",
      
      backToResults: "Back to Results",
      viewDeepDive: "View Deep Dive",
    },
  };

  const txt = content[language];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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

  return (
    <div className="min-h-screen bg-background pb-24" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Back Navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <Link
            to="/results"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {txt.backToResults}
          </Link>
        </div>
      </div>

      {/* Header Section */}
      <motion.section
        className="pt-8 sm:pt-16 pb-8 sm:pb-12 px-4 sm:px-6 border-b border-border"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="data-label text-primary mb-4">{txt.pageLabel}</div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground mb-4 leading-tight">
            {txt.title}
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            {txt.subtitle}
          </p>
          <div className="inline-block p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-foreground leading-relaxed">
              {txt.reminder}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Main Content */}
      <motion.div
        className="max-w-3xl mx-auto px-6 py-12 space-y-16"
        variants={prefersReducedMotion ? undefined : containerVariants}
        {...motionProps}
      >
        {/* Module 1: What is this result */}
        <motion.section
          variants={prefersReducedMotion ? undefined : itemVariants}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Compass className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{txt.module1Title}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Not list */}
            <div className="p-5 bg-muted/50 border border-border rounded-lg">
              <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                {language === "en" ? "It is NOT" : "它不是"}
              </div>
              <ul className="space-y-2">
                {txt.module1NotList.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Is */}
            <div className="p-5 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="text-xs font-medium text-primary mb-3 uppercase tracking-wide">
                {language === "en" ? "It IS" : "而是"}
              </div>
              <p className="text-foreground font-medium leading-relaxed">
                {txt.module1Is}
              </p>
            </div>
          </div>

          {/* Concept diagram */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">{txt.module1Left}</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ArrowRight className="w-5 h-5 text-primary" />
                <div className="text-xs text-primary font-medium text-center px-2">SCPC</div>
              </div>
              <div className="flex-1 text-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="text-sm text-primary font-medium">{txt.module1Right}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              {txt.module1Center}
            </p>
          </div>
        </motion.section>

        {/* Module 2: How to read scores */}
        <motion.section
          variants={prefersReducedMotion ? undefined : itemVariants}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{txt.module2Title}</h2>
          </div>

          <div className="space-y-3 mb-6">
            {txt.module2Levels.map((item, i) => {
              const widths = ["100%", "85%", "70%", "55%"];
              const colors = [
                "bg-destructive/20 border-destructive/40 text-destructive",
                "bg-warning/20 border-warning/40 text-warning",
                "bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-blue-400",
                "bg-muted border-border text-muted-foreground",
              ];
              return (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${colors[i]} transition-all`}
                  style={{ width: widths[i], marginLeft: "auto", marginRight: "auto" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.level}</span>
                    <span className="text-xs">{item.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-muted/50 border border-border rounded-lg">
            <p className="text-sm text-foreground text-center font-medium">
              {txt.module2Note}
            </p>
          </div>
        </motion.section>

        {/* Module 3: High-Sensitivity Anchor */}
        <motion.section
          variants={prefersReducedMotion ? undefined : itemVariants}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{txt.module3Title}</h2>
          </div>
          
          <p className="text-lg font-medium text-foreground mb-6 pl-12">
            {txt.module3Subtitle}
          </p>

          <div className="space-y-4">
            {txt.module3Points.map((point, i) => (
              <div
                key={i}
                className="p-5 bg-card border border-border rounded-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{point.trigger}</p>
                    <p className="text-foreground font-medium">{point.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Module 5: Conflict */}
        <motion.section
          variants={prefersReducedMotion ? undefined : itemVariants}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{txt.module5Title}</h2>
          </div>
          
          <p className="text-lg font-medium text-foreground mb-4 pl-12">
            {txt.module5Subtitle}
          </p>

          <p className="text-muted-foreground mb-6 pl-12 leading-relaxed">
            {txt.module5Intro}
          </p>

          <div className="space-y-3 pl-12">
            {txt.module5Points.map((point, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-destructive">{i + 1}</span>
                </div>
                <span className="text-foreground">{point}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Module 6: When to revisit */}
        <motion.section
          variants={prefersReducedMotion ? undefined : itemVariants}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{txt.module6Title}</h2>
          </div>

          <div className="relative pl-12">
            {/* Timeline */}
            <div className="absolute left-[1.375rem] top-2 bottom-2 w-px bg-border" />
            
            <div className="space-y-4">
              {txt.module6Moments.map((moment, i) => (
                <div key={i} className="relative flex items-center gap-4">
                  <div className="absolute -left-[2.125rem] w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  <div className="p-4 bg-card border border-border rounded-lg flex-1">
                    <span className="text-foreground">{moment}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center mt-6 pl-12">
            {txt.module6Note}
          </p>
        </motion.section>

        {/* Closing */}
        <motion.section
          className="pt-8 border-t border-border"
          variants={prefersReducedMotion ? undefined : itemVariants}
        >
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-primary/10 mb-6">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            
            <blockquote className="text-xl md:text-2xl font-display text-foreground mb-4 leading-relaxed max-w-2xl mx-auto">
              "{txt.closingQuote}"
            </blockquote>
            
            <p className="text-sm text-muted-foreground">
              {txt.closingNote}
            </p>
          </div>
        </motion.section>

        {/* Navigation */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
          variants={prefersReducedMotion ? undefined : itemVariants}
        >
          <Link
            to="/results"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border rounded-sm hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {txt.backToResults}
          </Link>
          <Link
            to="/deep-dive"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
          >
            {txt.viewDeepDive}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
