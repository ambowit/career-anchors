/**
 * Default career stage descriptions — pre-populated on first load.
 * Super admin can edit via Report Generator → Career Stages tab.
 */

export interface StageDefault {
  stage_key: string;
  title_zh_tw: string;
  title_zh_cn: string;
  title_en: string;
  description_zh_tw: string;
  description_zh_cn: string;
  description_en: string;
}

export const CAREER_STAGE_DEFAULTS: StageDefault[] = [
  {
    stage_key: "entry",
    title_zh_tw: "職場新人（年資 0–5 年）",
    title_zh_cn: "职场新人（年资 0–5 年）",
    title_en: "Early Career (0–5 Years)",
    description_zh_tw: `在職涯的最初階段，個人的職業身份仍處於建構與探索過程中，尚未完全定型。此群體不僅包括已進入全職工作的職場新人，也包括仍在學期間、但已透過實習、工讀、專案參與、產學合作或兼職工作接觸職場情境的學生。這些早期工作經驗，無論時間長短，都會對個體的職業認知、自我效能感與未來職涯方向產生實質影響。
在此階段，個體正逐步回答一個核心發展問題：「我是什麼樣的專業工作者？」這個問題的答案，並非來自單一決定，而是透過實際工作經驗、角色回饋與環境互動逐漸形成。每一次實習、每一份工讀、以及每一項正式或非正式的工作角色，都在幫助個體辨識自己在哪些情境中感到投入與有能量，又在哪些情境中感到限制或不適。
因此，此階段的職業錨測評結果，並不是對未來職涯做出最終定論，而是用來辨識：在什麼樣的工作條件、角色期待與組織環境中，個體較容易產生內在動機與持續投入；以及在哪些情境下，可能較容易出現壓力、動機下降或角色不適配的感受。
換言之，測評分數反映的是當前發展階段的心理傾向與敏感區域，而非固定不變的職涯標籤。對於學生與職場新人而言，這些結果特別具有探索意義，因為其職業身份仍具高度可塑性。解讀時應採取發展性視角，將其視為一種方向指引與實驗依據，協助個體更有意識地選擇實習機會、第一份工作與早期職涯角色，並透過實際經驗逐步驗證自我概念與職場環境之間的契合程度。
在此階段，職涯發展的重點並非立即做出終身性的職業決定，而是透過有結構的嘗試與反思，加速以下三項關鍵發展任務：首先，辨識自身動機與能力的自然傾向；其次，理解不同工作環境對自身心理能量的影響；最後，逐步形成清晰且穩定的專業身份定位。
透過這種探索導向的發展過程，學生與職場新人能夠在較低風險的階段建立對自身職涯方向的理解，為後續更高責任與更長期的職涯選擇奠定穩固基礎。`,
    description_zh_cn: `在职涯的最初阶段，个人的职业身份仍处于建构与探索过程中，尚未完全定型。此群体不仅包括已进入全职工作的职场新人，也包括仍在学期间、但已通过实习、工读、项目参与、产学合作或兼职工作接触职场情境的学生。这些早期工作经验，无论时间长短，都会对个体的职业认知、自我效能感与未来职涯方向产生实质影响。
在此阶段，个体正逐步回答一个核心发展问题："我是什么样的专业工作者？"这个问题的答案，并非来自单一决定，而是通过实际工作经验、角色反馈与环境互动逐渐形成。每一次实习、每一份工读、以及每一项正式或非正式的工作角色，都在帮助个体辨识自己在哪些情境中感到投入与有能量，又在哪些情境中感到限制或不适。
因此，此阶段的职业锚测评结果，并不是对未来职涯做出最终定论，而是用来辨识：在什么样的工作条件、角色期待与组织环境中，个体较容易产生内在动机与持续投入；以及在哪些情境下，可能较容易出现压力、动机下降或角色不适配的感受。
换言之，测评分数反映的是当前发展阶段的心理倾向与敏感区域，而非固定不变的职涯标签。对于学生与职场新人而言，这些结果特别具有探索意义，因为其职业身份仍具高度可塑性。解读时应采取发展性视角，将其视为一种方向指引与实验依据，协助个体更有意识地选择实习机会、第一份工作与早期职涯角色，并通过实际经验逐步验证自我概念与职场环境之间的契合程度。
在此阶段，职涯发展的重点并非立即做出终身性的职业决定，而是通过有结构的尝试与反思，加速以下三项关键发展任务：首先，辨识自身动机与能力的自然倾向；其次，理解不同工作环境对自身心理能量的影响；最后，逐步形成清晰且稳定的专业身份定位。
通过这种探索导向的发展过程，学生与职场新人能够在较低风险的阶段建立对自身职涯方向的理解，为后续更高责任与更长期的职涯选择奠定稳固基础。`,
    description_en: `In the earliest stage of a career, one's professional identity is still being formed and explored—not yet fully defined. This group includes not only those who have entered full-time employment, but also students who have gained exposure to professional settings through internships, part-time work, project participation, industry-academia collaborations, or freelance work. These early work experiences, regardless of duration, have a substantive impact on an individual's professional self-concept, self-efficacy, and future career direction.
At this stage, individuals are gradually answering a core developmental question: "What kind of professional am I?" The answer does not come from a single decision, but forms progressively through real work experiences, role feedback, and environmental interactions. Every internship, every part-time job, and every formal or informal work role helps individuals identify which situations energize them and which create feelings of limitation or discomfort.
Therefore, career anchor assessment results at this stage are not final verdicts on one's future career, but tools for identifying: under what working conditions, role expectations, and organizational environments an individual is more likely to experience intrinsic motivation and sustained engagement; and under what circumstances stress, declining motivation, or role mismatch may more readily occur.
In other words, assessment scores reflect the psychological tendencies and sensitive areas of the current developmental stage, not fixed career labels. For students and early-career professionals, these results are particularly valuable for exploration, as their professional identity remains highly malleable. Interpretation should adopt a developmental perspective, treating results as directional guidance and experimental evidence—helping individuals more consciously select internship opportunities, first jobs, and early career roles, and progressively verify the fit between self-concept and professional environment through actual experience.
At this stage, the focus of career development is not to make a lifetime career decision immediately, but to accelerate three key developmental tasks through structured experimentation and reflection: first, identifying natural tendencies in motivation and capability; second, understanding how different work environments affect psychological energy; and finally, gradually forming a clear and stable professional identity.
Through this exploration-oriented development process, students and early-career professionals can build understanding of their career direction during a lower-risk phase, laying a solid foundation for subsequent higher-responsibility and longer-term career choices.`,
  },
  {
    stage_key: "mid",
    title_zh_tw: "職涯中前期（6–12 年）",
    title_zh_cn: "职涯中前期（6–12 年）",
    title_en: "Mid-Early Career (6–12 Years)",
    description_zh_tw: `中期職涯發展可分為職涯中前期（6–12年）與職涯中後期（12年以上）兩個階段來分析。中期職涯人士的核心議題，不再是潛力是否足夠，而是個體是否願意為自己的選擇承擔責任。在這一階段，真正重要的不是「還能成長多少」，而是是否願意為所選擇的方向做出清晰承諾，並將持續學習與能力提升視為個人責任，而非組織給予的機會。
對於職涯中前期（6–12年）的專業人士而言，這是一段「方向確認與結構定型」的關鍵期。多數人已累積一定專業能力與實務經驗，開始面臨角色轉型——從執行者走向整合者，從個人貢獻者逐步承擔帶人、帶專案或跨部門協作的責任。
此階段的核心張力在於：是否願意放棄「保留選項」的安全感，而真正做出選擇。
許多人在這個時期會出現以下心理拉扯：
•       明確知道自己擅長什麼，但尚未完全確認是否願意長期深耕。
•       開始看見管理或更大責任的可能性，卻對身份轉換感到不安。
•       意識到專業深化與角色擴張之間存在取捨。
此時最關鍵的問題已經改變，不是潛力大小，而是所做的選擇是否與核心價值一致，以及是否能夠承載長期投入所必然帶來的責任與代價。在這個階段成熟的標誌，不只是升遷或加薪，而是開始能夠自覺地說：
•       這是我選擇的路徑。
•       這是我願意承擔的責任。
•       這是我決定持續投入與精進的方向。
當學習不再只是為了證明自己，而是為了鞏固自己所選擇的方向；當能力提升不再只是因應評估制度，而是出於自我要求，中前期職涯才真正進入穩定成形的狀態。`,
    description_zh_cn: `中期职涯发展可分为职涯中前期（6–12年）与职涯中后期（12年以上）两个阶段来分析。中期职涯人士的核心议题，不再是潜力是否足够，而是个体是否愿意为自己的选择承担责任。在这一阶段，真正重要的不是"还能成长多少"，而是是否愿意为所选择的方向做出清晰承诺，并将持续学习与能力提升视为个人责任，而非组织给予的机会。
对于职涯中前期（6–12年）的专业人士而言，这是一段"方向确认与结构定型"的关键期。多数人已累积一定专业能力与实务经验，开始面临角色转型——从执行者走向整合者，从个人贡献者逐步承担带人、带项目或跨部门协作的责任。
此阶段的核心张力在于：是否愿意放弃"保留选项"的安全感，而真正做出选择。
许多人在这个时期会出现以下心理拉扯：
•       明确知道自己擅长什么，但尚未完全确认是否愿意长期深耕。
•       开始看见管理或更大责任的可能性，却对身份转换感到不安。
•       意识到专业深化与角色扩张之间存在取舍。
此时最关键的问题已经改变，不是潜力大小，而是所做的选择是否与核心价值一致，以及是否能够承载长期投入所必然带来的责任与代价。在这个阶段成熟的标志，不只是升迁或加薪，而是开始能够自觉地说：
•       这是我选择的路径。
•       这是我愿意承担的责任。
•       这是我决定持续投入与精进的方向。
当学习不再只是为了证明自己，而是为了巩固自己所选择的方向；当能力提升不再只是因应评估制度，而是出于自我要求，中前期职涯才真正进入稳定成形的状态。`,
    description_en: `Mid-career development can be analyzed in two phases: Mid-Early Career (6–12 years) and Mid-Late Career (12+ years). The core issue for mid-career professionals is no longer whether potential is sufficient, but whether the individual is willing to take responsibility for their choices. At this stage, what truly matters is not "how much more can I grow," but whether one is willing to make a clear commitment to a chosen direction and treat continuous learning and capability development as a personal responsibility rather than an opportunity granted by the organization.
For Mid-Early Career (6–12 years) professionals, this is a critical period of "direction confirmation and structural solidification." Most have accumulated substantial professional capabilities and practical experience, and are beginning to face role transitions—from executor to integrator, from individual contributor to gradually taking on responsibilities for leading people, managing projects, or facilitating cross-departmental collaboration.
The core tension at this stage lies in: whether one is willing to give up the safety of "keeping options open" and truly make a choice.
Many people during this period experience the following psychological tensions:
• Clearly knowing what they excel at, but not yet fully confirming whether they are willing to commit long-term.
• Beginning to see possibilities for management or greater responsibility, yet feeling uneasy about identity transformation.
• Recognizing that trade-offs exist between deepening expertise and expanding roles.
At this point, the most critical question has changed—it is not about the magnitude of potential, but whether the choices made are consistent with core values, and whether one can bear the responsibilities and costs that long-term commitment inevitably brings. The mark of maturity at this stage is not just promotion or salary increase, but beginning to consciously say:
• This is the path I have chosen.
• This is the responsibility I am willing to bear.
• This is the direction I have decided to continuously invest in and refine.
When learning is no longer just about proving oneself but about consolidating one's chosen direction; when capability development is no longer just about meeting evaluation criteria but stems from self-imposed standards—the mid-early career phase has truly entered a state of stable formation.`,
  },
  {
    stage_key: "senior",
    title_zh_tw: "職涯中後期（12 年以上）",
    title_zh_cn: "职涯中后期（12 年以上）",
    title_en: "Mid-Late Career (12+ Years)",
    description_zh_tw: `中期職涯發展可分為職涯中前期（6–12年）與職涯中後期（12年以上）兩個階段來分析。中期職涯人士的核心議題，不再是潛力是否足夠，而是個體是否願意為自己的選擇承擔責任。在這一階段，真正重要的不是「還能成長多少」，而是是否願意為所選擇的方向做出清晰承諾，並將持續學習與能力提升視為個人責任，而非組織給予的機會。
對於職涯中後期（12年以上）的專業人士而言，焦點已從「選擇什麼方向」轉向「如何承載這個方向的長期結果」。這是一個價值整合與身份穩固的階段。個體已不再頻繁嘗試不同可能性，而是面對更深層的問題：
•       我是否仍認同自己當年的選擇？
•       這條路是否仍然符合我的核心價值與生活定位？
•       我是否願意為這條路所帶來的責任、壓力與代價持續承擔？
這個階段最大的風險，不是能力不足，而是價值錯位。當外在成就與內在認同逐漸脫節，容易出現倦怠、冷漠或動機下降。反之，當角色、價值與長期投入形成一致結構，則會產生高度穩定且有影響力的專業成熟度。在職涯中後期成熟的標誌，並不只是職位高度或資歷長度，而是能夠清晰而平靜地說：
•       這條路是我選擇的。
•       這些責任是我承擔的。
•       這份投入，是我自願而非被迫的。
此時，學習已不再是為了競爭或證明，而是為了維持專業尊嚴與價值一致性。成長不再只是向上擴張，而是向內深化。能力提升不是為了下一個機會，而是為了對得起自己所承諾的人生方向。
當一個人能夠在這個階段保持價值與選擇的一致性，中期職涯才真正走向成熟與穩定；否則，即使外在位置穩固，內在仍可能處於漂移狀態。`,
    description_zh_cn: `中期职涯发展可分为职涯中前期（6–12年）与职涯中后期（12年以上）两个阶段来分析。中期职涯人士的核心议题，不再是潜力是否足够，而是个体是否愿意为自己的选择承担责任。在这一阶段，真正重要的不是"还能成长多少"，而是是否愿意为所选择的方向做出清晰承诺，并将持续学习与能力提升视为个人责任，而非组织给予的机会。
对于职涯中后期（12年以上）的专业人士而言，焦点已从"选择什么方向"转向"如何承载这个方向的长期结果"。这是一个价值整合与身份稳固的阶段。个体已不再频繁尝试不同可能性，而是面对更深层的问题：
•       我是否仍认同自己当年的选择？
•       这条路是否仍然符合我的核心价值与生活定位？
•       我是否愿意为这条路所带来的责任、压力与代价持续承担？
这个阶段最大的风险，不是能力不足，而是价值错位。当外在成就与内在认同逐渐脱节，容易出现倦怠、冷漠或动机下降。反之，当角色、价值与长期投入形成一致结构，则会产生高度稳定且有影响力的专业成熟度。在职涯中后期成熟的标志，并不只是职位高度或资历长度，而是能够清晰而平静地说：
•       这条路是我选择的。
•       这些责任是我承担的。
•       这份投入，是我自愿而非被迫的。
此时，学习已不再是为了竞争或证明，而是为了维持专业尊严与价值一致性。成长不再只是向上扩张，而是向内深化。能力提升不是为了下一个机会，而是为了对得起自己所承诺的人生方向。
当一个人能够在这个阶段保持价值与选择的一致性，中期职涯才真正走向成熟与稳定；否则，即使外在位置稳固，内在仍可能处于漂移状态。`,
    description_en: `Mid-career development can be analyzed in two phases: Mid-Early Career (6–12 years) and Mid-Late Career (12+ years). The core issue for mid-career professionals is no longer whether potential is sufficient, but whether the individual is willing to take responsibility for their choices. At this stage, what truly matters is not "how much more can I grow," but whether one is willing to make a clear commitment to a chosen direction and treat continuous learning and capability development as a personal responsibility rather than an opportunity granted by the organization.
For Mid-Late Career (12+ years) professionals, the focus has shifted from "what direction to choose" to "how to bear the long-term consequences of that direction." This is a stage of value integration and identity consolidation. Individuals no longer frequently try different possibilities, but face deeper questions:
• Do I still identify with the choices I made years ago?
• Does this path still align with my core values and life positioning?
• Am I willing to continue bearing the responsibilities, pressures, and costs that this path brings?
The greatest risk at this stage is not insufficient capability, but value misalignment. When external achievements and internal identity gradually disconnect, burnout, apathy, or declining motivation can easily emerge. Conversely, when role, values, and long-term commitment form a coherent structure, a highly stable and influential professional maturity develops. The mark of maturity in the mid-late career is not just the height of one's position or the length of one's tenure, but the ability to say clearly and calmly:
• This path is one I chose.
• These responsibilities are ones I bear.
• This commitment is voluntary, not coerced.
At this point, learning is no longer about competition or proving oneself, but about maintaining professional dignity and value consistency. Growth is no longer just about upward expansion, but about inward deepening. Capability development is not for the next opportunity, but for living up to the life direction one has committed to.
When a person can maintain consistency between values and choices at this stage, the mid-career phase truly moves toward maturity and stability; otherwise, even if the external position is secure, the internal state may still be drifting.`,
  },
  {
    stage_key: "executive",
    title_zh_tw: "高階管理者",
    title_zh_cn: "高阶管理者",
    title_en: "Senior Executive",
    description_zh_tw: `高階管理者代表一種獨特的職涯定位——在組織體系中承擔高層決策責任的資深管理者，他們的職責已從個人績效轉向組織績效，從執行層面轉向策略層面。
在此階段，職業錨的意義已不再是「發現方向」或「選擇路徑」，而是進入「發揮最大價值」的狀態。個體的職業身份已高度成形，核心價值觀與行為模式已經過長年驗證與鞏固。此時的測評結果反映的，不是探索性傾向，而是成熟定型的專業定位。
對高管而言，關鍵議題是：如何在組織需求與個人價值之間維持長期一致性？如何在權力結構中保持專業初心？如何在戰略佈局中融入自身職業錨的核心驅動力？
在這一階段，不同職業錨類型展現出各自的成熟面貌：
•       技術型錨點者成為產業內受尊崇的專家，以深度知識影響行業標準。
•       管理型錨點者掌握全局視野，引領組織變革與人才發展。
•       服務型錨點者將影響力擴展至社會層面，成為行業倡導者或社區領袖。
•       自主型錨點者創造高度個人化的工作模式，實現真正的職涯自由。
此時不再焦慮，而是穩定輸出。成熟的標誌不是沒有挑戰，而是面對挑戰時能夠依循內在價值體系做出決策，而非被外在壓力左右。
因此，測評結果對高管的解讀重點在於：確認當前角色與核心價值的契合度；辨識可能出現的價值錯位風險（特別是在組織轉型期間）；以及為下一階段的影響力擴展與傳承佈局提供心理定位的參考依據。`,
    description_zh_cn: `高阶管理者代表一种独特的职涯定位——在组织体系中承担高层决策责任的资深管理者，他们的职责已从个人绩效转向组织绩效，从执行层面转向策略层面。
在此阶段，职业锚的意义已不再是"发现方向"或"选择路径"，而是进入"发挥最大价值"的状态。个体的职业身份已高度成形，核心价值观与行为模式已经过长年验证与巩固。此时的测评结果反映的，不是探索性倾向，而是成熟定型的专业定位。
对高管而言，关键议题是：如何在组织需求与个人价值之间维持长期一致性？如何在权力结构中保持专业初心？如何在战略布局中融入自身职业锚的核心驱动力？
在这一阶段，不同职业锚类型展现出各自的成熟面貌：
•       技术型锚点者成为产业内受尊崇的专家，以深度知识影响行业标准。
•       管理型锚点者掌握全局视野，引领组织变革与人才发展。
•       服务型锚点者将影响力扩展至社会层面，成为行业倡导者或社区领袖。
•       自主型锚点者创造高度个人化的工作模式，实现真正的职涯自由。
此时不再焦虑，而是稳定输出。成熟的标志不是没有挑战，而是面对挑战时能够依循内在价值体系做出决策，而非被外在压力左右。
因此，测评结果对高管的解读重点在于：确认当前角色与核心价值的契合度；辨识可能出现的价值错位风险（特别是在组织转型期间）；以及为下一阶段的影响力扩展与传承布局提供心理定位的参考依据。`,
    description_en: `Senior executives represent a unique career positioning—bearing top-level decision-making responsibilities within organizational systems, their duties have shifted from individual performance to organizational performance, from execution to strategy.
At this stage, the meaning of career anchors is no longer about "discovering direction" or "choosing a path," but about entering a state of "maximizing value." The individual's professional identity is highly formed, and core values and behavioral patterns have been validated and consolidated over many years. Assessment results at this point reflect not exploratory tendencies, but mature and established professional positioning.
For executives, the key issues are: How to maintain long-term consistency between organizational needs and personal values? How to preserve professional integrity within power structures? How to integrate the core driving force of one's career anchor into strategic planning?
At this stage, different career anchor types manifest their mature forms:
• Technical anchor holders become revered experts in their industry, influencing industry standards through deep knowledge.
• Managerial anchor holders command a holistic vision, leading organizational transformation and talent development.
• Service anchor holders extend their influence to the societal level, becoming industry advocates or community leaders.
• Autonomy anchor holders create highly personalized work models, achieving true career freedom.
At this point, there is no longer anxiety, but stable output. The mark of maturity is not the absence of challenges, but the ability to make decisions according to an internal value system when facing challenges, rather than being swayed by external pressures.
Therefore, the interpretation focus of assessment results for executives lies in: confirming the fit between current role and core values; identifying potential value misalignment risks (especially during organizational transformation); and providing a psychological positioning reference for the next stage of influence expansion and succession planning.`,
  },
  {
    stage_key: "entrepreneur",
    title_zh_tw: "創業者",
    title_zh_cn: "创业者",
    title_en: "Entrepreneur",
    description_zh_tw: `創業者代表一種獨特的職涯定位——以創業或獨立事業為職涯核心的個體，他們不僅管理業務，更在建構商業生態與價值體系。無論年資長短，他們已不是在某一軌道上前進，而是在創造並定義軌道本身。
在此階段，職業錨的意義已不再是「發現方向」或「選擇路徑」，而是進入「發揮最大價值」的狀態。個體的職業身份已高度成形，核心價值觀與行為模式已經過長年驗證與鞏固。此時的測評結果反映的，不是探索性傾向，而是成熟定型的專業定位。
對創業者而言，核心命題是：事業版圖是否與自身最深層的價值信念吻合？擴張方向是否受到職業錨的自然引導，還是在外部壓力下偏離了本心？
在這一階段，不同職業錨類型展現出各自的成熟面貌：
•       技術型錨點者成為產業內受尊崇的專家，以深度知識影響行業標準。
•       創業型錨點者建立生態系統，從個人事業走向平台與傳承。
•       服務型錨點者將影響力擴展至社會層面，成為行業倡導者或社區領袖。
•       自主型錨點者創造高度個人化的工作模式，實現真正的職涯自由。
此時不再焦慮，而是穩定輸出。成熟的標誌不是沒有挑戰，而是面對挑戰時能夠依循內在價值體系做出決策，而非被外在壓力左右。
因此，測評結果對創業者的解讀重點在於：確認事業方向與核心價值的契合度；辨識可能出現的價值錯位風險（特別是在快速擴張期間）；以及為下一階段的影響力擴展與傳承佈局提供心理定位的參考依據。`,
    description_zh_cn: `创业者代表一种独特的职涯定位——以创业或独立事业为职涯核心的个体，他们不仅管理业务，更在建构商业生态与价值体系。无论年资长短，他们已不是在某一轨道上前进，而是在创造并定义轨道本身。
在此阶段，职业锚的意义已不再是"发现方向"或"选择路径"，而是进入"发挥最大价值"的状态。个体的职业身份已高度成形，核心价值观与行为模式已经过长年验证与巩固。此时的测评结果反映的，不是探索性倾向，而是成熟定型的专业定位。
对创业者而言，核心命题是：事业版图是否与自身最深层的价值信念吻合？扩张方向是否受到职业锚的自然引导，还是在外部压力下偏离了本心？
在这一阶段，不同职业锚类型展现出各自的成熟面貌：
•       技术型锚点者成为产业内受尊崇的专家，以深度知识影响行业标准。
•       创业型锚点者建立生态系统，从个人事业走向平台与传承。
•       服务型锚点者将影响力扩展至社会层面，成为行业倡导者或社区领袖。
•       自主型锚点者创造高度个人化的工作模式，实现真正的职涯自由。
此时不再焦虑，而是稳定输出。成熟的标志不是没有挑战，而是面对挑战时能够依循内在价值体系做出决策，而非被外在压力左右。
因此，测评结果对创业者的解读重点在于：确认事业方向与核心价值的契合度；辨识可能出现的价值错位风险（特别是在快速扩张期间）；以及为下一阶段的影响力扩展与传承布局提供心理定位的参考依据。`,
    description_en: `Entrepreneurs represent a unique career positioning—individuals whose career core lies in entrepreneurship or independent ventures, who not only manage business operations but construct commercial ecosystems and value systems. Regardless of tenure length, they are no longer advancing along a track, but creating and defining the track itself.
At this stage, the meaning of career anchors is no longer about "discovering direction" or "choosing a path," but about entering a state of "maximizing value." The individual's professional identity is highly formed, and core values and behavioral patterns have been validated and consolidated over many years. Assessment results at this point reflect not exploratory tendencies, but mature and established professional positioning.
For entrepreneurs, the core question is: Does the business landscape align with one's deepest value beliefs? Is the direction of expansion naturally guided by one's career anchor, or has it deviated from the heart under external pressure?
At this stage, different career anchor types manifest their mature forms:
• Technical anchor holders become revered experts in their industry, influencing industry standards through deep knowledge.
• Entrepreneurial anchor holders build ecosystems, evolving from personal ventures to platforms and legacy.
• Service anchor holders extend their influence to the societal level, becoming industry advocates or community leaders.
• Autonomy anchor holders create highly personalized work models, achieving true career freedom.
At this point, there is no longer anxiety, but stable output. The mark of maturity is not the absence of challenges, but the ability to make decisions according to an internal value system when facing challenges, rather than being swayed by external pressures.
Therefore, the interpretation focus of assessment results for entrepreneurs lies in: confirming the fit between business direction and core values; identifying potential value misalignment risks (especially during rapid expansion); and providing a psychological positioning reference for the next stage of influence expansion and succession planning.`,
  },
];
