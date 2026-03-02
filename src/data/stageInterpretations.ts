/**
 * Stage-Specific Career Anchor Interpretations
 * 
 * Career Stages (SCPC 4-Stage Framework):
 * - early: Stage A (0-5 years) — Identity Forming Stage
 * - mid: Stage B (6-10 years) — Identity Consolidation & Direction Testing
 * - senior: Stage C (10+ years, non-exec) — Identity Reckoning & Structural Commitment
 * - executive: Stage D (C-level / Entrepreneur) — Identity Architecture Stage
 * 
 * Score Bands (standardized 0-100 scale):
 * - high: 80+
 * - moderate: 60-79
 * - low: 0-59
 */

export type CareerStage = "early" | "mid" | "senior" | "executive" | "hr";
export type ScoreBand = "high" | "moderate" | "low";

export interface StageInterpretation {
  meaning: Record<string, string>;
  characteristics: Record<string, string[]>;
  development: Record<string, string>;
  risk: Record<string, string>;
}

export interface AnchorStageData {
  early: Record<ScoreBand, StageInterpretation>;
  mid: Record<ScoreBand, StageInterpretation>;
  senior: Record<ScoreBand, StageInterpretation>;
  executive: Record<ScoreBand, StageInterpretation>;
}

// ============================================================
// TF - Technical/Functional Competence
// ============================================================
const TF_DATA: AnchorStageData = {
  early: {
    high: {
      meaning: {
        "zh-CN": "你正处于建立专业身份认同的关键期。高TF意味着你非常在意在特定领域建立扎实的技术基础。",
        "zh-TW": "你正處於建立專業身份認同的關鍵期。高TF意味著你非常在意在特定領域建立扎實的技術基礎。",
        en: "You're at a critical juncture—establishing professional identity. High TF means you deeply care about building solid technical foundations in a specific domain.",
      },
      characteristics: {
        "zh-CN": ["渴望在工作中看到专业能力成长", "对「成为某领域专家」有明确向往", "可能焦虑自己技能是否够专精", "更关注学习机会而非短期薪资"],
        "zh-TW": ["渴望在工作中看到專業能力成長", "對「成為某領域專家」有明確嚮往", "可能焦慮自己技能是否夠專精", "更關注學習機會而非短期薪資"],
        en: ["Eager to see professional competence grow", "Clear aspiration to become a domain expert", "May feel anxious about skill specialization", "Prioritize learning over short-term salary"],
      },
      development: {
        "zh-CN": "未来3-5年：1）选择一个细分方向深耕（避免什么都学但都不精）；2）找到愿意投资你专业成长的组织或导师；3）明确拒绝过早转管理的诱惑。专业深度是你长期价值的基石。",
        "zh-TW": "未來3-5年：1）選擇一個細分方向深耕；2）找到願意投資你專業成長的組織或導師；3）明確拒絕過早轉管理的誘惑。專業深度是你長期價值的基石。",
        en: "Next 3-5 years: 1) Choose a specialized direction to deepen; 2) Find mentors who invest in your growth; 3) Firmly resist the temptation to switch to management too early. Professional depth is your long-term foundation.",
      },
      risk: {
        "zh-CN": "最大风险：被快速晋升通道诱导转管理。很多技术新人因表现好被提拔为小组长，3年后既不是好管理者，专业能力也停滞了。优秀的专家比平庸的管理者更有价值。",
        "zh-TW": "最大風險：被快速晉升通道誘導轉管理。很多技術新人因表現好被提拔為小組長，3年後既不是好管理者，專業能力也停滯了。",
        en: "Biggest risk: Being lured into management by fast-track promotions. Many high-performing newcomers become team leads, only to find they're neither good managers nor technically advancing.",
      },
    },
    moderate: {
      meaning: {
        "zh-CN": "中等TF表明你对专业深度有一定在意，但不是唯一追求。你可能在「成为专家」和「多元发展」之间摇摆。",
        "zh-TW": "中等TF表明你對專業深度有一定在意，但不是唯一追求。你可能在「成為專家」和「多元發展」之間搖擺。",
        en: "Moderate TF indicates you care about depth but it's not your sole pursuit. You may waver between 'becoming an expert' and 'diverse development'.",
      },
      characteristics: {
        "zh-CN": ["既想学专业技能也想了解业务和管理", "可能对「技术专家路径」有疑虑", "容易被不同职业方向吸引", "还在探索真正的热情所在"],
        "zh-TW": ["既想學專業技能也想了解業務和管理", "可能對「技術專家路徑」有疑慮", "容易被不同職業方向吸引", "還在探索真正的熱情所在"],
        en: ["Want to learn technical AND business/management skills", "May have doubts about the expert path", "Easily attracted to different career directions", "Still exploring what truly drives passion"],
      },
      development: {
        "zh-CN": "前3年先选一个方向建立基础竞争力，保持开放心态但必须有一个「主线技能」。通过轮岗、跨部门项目来探索，但别让探索变成「什么都做一点，什么都不深入」。",
        "zh-TW": "前3年先選一個方向建立基礎競爭力，保持開放心態但必須有一個「主線技能」。",
        en: "First 3 years: Choose one direction to build foundational competitiveness. Stay open-minded but have one 'core skill'. Explore through rotations, but don't let it become 'doing everything, mastering nothing'.",
      },
      risk: {
        "zh-CN": "风险：成为「什么都会一点的通才」但缺乏核心竞争力。30岁时发现自己既不是专家也没有管理经验，处境尴尬。",
        "zh-TW": "風險：成為「什麼都會一點的通才」但缺乏核心競爭力。",
        en: "Risk: Becoming a jack of all trades who lacks core competitiveness. At 30, you may find yourself neither an expert nor having management experience.",
      },
    },
    low: {
      meaning: {
        "zh-CN": "较低TF意味着专业深度不是你主要关注的。你可能更看重工作的其他方面，如人际关系、自由度或薪资。",
        "zh-TW": "較低TF意味著專業深度不是你主要關注的。你可能更看重工作的其他方面。",
        en: "Low TF means professional depth isn't your primary focus. You likely value other aspects more—relationships, autonomy, compensation.",
      },
      characteristics: {
        "zh-CN": ["不太在意成为某领域技术权威", "觉得「专家路径」太窄", "对通用技能更感兴趣", "容易对纯技术岗位感到枯燥"],
        "zh-TW": ["不太在意成為某領域技術權威", "覺得「專家路徑」太窄", "對通用技能更感興趣", "容易對純技術職位感到枯燥"],
        en: ["Don't care about becoming a technical authority", "May feel the expert path is too narrow", "More interested in general skills", "Easily bored by purely technical roles"],
      },
      development: {
        "zh-CN": "你可能更适合：1）业务导向岗位（产品、运营、销售）；2）跨职能协作角色；3）管培生项目。但即使不走专家路线，也需要在某个领域建立差异化优势。",
        "zh-TW": "你可能更適合業務導向職位、跨職能協作角色或管培生專案。但即使不走專家路線，也需要建立差異化優勢。",
        en: "You might be better suited for business-oriented roles, cross-functional roles, or management trainee programs. Even without the expert route, build differentiated advantages somewhere.",
      },
      risk: {
        "zh-CN": "如果你在管理、创业等维度得分也不高，可能面临「缺乏明确职业驱动力」的困境。需要尽快找到真正让你有动力的东西。",
        "zh-TW": "如果你在管理、創業等維度得分也不高，可能面臨「缺乏明確職業驅動力」的困境。",
        en: "If you also score low on management and entrepreneurship, you may face a 'lack of clear career drivers' dilemma. Find what truly motivates you quickly.",
      },
    },
  },
  mid: {
    high: {
      meaning: {
        "zh-CN": "工作6-15年仍保持高TF，说明你已确认专业深度是长期价值来源。此时应从「学习者」转变为「行业认可的专家」。",
        "zh-TW": "工作6-15年仍保持高TF，說明你已確認專業深度是長期價值來源。此時應從「學習者」轉變為「行業認可的專家」。",
        en: "Maintaining high TF after 6-15 years confirms professional depth as your long-term value source. Transition from 'learner' to 'industry-recognized expert'.",
      },
      characteristics: {
        "zh-CN": ["在某专业领域有深厚积累", "开始被同行和行业认可", "可能面临「要不要转管理」的压力", "对专业尊严和话语权非常敏感"],
        "zh-TW": ["在某專業領域有深厚積累", "開始被同行和行業認可", "可能面臨「要不要轉管理」的壓力", "對專業尊嚴和話語權非常敏感"],
        en: ["Deep accumulation in a specialized domain", "Starting to be recognized by peers and industry", "May face pressure to switch to management", "Very sensitive about professional dignity and voice"],
      },
      development: {
        "zh-CN": "关键动作：1）建立行业影响力（演讲、写作、专利）；2）寻找专家型晋升路径（Staff Engineer、Principal、Fellow）；3）学会通过专业影响力发挥领导力。目标是成为「不用做管理也能持续晋升」的专业人士。",
        "zh-TW": "關鍵動作：1）建立行業影響力；2）尋找專家型晉升路徑；3）學會通過專業影響力發揮領導力。",
        en: "Key actions: 1) Build industry influence (speaking, writing, patents); 2) Find expert-track career paths; 3) Lead through professional influence rather than managerial authority.",
      },
      risk: {
        "zh-CN": "最大陷阱：因为组织没有专家通道而被迫转管理，3-5年后既失去专业优势又不擅长管理。如果公司没有专家路径，考虑换公司或转咨询/自由职业。",
        "zh-TW": "最大陷阱：因為組織沒有專家通道而被迫轉管理。如果公司沒有專家路徑，考慮換公司或轉諮詢。",
        en: "Biggest trap: Forced into management because the organization lacks an expert track. If your company has no expert path, consider switching or moving to consulting.",
      },
    },
    moderate: {
      meaning: {
        "zh-CN": "中期中等TF可能表示你在专业和管理之间找到了平衡，或专业热情有所下降，正在重新定义「专业价值」。",
        "zh-TW": "中期中等TF可能表示你在專業和管理之間找到了平衡，或正在重新定義「專業價值」。",
        en: "Mid-career moderate TF may indicate you've found balance between technical and management, or you're redefining what 'professional value' means.",
      },
      characteristics: {
        "zh-CN": ["可能已尝试过管理或跨领域工作", "对「纯专家」和「纯管理」都不完全满意", "在寻找「技术+X」的复合型定位", "可能面临职业迷茫期"],
        "zh-TW": ["可能已嘗試過管理或跨領域工作", "對「純專家」和「純管理」都不完全滿意", "在尋找「技術+X」的複合型定位", "可能面臨職業迷茫期"],
        en: ["May have tried management or cross-domain work", "Not fully satisfied with either pure expert or pure manager", "Seeking 'technical + X' hybrid positioning", "May be experiencing career confusion"],
      },
      development: {
        "zh-CN": "不要在「专家 vs 管理」的二元对立中纠结。探索混合型角色：技术产品经理、解决方案架构师、技术布道师、创业CTO。关键是找到你的「技术+业务/人/创新」的独特组合。",
        "zh-TW": "不要在「專家 vs 管理」的二元對立中糾結。探索混合型角色，找到你的獨特組合。",
        en: "Don't get stuck in the 'expert vs manager' binary. Explore hybrid roles: technical PM, solutions architect, tech evangelist, startup CTO. Find your unique combination.",
      },
      risk: {
        "zh-CN": "风险：在转型探索中花太长时间，导致专业能力退化但新能力又没建立。建议设定2-3年探索期限，期间保持一定专业实践。",
        "zh-TW": "風險：在轉型探索中花太長時間，導致專業能力退化但新能力又沒建立。",
        en: "Risk: Spending too long in transition, causing professional skills to atrophy while new capabilities aren't established. Set a 2-3 year exploration timeline.",
      },
    },
    low: {
      meaning: {
        "zh-CN": "中期低TF说明你已明确：专业深度不是你的核心价值来源。你更可能在管理、业务、创业方向发展。",
        "zh-TW": "中期低TF說明你已明確：專業深度不是你的核心價值來源。",
        en: "Mid-career low TF clearly indicates professional depth isn't your core value source. You're more likely developing in management, business, or entrepreneurship.",
      },
      characteristics: {
        "zh-CN": ["可能已转型到管理或业务岗位", "对专业技术保持了解但不再深入", "更关注商业结果和团队建设", "专业身份认同逐渐淡化"],
        "zh-TW": ["可能已轉型到管理或業務職位", "對專業技術保持了解但不再深入", "更關注商業結果和團隊建設", "專業身份認同逐漸淡化"],
        en: ["Likely transitioned to management or business roles", "Maintain awareness but no longer go deep", "More focused on business results and team building", "Professional identity gradually fading"],
      },
      development: {
        "zh-CN": "重点：1）如果已转管理，系统学习管理方法论；2）如果在业务岗位，深入理解商业模式；3）保持对行业技术趋势的战略性了解。你的价值已从「做」转向「判断、整合、决策」。",
        "zh-TW": "重點：系統學習管理方法論，深入理解商業模式，保持戰略性技術了解。",
        en: "Focus: 1) If in management, systematically learn management theory; 2) If in business, deeply understand business models; 3) Maintain strategic awareness of tech trends. Your value has shifted from 'doing' to 'judging and deciding'.",
      },
      risk: {
        "zh-CN": "如果GM、EC、SV等锚点得分也不高，可能说明你还没找到替代专业深度的核心驱动力。需要尽快明确你的长期价值主张是什么。",
        "zh-TW": "如果GM、EC、SV等錨點得分也不高，可能說明你還沒找到核心驅動力。",
        en: "If you also score low on GM, EC, SV, you haven't found a core driver to replace professional depth. Clarify your long-term value proposition quickly.",
      },
    },
  },
  senior: {
    high: {
      meaning: {
        "zh-CN": "工作10年以上仍保持高TF，你的专业身份已深度固化。此时的关键问题不再是「要不要走专家路线」，而是「我的专业身份是否正在成为结构性束缚」。如果组织不再给予专业深度应有的尊重和空间，你可能正在经历持续的身份摩擦。",
        "zh-TW": "工作10年以上仍保持高TF，你的專業身份已深度固化。關鍵問題是「我的專業身份是否正在成為結構性束縛」。如果組織不再尊重專業深度，你可能正在經歷持續的身份摩擦。",
        en: "Maintaining high TF after 10+ years means your professional identity is deeply solidified. The key question is no longer 'should I stay on the expert track,' but 'is my professional identity becoming a structural constraint?' If your organization no longer respects deep expertise, you may be experiencing sustained identity friction.",
      },
      characteristics: {
        "zh-CN": ["专业身份高度固化，难以想象『非专家』的自己", "对组织中专业话语权被削弱感到深层疲惫", "可能出现『专业倦怠信号』——对曾经热爱的技术领域感到麻木", "面临结构性天花板：薪资、职级、影响力都可能已到顶"],
        "zh-TW": ["專業身份高度固化，難以想像『非專家』的自己", "對專業話語權被削弱感到深層疲憊", "可能出現『專業倦怠信號』——對曾經熱愛的領域感到麻木", "面臨結構性天花板"],
        en: ["Professional identity deeply solidified—hard to imagine a 'non-expert' self", "Deep fatigue from eroding professional authority within the organization", "Possible expertise burnout signal—numbness toward once-beloved technical domains", "Facing structural ceiling: salary, rank, and influence may all have peaked"],
      },
      development: {
        "zh-CN": "此阶段需要进行『身份审计』：1）你的专业深度是否仍然是市场稀缺资源？如果不是，需要在保持深度的同时拓展应用场景；2）考虑将专业能力转化为更高阶的影响力形式——技术战略顾问、行业标准制定者、知识资本化（写书、课程、专利）；3）警惕『沉默的专业倦怠』——你可能还在做得很好，但内心的热情已经熄灭。",
        "zh-TW": "此階段需要『身份審計』：專業深度是否仍是市場稀缺資源？考慮將能力轉化為更高階影響力——技術戰略顧問、行業標準、知識資本化。警惕『沉默的專業倦怠』。",
        en: "This stage requires an 'identity audit': 1) Is your depth still a scarce market resource? If not, expand application scenarios while maintaining depth; 2) Convert expertise into higher-order influence—technical strategy advisory, industry standards, knowledge capitalization (books, courses, patents); 3) Watch for 'silent expertise burnout'—you may still perform well, but the inner flame has gone out.",
      },
      risk: {
        "zh-CN": "倦怠信号模式：对新技术学习从「兴奋」变为「应付」；同事讨论技术时你感到疲惫而非振奋；开始用「我见过太多了」来回避新尝试。早期预警：如果你发现自己越来越多地用资历而非好奇心来应对工作，这是身份僵化的信号。偏离模式：高TF资深人士最常见的偏离是「被动守成」——不再追求卓越，只是在消耗过去积累的声誉资本。",
        "zh-TW": "倦怠信號：對新技術從「興奮」變為「應付」；用「我見過太多了」回避新嘗試。早期預警：用資歷而非好奇心應對工作是身份僵化信號。偏離模式：「被動守成」——消耗過去的聲譽資本。",
        en: "Burnout signal pattern: Learning new tech shifts from 'exciting' to 'going through the motions'; colleagues' tech discussions feel draining rather than energizing; defaulting to 'I've seen it all' to avoid new experiments. Early warning: If you increasingly rely on seniority rather than curiosity, that's identity rigidity. Derailment pattern: 'Passive preservation'—no longer pursuing excellence, just spending down accumulated reputation capital.",
      },
    },
    moderate: {
      meaning: {
        "zh-CN": "10年以上中等TF表明你已经完成了从专业深度到更宽领域的过渡，或者你的专业热情正在经历自然衰减。这本身不是问题，但需要关注你是否找到了替代的身份支柱。",
        "zh-TW": "10年以上中等TF表明你已完成從專業深度到更寬領域的過渡，或專業熱情在自然衰減。需要關注是否找到了替代身份支柱。",
        en: "Moderate TF after 10+ years indicates you've transitioned from deep specialization to a broader scope, or your professional passion is naturally waning. This isn't inherently problematic, but watch whether you've found a replacement identity pillar.",
      },
      characteristics: {
        "zh-CN": ["专业能力仍在但不再是核心身份标签", "可能在『技术+管理』或『技术+业务』的复合角色中", "对纯技术讨论的参与度下降", "身份认同正在从『某领域专家』转向『经验丰富的老手』"],
        "zh-TW": ["專業能力仍在但不再是核心身份標籤", "可能在複合角色中", "對純技術討論的參與度下降", "身份認同正在轉型"],
        en: ["Professional capability remains but is no longer the core identity label", "Likely in a hybrid 'tech + management' or 'tech + business' role", "Declining engagement in pure technical discussions", "Identity shifting from 'domain expert' to 'seasoned veteran'"],
      },
      development: {
        "zh-CN": "确认你的新身份定位是主动选择还是被动漂移。如果是主动的——继续深化你的复合型优势；如果是被动的——可能需要重新激活专业学习，或者正式承认自己已经走上了不同的道路。不做选择本身就是一种选择，而且通常不是最好的那种。",
        "zh-TW": "確認新身份定位是主動選擇還是被動漂移。主動的則深化複合型優勢；被動的則需要重新激活或正式承認新方向。",
        en: "Confirm whether your new positioning is an active choice or passive drift. If active—deepen your hybrid advantage. If passive—either reactivate professional learning, or formally acknowledge you've taken a different path. Not choosing is itself a choice, and usually not the best one.",
      },
      risk: {
        "zh-CN": "倦怠信号模式：觉得自己「什么都知道一点，但什么都不精通了」；在需要深度专业判断时缺乏自信；对年轻专家的能力感到隐约威胁。早期预警：如果你开始回避需要深度技术判断的场景，可能是专业自信在流失。偏离模式：「专业空心化」——保留专家头衔但实际能力已无法支撑，靠经验和关系维持位置。",
        "zh-TW": "倦怠信號：覺得「什麼都知道一點但不精通了」；對年輕專家感到威脅。早期預警：回避深度技術判斷場景。偏離模式：「專業空心化」——保留專家頭銜但能力無法支撐。",
        en: "Burnout signal: Feeling 'I know a bit of everything but master nothing anymore'; lacking confidence in deep technical judgments; vaguely threatened by younger experts. Early warning: Avoiding scenarios requiring deep technical judgment signals eroding professional confidence. Derailment pattern: 'Professional hollowing'—retaining expert titles while actual capabilities can no longer support them, relying on relationships and seniority to maintain position.",
      },
    },
    low: {
      meaning: {
        "zh-CN": "10年以上低TF说明专业深度很早就不是你的追求方向。此阶段的关键是确认你是否在其他维度（管理、创业、服务等）建立了足够坚实的身份基础。",
        "zh-TW": "10年以上低TF說明專業深度很早就不是你的追求。此階段關鍵是確認是否在其他維度建立了身份基礎。",
        en: "Low TF after 10+ years confirms professional depth was never your primary pursuit. The key at this stage is verifying whether you've built a solid identity foundation in other dimensions (management, entrepreneurship, service, etc.).",
      },
      characteristics: {
        "zh-CN": ["完全不以专业技能定义自己", "价值来源已彻底转向其他领域", "对『技术过时』的焦虑较低", "但可能在面对年轻技术人才时感到不安"],
        "zh-TW": ["完全不以專業技能定義自己", "價值來源已轉向其他領域", "對『技術過時』的焦慮較低"],
        en: ["Do not define yourself by professional skills at all", "Value source has completely shifted to other domains", "Lower anxiety about 'technical obsolescence'", "But may feel uneasy facing young technical talents"],
      },
      development: {
        "zh-CN": "如果你的其他锚点（GM、EC、SV等）有清晰的高分方向，这是正常的分化。如果没有——需要认真审视自己的核心竞争力到底是什么。10年以上没有明确方向的职业漂移，修复成本会越来越高。",
        "zh-TW": "如果其他錨點有清晰高分方向，這是正常分化。如果沒有，需要審視核心競爭力。10年以上的職業漂移，修復成本越來越高。",
        en: "If your other anchors (GM, EC, SV) show clear high-score directions, this is normal differentiation. If not—seriously examine what your core competitiveness actually is. Career drift beyond 10 years carries increasingly high correction costs.",
      },
      risk: {
        "zh-CN": "倦怠信号模式：感觉自己在组织中的存在感越来越弱；新人的专业能力让你觉得自己「被时代淘汰」。早期预警：如果你无法用一句话说清楚自己的核心价值，这是身份模糊的信号。偏离模式：「隐性脱轨」——看起来还在岗位上，但实际上已经进入了自动驾驶状态，既不学习也不成长。",
        "zh-TW": "倦怠信號：存在感越來越弱。早期預警：無法說清楚自己的核心價值。偏離模式：「隱性脫軌」——進入自動駕駛狀態，不學習也不成長。",
        en: "Burnout signal: Feeling increasingly invisible in the organization; newcomers' expertise makes you feel 'obsolete.' Early warning: If you can't articulate your core value in one sentence, that's identity blur. Derailment pattern: 'Silent derailment'—still technically in your role but on autopilot, neither learning nor growing.",
      },
    },
  },
  executive: {
    high: {
      meaning: {
        "zh-CN": "高管阶段保持高TF极为罕见但极有价值。你可能是技术型CEO、首席科学家，或细分领域的全球顶尖专家。",
        "zh-TW": "高管階段保持高TF極為罕見但極有價值。你可能是技術型CEO或細分領域的全球頂尖專家。",
        en: "Maintaining high TF at executive stage is extremely rare but highly valuable. You might be a technical CEO, chief scientist, or world-class expert.",
      },
      characteristics: {
        "zh-CN": ["即使在高管位置也保持对专业的深度关注", "决策深度依赖专业判断和技术洞察", "在行业内有极高的专业声誉"],
        "zh-TW": ["即使在高管位置也保持對專業的深度關注", "決策依賴專業判斷和技術洞察", "在行業內有極高的專業聲譽"],
        en: ["Maintain deep professional focus even in executive positions", "Decisions rely on professional judgment and technical insights", "Extremely high professional reputation in the industry"],
      },
      development: {
        "zh-CN": "你的角色是：1）定义行业技术方向和标准；2）培养下一代技术领袖；3）用专业影响力推动商业或社会创新。考虑：著书、演讲、担任顾问、投资早期技术项目。",
        "zh-TW": "你的角色是定義行業標準、培養下一代技術領袖、用專業影響力推動創新。",
        en: "Your role: 1) Define industry technical directions and standards; 2) Cultivate next-generation technical leaders; 3) Drive innovation through professional influence. Consider writing books, advising, investing.",
      },
      risk: {
        "zh-CN": "风险：过度沉迷技术细节而忽略商业、团队、战略等高管必须关注的领域。技术CEO最容易犯的错误是「用技术优雅性替代商业有效性」。",
        "zh-TW": "風險：過度沉迷技術細節而忽略商業和戰略。技術CEO最容易犯的錯誤是「用技術優雅性替代商業有效性」。",
        en: "Risk: Over-obsessing about technical details while neglecting business and strategy. Technical CEOs' most common mistake: substituting technical elegance for business effectiveness.",
      },
    },
    moderate: {
      meaning: {
        "zh-CN": "高管阶段中等TF说明你保持对专业的尊重和了解，但已不再是核心驱动力。你更关注战略、团队和商业模式。",
        "zh-TW": "高管階段中等TF說明你保持對專業的尊重，但已不再是核心驅動力。",
        en: "Moderate TF at executive stage: You maintain respect for professional matters, but it's no longer your core driver. More focused on strategy and team.",
      },
      characteristics: {
        "zh-CN": ["专业背景是信任基础但不再是日常重心", "更多通过团队而非个人能力实现目标", "关注专业如何服务商业战略"],
        "zh-TW": ["專業背景是信任基礎但不再是日常重心", "更多通過團隊實現目標", "關注專業如何服務商業戰略"],
        en: ["Professional background is trust foundation but not daily focus", "Achieve goals more through team than personal capabilities", "Focus on how expertise serves business strategy"],
      },
      development: {
        "zh-CN": "平衡策略：1）定期与顶尖专业人才交流；2）建立技术顾问团队；3）将专业判断力应用于战略决策。你的价值已从「做」转向「判断什么值得做」。",
        "zh-TW": "平衡策略：定期與頂尖人才交流，建立技術顧問團隊，將判斷力應用於戰略決策。",
        en: "Balance strategy: 1) Regularly engage with top talents; 2) Build technical advisory team; 3) Apply professional judgment to strategic decisions.",
      },
      risk: {
        "zh-CN": "风险：与技术前沿脱节太久导致战略判断失误。建议每年至少做几次「深度技术学习」。",
        "zh-TW": "風險：與先進技術脫節太久導致戰略判斷失誤。",
        en: "Risk: Disconnected from technical frontier too long, leading to strategic misjudgments. Do at least several deep technical learning sessions yearly.",
      },
    },
    low: {
      meaning: {
        "zh-CN": "高管阶段低TF是正常现象。你的价值来源已完全转向领导力、商业判断和资源整合。",
        "zh-TW": "高管階段低TF是正常現象。你的價值已完全轉向領導力和商業判斷。",
        en: "Low TF at executive stage is normal. Your value source has completely shifted to leadership, business judgment, and resource integration.",
      },
      characteristics: {
        "zh-CN": ["完全依靠团队的专业能力", "关注点在战略、文化、资本、市场", "专业知识主要用于「听懂专家在说什么」"],
        "zh-TW": ["完全依靠團隊的專業能力", "關注點在戰略、文化、資本、市場", "專業知識主要用於「聽懂專家在說什麼」"],
        en: ["Completely rely on team's professional capabilities", "Focus on strategy, culture, capital, market", "Professional knowledge mainly for understanding experts"],
      },
      development: {
        "zh-CN": "你需要：1）招募和留住顶尖人才；2）建立信任和授权机制；3）学会通过「问对的问题」而非「给答案」来驱动团队。",
        "zh-TW": "你需要：招募頂尖人才、建立信任機制、學會通過提問驅動團隊。",
        en: "You need: 1) Recruit and retain top talents; 2) Establish trust and empowerment mechanisms; 3) Drive teams by asking the right questions, not giving answers.",
      },
      risk: {
        "zh-CN": "风险：过度依赖某几个关键专家。建议建立知识传承机制和培养备份人才。",
        "zh-TW": "風險：過度依賴某幾個關鍵專家。建議建立知識傳承機制。",
        en: "Risk: Over-reliance on a few key experts. Establish knowledge transfer mechanisms and develop backup talents.",
      },
    },
  },
};

// ============================================================
// GM - General Management
// ============================================================
const GM_DATA: AnchorStageData = {
  early: {
    high: {
      meaning: {
        "zh-CN": "高GM意味着你在职业初期就有强烈的管理欲望——渴望带领团队、整合资源、对结果负责。",
        "zh-TW": "高GM意味著你在職業初期就有強烈的管理慾望——渴望帶領團隊、整合資源、對結果負責。",
        en: "High GM means you have a strong management drive from the start—eager to lead teams, integrate resources, and own results.",
      },
      characteristics: {
        "zh-CN": ["喜欢组织和协调他人", "主动承担项目负责人角色", "对晋升路径很敏感", "习惯从全局角度思考问题"],
        "zh-TW": ["喜歡組織和協調他人", "主動承擔專案負責人角色", "對晉升路徑很敏感", "習慣從全局角度思考問題"],
        en: ["Enjoy organizing and coordinating others", "Proactively take on leadership roles", "Very sensitive to promotion paths", "Think from a holistic perspective"],
      },
      development: {
        "zh-CN": "前3年的关键：1）先建立至少一个领域的专业信任，不要空降管理；2）通过小项目锻炼带人能力；3）学习结构化思维和沟通技能。缺乏专业基础的管理者容易被团队架空。",
        "zh-TW": "前3年的關鍵：先建立專業信任，不要空降管理；通過小專案鍛煉帶人能力。",
        en: "First 3 years: 1) Build professional credibility in at least one area first; 2) Practice leadership through small projects; 3) Learn structured thinking and communication. Managers without professional foundation risk losing team respect.",
      },
      risk: {
        "zh-CN": "风险：过早追求管理头衔而忽视能力积累。没有专业根基的年轻管理者，上升通道容易在中层卡住。先成为好的专业人士，再成为好的管理者。",
        "zh-TW": "風險：過早追求管理頭銜而忽視能力積累。先成為好的專業人士，再成為好的管理者。",
        en: "Risk: Chasing management titles too early without building capabilities. Young managers without professional foundation often get stuck at mid-level. Be a good professional first, then a good manager.",
      },
    },
    moderate: {
      meaning: {
        "zh-CN": "中等GM说明你对管理有兴趣但不是唯一追求。你可能在「带人」和「做事」之间寻找平衡。",
        "zh-TW": "中等GM說明你對管理有興趣但不是唯一追求。你可能在「帶人」和「做事」之間尋找平衡。",
        en: "Moderate GM indicates interest in management but it's not your sole pursuit. You're seeking balance between leading people and doing work.",
      },
      characteristics: {
        "zh-CN": ["愿意在需要时承担领导角色", "对纯管理工作不完全确定", "可能更喜欢「做事+带人」的混合模式", "看重团队合作但不一定想成为老板"],
        "zh-TW": ["願意在需要時承擔領導角色", "對純管理工作不完全確定", "可能更喜歡「做事+帶人」的混合模式"],
        en: ["Willing to take leadership roles when needed", "Not fully certain about pure management", "May prefer a 'doing + leading' hybrid mode", "Value teamwork but not necessarily want to be the boss"],
      },
      development: {
        "zh-CN": "找到你舒适的管理模式：项目经理、技术负责人、团队协调者。不必追求传统的层级管理，很多组织现在需要的是「影响力型领导」而非「权力型管理」。",
        "zh-TW": "找到你舒適的管理模式：專案經理、技術負責人、團隊協調者。不必追求傳統的層級管理。",
        en: "Find your comfortable management mode: project manager, tech lead, team coordinator. Don't chase traditional hierarchical management—many organizations now need 'influence leaders' not 'power managers'.",
      },
      risk: {
        "zh-CN": "风险：被动等待机会而不主动争取。如果你有管理潜力但不主动表达，机会会被更积极的人拿走。",
        "zh-TW": "風險：被動等待機會而不主動爭取。",
        en: "Risk: Passively waiting for opportunities instead of proactively seeking them. If you have management potential but don't express it, more aggressive people will take those chances.",
      },
    },
    low: {
      meaning: {
        "zh-CN": "低GM意味着你对「管理他人、承担整体责任」没有强烈兴趣。你更可能在专业贡献者或独立工作者的角色中获得满足。",
        "zh-TW": "低GM意味著你對「管理他人」沒有強烈興趣。你更可能在專業貢獻者角色中獲得滿足。",
        en: "Low GM means you're not strongly interested in managing others or owning overall results. You're more likely satisfied as an individual contributor.",
      },
      characteristics: {
        "zh-CN": ["不享受协调和管理工作", "更喜欢专注自己的任务", "对组织政治和层级关系不感兴趣", "可能觉得管理会议浪费时间"],
        "zh-TW": ["不享受協調和管理工作", "更喜歡專注自己的任務", "對組織政治不感興趣"],
        en: ["Don't enjoy coordination and management work", "Prefer focusing on own tasks", "Not interested in organizational politics", "May feel management meetings waste time"],
      },
      development: {
        "zh-CN": "明确告诉上级你的发展偏好，避免被默认推上管理轨道。寻找有「专家路径」或「个人贡献者」晋升通道的组织。",
        "zh-TW": "明確告訴上級你的發展偏好，避免被默認推上管理軌道。",
        en: "Clearly communicate your development preferences to avoid being pushed into management by default. Seek organizations with 'expert path' or 'individual contributor' tracks.",
      },
      risk: {
        "zh-CN": "风险：在只有管理晋升通道的组织里，你的职业发展可能会遇到天花板。需要评估当前组织是否适合你的长期发展。",
        "zh-TW": "風險：在只有管理晉升通道的組織裡，職業發展可能遇到天花板。",
        en: "Risk: In organizations with only management promotion tracks, your career development may hit a ceiling. Evaluate whether your current organization fits your long-term path.",
      },
    },
  },
  mid: {
    high: {
      meaning: {
        "zh-CN": "中期高GM说明管理是你确认的长期发展方向。你应该已经有一定的管理经验，现在需要从「管事」升级到「管人管战略」。",
        "zh-TW": "中期高GM說明管理是你確認的長期方向。現在需要從「管事」升級到「管人管戰略」。",
        en: "Mid-career high GM confirms management as your long-term direction. You need to evolve from 'managing tasks' to 'managing people and strategy'.",
      },
      characteristics: {
        "zh-CN": ["已有一定的管理经验和成绩", "开始关注战略层面的问题", "在培养下属方面投入更多", "可能面临「中层困境」——上不去下不来"],
        "zh-TW": ["已有一定的管理經驗和成績", "開始關注戰略層面", "在培養下屬方面投入更多", "可能面臨「中層困境」"],
        en: ["Have management experience and track record", "Starting to focus on strategic issues", "Investing more in developing subordinates", "May face 'middle management trap'—stuck between"],
      },
      development: {
        "zh-CN": "关键突破：1）从管理团队到管理管理者（管理的管理者）；2）建立跨部门影响力；3）学习商业思维和财务知识；4）找到高管导师。突破中层的关键是展示战略思维能力。",
        "zh-TW": "關鍵突破：從管理團隊到管理管理者，建立跨部門影響力，學習商業和財務知識。",
        en: "Key breakthrough: 1) Evolve from managing teams to managing managers; 2) Build cross-departmental influence; 3) Learn business thinking and financial knowledge; 4) Find executive mentors.",
      },
      risk: {
        "zh-CN": "风险：在中层管理位置待太久，变成「执行者」而非「决策者」。主动争取更大范围的管理职责和战略参与机会。",
        "zh-TW": "風險：在中層管理待太久，變成「執行者」而非「決策者」。",
        en: "Risk: Staying too long in middle management, becoming an 'executor' rather than 'decision maker'. Proactively seek broader management responsibilities.",
      },
    },
    moderate: {
      meaning: {
        "zh-CN": "中期中等GM可能意味着你在管理中遇到了瓶颈或反思，或者找到了「管理+专业」的平衡点。",
        "zh-TW": "中期中等GM可能意味著你在管理中遇到了瓶頸，或找到了平衡點。",
        en: "Mid-career moderate GM may mean you've hit a management bottleneck, are reflecting, or have found a 'management + expertise' balance.",
      },
      characteristics: {
        "zh-CN": ["可能尝试了管理后发现不完全适合", "在探索「管理+X」的混合角色", "对权力和头衔的追求减弱", "更看重影响力而非职位"],
        "zh-TW": ["可能嘗試了管理後發現不完全適合", "在探索混合角色", "對權力追求減弱", "更看重影響力"],
        en: ["May have tried management and found it's not fully fitting", "Exploring hybrid roles", "Reduced pursuit of power and titles", "Value influence over position"],
      },
      development: {
        "zh-CN": "如果你觉得纯管理不适合，考虑转型为「专业型管理者」或「横向领导者」——不需要直接管人，但通过专业影响力驱动变革。",
        "zh-TW": "如果純管理不適合，考慮轉型為「專業型管理者」或「橫向領導者」。",
        en: "If pure management doesn't fit, consider becoming a 'professional manager' or 'lateral leader'—driving change through professional influence without directly managing people.",
      },
      risk: {
        "zh-CN": "风险：在管理和非管理之间反复摇摆消耗时间和精力。建议在2年内做出明确选择。",
        "zh-TW": "風險：在管理和非管理之間反覆搖擺消耗精力。建議2年內做出選擇。",
        en: "Risk: Oscillating between management and non-management wastes time and energy. Make a clear decision within 2 years.",
      },
    },
    low: {
      meaning: {
        "zh-CN": "中期低GM是明确信号——管理不是你的职业动力来源。你需要找到非管理的长期发展路径。",
        "zh-TW": "中期低GM是明確信號——管理不是你的職業動力來源。",
        en: "Mid-career low GM is a clear signal—management isn't your career motivator. Find non-management long-term development paths.",
      },
      characteristics: {
        "zh-CN": ["对管理工作的日常感到疲惫", "更享受专注于个人贡献", "可能在管理岗位上感到不自在", "职业满足感来自专业成果而非团队业绩"],
        "zh-TW": ["對管理工作的日常感到疲憊", "更享受專注於個人貢獻", "職業滿足感來自專業成果"],
        en: ["Feel fatigued by daily management work", "Enjoy focusing on individual contributions", "Career satisfaction comes from professional achievements, not team performance"],
      },
      development: {
        "zh-CN": "如果你目前在管理岗位但感到不适应，考虑转回专业路径。这不是退步，而是重新对齐。很多优秀的管理者回到专业岗位后反而更有成就感。",
        "zh-TW": "如果目前在管理職位但不適應，考慮轉回專業路徑。這不是退步，而是重新對齊。",
        en: "If you're in management but feel misaligned, consider returning to a professional track. This isn't a step back—it's realignment. Many return to professional roles and find greater fulfillment.",
      },
      risk: {
        "zh-CN": "风险：「沉没成本」心态——觉得已经做了这么久管理不能放弃。但如果你每天都在消耗，长期坚持的代价更大。",
        "zh-TW": "風險：「沉沒成本」心態——覺得已經做了這麼久不能放棄。但長期消耗代價更大。",
        en: "Risk: 'Sunk cost' mentality—feeling you can't give up management after so long. But if you're draining daily, the long-term cost of persisting is higher.",
      },
    },
  },
  senior: {
    high: {
      meaning: {
        "zh-CN": "10年以上高GM，如果你已经是中高层管理者，核心问题是：你的管理身份是否仍然给你能量，还是已经开始消耗你？很多资深管理者在这个阶段会发现，管理从激情变成了义务，从选择变成了惯性。",
        "zh-TW": "10年以上高GM，核心問題是：管理身份是否仍給你能量，還是已在消耗你？很多資深管理者會發現管理從激情變成了義務。",
        en: "High GM after 10+ years—if you're already in mid-to-senior management, the core question is: does your management identity still energize you, or has it begun draining you? Many seasoned managers at this stage discover that management has shifted from passion to obligation, from choice to inertia.",
      },
      characteristics: {
        "zh-CN": ["管理工作变得越来越像行政事务而非领导力实践", "对组织政治和人事纠纷感到深层疲惫", "可能出现『管理倦怠』——每天做着管理但内心已不再投入", "如果还在中层，可能经历持续的『晋升焦虑』和结构性瓶颈"],
        "zh-TW": ["管理工作越來越像行政事務", "對組織政治感到深層疲憊", "可能出現『管理倦怠』", "可能經歷持續的『晉升焦慮』和結構性瓶頸"],
        en: ["Management work increasingly feels like administration rather than leadership", "Deep fatigue from organizational politics and personnel disputes", "Possible 'management burnout'—performing management daily while internally disengaged", "If still in middle management, may experience chronic 'promotion anxiety' and structural bottleneck"],
      },
      development: {
        "zh-CN": "诚实面对一个问题：如果你今天可以重新选择，还会选管理吗？如果答案是犹豫——考虑：1）从传统管理转向教练式领导或顾问角色；2）在管理中找到你真正在意的部分（战略？培养人？变革？）并放大它；3）如果你在中层管理瓶颈中，评估是向上突破还是横向转型更现实。",
        "zh-TW": "誠實面對：如果今天可以重新選擇，還會選管理嗎？考慮轉向教練式領導或顧問角色；在管理中找到你真正在意的部分並放大它。",
        en: "Honestly ask: if you could choose again today, would you still choose management? If you hesitate—consider: 1) Shift from traditional management to coaching or advisory; 2) Identify what you truly care about within management (strategy? developing people? transformation?) and amplify it; 3) If stuck at middle management, evaluate whether upward breakthrough or lateral transition is more realistic.",
      },
      risk: {
        "zh-CN": "倦怠信号模式：把管理工作当成流程执行而非领导力实践；对下属的成长不再感到兴奋；开始「甩锅式管理」——只关注自保而非团队。早期预警：如果你发现自己越来越多地用权力而非影响力来推动工作，管理身份可能已经开始变质。偏离模式：「职业僵尸」——保持管理者的位置和薪资，但已经不再真正管理，只是在维持现状。",
        "zh-TW": "倦怠信號：把管理當流程執行；對下屬成長不再感到興奮。早期預警：用權力而非影響力推動工作。偏離模式：「職業僵屍」——保持位置但不再真正管理。",
        en: "Burnout signal pattern: Treating management as process execution rather than leadership practice; no longer excited by subordinates' growth; adopting 'blame-shifting management'—focused on self-preservation over team welfare. Early warning: If you increasingly use authority rather than influence to drive work, your management identity may be degenerating. Derailment pattern: 'Career zombie'—maintaining the manager position and salary but no longer truly managing, just preserving the status quo.",
      },
    },
    moderate: {
      meaning: {
        "zh-CN": "10年以上中等GM可能意味着你对管理的热情已经沉淀——不再那么渴望向上爬，但也不想放弃已经建立的管理身份。这种状态如果是主动选择的平衡，是健康的；如果是被动的妥协，则可能酝酿更深的不满。",
        "zh-TW": "10年以上中等GM可能意味著你對管理的熱情已沉澱。如果是主動平衡是健康的；如果是被動妥協，可能醞釀不滿。",
        en: "Moderate GM after 10+ years may mean your management passion has settled—no longer eager to climb, but unwilling to relinquish your established management identity. If this is an active choice for balance, it's healthy. If passive compromise, it may be brewing deeper dissatisfaction.",
      },
      characteristics: {
        "zh-CN": ["管理能力成熟但管理热情下降", "可能在「管理+专业」的混合角色中找到了舒适区", "对晋升的期望从强烈变为平淡", "开始更多地关注工作之外的生活维度"],
        "zh-TW": ["管理能力成熟但熱情下降", "可能在混合角色中找到舒適區", "對晉升期望變得平淡"],
        en: ["Management capability mature but management passion declining", "May have found comfort in a 'management + expertise' hybrid role", "Promotion expectations shifted from intense to muted", "Increasingly focused on life dimensions outside work"],
      },
      development: {
        "zh-CN": "如果你的平衡状态是主动选择的——恭喜，你找到了可持续的模式。但定期检查：这个平衡是否在慢慢变成安逸？你还在成长吗？如果这是被动妥协——需要明确下一步：是重新激活管理野心，还是正式转向其他方向。",
        "zh-TW": "如果平衡是主動選擇的——恭喜。但定期檢查：平衡是否在變成安逸？如果是被動妥協——需要明確下一步方向。",
        en: "If your balanced state is an active choice—congratulations, you've found a sustainable model. But regularly check: is this balance slowly becoming complacency? Are you still growing? If this is passive compromise—clarify your next move: reignite management ambition or formally pivot to a different direction.",
      },
      risk: {
        "zh-CN": "倦怠信号模式：对管理工作既不热爱也不讨厌，只是在惯性中重复——这种「温水煮青蛙」式的倦怠最难被察觉。早期预警：如果你对同事的晋升消息既不羡慕也不释然，而是感到一种说不清的空洞，这是身份迷失的信号。偏离模式：「职业漂流」——没有明确的不满，也没有明确的方向，日复一日地消耗职业生命。",
        "zh-TW": "倦怠信號：對管理工作既不熱愛也不討厭——「溫水煮青蛙」式倦怠最難察覺。早期預警：對同事晉升感到空洞。偏離模式：「職業漂流」——沒有方向地消耗職業生命。",
        en: "Burnout signal pattern: Neither loving nor hating management, just repeating on autopilot—this 'boiling frog' burnout is hardest to detect. Early warning: If colleagues' promotion news evokes neither envy nor relief, but an indescribable hollowness, that's an identity drift signal. Derailment pattern: 'Career drift'—no clear dissatisfaction, no clear direction, consuming career life day by day.",
      },
    },
    low: {
      meaning: {
        "zh-CN": "10年以上低GM是一个已经固化的信号：管理从来不是你的追求。此阶段的关键不是改变这一点，而是确保你找到了不依赖管理晋升的可持续职业路径。",
        "zh-TW": "10年以上低GM是已固化的信號：管理從來不是你的追求。關鍵是確保找到了不依賴管理晉升的可持續路徑。",
        en: "Low GM after 10+ years is a solidified signal: management was never your pursuit. The key at this stage isn't changing this, but ensuring you've found a sustainable career path that doesn't depend on management promotion.",
      },
      characteristics: {
        "zh-CN": ["已明确拒绝管理道路且不后悔", "在专业贡献者或独立角色中找到了长期位置", "可能面临薪资天花板——很多组织只通过管理晋升加薪", "对管理者同事的处境既理解又庆幸自己不在那个位置"],
        "zh-TW": ["已明確拒絕管理道路", "在專業角色中找到了長期位置", "可能面臨薪資天花板"],
        en: ["Clearly rejected the management path without regret", "Found a long-term position as professional contributor or independent role", "May face salary ceiling—many organizations only raise pay through management promotion", "Understand but feel relieved not to be in managers' shoes"],
      },
      development: {
        "zh-CN": "你的身份定位是清晰的。需要关注的是：1）你的专业价值是否仍然被市场认可？2）你的收入是否足以支持你想要的生活方式？3）你在组织中是否有足够的影响力，还是被边缘化了？如果以上任何一个答案是否定的，可能需要调整——但调整的方式不一定是去做管理。",
        "zh-TW": "身份定位清晰。需要關注：專業價值是否被市場認可？收入是否足夠？在組織中是否被邊緣化？",
        en: "Your identity positioning is clear. What needs attention: 1) Is your professional value still recognized by the market? 2) Is your income sufficient for your desired lifestyle? 3) Do you have enough influence in the organization, or are you being marginalized? If any answer is no, adjustment is needed—but adjustment doesn't necessarily mean management.",
      },
      risk: {
        "zh-CN": "倦怠信号模式：虽然不做管理，但发现自己的专业角色也不再有挑战性——陷入「两边都不是」的身份困境。早期预警：如果你开始觉得自己的选择不被组织重视或理解，持续的孤立感会逐渐演变为慢性职业倦怠。偏离模式：「结构性边缘化」——在只认管理晋升的组织中，非管理路径的资深人士逐渐被排除在决策圈外。",
        "zh-TW": "倦怠信號：專業角色也不再有挑戰性——「兩邊都不是」的困境。早期預警：持續的孤立感會演變為慢性倦怠。偏離模式：「結構性邊緣化」——被排除在決策圈外。",
        en: "Burnout signal: Though not in management, your professional role also lacks challenge—trapped in a 'neither-here-nor-there' identity dilemma. Early warning: If you feel your choices aren't valued by the organization, sustained isolation can evolve into chronic career burnout. Derailment pattern: 'Structural marginalization'—in organizations that only recognize management promotion, non-management seniors are gradually excluded from decision-making circles.",
      },
    },
  },
  executive: {
    high: {
      meaning: {
        "zh-CN": "高管阶段高GM完全符合你的角色定位。你的核心驱动力和实际职责高度一致。",
        "zh-TW": "高管階段高GM完全符合你的角色定位。核心驅動力和實際職責高度一致。",
        en: "High GM at executive stage perfectly matches your role. Your core driver and actual responsibilities are highly aligned.",
      },
      characteristics: {
        "zh-CN": ["在领导和战略层面游刃有余", "享受组织建设和人才培养", "关注文化和制度建设", "思考的时间尺度是5-10年"],
        "zh-TW": ["在領導和戰略層面游刃有餘", "享受組織建設和人才培養", "關注文化和制度建設"],
        en: ["Comfortable at leadership and strategy level", "Enjoy organization building and talent development", "Focus on culture and institution building", "Think on 5-10 year timescales"],
      },
      development: {
        "zh-CN": "关注点：1）传承——培养接班人和领导梯队；2）影响力——从组织内部扩展到行业和社会；3）遗产——你想给这个组织留下什么。",
        "zh-TW": "關注點：傳承培養接班人、影響力擴展到行業、思考你想留下什麼。",
        en: "Focus areas: 1) Succession—develop successors and leadership pipeline; 2) Influence—extend from organization to industry and society; 3) Legacy—what you want to leave behind.",
      },
      risk: {
        "zh-CN": "风险：「控制欲过强」——不愿放手让下一代领导者成长。学会从「做决策者」变成「培养决策者」。",
        "zh-TW": "風險：控制慾過強，不願放手讓下一代成長。學會培養決策者。",
        en: "Risk: Excessive control—unwilling to let next-generation leaders grow. Learn to transition from 'being the decision maker' to 'developing decision makers'.",
      },
    },
    moderate: {
      meaning: {
        "zh-CN": "高管阶段中等GM可能意味着你在反思管理生涯的意义，或者开始关注管理以外的人生维度。",
        "zh-TW": "高管階段中等GM可能意味著你在反思管理生涯的意義。",
        en: "Moderate GM at executive stage may mean you're reflecting on your management career's meaning, or starting to focus on life dimensions beyond management.",
      },
      characteristics: {
        "zh-CN": ["管理已经成为习惯而非热情", "开始思考「退休后我是谁」", "可能在寻找新的意义来源", "对权力的需求减弱"],
        "zh-TW": ["管理已經成為習慣而非熱情", "開始思考「退休後我是誰」", "對權力需求減弱"],
        en: ["Management has become habit rather than passion", "Starting to think 'who am I after retirement'", "May be seeking new sources of meaning", "Reduced need for power"],
      },
      development: {
        "zh-CN": "这是正常的职业阶段变化。考虑：1）将管理经验转化为教练/顾问角色；2）投身公益或教育；3）开始第二人生的规划。管理不是身份，是一种能力。",
        "zh-TW": "這是正常的階段變化。考慮將管理經驗轉化為教練或顧問角色。",
        en: "This is a normal career stage shift. Consider: 1) Converting management experience into coaching/consulting; 2) Philanthropy or education; 3) Planning your second act. Management is a capability, not an identity.",
      },
      risk: {
        "zh-CN": "风险：因为惯性继续做不再热爱的管理工作，导致倦怠。给自己一个转型的时间窗口。",
        "zh-TW": "風險：因為慣性繼續做不再熱愛的管理工作。給自己轉型時間窗口。",
        en: "Risk: Continuing management work out of inertia when you no longer love it, leading to burnout. Give yourself a transition window.",
      },
    },
    low: {
      meaning: {
        "zh-CN": "高管阶段低GM通常出现在技术型或创业型领导者身上——管理是手段而非目的。",
        "zh-TW": "高管階段低GM通常出現在技術型或創業型領導者身上——管理是手段而非目的。",
        en: "Low GM at executive stage typically appears in technical or entrepreneurial leaders—management is a means, not an end.",
      },
      characteristics: {
        "zh-CN": ["通过产品/技术/愿景而非管理体系领导", "可能有一个很强的COO搭档", "管理职责是为了实现更大的目标", "对日常管理事务不耐烦"],
        "zh-TW": ["通過產品/技術/願景而非管理體系領導", "管理職責是為了實現更大目標", "對日常管理事務不耐煩"],
        en: ["Lead through product/tech/vision rather than management systems", "May have a strong COO partner", "Management duties serve a larger goal", "Impatient with daily management tasks"],
      },
      development: {
        "zh-CN": "确保你有一个互补的管理搭档来处理你不擅长或不感兴趣的管理事务。你的价值在于愿景和方向，让专业管理者处理执行。",
        "zh-TW": "確保有互補的管理搭檔處理你不擅長的事務。你的價值在於願景和方向。",
        en: "Ensure you have a complementary management partner to handle what you're not good at or interested in. Your value is in vision and direction—let professional managers handle execution.",
      },
      risk: {
        "zh-CN": "风险：因为不重视管理而导致组织混乱。即使你不喜欢管理，也不能忽视它。确保有人在做好这件事。",
        "zh-TW": "風險：因不重視管理導致組織混亂。確保有人在做好管理工作。",
        en: "Risk: Organizational chaos from neglecting management. Even if you don't enjoy it, you can't ignore it. Make sure someone is doing it well.",
      },
    },
  },
};

// ============================================================
// AU - Autonomy/Independence
// ============================================================
const AU_DATA: AnchorStageData = {
  early: {
    high: {
      meaning: {
        "zh-CN": "高AU意味着你对「自己决定工作方式和节奏」有强烈需求。你可能很快会对严格的组织规则感到窒息。",
        "zh-TW": "高AU意味著你對「自己決定工作方式和節奏」有強烈需求。",
        en: "High AU means you strongly need to decide your own work methods and pace. You may quickly feel suffocated by rigid organizational rules.",
      },
      characteristics: {
        "zh-CN": ["难以忍受微观管理", "喜欢灵活的工作时间和地点", "可能对传统办公室文化不适应", "更喜欢按自己的方式完成任务"],
        "zh-TW": ["難以忍受微觀管理", "喜歡靈活的工作時間和地點", "更喜歡按自己的方式完成任務"],
        en: ["Can't tolerate micromanagement", "Prefer flexible work schedule and location", "May not adapt to traditional office culture", "Prefer completing tasks in own way"],
      },
      development: {
        "zh-CN": "选择工作时优先考虑：1）远程/混合办公的公司；2）结果导向而非过程管控的团队；3）自由职业或创业可能性。前几年也需要建立专业能力，这样才有资本去要求自主权。",
        "zh-TW": "選擇工作時優先考慮遠程辦公、結果導向的團隊。前幾年需要建立專業能力，才有資本要求自主權。",
        en: "When choosing work, prioritize: 1) Remote/hybrid companies; 2) Results-oriented teams; 3) Freelancing or entrepreneurship possibilities. Build professional capability first—that gives you leverage to demand autonomy.",
      },
      risk: {
        "zh-CN": "风险：因为不愿妥协而频繁跳槽，没有积累足够的专业深度。自主权需要用能力来换取——先证明自己的价值，再谈条件。",
        "zh-TW": "風險：因不願妥協而頻繁跳槽。自主權需要用能力來換取。",
        en: "Risk: Frequent job-hopping because you won't compromise, without accumulating enough depth. Autonomy must be earned through proven value—prove yourself first, then negotiate terms.",
      },
    },
    moderate: {
      meaning: {
        "zh-CN": "中等AU说明你重视一定的自主空间，但不是极端追求。你能在结构化环境中工作，只要不被过度控制。",
        "zh-TW": "中等AU說明你重視一定的自主空間，但能在結構化環境中工作。",
        en: "Moderate AU indicates you value some autonomy but aren't extreme about it. You can work in structured environments as long as you're not over-controlled.",
      },
      characteristics: {
        "zh-CN": ["能接受合理的组织规则", "在关键事项上需要发言权", "不喜欢但能忍受偶尔的约束", "寻求「自由度较高」的岗位"],
        "zh-TW": ["能接受合理的組織規則", "在關鍵事項上需要發言權", "尋求自由度較高的職位"],
        en: ["Can accept reasonable organizational rules", "Need a voice on key matters", "Dislike but can tolerate occasional constraints", "Seek roles with higher degrees of freedom"],
      },
      development: {
        "zh-CN": "找到你的「自主底线」——哪些方面必须自己决定，哪些方面可以接受指导。与上级明确沟通你的工作风格偏好。",
        "zh-TW": "找到你的「自主底線」，與上級明確溝通你的工作風格偏好。",
        en: "Find your 'autonomy baseline'—what must you decide yourself, what can you accept guidance on. Clearly communicate your work style preferences to your manager.",
      },
      risk: {
        "zh-CN": "风险：在过于严格的组织中逐渐积累不满但不表达，最终爆发式离职。定期检查你的自主需求是否被满足。",
        "zh-TW": "風險：在過於嚴格的組織中逐漸積累不滿。定期檢查自主需求是否被滿足。",
        en: "Risk: Gradually accumulating frustration in overly strict organizations without expressing it, leading to explosive resignation. Regularly check if your autonomy needs are met.",
      },
    },
    low: {
      meaning: {
        "zh-CN": "低AU意味着自主权不是你的核心追求。你能够且可能更喜欢有明确指导和结构的工作环境。",
        "zh-TW": "低AU意味著自主權不是你的核心追求。你可能更喜歡有明確指導的環境。",
        en: "Low AU means autonomy isn't your core pursuit. You can work well and may even prefer environments with clear guidance and structure.",
      },
      characteristics: {
        "zh-CN": ["能在结构化环境中高效工作", "不排斥明确的上下级关系", "重视团队协作和共同决策", "可能觉得过多自由反而不安"],
        "zh-TW": ["能在結構化環境中高效工作", "不排斥明確的上下級關係", "重視團隊協作"],
        en: ["Work efficiently in structured environments", "Don't mind clear hierarchical relationships", "Value teamwork and collective decisions", "May feel uneasy with too much freedom"],
      },
      development: {
        "zh-CN": "大型组织和成熟企业可能很适合你。但注意不要过度依赖组织提供的安全感——也要培养独立思考和自主决策的能力。",
        "zh-TW": "大型組織和成熟企業可能很適合你。但注意不要過度依賴組織。",
        en: "Large organizations and mature companies may suit you well. But don't over-rely on organizational safety—also develop independent thinking and decision-making abilities.",
      },
      risk: {
        "zh-CN": "风险：过度依赖组织和上级的指导，一旦失去这些支持（如裁员、组织变革）会感到迷失。培养一定的自主决策能力作为保底。",
        "zh-TW": "風險：過度依賴組織，一旦失去支持會感到迷失。培養自主決策能力。",
        en: "Risk: Over-relying on organizational and supervisory guidance. If you lose that support (layoffs, restructuring), you may feel lost. Develop some self-directed decision-making as a safety net.",
      },
    },
  },
  mid: {
    high: {
      meaning: { "zh-CN": "中期高AU说明自主性是你已经验证的核心需求。你可能已经在自由职业、远程工作或创业中找到了满足。", "zh-TW": "中期高AU說明自主性是你已驗證的核心需求。", en: "Mid-career high AU confirms autonomy as your verified core need. You may have already found satisfaction in freelancing, remote work, or entrepreneurship." },
      characteristics: { "zh-CN": ["可能已经是自由职业者或远程工作者", "对组织约束的容忍度越来越低", "建立了足够的专业能力来支撑自主", "更看重时间自由和工作方式自由"], "zh-TW": ["可能已經是自由職業者或遠程工作者", "對組織約束的容忍度越來越低", "建立了足夠能力支撐自主"], en: ["May already be freelancing or working remotely", "Decreasing tolerance for organizational constraints", "Built enough expertise to support autonomy", "Value time freedom and work method freedom"] },
      development: { "zh-CN": "如果还没实现自主：1）开始做副业或兼职咨询；2）积累可迁移的专业品牌；3）建立多元收入来源。如果已经自主：关注可持续性——建立被动收入或系统化你的服务。", "zh-TW": "如果還沒實現自主，開始做副業或兼職諮詢，積累專業品牌。", en: "If not yet autonomous: 1) Start side projects or consulting; 2) Build a transferable personal brand; 3) Diversify income sources. If already autonomous: focus on sustainability—build passive income or systematize your services." },
      risk: { "zh-CN": "风险：过度追求自主导致孤立和收入不稳定。自主不等于孤立——需要建立可靠的专业网络和客户关系。", "zh-TW": "風險：過度追求自主導致孤立和收入不穩定。", en: "Risk: Excessive autonomy pursuit leading to isolation and income instability. Autonomy doesn't mean isolation—build reliable professional networks and client relationships." },
    },
    moderate: {
      meaning: { "zh-CN": "中期中等AU可能说明你找到了结构和自由之间的平衡点，或者在探索更灵活的工作模式。", "zh-TW": "中期中等AU可能說明你找到了結構和自由之間的平衡點。", en: "Mid-career moderate AU may indicate you've found a balance between structure and freedom, or you're exploring more flexible work modes." },
      characteristics: { "zh-CN": ["在组织内部争取到了较大自主空间", "可能在管理岗位上享有决策自由", "不需要完全脱离组织但需要尊重", "关注结果而非过程"], "zh-TW": ["在組織內部爭取到了較大自主空間", "關注結果而非過程"], en: ["Carved out significant autonomy within organization", "May enjoy decision-making freedom in management role", "Don't need to leave organization but need respect", "Focus on results not process"] },
      development: { "zh-CN": "继续维护你的自主空间。如果组织文化变化导致自主权减少，及时评估是否需要改变。", "zh-TW": "繼續維護你的自主空間。如果組織文化變化，及時評估。", en: "Continue maintaining your autonomy space. If organizational culture shifts reduce your autonomy, evaluate whether a change is needed promptly." },
      risk: { "zh-CN": "风险：组织变革（如被收购、换领导）可能突然剥夺你的自主权。保持一定的外部选项作为保障。", "zh-TW": "風險：組織變革可能突然剝奪自主權。保持外部選項。", en: "Risk: Organizational changes (acquisitions, leadership changes) may suddenly strip your autonomy. Maintain external options as insurance." },
    },
    low: {
      meaning: { "zh-CN": "中期低AU表明你在组织中找到了归属感，团队和组织对你的意义大于个人自由。", "zh-TW": "中期低AU表明你在組織中找到了歸屬感。", en: "Mid-career low AU indicates you've found belonging in your organization. Team and organization mean more to you than personal freedom." },
      characteristics: { "zh-CN": ["在组织中感到安全和被认可", "享受团队协作和组织资源", "不介意合理的规则和流程", "把组织发展和个人发展绑定"], "zh-TW": ["在組織中感到安全和被認可", "享受團隊協作", "把組織發展和個人發展綁定"], en: ["Feel safe and recognized in organization", "Enjoy teamwork and organizational resources", "Don't mind reasonable rules and processes", "Link organizational and personal development"] },
      development: { "zh-CN": "继续在组织内深化你的价值。但要注意：不要把所有鸡蛋放在一个篮子里。即使你喜欢组织环境，也要保持自己的市场价值和外部网络。", "zh-TW": "繼續在組織內深化價值，但保持市場價值和外部網絡。", en: "Continue deepening your value within the organization. But don't put all eggs in one basket—maintain your market value and external network even if you love your organizational environment." },
      risk: { "zh-CN": "风险：组织忠诚变成组织依赖。如果公司遭遇危机，你是否有独立生存的能力？", "zh-TW": "風險：組織忠誠變成組織依賴。", en: "Risk: Organizational loyalty becoming organizational dependence. If the company hits a crisis, can you survive independently?" },
    },
  },
  senior: {
    high: {
      meaning: { "zh-CN": "10年以上高AU，你对自主权的需求已经从「偏好」固化为「底线」。如果你仍在组织内工作，长期累积的结构性摩擦可能已经演变为慢性不满——你可能已经不是在「争取自由」，而是在「忍受束缚」。", "zh-TW": "10年以上高AU，自主權已從「偏好」固化為「底線」。長期結構性摩擦可能已演變為慢性不滿。", en: "High AU after 10+ years—your autonomy need has hardened from 'preference' to 'non-negotiable.' If still in an organization, years of structural friction may have evolved into chronic dissatisfaction—you may no longer be 'fighting for freedom' but 'enduring captivity.'" },
      characteristics: { "zh-CN": ["对组织约束的容忍度已经降到极低", "可能出现『自主倦怠』——不是发怒，而是麻木和放弃", "工作只是在「赚生活费」，真正的自我在工作之外", "面临「走还是留」的结构性拉扯，走有风险、留有痛苦"], "zh-TW": ["對組織約束容忍度極低", "可能出現『自主倦怠』——麻木和放棄", "工作只在「賺生活費」", "面臨「走還是留」的結構性拉扯"], en: ["Tolerance for organizational constraints at rock bottom", "Possible 'autonomy fatigue'—not anger, but numbness and resignation", "Work is just 'paying the bills'; real self exists outside work", "Facing structural 'stay or leave' tension—leaving has risks, staying has pain"] },
      development: { "zh-CN": "认真审视你的处境：1）你是否有足够的专业资本和财务储备来实现完全自主？如果有，为什么还没行动？2）如果没有，是否可以通过副业、咨询、自由职业逐步过渡？3）是否可以在现有组织内部谈判更大的自主空间？最危险的状态是「想走但不行动」——这会让你慢慢在抱怨中消耗掉。", "zh-TW": "認真審視處境：是否有足夠資本實現自主？是否可以逐步過渡？是否可以內部談判？最危險的是「想走但不行動」。", en: "Honestly assess your situation: 1) Do you have enough professional capital and financial reserves for full autonomy? If yes, why haven't you acted? 2) If not, can you transition gradually through side work, consulting, or freelancing? 3) Can you negotiate more autonomy within your current organization? The most dangerous state is 'wanting to leave but not acting'—this slowly consumes you in resentment." },
      risk: { "zh-CN": "倦怠信号模式：对组织规则从「反抗」变为「无视」——你开始在组织规则下「则演」而非真正参与。早期预警：如果你发现自己越来越少在工作中表达真实想法，只在工作外才感到「像自己」，这是严重的身份分裂信号。偏离模式：「慢性逃离」——不是突然辞职，而是逐渐减少投入、规避责任、在精神上已经「连在」了。", "zh-TW": "倦怠信號：對規則從「反抗」變為「無視」，開始「則演」。早期預警：只在工作外才感到「像自己」是身份分裂。偏離模式：「慢性逃離」——逐漸減少投入，精神上已「離線」。", en: "Burnout signal pattern: Response to organizational rules shifts from 'resistance' to 'indifference'—you start 'performing compliance' rather than truly participating. Early warning: If you increasingly suppress your real thoughts at work and only feel 'like yourself' outside work, that's a severe identity split signal. Derailment pattern: 'Slow escape'—not sudden resignation, but gradually reducing investment, avoiding responsibility, mentally already 'disconnected.'" },
    },
    moderate: {
      meaning: { "zh-CN": "10年以上中等AU可能意味着你在组织内成功争取到了足够的自主空间，或者你的自主需求随着年龄和责任的增加而自然调整了。关键是判断这个平衡是真实的还是强迫的。", "zh-TW": "10年以上中等AU可能意味著你在組織內爭取到了足夠自主空間，或自主需求隨責任增加而調整。關鍵是判斷平衡是否真實。", en: "Moderate AU after 10+ years may mean you've successfully carved out sufficient autonomy within the organization, or your autonomy needs have naturally adjusted with age and responsibility. The key is judging whether this balance is genuine or forced." },
      characteristics: { "zh-CN": ["在组织框架内找到了可接受的自由度", "不再像年轻时那样对约束强烈反应", "可能已将自主需求转移到工作方式和时间安排上", "对组织的期望变得更务实"], "zh-TW": ["在組織框架內找到了可接受的自由度", "不再對約束強烈反應", "對組織期望更務實"], en: ["Found acceptable freedom within organizational framework", "No longer react as intensely to constraints as when younger", "May have redirected autonomy needs to work methods and scheduling", "Expectations of organization have become more pragmatic"] },
      development: { "zh-CN": "保护你已经争取到的自主空间，同时评估它是否可持续。组织变革（换领导、被收购、文化转变）可能突然剥夺你的自主权。保持一定的外部选项作为保险。如果你的平衡是被迫的，要询问自己：这种妥协还能继续多久？", "zh-TW": "保護已爭取到的自主空間，評估它是否可持續。組織變革可能突然剥奪自主權。如果平衡是被迫的，問自己還能繼續多久。", en: "Protect the autonomy space you've earned, while assessing its sustainability. Organizational changes (new leadership, acquisitions, culture shifts) may suddenly strip your autonomy. Maintain external options as insurance. If your balance is forced, ask yourself: how much longer can this compromise last?" },
      risk: { "zh-CN": "倦怠信号模式：你对自主权的追求已经从「主动争取」变成了「被动防守」——不再开拓新的自由，只是守住现有的。早期预警：如果你发现自己对组织变化的反应不再是愤怒而是无力感，这是自主精神被消磨的信号。偏离模式：「内心辞职」——身体还在组织，但心理上已经与组织断开连接，只在最低限度内履行职责。", "zh-TW": "倦怠信號：自主權追求從「主動爭取」變成「被動防守」。早期預警：對變化的反應是無力感而非憤怒。偏離模式：「內心辞職」——心理上已斷開連接。", en: "Burnout signal: Autonomy pursuit has shifted from 'active expansion' to 'passive defense'—no longer opening new freedoms, just guarding existing ones. Early warning: If your response to organizational changes is helplessness rather than anger, your autonomous spirit is being worn down. Derailment pattern: 'Inner resignation'—body still in the organization, but psychologically disconnected, fulfilling duties at bare minimum." },
    },
    low: {
      meaning: { "zh-CN": "10年以上低AU说明你已经与组织深度融合，组织的框架和方向已成为你身份的一部分。这种忠诚和归属感在稳定时期是优势，但在变革时期可能成为双刃剑。", "zh-TW": "10年以上低AU說明你已與組織深度融合。這種忠誠在穩定時是優勢，變革時可能成為雙刃劍。", en: "Low AU after 10+ years confirms you've deeply merged with your organization. The organization's framework and direction have become part of your identity. This loyalty is an advantage in stable times, but a double-edged sword during transformation." },
      characteristics: { "zh-CN": ["组织身份和个人身份高度重叠", "可能没有认真思考过「没有这个组织我是谁」", "对组织的批评可能感到像对自己的攻击", "在组织重组或裁员中可能经历深层身份危机"], "zh-TW": ["組織身份和個人身份高度重疊", "可能沒思考過「沒有組織我是誰」", "在重組或裁員中可能經歷身份危機"], en: ["Organizational identity and personal identity highly overlapping", "May never have seriously considered 'who am I without this organization'", "Criticism of the organization may feel like personal attack", "May experience deep identity crisis during reorganization or layoffs"] },
      development: { "zh-CN": "培养一定的独立身份，即使你热爱你的组织。问自己：如果明天这个组织不存在了，我是谁？建立组织外的专业身份和社交网络，这不是不忠诚，而是自我保护。", "zh-TW": "培養一定的獨立身份。問自己：如果組織不存在了，我是誰？建立組織外的身份和網絡，這是自我保護。", en: "Cultivate some independent identity, even if you love your organization. Ask: If this organization ceased to exist tomorrow, who am I? Build professional identity and social networks outside the organization—this isn't disloyalty, it's self-protection." },
      risk: { "zh-CN": "倦怠信号模式：不是对工作本身倦怠，而是当组织发生变化时体验到不成比例的痛苦——因为你的身份太依赖组织了。早期预警：如果你发现自己无法客观地评价组织的决策，总是本能地为组织辩护，这可能是过度融合。偏离模式：「身份崩溃」——当组织发生重大变动（裁员、重组、换领导）时，低 AU者可能经历彻底的身份崩溃，因为他们的自我概念太依赖组织结构。", "zh-TW": "倦怠信號：組織變化時體驗不成比例的痛苦。早期預警：無法客觀評價組織決策是過度融合。偏離模式：「身份崩潰」——組織重大變動時經歷徹底崩潰。", en: "Burnout signal: Not burnout from work itself, but disproportionate pain when the organization changes—because your identity depends too much on it. Early warning: If you can't objectively evaluate organizational decisions and instinctively defend everything, that may be over-fusion. Derailment pattern: 'Identity collapse'—when major organizational disruption occurs (layoffs, restructuring), low-AU seniors may experience total identity breakdown because their self-concept depends too heavily on organizational structure." },
    },
  },
  executive: {
    high: {
      meaning: { "zh-CN": "高管阶段高AU可能让你更倾向于做独立董事、顾问、投资人等角色，而非传统的组织内高管。", "zh-TW": "高管階段高AU可能讓你更傾向獨立角色。", en: "High AU at executive stage may make you prefer independent director, advisor, or investor roles rather than traditional in-house executive positions." },
      characteristics: { "zh-CN": ["可能选择了portfolio career模式", "通过多个项目和角色获得满足", "不愿被单一组织束缚", "享受自由定义工作边界"], "zh-TW": ["可能選擇了多元職業模式", "不願被單一組織束縛", "享受自由定義工作邊界"], en: ["May have chosen a portfolio career model", "Find fulfillment through multiple projects and roles", "Unwilling to be bound by a single organization", "Enjoy freely defining work boundaries"] },
      development: { "zh-CN": "你的影响力不需要通过一个组织来实现。考虑：顾问委员会、天使投资、多板块经营、公益事业。自主+影响力是你这个阶段的最佳组合。", "zh-TW": "你的影響力不需要通過一個組織實現。自主+影響力是最佳組合。", en: "Your influence doesn't need to flow through one organization. Consider: advisory boards, angel investing, multi-venture management, philanthropy. Autonomy + influence is your ideal combination at this stage." },
      risk: { "zh-CN": "风险：太过分散导致缺乏深度影响。选择2-3个你真正在意的领域深度参与，而非表面性地参与十几个项目。", "zh-TW": "風險：太過分散缺乏深度影響。選擇2-3個領域深度參與。", en: "Risk: Too dispersed, lacking deep impact. Choose 2-3 areas you truly care about for deep involvement, rather than superficially engaging in a dozen projects." },
    },
    moderate: {
      meaning: { "zh-CN": "高管阶段中等AU说明你在组织领导和个人自由之间达成了和解。", "zh-TW": "高管階段中等AU說明你在組織領導和個人自由之間達成了和解。", en: "Moderate AU at executive stage indicates you've reconciled organizational leadership with personal freedom." },
      characteristics: { "zh-CN": ["在组织框架内享有充分的自主决策权", "不需要离开组织也能感到自由", "对组织有承诺但不被组织定义"], "zh-TW": ["在組織框架內享有充分自主權", "不需要離開組織也能感到自由"], en: ["Enjoy full autonomous decision-making within organizational framework", "Feel free without needing to leave the organization", "Committed to organization but not defined by it"] },
      development: { "zh-CN": "利用你的高管位置为组织创造更灵活的文化。你理解自主的价值，可以帮助组织吸引和留住高AU人才。", "zh-TW": "利用高管位置為組織創造更靈活的文化。", en: "Use your executive position to create a more flexible organizational culture. You understand autonomy's value and can help attract and retain high-AU talents." },
      risk: { "zh-CN": "风险：低估高AU员工的需求，因为你自己已经在一个自主的位置上。记住：你拥有的自主权是你的位置赋予的，不是所有人都有。", "zh-TW": "風險：低估高AU員工的需求。你的自主權是位置賦予的。", en: "Risk: Underestimating high-AU employees' needs because you're already in an autonomous position. Remember: your autonomy comes from your position, not everyone has that." },
    },
    low: {
      meaning: { "zh-CN": "高管阶段低AU完全正常——你在组织中找到了使命感和归属感，个人自由不是优先考虑。", "zh-TW": "高管階段低AU完全正常——你在組織中找到了使命感。", en: "Low AU at executive stage is perfectly normal—you've found purpose and belonging in your organization. Personal freedom isn't a priority." },
      characteristics: { "zh-CN": ["深度认同组织的使命和文化", "把组织的成功视为个人的成功", "愿意为组织利益牺牲个人便利"], "zh-TW": ["深度認同組織使命", "把組織成功視為個人成功"], en: ["Deeply identify with organization's mission and culture", "View organizational success as personal success", "Willing to sacrifice personal convenience for organizational benefit"] },
      development: { "zh-CN": "确保你的投入是可持续的。即使热爱组织，也要维护好健康、家庭和个人关系。把组织利益等同于个人利益是危险的——组织可以替换你，但你的健康和家庭不能。", "zh-TW": "確保你的投入可持續。維護好健康和家庭。", en: "Ensure your commitment is sustainable. Even loving your organization, maintain health, family, and personal relationships. Equating organizational interests with personal interests is dangerous—the organization can replace you, but your health and family cannot." },
      risk: { "zh-CN": "风险：在组织中燃尽自己。长期的自我牺牲可能导致健康问题和关系破裂。学会设定边界。", "zh-TW": "風險：在組織中燃盡自己。學會設定邊界。", en: "Risk: Burning yourself out in the organization. Long-term self-sacrifice can lead to health issues and relationship breakdowns. Learn to set boundaries." },
    },
  },
};

// ============================================================
// SE - Security/Stability
// ============================================================
const SE_DATA: AnchorStageData = {
  early: {
    high: {
      meaning: { "zh-CN": "高SE意味着你非常重视职业的稳定性和可预测性。你愿意为安全感牺牲一些其他东西（如高薪、刺激感）。", "zh-TW": "高SE意味著你非常重視職業的穩定性和可預測性。", en: "High SE means you highly value career stability and predictability. You're willing to sacrifice some things (high pay, excitement) for security." },
      characteristics: { "zh-CN": ["倾向选择大公司或国企事业单位", "重视福利、保险和退休金", "对创业或跳槽持谨慎态度", "偏好可预测的职业发展路径"], "zh-TW": ["傾向選擇大公司或穩定機構", "重視福利和保障", "對創業持謹慎態度"], en: ["Prefer large companies or stable institutions", "Value benefits, insurance, and retirement plans", "Cautious about entrepreneurship or job-hopping", "Prefer predictable career development paths"] },
      development: { "zh-CN": "你的选择方向：体制内、大企业、央企国企、事业单位。但要注意：1）稳定不等于不发展，即使在稳定环境中也要持续提升能力；2）过度追求稳定可能错过重要的成长机会。", "zh-TW": "你的選擇方向：大企業、穩定機構。但穩定不等於不發展。", en: "Your direction: large corporations, government, stable institutions. But note: 1) Stability doesn't mean no development—keep growing even in stable environments; 2) Excessive stability-seeking may cause you to miss important growth opportunities." },
      risk: { "zh-CN": "风险：过度依赖组织提供的安全感，忽视个人能力的市场竞争力。「铁饭碗」心态可能让你在35岁面临被淘汰的风险。", "zh-TW": "風險：過度依賴組織安全感，忽視個人市場競爭力。", en: "Risk: Over-relying on organizational security while neglecting personal market competitiveness. An 'iron rice bowl' mentality may leave you vulnerable at 35." },
    },
    moderate: {
      meaning: { "zh-CN": "中等SE说明你看重稳定但不是唯一考量。你能在稳定性和发展机会之间做合理权衡。", "zh-TW": "中等SE說明你看重穩定但不是唯一考量。", en: "Moderate SE means you value stability but it's not your only consideration. You can reasonably balance stability and growth opportunities." },
      characteristics: { "zh-CN": ["能接受一定的不确定性", "会在风险和回报之间权衡", "不排斥新机会但会评估风险", "重视基本保障但不过度追求"], "zh-TW": ["能接受一定的不確定性", "會在風險和回報之間權衡"], en: ["Can accept some uncertainty", "Weigh risks against rewards", "Open to new opportunities but assess risks", "Value basic security without over-pursuing it"] },
      development: { "zh-CN": "保持平衡：确保有基本的财务安全网（储蓄、保险），同时不要因为害怕风险而放弃所有有挑战性的机会。", "zh-TW": "保持平衡：確保有財務安全網，同時不要放棄有挑戰的機會。", en: "Maintain balance: Ensure a basic financial safety net (savings, insurance) while not letting risk aversion prevent you from taking on challenging opportunities." },
      risk: { "zh-CN": "风险：在需要做出大胆决策时犹豫不决。有时候最大的风险是不冒风险。", "zh-TW": "風險：在需要大膽決策時猶豫不決。有時最大風險是不冒風險。", en: "Risk: Hesitating when bold decisions are needed. Sometimes the biggest risk is not taking any risk." },
    },
    low: {
      meaning: { "zh-CN": "低SE意味着安全感不是你的核心驱动力。你可能更愿意为了成长、自由或挑战而承受不确定性。", "zh-TW": "低SE意味著安全感不是你的核心驅動力。", en: "Low SE means security isn't your core driver. You're likely willing to endure uncertainty for growth, freedom, or challenge." },
      characteristics: { "zh-CN": ["不害怕跳槽或职业转型", "可能考虑创业或自由职业", "对「稳定但无聊」的工作没有兴趣", "愿意承担计算过的风险"], "zh-TW": ["不害怕跳槽或職業轉型", "可能考慮創業", "愿意承擔計算過的風險"], en: ["Not afraid of job changes or career transitions", "May consider entrepreneurship or freelancing", "No interest in 'stable but boring' work", "Willing to take calculated risks"] },
      development: { "zh-CN": "利用你的风险承受能力追求更高的回报和成长。但确保你有基本的财务规划——勇敢不等于鲁莽。", "zh-TW": "利用你的風險承受力追求更高回報，但確保有基本財務規劃。", en: "Use your risk tolerance to pursue higher returns and growth. But ensure basic financial planning—courage isn't recklessness." },
      risk: { "zh-CN": "风险：忽视基本的财务安全导致在职业低谷时陷入困境。即使不追求稳定，也需要有3-6个月的应急储备。", "zh-TW": "風險：忽視基本財務安全。即使不追求穩定，也需要應急儲備。", en: "Risk: Ignoring basic financial security, leading to difficulties during career lows. Even if not stability-seeking, maintain a 3-6 month emergency fund." },
    },
  },
  mid: {
    high: {
      meaning: { "zh-CN": "中期高SE说明稳定性是你已经验证的长期需求。你可能已经在一个稳定的组织中建立了深厚的根基。", "zh-TW": "中期高SE說明穩定性是你已驗證的長期需求。", en: "Mid-career high SE confirms stability as your verified long-term need. You've likely established deep roots in a stable organization." },
      characteristics: { "zh-CN": ["在组织中有稳定的位置和人脉", "对突然的变化感到焦虑", "重视长期利益如养老和医疗", "可能拒绝过有风险的晋升机会"], "zh-TW": ["在組織中有穩定的位置", "對突然變化感到焦慮", "重視長期利益"], en: ["Have a stable position and network in organization", "Feel anxious about sudden changes", "Value long-term benefits like retirement and healthcare", "May reject risky promotion opportunities"] },
      development: { "zh-CN": "在稳定的基础上寻求发展：1）深化专业能力让自己不可替代；2）建立组织内外的专业网络；3）持续学习以应对行业变化。稳定不等于停止成长。", "zh-TW": "在穩定基礎上尋求發展：深化專業能力，建立網絡，持續學習。", en: "Seek growth on a stable foundation: 1) Deepen expertise to become irreplaceable; 2) Build professional networks inside and outside; 3) Keep learning to adapt to industry changes. Stability doesn't mean stopping growth." },
      risk: { "zh-CN": "风险：行业巨变时缺乏应对能力。即使在稳定的岗位上，也要关注行业趋势，为可能的变化做准备。AI和自动化正在改变很多「稳定」岗位。", "zh-TW": "風險：行業巨變時缺乏應對能力。AI和自動化正在改變很多「穩定」職位。", en: "Risk: Lacking adaptability when industry disruption hits. Even in stable positions, watch industry trends and prepare for potential changes. AI and automation are transforming many 'stable' jobs." },
    },
    moderate: {
      meaning: { "zh-CN": "中期中等SE可能意味着你在稳定和发展之间找到了舒适区，或者你的安全需求已经被基本满足。", "zh-TW": "中期中等SE可能意味著你在穩定和發展之間找到了舒適區。", en: "Mid-career moderate SE may mean you've found a comfort zone between stability and growth, or your security needs are basically met." },
      characteristics: { "zh-CN": ["有足够的储蓄和保障给了你信心", "愿意在安全的基础上尝试新事物", "不再那么害怕变化", "关注生活质量而非仅仅是工作保障"], "zh-TW": ["有足夠儲蓄給了你信心", "願意在安全基礎上嘗試新事物"], en: ["Sufficient savings and security give you confidence", "Willing to try new things from a secure base", "Not as afraid of change anymore", "Focus on quality of life, not just job security"] },
      development: { "zh-CN": "这是一个很好的状态。利用你的安全基础去探索一些有趣但有风险的方向——副业、学习新技能、或者在公司内部尝试新项目。", "zh-TW": "利用你的安全基礎探索有趣方向——副業、新技能、新專案。", en: "This is a good position. Use your security base to explore interesting but risky directions—side projects, new skills, or internal ventures." },
      risk: { "zh-CN": "风险：舒适区变成安逸区。定期问自己：如果明天失去现在的工作，我还有竞争力吗？", "zh-TW": "風險：舒適區變成安逸區。定期問自己是否還有競爭力。", en: "Risk: Comfort zone becoming complacency zone. Regularly ask yourself: If I lost this job tomorrow, would I still be competitive?" },
    },
    low: {
      meaning: { "zh-CN": "中期低SE说明你不把安全感作为职业选择的主要标准。你可能在追求更高维度的满足。", "zh-TW": "中期低SE說明你不把安全感作為主要標準。", en: "Mid-career low SE indicates you don't use security as your main career criterion. You're likely pursuing higher-level fulfillment." },
      characteristics: { "zh-CN": ["可能经历过职业转型或创业", "对不确定性有较高的心理承受力", "不被「失去」的恐惧驱动", "看重意义和成长超过保障"], "zh-TW": ["可能經歷過職業轉型或創業", "對不確定性有較高承受力"], en: ["May have experienced career transitions or entrepreneurship", "High psychological tolerance for uncertainty", "Not driven by fear of loss", "Value meaning and growth over security"] },
      development: { "zh-CN": "你的冒险精神是优势，但确保有理性的风险管理。建立「最低安全线」：保证家庭基本需求不受影响的情况下去冒险。", "zh-TW": "你的冒險精神是優勢，但確保有理性的風險管理。", en: "Your adventurous spirit is an asset, but ensure rational risk management. Establish a 'minimum safety line': take risks while ensuring your family's basic needs are covered." },
      risk: { "zh-CN": "风险：随着年龄增长（尤其有家庭后），安全需求可能会上升。提前规划如何在追求理想的同时保障基本安全。", "zh-TW": "風險：隨年齡增長安全需求可能上升。提前規劃。", en: "Risk: As you age (especially with a family), security needs may rise. Plan ahead for how to pursue ideals while maintaining basic security." },
    },
  },
  senior: {
    high: {
      meaning: { "zh-CN": "10年以上高SE，稳定性已经深度嵌入你的职业身份。但此阶段的结构性矛盾是：你赖以生存的「稳定」本身可能正在被行业变革侵蚀。AI、自动化、组织转型都在重新定义「安全」的含义。", "zh-TW": "10年以上高SE，穩定性已深度嵌入職業身份。但你賴以生存的「穩定」可能正被行業變革侵蝕。", en: "High SE after 10+ years—stability is deeply embedded in your career identity. But the structural contradiction at this stage is: the very 'stability' you depend on may be eroding through industry transformation. AI, automation, and organizational restructuring are redefining what 'security' means." },
      characteristics: { "zh-CN": ["对行业变革感到深层焦虑但不知如何应对", "可能已经感觉到「铁饭碗」在松动但拒绝承认", "对新技术和新模式的学习动力下降", "开始计算「还能撞多久」而非「还能成长多少」"], "zh-TW": ["對行業變革感到深層焦慮", "感覺「鐵飯碗」在鬆動但拒絕承認", "學習動力下降", "開始計算「還能撞多久」"], en: ["Deep anxiety about industry transformation but unsure how to respond", "May already feel the 'iron rice bowl' loosening but refuse to acknowledge it", "Declining motivation to learn new technologies and models", "Starting to calculate 'how much longer can I coast' rather than 'how much more can I grow'"] },
      development: { "zh-CN": "重新定义「安全」：1）从「岗位安全」转向「能力安全」——你的竞争力应该来自你能做什么，而不是你在哪个位置；2）主动学习新技能，即使感觉不舒服——这是你能给自己的最好保险；3）建立组织外的专业网络和声誉，这是第二层安全网。", "zh-TW": "重新定義「安全」：從「職位安全」轉向「能力安全」；主動學習新技能；建立組織外的專業網絡。", en: "Redefine 'security': 1) Shift from 'position security' to 'capability security'—your competitiveness should come from what you can do, not where you sit; 2) Proactively learn new skills, even if uncomfortable—this is the best insurance you can give yourself; 3) Build professional networks and reputation outside the organization as a second safety net." },
      risk: { "zh-CN": "倦怠信号模式：不是对工作本身倦怠，而是对「稳定可能被打破」的持续焦虑引发的消耗性疲劳。每天带着潜在危机感工作，却不采取行动。早期预警：如果你发现自己越来越多地关注行业负面新闻（裁员、倒闭、AI替代）而影响睡眠和情绪，这是安全焦虑已经侵入日常生活的信号。偏离模式：「鸵鸟式生存」——拒绝承认威胁，不做任何准备，用「不想那么多」来逃避，直到危机真正来临时完全没有应对能力。", "zh-TW": "倦怠信號：對「穩定可能被打破」的持續焦慮引發消耗性疲勢。早期預警：過度關注行業負面新聞影響生活。偏離模式：「鴵鳥式生存」——拒絕承認威脅，不做準備。", en: "Burnout signal: Not burnout from work itself, but exhausting anxiety about 'stability being disrupted.' Working daily with a sense of latent crisis but taking no action. Early warning: If you increasingly consume negative industry news (layoffs, closures, AI replacement) and it affects sleep and mood, security anxiety has invaded daily life. Derailment pattern: 'Ostrich survival'—refusing to acknowledge threats, making no preparations, using 'I'd rather not think about it' to avoid reality, until crisis arrives with zero coping ability." },
    },
    moderate: {
      meaning: { "zh-CN": "10年以上中等SE可能意味着你的安全感已经被基本满足，或者你已经学会了在安全和发展之间动态平衡。但随着退休地平线变得可见，你的安全计算可能正在发生变化。", "zh-TW": "10年以上中等SE可能意味著安全感已被基本滿足，或學會了動態平衡。但隨著退休地平線變得可見，計算可能在變化。", en: "Moderate SE after 10+ years may mean your security needs are basically met, or you've learned dynamic balancing between safety and growth. But as the retirement horizon becomes visible, your security calculus may be shifting." },
      characteristics: { "zh-CN": ["财务上有一定积累，给了你一定底气", "开始认真思考退休规划和老年保障", "对风险的态度变得更加审慎", "可能开始为下一代（子女教育）做财务规划"], "zh-TW": ["財務上有一定積累", "開始認真思考退休規劃", "對風險更審慎", "為下一代做規劃"], en: ["Some financial accumulation provides a degree of confidence", "Beginning to seriously consider retirement planning and old-age security", "Attitude toward risk becoming more cautious", "May be starting financial planning for next generation (children's education)"] },
      development: { "zh-CN": "利用你的财务缓冲做一些有控制的探索。这可能是你最后一个能够较低风险地尝试新方向的窗口期。同时认真做财务规划：不是因为焦虑，而是因为清晰的规划能减少焦虑。", "zh-TW": "利用財務緩衝做有控制的探索。認真做財務規劃以減少焦慮。", en: "Use your financial buffer for controlled exploration. This may be your last window to try new directions at relatively low risk. Also do serious financial planning—not from anxiety, but because clear planning reduces anxiety." },
      risk: { "zh-CN": "倦怠信号模式：工作变成了纯粹的「赚钱工具」，你不再关心工作本身是否有意义，只关心它能不能继续提供稳定收入。早期预警：如果你对财务计划的兴趣远超对职业发展的兴趣，可能意味着你已经在精神上「退休」了。偏离模式：「提前退休综合征」——人还在工作，但心态已经是退休状态，只在等时间到。", "zh-TW": "倦怠信號：工作變成純粹「賺錢工具」。早期預警：對財務的興趣遠超職業發展。偏離模式：「提前退休綜合徵」——心態已退休。", en: "Burnout signal: Work becomes purely a 'money-making tool'—you no longer care if work is meaningful, only if it continues providing stable income. Early warning: If your interest in financial planning far exceeds your interest in career development, you may have already 'retired' mentally. Derailment pattern: 'Premature retirement syndrome'—still at work but mentally in retirement mode, just running out the clock." },
    },
    low: {
      meaning: { "zh-CN": "10年以上低SE说明你对风险的高容忍度是长期稳定的特质，不是年轻时的冲动。但随着身体和家庭责任的变化，你可能需要重新审视风险承受能力和实际责任之间的关系。", "zh-TW": "10年以上低SE說明你對風險的高容忍度是長期穩定的特質。但可能需要重新審視風險和責任的關係。", en: "Low SE after 10+ years confirms your high risk tolerance is a stable trait, not youthful impulsiveness. But as body and family responsibilities change, you may need to reassess the relationship between risk appetite and actual obligations." },
      characteristics: { "zh-CN": ["仍然高度容忍不确定性", "可能已经历经过多次职业转型或创业", "对「安全」的定义与多数人不同", "家人可能对你的风险偏好感到压力"], "zh-TW": ["仍然高度容忍不確定性", "可能歷經多次轉型或創業", "家人可能對你的風險偏好感到壓力"], en: ["Still highly tolerant of uncertainty", "May have gone through multiple career transitions or startups", "Define 'security' differently from most people", "Family may feel stressed by your risk appetite"] },
      development: { "zh-CN": "你的风险承受能力是优势，但需要更成熟地使用它。问自己：1）我的风险偏好是否已经超过了我的实际承受能力？2）我身边的人（家人、合伙人、团队）是否能承受我的风险水平？3）我是在「理性冒险」还是「习惯性冒险」？", "zh-TW": "風險承受力是優勢，但需更成熟地使用。問自己：風險偏好是否超過實際承受力？周圍的人能否承受？", en: "Your risk tolerance is an advantage, but use it more maturely. Ask yourself: 1) Has my risk appetite exceeded my actual capacity? 2) Can the people around me (family, partners, team) handle my risk level? 3) Am I 'rationally risk-taking' or 'habitually risk-taking'?" },
      risk: { "zh-CN": "倦怠信号模式：你可能不会经历传统的工作倦怠，但可能经历「关系倦怠」——因为你的风险偏好和家人的安全需求之间的长期张力耗穽了亲密关系。早期预警：如果你的伴侣对你的职业决策越来越没有信任，这不是他们的问题——你需要重新建立共识。偏离模式：「孤狼式生存」——因为长期的风险偏好差异，渐渐失去了能够理解和支持你的人，变得越来越孤立。", "zh-TW": "倦怠信號：可能經歷「關係倦怠」——風險偏好與家人安全需求的張力耗穽關係。早期預警：伴侶對你的決策越來越沒信任。偏離模式：「孤狼式生存」——游失支持者，變得孤立。", en: "Burnout signal: You may not experience traditional work burnout, but 'relationship burnout'—long-term tension between your risk appetite and family's security needs eroding intimate relationships. Early warning: If your partner trusts your career decisions less and less, that's not their problem—you need to rebuild consensus. Derailment pattern: 'Lone wolf survival'—due to chronic risk preference differences, gradually losing people who understand and support you, becoming increasingly isolated." },
    },
  },
  executive: {
    high: {
      meaning: { "zh-CN": "高管阶段高SE可能意味着你正在思考退休规划、财富传承和长期稳定性。", "zh-TW": "高管階段高SE可能意味著你正在思考退休規劃和財富傳承。", en: "High SE at executive stage may mean you're thinking about retirement planning, wealth transfer, and long-term stability." },
      characteristics: { "zh-CN": ["关注长期财务规划", "可能在为退休后的生活做准备", "重视组织的长期可持续性", "谨慎对待高风险决策"], "zh-TW": ["關注長期財務規劃", "重視組織的長期可持續性"], en: ["Focus on long-term financial planning", "May be preparing for post-retirement life", "Value organizational long-term sustainability", "Cautious with high-risk decisions"] },
      development: { "zh-CN": "确保你的稳定追求不会阻碍组织的创新和变革。高管的安全感应该来自能力和影响力，而非固守现状。", "zh-TW": "確保穩定追求不阻礙組織創新。安全感應來自能力而非固守現狀。", en: "Ensure your stability pursuit doesn't hinder organizational innovation. Executive security should come from capabilities and influence, not clinging to the status quo." },
      risk: { "zh-CN": "风险：「守成」心态阻碍组织转型。在变革时代，最大的风险可能是不变。", "zh-TW": "風險：「守成」心態阻礙組織轉型。", en: "Risk: A 'preserving' mindset blocking organizational transformation. In an era of change, the biggest risk may be not changing." },
    },
    moderate: {
      meaning: { "zh-CN": "高管阶段中等SE是比较健康的状态——你既不过度保守也不鲁莽冒进。", "zh-TW": "高管階段中等SE是比較健康的狀態。", en: "Moderate SE at executive stage is quite healthy—you're neither overly conservative nor recklessly aggressive." },
      characteristics: { "zh-CN": ["能在稳定和创新之间做出平衡决策", "有充足的资源给了你信心", "关注可持续发展而非短期波动"], "zh-TW": ["能在穩定和創新之間平衡", "有充足資源給了信心"], en: ["Can make balanced decisions between stability and innovation", "Sufficient resources give you confidence", "Focus on sustainable development, not short-term fluctuations"] },
      development: { "zh-CN": "利用你的平衡心态帮助组织在稳定基础上寻找创新机会。你既理解安全的需要也理解冒险的价值。", "zh-TW": "利用平衡心態幫助組織在穩定基礎上尋找創新。", en: "Use your balanced mindset to help the organization find innovation opportunities on a stable foundation. You understand both the need for security and the value of risk-taking." },
      risk: { "zh-CN": "风险：在关键时刻可能过于谨慎。有时需要果断的决策，即使有风险。", "zh-TW": "風險：在關鍵時刻可能過於謹慎。", en: "Risk: May be too cautious at critical moments. Sometimes bold decisions are needed, even with risk." },
    },
    low: {
      meaning: { "zh-CN": "高管阶段低SE通常出现在连续创业者或变革型领导者身上。你享受不确定性带来的刺激和机会。", "zh-TW": "高管階段低SE通常出現在連續創業者或變革型領導者身上。", en: "Low SE at executive stage typically appears in serial entrepreneurs or transformational leaders. You enjoy the excitement and opportunities that uncertainty brings." },
      characteristics: { "zh-CN": ["对风险有很高的承受力", "可能经历过多次失败和重来", "把不确定性视为机会而非威胁"], "zh-TW": ["對風險有很高承受力", "把不確定性視為機會"], en: ["Very high risk tolerance", "May have experienced multiple failures and restarts", "View uncertainty as opportunity, not threat"] },
      development: { "zh-CN": "你的冒险精神可能让组织不安——确保团队能跟上你的节奏，并为他们提供足够的安全感。好的领导者不是消除不确定性，而是帮助团队在不确定性中找到方向。", "zh-TW": "你的冒險精神可能讓團隊不安。好的領導者幫助團隊在不確定性中找到方向。", en: "Your risk appetite may unsettle your organization—ensure your team can keep up and provide them sufficient security. Good leaders don't eliminate uncertainty; they help teams find direction within it." },
      risk: { "zh-CN": "风险：忽视团队对稳定性的需求。不是每个人都和你一样享受不确定性。", "zh-TW": "風險：忽視團隊對穩定性的需求。", en: "Risk: Ignoring your team's need for stability. Not everyone thrives in uncertainty like you do." },
    },
  },
};

// ============================================================
// EC - Entrepreneurial Creativity
// ============================================================
const EC_DATA: AnchorStageData = {
  early: {
    high: {
      meaning: { "zh-CN": "高EC意味着你有强烈的创造冲动——想要建立属于自己的事物。这个驱动力在职场初期可能让你焦躁不安。", "zh-TW": "高EC意味著你有強烈的創造衝動——想要建立屬於自己的事物。", en: "High EC means you have a strong creative urge—wanting to build something of your own. This drive may make you restless early in your career." },
      characteristics: { "zh-CN": ["脑子里总有新想法和商业点子", "可能已经尝试过小型创业", "对「给别人打工」有本能的抗拒", "喜欢从0到1的过程"], "zh-TW": ["腦子裡總有新想法", "可能已嘗試過小型創業", "對「給別人打工」有本能的抗拒"], en: ["Always have new ideas and business concepts", "May have already tried small ventures", "Instinctive resistance to 'working for others'", "Love the 0-to-1 process"] },
      development: { "zh-CN": "前3-5年策略：1）在大公司学习商业运作、管理方法和行业知识——把打工当「带薪学习」；2）业余时间做小项目验证创业能力；3）建立人脉和资源网络。太早创业的最大问题是缺乏经验和资源。", "zh-TW": "前3-5年：在大公司學習商業運作，業餘做小專案驗證，建立人脈。", en: "Strategy for first 3-5 years: 1) Learn business operations, management, and industry knowledge at a company—treat employment as 'paid education'; 2) Validate entrepreneurial skills through side projects; 3) Build networks and resources. The biggest problem with too-early entrepreneurship is lack of experience and resources." },
      risk: { "zh-CN": "风险：过早创业，没有足够的经验、资金和人脉。统计数据显示，有3-5年工作经验的创业者成功率更高。但如果你遇到了真正的市场机会，不要因为「时机不对」而错过。", "zh-TW": "風險：過早創業。有3-5年經驗的創業者成功率更高。", en: "Risk: Premature entrepreneurship without sufficient experience, capital, and networks. Statistics show entrepreneurs with 3-5 years of work experience have higher success rates. But don't let 'bad timing' make you miss a real market opportunity." },
    },
    moderate: { meaning: { "zh-CN": "中等EC说明你有一定的创业兴趣但不是强迫性的。你可能更适合在组织内部做创新。", "zh-TW": "中等EC說明你有一定的創業興趣但不是強迫性的。", en: "Moderate EC indicates entrepreneurial interest that isn't compulsive. You may be better suited for intrapreneurship." }, characteristics: { "zh-CN": ["对创新有兴趣但不一定想自己开公司", "可能喜欢组织内部的创新项目", "有创造力但也需要一定的安全感", "观察别人创业时有兴趣但谨慎"], "zh-TW": ["對創新有興趣但不一定想開公司", "喜歡組織內的創新專案"], en: ["Interested in innovation but not necessarily own company", "May enjoy internal innovation projects", "Creative but also need some security", "Watch others' entrepreneurship with interest but caution"] }, development: { "zh-CN": "探索「内部创业」机会：新产品线、新市场、内部孵化器。这让你既能发挥创造力又有组织的资源支持。", "zh-TW": "探索「內部創業」機會：新產品線、內部孵化器。", en: "Explore intrapreneurship opportunities: new product lines, new markets, internal incubators. This lets you exercise creativity with organizational resource support." }, risk: { "zh-CN": "风险：永远停留在「想但不敢做」的状态。如果创业对你真的重要，需要设定一个行动计划。", "zh-TW": "風險：永遠停留在「想但不敢做」的狀態。", en: "Risk: Permanently stuck in 'want to but afraid to' mode. If entrepreneurship truly matters to you, set an action plan." } },
    low: { meaning: { "zh-CN": "低EC意味着创业和创造新事物不是你的核心驱动力。你可能更喜欢在已有的框架中优化和执行。", "zh-TW": "低EC意味著創業不是你的核心驅動力。", en: "Low EC means entrepreneurship isn't your core driver. You may prefer optimizing and executing within existing frameworks." }, characteristics: { "zh-CN": ["对创业的风险和不确定性感到不安", "更喜欢改进现有事物而非创造新事物", "不需要「自己的事业」来获得满足感", "倾向执行明确的任务而非开创新方向"], "zh-TW": ["對創業風險感到不安", "更喜歡改進現有事物"], en: ["Uncomfortable with entrepreneurial risk and uncertainty", "Prefer improving existing things over creating new ones", "Don't need 'own business' for fulfillment", "Prefer executing clear tasks over pioneering new directions"] }, development: { "zh-CN": "你的价值在于把想法变成现实——创业者需要像你这样的人来执行。在团队中找到你的执行者角色，也是非常有价值的贡献。", "zh-TW": "你的價值在於把想法變成現實。找到你的執行者角色。", en: "Your value is turning ideas into reality—entrepreneurs need people like you to execute. Finding your executor role in a team is also a highly valuable contribution." }, risk: { "zh-CN": "风险：在需要创新的岗位上感到不适应。选择能发挥你执行和优化能力的角色。", "zh-TW": "風險：在需要創新的職位上感到不適應。", en: "Risk: Feeling uncomfortable in roles requiring innovation. Choose roles that leverage your execution and optimization abilities." } },
  },
  mid: {
    high: { meaning: { "zh-CN": "中期高EC——如果你还没创业，可能正在认真计划中。如果已经创业，你正在验证你的创业能力。", "zh-TW": "中期高EC——如果你還沒創業，可能正在認真計劃。", en: "Mid-career high EC—if you haven't started a business yet, you're probably seriously planning. If you already have, you're validating your entrepreneurial capabilities." }, characteristics: { "zh-CN": ["积累了足够的经验和资源", "创业冲动越来越强", "可能已经有了商业计划", "在等待合适的时机或伙伴"], "zh-TW": ["積累了足夠經驗和資源", "創業衝動越來越強"], en: ["Accumulated sufficient experience and resources", "Entrepreneurial urge growing stronger", "May already have a business plan", "Waiting for the right timing or partners"] }, development: { "zh-CN": "如果你决定创业：1）验证市场需求再投入全部资源；2）保持6-12个月的生活储备金；3）找到互补的联合创始人；4）从最小可行产品（MVP）开始，快速迭代。", "zh-TW": "如果決定創業：驗證市場需求，保持儲備金，找互補夥伴，從MVP開始。", en: "If you decide to start up: 1) Validate market demand before committing all resources; 2) Maintain 6-12 months of living reserves; 3) Find complementary co-founders; 4) Start with MVP, iterate quickly." }, risk: { "zh-CN": "风险：「完美主义陷阱」——永远在准备，永远觉得条件不够成熟。如果你已经准备了3年以上还没开始，可能需要重新评估你是否真的想创业。", "zh-TW": "風險：完美主義陷阱——永遠在準備。如果準備了3年以上還沒開始，需要重新評估。", en: "Risk: 'Perfectionism trap'—always preparing, never feeling ready enough. If you've been preparing for 3+ years without starting, reassess whether you truly want to entrepreneur." } },
    moderate: { meaning: { "zh-CN": "中期中等EC可能表示你的创业热情有所调整，或者你找到了在组织内发挥创造力的方式。", "zh-TW": "中期中等EC可能表示你找到了在組織內發揮創造力的方式。", en: "Mid-career moderate EC may indicate adjusted entrepreneurial enthusiasm, or you've found ways to be creative within organizations." }, characteristics: { "zh-CN": ["可能在组织内推动了创新项目", "创业冲动不像年轻时那么强烈", "更理性地看待创业风险和回报", "可能对「生活方式创业」更感兴趣"], "zh-TW": ["可能在組織內推動了創新專案", "更理性看待創業風險"], en: ["May have driven innovation projects within organization", "Entrepreneurial urge less intense than when younger", "More rational about entrepreneurial risks and rewards", "May be more interested in 'lifestyle business'"] }, development: { "zh-CN": "考虑「轻创业」模式：咨询公司、工作室、线上业务——不需要融资和大团队，但满足你的创造需求。", "zh-TW": "考慮「輕創業」模式：諮詢公司、工作室、線上業務。", en: "Consider 'light entrepreneurship': consulting firm, studio, online business—no fundraising or large teams needed, but satisfies your creative drive." }, risk: { "zh-CN": "风险：回头看时觉得遗憾。如果创业对你来说仍然重要，不要让它变成「未完成的梦想」。", "zh-TW": "風險：回頭看時覺得遺憾。不要讓創業變成未完成的夢想。", en: "Risk: Looking back with regret. If entrepreneurship still matters to you, don't let it become an 'unfinished dream'." } },
    low: { meaning: { "zh-CN": "中期低EC说明你已经明确：你的价值来源不是创建新事物，而是在现有体系中做到最好。", "zh-TW": "中期低EC說明你的價值來源不是創建新事物。", en: "Mid-career low EC confirms: your value source isn't creating new things, but excelling within existing systems." }, characteristics: { "zh-CN": ["在稳定的角色中找到了满足感", "对创业不再有兴趣或从未有过", "更享受执行和优化的过程", "把精力投入在做好手头的事"], "zh-TW": ["在穩定角色中找到了滿足感", "更享受執行和優化"], en: ["Found satisfaction in stable roles", "No longer interested in or never interested in entrepreneurship", "Enjoy execution and optimization", "Focus energy on doing current work well"] }, development: { "zh-CN": "你的价值在于稳定性和可靠性——很多组织最缺的就是能把事情做好的人。深化你的执行力和专业能力。", "zh-TW": "你的價值在於穩定性和可靠性。深化執行力和專業能力。", en: "Your value is in stability and reliability—many organizations desperately need people who get things done well. Deepen your execution and professional capabilities." }, risk: { "zh-CN": "风险：在需要创新和变革的组织中显得格格不入。了解你所在组织对创新的期望，找到你的定位。", "zh-TW": "風險：在需要創新的組織中顯得格格不入。", en: "Risk: Feeling out of place in organizations that demand innovation. Understand your organization's innovation expectations and find your positioning." } },
  },
  senior: {
    high: {
      meaning: { "zh-CN": "10年以上高EC但仍未创业，你可能正经历深层的身份拉扯——核心问题从「要不要创业」变成了「我是不是错过了最佳窗口期」。这种持续的未完成感会逐渐演变为慢性遗憾。如果你已经在创业，则需要评估：创业是否仍然让你兴奋，还是已经变成了一种惯性？", "zh-TW": "10年以上高EC但仍未創業，你可能正經歷深層的身份拉扯——核心問題從「要不要創業」變成了「我是不是錯過了最佳窗口期」。如果你已經在創業，需要評估創業是否仍讓你興奮。", en: "High EC after 10+ years without starting a venture—you may be experiencing deep identity tension. The core question shifts from 'should I start' to 'did I miss the optimal window?' This sustained incompleteness evolves into chronic regret. If already entrepreneuring, assess: does it still excite you, or has it become inertia?" },
      characteristics: { "zh-CN": ["创业从梦想变成了负担——每次想到都感到焦虑而非兴奋", "对别人的创业成功既羡慕又痛苦", "不断寻找「完美时机」但从未真正开始", "可能已经有了详细计划但一直在修改而非执行"], "zh-TW": ["創業從夢想變成了負擔——每次想到都感到焦慮", "對別人的創業成功既羡慕又痛苦", "不斷尋找「完美時機」但從未開始", "計劃一直在修改而非執行"], en: ["Entrepreneurship shifted from dream to burden—anxiety instead of excitement", "Envy and pain at others' entrepreneurial success", "Constantly seeking 'perfect timing' but never starting", "Detailed plans that keep getting revised, never executed"] },
      development: { "zh-CN": "诚实面对：你到底是真的想创业，还是被「创业者」这个身份标签吸引？如果真的想——设定一个明确的deadline（如1年内），要么开始要么彻底放下。如果只是被标签吸引——承认这一点并放下，专注于你真正在做的事。最糟糕的状态是永远停留在「准备中」。", "zh-TW": "誠實面對：你到底是真的想創業，還是被「創業者」標籤吸引？設定明確的deadline，要么開始要么徹底放下。最糟糕的是永遠停在「準備中」。", en: "Face honestly: do you truly want to start a business, or are you attracted to the 'entrepreneur' identity label? If truly—set a clear deadline (within 1 year), either start or let go completely. If it's the label—acknowledge and move on. The worst state is being permanently 'in preparation'." },
      risk: { "zh-CN": "倦怠信号模式：每次看到创业相关内容都感到焦虑、自责、防御——这是未完成事项的心理负担在消耗你。早期预警：如果你开始对创业话题产生回避甚至厌恶，可能是持续的认知失调（想但不做）已经在侵蚀你的心理能量。偏离模式：「永久准备者」——10年、15年、20年一直在准备从未开始，最终变成一种自我欺骗的安全毯。", "zh-TW": "倦怠信號：對創業內容感到焦慮、自責、防禦——未完成事項的心理負擔。早期預警：對創業話題產生回避甚至厭惡，認知失調在侵蝕心理能量。偏離模式：「永久準備者」——一直準備從未開始，變成自我欺騙的安全毯。", en: "Burnout signal: Anxiety, self-blame, and defensiveness with entrepreneurship content—psychological burden of unfinished business consuming you. Early warning: Avoiding or resenting entrepreneurship topics signals sustained cognitive dissonance eroding psychological energy. Derailment pattern: 'Permanent preparer'—decades of preparation without starting, becoming a self-deceptive security blanket." },
    },
    moderate: {
      meaning: { "zh-CN": "10年以上中等EC，你的创业热情可能已经沉淀——不再是年轻时的冲动，而是一种沉稳的创造欲。你可能在组织内部找到了满足创新需求的方式，也可能在「副业」中释放创业能量。", "zh-TW": "10年以上中等EC，創業熱情已沉澱，可能在組織內找到了創新滿足的方式，或在副業中釋放創業能量。", en: "Moderate EC after 10+ years—entrepreneurial enthusiasm has settled from youthful impulse to calm creative desire. You may have found ways to satisfy innovation needs within organizations or channel energy through side projects." },
      characteristics: { "zh-CN": ["对创新仍有兴趣但不再有紧迫感", "可能通过组织内部创新获得了满足", "对创业的风险回报计算更加理性", "可能已经尝试过副业或轻创业"], "zh-TW": ["對創新仍有興趣但不再有緊迫感", "通過組織內部創新獲得了滿足", "對創業風險計算更理性", "可能嘗試過副業"], en: ["Still interested in innovation but without urgency", "May have found satisfaction through internal innovation", "More rational about entrepreneurial risk-reward", "May have tried side projects or light entrepreneurship"] },
      development: { "zh-CN": "如果你对当前状态满意，这是一种成熟的自我认知。但定期检查：你的创新需求是否真的被满足了，还是你只是习惯了现状？如果有未完成的创业遗憾，诚实面对它——要么制定计划，要么真正释怀。", "zh-TW": "如果對當前狀態滿意，這是成熟的自我認知。但定期檢查創新需求是否真的被滿足。如有未完成的創業遺憾，誠實面對。", en: "If satisfied with current state, this reflects mature self-awareness. But periodically check: are your innovation needs truly met, or have you just gotten used to the status quo? If there's unfinished entrepreneurial regret, face it honestly—either make a plan or genuinely let go." },
      risk: { "zh-CN": "倦怠信号模式：对创新项目感到疲惫而非兴奋——创新从「我想做」变成了「又要做」。早期预警：如果你发现自己用「太忙」作为不创新的借口，可能是创新动力在消退而非时间不够。偏离模式：「创业遗憾综合征」——后悔没创业但又不愿承认，用各种合理化来掩盖这种遗憾，导致慢性不满。", "zh-TW": "倦怠信號：對創新專案感到疲憊而非興奮。早期預警：用「太忙」作為不創新的藉口。偏離模式：「創業遺憾綜合徵」——後悔沒創業但不願承認，用合理化掩蓋遺憾。", en: "Burnout signal: Feeling tired rather than excited about innovation—shifts from 'I want to' to 'have to again.' Early warning: Using 'too busy' as excuse may signal fading drive, not time shortage. Derailment pattern: 'Entrepreneurial regret syndrome'—regretting not starting but unwilling to admit, rationalizing to mask regret, causing chronic dissatisfaction." },
    },
    low: {
      meaning: { "zh-CN": "10年以上低EC，你的执行者身份已经深度固化。创业和创造新事物从来不是你的驱动力——这种自我认知在此阶段已经非常清晰。", "zh-TW": "10年以上低EC，執行者身份已深度固化。創業從來不是你的驅動力。", en: "Low EC after 10+ years—your executor identity is deeply solidified. Entrepreneurship and creating new things were never your drivers—this self-awareness is crystal clear at this stage." },
      characteristics: { "zh-CN": ["在现有体系中已经建立了稳定的价值", "对变革和不确定性的抗拒可能比年轻时更强", "可能对组织变革感到本能的威胁", "认为「做好本职工作」比「创新」更重要"], "zh-TW": ["在現有體系中建立了穩定價值", "對變革的抗拒比年輕時更強", "對組織變革感到本能的威脅", "認為做好本職比創新更重要"], en: ["Built stable value within existing systems", "Resistance to change possibly stronger than when younger", "May feel instinctive threat from organizational transformation", "Believe 'doing your job well' matters more than 'innovation'"] },
      development: { "zh-CN": "你的稳定性和执行力在组织中仍然有巨大价值。但需要警惕：在AI和技术快速变革的时代，纯粹的执行者角色可能被自动化替代。你不需要创业，但需要持续更新你的工具箱。", "zh-TW": "你的穩定性和執行力仍有巨大價值。但在AI快速變革的時代，需要持續更新工具箱。", en: "Your stability and execution still hold enormous value. But be vigilant: in rapid AI and tech transformation, purely executor roles may be automated. You don't need to start a business, but continuously update your toolkit." },
      risk: { "zh-CN": "倦怠信号模式：对所有变革感到本能的抗拒和疲惫——不是因为变革不好，而是因为变革意味着你需要重新学习，这本身就让你感到消耗。早期预警：如果你发现自己越来越频繁地说「以前更好」或「为什么要改」，可能是在用怀旧来逃避适应。偏离模式：「守旧者陷阱」——用「稳定」来合理化拒绝任何改变，直到有一天发现自己的技能已经严重过时。", "zh-TW": "倦怠信號：對所有變革感到本能的抗拒和疲憊。早期預警：越來越頻繁說「以前更好」。偏離模式：「守舊者陷阱」——用「穩定」合理化拒絕改變，直到技能嚴重過時。", en: "Burnout signal: Instinctive resistance and exhaustion toward all change—because change means relearning, which itself feels depleting. Early warning: Increasingly saying 'it was better before' or 'why change' may be using nostalgia to avoid adaptation. Derailment pattern: 'Traditionalist trap'—rationalizing rejection of all change as 'stability' until skills become severely outdated." },
    },
  },
  executive: {
    high: { meaning: { "zh-CN": "高管阶段高EC说明你可能是连续创业者或变革型领导者。创造新事物是你最深层的职业动力。", "zh-TW": "高管階段高EC說明你可能是連續創業者或變革型領導者。", en: "High EC at executive stage suggests serial entrepreneurship or transformational leadership. Creating new things is your deepest career drive." }, characteristics: { "zh-CN": ["可能创立或参与创立了多个企业", "对新机会永远保持好奇", "享受创造的过程超过守成", "可能在考虑下一个创业项目"], "zh-TW": ["可能創立了多個企業", "對新機會永遠好奇", "享受創造超過守成"], en: ["May have founded or co-founded multiple ventures", "Always curious about new opportunities", "Enjoy creating more than maintaining", "May be considering next venture"] }, development: { "zh-CN": "考虑如何让你的创业经验产生更大影响：天使投资、创业导师、孵化器。你的价值不仅是自己创业，还可以帮助更多人创业。", "zh-TW": "考慮如何讓創業經驗產生更大影響：天使投資、創業導師。", en: "Consider amplifying your entrepreneurial experience: angel investing, startup mentoring, incubators. Your value isn't just starting businesses—you can help others start theirs." }, risk: { "zh-CN": "风险：无法放手已建立的事业。学会从「创始人」转型为「投资人/顾问」，让下一代创业者接棒。", "zh-TW": "風險：無法放手已建立的事業。學會轉型。", en: "Risk: Unable to let go of established ventures. Learn to transition from 'founder' to 'investor/advisor', letting next-generation entrepreneurs take over." } },
    moderate: { meaning: { "zh-CN": "高管阶段中等EC表明创业热情有所沉淀，你更关注已有成果的巩固和传承。", "zh-TW": "高管階段中等EC表明創業熱情有所沉澱。", en: "Moderate EC at executive stage indicates settled entrepreneurial enthusiasm, with more focus on consolidating and passing on existing achievements." }, characteristics: { "zh-CN": ["从创造转向优化和传承", "选择性地参与新项目", "更看重可持续性而非爆发性增长"], "zh-TW": ["從創造轉向優化和傳承", "更看重可持續性"], en: ["Shifting from creation to optimization and succession", "Selectively participating in new projects", "Value sustainability over explosive growth"] }, development: { "zh-CN": "把你的经验系统化——写作、教学、建立框架。让更多人受益于你的创业智慧。", "zh-TW": "把經驗系統化——寫作、教學、建立框架。", en: "Systematize your experience—writing, teaching, building frameworks. Let more people benefit from your entrepreneurial wisdom." }, risk: { "zh-CN": "风险：过于保守而错失新一波的机会。保持对新趋势的关注。", "zh-TW": "風險：過於保守而錯失新機會。保持對新趨勢的關注。", en: "Risk: Being too conservative and missing the next wave. Stay attuned to new trends." } },
    low: { meaning: { "zh-CN": "高管阶段低EC通常意味着你是通过其他路径（管理晋升、专业发展）达到高管位置的。", "zh-TW": "高管階段低EC通常意味著你通過其他路徑達到高管位置。", en: "Low EC at executive stage typically means you reached executive level through other paths (management promotion, professional development)." }, characteristics: { "zh-CN": ["通过稳步晋升而非创业达到高位", "更擅长管理已有体系", "对风险持保守态度"], "zh-TW": ["通過穩步晉升達到高位", "更擅長管理已有體系"], en: ["Reached high position through steady promotion, not entrepreneurship", "Better at managing existing systems", "Conservative toward risk"] }, development: { "zh-CN": "你的优势是系统性管理和稳定运营。与高EC的人合作——你提供稳定的执行力，他们提供创新的想法。", "zh-TW": "你的優勢是系統性管理。與高EC的人合作互補。", en: "Your strength is systematic management and stable operations. Partner with high-EC people—you provide stable execution, they provide innovative ideas." }, risk: { "zh-CN": "风险：在需要转型的时刻反应太慢。确保你周围有敢于创新的人，并给他们足够的空间。", "zh-TW": "風險：在需要轉型時反應太慢。確保周圍有敢創新的人。", en: "Risk: Reacting too slowly when transformation is needed. Ensure you have innovative people around you and give them enough space." } },
  },
};

// ============================================================
// SV - Service/Dedication
// ============================================================
const SV_DATA: AnchorStageData = {
  early: {
    high: { meaning: { "zh-CN": "高SV意味着你需要工作与核心价值观一致——帮助他人、产生社会意义是你的底线需求。", "zh-TW": "高SV意味著你需要工作與核心價值觀一致。", en: "High SV means your work must align with core values—helping others and creating social meaning is your bottom-line need." }, characteristics: { "zh-CN": ["会因为工作缺乏社会意义而痛苦", "愿意为有意义的工作接受较低薪资", "关注工作对他人的实际影响", "对纯商业利益驱动的环境不适应"], "zh-TW": ["會因工作缺乏社會意義而痛苦", "願意為有意義的工作接受較低薪資"], en: ["Suffer when work lacks social meaning", "Accept lower pay for meaningful work", "Focus on actual impact on others", "Uncomfortable in purely profit-driven environments"] }, development: { "zh-CN": "选择有使命感的组织——社会企业、教育、医疗、NGO、B Corp。但也要注意：1）使命感不能完全替代专业发展；2）要确保基本的经济需求被满足。", "zh-TW": "選擇有使命感的組織。使命感不能完全替代專業發展。", en: "Choose mission-driven organizations—social enterprises, education, healthcare, NGOs, B Corps. But note: 1) Mission can't fully replace professional development; 2) Ensure basic financial needs are met." }, risk: { "zh-CN": "风险：被「使命感」利用——一些组织用崇高使命来要求员工接受不合理的工作条件和低薪。有使命感的工作也应该有体面的待遇。", "zh-TW": "風險：被「使命感」利用。有使命感的工作也應有體面待遇。", en: "Risk: Being exploited through 'mission'—some organizations use noble missions to demand unreasonable conditions and low pay. Mission-driven work should also offer decent compensation." } },
    moderate: { meaning: { "zh-CN": "中等SV说明你希望工作有一定的社会价值，但不是唯一标准。你在意义和现实之间寻找平衡。", "zh-TW": "中等SV說明你希望工作有一定社會價值，在意義和現實之間平衡。", en: "Moderate SV means you want work to have some social value, but it's not your only criterion. You balance meaning and practicality." }, characteristics: { "zh-CN": ["希望工作有正面社会影响", "但也重视个人发展和经济回报", "不排斥商业组织但希望它们「做正确的事」", "可能通过志愿者活动或副业满足服务需求"], "zh-TW": ["希望工作有正面影響但也重視個人發展"], en: ["Want work to have positive social impact", "But also value personal development and financial returns", "Don't reject commercial orgs but hope they 'do the right thing'", "May fulfill service needs through volunteering or side work"] }, development: { "zh-CN": "寻找能将商业能力和社会影响力结合的岗位：CSR、ESG、可持续发展、社会创新。这些领域正在快速成长。", "zh-TW": "尋找結合商業能力和社會影響力的職位：CSR、ESG、永續發展。", en: "Find roles combining business capabilities with social impact: CSR, ESG, sustainability, social innovation. These fields are growing rapidly." }, risk: { "zh-CN": "风险：在追求意义和赚钱之间长期摇摆。给自己一个明确的优先级排序。", "zh-TW": "風險：在追求意義和賺錢之間長期搖擺。", en: "Risk: Long-term wavering between pursuing meaning and earning money. Give yourself a clear priority ranking." } },
    low: { meaning: { "zh-CN": "低SV意味着社会服务不是你的核心驱动力。你的满足感更多来自个人成就、专业发展或其他方面。", "zh-TW": "低SV意味著社會服務不是你的核心驅動力。", en: "Low SV means social service isn't your core driver. Your satisfaction comes more from personal achievement, professional development, or other aspects." }, characteristics: { "zh-CN": ["工作的社会意义不影响你的职业选择", "更关注个人成就和能力提升", "不会因为工作「不够有意义」而痛苦", "可能觉得服务导向的人有时不够务实"], "zh-TW": ["工作的社會意義不影響職業選擇", "更關注個人成就"], en: ["Work's social significance doesn't affect career choices", "More focused on personal achievement and capability", "Won't suffer because work 'isn't meaningful enough'", "May find service-oriented people sometimes impractical"] }, development: { "zh-CN": "你可以通过其他方式（个人捐赠、志愿者、社区参与）满足利他需求，不必把它和职业选择绑定。", "zh-TW": "你可以通過其他方式滿足利他需求，不必與職業選擇綁定。", en: "You can fulfill altruistic needs through other means (donations, volunteering, community involvement) without tying them to career choices." }, risk: { "zh-CN": "风险：在需要团队合作和社会关怀的环境中被认为过于「功利」。了解你所在环境的文化期望。", "zh-TW": "風險：在需要社會關懷的環境中被認為「功利」。", en: "Risk: Being perceived as too 'utilitarian' in environments requiring teamwork and social care. Understand cultural expectations in your environment." } },
  },
  mid: {
    high: { meaning: { "zh-CN": "中期高SV说明服务和奉献已成为你已验证的核心价值。你可能已经在使命驱动的领域建立了影响力。", "zh-TW": "中期高SV說明服務和奉獻已成為核心價值。", en: "Mid-career high SV confirms service and dedication as your verified core value. You've likely built influence in mission-driven fields." }, characteristics: { "zh-CN": ["在服务导向的领域有深厚积累", "可能面临「理想vs现实」的持续张力", "渴望产生更大范围的社会影响", "可能对组织效率和官僚感到frustration"], "zh-TW": ["在服務導向領域有深厚積累", "渴望產生更大社會影響"], en: ["Deep accumulation in service-oriented fields", "May face ongoing 'ideals vs reality' tension", "Desire to create broader social impact", "May feel frustrated by organizational efficiency and bureaucracy"] }, development: { "zh-CN": "扩大你的影响力：从个人服务到系统性改变。通过政策倡导、社会创新、规模化公益来放大你的影响。", "zh-TW": "擴大影響力：從個人服務到系統性改變。", en: "Scale your impact: from individual service to systemic change. Amplify through policy advocacy, social innovation, and scaled philanthropy." }, risk: { "zh-CN": "风险：「燃尽」——长期的奉献和情绪投入可能导致职业倦怠。确保有自我照顾和情绪支持的机制。", "zh-TW": "風險：長期奉獻可能導致職業倦怠。確保有自我照顧機制。", en: "Risk: Burnout—long-term dedication and emotional investment can lead to exhaustion. Ensure you have self-care and emotional support mechanisms." } },
    moderate: { meaning: { "zh-CN": "中期中等SV可能意味着你在追求个人目标的同时保持了对社会贡献的关注。", "zh-TW": "中期中等SV意味著你在追求個人目標的同時保持社會關注。", en: "Mid-career moderate SV may mean you maintain social contribution awareness while pursuing personal goals." }, characteristics: { "zh-CN": ["找到了将职业技能用于社会公益的方式", "通过志愿者或顾问角色满足服务需求", "不排斥商业但希望企业有社会责任"], "zh-TW": ["找到了將職業技能用於社會的方式"], en: ["Found ways to apply professional skills for social good", "Fulfill service needs through volunteer or advisory roles", "Don't reject commerce but want corporate social responsibility"] }, development: { "zh-CN": "探索「专业+公益」的交叉点：pro bono咨询、技能志愿者、影响力投资顾问。", "zh-TW": "探索「專業+公益」的交叉點。", en: "Explore the intersection of 'expertise + philanthropy': pro bono consulting, skills-based volunteering, impact investment advisory." }, risk: { "zh-CN": "风险：服务变成义务而非自愿，导致不满。确保你的社会参与是出于真正的热情而非社会压力。", "zh-TW": "風險：服務變成義務而非自願。確保出於真正熱情。", en: "Risk: Service becoming obligation rather than voluntary, causing resentment. Ensure your social engagement comes from genuine passion, not social pressure." } },
    low: { meaning: { "zh-CN": "中期低SV是明确的——你的职业动力来自其他方面。这完全正常，不代表你是不关心社会的人。", "zh-TW": "中期低SV是明確的——你的職業動力來自其他方面。", en: "Mid-career low SV is clear—your career drivers come from other aspects. This is perfectly normal and doesn't mean you're uncaring." }, characteristics: { "zh-CN": ["职业选择完全基于个人发展和能力发挥", "社会贡献通过私人方式而非工作实现", "对「使命驱动」的职业宣传持怀疑态度"], "zh-TW": ["職業選擇基於個人發展", "社會貢獻通過私人方式實現"], en: ["Career choices entirely based on personal development", "Social contributions through private means, not work", "Skeptical of 'mission-driven' career narratives"] }, development: { "zh-CN": "继续按你的方式发展。社会责任可以通过工作之外的方式实现——这甚至可能更有效率。", "zh-TW": "繼續按你的方式發展。社會責任可以在工作之外實現。", en: "Continue developing your way. Social responsibility can be fulfilled outside work—this may even be more efficient." }, risk: { "zh-CN": "风险：在ESG和社会责任意识越来越强的商业环境中，完全忽视社会维度可能不利于职业发展。了解并尊重这个趋势。", "zh-TW": "風險：在ESG意識越來越強的環境中忽視社會維度。", en: "Risk: In an increasingly ESG and social responsibility-conscious business environment, completely ignoring the social dimension may hurt career development. Understand and respect this trend." } },
  },
  senior: {
    high: {
      meaning: { "zh-CN": "10年以上高SV，长期的情感投入和使命驱动可能已经消耗了你的心理储备。此阶段最大的风险是「同情疲劳」（compassion fatigue）——你对受助者的困境从深切共情变成了麻木应对。这不是你变冷漠了，而是你的情感账户已经透支。", "zh-TW": "10年以上高SV，長期的情感投入和使命驅動可能已消耗了你的心理儲備。最大風險是「同情疲勞」——對受助者的困境從深切共情變成了麻木應對。", en: "High SV after 10+ years—long-term emotional investment and mission drive may have depleted your psychological reserves. The biggest risk is 'compassion fatigue'—your response to beneficiaries' struggles shifts from deep empathy to numb coping. This isn't you becoming cold—it's your emotional account being overdrawn." },
      characteristics: { "zh-CN": ["对服务对象的困境感到麻木甚至烦躁", "工作中的情感投入从自然流露变成刻意表演", "开始质疑自己的影响力——「我做了这么多有什么用」", "可能出现身心症状（失眠、焦虑、慢性疲劳）"], "zh-TW": ["對服務對象的困境感到麻木甚至煩躁", "情感投入從自然流露變成刻意表演", "開始質疑自己的影響力", "可能出現身心症狀"], en: ["Feeling numb or even irritated by service recipients' difficulties", "Emotional investment shifting from natural to performative", "Questioning your impact—'I've done so much, what's the point'", "Physical symptoms may appear (insomnia, anxiety, chronic fatigue)"] },
      development: { "zh-CN": "认真评估你的情感账户是否已经透支。你需要：1）建立情感边界——不是冷漠，而是专业的同理心；2）定期的情感补给机制（督导、同行支持小组、心理咨询）；3）如果已经深度倦怠，考虑暂时离开一线服务，转向培训、研究或政策倡导——这些同样是服务，但情感消耗更低。", "zh-TW": "評估情感帳戶是否透支。建立情感邊界和定期補給機制。如已深度倦怠，考慮轉向培訓、研究或政策倡導。", en: "Honestly assess whether your emotional account is overdrawn. You need: 1) Emotional boundaries—not coldness, but professional empathy; 2) Regular emotional replenishment (supervision, peer support groups, counseling); 3) If deeply burned out, consider stepping back from frontline service toward training, research, or policy advocacy—still service, but lower emotional cost." },
      risk: { "zh-CN": "倦怠信号模式：对服务对象从「想帮助他们」变成「希望他们快点走」；情感从投入变成隔离——用制度化、程序化来保护自己不被伤害。早期预警：如果你发现自己开始用冷嘲热讽来谈论服务对象，这是严重的同情疲劳信号。偏离模式：「救世主倦怠」——过度认同救世主角色导致的身份枯竭，最终可能以愤世嫉俗或突然离职告终。", "zh-TW": "倦怠信號：從「想幫助他們」變成「希望他們快點走」；用制度化保護自己。早期預警：用冷嘲熱諷談論服務對象是嚴重的同情疲勞信號。偏離模式：「救世主倦怠」——過度認同救世主角色導致身份枯竭。", en: "Burnout signal: Shifting from 'wanting to help' to 'wishing they'd leave'; emotional isolation—using institutionalization for self-protection. Early warning: Speaking cynically about service recipients signals severe compassion fatigue. Derailment pattern: 'Savior burnout'—identity depletion from over-identifying with savior role, potentially ending in cynicism or sudden resignation." },
    },
    moderate: {
      meaning: { "zh-CN": "10年以上中等SV，你在服务他人和个人发展之间维持着某种平衡。这种平衡可能是主动选择的结果，也可能是逐渐调整后的状态。", "zh-TW": "10年以上中等SV，你在服務他人和個人發展之間維持著某種平衡。", en: "Moderate SV after 10+ years—you maintain some balance between serving others and personal development. This balance may result from active choice or gradual adjustment." },
      characteristics: { "zh-CN": ["服务热情仍在但不再是唯一驱动力", "能在商业价值和社会价值之间灵活切换", "通过专业能力而非纯粹的情感来服务", "可能在企业CSR或社会创新领域找到了定位"], "zh-TW": ["服務熱情仍在但不再是唯一驅動力", "能在商業和社會價值間切換", "通過專業能力而非純粹情感來服務", "可能在CSR或社會創新找到了定位"], en: ["Service passion remains but no longer sole driver", "Can flexibly switch between commercial and social value", "Serve through professional capability rather than pure emotion", "May have found positioning in CSR or social innovation"] },
      development: { "zh-CN": "你的平衡策略值得肯定。但要留意：服务是否从「自愿」变成了「义务」？如果你发现自己做公益时感到被绑架而非自由，需要重新设定边界。", "zh-TW": "你的平衡策略值得肯定。但留意服務是否從「自願」變成了「義務」。", en: "Your balance strategy deserves affirmation. But watch: has service shifted from 'voluntary' to 'obligatory'? If you feel conscripted rather than free when doing good, reset your boundaries." },
      risk: { "zh-CN": "倦怠信号模式：服务从自愿变成义务，从快乐变成负担——每次公益活动前都在计算「这又要花多少时间」。早期预警：开始用「太忙」来回避社会参与的邀请。偏离模式：「表演性公益」——为了维持形象或满足他人期望而做公益，内心已经完全失去热情。", "zh-TW": "倦怠信號：服務從自願變成義務。早期預警：用「太忙」回避社會參與。偏離模式：「表演性公益」——為維持形象而做，內心失去熱情。", en: "Burnout signal: Service shifting from voluntary to obligatory, joyful to burdensome—calculating 'how much time will this cost' before every event. Early warning: Using 'too busy' to dodge social engagement. Derailment pattern: 'Performative philanthropy'—doing good to maintain image or meet expectations, internally having lost all passion." },
    },
    low: {
      meaning: { "zh-CN": "10年以上低SV，社会服务维度从未是你的核心驱动力——这个认知在此阶段已经非常稳定。这完全没有问题。", "zh-TW": "10年以上低SV，社會服務從未是你的核心驅動力。這完全沒有問題。", en: "Low SV after 10+ years—the social service dimension was never your core driver. This self-awareness is very stable at this stage. Perfectly fine." },
      characteristics: { "zh-CN": ["职业满足感来自其他锚点维度", "社会贡献通过纳税、消费、就业等间接方式实现", "对「使命驱动」的叙事保持理性距离"], "zh-TW": ["職業滿足感來自其他錨點", "社會貢獻通過間接方式實現", "對「使命驅動」保持理性距離"], en: ["Career satisfaction comes from other anchor dimensions", "Social contribution through indirect means (taxes, employment)", "Maintain rational distance from 'mission-driven' narratives"] },
      development: { "zh-CN": "继续你的方式。如果有余力，找到不消耗情感的社会参与方式（如技能捐赠、理事顾问等）——这些不需要情感投入但同样有价值。", "zh-TW": "繼續你的方式。如有餘力，找到不消耗情感的社會參與方式。", en: "Continue your way. If you have capacity, find social engagement that doesn't drain emotionally (skill donations, board advisory)—valuable without emotional investment." },
      risk: { "zh-CN": "此阶段低SV没有显著的倦怠或偏离风险——你的驱动力来自其他维度，这是清晰的自我认知。唯一需要注意的是在ESG意识日益增强的职场环境中保持必要的社会敏感度。", "zh-TW": "此階段低SV沒有顯著風險。唯一需要注意的是保持必要的社會敏感度。", en: "Low SV at this stage carries no significant burnout or derailment risk—your drivers come from other dimensions, reflecting clear self-awareness. Only note: maintain necessary social sensitivity in an increasingly ESG-conscious workplace." },
    },
  },
  executive: {
    high: { meaning: { "zh-CN": "高管阶段高SV说明你在职业巅峰仍然以社会价值为核心驱动。你可能是社会企业家、公益领袖或变革推动者。", "zh-TW": "高管階段高SV說明你以社會價值為核心驅動。", en: "High SV at executive stage means social value remains your core driver at career peak. You may be a social entrepreneur, philanthropic leader, or change agent." }, characteristics: { "zh-CN": ["利用高管影响力推动社会变革", "可能在考虑全职投入公益事业", "关注遗产和长期社会影响"], "zh-TW": ["利用高管影響力推動社會變革", "關注遺產和長期影響"], en: ["Use executive influence to drive social change", "May be considering full-time philanthropy", "Focus on legacy and long-term social impact"] }, development: { "zh-CN": "这是你发挥最大社会影响力的阶段。利用你的资源、网络和经验，推动系统性的社会变革。", "zh-TW": "利用資源和經驗推動系統性社會變革。", en: "This is your stage for maximum social impact. Use your resources, network, and experience to drive systemic social change." }, risk: { "zh-CN": "风险：把「做好事」等同于「效果好」。确保你的社会贡献是基于证据和影响力评估的，而非仅仅出于良好意愿。", "zh-TW": "風險：確保社會貢獻基於證據而非僅出於良好意願。", en: "Risk: Equating 'doing good' with 'doing effective'. Ensure your social contributions are evidence-based and impact-assessed, not just well-intentioned." } },
    moderate: { meaning: { "zh-CN": "高管阶段中等SV说明你在商业成功和社会贡献之间达成了平衡。", "zh-TW": "高管階段中等SV說明你在商業成功和社會貢獻之間達成了平衡。", en: "Moderate SV at executive stage shows you've balanced business success with social contribution." }, characteristics: { "zh-CN": ["通过商业手段解决社会问题", "支持CSR和ESG但不是唯一关注", "个人慈善和社区参与活跃"], "zh-TW": ["通過商業手段解決社會問題", "個人慈善活躍"], en: ["Solve social problems through business means", "Support CSR and ESG but not sole focus", "Active in personal charity and community involvement"] }, development: { "zh-CN": "你独特的价值是「商业+社会」的桥梁。帮助更多商业领袖理解社会价值的商业意义。", "zh-TW": "你的獨特價值是「商業+社會」的橋梁。", en: "Your unique value is being the bridge between business and social impact. Help more business leaders understand the commercial value of social contribution." }, risk: { "zh-CN": "风险：「洗绿」——表面做公益，实际为商业利益服务。确保你的社会参与是真诚的。", "zh-TW": "風險：確保社會參與是真誠的。", en: "Risk: 'Greenwashing'—appearing philanthropic while actually serving business interests. Ensure your social engagement is genuine." } },
    low: { meaning: { "zh-CN": "高管阶段低SV说明你的职业驱动力始终来自其他方面。这在商业领袖中很常见。", "zh-TW": "高管階段低SV說明你的職業驅動力來自其他方面。", en: "Low SV at executive stage confirms your career drivers have always come from other aspects. This is common among business leaders." }, characteristics: { "zh-CN": ["以商业结果和股东价值为导向", "社会贡献是商业成功的副产品", "可能通过基金会或捐赠而非个人参与"], "zh-TW": ["以商業結果為導向", "社會貢獻是商業成功的副產品"], en: ["Driven by business results and shareholder value", "Social contribution as byproduct of business success", "May contribute through foundations or donations rather than personal involvement"] }, development: { "zh-CN": "在当前的社会环境下，纯商业导向的领导风格面临越来越多的挑战。适度关注ESG和社会责任，不一定需要改变你的驱动力，但需要在行为上做出调整。", "zh-TW": "適度關注ESG和社會責任，在行為上做出調整。", en: "In today's social environment, purely business-driven leadership faces increasing challenges. Pay moderate attention to ESG and social responsibility—you don't need to change your drivers, but adjust your behaviors." }, risk: { "zh-CN": "风险：在公众和员工日益关注社会责任的环境中，被视为只关心利润的领导者。这可能影响人才招聘和品牌声誉。", "zh-TW": "風險：被視為只關心利潤的領導者。", en: "Risk: Being seen as a profit-only leader in an environment where the public and employees increasingly care about social responsibility. This may affect talent recruitment and brand reputation." } },
  },
};

// ============================================================
// CH - Pure Challenge
// ============================================================
const CH_DATA: AnchorStageData = {
  early: {
    high: { meaning: { "zh-CN": "高CH意味着你被困难和竞争激励——解决复杂问题、征服挑战是你的核心满足来源。", "zh-TW": "高CH意味著你被困難和競爭激勵——征服挑戰是你的核心滿足來源。", en: "High CH means you're motivated by difficulty and competition—solving complex problems and conquering challenges is your core satisfaction source." }, characteristics: { "zh-CN": ["容易对简单重复的工作感到无聊", "主动寻找更难的项目和任务", "喜欢与高水平的人竞争和合作", "对自己有很高的标准和要求"], "zh-TW": ["容易對簡單重複的工作感到無聊", "主動尋找更難的任務", "對自己有很高標準"], en: ["Easily bored by simple repetitive work", "Proactively seek harder projects", "Enjoy competing and collaborating with high-level people", "Set very high standards for yourself"] }, development: { "zh-CN": "选择高挑战性的行业和岗位：咨询、投行、科技、竞技。但注意：1）纯粹的「打鸡血」不可持续，需要找到有意义的挑战；2）学会失败——高挑战必然伴随高失败率。", "zh-TW": "選擇高挑戰性行業。注意找到有意義的挑戰，學會面對失敗。", en: "Choose high-challenge industries and roles: consulting, investment banking, tech, competitive fields. But note: 1) Pure adrenaline isn't sustainable—find meaningful challenges; 2) Learn to fail—high challenge inevitably means high failure rates." }, risk: { "zh-CN": "风险：挑战成瘾——永远追求下一个更大的挑战，无法享受已有的成就。学会在挑战间歇欣赏和庆祝自己的成果。", "zh-TW": "風險：挑戰成癮，無法享受已有成就。學會欣賞自己的成果。", en: "Risk: Challenge addiction—always chasing the next bigger challenge, unable to enjoy achievements. Learn to appreciate and celebrate your accomplishments between challenges." } },
    moderate: { meaning: { "zh-CN": "中等CH说明你享受一定程度的挑战但不需要极端的难度。你在挑战和舒适之间寻找平衡。", "zh-TW": "中等CH說明你享受一定挑戰但不需要極端難度。", en: "Moderate CH means you enjoy some challenge but don't need extreme difficulty. You seek balance between challenge and comfort." }, characteristics: { "zh-CN": ["喜欢有适度挑战性的工作", "不排斥困难但也不主动寻求", "在「拉伸区」工作时最有效率", "对纯竞争环境不完全适应"], "zh-TW": ["喜歡適度挑戰性的工作", "在「拉伸區」工作時最有效率"], en: ["Enjoy moderately challenging work", "Don't avoid difficulty but don't actively seek it either", "Most efficient when working in the 'stretch zone'", "Not fully comfortable in purely competitive environments"] }, development: { "zh-CN": "找到你的「最佳挑战水平」——不太容易也不太难的任务。定期要求有挑战性的项目来保持成长，但不需要每次都选最难的。", "zh-TW": "找到你的最佳挑戰水平。定期要求有挑戰的專案保持成長。", en: "Find your 'optimal challenge level'—tasks that are neither too easy nor too hard. Regularly request challenging projects to maintain growth, but you don't need to always choose the hardest option." }, risk: { "zh-CN": "风险：在完全没有挑战的环境中逐渐失去动力。确保你的工作始终有一定的成长空间。", "zh-TW": "風險：在完全沒有挑戰的環境中失去動力。", en: "Risk: Gradually losing motivation in completely unchallenging environments. Ensure your work always has some growth space." } },
    low: { meaning: { "zh-CN": "低CH意味着挑战和竞争不是你的主要满足来源。你可能更看重工作的其他方面。", "zh-TW": "低CH意味著挑戰和競爭不是你的主要滿足來源。", en: "Low CH means challenge and competition aren't your main satisfaction sources. You likely value other aspects of work more." }, characteristics: { "zh-CN": ["不需要通过征服困难来获得满足", "对竞争环境感到压力而非兴奋", "更喜欢稳定和可预测的工作节奏", "在没有压力的环境中表现更好"], "zh-TW": ["不需要通過征服困難獲得滿足", "在沒有壓力的環境中表現更好"], en: ["Don't need to conquer difficulties for fulfillment", "Feel pressure rather than excitement in competitive environments", "Prefer stable and predictable work rhythms", "Perform better in low-pressure environments"] }, development: { "zh-CN": "选择稳定性好、节奏适中的工作环境。你的价值在于持续稳定的输出——很多组织需要这样的可靠成员。", "zh-TW": "選擇穩定性好、節奏適中的環境。你的價值在於持續穩定的輸出。", en: "Choose environments with good stability and moderate pace. Your value is consistent, reliable output—many organizations need dependable members like you." }, risk: { "zh-CN": "风险：被迫进入高压竞争环境时容易崩溃。选择工作时要评估文化和节奏是否适合你。", "zh-TW": "風險：被迫進入高壓環境時容易崩潰。評估文化和節奏。", en: "Risk: Breaking down when forced into high-pressure competitive environments. Evaluate culture and pace when choosing work." } },
  },
  mid: {
    high: { meaning: { "zh-CN": "中期高CH说明挑战驱动已是你确认的核心特质。你需要持续找到新的「战场」来保持活力。", "zh-TW": "中期高CH說明挑戰驅動已是你確認的核心特質。", en: "Mid-career high CH confirms challenge-seeking as your core trait. You need to continuously find new 'battlefields' to stay energized." }, characteristics: { "zh-CN": ["可能已在高挑战领域建立了声誉", "对常规工作容忍度越来越低", "不断寻找更大更难的项目", "可能面临工作与生活平衡的挑战"], "zh-TW": ["在高挑戰領域建立了聲譽", "不斷尋找更大更難的專案"], en: ["Built reputation in high-challenge fields", "Decreasing tolerance for routine work", "Constantly seeking bigger, harder projects", "May face work-life balance challenges"] }, development: { "zh-CN": "转变挑战的类型：从「个人征服」转向「带领团队征服」或「系统性改变」。这给你持续的挑战，同时也产生更大的影响力。", "zh-TW": "轉變挑戰類型：從個人征服轉向帶領團隊征服或系統性改變。", en: "Transform the type of challenge: from 'personal conquest' to 'leading teams to conquer' or 'systemic change'. This provides continuous challenge while creating greater impact." }, risk: { "zh-CN": "风险：挑战成瘾导致身心健康问题。高强度的持续挑战会透支你的身体和心理。学会周期性地恢复。", "zh-TW": "風險：挑戰成癮導致身心問題。學會周期性恢復。", en: "Risk: Challenge addiction leading to physical and mental health issues. Sustained high-intensity challenges deplete your body and mind. Learn to recover periodically." } },
    moderate: { meaning: { "zh-CN": "中期中等CH可能说明你的挑战需求已经被部分满足，或者你对挑战的定义变得更成熟了。", "zh-TW": "中期中等CH可能說明你的挑戰需求已部分滿足。", en: "Mid-career moderate CH may indicate your challenge needs are partially met, or your definition of challenge has matured." }, characteristics: { "zh-CN": ["选择性地接受挑战", "更关注挑战的质量而非数量", "开始帮助他人面对挑战", "在挑战和可持续性之间找到平衡"], "zh-TW": ["選擇性接受挑戰", "更關注質量而非數量"], en: ["Selectively accept challenges", "Focus on quality of challenges rather than quantity", "Starting to help others face challenges", "Finding balance between challenge and sustainability"] }, development: { "zh-CN": "你的成熟度是一个优势。选择那些真正有意义的挑战，而非仅仅为了刺激。把你的挑战经验传授给年轻人。", "zh-TW": "選擇真正有意義的挑戰。把經驗傳授給年輕人。", en: "Your maturity is an asset. Choose truly meaningful challenges, not just thrills. Share your challenge experience with younger colleagues." }, risk: { "zh-CN": "风险：变得过于「挑剔」而错过重要的成长机会。保持对新挑战的开放度。", "zh-TW": "風險：變得過於挑剔而錯過成長機會。", en: "Risk: Becoming too 'picky' and missing important growth opportunities. Stay open to new challenges." } },
    low: { meaning: { "zh-CN": "中期低CH说明你已经确认：你的职业满足感不来自征服困难，而来自其他方面（稳定、意义、平衡等）。", "zh-TW": "中期低CH說明你的職業滿足感來自其他方面。", en: "Mid-career low CH confirms your career satisfaction doesn't come from conquering difficulties, but from other aspects (stability, meaning, balance, etc.)." }, characteristics: { "zh-CN": ["在稳定的角色中感到满足", "不需要持续的刺激和竞争", "可能更适合支持和优化类角色", "重视工作与生活的和谐"], "zh-TW": ["在穩定角色中感到滿足", "不需要持續的刺激和競爭"], en: ["Feel satisfied in stable roles", "Don't need continuous stimulation and competition", "May be better suited for support and optimization roles", "Value work-life harmony"] }, development: { "zh-CN": "你的稳定性是组织的宝贵资产。不要因为社会推崇「挑战者」文化而否定自己的价值——可靠、稳定、持续的贡献同样不可或缺。", "zh-TW": "你的穩定性是組織的寶貴資產。不要否定自己的價值。", en: "Your stability is a valuable organizational asset. Don't devalue yourself because society glorifies 'challenger' culture—reliable, stable, consistent contribution is equally indispensable." }, risk: { "zh-CN": "风险：在推崇「创新」和「颠覆」的组织中被边缘化。确保你的稳定贡献被看到和认可。", "zh-TW": "風險：在推崇「創新」的組織中被邊緣化。", en: "Risk: Being marginalized in organizations that glorify 'innovation' and 'disruption'. Ensure your stable contributions are seen and recognized." } },
  },
  senior: {
    high: {
      meaning: { "zh-CN": "10年以上高CH，持续的挑战驱动可能已经对你的身心造成了可见的损耗。此阶段的核心矛盾是：你对挑战的渴望没有减少，但身体的承受能力已经在下降。你可能正在经历「认知上仍然兴奋，但身体已经在抗议」的撕裂感。", "zh-TW": "10年以上高CH，持續的挑戰驅動可能已對身心造成可見損耗。核心矛盾是：對挑戰的渴望沒有減少，但身體承受能力已在下降。", en: "High CH after 10+ years—continuous challenge drive may have visibly depleted your physical and mental health. The core contradiction: your appetite for challenge hasn't diminished, but your body's capacity has declined. You may experience the split of 'cognitively excited, but body is protesting'." },
      characteristics: { "zh-CN": ["身体发出明确的警告信号（失眠、高血压、心率异常）但仍难以停下", "对「休息」感到焦虑——不挑战就感觉在浪费生命", "可能已经出现过健康危机（过劳住院、心理崩溃）但依然反复", "家人和同事反复表达担忧但你觉得「我还能撑」"], "zh-TW": ["身體發出警告信號（失眠、高血壓）但仍難以停下", "對「休息」感到焦慮", "可能已出現過健康危機但依然反覆", "家人反覆表達擔憂"], en: ["Body sending clear warning signals (insomnia, hypertension, heart rate abnormalities) but still can't stop", "Anxiety about 'resting'—not challenging feels like wasting life", "May have experienced health crises (hospitalization, breakdown) but still relapse", "Family and colleagues express concern but you think 'I can still handle it'"] },
      development: { "zh-CN": "你需要从「征服更大挑战」转向「可持续的卓越」。这意味着：1）设定不可商量的生理底线——睡眠7小时、每周运动3次、年度体检不可跳过；2）从个人挑战转向系统性挑战——通过培养团队、建立机制来产生影响，而非事事亲力亲为；3）学会在挑战之间恢复——高强度和恢复期交替的节奏，而非持续高压。", "zh-TW": "從「征服更大挑戰」轉向「可持續的卓越」。設定不可商量的生理底線，從個人挑戰轉向系統性挑戰，學會在挑戰之間恢復。", en: "Shift from 'conquering bigger challenges' to 'sustainable excellence.' This means: 1) Non-negotiable physiological baselines—7 hours sleep, exercise 3 times weekly, annual checkup mandatory; 2) From personal to systemic challenges—impact through team development and mechanism building; 3) Learn to recover between challenges—alternating intensity and recovery, not constant pressure." },
      risk: { "zh-CN": "倦怠信号模式：不是心理倦怠，而是生理崩溃——慢性疲劳、免疫力下降、慢性疾病开始出现。你可能在认知上仍然兴奋，但身体已经在罢工。早期预警：如果你的配偶、医生、朋友多次警告但你仍然觉得「我还能撑」，这是典型的挑战成瘾否认。偏离模式：「自我摧毁式挑战」——把挑战变成自我证明的工具，即使代价是健康甚至生命。身体的账单迟早会到。", "zh-TW": "倦怠信號：不是心理倦怠而是生理崩潰——慢性疲勞、免疫力下降。早期預警：多人警告但仍覺得「我還能撐」，是挑戰成癮否認。偏離模式：「自我摧毀式挑戰」——把挑戰變成自我證明工具，代價是健康甚至生命。", en: "Burnout signal: Not psychological burnout but physiological collapse—chronic fatigue, weakened immunity, chronic illness emerging. Cognitively excited, but body is on strike. Early warning: If spouse/doctor/friends warn repeatedly but you think 'I can still handle it,' that's classic challenge addiction denial. Derailment pattern: 'Self-destructive challenge'—turning challenge into self-proving tool, even at the cost of health or life. The body's bills always come due." },
    },
    moderate: {
      meaning: { "zh-CN": "10年以上中等CH，你的挑战需求已趋于成熟——从追求数量和难度，变成了追求质量和意义。这是一种健康的演变。", "zh-TW": "10年以上中等CH，你的挑戰需求已趨於成熟——從追求數量和難度變成追求質量和意義。", en: "Moderate CH after 10+ years—your challenge needs have matured from pursuing quantity and difficulty to pursuing quality and meaning. This is healthy evolution." },
      characteristics: { "zh-CN": ["对挑战的选择变得挑剔——不是所有难题都值得投入", "更关注挑战的意义而非纯粹的难度", "可能已经从一线挑战者转向导师和教练角色", "能够在高强度和恢复之间保持较好的节奏"], "zh-TW": ["對挑戰的選擇變得挑剔", "更關注意義而非純粹難度", "可能已轉向導師和教練角色", "能在高強度和恢復間保持節奏"], en: ["Selective about challenges—not every problem is worth the investment", "Focus more on meaning than pure difficulty", "May have shifted from frontline challenger to mentor and coach", "Can maintain good rhythm between intensity and recovery"] },
      development: { "zh-CN": "你的成熟度是宝贵的资产。把你的挑战经验传承给年轻人——让他们的挑战之路少一些不必要的伤痕。同时，继续选择那些真正让你兴奋的、高质量的挑战。", "zh-TW": "你的成熟度是寶貴資產。把挑戰經驗傳承給年輕人，繼續選擇真正讓你興奮的高質量挑戰。", en: "Your maturity is a precious asset. Pass your challenge experience to younger people—help them avoid unnecessary scars. Meanwhile, continue choosing high-quality challenges that genuinely excite you." },
      risk: { "zh-CN": "倦怠信号模式：对挑战变得「挑剔」可能演变为「厌倦」——不是因为挑战不够好，而是因为你厌倦了不断证明自己的循环。早期预警：如果你发现自己越来越多地说「这有什么意义」，可能不是挑战出了问题，而是你的动力系统需要刷新。偏离模式：「挑战疲劳」——从热爱挑战变成抗拒挑战，因为持续的自我证明已经耗尽了你的内在动力。", "zh-TW": "倦怠信號：「挑剔」可能演變為「厭倦」——厭倦了不斷證明自己。早期預警：越來越多說「這有什麼意義」。偏離模式：「挑戰疲勞」——從熱愛挑戰變成抗拒挑戰。", en: "Burnout signal: Being 'selective' may evolve into 'weary'—tired of the constant self-proving cycle. Early warning: Increasingly saying 'what's the point' signals motivation system needing refresh, not a challenge problem. Derailment pattern: 'Challenge fatigue'—from loving to resisting challenges, as constant self-proving exhausted inner drive." },
    },
    low: {
      meaning: { "zh-CN": "10年以上低CH，你的稳定导向已经深度固化。这在很多场景下是优势——但在快速变化的环境中，过度的稳定偏好可能让你陷入「舒适区监禁」。", "zh-TW": "10年以上低CH，穩定導向已深度固化。過度的穩定偏好可能讓你陷入「舒適區監禁」。", en: "Low CH after 10+ years—your stability orientation is deeply solidified. An advantage in many contexts—but in rapidly changing environments, excessive stability preference may trap you in 'comfort zone imprisonment'." },
      characteristics: { "zh-CN": ["对任何变化都感到本能的抵触和不安", "可能已经很多年没有真正离开过舒适区", "对组织变革的抗拒从「理性分析」变成了「情绪反应」", "可能已经错过了几次重要的转型机会"], "zh-TW": ["對任何變化都感到本能抵觸", "可能很多年沒離開過舒適區", "對變革的抗拒從理性變成情緒反應", "可能已錯過幾次轉型機會"], en: ["Instinctive resistance and unease toward any change", "May not have truly left comfort zone for many years", "Resistance shifted from 'rational analysis' to 'emotional reaction'", "May have missed several important transformation opportunities"] },
      development: { "zh-CN": "你不需要变成一个挑战者——但你需要确保你的「舒适」不是一个陷阱。每年给自己一个小的突破任务：学一项新技能、参与一个跨部门项目、接受一个你通常会拒绝的任务。目的不是让你爱上挑战，而是保持适应能力。", "zh-TW": "你不需要變成挑戰者，但確保「舒適」不是陷阱。每年給自己一個小的突破任務，保持適應能力。", en: "You don't need to become a challenger—but ensure your 'comfort' isn't a trap. Give yourself one small breakthrough task per year: learn a new skill, join a cross-department project, accept a task you'd normally decline. The goal isn't to love challenges, but maintain adaptability." },
      risk: { "zh-CN": "倦怠信号模式：对任何变化的本能抗拒已经从「偏好」变成了「恐惧」——不是不想变，而是怕变了之后无法适应。早期预警：如果你发现组织变革时你的第一反应总是「这行不通」而非「让我想想」，可能是恐惧在驱动而非判断。偏离模式：「舒适区监禁」——舒适区从「安全基地」变成了「牢笼」，你知道应该走出去但已经失去了这种能力。", "zh-TW": "倦怠信號：對變化的抗拒從「偏好」變成了「恐懼」。早期預警：對變革的第一反應總是「這行不通」。偏離模式：「舒適區監禁」——舒適區從安全基地變成了牢籠。", en: "Burnout signal: Resistance shifted from 'preference' to 'fear'—not unwilling to change, but afraid of being unable to adapt. Early warning: If first reaction to change is always 'this won't work' rather than 'let me think,' fear drives rather than judgment. Derailment pattern: 'Comfort zone imprisonment'—comfort zone transforms from 'safe base' to 'prison'; you know you should step out but have lost the ability." },
    },
  },
  executive: {
    high: { meaning: { "zh-CN": "高管阶段高CH让你成为变革型领导者——不满足于现状，持续推动组织突破边界。", "zh-TW": "高管階段高CH讓你成為變革型領導者。", en: "High CH at executive stage makes you a transformational leader—never satisfied with the status quo, continuously pushing organizational boundaries." }, characteristics: { "zh-CN": ["推动组织不断变革和升级", "设定看似不可能的目标", "在危机中表现最佳", "可能让团队感到持续的压力"], "zh-TW": ["推動組織不斷變革", "在危機中表現最佳"], en: ["Drive continuous organizational transformation", "Set seemingly impossible goals", "Perform best in crises", "May create constant pressure for the team"] }, development: { "zh-CN": "你的挑战精神是组织的引擎，但要学会适度。不是所有人都能在持续高压下工作。给团队恢复的时间和空间。", "zh-TW": "你的挑戰精神是引擎，但要學會適度。給團隊恢復的空間。", en: "Your challenger spirit is the organization's engine, but learn moderation. Not everyone can work under constant high pressure. Give your team time and space to recover." }, risk: { "zh-CN": "风险：团队疲劳——你的挑战欲望可能消耗整个组织。建立「挑战-恢复-挑战」的健康节奏。", "zh-TW": "風險：團隊疲勞。建立「挑戰-恢復-挑戰」的健康節奏。", en: "Risk: Team fatigue—your challenge appetite may exhaust the entire organization. Establish a healthy 'challenge-recover-challenge' rhythm." } },
    moderate: { meaning: { "zh-CN": "高管阶段中等CH是一种平衡的领导风格——既能推动变革也能维护稳定。", "zh-TW": "高管階段中等CH是平衡的領導風格。", en: "Moderate CH at executive stage represents balanced leadership—capable of driving change while maintaining stability." }, characteristics: { "zh-CN": ["在变革和稳定之间灵活切换", "选择性地推动关键变革", "团队在你的领导下压力适中"], "zh-TW": ["在變革和穩定之間靈活切換", "選擇性推動關鍵變革"], en: ["Flexibly switch between change and stability", "Selectively push key transformations", "Team faces moderate pressure under your leadership"] }, development: { "zh-CN": "利用你的平衡感成为组织的「稳定器」——在需要变革时推动变革，在需要巩固时保持稳定。", "zh-TW": "利用平衡感成為組織的「穩定器」。", en: "Use your balance to become the organization's 'stabilizer'—push change when needed, maintain stability when required." }, risk: { "zh-CN": "风险：在需要大胆变革的时刻过于保守。信任你的判断力，必要时勇于冒险。", "zh-TW": "風險：在需要大膽變革時過於保守。", en: "Risk: Being too conservative when bold transformation is needed. Trust your judgment and dare to take risks when necessary." } },
    low: { meaning: { "zh-CN": "高管阶段低CH通常意味着你更擅长守成和优化而非变革。这在成熟组织中非常有价值。", "zh-TW": "高管階段低CH意味著你更擅長守成和優化。", en: "Low CH at executive stage typically means you're better at maintaining and optimizing than transforming. This is very valuable in mature organizations." }, characteristics: { "zh-CN": ["擅长维持组织的稳定运营", "在变革中偏向渐进而非激进", "团队在你的领导下感到安全"], "zh-TW": ["擅長維持組織穩定運營", "偏向漸進變革"], en: ["Excel at maintaining stable organizational operations", "Favor gradual over radical change", "Team feels secure under your leadership"] }, development: { "zh-CN": "你的稳定领导力在很多情况下是必需的。但确保你能识别出何时需要变革，并有勇气支持它——即使你不喜欢变化。", "zh-TW": "確保能識別何時需要變革並有勇氣支持。", en: "Your stable leadership is essential in many situations. But ensure you can recognize when transformation is needed and have the courage to support it—even if you don't like change." }, risk: { "zh-CN": "风险：在快速变化的市场中反应太慢。确保你周围有高CH的人来补充你的视角。", "zh-TW": "風險：在快速變化的市場中反應太慢。確保周圍有高CH的人。", en: "Risk: Reacting too slowly in rapidly changing markets. Ensure you have high-CH people around to complement your perspective." } },
  },
};

// ============================================================
// LS - Lifestyle Integration
// ============================================================
const LS_DATA: AnchorStageData = {
  early: {
    high: { meaning: { "zh-CN": "高LS意味着工作与生活的平衡是你最不可妥协的底线。你需要职业服务于整体生活方式，而非相反。", "zh-TW": "高LS意味著工作與生活的平衡是你最不可妥協的底線。", en: "High LS means work-life balance is your most non-negotiable bottom line. You need career to serve your overall lifestyle, not the other way around." }, characteristics: { "zh-CN": ["不愿为工作牺牲个人生活和健康", "对加班文化有本能的抗拒", "重视灵活的工作安排", "把生活质量放在职业成就之前"], "zh-TW": ["不願為工作犧牲個人生活", "對加班文化有本能的抗拒", "重視靈活工作安排"], en: ["Unwilling to sacrifice personal life and health for work", "Instinctive resistance to overtime culture", "Value flexible work arrangements", "Put quality of life before career achievement"] }, development: { "zh-CN": "选择工作时优先考虑：弹性工作制、远程办公、朝九晚五的行业。但注意：前几年适度的投入是必要的——建立能力才有资本谈条件。", "zh-TW": "選擇彈性工作制的環境。前幾年適度投入是必要的。", en: "When choosing work, prioritize: flexible schedules, remote work, 9-to-5 industries. But note: moderate investment in early years is necessary—build capabilities first to have leverage for negotiation." }, risk: { "zh-CN": "风险：在职场初期就过于追求平衡可能导致能力积累不足。前3-5年是能力积累的关键期，适度的「拼搏」是必要投资。", "zh-TW": "風險：在職場初期就過於追求平衡可能導致能力不足。", en: "Risk: Pursuing too much balance early in career may lead to insufficient capability building. The first 3-5 years are critical for skill accumulation—moderate 'hustle' is a necessary investment." } },
    moderate: { meaning: { "zh-CN": "中等LS说明你重视平衡但不是极端追求。你能在必要时暂时牺牲一些生活品质，但不是长期的。", "zh-TW": "中等LS說明你重視平衡但不極端。能在必要時暫時犧牲一些。", en: "Moderate LS means you value balance but aren't extreme. You can temporarily sacrifice some life quality when necessary, but not long-term." }, characteristics: { "zh-CN": ["能在忙碌期短暂牺牲平衡", "但需要定期恢复和充电", "不排斥偶尔的加班但反对成为常态", "在选择工作时会考虑生活影响"], "zh-TW": ["能在忙碌期短暫犧牲平衡", "需要定期恢復和充電"], en: ["Can temporarily sacrifice balance during busy periods", "But need regular recovery and recharging", "Don't object to occasional overtime but oppose it as norm", "Consider life impact when choosing work"] }, development: { "zh-CN": "设定明确的「平衡底线」——什么是你绝对不能牺牲的（如健康、家庭重要时刻），什么是可以灵活的。把底线告诉你的上级和家人。", "zh-TW": "設定明確的「平衡底線」，把底線告訴上級和家人。", en: "Set clear 'balance boundaries'—what you absolutely cannot sacrifice (health, family milestones), what's flexible. Communicate these boundaries to your manager and family." }, risk: { "zh-CN": "风险：底线被一点点侵蚀。很多人最初只接受「偶尔」加班，最后变成了常态。定期检查你的平衡状态。", "zh-TW": "風險：底線被一點點侵蝕。定期檢查平衡狀態。", en: "Risk: Boundaries gradually eroding. Many initially accept 'occasional' overtime that becomes the norm. Regularly check your balance status." } },
    low: { meaning: { "zh-CN": "低LS意味着你愿意且能够为职业目标牺牲生活品质。工作对你来说不仅是谋生，更是自我实现。", "zh-TW": "低LS意味著你願意為職業目標犧牲生活品質。", en: "Low LS means you're willing and able to sacrifice life quality for career goals. Work is not just livelihood but self-actualization for you." }, characteristics: { "zh-CN": ["能长时间高强度工作", "不介意工作占据大部分时间", "可能把工作当成最大的爱好", "对「工作狂」的评价不以为然"], "zh-TW": ["能長時間高強度工作", "不介意工作佔據大部分時間"], en: ["Can work long hours at high intensity", "Don't mind work taking up most of your time", "May treat work as your biggest hobby", "Unfazed by 'workaholic' labels"] }, development: { "zh-CN": "利用你的高投入度快速积累能力和成果。但务必注意健康和关系——很多人在40岁时才发现身体和关系已经被透支了。", "zh-TW": "利用高投入快速積累能力。但務必注意健康和關係。", en: "Use your high investment to rapidly accumulate capabilities and achievements. But pay attention to health and relationships—many discover at 40 that both have been overdrawn." }, risk: { "zh-CN": "风险：健康和关系的长期透支。你可能在40-50岁面临身体崩溃、婚姻危机或孤独感。现在就建立最低限度的健康习惯和社交投入。", "zh-TW": "風險：健康和關係的長期透支。建立最低限度的健康習慣。", en: "Risk: Long-term overdraft on health and relationships. You may face physical breakdown, marriage crisis, or loneliness at 40-50. Establish minimum health habits and social investment now." } },
  },
  mid: {
    high: { meaning: { "zh-CN": "中期高LS说明生活整合是你已确认的核心需求。你可能已经建立了支持这种生活方式的职业模式。", "zh-TW": "中期高LS說明生活整合是你已確認的核心需求。", en: "Mid-career high LS confirms lifestyle integration as your verified core need. You've likely established a career mode supporting this lifestyle." }, characteristics: { "zh-CN": ["可能已选择了灵活的工作安排", "在工作和生活之间有清晰的边界", "不为晋升牺牲生活质量", "可能在其他LS同行眼中「不够上进」"], "zh-TW": ["已選擇了靈活的工作安排", "在工作和生活之間有清晰邊界"], en: ["May have chosen flexible work arrangements", "Clear boundaries between work and life", "Don't sacrifice life quality for promotion", "May be seen as 'not ambitious enough' by others"] }, development: { "zh-CN": "你的生活方式是你的力量来源，不需要为此道歉。但确保你的职业能力在持续增长——这样当你的生活需求变化时（如孩子长大后），你仍然有职业选择权。", "zh-TW": "你的生活方式是力量來源。確保職業能力在持續增長。", en: "Your lifestyle is your source of strength—no need to apologize. But ensure your professional capabilities keep growing—so when life needs change (e.g., after kids grow up), you still have career options." }, risk: { "zh-CN": "风险：职业发展停滞导致未来选择受限。平衡不等于停止成长——在不牺牲生活的前提下，持续投资自己的能力。", "zh-TW": "風險：職業發展停滯導致未來選擇受限。平衡不等於停止成長。", en: "Risk: Career stagnation limiting future options. Balance doesn't mean stopping growth—continue investing in your capabilities without sacrificing life quality." } },
    moderate: { meaning: { "zh-CN": "中期中等LS可能意味着你在不同生活阶段调整了平衡策略。这是一种成熟的表现。", "zh-TW": "中期中等LS可能意味著你在不同階段調整了平衡策略。", en: "Mid-career moderate LS may mean you've adjusted your balance strategy across life stages. This is a sign of maturity." }, characteristics: { "zh-CN": ["灵活地在工作和生活之间分配精力", "在需要时能全力投入工作", "也能在适当时候退回生活模式", "有自己的「平衡哲学」"], "zh-TW": ["靈活分配精力", "有自己的平衡哲學"], en: ["Flexibly allocate energy between work and life", "Can go all-in on work when needed", "Can also retreat to life mode when appropriate", "Have your own 'balance philosophy'"] }, development: { "zh-CN": "继续保持你的灵活性。但随着年龄增长（尤其是有了家庭后），重新评估你的平衡标准——以前觉得可以接受的加班频率，现在可能不再适合。", "zh-TW": "繼續保持靈活性。但隨年齡增長重新評估平衡標準。", en: "Continue maintaining your flexibility. But as you age (especially with family), reassess your balance standards—overtime frequency that was once acceptable may no longer be." }, risk: { "zh-CN": "风险：在照顾他人（孩子、父母）的压力下失去自己的平衡空间。给自己留出「不是为了任何人的时间」。", "zh-TW": "風險：在照顧他人的壓力下失去自己的空間。", en: "Risk: Losing your own balance space under pressure of caring for others (children, parents). Reserve time that's 'not for anyone else'." } },
    low: { meaning: { "zh-CN": "中期低LS说明你仍然愿意为职业投入大量的时间和精力。但随着年龄增长，这种模式的可持续性需要关注。", "zh-TW": "中期低LS說明你仍願意為職業投入大量時間。可持續性需要關注。", en: "Mid-career low LS means you're still willing to invest heavily in career. But as you age, the sustainability of this pattern needs attention." }, characteristics: { "zh-CN": ["工作仍然是生活的中心", "可能已经出现健康或关系警信号", "对「平衡」话题不太在意", "认为成就比舒适更重要"], "zh-TW": ["工作仍然是生活中心", "可能已出現健康或關係警訊"], en: ["Work remains life's center", "May already show health or relationship warning signs", "Not too concerned about 'balance' discussions", "Believe achievement matters more than comfort"] }, development: { "zh-CN": "如果你选择这种模式，至少做好两件事：1）建立不可商量的健康底线（运动、睡眠、体检）；2）定期与重要的人进行深度沟通。30-40岁的透支，通常在50岁以后集中爆发。", "zh-TW": "建立不可商量的健康底線和維護重要關係。30-40歲的透支，50歲後集中爆發。", en: "If you choose this pattern, at least do two things: 1) Establish non-negotiable health baselines (exercise, sleep, checkups); 2) Regularly have deep conversations with important people. Overdraft at 30-40 typically explodes after 50." }, risk: { "zh-CN": "风险：健康崩溃、关系破裂、或者突然的「中年危机」——发现除了工作头衔，你的人生似乎空空如也。这不是危言耸听，是很多高成就者的真实经历。", "zh-TW": "風險：健康崩潰、關係破裂或突然的「中年危機」。", en: "Risk: Health collapse, relationship breakdown, or sudden 'midlife crisis'—discovering that besides your job title, your life seems empty. This isn't alarmist—it's the real experience of many high achievers." } },
  },
  senior: {
    high: {
      meaning: { "zh-CN": "10年以上高LS，生活整合是你长期坚持的结果，也是你职业身份的一部分。但此阶段可能出现的矛盾是：你的工作虽然有良好的平衡，但职业发展可能因此停滞——你需要评估这是主动的权衡还是被动的代价。", "zh-TW": "10年以上高LS，生活整合是你長期堅持的結果。但職業發展可能因此停滯——需要評估這是主動的權衡還是被動的代價。", en: "High LS after 10+ years—lifestyle integration is your long-term achievement and part of your professional identity. But a potential contradiction: while work has good balance, career development may have stalled—evaluate whether this is active trade-off or passive cost." },
      characteristics: { "zh-CN": ["工作与生活边界清晰且稳定", "对工作的热情可能逐渐下降——工作变成了「生活的一部分」而非核心", "可能面临收入天花板——拒绝需要更多投入的晋升意味着放弃加薪", "生活维度丰富但职业身份可能模糊"], "zh-TW": ["工作與生活邊界清晰穩定", "對工作熱情可能逐漸下降", "可能面臨收入天花板", "生活豐富但職業身份可能模糊"], en: ["Clear and stable work-life boundaries", "Work enthusiasm may be gradually declining—work becomes 'part of life' rather than core", "May face income ceiling—refusing promotion means forgoing raises", "Rich life dimensions but professional identity may be blurring"] },
      development: { "zh-CN": "如果你对当前状态满意——恭喜，你实现了很多人追求的平衡。但定期检查：1）你的职业能力是否在持续成长？如果生活需求变化（如孩子长大后），你是否还有选择权？2）你的收入是否足以支持你想要的生活方式，包括未来的医疗、教育、养老？3）你是否有足够的职业成就感？如果答案都是肯定的，继续保持。", "zh-TW": "如果對當前狀態滿意——恭喜。但定期檢查職業能力是否持續成長、收入是否足夠、是否有職業成就感。", en: "If satisfied with current state—congratulations, you've achieved the balance many pursue. But periodically check: 1) Are capabilities still growing? Will you have career options when life needs change? 2) Is income sufficient for future healthcare, education, retirement? 3) Do you have enough career fulfillment? If all yes, keep going." },
      risk: { "zh-CN": "倦怠信号模式：不是对工作倦怠，而是对职业逐渐失去兴趣和认同——工作变成了纯粹的「谋生手段」，你不再觉得自己在做有意义的事。早期预警：如果你发现自己越来越少谈论工作，对职业话题感到无聊，可能意味着职业身份在弱化。偏离模式：「工作边缘化」——生活丰富但职业空心，一旦生活需求增加（医疗、教育、养老），可能发现职业能力和收入都无法支撑。", "zh-TW": "倦怠信號：對職業逐漸失去興趣——工作變成純粹的「謀生手段」。早期預警：越來越少談論工作，對職業話題感到無聊。偏離模式：「工作邊緣化」——生活豐富但職業空心。", en: "Burnout signal: Not work burnout, but gradually losing interest and identification with career—work becomes purely 'means of livelihood.' Early warning: Increasingly avoiding work topics and finding career conversations boring signals weakening professional identity. Derailment pattern: 'Work marginalization'—rich life but hollow career; when life demands increase, both capability and income may prove insufficient." },
    },
    moderate: {
      meaning: { "zh-CN": "10年以上中等LS，你的平衡策略已经成熟——在工作和生活之间有灵活的调和能力。但随着年龄增长，新的压力源可能出现：上有老下有小、健康开始需要关注、同龄人的攀比压力。", "zh-TW": "10年以上中等LS，平衡策略已成熟。但新的壓力源可能出現：上有老下有小、健康需要關注。", en: "Moderate LS after 10+ years—your balance strategy has matured. But new stressors may emerge with age: caring for elderly parents and young children, health needing attention, peer comparison pressure." },
      characteristics: { "zh-CN": ["在多重角色（职场人、父母、子女）之间灵活切换", "可能在照顾他人的过程中失去自己的空间", "平衡从「两方」变成了「多方」——更加复杂", "可能开始感到「被各方需要但没人关心我」"], "zh-TW": ["在多重角色間靈活切換", "可能在照顧他人中失去自己的空間", "平衡從「兩方」變成「多方」", "可能感到「被各方需要但沒人關心我」"], en: ["Flexibly switching between multiple roles (professional, parent, child)", "May lose personal space while caring for others", "Balance shifts from 'two-way' to 'multi-way'—more complex", "May feel 'everyone needs me but nobody cares about me'"] },
      development: { "zh-CN": "在照顾他人的同时，不要忘记照顾自己。设定「属于自己的时间」——不是为了孩子、不是为了父母、不是为了工作，纯粹是为了你自己。即使每周只有2小时，也比完全没有好得多。", "zh-TW": "在照顧他人的同時不要忘記照顧自己。設定「屬於自己的時間」——純粹為了你自己。", en: "While caring for others, don't forget yourself. Set 'time purely for you'—not for kids, parents, or work. Even 2 hours weekly is much better than nothing." },
      risk: { "zh-CN": "倦怠信号模式：在照顾他人中逐渐失去自我——你的需求永远排在最后，直到有一天你发现自己已经不知道「我想要什么」了。早期预警：如果有人问你「你最近有什么想做的事」，而你完全答不上来，说明你的个人需求已经被压抑太久。偏离模式：「过度妥协」——为了家庭和他人牺牲了所有的职业发展机会和个人空间，积累的怨恨可能在某个临界点爆发。", "zh-TW": "倦怠信號：在照顧他人中失去自我——你的需求永遠排最後。早期預警：被問到「你想做什麼」時完全答不上來。偏離模式：「過度妥協」——犧牲所有職業和個人空間，積累的怨恨可能爆發。", en: "Burnout signal: Gradually losing yourself while caring for others—your needs always come last until you no longer know 'what do I want.' Early warning: Unable to answer 'what do you want to do lately' means personal needs suppressed too long. Derailment pattern: 'Over-compromise'—sacrificing all career and personal space for family, accumulated resentment may explode at a tipping point." },
    },
    low: {
      meaning: { "zh-CN": "10年以上低LS，30-40岁的长期透支可能开始集中爆发。此阶段你可能开始收到身体和关系的「账单」——慢性疾病、婚姻危机、与子女的疏离、突然的意义危机。这不是危言耸听，而是很多高成就者的真实轨迹。", "zh-TW": "10年以上低LS，30-40歲的長期透支可能開始集中爆發。你可能開始收到身體和關係的「帳單」——慢性疾病、婚姻危機、意義危機。", en: "Low LS after 10+ years—long-term overdraft from 30-40s may start exploding. You may begin receiving 'bills' from body and relationships—chronic illness, marriage crisis, estrangement from children, sudden meaning crisis. This isn't alarmist—it's the real trajectory of many high achievers." },
      characteristics: { "zh-CN": ["身体开始出现明显的警告信号（慢性疲劳、三高、心脏问题、免疫力下降）", "重要关系严重受损或已破裂（配偶抱怨、孩子疏远）", "除了工作之外不知道自己是谁——工作身份 = 全部身份", "可能突然陷入「这一切值得吗」的存在性焦虑"], "zh-TW": ["身體出現明顯警告信號（慢性疲勞、三高、心臟問題）", "重要關係嚴重受損", "除了工作不知道自己是誰", "可能突然陷入存在性焦慮"], en: ["Body showing clear warnings (chronic fatigue, high blood pressure/cholesterol/sugar, heart issues, weakened immunity)", "Important relationships severely damaged or broken", "Don't know who you are besides work—work identity = total identity", "May suddenly fall into existential anxiety of 'was all this worth it'"] },
      development: { "zh-CN": "现在开始永远不晚，但代价会比年轻时高得多。你需要：1）立即建立最低限度的健康管理——定期体检、治疗已有问题、基础运动（每天走路30分钟就好）；2）修复重要关系——即使不能完全恢复，也要建立最低限度的连接（每周和家人吃一顿饭就是开始）；3）开始培养工作之外的身份——哪怕只是一个小爱好。重新学习「我是谁，而不仅仅是我的工作头衔」。", "zh-TW": "現在開始永遠不晚。建立最低限度的健康管理、修復重要關係、培養工作之外的身份。", en: "It's never too late, but the cost is much higher now. You need: 1) Minimum health management immediately—regular checkups, treat existing issues, basic exercise (30-minute daily walk is enough); 2) Repair key relationships—establish minimum connection even if not fully recoverable (one family dinner weekly is a start); 3) Cultivate identity beyond work—even a small hobby. Relearn 'who am I, beyond my job title'." },
      risk: { "zh-CN": "倦怠信号模式：这个阶段的倦怠已经不是工作倦怠，而是「存在性倦怠」——对整个人生感到疲惫和空虚。健康警告信号（慢性病、失眠、抑郁）可能同时出现。你的身体在用疼痛告诉你它已经到了极限。早期预警：如果你开始频繁地问自己「我这一辈子到底为了什么」，这是深层的意义危机信号——不要忽视它。偏离模式：「中年危机式崩溃」——突然的健康崩溃、离婚、辞职、或其他激进的人生重置行为，因为长期压抑的矛盾集中爆发。这种崩溃往往是最危险的，因为它来得毫无征兆。", "zh-TW": "倦怠信號：不是工作倦怠而是「存在性倦怠」——對整個人生感到疲憊和空虛。早期預警：頻繁問「我這一輩子到底為了什麼」。偏離模式：「中年危機式崩潰」——突然的健康崩潰、離婚、辭職，長期壓抑的矛盾集中爆發。", en: "Burnout signal: Not work burnout but 'existential burnout'—fatigue and emptiness about life itself. Health warnings (chronic illness, insomnia, depression) may appear simultaneously. Your body uses pain to signal it's reached its limit. Early warning: Frequently asking 'what has my whole life been for' signals deep meaning crisis—don't ignore it. Derailment pattern: 'Midlife crisis collapse'—sudden health breakdown, divorce, resignation, or radical life reset, because long-suppressed contradictions explode together. Often the most dangerous because it appears without warning." },
    },
  },
  executive: {
    high: { meaning: { "zh-CN": "高管阶段高LS说明你可能在重新定义「成功」——从外在成就转向内在满足和生活质量。", "zh-TW": "高管階段高LS說明你在重新定義「成功」。", en: "High LS at executive stage suggests you may be redefining 'success'—from external achievement to inner fulfillment and quality of life." }, characteristics: { "zh-CN": ["开始为退休后的生活做规划", "减少工作时间，增加个人兴趣", "关注健康、家庭和精神成长", "可能在考虑从全职转向兼职或顾问"], "zh-TW": ["開始為退休做規劃", "減少工作時間，增加個人興趣"], en: ["Starting to plan for post-retirement life", "Reducing work hours, increasing personal interests", "Focus on health, family, and spiritual growth", "May be considering transitioning from full-time to part-time or consulting"] }, development: { "zh-CN": "这是正常且健康的转变。利用你的资源和自由度，设计你理想的「第三人生」——不必在工作和生活之间选择，而是创造一种整合的生活方式。", "zh-TW": "這是健康的轉變。設計你理想的「第三人生」。", en: "This is a normal and healthy transition. Use your resources and freedom to design your ideal 'third act'—not choosing between work and life, but creating an integrated lifestyle." }, risk: { "zh-CN": "风险：突然从高强度工作退下来可能导致失落感和意义危机。渐进式地过渡，而非突然中断。", "zh-TW": "風險：突然退下來可能導致失落感。漸進式過渡。", en: "Risk: Suddenly stepping down from high-intensity work may cause a sense of loss and meaning crisis. Transition gradually, not abruptly." } },
    moderate: { meaning: { "zh-CN": "高管阶段中等LS是健康的状态——你既投入工作也关注生活，有意识地管理两者的关系。", "zh-TW": "高管階段中等LS是健康的狀態。", en: "Moderate LS at executive stage is a healthy state—you're invested in work while attending to life, consciously managing both." }, characteristics: { "zh-CN": ["在工作和生活之间有成熟的调和", "有丰富的工作外兴趣和关系", "能享受工作成果也能享受生活"], "zh-TW": ["在工作和生活之間有成熟調和", "有豐富的工作外興趣"], en: ["Mature reconciliation between work and life", "Rich interests and relationships outside work", "Can enjoy both work achievements and life"] }, development: { "zh-CN": "你的平衡能力是给团队的最好示范。帮助年轻领导者理解平衡的重要性——通过你的榜样而非说教。", "zh-TW": "你的平衡能力是最好示範。通過榜樣幫助年輕領導者。", en: "Your balance ability is the best example for your team. Help young leaders understand the importance of balance—through your example, not preaching." }, risk: { "zh-CN": "风险：较低。但要注意不要因为自己平衡得好就期望所有人都能做到——每个人的生活情况不同。", "zh-TW": "注意不要期望所有人都能做到一樣的平衡。", en: "Low risk. But be careful not to expect everyone to balance as well—everyone's life situation is different." } },
    low: { meaning: { "zh-CN": "高管阶段低LS说明工作仍然是你生命的核心。你可能是那种「退休就生病」的类型。", "zh-TW": "高管階段低LS說明工作仍是你生命核心。", en: "Low LS at executive stage means work remains your life's core. You might be the type who 'gets sick upon retirement'." }, characteristics: { "zh-CN": ["无法想象没有工作的生活", "工作就是最大的兴趣", "可能已经牺牲了很多个人关系和健康"], "zh-TW": ["無法想像沒有工作的生活", "工作就是最大的興趣"], en: ["Cannot imagine life without work", "Work is your greatest interest", "May have already sacrificed many personal relationships and health"] }, development: { "zh-CN": "认真思考：如果明天必须退休，你的生活会怎样？开始培养工作以外的身份认同——即使只是小爱好。你需要在「工作=我」的等式中增加一些新变量。", "zh-TW": "認真思考退休後的生活。開始培養工作以外的身份認同。", en: "Seriously consider: If you had to retire tomorrow, what would your life look like? Start cultivating identity beyond work—even just small hobbies. You need to add new variables to the 'work = me' equation." }, risk: { "zh-CN": "风险：退休后的身份危机和健康崩溃。很多终身工作型领导者在退休后迅速衰老。现在就开始投资工作以外的生活维度。", "zh-TW": "風險：退休後的身份危機和健康崩潰。現在開始投資工作以外的生活。", en: "Risk: Identity crisis and health collapse after retirement. Many lifelong workers age rapidly after retiring. Start investing in life dimensions outside work now." } },
  },
};

// ============================================================
// Export all data
// ============================================================
export const STAGE_INTERPRETATIONS: Record<string, AnchorStageData> = {
  TF: TF_DATA,
  GM: GM_DATA,
  AU: AU_DATA,
  SE: SE_DATA,
  EC: EC_DATA,
  SV: SV_DATA,
  CH: CH_DATA,
  LS: LS_DATA,
};

/**
 * Get stage-specific interpretation for an anchor
 */
export function getStageInterpretation(
  anchor: string,
  stage: CareerStage,
  score: number
): StageInterpretation | null {
  if (stage === "hr") return null;

  const anchorData = STAGE_INTERPRETATIONS[anchor];
  if (!anchorData) return null;

  const stageData = anchorData[stage];
  if (!stageData) return null;

  // Standardized 0-100 scale thresholds
  let band: ScoreBand;
  if (score >= 80) band = "high";
  else if (score >= 60) band = "moderate";
  else band = "low";

  return stageData[band];
}

/**
 * Get all anchor interpretations for a given stage
 */
export function getAllStageInterpretations(
  scores: Record<string, number>,
  stage: CareerStage,
): Record<string, StageInterpretation | null> {
  const result: Record<string, StageInterpretation | null> = {};
  for (const [anchor, score] of Object.entries(scores)) {
    result[anchor] = getStageInterpretation(anchor, stage, Number(score));
  }
  return result;
}
