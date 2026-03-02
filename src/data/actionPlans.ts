export interface ActionPlanData {
  learning: {
    title: string;
    description: string;
    resources?: string[];
  }[];
  paths: {
    title: string;
    description: string;
    timeline: string;
    risk: string;
    recommended?: boolean;
  }[];
  verification: {
    action: string;
    purpose: string;
  }[];
  tradeoffs: string[];
}

export function getActionPlan(anchor: string, language: string): ActionPlanData {
  const isEn = language === "en";

  const plansZh: Record<string, ActionPlanData> = {
    TF: {
      learning: [
        {
          title: "深化核心专业能力",
          description: "选择一个你最感兴趣的专业子领域，制定系统的学习计划。目标是在2-3年内成为该领域的公认专家。",
          resources: ["行业顶级课程", "专业认证", "技术会议"],
        },
        {
          title: "建立专业影响力",
          description: "通过写作、演讲、开源贡献等方式，在专业社区建立声誉。专家身份需要被行业认可才真正有价值。",
          resources: ["技术博客", "行业会议演讲", "开源项目"],
        },
        {
          title: "学习专家型领导力",
          description: "研究如何在不离开专业岗位的情况下发挥影响力。技术Fellow、首席专家等路径的先例和方法论。",
          resources: ["Staff Engineer 书籍", "技术领导力课程"],
        },
      ],
      paths: [
        {
          title: "专家型个人贡献者路径",
          description: "在现有组织或行业中，沿着个人贡献者路径晋升为高级专家、技术Fellow或首席科学家。",
          timeline: "5-10年",
          risk: "低",
          recommended: true,
        },
        {
          title: "技术咨询/顾问",
          description: "成为独立技术顾问，为多家公司提供专业建议。保持专业深度的同时获得更大自主权。",
          timeline: "3-5年",
          risk: "中",
        },
        {
          title: "技术型创业",
          description: "基于专业能力创建技术驱动的公司。风险较高，但可以将专业能力最大化变现。",
          timeline: "5-10年",
          risk: "高",
        },
      ],
      verification: [
        { action: "申请一个专业深度更高的项目或岗位", purpose: "验证你在高强度专业工作中是否真的感到满足" },
        { action: "尝试一次管理任务（如带实习生或小项目）", purpose: "确认你确实不喜欢管理，而非只是没尝试过" },
        { action: "进行一次专业分享（内部或外部）", purpose: "验证你是否享受专家身份带来的认可感" },
      ],
      tradeoffs: ["快速的层级晋升和组织政治影响力", "多元化的职业体验和跨领域发展", "某些以管理能力为核心要求的高薪岗位"],
    },
    GM: {
      learning: [
        { title: "系统学习管理理论", description: "学习组织行为学、领导力、战略管理等基础理论。理论基础会让你的管理直觉更有方向。", resources: ["MBA课程", "管理经典书籍", "领导力培训"] },
        { title: "培养跨职能视角", description: "主动了解财务、市场、产品、技术等不同职能的运作方式。管理者需要整合视角。", resources: ["轮岗机会", "跨部门项目", "高管影子学习"] },
        { title: "建立人才识别能力", description: "学习如何识别、吸引、培养和留住人才。管理的核心是通过他人达成目标。", resources: ["招聘面试培训", "教练技术", "绩效管理"] },
      ],
      paths: [
        { title: "职能管理者路径", description: "在现有职能领域晋升为部门负责人、总监、VP。稳步积累管理经验和组织信任。", timeline: "5-10年", risk: "低", recommended: true },
        { title: "总经理/事业部负责人", description: "追求P&L责任，管理完整的业务单元。这是通往CEO的典型路径。", timeline: "10-15年", risk: "中" },
        { title: "创业CEO", description: "通过创业直接获得CEO角色。风险高但可以快速获得全面管理经验。", timeline: "3-5年起步", risk: "高" },
      ],
      verification: [
        { action: "主动承担一个需要协调多方的项目", purpose: "验证你在整合他人工作中是否感到满足" },
        { action: "担任一个小团队的临时负责人", purpose: "验证你是否享受为团队结果负责的感觉" },
        { action: "尝试解决一个组织层面的问题", purpose: "验证你对组织运作和改进是否有热情" },
      ],
      tradeoffs: ["在专业技术领域的持续深耕和专家身份", "自主安排工作的自由度", "与具体工作产出的直接联系"],
    },
    AU: {
      learning: [
        { title: "建立独立工作能力", description: "培养能够独立交付完整项目的能力。自由职业或远程工作需要你能独立完成从规划到交付的全流程。", resources: ["项目管理", "时间管理", "自律技巧"] },
        { title: "建立个人品牌", description: "在专业领域建立个人声誉，让机会主动找到你。这是获得工作自主权的基础。", resources: ["个人网站", "社交媒体", "作品集"] },
        { title: "财务规划能力", description: "学习如何管理不稳定的收入流。自主往往意味着财务的不确定性。", resources: ["财务规划", "税务知识", "保险配置"] },
      ],
      paths: [
        { title: "远程工作/灵活岗位", description: "在提供高度工作灵活性的公司找到全职岗位。保持稳定收入的同时获得工作方式自主权。", timeline: "1-2年", risk: "低", recommended: true },
        { title: "自由职业/独立顾问", description: "成为独立工作者，完全掌控自己的时间、地点和工作方式。", timeline: "2-3年", risk: "中" },
        { title: "创业（轻资产模式）", description: "创建一个可以远程运营的小型企业。最大化自主权，同时建立资产。", timeline: "3-5年", risk: "高" },
      ],
      verification: [
        { action: "尝试一个月的远程工作或弹性工时", purpose: "验证你在自主安排中是否更有效率和满足感" },
        { action: "承接一个独立完成的副业项目", purpose: "验证你是否能够自我驱动完成任务" },
        { action: "计算你需要多少财务缓冲来支持自主工作", purpose: "验证你是否愿意为自主权承担财务风险" },
      ],
      tradeoffs: ["大组织的职业阶梯和稳定晋升通道", "团队协作的归属感和社交", "公司提供的培训、福利和资源"],
    },
    SE: {
      learning: [
        { title: "评估行业稳定性", description: "研究哪些行业和公司类型能提供长期稳定的就业。政府、公用事业、医疗、教育等行业值得考虑。", resources: ["行业报告", "公司财务分析", "就业市场研究"] },
        { title: "建立财务安全网", description: "即使在稳定的工作中，也要建立6-12个月的紧急储备金。安全感也来自财务独立。", resources: ["储蓄计划", "投资基础", "保险配置"] },
        { title: "培养跨场景技能", description: "学习在多种环境中都有价值的通用技能，增强在变化中的适应能力。", resources: ["沟通技能", "项目管理", "数据分析"] },
      ],
      paths: [
        { title: "稳定型大企业/机构", description: "在政府、国企、大型稳定企业中寻求长期发展。接受可能较慢的晋升速度，换取稳定性。", timeline: "长期", risk: "低", recommended: true },
        { title: "专业服务机构", description: "在会计师事务所、律所等专业服务机构工作。专业资质提供一定的职业安全感。", timeline: "5-10年", risk: "低" },
        { title: "稳定行业的内部创业", description: "在稳定的大组织内部寻找创新机会。保持安全感的同时获得一些创造空间。", timeline: "3-5年", risk: "中" },
      ],
      verification: [
        { action: "评估当前工作的稳定性（公司财务、行业前景）", purpose: "确认你是否在一个能提供长期安全感的环境中" },
        { action: "尝试一次小风险的副业或投资", purpose: "验证你对风险的真实承受能力" },
        { action: "与在不同类型组织工作的人交流", purpose: "了解不同环境的稳定性和代价" },
      ],
      tradeoffs: ["高风险高回报的创业或投资机会", "快速变化行业的前沿机会", "可能更高的短期薪资增长"],
    },
    EC: {
      learning: [
        { title: "学习创业方法论", description: "系统学习精益创业、商业模式设计、融资等知识。创业需要方法论，不仅仅是热情。", resources: ["精益创业", "YC课程", "商业模式画布"] },
        { title: "建立创业者网络", description: "加入创业社区，认识创业者、投资人、潜在合伙人。创业是高度依赖网络的活动。", resources: ["创业社区", "加速器", "行业活动"] },
        { title: "培养销售能力", description: "学习如何销售产品、想法、愿景。创业者需要不断说服他人。", resources: ["销售技巧", "谈判", "演讲"] },
      ],
      paths: [
        { title: "全职创业", description: "辞职全力投入自己的创业项目。最大风险，但也是最纯粹的创业体验。", timeline: "3-5年起步", risk: "高" },
        { title: "副业创业", description: "保持稳定工作的同时，业余时间运营副业项目。验证后再决定是否全职。", timeline: "1-3年验证", risk: "中", recommended: true },
        { title: "内部创业/创业公司早期", description: "在大公司内部负责新业务，或加入早期创业公司作为核心成员。获得创业体验同时降低风险。", timeline: "2-5年", risk: "中" },
      ],
      verification: [
        { action: "启动一个小型副业项目", purpose: "验证你是否享受从零到一的创建过程" },
        { action: "尝试向10个陌生人销售一个想法或产品", purpose: "验证你是否能承受销售和被拒绝的压力" },
        { action: "计算你能承受多长时间的零收入", purpose: "评估你的财务和心理准备程度" },
      ],
      tradeoffs: ["稳定的收入和职业发展路径", "工作与生活的平衡", "失败的风险和社会压力"],
    },
    SV: {
      learning: [
        { title: "明确你的核心价值观", description: "深入思考对你来说什么是最重要的社会议题。服务需要聚焦，不能什么都想做。", resources: ["价值观澄清练习", "使命宣言写作"] },
        { title: "了解影响力路径", description: "研究不同的社会影响力路径：非营利、社会企业、企业CSR、影响力投资等。", resources: ["社会创新课程", "影响力投资", "非营利管理"] },
        { title: "建立相关技能", description: "学习在目标领域产生影响所需的具体技能。光有热情不够，还需要能力。", resources: ["领域专业知识", "筹款", "项目管理"] },
      ],
      paths: [
        { title: "使命驱动型企业", description: "在B Corp或明确社会使命的企业工作。在商业环境中实现社会价值。", timeline: "持续", risk: "低", recommended: true },
        { title: "非营利/社会组织", description: "在非营利组织、基金会或国际组织工作。最直接的社会影响路径。", timeline: "持续", risk: "低" },
        { title: "社会企业家", description: "创建解决社会问题的企业。将商业模式与社会影响结合。", timeline: "5-10年", risk: "高" },
      ],
      verification: [
        { action: "志愿服务一个你关心的组织", purpose: "验证你在实际服务中是否感到满足" },
        { action: "评估当前工作与你价值观的匹配度", purpose: "明确差距有多大，是否需要改变" },
        { action: "与在社会部门工作的人交流", purpose: "了解现实中的挑战和回报" },
      ],
      tradeoffs: ["最高水平的薪资和物质回报", "某些高薪但价值观冲突的机会", "纯商业成功的衡量标准"],
    },
    CH: {
      learning: [
        { title: "识别高价值挑战", description: "学习区分真正有价值的困难问题和无意义的障碍。不是所有困难都值得征服。", resources: ["战略思维", "问题分析框架"] },
        { title: "建立应对失败的韧性", description: "挑战意味着失败是常态。学习如何从失败中恢复并继续前进。", resources: ["成长心态", "复原力训练"] },
        { title: "培养竞争优势", description: "在你选择的竞争领域，建立持续的竞争优势。", resources: ["专业技能", "独特方法论", "人脉网络"] },
      ],
      paths: [
        { title: "高竞争性行业", description: "在投行、咨询、顶尖科技公司等高竞争环境中工作。每天都是挑战。", timeline: "持续", risk: "中", recommended: true },
        { title: "困难转型项目", description: "专门承担公司内最困难的项目或业务转型。成为问题解决专家。", timeline: "项目制", risk: "中" },
        { title: "竞技性创业", description: "在高度竞争的市场创业。与强大对手竞争是核心驱动力。", timeline: "5-10年", risk: "高" },
      ],
      verification: [
        { action: "主动申请一个公认困难的项目", purpose: "验证你在高压环境中是否真的更有动力" },
        { action: "参加一个竞争性活动（比赛、竞标等）", purpose: "验证竞争带给你的是兴奋还是焦虑" },
        { action: "回顾过去最有成就感的时刻", purpose: "确认是否都与克服挑战有关" },
      ],
      tradeoffs: ["轻松稳定的工作环境", "工作与生活的平衡", "低压力带来的心理舒适"],
    },
    LS: {
      learning: [
        { title: "设计理想的生活方式", description: "具体定义你理想的生活是什么样的：工作时间、地点、节奏、与家人的时间等。", resources: ["生活设计", "时间管理", "价值观排序"] },
        { title: "建立支持灵活性的能力", description: "培养可以在灵活安排下高效产出的能力。远程工作、自由职业都需要自律。", resources: ["远程协作", "自我管理", "高效产出"] },
        { title: "财务规划", description: "计算维持你理想生活方式需要多少收入，以及如何实现。", resources: ["生活成本计算", "被动收入", "财务独立"] },
      ],
      paths: [
        { title: "高灵活性岗位", description: "寻找远程优先、结果导向、弹性工时的公司和岗位。", timeline: "1-2年", risk: "低", recommended: true },
        { title: "自由职业/咨询", description: "成为独立工作者，完全掌控自己的时间分配。", timeline: "2-3年", risk: "中" },
        { title: "生活方式型创业", description: "创建一个服务于你生活方式的小型企业，而非追求规模扩张。", timeline: "3-5年", risk: "中" },
      ],
      verification: [
        { action: "记录一周的时间使用，评估与理想的差距", purpose: "明确需要改变的具体方面" },
        { action: "尝试协商更灵活的工作安排", purpose: "验证当前环境是否有调整空间" },
        { action: "计算最低生活成本和理想生活成本", purpose: "明确财务目标和取舍空间" },
      ],
      tradeoffs: ["最快的职业晋升速度", "某些需要全情投入的高回报机会", "在高强度环境中获得的快速成长"],
    },
  };

  const plansZhTW: Record<string, ActionPlanData> = {
    TF: {
      learning: [
        {
          title: "深化核心專業能力",
          description: "選擇一個你最感興趣的專業子領域，制定系統的學習計劃。目標是在2-3年內成為該領域的公認專家。",
          resources: ["行業頂級課程", "專業認證", "技術會議"],
        },
        {
          title: "建立專業影響力",
          description: "透過寫作、演講、開源貢獻等方式，在專業社區建立聲譽。專家身份需要被行業認可才真正有價值。",
          resources: ["技術部落格", "行業會議演講", "開源專案"],
        },
        {
          title: "學習專家型領導力",
          description: "研究如何在不離開專業職位的情況下發揮影響力。技術Fellow、首席專家等路徑的先例和方法論。",
          resources: ["Staff Engineer 書籍", "技術領導力課程"],
        },
      ],
      paths: [
        { title: "專家型個人貢獻者路徑", description: "在現有組織或行業中，沿著個人貢獻者路徑晉升為高級專家、技術Fellow或首席科學家。", timeline: "5-10年", risk: "低", recommended: true },
        { title: "技術諮詢/顧問", description: "成為獨立技術顧問，為多家公司提供專業建議。保持專業深度的同時獲得更大自主權。", timeline: "3-5年", risk: "中" },
        { title: "技術型創業", description: "基於專業能力創建技術驅動的公司。風險較高，但可以將專業能力最大化變現。", timeline: "5-10年", risk: "高" },
      ],
      verification: [
        { action: "申請一個專業深度更高的專案或職位", purpose: "驗證你在高強度專業工作中是否真的感到滿足" },
        { action: "嘗試一次管理任務（如帶實習生或小專案）", purpose: "確認你確實不喜歡管理，而非只是沒嘗試過" },
        { action: "進行一次專業分享（內部或外部）", purpose: "驗證你是否享受專家身份帶來的認可感" },
      ],
      tradeoffs: ["快速的層級晉升和組織政治影響力", "多元化的職業體驗和跨領域發展", "某些以管理能力為核心要求的高薪職位"],
    },
    GM: {
      learning: [
        { title: "系統學習管理理論", description: "學習組織行為學、領導力、戰略管理等基礎理論。理論基礎會讓你的管理直覺更有方向。", resources: ["MBA課程", "管理經典書籍", "領導力培訓"] },
        { title: "培養跨職能視角", description: "主動了解財務、市場、產品、技術等不同職能的運作方式。管理者需要整合視角。", resources: ["輪崗機會", "跨部門專案", "高管影子學習"] },
        { title: "建立人才識別能力", description: "學習如何識別、吸引、培養和留住人才。管理的核心是通過他人達成目標。", resources: ["招聘面試培訓", "教練技術", "績效管理"] },
      ],
      paths: [
        { title: "職能管理者路徑", description: "在現有職能領域晉升為部門負責人、總監、VP。穩步積累管理經驗和組織信任。", timeline: "5-10年", risk: "低", recommended: true },
        { title: "總經理/事業部負責人", description: "追求P&L責任，管理完整的業務單元。這是通往CEO的典型路徑。", timeline: "10-15年", risk: "中" },
        { title: "創業CEO", description: "通過創業直接獲得CEO角色。風險高但可以快速獲得全面管理經驗。", timeline: "3-5年起步", risk: "高" },
      ],
      verification: [
        { action: "主動承擔一個需要協調多方的專案", purpose: "驗證你在整合他人工作中是否感到滿足" },
        { action: "擔任一個小團隊的臨時負責人", purpose: "驗證你是否享受為團隊結果負責的感覺" },
        { action: "嘗試解決一個組織層面的問題", purpose: "驗證你對組織運作和改進是否有熱情" },
      ],
      tradeoffs: ["在專業技術領域的持續深耕和專家身份", "自主安排工作的自由度", "與具體工作產出的直接聯繫"],
    },
    AU: {
      learning: [
        { title: "建立獨立工作能力", description: "培養能夠獨立交付完整專案的能力。自由職業或遠程工作需要你能獨立完成從規劃到交付的全流程。", resources: ["專案管理", "時間管理", "自律技巧"] },
        { title: "建立個人品牌", description: "在專業領域建立個人聲譽，讓機會主動找到你。這是獲得工作自主權的基礎。", resources: ["個人網站", "社交媒體", "作品集"] },
        { title: "財務規劃能力", description: "學習如何管理不穩定的收入流。自主往往意味著財務的不確定性。", resources: ["財務規劃", "稅務知識", "保險配置"] },
      ],
      paths: [
        { title: "遠程工作/靈活職位", description: "在提供高度工作靈活性的公司找到全職職位。保持穩定收入的同時獲得工作方式自主權。", timeline: "1-2年", risk: "低", recommended: true },
        { title: "自由職業/獨立顧問", description: "成為獨立工作者，完全掌控自己的時間、地點和工作方式。", timeline: "2-3年", risk: "中" },
        { title: "創業（輕資產模式）", description: "創建一個可以遠程運營的小型企業。最大化自主權，同時建立資產。", timeline: "3-5年", risk: "高" },
      ],
      verification: [
        { action: "嘗試一個月的遠程工作或彈性工時", purpose: "驗證你在自主安排中是否更有效率和滿足感" },
        { action: "承接一個獨立完成的副業專案", purpose: "驗證你是否能夠自我驅動完成任務" },
        { action: "計算你需要多少財務緩衝來支持自主工作", purpose: "驗證你是否願意為自主權承擔財務風險" },
      ],
      tradeoffs: ["大組織的職業階梯和穩定晉升通道", "團隊協作的歸屬感和社交", "公司提供的培訓、福利和資源"],
    },
    SE: {
      learning: [
        { title: "評估行業穩定性", description: "研究哪些行業和公司類型能提供長期穩定的就業。政府、公用事業、醫療、教育等行業值得考慮。", resources: ["行業報告", "公司財務分析", "就業市場研究"] },
        { title: "建立財務安全網", description: "即使在穩定的工作中，也要建立6-12個月的緊急儲備金。安全感也來自財務獨立。", resources: ["儲蓄計劃", "投資基礎", "保險配置"] },
        { title: "培養跨場景技能", description: "學習在多種環境中都有價值的通用技能，增強在變化中的適應能力。", resources: ["溝通技能", "專案管理", "數據分析"] },
      ],
      paths: [
        { title: "穩定型大企業/機構", description: "在政府、國企、大型穩定企業中尋求長期發展。接受可能較慢的晉升速度，換取穩定性。", timeline: "長期", risk: "低", recommended: true },
        { title: "專業服務機構", description: "在會計師事務所、律所等專業服務機構工作。專業資質提供一定的職業安全感。", timeline: "5-10年", risk: "低" },
        { title: "穩定行業的內部創業", description: "在穩定的大組織內部尋找創新機會。保持安全感的同時獲得一些創造空間。", timeline: "3-5年", risk: "中" },
      ],
      verification: [
        { action: "評估當前工作的穩定性（公司財務、行業前景）", purpose: "確認你是否在一個能提供長期安全感的環境中" },
        { action: "嘗試一次小風險的副業或投資", purpose: "驗證你對風險的真實承受能力" },
        { action: "與在不同類型組織工作的人交流", purpose: "了解不同環境的穩定性和代價" },
      ],
      tradeoffs: ["高風險高回報的創業或投資機會", "快速變化行業的先進機會", "可能更高的短期薪資增長"],
    },
    EC: {
      learning: [
        { title: "學習創業方法論", description: "系統學習精益創業、商業模式設計、融資等知識。創業需要方法論，不僅僅是熱情。", resources: ["精益創業", "YC課程", "商業模式畫布"] },
        { title: "建立創業者網絡", description: "加入創業社區，認識創業者、投資人、潛在合夥人。創業是高度依賴網絡的活動。", resources: ["創業社區", "加速器", "行業活動"] },
        { title: "培養銷售能力", description: "學習如何銷售產品、想法、願景。創業者需要不斷說服他人。", resources: ["銷售技巧", "談判", "演講"] },
      ],
      paths: [
        { title: "全職創業", description: "辭職全力投入自己的創業專案。最大風險，但也是最純粹的創業體驗。", timeline: "3-5年起步", risk: "高" },
        { title: "副業創業", description: "保持穩定工作的同時，業餘時間運營副業專案。驗證後再決定是否全職。", timeline: "1-3年驗證", risk: "中", recommended: true },
        { title: "內部創業/創業公司早期", description: "在大公司內部負責新業務，或加入早期創業公司作為核心成員。獲得創業體驗同時降低風險。", timeline: "2-5年", risk: "中" },
      ],
      verification: [
        { action: "啟動一個小型副業專案", purpose: "驗證你是否享受從零到一的創建過程" },
        { action: "嘗試向10個陌生人銷售一個想法或產品", purpose: "驗證你是否能承受銷售和被拒絕的壓力" },
        { action: "計算你能承受多長時間的零收入", purpose: "評估你的財務和心理準備程度" },
      ],
      tradeoffs: ["穩定的收入和職業發展路徑", "工作與生活的平衡", "失敗的風險和社會壓力"],
    },
    SV: {
      learning: [
        { title: "明確你的核心價值觀", description: "深入思考對你來說什麼是最重要的社會議題。服務需要聚焦，不能什麼都想做。", resources: ["價值觀澄清練習", "使命宣言寫作"] },
        { title: "了解影響力路徑", description: "研究不同的社會影響力路徑：非營利、社會企業、企業CSR、影響力投資等。", resources: ["社會創新課程", "影響力投資", "非營利管理"] },
        { title: "建立相關技能", description: "學習在目標領域產生影響所需的具體技能。光有熱情不夠，還需要能力。", resources: ["領域專業知識", "籌款", "專案管理"] },
      ],
      paths: [
        { title: "使命驅動型企業", description: "在B Corp或明確社會使命的企業工作。在商業環境中實現社會價值。", timeline: "持續", risk: "低", recommended: true },
        { title: "非營利/社會組織", description: "在非營利組織、基金會或國際組織工作。最直接的社會影響路徑。", timeline: "持續", risk: "低" },
        { title: "社會企業家", description: "創建解決社會問題的企業。將商業模式與社會影響結合。", timeline: "5-10年", risk: "高" },
      ],
      verification: [
        { action: "志願服務一個你關心的組織", purpose: "驗證你在實際服務中是否感到滿足" },
        { action: "評估當前工作與你價值觀的匹配度", purpose: "明確差距有多大，是否需要改變" },
        { action: "與在社會部門工作的人交流", purpose: "了解現實中的挑戰和回報" },
      ],
      tradeoffs: ["最高水平的薪資和物質回報", "某些高薪但價值觀衝突的機會", "純商業成功的衡量標準"],
    },
    CH: {
      learning: [
        { title: "識別高價值挑戰", description: "學習區分真正有價值的困難問題和無意義的障礙。不是所有困難都值得征服。", resources: ["戰略思維", "問題分析框架"] },
        { title: "建立應對失敗的韌性", description: "挑戰意味著失敗是常態。學習如何從失敗中恢復並繼續前進。", resources: ["成長心態", "復原力訓練"] },
        { title: "培養競爭優勢", description: "在你選擇的競爭領域，建立持續的競爭優勢。", resources: ["專業技能", "獨特方法論", "人脈網絡"] },
      ],
      paths: [
        { title: "高競爭性行業", description: "在投行、諮詢、頂尖科技公司等高競爭環境中工作。每天都是挑戰。", timeline: "持續", risk: "中", recommended: true },
        { title: "困難轉型專案", description: "專門承擔公司內最困難的專案或業務轉型。成為問題解決專家。", timeline: "專案制", risk: "中" },
        { title: "競技性創業", description: "在高度競爭的市場創業。與強大對手競爭是核心驅動力。", timeline: "5-10年", risk: "高" },
      ],
      verification: [
        { action: "主動申請一個公認困難的專案", purpose: "驗證你在高壓環境中是否真的更有動力" },
        { action: "參加一個競爭性活動（比賽、競標等）", purpose: "驗證競爭帶給你的是興奮還是焦慮" },
        { action: "回顧過去最有成就感的時刻", purpose: "確認是否都與克服挑戰有關" },
      ],
      tradeoffs: ["輕鬆穩定的工作環境", "工作與生活的平衡", "低壓力帶來的心理舒適"],
    },
    LS: {
      learning: [
        { title: "設計理想的生活方式", description: "具體定義你理想的生活是什麼樣的：工作時間、地點、節奏、與家人的時間等。", resources: ["生活設計", "時間管理", "價值觀排序"] },
        { title: "建立支持靈活性的能力", description: "培養可以在靈活安排下高效產出的能力。遠程工作、自由職業都需要自律。", resources: ["遠程協作", "自我管理", "高效產出"] },
        { title: "財務規劃", description: "計算維持你理想生活方式需要多少收入，以及如何實現。", resources: ["生活成本計算", "被動收入", "財務獨立"] },
      ],
      paths: [
        { title: "高靈活性職位", description: "尋找遠程優先、結果導向、彈性工時的公司和職位。", timeline: "1-2年", risk: "低", recommended: true },
        { title: "自由職業/諮詢", description: "成為獨立工作者，完全掌控自己的時間分配。", timeline: "2-3年", risk: "中" },
        { title: "生活方式型創業", description: "創建一個服務於你生活方式的小型企業，而非追求規模擴張。", timeline: "3-5年", risk: "中" },
      ],
      verification: [
        { action: "記錄一週的時間使用，評估與理想的差距", purpose: "明確需要改變的具體方面" },
        { action: "嘗試協商更靈活的工作安排", purpose: "驗證當前環境是否有調整空間" },
        { action: "計算最低生活成本和理想生活成本", purpose: "明確財務目標和取捨空間" },
      ],
      tradeoffs: ["最快的職業晉升速度", "某些需要全情投入的高回報機會", "在高強度環境中獲得的快速成長"],
    },
  };

  const plansEn: Record<string, ActionPlanData> = {
    TF: {
      learning: [
        { title: "Deepen Core Expertise", description: "Choose a sub-field you're most passionate about and create a systematic learning plan. Aim to become a recognized expert in 2-3 years.", resources: ["Top Industry Courses", "Professional Certifications", "Tech Conferences"] },
        { title: "Build Professional Influence", description: "Establish your reputation through writing, speaking, and open-source contributions. Expert status needs industry recognition to be truly valuable.", resources: ["Tech Blog", "Conference Speaking", "Open Source"] },
        { title: "Learn Expert Leadership", description: "Study how to exert influence without leaving your technical role. Research paths like Technical Fellow and Chief Scientist.", resources: ["Staff Engineer Books", "Technical Leadership Courses"] },
      ],
      paths: [
        { title: "Expert Individual Contributor Path", description: "Advance as an IC to Senior Expert, Technical Fellow, or Chief Scientist within your organization or industry.", timeline: "5-10 years", risk: "Low", recommended: true },
        { title: "Technical Consulting/Advisory", description: "Become an independent consultant providing expertise to multiple companies. Maintain depth while gaining autonomy.", timeline: "3-5 years", risk: "Medium" },
        { title: "Technical Entrepreneurship", description: "Create a technology-driven company based on your expertise. Higher risk but maximizes the value of your skills.", timeline: "5-10 years", risk: "High" },
      ],
      verification: [
        { action: "Apply for a more technically challenging project or role", purpose: "Verify if you truly feel fulfilled in intensive professional work" },
        { action: "Try a management task (mentoring an intern or small project)", purpose: "Confirm you really don't enjoy management, not just haven't tried it" },
        { action: "Give a professional presentation (internal or external)", purpose: "Verify if you enjoy the recognition that comes with expert status" },
      ],
      tradeoffs: ["Fast hierarchical advancement and organizational political influence", "Diverse career experiences and cross-domain development", "Certain high-paying roles requiring management skills"],
    },
    GM: {
      learning: [
        { title: "Study Management Theory", description: "Learn organizational behavior, leadership, and strategic management. Theoretical foundation gives your management instincts direction.", resources: ["MBA Courses", "Management Classics", "Leadership Training"] },
        { title: "Develop Cross-functional Perspective", description: "Actively learn how finance, marketing, product, and technology functions operate. Managers need an integrated view.", resources: ["Job Rotation", "Cross-department Projects", "Executive Shadowing"] },
        { title: "Build Talent Assessment Skills", description: "Learn to identify, attract, develop, and retain talent. Management's core is achieving goals through others.", resources: ["Interview Training", "Coaching Skills", "Performance Management"] },
      ],
      paths: [
        { title: "Functional Manager Path", description: "Advance to Department Head, Director, or VP in your functional area. Steadily build management experience and organizational trust.", timeline: "5-10 years", risk: "Low", recommended: true },
        { title: "General Manager/Business Unit Head", description: "Pursue P&L responsibility managing a complete business unit. This is the typical path to CEO.", timeline: "10-15 years", risk: "Medium" },
        { title: "Startup CEO", description: "Gain the CEO role directly through entrepreneurship. High risk but quick comprehensive management experience.", timeline: "3-5 years to start", risk: "High" },
      ],
      verification: [
        { action: "Take on a project requiring multi-party coordination", purpose: "Verify if you feel satisfied integrating others' work" },
        { action: "Lead a small team temporarily", purpose: "Verify if you enjoy being responsible for team outcomes" },
        { action: "Try solving an organizational-level problem", purpose: "Verify your passion for organizational improvement" },
      ],
      tradeoffs: ["Continued deep expertise and expert identity in a technical field", "Freedom to arrange your own work", "Direct connection to specific work output"],
    },
    AU: {
      learning: [
        { title: "Build Independent Work Capability", description: "Develop the ability to deliver complete projects independently. Freelance or remote work requires you to handle everything from planning to delivery.", resources: ["Project Management", "Time Management", "Self-discipline"] },
        { title: "Build Personal Brand", description: "Establish your reputation so opportunities find you. This is the foundation for work autonomy.", resources: ["Personal Website", "Social Media", "Portfolio"] },
        { title: "Financial Planning Skills", description: "Learn to manage unstable income streams. Autonomy often means financial uncertainty.", resources: ["Financial Planning", "Tax Knowledge", "Insurance"] },
      ],
      paths: [
        { title: "Remote Work/Flexible Position", description: "Find a full-time role at a company offering high work flexibility. Stable income with work style autonomy.", timeline: "1-2 years", risk: "Low", recommended: true },
        { title: "Freelance/Independent Consultant", description: "Become an independent worker with full control over your time, location, and work style.", timeline: "2-3 years", risk: "Medium" },
        { title: "Entrepreneurship (Asset-light)", description: "Create a small business that can be run remotely. Maximize autonomy while building assets.", timeline: "3-5 years", risk: "High" },
      ],
      verification: [
        { action: "Try one month of remote work or flexible hours", purpose: "Verify if you're more efficient and satisfied with self-arranged work" },
        { action: "Take on a side project you complete independently", purpose: "Verify if you can self-motivate to complete tasks" },
        { action: "Calculate financial buffer needed for autonomous work", purpose: "Verify if you're willing to take financial risk for autonomy" },
      ],
      tradeoffs: ["Career ladder and stable promotion path in large organizations", "Sense of belonging and social connection from team collaboration", "Training, benefits, and resources provided by companies"],
    },
    SE: {
      learning: [
        { title: "Assess Industry Stability", description: "Research which industries and company types offer long-term stable employment. Government, utilities, healthcare, education are worth considering.", resources: ["Industry Reports", "Financial Analysis", "Job Market Research"] },
        { title: "Build Financial Safety Net", description: "Even with stable work, build 6-12 months emergency fund. Security also comes from financial independence.", resources: ["Savings Plan", "Investment Basics", "Insurance"] },
        { title: "Develop Transferable Skills", description: "Learn universal skills valuable in multiple environments to enhance adaptability in change.", resources: ["Communication", "Project Management", "Data Analysis"] },
      ],
      paths: [
        { title: "Stable Large Enterprise/Institution", description: "Seek long-term development in government, state-owned, or stable large enterprises. Accept slower advancement for stability.", timeline: "Long-term", risk: "Low", recommended: true },
        { title: "Professional Services Firm", description: "Work at accounting firms, law firms, etc. Professional credentials provide career security.", timeline: "5-10 years", risk: "Low" },
        { title: "Internal Entrepreneurship in Stable Industry", description: "Find innovation opportunities within stable large organizations. Maintain security while gaining creative space.", timeline: "3-5 years", risk: "Medium" },
      ],
      verification: [
        { action: "Assess your current job's stability (company finances, industry outlook)", purpose: "Confirm if you're in an environment providing long-term security" },
        { action: "Try a low-risk side project or investment", purpose: "Verify your true risk tolerance" },
        { action: "Talk with people in different organization types", purpose: "Understand stability and trade-offs in different environments" },
      ],
      tradeoffs: ["High-risk high-reward entrepreneurship or investment opportunities", "Cutting-edge opportunities in fast-changing industries", "Potentially higher short-term salary growth"],
    },
    EC: {
      learning: [
        { title: "Learn Startup Methodology", description: "Systematically study lean startup, business model design, fundraising. Entrepreneurship needs methodology, not just passion.", resources: ["Lean Startup", "YC Courses", "Business Model Canvas"] },
        { title: "Build Entrepreneur Network", description: "Join startup communities, meet entrepreneurs, investors, potential co-founders. Startups heavily depend on networks.", resources: ["Startup Communities", "Accelerators", "Industry Events"] },
        { title: "Develop Sales Skills", description: "Learn to sell products, ideas, visions. Entrepreneurs constantly need to persuade others.", resources: ["Sales Skills", "Negotiation", "Public Speaking"] },
      ],
      paths: [
        { title: "Full-time Entrepreneurship", description: "Quit and fully commit to your startup. Maximum risk but the purest entrepreneurial experience.", timeline: "3-5 years to start", risk: "High" },
        { title: "Side Hustle Entrepreneurship", description: "Keep stable job while running a side project in spare time. Validate before going full-time.", timeline: "1-3 years validation", risk: "Medium", recommended: true },
        { title: "Internal Startup/Early Stage Startup", description: "Lead new business inside a large company, or join an early startup as a core member. Gain experience with lower risk.", timeline: "2-5 years", risk: "Medium" },
      ],
      verification: [
        { action: "Start a small side project", purpose: "Verify if you enjoy the zero-to-one creation process" },
        { action: "Try selling an idea or product to 10 strangers", purpose: "Verify if you can handle sales and rejection pressure" },
        { action: "Calculate how long you can sustain zero income", purpose: "Assess your financial and psychological readiness" },
      ],
      tradeoffs: ["Stable income and career development path", "Work-life balance", "Risk of failure and social pressure"],
    },
    SV: {
      learning: [
        { title: "Clarify Your Core Values", description: "Deeply consider what social issues matter most to you. Service requires focus; you can't do everything.", resources: ["Values Clarification Exercises", "Mission Statement Writing"] },
        { title: "Understand Impact Pathways", description: "Research different social impact paths: nonprofits, social enterprises, corporate CSR, impact investing.", resources: ["Social Innovation Courses", "Impact Investing", "Nonprofit Management"] },
        { title: "Build Relevant Skills", description: "Learn specific skills needed to create impact in your target area. Passion alone isn't enough; you need capability.", resources: ["Domain Expertise", "Fundraising", "Project Management"] },
      ],
      paths: [
        { title: "Mission-driven Company", description: "Work at a B Corp or company with clear social mission. Achieve social value in a business environment.", timeline: "Ongoing", risk: "Low", recommended: true },
        { title: "Nonprofit/Social Organization", description: "Work at nonprofits, foundations, or international organizations. The most direct social impact path.", timeline: "Ongoing", risk: "Low" },
        { title: "Social Entrepreneur", description: "Create a business that solves social problems. Combine business models with social impact.", timeline: "5-10 years", risk: "High" },
      ],
      verification: [
        { action: "Volunteer for an organization you care about", purpose: "Verify if you feel fulfilled in actual service" },
        { action: "Assess how well your current work matches your values", purpose: "Clarify the gap and whether change is needed" },
        { action: "Talk with people working in the social sector", purpose: "Understand real-world challenges and rewards" },
      ],
      tradeoffs: ["Maximum salary and material rewards", "Certain high-paying but values-conflicting opportunities", "Pure commercial success metrics"],
    },
    CH: {
      learning: [
        { title: "Identify High-value Challenges", description: "Learn to distinguish truly valuable difficult problems from meaningless obstacles. Not all difficulties are worth conquering.", resources: ["Strategic Thinking", "Problem Analysis Frameworks"] },
        { title: "Build Resilience to Failure", description: "Challenge means failure is normal. Learn how to recover from failure and keep moving forward.", resources: ["Growth Mindset", "Resilience Training"] },
        { title: "Develop Competitive Advantage", description: "In your chosen competitive field, build sustainable competitive advantage.", resources: ["Professional Skills", "Unique Methodology", "Network"] },
      ],
      paths: [
        { title: "Highly Competitive Industry", description: "Work in high-competition environments like investment banking, consulting, top tech companies. Every day is a challenge.", timeline: "Ongoing", risk: "Medium", recommended: true },
        { title: "Difficult Transformation Projects", description: "Specialize in tackling the company's hardest projects or business transformations. Become a problem-solving expert.", timeline: "Project-based", risk: "Medium" },
        { title: "Competitive Entrepreneurship", description: "Start up in a highly competitive market. Competing against strong rivals is the core driver.", timeline: "5-10 years", risk: "High" },
      ],
      verification: [
        { action: "Volunteer for a notoriously difficult project", purpose: "Verify if you're truly more motivated in high-pressure environments" },
        { action: "Participate in a competitive event (competition, bid, etc.)", purpose: "Verify if competition brings you excitement or anxiety" },
        { action: "Review your most fulfilling moments", purpose: "Confirm if they all relate to overcoming challenges" },
      ],
      tradeoffs: ["Easy, stable work environment", "Work-life balance", "Psychological comfort from low pressure"],
    },
    LS: {
      learning: [
        { title: "Design Your Ideal Lifestyle", description: "Specifically define what your ideal life looks like: work hours, location, pace, time with family, etc.", resources: ["Life Design", "Time Management", "Values Prioritization"] },
        { title: "Build Flexibility-supporting Skills", description: "Develop ability to produce efficiently with flexible arrangements. Remote work and freelancing require self-discipline.", resources: ["Remote Collaboration", "Self-management", "High Output"] },
        { title: "Financial Planning", description: "Calculate how much income you need to maintain your ideal lifestyle and how to achieve it.", resources: ["Cost of Living Calculator", "Passive Income", "Financial Independence"] },
      ],
      paths: [
        { title: "High-flexibility Position", description: "Find remote-first, results-oriented, flexible-hours companies and roles.", timeline: "1-2 years", risk: "Low", recommended: true },
        { title: "Freelance/Consulting", description: "Become an independent worker with full control over your time allocation.", timeline: "2-3 years", risk: "Medium" },
        { title: "Lifestyle Business", description: "Create a small business that serves your lifestyle rather than pursuing scale.", timeline: "3-5 years", risk: "Medium" },
      ],
      verification: [
        { action: "Track one week of time usage and assess gap with ideal", purpose: "Clarify specific aspects that need to change" },
        { action: "Try negotiating more flexible work arrangements", purpose: "Verify if current environment has room for adjustment" },
        { action: "Calculate minimum and ideal cost of living", purpose: "Clarify financial goals and trade-off space" },
      ],
      tradeoffs: ["Fastest career advancement speed", "Certain high-reward opportunities requiring full commitment", "Rapid growth from high-intensity environments"],
    },
  };

  const plans = isEn ? plansEn : language === "zh-TW" ? plansZhTW : plansZh;
  return plans[anchor] || {
    learning: [],
    paths: [],
    verification: [],
    tradeoffs: [],
  };
}
