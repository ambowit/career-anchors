# SCPC Career Anchors AI Assessment System

## 产品语言

支持三种语言：

- 简体中文 (zh-CN)
- 繁体中文 (zh-TW)
- English (en)

用户可通过页面右上角的语言切换器切换界面语言，设置会保存到本地存储。

### 术语本地化规则

- 简体中文「项目」在繁体中文中应使用「專案」
- AI 生成报告内容的繁体中文强制策略：在 personalized-analysis Edge Function 中，1) 提示词明确要求 AI 全程使用繁体中文输出并列出常见简繁易混字；2) AI 返回结果后自动进行简→繁字符转换后处理，确保不出现简体字

## 要构建什么

一个基于 SCPC (Self-Concept based career Pathway Constraint) 理论的严肃职业决策工具，帮助用户识别其长期不可妥协的职业核心约束。这不是娱乐型性格测试，而是专业的职业咨询级产品。系统通过 AI 自适应测评和构念加权评分，为用户输出清晰的职业锚分析、风险提示和可执行的职业路径建议。

**核心定位**：帮助用户明确“如果你要走很远，哪些要素是您的核心坚持”——揭示核心需求，而非预测岗位匹配。

## 目标受众

覆盖全职业阶段用户：

- **职场新人（工作3年内）**：寻求职业方向，需要建立对自己职业驱动力的初步认知
- **职场中期（3-10年）**：考虑转型或深化，需要验证或澄清长期职业驱动力
- **高管/创业者**：寻求战略定位，需要在重大决策前确认核心价值取向
- **HR/组织发展专业人士**：作为人才评估工具使用，帮助组织理解员工职业动机

所有用户共同特点：重视专业性、数据支撑和可执行建议，不接受模糊的安慰性结论。

## 产品包含的端

- **用户测评端**（优先）：用户访问系统、完成测评、查看结果、获取建议的完整流程
- **管理后台**（已实现，全面支持三语言）：
  - 仪表盘：系统数据概览、职业锚分布、实时动态
  - 题库管理：**40道 SCPC 官方题目**（全部支持中/英/繁体切换），题目列表、筛选、权重显示
  - 数据分析：测评趋势、职业锚变化、用户群体分布
  - 用户管理：用户列表、新增用户、删除用户、批量导入（CSV/Excel）、数据导出
  - 系统设置：基本配置、会话设置、通知设置、维护模式

---

## SCPC 理论框架 (CRITICAL)

### 什么是职业锚

职业锚是**自我概念约束**——个人在面对真实职业取舍时不愿长期牺牲的东西。

### 职业锚不是什么

- ❌ 不是兴趣、能力或性格偏好
- ❌ 不是岗位匹配预测器
- ❌ 不是诊断或筛选工具
- ❌ 不是励志/安慰性结论

### 8 个固定职业锚维度

1. **TF** - 技术/专业能力型 (Technical/Functional Competence)
2. **GM** - 管理型 (General Management)
3. **AU** - 自主/独立型 (Autonomy/Independence)
4. **SE** - 安全/稳定型 (Security/Stability)
5. **EC** - 创业/创造型 (Entrepreneurial Creativity)
6. **SV** - 服务/奉献型 (Service/Dedication)
7. **CH** - 挑战型 (Pure Challenge)
8. **LS** - 生活方式整合型 (Lifestyle Integration)

**规则**：这8个维度是固定的，永远不能合并、删除或添加维度。

### SCPC 官方题库（40题）

系统使用 **SCPC 官方版本 40 道题目**，每个维度 5 道题，每道题有官方权重：

- 权重范围：1.0 / 1.2 / 1.4 / 1.6 / 2.0
- 权重 2.0 题目具有最高诊断价值（通常为拒绝阈值类题目）
- 每道题目绑定：维度(Anchor) + 题号(Item#) + 权重(Weight)

**题目分布**：


| 维度  | 题号      | 权重分布                    |
| --- | ------- | ----------------------- |
| TF  | Q1-Q5   | 1.6, 2.0, 1.6, 1.4, 1.6 |
| GM  | Q6-Q10  | 2.0, 1.6, 1.2, 1.2, 1.6 |
| AU  | Q11-Q15 | 1.4, 2.0, 2.0, 1.6, 1.4 |
| SE  | Q16-Q20 | 1.4, 1.0, 2.0, 1.4, 1.6 |
| EC  | Q21-Q25 | 1.2, 1.6, 2.0, 1.4, 1.6 |
| SV  | Q26-Q30 | 1.2, 2.0, 1.4, 1.6, 1.6 |
| CH  | Q31-Q35 | 1.2, 1.2, 2.0, 1.2, 1.6 |
| LS  | Q36-Q40 | 1.4, 1.6, 2.0, 1.0, 1.6 |


### 自适应出题调度引擎 [NEW - 2026-02-10]

系统采用智能自适应出题策略，最小化「无信息增量的问题」：

**三阶段调度**：

1. **核心识别阶段（Core）**：固定16道核心题，每个锚2道，用于初步识别锚点倾向
2. **深度澄清阶段（Clarifier）**：针对不确定锚（得分45-70或一致性低）补充2-6道澄清题
3. **冲突验证阶段（Validator）**：当检测到冲突锚对都≥65分时，补充2-4道验证题

**题目分类**：

- `core`：核心识别题（16题，权重2.0或1.6）
- `clarifier`：澄清题（16题，权重1.2-1.4）
- `validator`：验证题（8题，用于冲突验证）

**停止条件**（满足任一即停止）：

1. 所有锚均已清晰
2. 主职业锚稳定（领先≥15分）
3. 已完成28题
4. 达到40题上限

**自适应效率**：平均完成18-24题即可获得可靠结果，相比固定40题节省30-50%时间。

### 4点Likert量表（SCPC官方格式）

- 完全不符合 (Not true for me) = 0
- 有点符合 (Slightly true for me) = 1
- 比较符合 (Mostly true for me) = 2
- 非常符合 (Very true for me) = 3

**规则**：❌ 禁用中立/中间选项

### 分数解释（0-100 = 约束强度）


| 分数范围   | 约束等级      | 用户语言解释         |
| ------ | --------- | -------------- |
| 80-100 | 不可妥协的长期约束 | 很难长期妥协         |
| 65-79  | 高敏感约束     | 短期可以忍，但长期需要被照顾 |
| 45-64  | 条件性约束     | 有意义，但不是底线      |
| 0-44   | 非核心维度     | 不是做选择时最在意的点    |


**关键**：低分不是缺点，只是说明它不是你的核心动力。

### 冲突锚检测

结构性冲突对：

- SE × EC（安全 vs 创业）
- GM × AU（管理 vs 自主）
- CH × LS（挑战 vs 生活方式）
- TF × GM（技术 vs 管理）

如果两个锚都 ≥65 分 → 标记为**冲突锚风险**。

---

## 结果解释框架（用户语言）[NEW - 2026-02-10]

### 核心原则

你的目标**不是教育理论**，而是帮助用户"真正理解自己"。

**必须遵守**：

- 不使用心理学术语
- 不给性格标签
- 不说对错、优劣
- 用"长期职业体验"的语言
- 所有解释围绕：哪些东西不能被长期牺牲

### 开场解释（必须使用）

> "这不是能力测评，也不是性格测试。你的分数不代表你强或弱，而代表：在长期职业选择中，哪些条件如果反复被忽视，你会逐渐痛苦、消耗，甚至离开。"

强调：

- 分数高 = 对你很重要
- 分数低 = 对你不是核心驱动力（不是缺点）

### 雷达图解释

> "这张图不是在比较你像谁，而是在显示：不同职业需求对你来说，'有多不可妥协'。越接近外圈，代表越难被牺牲；越靠近中心，代表你对此相对灵活。"

### 主职业锚解释结构

1. **核心含义**："对你来说，真正重要的是——【核心含义】。"
2. **如果条件存在**："如果这个条件长期存在，你会……（正向体验）"
3. **如果条件不存在**："如果这个条件长期不存在，你会逐渐……（消耗/抗拒）"
4. **澄清**："这不是你现在的工作，而是你长期职业里不能被牺牲的底线。"

### 副职业锚解释

- 这是"可以被满足的加分项"
- 不是必须条件
- 不能压过主锚

> "在不违背你最核心需求的前提下，这一点会让你更有动力、更容易坚持。"

### 冲突锚解释

1. **承认**："很多认真思考职业的人，都会有这种拉扯。"
2. **本质**："你同时在意两种长期很难同时满足的东西。"
3. **安慰**："这不是你不够好，而是任何人长期这样都会内耗。"
4. **提醒**："未来你可能需要特别留意：在关键选择时，不要假设'两边都能长期兼顾'。"

### 实用方向（3个建议）

1. 在做重要选择前，先问自己："这个选择，会不会长期踩到我的高分项？"
2. 当你感到持续疲惫或抗拒时：不是马上怀疑自己能力，而是回头看看，是不是某个核心需求被忽视了。
3. 把这个结果当作"长期导航参考"，而不是一次性答案。

### 结尾说明（必须）

> “这个结果不是给你一个标准答案，而是帮你更清楚地知道：如果你要走很远，哪些要素是您的核心坚持。”

**禁止使用**：

- 励志口号
- 鼓励性格改变
- "你什么都可以"的表述

---

## 角色与权限

### 快速登录系统（真实认证）

- 首页右上角提供快速登录下拉菜单，点击即可登录
- **测试用户**：普通用户权限，完成测评、查看结果、分享报告，测评结果持久化存储
- **测试管理员**：管理员权限，登录后自动跳转到管理后台（/admin）
- 两个测试账户均为真实 Supabase 认证用户，支持全功能：
  - 测评结果保存到云端
  - 历史记录持久化
  - 跨设备/跨会话访问
- 状态使用 Zustand + Supabase Auth 持久化存储
- 切换角色时自动跳转到对应页面（管理员→管理后台，用户→首页）

### 职业阶段选择

用户登录后、开始测评前，需选择当前职业阶段，用于个性化解读：

- 职场新人（工作3年内）
- 职场中期（3-10年）
- 高管/创业者（决策层）
- HR/组织发展（人才评估）

## 功能与页面

系统包含完整的测评流程，共6个核心页面：

1. **测评首页**：清晰说明产品定位（严肃职业决策工具，非性格测试），告知用户测评时长、理论基础，引导用户进入测评状态。强调"请选择真实倾向，而非社会期待"。
2. **测评进行页**：
  - 单题沉浸式设计，每次只显示一道题目
  - **40题 SCPC 官方题目**，每题有官方权重和诊断角色
  - **自适应出题引擎**：
    - 显示当前阶段（核心识别/深度澄清/冲突验证）
    - 智能决定是否需要补充题目
    - 最少16题，最多40题
  - 进度自动保存（登录用户），支持断点续测
3. **结果总览页**：
  - 开场说明（解释分数含义）
  - 8维度雷达图（约束强度可视化）
  - 主锚卡片（核心含义 + 如果存在/不存在）
  - 副锚卡片（加分项说明）
  - 冲突锚警示（如有）
  - 实用方向（3个建议）
  - 结尾声明
4. **深度解读页**：
  - AI 生成个性化分析
  - 使用用户语言框架（非术语化）
  - 主锚/副锚/冲突锚详细解释
  - 实用方向建议
5. **行动建议页**：
  - 需要避免的情境
  - 取舍场景分析
  - 验证步骤
  - 警示信号
  - 定期检查问题
6. **用户历史记录页**：查看过往测评记录，对比不同时期的职业锚变化。

## 理论模型与逻辑

系统基于 SCPC (Self-Concept based career Pathway Constraint) 理论框架：

每位用户必须有【主锚】（最高分≥65），允许有【副锚】（次高分，与主锚差距≤15），必须识别【冲突锚】（结构性冲突对中两个都≥65分）。系统计算每个职业锚的构念加权得分（0-100约束强度）、锚稳定度判断。

**AI 行为约束**：

- 不得更改职业锚模型
- 不得合并或删除锚点
- 不得引入其他性格理论
- 不得给岗位匹配预测
- 不得给励志结论
- 所有解释必须可追溯到测评回答

## UI 设计风格

专业、克制、咨询级产品风格，而非娱乐测试。避免使用过于轻松、娱乐化的视觉元素。色彩沉稳，排版清晰，强调数据可视化（雷达图）和信息层级。整体氛围类似高端职业咨询服务或战略决策工具。

## 企业色设计系统

- **主色（深蓝）**: hsl(228, 51%, 23%) / #1C2857 - 用于主要按钮、标题、强调元素
- **强调色（浅绿）**: hsl(75, 55%, 50%) / #B5D260 - 用于进度条、成功状态、特色卡片边框
- **浅绿背景**: hsl(75, 55%, 95%) ~ hsl(75, 55%, 98%) - 首页背景渐变，营造清新专业氛围

### 约束强度颜色编码

- **80-100（不可妥协）**：红色主题
- **65-79（高敏感）**：橙色主题
- **45-64（条件性）**：蓝色主题
- **0-44（非核心）**：灰色主题

## 响应式设计

- **移动端**（375px）：底部导航栏、卡片式布局、触摸友好的大按钮
- **桌面端**（1440px）：侧边导航 + 内容区、Swiss Grid 布局
- 测评页面为沉浸式设计，隐藏底部导航栏

---

## 匿名測評中心 (Anonymous Assessment Center) [NEW - 2026-03-07]

企业级匿名测评功能，支持管理员建立匿名测评批次、生成唯一参与者链接、收集回收、查看群体分析报告。

### 页面结构

超管侧栏新增「匿名測評」分类，包含：

1. **匿名測評批次** (`/super-admin/anonymous-assessment`) — 批次管理仪表板（KPI 卡片 + 可过滤数据表）
2. **建立匿名測評** (`/super-admin/anonymous-assessment/create`) — 四步向导（选择测评 → 设定参数 → 生成链接 → 确认启用）
3. **批次詳情** (`/super-admin/anonymous-assessment/:batchId`) — 四个标签页：链接管理、回收分布、群组洞察、报告输出
4. **匿名分析報告** (`/super-admin/anonymous-assessment/:batchId/report`) — AI 驱动的群体分析报告（批次概览、结构分析、风险信号、管理建议）
5. **權限設定** (`/super-admin/anonymous-assessment/permissions`) — 角色权限矩阵

### 支持的测评类型

- SCPC 职业锚测评
- 人生卡测评
- 融合测评

### 批次状态流

草稿 → 进行中 → 已完成 → 已生成报告 → 已关闭

### 设计色系

- 主色: Deep Blue #1C2857
- 强调色: Orange #E47E22, Yellow #E6B63D, Green #20A87B
- 中性背景: #F4F6F8

### 当前状态

**已完成真实后端接入 [2026-03-07]**：

- Supabase 表：`anonymous_assessment_batches`, `anonymous_assessment_links`, `anonymous_assessment_responses`, `anonymous_batch_reports`, `anonymous_assessment_permissions`
- 全部 RLS 策略已启用（authenticated 可管理，anon 可通过 token 参与测评）
- 建立向导：真实写入批次记录 + 批量插入唯一 token 连结
- 批次列表/详情/权限：全部从 Supabase 即时查询
- AI 批次分析 Edge Function (`anonymous-batch-analysis`)：聚合回收数据 → Gemini AI 生成群体洞察/风险信号/管理建议 → 自动存入 `anonymous_batch_reports` 表
- 权限矩阵：5 角色 × 7 权限真实读写 `anonymous_assessment_permissions` 表

**已完成**：参与者端匿名链接体验页面（`/a/:token`）— 公开页面，无需登录。Token 验证 → Landing（批次信息+说明）→ 可选填姓名 → 40 题 SCPC 测评 → 结果存入 anonymous_assessment_responses → 个人雷达图+分数详情+冲突侦测。使用 SCPC 品牌色（#1C2857 深蓝 + #B5D260 绿色点缀），支持三语。

---

## 技术实现

### Edge Functions

1. **adaptive-questions** - AI动态题目排序
2. **personalized-analysis** - AI个性化分析（已更新为SCPC用户语言框架）
  - 输入：评测结果、分析类型（deep_dive/action_plan/career_path/dual_anchor/tri_anchor）、语言
  - 输出：结构化JSON，使用用户友好语言
  - `dual_anchor`：读取dualAnchors{code1,score1,code2,score2}，生成3-4段散文解读，输出{dualAnchorInterpretation}
  - `tri_anchor`：读取triAnchors{code1,score1,code2,score2,code3,score3}，生成原型名称+3-5段散文解读，输出{archetypeName, triAnchorInterpretation}

### 数据库

- profiles（用户信息 + 角色 + 职业阶段）
- assessment_results（评测结果持久化）
- assessment_progress（断点续测进度）
- RLS 策略完备

---

## 当前状态

### ✅ 已完成

- [x] **机构仪表盘完成率修复 + 机构名称显示** [2026-03-06] — “已完成測評”改为独立用户数（同一用户多次测评只计一次）；完成率封顶100%；侧边栏 SCPC 后面加上机构名称；仪表盘标题前加机构名称；新增 useOrgInfo hook 获取当前用户机构信息
- [x] **报告分数标准化 + 查看/下载图标重构** [2026-03-06] — 眼睛图标改为直接打开V3报告；新增下载图标；展开行/弹窗/CSV导出全部改用buildStandardizedScores()百分比标准化分数
- [x] **机构仪表盘完成率183.3%修复** [2026-03-06] — 改用独立用户数计算完成率，封顶100%
- [x] **报告分数不显示修复** [2026-03-06] — showWeights flag 不再控制分数显示
- [x] **双锚间距加大** [2026-03-06] — 双锚互动提示后行间距增大
- [x] **高管/创业者拆分** [2026-03-06] — CareerStage类型新增entrepreneur；互斥选择逻辑；careerStageDefaults拆分为两个独立条目；CareerStageDescriptionsTab加Rocket图标
- [x] **查看报告统一V3** [2026-03-06] — handleViewReport改用generateV3Report
- [x] **管理员登录跳转 + 机构域名字段清理** [2026-02-25] — 修复真实管理员（非测试账户）登录后无法进入控制台的问题；用户菜单“进入控制台”链接现在基于profile.role_type显示；登录后自动跳转到对应控制台；去掉机构弹窗域名字段
- [x] **退出登录跳转首页 + 报告导出PDF** [2026-02-25] — 修复咨询师/超管/机构管理员退出后跳转到首页；统一所有报告下载为PDF格式
- [x] **个人报告空间 + 全链路消息系统 + 超管消息监控** [2026-02-25] — 新建user_reports和messages表(RLS完备)；个人报告空间(/my-reports)支持筛选/预览/归档；各角色消息中心(个人/咨询师/机构)支持收件箱/已发送/未读标记/发送新消息；超管消息监控面板(/super-admin/messages)支持全平台消息统计/通道分布/类型筛选/搜索/详情查看
- [x] 用户认证（真实Supabase）
- [x] 云端评测结果存储
- [x] **自适应出题调度引擎** [2026-02-10]
- [x] **PWA 安全区域适配** [NEW - 2026-02-10]
- [x] 断点续测功能
- [x] SCPC构念加权评分系统
- [x] 冲突锚检测
- [x] AI个性化深度分析
- [x] 历史评测趋势
- [x] 雷达图动画
- [x] 结果导出分享
- [x] 移动端响应式设计
- [x] 多语言支持（CN/TW/EN）
- [x] Row Level Security (RLS)
- [x] **结果页面SCPC合规更新**
- [x] **用户语言解释框架**
- [x] **深度解读页面更新**
- [x] **Edge Function用户语言框架**
- [x] **如何使用结果页**
- [x] **HR 专业解读页**
- [x] **40道SCPC官方题目替换** [NEW - 2026-02-10]
- [x] **修复多语言对象渲染错误** [2026-02-11] — 首页/个人页职业阶段选择弹窗中多语言对象直接渲染导致React Error #31
- [x] **深度解读等页面移动端适配** [2026-02-11] — DeepDive/ActionPlan/History/HowToUse页面响应式布局+安全区域适配
- [x] **人生理想卡测试** [2026-02-23] — 新增人生理想卡三阶段筛选(70→30→10→排序)，framer-motion拖拽排序
- [x] **移动端弹窗和PWA适配修复** [2026-02-23] — 职业阶段弹窗内容可滚动+按钮固定底部；理想卡/测评页PWA safe-area适配
- [x] **彻底禁用自适应测评，固定完整40题模式** [2026-02-24] — 在useAssessment hook中硬编码mode="full"，移除所有测评模式选择器UI，清理自适应相关UI元素
- [x] **管理员下载完整版报告** [2026-02-25] — 测评分析页面新增「完整报告」按钮，生成包含分数解读/锚定详解/阶段指引/执行建议/答题明细的HTML报告
- [x] **管理后台CRUD与RLS权限控制** [2026-02-25] — 10张表全部启用RLS策略(super_admin全权/org_admin组织隔离/consultant客户隔离/user仅自身数据)；新增13个mutation hook；重写6个管理页面(超管组织管理+用户管理、组管部门管理+员工管理、咨询师笔记管理+测评分配)支持完整增删改查

- [x] **英文整合报告PDF空白页修复** [2026-03-14] — 修复 FusionReportV3Page 和 BatchAssessmentParticipantPage 中用 body regex 提取内容失败的问题，改用 root-div 提取；修复管理员端双重包装问题
- [x] **PDF文件名命名规则** [2026-03-14] — 所有PDF下载文件名包含报告编号；PDF页眉从硬编码"SCPC Report"改为动态pageTitle
- [x] **Ideal Card → Espresso Card 英文重命名** [2026-03-14] — 30+个文件中所有英文用户可见字符串"Ideal Card"/"Life Card"改为"Espresso Card"
- [x] **分享报告功能** [2026-03-14] — scpc_assessment_results表新增share_token字段；SharedReportPage公开页面根据token展示报告(支持三种类型)；BatchAssessmentParticipantPage新增分享按钮(生成token+复制链接)；/shared-report/:token路由
- [x] **理想人生卡报告4项修复** [2026-03-14] — 1）封面工作年资从null改为profile.work_experience_years正确显示；2）ReportWebCover的logo图片crossOrigin="anonymous"改为referrerPolicy="no-referrer"修复CORS导致图片加载失败；3）CPC_REPORT_CSS的body{max-width:820px}样式泄漏到web页面导致窗口不适配，所有报告web页面(IdealCardReportView/ReportView/SharedReport/BatchParticipant)注入body样式重置；4）IdealCardReportViewPage新增分享按钮：ideal_card_results表新增share_token字段+唯一索引，SharedReportPage新增fallback查询ideal_card_results；Profile接口补充work_experience_years和language字段
- [x] **报告窗口全面适配修复** [2026-03-14] — 1）HistoryPage职业锚历史查看从window.open+document.write改为sessionStorage+navigate('/report-view')，复用已适配的ReportViewPage；2）AssessmentReportsView管理员端3处新窗口查看（职业锚/理想人生卡/融合报告）注入CPC_WEB_BODY_RESET body重置样式；3）将4个已有页面(ReportViewPage/IdealCardReportViewPage/SharedReportPage/BatchAssessmentParticipantPage)的内联body重置字符串统一替换为共用导出常量CPC_WEB_BODY_RESET
- [x] **移动端测评流程+多角色登录优先级修复** [2026-03-14] — 1）移动端首页测评选择弹窗：测评类型卡片始终可见（不再选择后隐藏），未选类型时按钮显示"请先选择测评类型"提示；2）移动端登录不再自动跳转管理后台（admin console是桌面布局不适配移动端），始终留在使用者首页；3）桌面端AuthPage登录也改为默认导航到首页（多角色用户从个人页/工作台入口手动进入管理后台）；4）AuthCallbackPage新增移动端检测(window.innerWidth<768)，移动端直接到首页；5）OrgAdminLayout/ConsultantLayout/SuperAdminLayout三端移动端顶栏新增"使用者"快捷按钮(navigate('/'))，内容区新增overflow-x-auto防止表格溢出
- [x] **CP钱包内容仅在钱包页显示** [2026-03-14] — 桌面端首页移除CpWalletCard卡片和充值/推荐/报告三个快捷按钮；移动端个人页移除CP钱包摘要卡片（余额+会员等级+三种余额明细）；CP相关内容不再在登录或刷新时主动展示，仅通过导航菜单点击进入CP钱包页(/cp-wallet)查看；下拉菜单中的CP钱包和推荐奖励导航入口保留；测评CP扣费门槛（CpPurchaseModal）保留不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

不变

### 🎯 后续可扩展

- [ ] 管理后台题目管理功能
- [ ] 高级评测数据分析
- [ ] 第三方API集成

---

- [x] **移除首页管理员自动跳转** [2026-02-26] — 公开链接访问首页不再因持久化会话被强制跳转到管理控制台；只在主动登录时才- [x] **V4.2报告生成器12项修改** [2026-03-04] — 1)封面去除背景色和装饰元素 2)Part1标题→"8錨職涯核心驅動圖" 3)雷达图标签从全名改为TF/GM等缩写 4)职涯阶段标题→"你的職業階段" 5)Part2标题→"8錨職涯定位圖"并用HTML区间布局替换SVG图表 6)Part3标题→"錨點詳解"并移除分布总览图 7)锚点卡片使用深色渐变横幅头部(含分数) 8)修复career_advice重复section label前缀 9)新增risk_warning和development_path数据库字段渲染 10)Part4标题→"錨點發展失衡風險提醒" 11)Part5标题→"執行與學習方向" 12)generateFourZoneChartSVG不再被引用 13)报告末尾新增「重要提醒：取捨是必然的」模块(amber左边框+tradeoff列表+励志结语) 14)修复part6后多余page-break导致的空白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

白页

跳转

- [x] **测评报告页面优化** [2026-02-26] — 修复八维得分卡片布局溢出；增加答题详情展开按钮（显示题目文本、维度、作答、权重）；增加每行PDF下载按钮（含完整得分和答题明细）
- [x] **SCPC Logo集成** [2026-02-26] — 所有控制台（超管、机构HR、咨询师）侧边栏和顶栏使用新SCPC globe logo（CDN: 1eeac3700a3d.png）；manifest和favicon同步更新
- [x] **侧边栏折叠功能** [2026-02-26] — 所有控制台支持侧边栏收起/展开，折叠后只显示图标，状态存储在localStorage（scpc_sidebar_collapsed）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

d）

- [x] **测评派发功能实现** [2026-02-26] — handleAssign 现在真正写入 assessment_assignments 表，支持批量派发（batch_id 聚合），表新增 batch_id 和 target_description 字段
- [x] **移动端按钮安全区域修复** [2026-02-26] — 测评介绍页开始按钮、首页底部CTA、底部导航栏均添加 safe-area-inset-bottom 适配，PWA 模式下按钮不再被手势条遮挡
- [x] **PWA 优化** [2026-02-26] — 修复 manifest 图标尺寸声明；添加 Service Worker 缓存支持；PWA安装提示添加繁体中文；底部导航栏增加毛玻璃效果和繁体中文标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

标签

- [x] **认证管理系统完整生命周期** [2026-02-27] — 新建 certifications/cdu_records/renewal_applications/certification_review_logs 四张表；咨询师端3页面（我的认证/CDU记录/续证状态）；机构管理端3页面（认证总览/CDU监控/续证审核）；超管端认证管理页面（全平台管理+颁发认证）；三端导航更新
- [x] **PDF证书生成与在线验证** [2026-02-27] — jsPDF生成A4横向专业证书（SCPC品牌色装饰边框+持证人信息+二维码）；公开验证页面 /verify-certificate 支持证书编号查询和QR扫码验证；咨询师端新增下载证书和在线验证按钮
- [x] **认证提醒与通知集成** [2026-02-27] — certification-reminders Edge Function 自动检测到期认证（6/3月）和CDU不足发送提醒；CDU审核/续证审核/认证颁发时自动发送消息通知；超管端新增"运行提醒"手动触发按钮；消息集成现有messages表
- [x] **v4认证企业升级** [2026-02-27] — 数据库结构升级(5年/80学时+A/B类CDU+课程库+notification_logs)；A类CDU自动化+B类审核+课程库管理；批量操作(CSV导入+批量A类CDU+续证名单导出)；CCE格式导出；超管CDU审核中心；咨询师端CDU分类展示+B类上传重构；机构管理端CDU监控+批量审核重构；Edge Function A/B类学时明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

明细

- [x] **PDF报告分页修复+复制/分享链接修复** [2026-03-01] — 综合报告PDF导出智能分页；复制/分享改为链接操作；移动端新增完整报告入口
- [x] **多角色登录持久化修复** [2026-03-01] — 修复用户切换到用户视角后重新登录工作台消失的问题；首页用户菜单同时检查role_type和additional_roles显示工作台入口；邮箱登录后自动导航考虑多角色；setup_test_account RPC重置过期角色数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

### V3.1 充值消費型會員商業系統

- [x] **CP 系統數據庫架構** [2026-03-01] — 建立完整 CP 商業系統數據庫：
  - 核心表：cp_wallets（三分帳錢包）、cp_ledger_entries（24月到期分帳帳本）、cp_transactions（交易審計）
  - 會員系統：membership_tiers（5級可配置等級）、user_memberships（用戶會員狀態）、membership_rules（系統鎖定+可配置規則）
  - 充值退費：recharge_packages（充值包）、recharge_orders（訂單）、refund_requests（退費公式強制）
  - 合作方：product_partners、partner_products（5:5/3:7分成）、partner_revenue_records
  - 獎勵：referral_rewards、service_catalog（CP定價）、cp_consumption_records（消費明細）
  - 數據庫函數：deduct_cp（固定扣點順序）、calculate_refund（退費公式）、process_recharge、evaluate_membership_tier、grant_activity_cp、expire_cp_entries
  - 種子數據：5個會員等級（普通→鑽石）、12條規則（8條系統鎖定+4條可編輯）、5個充值包、5個服務目錄
- [ ] **CP 錢包 & 會員等級用戶端**
- [ ] **超管會員規則引擎**
- [ ] **CP 充值流程 & 充值包**
- [ ] **CP 消費扣點 & 退費機制**
- [ ] **產品合作方入口**
- [ ] **諮詢與推薦贈點機制**
- [ ] **商業閉環整合**

- [x] **模板生成器+报告生成器+赠点选人+合作方绑定升级** [2026-03-02] — 三类报告模板(LIFE_CARD/CAREER_ANCHOR/COMBINED)完整生命周期管理；报告生成器四步驤流程+内容版本管理；赠点管理新增"从机构选用户"批量赠点；合作方新增用户绑定/解绑功能
- [x] **报告生成器重构+模板真删除+角色管理补partner** [2026-03-02] — 报告生成器移除手动四步生成流程，报告根据用户分数区间和工作年资自动匹配生成；内容版本新增编辑/永久删除功能；已生成报告支持搜索和永久删除；模板生成器新增永久删除功能（归档和删除并存）；角色管理页面新增 partner（合作方）角色显示
- [x] **报告生成器类别+职业阶段维度重构** [2026-03-02] — 创建报告生成器时可选三类别(CAREER_ANCHOR/LIFE_CARD/COMBINED)；内容按四个职业阶段(entry/mid/senior/executive)组织；数据库三张内容表添加career_stage字段+唯一约束(uq_active_version_per_category)确保每类别仅一个active版本；ReportGeneratorPage添加类别选择器和过滤器；ReportVersionDetail以职业阶段为主维度重构；全页面React.lazy动态加载解决构建内存问题
- [x] **首页文案更新** [2026-03-02] — 桌面端+移动端主视觉标题更新为「探索你最值得堅持與發展的職涯底層需求」，副标题改为多段落说明（基于Edgar Schein理论），三语言同步更新
- [x] **合作方销售数据页重写** [2026-03-02] — SalesPage完整重写：8张指标卡（今日/月/年/累计的销量与收入）；三层筛选器（时间区间+产品下拉+搜索）；产品类型色标徽章（文档蓝/链接紫）；useMemo优化日期计算
- [x] **合作方收入报表增强** [2026-03-02] — RevenuePage新增产品类型列、新增「全部记录」标签页（显示原价/合作方分成/平台分成/状态）；导出功能升级为下拉菜单支持CSV+Excel双格式，导出字段含产品类型/会员等级/原价/实付/分润比/平台份额/合作方份额
- [x] **产品管理状态流转** [2026-03-02] — ProductsPage新增草稿(DRAFT)/下架(OFFLINE)状态；严格执行状态流：DRAFT→(提交)→PENDING→(审核)→APPROVED/REJECTED→(下架)→OFFLINE；已通过产品禁止直接编辑（需先下架）；草稿/被驳回/已下架产品支持编辑+提交审核；被驳回产品显示审核备注
- [x] **理想人生卡数据库架构** [2026-03-02] — 新建5张表：life_cards(卡片定义70张)、life_card_text_blocks(版本化解读文本)、fusion_life_card_rules(前3名组合解读)、life_card_user_results(70→30→10→排序路径追踪)、partner_sales(详细销售记录含会员等级/分润快照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

照)

- [x] **理想人生卡后台管理** [2026-03-02] — 超管端新增「人生卡管理」页面（/super-admin/life-cards）：卡片CRUD（三语言名称+描述、分类、图标、排序、启停用）；解读文本管理器（核心价值/职业倾向/优势潜能/发展建议/风险提醒×3语言）；分类色标徽章；文本块完成度统计
- [x] **融合规则配置器** [2026-03-02] — 超管端新增「融合规则」页面（/super-admin/fusion-rules）：选择前3名卡片组合+输入三语言融合解读文本；可搜索卡片选择器（排除已选）；规则列表卡片式展示（视觉化排名流）；启停用切换；超管侧边栏内容管理分区新增两个入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

入口

- [x] **RoleGuard Hooks顺序修复** [2026-03-02] — 修复 RoleGuard 组件中 useMemo 在条件返回之后调用导致 React Error #310 的问题；将所有 Hooks 移至条件返回之前，符合 React Rules of Hooks
- [x] **合作者角色新增** [2026-03-02] — 权限系统新增 collaborator（合作者）角色：咨询级分类，权限等级55，可访问仪表盘/测评/报告/报告导出/分析/客户管理；共享咨询师控制台路由(/consultant)；用户管理页面角色选择器新增合作者选项（青色色标）；角色管理页面同步更新；超管可创建合作者角色用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

用户

- [x] **职场阶段描述管理** [2026-03-03] — 报告生成器新增「职场阶段」标签页；超管可编辑四个职涯阶段（职场新人/职涯中前期/职涯中后期/高管与创业者）的三语言描述文字；新建 career_stage_descriptions 表存储；首次加载自动填入预设初始内容；支持重置为预设；CAREER_STAGES 标签名更新为职涯中前期/职涯中后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

后期

- [x] **V3报告6项优化** [2026-03-03] — 封面从浅灰改为深海军蓝品牌色渐变+白色文字（更高端专业）；章节编号全部-1（职场阶段解读从第1章开始）；CSS增加page-break-inside:avoid防止卡片内文字被分页截断；移除前3章之间的强制分页符减少空白页；核心优势锚点章节新增「锚点分布总览」框架概览（按4区间分组展示所有8锚点）；集成AI边缘函数+智能fallback确保报告100%完整无占位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

位符

- [x] **结果页标题文案+PDF封面背景修复** [2026-03-03] — 结果概览页主标题从「了解你长期职业中不能被牺牲的东西」改为「探索你最值得坚持与发展的职涯核心需求」（三语言同步）；PDF封面渲染时容器和html2canvas背景色从#ffffff改为#0f2447配合深色封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

封面

- [x] **V3报告三大结构性修复** [2026-03-03] — 1）雷达图分页截断修复：在第1章和第2章之间添加data-page-break分页标记，确保雷达图从新页面顶部开始不被切断；2）核心锚点框架概览已确认在锚点解释前面正确显示；3）第7章（失衡风险）和第8章（发展建议）从逐个锚点列举改为综合AI分析——基于用户的分数区间、核心/高敏感锚综合分析生成整体风险评估和发展建议，不再列出全部8个锚点单独说明。AI优先生成内容，失败时使用基于分数模式的智能fallback
- [x] **V3.11 双锚/三锚AI生成+图表缩小+卡片顺序调整** [2026-03-03] — 1）双锚结构解读(Ch5)：数据库无内容时调用personalized-analysis边缘函数(analysisType:"dual_anchor")自动生成3-4段散文解读，AI生成内容不显示tier徽章；2）三锚结构解读(Ch6)：数据库无内容时调用personalized-analysis边缘函数(analysisType:"tri_anchor")自动生成原型名称+3-5段散文解读，DB和AI均无内容时整章不显示；3）Ch4锚点卡片顺序调整：核心诠释框架(career_advice)移到锚点解释(anchor_explanation)前面；4）图表缩小：雷达图外加max-width:440px容器约束，四区间图zoneHeight:90→72、headerHeight:40→32、padding:20→16（总高440→352px），ch2和ch3之间移除分页符确保两图同一PDF页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

F页

- [x] **V3.13 UI文案优化+报告行动建议章节** [2026-03-04] — 1）“AI深度解读”统一改为“深度解读”（结果页、生成按钮、三语言）；2）测评历史点击“查看详情”时传入fromHistory状态，结果页不再显示理想人生卡测试入口；3）删除“简易PDF”下载按钮，“V3专业报告”统一改为“完整报告”，与“分享报告”一起置于行动建议模块下方；4）V3完整报告PDF新增第9章「行动建议」，基于核心优势锚点生成学习方向、职涯路径、验证行动、权衡考量四个板块；5）历史页“V3报告”按钮改为“完整报告”
- [x] **V3.12 全面锚点解读+PDF分页+封面美化** [2026-03-04] — 1）Chapter 4从仅显示核心优势锚点(≥80)升级为按四个区间展示全部8个锚点（核心优势≥80→高敏感区65-79→中度影响45-64→非核心<44），每组有彩色区间标题徽章，每张卡片后插入data-page-break标记；2）Chapter 7（失衡风险）和Chapter 8（发展建议）的大段文字内容通过renderTextAsSplitSections()函数按段落拆分为独立主题卡片（risk-theme/dev-theme样式），自动识别标题行+正文对，每个子卡片间插入data-page-break，解决PDF中长文本被截断的分页问题；3）封面从简单深蓝渐变升级为高端品牌设计——5段渐变更丰富的深海军蓝背景、金色(#c6a364)品牌强调系统（标题横线、副标题文字、信息标签、报告编号、角落装饰框、认证印章）、垂直辅助线装饰、四角几何边框元素、SCPC圆形认证印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

印章

- [x] **V4.2 報告生成引擎全面升級** [2026-03-04] — 封面從深藍漸變改為淡雅象牙米白漸層（ivory/cream gradient）+Schein引用語+雙列信息網格（姓名/職涯階段/工作年資/測評版本/測評日期/報告編號）；章節編號從「第X章」改為「第X部分/Part X」共6部分結構；Part 3八錨詳解增強版每錨含強度條形圖+核心詮釋+分區結構解析+結構角色意義+發展張力（≤150字）；核心優勢錨每個獨立分頁；新增結構增強模組（權重比例圖+權重密度指標+雙錨互動+三錨協同）；Part 4改為四維風險分析（身份過度依附/能量耗竭/成長停滯/結構錯位）；Part 5改為三層發展建議（能力深化/角色升級/結構優化）；Part 6焦點行動推薦；V4.2專屬色系（#1C2857深藍/#E9ECEF灰/#F6C343金/#F4A261橙/#E76F51紅）+Montserrat+Noto Sans字體；錨點全名映射V42_ANCHOR_LABELS；四區間顏色V42_ZONES（core=navy/high=gold/moderate=blue/nonCore=gray）；PDF文件名改為SCPC-V4.2-Report

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

rt

- [x] **V4.2 報告後續修正** [2026-03-04] — 1）雷達圖底部文字從分數改為錨點代碼(TF/GM等)，保留頂部全名；2）章節標題badge移除，改為「第一部分」統一文字格式（CHINESE_NUMBERS+partPrefix）；3）Part 2定位圖四個區域全部固定展示（即使區域內無錨點）；4）核心優勢區「分區結構解析」文案從負面「不願妥協」改為正向「核心優勢方向」；5）錨點卡片內「核心詮釋框架」與「錨點解釋」之間移除分頁符，連續展示；6）新增結尾提醒區塊「重要提醒：取捨是必然的」；7）修復尾部空白頁（移除part6後多餘page-break）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

k）

rt

- [x] **SCPC 融合旗舰报告 V3** [2026-03-04] — 新增融合引擎V3：用户完成理想人生卡Top10排序+职业锚8维度评测后，生成第三份融合报告。纯前端计算引擎(fusionEngineV3.ts)含对齐度/张力指数/集中度/平衡度/成熟度L1-L4/结构类型6分类；70张卡→8价值维度映射+VALUE_ANCHOR_WEIGHT_MATRIX权重矩阵；4个SVG可视化（融合雷达双多边形、张力象限4色分区、8×8价值锚点热力图、路径A/B时间线模拟）；fusion-analysis Edge Function(gemini-2.5-flash)生成第3-7节AI叙述+路径A/B模拟文本；PDF导出复用downloadReportWithCover；综合报告页新增渐变「融合V3」入口按钮
- [x] **统一完整报告下载** [2026-03-04] — 创建 `downloadLatestV3Report()` 共享函数，所有「完整报告」下载按钮统一从数据库获取最新测评记录，通过 `assessmentResultToV3Params` 构建参数后调用 `downloadV3ReportAsPdf`，确保所有入口生成完全相同的 SCPC 报告
- [x] **PDF导出优化与统一智能分页** [2026-03-04] — 1)封面版本标签从"V4.2 企業專業完整版"改为"專業完整版"，PDF文件名去除V4.2前缀；2)PNG→JPEG(0.92质量)+jsPDF deflate压缩，PDF体积从200MB降至~20MB；3)修复理想人生卡报告最后一页空白页问题（剩余内容<30px时跳过分页）；4)统一所有PDF导出使用智能分页逻辑（downloadHtmlAsPdf委托给downloadHtmlAsPdfWithBreaks），确保综合报告、咨询师报告等也享有data-page-break标记+findSafeCutRow像素级间隙检测
- [x] **测评历史三分类标签** [2026-03-04] — 历史页面重构为三个顶级分类标签（职业锚/理想人生卡/融合测评）；每个标签独立展示对应类型的历史记录并带数量角标；理想人生卡测试完成时自动持久化结果到ideal_card_results数据库表；新建useIdealCardHistory hook；融合标签自动匹配职业锚+理想人生卡记录生成融合入口；各标签空状态有引导按钮跳转到对应测试
- [x] **三报告统一下载架构** [2026-03-04] — 三种报告各自独立、各自统一：1)职业锚报告→`downloadLatestV3Report`(reportV3Download.ts)从assessment_results表取数；2)理想人生卡报告→`downloadLatestIdealCardReport`(reportIdealCardDownload.ts)从ideal_card_results表取数，fallback sessionStorage；3)融合报告→`downloadLatestFusionReport`(reportFusionDownload.ts)从assessment_results+ideal_card_results双表取数，含V3量化指标(computeFusionMetrics)+best-effort AI叙事(fusion-analysis Edge Function)。exportReport.ts的`generateFusionAnalysisReportHTML`新增可选fusionMetrics参数，存在时追加Parts 4-9（量化融合分析+AI叙事5章）。移除FusionReportV3Page独立路由(/fusion-report-v3)，V3功能整合进融合报告PDF。ComprehensiveReportPage下载按钮标签明确区分「职业錨/Anchor」和「融合/Fusion」
- [x] **Badge光学居中v6** [2026-03-04] — badge.tsx内容感知光学居中（后废弃，见v7）
- [x] **Badge全局垂直居中v2** [2026-03-04] — badge.tsx二次重构（后废弃，见v7）
- [x] **Badge v7 简化 + 报告HTML胶囊CJK光学居中** [2026-03-05] — 1）badge.tsx移除translateY偏移逻辑和extractText/hasCJK/hasLatinOrDigit辅助函数，回归简洁inline-flex+items-center+leading-none方案；2）确认Image2/3中显示异常的胶囊标签是报告HTML(reportV3Generator.ts)的inline style元素而非React Badge组件；3）修复reportV3Generator.ts三处CJK光学居中：anchor-badge(padding:0 16px→0 16px 2px)、role-badge(padding:0 20px→0 20px 2px)、框架总览anchor chip(padding:8px 18px→6px 18px 10px)；4）在reportV3Generator.ts和exportReport.ts顶部写入「胶囊样式铁律」四条规则注释（文字背景不可分割/CJK光学居中方法/禁用line-height居中hack/必须line-height:1）；5）exportReport.ts同步修复height:26px融合报告zone capsule(padding:0 12px→0 12px 2px)
- [x] **报告繁简体校正+四维移除+标号居中** [2026-03-04] — 1）Part 4失衡风险分析移除「四维/四維/four-dimension」用词（中/英/繁三语言）；2）全局校正繁体中文报告"风→風"（14处\u98CE\u96AA→\u98A8\u96AA）、"温→溫"（1处）、actionPlans「輪崗機會」→「輪職機會」；3）section-header-title添加line-height:1修正圆点标号与标题文字的垂直居中对齐
- [x] **双锚/三锚分析互斥** [2026-03-04] — 核心优势锚点(≥80)恰好2个→仅双锚互动分析；超过2个→仅三锚协同分析；条件===2/>2互斥；入口处sortedScores对所有分数先Math.round()取整，确保过滤阈值≥80与卡片显示Math.round一致（修复79.x显示为80但不触发双锚的bug）
- [x] **PDF分页空白页修复** [2026-03-04] — 报告data-page-break标记从20+处精简至10处；CSS移除.risk-theme/.dev-theme/.block-card/.block-card-dark的page-break-inside:avoid允许长文字自然跨页流动；新增不可分割保护：彩色横幅+强度条包裹在page-break-inside:avoid容器中、.anchor-badge/.role-badge/.zone-label/.framework-zone加page-break-inside:avoid、.section-label加page-break-after:avoid确保标签不与后续内容分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

分离

- [x] **理想人生卡报告AI深度解读** [2026-03-04] — reportIdealCardDownload.ts下载流程集成ideal-card-analysis Edge Function，生成10模块AI深度解读（核心价值结构总览、前三名深度解析、价值分布分析、驱动模式、内在张力分析、职业阶段适配、十年展望、发展建议、风险提示、行动方案）；best-effort调用，AI失败仍生成基础报告；已有generateAIAnalysisSections()渲染HTML+edge function全部就绪，仅补充了下载流程中的AI调用环节
- [x] **综合分析页按钮简化+融合报告PDF V3美化** [2026-03-04] — 1）综合分析页删除「职业锚」下载按钮，「融合」按钮改为「完整报告」主色按钮，清理handleDownloadV3/isExportingV3/LangKey等死代码；2）融合报告generateFusionAnalysisReportHTML完整重写Part1-3（职业锚驱动图谱+理想人生卡价值图谱+交叉分析），采用V3设计系统（Montserrat+Noto Sans TC字体、zoneColor四区间配色、partHeader深蓝徽章标题、sectionHeader圆点标题、page-break-inside/after:avoid分页保护、print-color-adjust:exact）；3）generateFusionV3SectionsHTML完整重写Part4-9（量化融合分析→3列指标网格+2列信息卡、一致性拆解→左边框accent+权重/支持徽章、张力来源→红色/橙色severity分级卡片、阶段预测→三色顶边框时间窗口卡、风险预警→severity分层样式+缓解措施虚线框、关键建议→深蓝序号圆+2列benefit/risk网格）
- [x] **CPC Report Design System v1.0** [2026-03-05] — 报告生成系统设计规范统一升级：1）新建reportDesignSystem.ts作为所有报告样式的Single Source of Truth，包含CSS Tokens(色值/圆角/间距变量)、排版类(.cpc-part-header/.cpc-section-header)、卡片类(.cpc-card-muted/.cpc-risk-section/.cpc-dev-section)、胶囊类(.cpc-pill-sm/md/lg+CJK光学补偿top-2 bottom+2)、区域颜色类(.cpc-pill-inv-core/high/mid/low)、辅助函数(getZonePillClass/getZoneInvertedPillClass/getZoneColors等)；2）reportV3Generator.ts全面升级(33编辑)：注入CPC_REPORT_CSS替代旧@import+reset、所有class名cpc-前缀化、框架概览chips改用getZoneInvertedPillClass、role-badge从div改span+cpc-pill类；3）exportReport.ts两批升级——第一批12编辑(融合报告两处style块替换+7种badge+partHeader/sectionHeader helpers)，第二批全面扩展到所有报告生成器：generateReportHTML(基础职业锚)style块替换+section header；generateComprehensiveReportHTML(完整版职业锚)style块替换+5个part header+3个section header+score-level/conflict/resource/recommended四种badge；generateIdealCardReportHTML(理想人生卡)2个part header+2个section header；generateAIAnalysisSections(AI解读)sectionHeader helper+concentrated/absent/concentration-level/fit-level/risk-type五种badge；4）badge.tsx移除内部wrapper层。最终状态：4个style块全部注入CPC_REPORT_CSS、9个part header全部用cpc-part-header类、14处section header全部用cpc-section-header-compact类、16处pill/badge全部用cpc-pill类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

l类

- [x] **CPC Semantic Zone Contract — 颜色不匹配根因修复** [2026-03-05] — 引入统一语义配对合约(Semantic Pair Contract)，通过CSS自定义属性`--sem-bg/--sem-fg/--sem-bd`统一所有报告元素的颜色来源：1）reportDesignSystem.ts新增12个`.cpc-sem-*`语义类（core/high/mid/low各solid+soft，warn/danger/danger-solid/info/info-soft/featured/penalty）+激活类`.cpc-sem`读取变量；2）`.cpc-pill`基类改为读取CSS变量`background:var(--sem-bg)`/`color:var(--sem-fg)`/`border:var(--sem-bd)`；3）`.cpc-strength-bar-fill`和`.cpc-weight-bar-fill`加入`background:var(--sem-bg)`；4）新增`getZoneSemClass(score)`和`getZoneSemSoftClass(score)`两个helper函数；5）reportV3Generator.ts 9处修改——锚点chips/区间标签/权重条/强度条/角色徽章/双锚三锚胶囊全部迁移到语义类；6）exportReport.ts 22处修改——综合/理想/融合三种报告的分数条/等级胶囊/冲突/资源/推荐/AI标签/risk/penalty/indicator等全部迁移；7）动态颜色(fitColor/alignColor/supportMC等)通过内联变量`style="--sem-bg:${xxx};--sem-fg:...;"`桥接；8）修复根因：`getScoreLevelLabel()`返回红/琥珀/蓝/灰色板 vs 区间元素使用海军蓝/橙/黄/绿色板的不一致——统一通过`getZoneSemSoftClass(score)`驱动；9）删除exportReport.ts中废弃的`zoneColor()`辅助函数；10）验证：0个残留background/color直接覆盖、0个cpc-pill-primary、0个cpc-pill-inv
- [x] **报告生成器编辑权限修复** [2026-03-05] — active（启用）状态可继续编辑内容，仅locked（锁定）才禁止编辑；publishMutation不再锁定内容块，lockMutation才执行内容锁定；新增unlockMutation恢复active状态+解锁内容块；UI新增amber色解锁按钮（LockOpen图标）；i18n三语言同步
- [x] **生成器复制+绑定管理+优先级报告生成** [2026-03-05] — 1）新建generator_bindings表(version_id FK→report_versions, binding_type user/organization, target_id, bound_by, 唯一约束uq_binding_target_version)；2）生成器模板复制功能：一键克隆版本+四张关联内容表(score_ranges/anchor_text_blocks/anchor_combination_mapping/anchor_tri_mapping)为新草稿；3）绑定管理标签页(GeneratorBindingsTab)完整CRUD：新增绑定(搜索用户/机构+选择生成器)、解绑确认、替换语义(同target+type+assessment_type旧绑定自动清除)；4）报告生成链路全面升级：fetchActiveReportVersion支持三级优先级(用户绑定>机构绑定>全局active)；fetchAnchorTextBlocks/fetchDualAnchorText/fetchTriAnchorText/fetchAllAnchorTextBlocks新增可选versionId参数过滤；V3ReportInput新增organizationId；generateV3Report使用boundVersionId；DeepDivePage使用binding-aware版本查询
- [x] **理想人生卡+融合报告CJK胶囊居中+智能分页** [2026-03-05] — 理想人生卡category badge应用铁律(padding:1px 10px 3px+line-height:1)；融合报告alignment badge(3px 16px 5px)；融合V3量化分析5处badge(Weight/Support/penalty/severity/indicator)全部应用铁律；融合V3 Part5-9之间各补充data-page-break智能分页标记
- [x] **全报告品牌一致性对齐** [2026-03-05] — 以V3职业锚报告(reportV3Generator.ts)为品牌基准，对exportReport.ts中全部6个HTML生成函数进行SCPC品牌统一：字体族统一为Noto Sans TC/SC+Montserrat；主色#1C2857(替换旧#1a365d)、文字#1a1a2e、边框#E9ECEF(替换旧#e2e8f0/#f1f5f9/#eee)、卡片#f8f9fa(替换旧#f8fafc)；Part-header徽章标题替换所有h2；section-header div/span替换所有h3；所有胶囊/徽章从inline-block改为inline-flex居中+line-height:1；数字圆形从line-height hack改为flex居中+Montserrat；max-width 820px、padding 0 24px 48px、line-height 1.7/1.8、print-color-adjust、text-align:justify；footer统一为"SCPC — Strategic Career Planning Consultant"。涉及函数：generateReportHTML、generateIdealCardReportHTML、generateAIAnalysisSections(10模块)、generateFusionAnalysisReportHTML、generateFusionV3SectionsHTML、generateComprehensiveReportHTML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

ML

- [x] **CPC Report Layout Contract v2.0** [2026-03-05] — 报告排版合约全面升级：1）reportDesignSystem.ts v2.0完整重写——`.cpc-pill`使用`display:inline-flex;align-items:center`+固定高度(24/28/32/36px)+水平padding+`.cpc-pill-text`内层wrapper(仅line-height:1，无光学补偿)+`.cpc-sem`激活器带fallback值(#eee/#111)确保变量解析失败时文字可见+`.cpc-bar-label`强制line-height:1避免继承body的1.7；`.cpc-bar-row`从flex改为CSS Grid `170px 1fr 54px`+`.cpc-bar-track/.cpc-bar-fill/.cpc-bar-value`语义类；CSS变量`--sem-bg/fg/bd`全部重命名为`--cpc-bg/fg/bd`（破坏性变更）；`:root --cpc-bg`重命名为`--cpc-page-bg`释放命名空间；新增`.cpc-report-root`全局基线重置(box-sizing/font-smoothing/vertical-align:middle)；`.cpc-strength-bar-fill`更新为`var(--cpc-bg, var(--cpc-primary))`；2）reportV3Generator.ts全面更新——BODY_STYLES瘦身去除280+行冗余CSS；删除V42_ZONES/getV42Zone，替换为`getZoneBorderAlpha(score)`返回rgba边框色；`generateWeightRatioChart`改用`.cpc-bar-row`grid标记；框架概览+Part3锚点数组移除死zone属性；锚点卡片边框改用rgba；所有胶囊(anchor-chips/role-badge/dual-anchor/triple-anchor)加入`cpc-pill-text`wrapper；`<body>`后加`<div class="cpc-report-root">`+`</body>`前加`</div>`；3）exportReport.ts全面更新——8处`--sem-bg/fg/bd`→`--cpc-bg/fg/bd`重命名(含var()引用和inline setter)；17处pill全部加入`cpc-pill-text`内层wrapper；4个HTML模板的`<body>`全部加入`cpc-report-root`包裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

裹层

- [x] **CPC Report Design System v2.1 — 排版强制锁定** [2026-03-05] — reportDesignSystem.ts升级至v2.1：新增SCOPE LOCK CSS区（`.cpc-report-root`内全部`!important`强制覆盖），pill从inline-flex改为`inline-grid+place-items:center`彻底锁死文字居中，`.cpc-pill-text`新增`padding-bottom:2px`CJK光学补偿，新增`.cpc-dual-hint-row`(flex+gap:12px)替换双锚/三锚行内联style，`.cpc-bar-row`grid升级为180px/1fr/60px+`!important`，新增`.cpc-level-tag`(inline-grid+place-items:center+44px高度)+`.t1`/`.t2`子选择器替换四区定位图`cpc-zone-label`；reportV3Generator.ts三处HTML模板修改：四区zone label改用`cpc-level-tag`+`.t1/.t2`两行结构、双锚行容器改用`cpc-dual-hint-row`、三锚行容器改用`cpc-dual-hint-row`；Iron Rules注释更新为v2.1（7条）
- [x] **CPC Layout v2.1后续修正** [2026-03-05] — `.cpc-level-tag`高度44→48px+padding`0 18px 4px`；`renderNumberCircle`/`.cpc-number-circle`：38px+fontSize 15px+padding`0 0 3px 0`
- [x] **测评报告页完整报告按钮** [2026-03-05] — AssessmentReportsView.tsx展开行内「查看答题详情」旁新增「完整报告」按钮，调用handleDownloadV3Pdf下载与用户端一致的完整PDF报告
- [x] **机构测评权限控制** [2026-03-06] — 超管可控制每个机构可使用的测评类型：1）organizations表新增enable_career_anchor/enable_ideal_card/enable_combined三个boolean字段(DEFAULT true)；2）OrganizationsPage编辑弹窗新增测评权限toggle区域（三个开关）；3）新建useOrgAssessmentPermissions hook查询机构权限；4）useUpdateOrganization mutation扩展支持三个权限字段；5）HomePage双核测评区Career Anchors/Ideal Life Card/Combined Assessment根据机构权限条件渲染；6）Career Stage弹窗三个测评入口卡片根据权限显示/隐藏，全部禁用时显示提示信息。个人用户（无机构）默认全部开放
- [x] **赠点管理页面修复** [2026-03-05] — 1）机构列表查询修正：移除不存在的`short_code`字段（organizations表仅有id/name/domain/plan_type/status），改用`domain`显示+`status`徽章+用户数量统计；2）机构用户查询修正：从不存在的`organization_members`表改为通过`profiles.organization_id`直接关联查询，返回full_name/email/role_type/status；3）批量赠点结果显示用户姓名：profiles查询新增full_name字段，结果列表同时展示姓名+邮箱；4）机构赠点确认弹窗：新增已选用户名单滚动列表（姓名+邮箱）；5）机构列表增强：每个机构显示status色标徽章（active绿/suspended橙/archived灰）+用户数量（通过profiles统计）；6）organizations查询移除`enabled:orgGrantExpanded`条件，页面加载即预取全部机构数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

数据

- [x] **多机构管理员角色选择 + 报告CSS v2.2修复 + V3下载** [2026-03-05] — 1）reportDesignSystem.ts升至v2.2：级联顺序修复(.cpc-sem激活器移至.cpc-sem-*之前，确保html2canvas下直接属性胜出)；scope lock pill从inline-grid改回inline-flex+align-items:center；pill-text移除padding-bottom光学补偿改为纯inline-flex居中(padding:0,margin:0)；Iron Rules新增第8条(级联顺序)。2）RoleSwitcher多机构管理员支持：新增orgNameMap查询(organizations表批量查名称)、resolveOrgName辅助函数、isOrgRelatedRole判断；折叠/展开模式均显示Building2图标+机构名称；handleSwitchRole保留机构名称。3）RoleLoginDropdown控制台条目显示机构名称副标题。4）useOrgAssessmentReports增加career_stage字段(profiles查询+返回映射)。5）AssessmentReportsView新增handleDownloadV3Pdf处理函数+V3专业报告下载按钮(FileText图标)，原有下载保留为"基础报告"，详情弹窗主按钮改为V3报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

报告

- [x] **职业锚报告 Single Source of Truth 完整统一** [2026-03-06] — 两步统一：第一步下载统一：1）AssessmentReportsView删除handleDownloadPdf（旧B版）及其按钮，仅保留V3“完整报告”按钮；2）admin/AssessmentsPage删除handleExportSingle（旧C版）及其按钮；3）consultant/ReportsPage下载替换为downloadV3ReportAsPdf。第二步预览统一：consultant/ReportsPage删除旧版generateReportHTML（D版独立HTML生成器）+anchorFullLabels，预览弹窗改为异步调用generateV3Report生成与下载完全一致的HTML（含加载态）。分数审计：全代码库standardizeScores只有一个定义（questions.ts），所有从DB读取原始分的地方均已正确调用；发现并修复reportFusionDownload.ts关键分数bug：融合报告从DB读取assessment_results时未调用standardizeScores，导致原始加权分（如12.5）被直接与80阈值比较，核心锚判断+对齐度计算均错误，现已修复
- [x] **测评页insertBefore崩溃修复 + 移动端PWA适配** [2026-03-05] — 1）桌面端AssessmentPage修复：将问题编号头部从AnimatePresence外部移入内部，消除React与Framer Motion的DOM竞争条件(之前motion.div的key={`header-${currentIndex}`}和AnimatePresence同时操作父节点导致insertBefore失败)。2）移动端AssessmentPage修复：补充restoreProgress调用(之前handleResume未实际恢复进度)；新增completeAssignment任务标记(与桌面端对齐)。3）PWA清单增强：多尺寸图标(512/192/180/144px)、maskable支持、id字段、繁体中文快捷方式。4）新增RouteErrorFallback组件作为路由级errorElement，防止未捕获异常显示原始React错误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

误页

- [x] **胶囊文字垂直居中修复(CJK基线偏移)** [2026-03-05] — `.cpc-pill-text`从`display:inline-flex;align-items:center`改为`display:flex;align-items:center;align-self:stretch`，让文字容器拉伸至父级胶囊全高(36px)后再在全高范围内flex居中，消除CJK字体ascent/descent不对称导致的系统性下移3-4px问题；同时清除reportV3Generator中四区定位图胶囊的inline-flex内联样式冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

冲突

- [x] **CPC Report Pill Alignment Hotfix — 内联渲染 + 非对称padding** [2026-03-05] — 彻底修复胶囊文字消失/裁切/偏移问题。1）reportV3Generator.ts新增`renderPill(content,bg,fg,size)`函数，所有V3报告胶囊(四区概览/结构角色/双锚/三锚共8处)从CSS class渲染改为inline-style渲染，彻底绕过CSS层叠冲突和html2canvas兼容性问题。2）使用非对称padding光学补偿(上少下多：lg=6/10, md=5/9, sm=4/8)稳定CJK居中。3）新增`getPillColors(score,'solid'|'soft')`颜色映射函数，提供solid(深色底白字)和soft(浅色底深字)两套色板。4）新增`renderNumberCircle(num)`函数，验证行动步骤数字圆圈从22px增至28px并添加光学padding(1px/3px)。5）reportDesignSystem.ts scope lock移除`overflow:hidden !important`(根因：裁切CJK文字)；size tiers改为非对称padding；移除dual-hint-row对pill的高度覆盖；number-circle基类改为inline-flex+28px+padding光学补偿+font-smoothing。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

g。

- [x] **職業階段拆分 + 膠囊分頁鐵律 + 圓形偏移** [2026-03-06] — 1）reportConstants.ts的CAREER_STAGES將「高管/創業者」(executive)拆分為「高階管理者」(executive)和「創業者」(entrepreneur)兩個獨立階段，ReportVersionDetail新增entrepreneur樣式配色(rose-50/rose-600)；生成器各tab(文字塊/組合/三錨)可分別輸入對應內容。2）膠囊文字不可分頁鐵律：exportReport.ts的findSafeCutRow亮度閾值從180提高至240，禁止在有色背景行(如pill背景#dce4f2≈230)中切割；reportV3Generator.ts每張錨點卡片前插入data-page-break標記，框架概覽區(Part2)前也加入標記並設page-break-inside:avoid；結構角色膠囊+說明文字包裹在不可拆分原子容器中。3）renderNumberCircle新增transform:translateY(30%)，圓形色塊整體下移30%高度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

度。

g。

- [x] **PDF分页保护胶囊不可分割铁律** [2026-03-05] — 修复胶囊/深色卡片被PDF分页线切开的问题。三层修复：1）reportV3Generator.ts在所有含胶囊的区块前添加`data-page-break`分页标记（双轴互动提示block-card-dark、三锚协同cpc-card-muted、每个锚点卡片、Part间过渡共10+处），引导分页器在安全位置断页；2）所有inline-style胶囊（renderPill）和CSS类胶囊（.cpc-pill scope lock）添加`page-break-inside:avoid;break-inside:avoid`，cpc-dual-hint-row/cpc-card-muted/cpc-risk-theme/cpc-dev-theme/cpc-zone-anchors同步添加分页保护；3）exportReport.ts的`findSafeCutRow`像素扫描器增加亮度检查——原逻辑仅检查brightness transitions(≤3为quiet)，深色渐变背景因颜色均匀被误判为quiet行导致切割；新增avgBrightness>180条件，确保只有亮色(近白色)行才被视为有效切割点，彻底杜绝在深色卡片内部切割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

割。

- [x] **维度列加宽 + 部门子部门数据聚合** [2026-03-06] — 1）AssessmentReportsView的维度列从w-16加宽w-24，锚点类型标签（創業型/挑戰型等）不再折行。2）DashboardPage和AnalyticsPage的部门统计修复：顶级部门现在会聚合所有子部门的memberCount和completedAssessments，例如營運部门会包含晶圓廠子部门的3位员工和2个已完成测评。根因：原代码只取顶级部门自身的直接成员数，未向下聚合child departments。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

s。

- [x] **测评管理页数据显示为零 + 加载慢** [2026-03-06] — useOrgAssessments 查询用了 `profiles!assigned_to` FK关联，但 assessment_assignments 表无此外键约束，PostgREST 报错。react-query 默认重试3次（指数退避）后放弃，返回空数据，导致统计全为0且加载耗时长。修复：改为两步查询，先单独查 assessment_assignments（无join），再用 `.in("id", uniqueUserIds)` 批量查 profiles，在前端匹配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

配。

割。

- [x] **条形图对齐+胶囊/圆圈居中迭代** [2026-03-05] — 1）权重比例图重构为专用CSS类`cpc-anchorRow`（grid-template-columns:220px 1fr 64px），label列width/min-width/max-width三重锁死220px，score列三重锁死64px，scope lock用!important保证列宽不被覆盖，所有行bar起点在同一竖线；填充色按锚点类型(CH/EC=#1F2D5A,AU/SV=#E47E22,GM/LS=#E6B63D,SE/TF=#20A87B)；2）胶囊高度+10%(sm:33,md:40,lg:48)，底部padding加大(sm:12,md:16,lg:17)；3）数字圆圈34px+padding 0/5；4）移除Part间不必要的data-page-break（仅保留Part1前和Part3前）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

）。

- [x] **删除合作方(Partner)角色** [2026-03-06] — 从10个代码文件中清理所有partner角色引用（App.tsx路由/lazy import、useAuth角色处理、RoleGuard/RoleLoginDropdown/RoleSwitcher、SuperAdminLayout导航、AllUsersPage/RolesPage角色选择器、permissions.ts角色定义），遗留文件(PartnerLayout.tsx/partner pages/PartnerReviewPage)保留为死代码不影响构建
- [x] **机构类型管理系统** [2026-03-06] — 新建organization_types表(code/三语名称描述/default_feature_permissions jsonb/is_active/sort_order)；种入4个默认类型(enterprise/education/consulting/independent)各配11项默认功能权限；超管端OrgTypesPage完整CRUD（列表+新增编辑Modal含11权限toggle）+侧边栏导航+路由
- [x] **机构功能权限控制升级** [2026-03-06] — organizations表新增organization_type_id FK和feature_permissions jsonb字段（替代旧enable_career_anchor/enable_ideal_card/enable_combined三字段）；OrganizationsPage弹窗升级：新增机构类型下拉选择器（选择时自动加载默认权限模板）+11项功能权限toggle（新增和编辑模式均显示）；向前兼容：编辑旧机构时从旧三字段自动迁移权限值
- [x] **咨询师功能权限编辑** [2026-03-06] — profiles表新增feature_permissions jsonb字段；ConsultantsPage列表操作列新增ShieldCheck权限编辑按钮；权限编辑Modal含11项功能权限toggle+直接更新profiles表；useConsultants hook扩展select包含feature_permissions
- [x] **SCPC报告企业版用词合规+全站术语统一** [2026-03-06] — 1）actionPlans.ts 8处「副業」→「跨部門專案/跨部门专案」；stageInterpretations.ts 6处同上+L861简繁混用修复(跨部门專案→跨部门专案)；2）desktop/mobile HomePage「高敏感」→「核心」(共10处)；3）全站17个文件20+处「風險指數/风险指数/Risk Index」→「錨定清晰度/锚定清晰度/Clarity Index」+「高敏感錨/高敏感锚/High-Sensitivity Anchor」→「核心錨/核心锚/Core Anchor」(含useLanguage三语言/ShareDialog/ShareCard/exportReport/HistoryPage/MyReportsPage/ReportVersionDetail/admin+consultant+org-admin页面)；4）reportV3Generator.ts锚点Banner分数垂直居中(align-items:center+text-align:center)；5）reportDesignSystem.ts 3处text-align:justify→left修复CJK标点间距异常；6）AI企业版内容规范：reportV3Generator.ts 3个AI调用传入reportVersion+organizationId，personalized-analysis Edge Function新增isEnterprise检测+getEnterpriseRules()三语言企业版禁令(禁用副業/风险标签/替代用跨部門專案+發展注意事項)注入4种分析类型system prompt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

pt

- [x] **网页/PDF报告统一+高敏感锚→核心锚清理** [2026-03-06] — 1）新建 ReportViewPage (/report-view) 用 generateV3Report() 生成 HTML 再 dangerouslySetInnerHTML 渲染，网页报告和 PDF 报告100%内容一致；2）结果页简化：移除「深度解讀/行動建議/HR專業解讀/分享報告」四張卡片和分享按钮，只保留「如何使用结果」+「查看完整报告」+「下载完整报告」，desktop+mobile同步；3）App.tsx路由更新：新增/report-view，移除/deep-dive和/action-plan路由；4）残留「高敏感錨/锚/High-Sensitivity Anchor」清理：HowToUsePage三语言6处、HRInterpretationPage三语言9处、AssessmentPage 3处、HomePage desktop+mobile英文版本2处、personalized-analysis Edge Function 12处(riskAmplificationNote+userProfileBlock+coreMeaning三语言)
- [x] **网页/PDF数据源一致性修复** [2026-03-06] — 修复ReportViewPage和ResultsOverviewPage中PDF下载与网页展示使用不同数据源的问题：之前网页视图从sessionStorage生成HTML，但PDF下载通过downloadLatestV3Report()从数据库重取最新记录，两者数据可能不同步。现在两个页面统一改用downloadV3ReportAsPdf()直接传入页面上已显示的sessionStorage分数，确保PDF下载内容和网页展示100%一致（所见即所得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

得）

- [x] **移动端+PWA适配强化** [2026-03-06] — 1）reportDesignSystem.ts新增@media(max-width:767px)移动端响应式CSS：cpc-anchorRow grid列从220px/1fr/64px缩至90px/1fr/44px确保375px屏幕不溢出，cpc-bar-row同步缩减，胶囊三级尺寸(sm/md/lg)全面缩小，cpc-level-tag紧凑化(height:40px/padding:0 12px)，cpc-dual-hint-row加flex-wrap:wrap允许多行；2）ReportViewPage顶部粘性栏添加paddingTop:env(safe-area-inset-top)适配iPhone PWA刘海，底部下载区添加safe-area-inset-bottom，内容区padding移动端优先(px-3/py-6)；3）HRInterpretationPage三处px-6改为px-4 sm:px-6响应式padding；4）移动端ResultsPage清理未使用import(Download/Zap)+hasIdealCards死代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

代码

- [x] **报告生成性能优化** [2026-03-06] — 报告生成管线重构：1）fetchActiveReportVersion从3次串行DB查询改为Promise.all并行；2）AI deep_dive调用与DB文本查询(fetchAllAnchorTextBlocks+fetchCareerStageDescription)同时发起，不再等DB完成；3）双锚/三锚DB预取纳入初始并行批次，减少后续串行等待；4）reportV3Generator拆分tryAiContentGeneration为fireAiDeepDive(纯API调用)+mergeAiDeepDiveResult(后处理合并)实现解耦；5）ReportViewPage加载界面增加进度条+步骤提示(检查配置→载入数据→AI分析→渲染)
- [x] **报告PDF排版精修** [2026-03-06] — 1）结构角色意义区块（标题+胶囊pill+说明文字）加入break-inside:avoid，防止被PDF分页切开；2）锚点权重比例图色条从顶部对齐改为底部对齐、高度缩至80%，整体视觉下移20%；3）验证步骤编号圆圈内数字padding从bottom改为top，数字视觉居中下移
- [x] **测评管理+报告权重管控** [2026-03-06] — 1）机构管理员测评管理页新增删除批次功能（AlertDialog确认+batch_id DELETE），hover完成人数显示已完成/未完成用户名单（Tooltip+profiles join）；2）报告生成器新增V3ReportOptions.showWeights选项（默认false），超管通过isSuperAdmin传true，权重信息（权重比例图、框架overview分数、锚点卡片banner分数、区间分数标签）仅超管可见；3）结构权重密度模块对所有用户永久删除；4）第四部分（发展失衡风险分析）对所有用户完全删除，原Part5→Part4，原Part6→Part5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

t5

- [x] **统一批次施测模块** [2026-03-11] — 企业级统一批次施测功能完整实现：
  - **数据库**：5张新表 `scpc_assessment_batches`(批次)、`scpc_assessment_sessions`(参与者会话)、`scpc_assessment_results`(结果)、`scpc_batch_access_logs`(访问日志)、`scpc_batch_reminder_logs`(提醒日志)。RLS策略：super_admin全权、org_admin/hr按organization_id过滤、anon可读active批次+写入session/result
  - **参与者页面** `/batch/:slug`：验证码验证(6位+错误限制)→个人信息(姓名/部门/邮箱/工作年资)→40题SCPC测评→结果页(雷达图+8维分数+冲突检测)；sessionStorage token支持断点续测
  - **批次状态流**：draft→active→paused→closed→archived
  - **超管端** 3页面：批次列表(/super-admin/batch-assessment)、创建批次(含机构选择+高级选项)、批次详情(4标签页：Dashboard/Results/Team Stats/Logs)
  - **机构HR端** 3页面：同结构但无Logs标签页、无机构选择(自动使用profile.organization_id)
  - **实时仪表盘**：15秒轮询、KPI卡片、完成率进度条、今日完成数、近5笔记录、8维平均分条形图
  - **结果管理**：可展开行(4列维度卡片)、CSV导出(UTF-8 BOM)
  - **团队统计**：锚点分布(水平条形图)、部门分布、工作年资分组(0-3/3-7/7-15/15+)、团队平均分
  - **侧边栏**：超管「施測中心」分区含批次施测+匿名测评；机构端新增「批次施測」导航
  - **Hook**：useBatchAssessment.ts(所有类型+CRUD+slug/code生成器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

器)

### 报告可见性 + 下载权限控制 (2026-03-11)

企业级报告权限控制能力，允许超管或机构 HR 决定员工完成测评后的报告访问权限。

**数据库字段**：

- `scpc_assessment_batches.employee_report_access_mode` (TEXT, NOT NULL, DEFAULT 'view_and_download')
- CHECK约束：`view_and_download` | `view_only` | `hidden`

**三种模式**：

1. `view_and_download`：员工可查看并下载报告（默认）
2. `view_only`：员工可查看但不可下载，下载按钮禁用状态+提示文案
3. `hidden`：员工不可查看报告，仅显示“已完成” + “仅管理员可查看”提示

**角色权限**：

- 超管/HR：始终可查看、下载、导出所有员工报告
- HR 创建批次时设置权限，优先级高于系统默认

**前端变更**：

- 创建批次页（超管+HR）：进阶选项区新增 RadioGroup 三选项
- 批次详情页（超管+HR）：Info Cards 下方新增权限徽章卡片（绿/黄/红状态）
- 参与者结果页：根据模式动态显示下载按钮/禁用状态/隐藏报告

**修改文件**：

- `src/hooks/useBatchAssessment.ts` — BatchAssessment + CreateBatchInput 类型新增字段
- `src/pages/super-admin/desktop/CreateBatchAssessmentPage.tsx` — RadioGroup
- `src/pages/org-admin/desktop/CreateBatchAssessmentPage.tsx` — RadioGroup
- `src/pages/super-admin/desktop/BatchAssessmentDetailPage.tsx` — 权限徽章+ShieldCheck
- `src/pages/org-admin/desktop/BatchAssessmentDetailPage.tsx` — 权限徽章+ShieldCheck
- `src/pages/BatchAssessmentParticipantPage.tsx` — 三态权限逻辑+Download/Lock图标

### 理想人生卡报告生成器系统 (2026-03-11)

企业级理想人生卡报告生成器管理系统，替代旧的人生卡管理页面。

**侧边栏变更**：

- 删除「报告模板」按钮
- 「报告生成器」→「职业锚报告生成器」(zh-TW: 職業錨報告生成器 / en: Career Anchor Report Generator)
- 「人生卡管理」→「理想人生报告生成器」(zh-TW: 理想人生報告生成器 / en: Ideal Life Report Generator)

**数据库架构升级**：

- `life_cards` 表新增5字段：`spectrum_type` (career/neutral/lifestyle)、`content_locked`、`locked_by`、`locked_at`、`version_no`
- 新建 `life_card_quadrant_contents` 表：card_id × language (zh-TW/zh-CN/en) 唯一约束，四象限文本(quadrant_external/internal/career/relationship)，独立锁定机制
- 新建 `life_card_content_audit_logs` 表：审计日志(create/edit/lock/unlock/ai_generate/spectrum_change)

**光谱分类体系**：

- career（工作职业导向）: #1C2857 navy
- neutral（中性价值）: #8B6914 gold  
- lifestyle（生活形态导向）: #1B6B3A green
- 每张卡片必须绑定一个spectrum_type

**四象限固定结构**：

1. quadrant_external — 对外部环境的感知
2. quadrant_internal — 对自我内在的思维
3. quadrant_career — 对职业生涯的态度
4. quadrant_relationship — 对家庭或朋友的具体行为

**系统铁律**：

1. 繁体中文(zh-TW)是唯一权威原始版本
2. 简体/英文由AI严格翻译，不增减内容
3. 只有content_locked=true+is_locked=true的内容才能进入正式报告
4. 四象限结构固定不可修改
5. 光谱类型三选一，不可缺省
6. AI翻译后仍需人工审核方可锁定
7. 锁定操作记录审计日志
8. 解锁需要管理员权限
9. 版本号每次编辑自动+1
10. 测评流程：70→30→10→3
11. 光谱结构报告替代雷达图
12. 报告只读取已锁定内容

**管理页面功能**：

- 统计栏：总数/career/neutral/lifestyle/已锁定/有四象限内容
- 光谱分布条形图：三色进度条
- 筛选栏：搜索+光谱类型+锁定状态+分页
- 卡片表格：编号/名称/分类/光谱(内联Select)/内容状态(三语言圆点)/锁定开关/编辑
- 编辑弹窗：光谱切换+三语言标签页+四象限Textarea+AI翻译按钮+锁定/解锁+保存

**Edge Function**：

- `life-card-translate`：接收zh-TW四象限文本，通过gemini-2.5-flash翻译为简体中文和英文，返回结构化JSON

**修改文件**：

- `src/layouts/SuperAdminLayout.tsx` — 侧边栏改名
- `src/pages/super-admin/desktop/LifeCardManagementPage.tsx` — 完整重写
- `supabase/functions/life-card-translate/index.ts` — 新Edge Function
- `supabase/config.toml` — 新Function注册
- Migration: `20260311074725_964cf6680cae4d0490f52b8179ee7e8b.sql`

### 理想人生卡内容初始化系统 (2026-03-11 续)

批量初始化70张理想人生卡的权威内容，含光谱分类和四象限繁中文本。

**新建文件**：

- `src/data/lifeCardInitData.ts` — 以 `name_zh_tw` 为键，存储70张卡的完整初始化数据
  - 光谱分类：career 22张 / lifestyle 21张 / neutral 27张
  - 四象限繁体中文内容（权威原始版本）

**LifeCardManagementPage 新增批量操作**：

1. **批量初始化（繁中）**：遍历70张卡，按 name_zh_tw 匹配初始化数据，更新 spectrum_type + upsert zh-TW 四象限内容，跳过已锁定卡片
2. **批量AI翻译（→简中/英文）**：筛选有 zh-TW 但缺 zh-CN/en 的卡片，顺序调用 life-card-translate Edge Function 翻译，跳过已锁定内容

**UI 增强**：

- AlertDialog 二次确认弹窗（防误操作）
- Progress 进度条 + 当前/总数计数器
- 操作期间禁用其他按钮
- **理想人生卡70张种子数据写入数据库** [2026-03-11] — 通过 SupabaseExecuteDDL PL/pgSQL DO块写入70张理想人生卡种子数据：life_cards表新增70条记录（三语言名称/分类/图标/光谱类型/版本号）；life_card_quadrant_contents表新增70条zh-TW四象限内容记录（外在世界观/内在信念/职涯取向/关系模式）。FK约束解决方案：从auth.users取真实用户UUID，upsert profile后写入。数据来源：idealCards.ts（id/category/names）+ lifeCardInitData.ts（spectrum + zh-TW四象限）。迁移文件：20260311090655_7af9a064751441bb92975628df01b550.sql。验证：life_cards 70条（intrinsic:27/interpersonal:15/lifestyle:19/material:9）、life_card_quadrant_contents zh-TW 70条
- **理想人生卡UI/报告六项改造** [2026-03-11] — Feature #50 完成：
  1. 去掉测评页intro步骤说明附图区（IdealCardTestPage 移除 Steps preview 区块）
  2. 卡片3D立体感设计（CardGrid选中/未选中阴影、RankItem拖拽阴影、结果页top-3卡片和完整排名列表）
  3. 报告PDF从生成器读取四象限内容（reportIdealCardDownload.ts 查询 life_cards + life_card_quadrant_contents，按 sort_order 匹配 idealCard.id）
  4. 报告PDF新增光谱分布图（career=#1C2857, neutral=#8B6914, lifestyle=#1B6B3A 三色条形图 + 卡片列表）
  5. 报告PDF新增价值卡深度解读区块（每张卡四象限内容：外在世界观/内在信念/职涯取向/关系模式）
  6. AI深度报告重命名（标题/按钮/副标题全部改为 “AI 深度報告”）
  7. AI边缘函数接受四象限内容作为基础参考材料（ideal-card-analysis 接受 quadrant_contents 参数并在 user prompt 中注入）
  8. IdealCardResultsPage 的 handleGenerateAI 也从 DB 获取四象限内容传给 AI
  9. 生成器全局锁定/解锁按钮（LifeCardManagementPage 新增 “全部鎖定”/“全部解鎖” 按钮，带 AlertDialog 确认，批量更新 life_cards + life_card_quadrant_contents）
- **理想人生卡结果页六项重构** [2026-03-11] — IdealCardResultsPage 全面重构：
  1. 移除行动建议（actionItems）和 AI 深度报告（aiAnalysis）区块及所有相关 state/函数/imports
  2. 前三名排名使用金(#FFD700)/银(#C8C8C8)/铜(#CD7F32) 奖牌渐变色高亮
  3. 十张卡片改为双列 grid 布局，每张卡片添加 3D 立体效果（多层阴影、顶部高光条、底部暗边、whileHover 浮升）
  4. 工作取向vs生活取向模块后面新增「职涯-生活光谱分布」区块（从 life_cards.spectrum_type 读取，三色横条 + 分类卡片列表）
  5. 新增「价值卡深度解读」完整报告区块（从 life_card_quadrant_contents 读取四象限内容：外在表现/内在驱动/职业应用/关系影响，2x2 彩色 grid）
  6. 页面加载时自动从 DB 获取 spectrum_type + quadrant_contents，无需手动触发
- **理想人生卡专业报告UI重设计** [2026-03-11] — Feature #51 完成：
  1. 新建 `IdealCardReportCard` 组件（四象限2×2网格+emoji图标🌍💼🧠🤝+金银铜奖牌渐变+AI中性描述区#B5D260左边框）
  2. Edge Function `ideal-card-analysis` 新增 `card_descriptions` 模式：批量生成10张卡片中性描述（gemini-2.5-flash, temperature=0.5），严格禁止人格定义/诊断/预测/评价/动机推论
  3. 重写 `IdealCardResultsPage`：专业深蓝Hero(#1C2857→#3b5998)、#F5F7FA背景、5页×2卡报告布局（页码指示器+优雅分隔线）、自动触发AI描述生成
  4. 光谱标签三色：career(#1C2857深蓝)/neutral(#6B7B8D灰蓝)/lifestyle(#1B6B3A绿)
  5. 四象限顺序：external(外部🌍)→career(职业💼)→internal(内在🧠)→relationship(关系🤝)
  6. Top 1-3 金银铜奖牌角标高亮
- **批次施测六项升级** [2026-03-11] — Feature #52 完成：
  1. `useUpdateBatch()` hook：PATCH `scpc_assessment_batches`（batch_name/start_time/end_time/instructions 等），成功后 invalidate batch queries
  2. 超管+机构HR批次详情页：头部铅笔图标→内联编辑模式（batch_name + start_time + end_time 的 datetime-local input）→储存/取消
  3. 新邮件模板：专业邀请函格式（中英双版，含测评说明/截止时间/验证码/作答须知四项要点——身分校準/真實傾向/環境要求/下載報告）
  4. 结果列表全选：Checkbox列 + 表头 indeterminate 全选/取消全选
  5. 批量完整报告下载：勾选员工→“下载完整报告”按钮→逐个调用 `downloadV3ReportAsPdf()` + 1500ms 节流 + 进度计数
  6. 参与者页面：下载按钮从 `window.print()` 改为直接生成 V3 完整 PDF（`downloadV3ReportAsPdf()`，失败回退 `window.print()`）
- **理想人生卡结果页九项优化** [2026-03-11] — Feature #53 完成：
  1. Top10卡牌排名改为 2列网格布局（`grid-cols-2`）
  2. 前三区块标题“你最重要的三個人生價值” → “排名前三的生涯價值卡”（三语言）
  3. 删除一致性分析整个区块（网页+PDF）
  4. 金银铜奖牌统一为金色（`MEDAL_STYLES`/`MEDAL_GRADIENTS`/`MEDAL_SHADOWS` 全金）
  5. “工作取向” → “生涯取向”（orientationTitle + workLabel，三语言）
  6. “職涯-生活光譜分佈” → “光譜分佈”（网页+PDF三语言）
  7. PDF报告删除副标题行（“焦點解決牌卡技術”）
  8. 被忽略维度改用固定反思问题文字（`MISSING_DIMENSION_TEXTS` 共享数据文件，四维度×三语言）
  9. PDF与网页格式完全一致（同一套数据和布局）
  涉及文件：`IdealCardResultsPage.tsx`, `IdealCardReportCard.tsx`, `exportReport.ts`, `missingDimensionTexts.ts`(新建)
- **移除理想人生卡PDF中AI深度解读报告** [2026-03-11] — Feature #54 完成：
  1. 从 `exportReport.ts` 移除 `IdealCardAIAnalysis` 接口和 `generateAIAnalysisSections` 函数（10个AI模块）
  2. 从 `reportIdealCardDownload.ts` 移除 `fetchIdealCardAIAnalysis` 函数（不再调用 ideal-card-analysis Edge Function）
  3. PDF报告不再等待AI分析，下载速度显著提升
  4. PDF报告除封面外，内容和区块顺序与网页完全一致：排名→光谱→缺失维度→四象限→页脚
  涉及文件：`exportReport.ts`, `reportIdealCardDownload.ts`
- **日志详情JSON解析 + 邮件文字校正** [2026-03-11] — Feature #55 完成：
  1. 超管端日志 tab 详情栏从原始JSON解析为可读格式（操作者邮箱、尝试次数、场次ID、耗时等）
  2. 结果页勾选 + 批量下载完整报告功能已在代码中实现，本次部署生效
  涉及文件：`BatchAssessmentDetailPage.tsx`（超管端）
- **排名全金色 + PDF下载机制修复** [2026-03-11] — Feature #56 完成：
  1. 理想人生卡测评页排名 badge（#1/#2/#3）全部统一为金色（原先#2银色#3铜色）
  2. PDF下载机制从 pdf.save() 改为 Blob URL + anchor 点击，提升浏览器兼容性
  3. 添加PDF生成日志（页数、文件大小）方便追踪问题
  涉及文件：`IdealCardTestPage.tsx`, `exportReport.ts`, `reportIdealCardDownload.ts`
- **排名阶段两列布局 + 3D立体卡片** [2026-03-11] — Feature #57 完成：
  1. RankPhase 容器 max-w-lg→max-w-3xl，布局 space-y-2→grid grid-cols-2 gap-2.5
  2. RankItem 重写：多层box-shadow(5层)、斜向渐变、顶部高光条、hover浮升、drag旋转
  3. 很端 w-9 h-9 rounded-xl + 前三金色渐变
  涉及文件：`IdealCardTestPage.tsx`
- **报告编号第X部分 + 数字居中 + AI卡片解读入PDF** [2026-03-11] — Feature #58 完成：
  1. 所有报告(V3/理想卡/融合)的部分编号从纯数字改为「第一部分」「第二部分」格式（英文“Part 1”），新建 partLabel() 辅助函数
  2. V3报告 labels 移除「第一部分：」前缀避免与badge重复
  3. 理想卡报告条件性section序号连续：光谱/缺失维度/四象限顺序递增，跳过空块
  4. PDF圆形数字badge添加 `top:-0.08em` 光学居中偏移
  5. IdealCardReportData 新增 aiDescriptions 字段，网页AI卡片内容说明现在包含在PDF下载报告中
  6. downloadLatestIdealCardReport 新增可选 aiDescriptions 参数
  7. IdealCardResultsPage 下载时传入 cardDescriptions
  涉及文件：`exportReport.ts`, `reportDesignSystem.ts`, `reportIdealCardDownload.ts`, `IdealCardResultsPage.tsx`
- **移除PDF footer生成时间行** [2026-03-11] — 所有报告PDF最后一页footer去掉第二行「生成時間: xxx」避免被截断，仅保留SCPC品牌标识行
- **移除理想人生卡PDF章节编号胶囊** [2026-03-11] — 光譜分佈、未被選入的維度、Top 10卡片深度解讀三个章节去掉「第X部分」胶囊标签，改为与前三名一致的简洁标题样式(cpc-section-header-compact)
- **理想人生卡测评报告数据源修复** [2026-03-11] — 测评报告页面「理想人生卡」tab 显示0条记录的根因修复：
  1. 根因：页面查 `user_reports` 表(report_type="ideal_card")，但理想人生卡测评结果实际保存在 `ideal_card_results` 表
  2. 新增 `useAllIdealCardResults` hook（超管端，查 ideal_card_results + profiles + organizations）
  3. 新增 `useOrgIdealCardResults` hook（机构端，按 organization_id 过滤成员再查结果）
  4. `IdealCardReport` 接口重构：从 report_type/title/report_data 改为 top10_cards/category_distribution
  5. 列表表头更新：用户/机构或部门/前三张价值卡/日期
  6. CSV 导出同步更新
  涉及文件：`useAdminData.ts`, `AssessmentReportsView.tsx`, 超管+机构 `AssessmentReportsPage.tsx`
- **测评报告页三项改造** [2026-03-12] — 
  1. 职业锚标签页移除「风险」列，表格从9列缩减为8列
  2. 新增「联合测评」标签页（Layers icon），展示 fusion_analysis_reports 数据：用户/机构或部门/核心锚点/首选卡/一致性%/日期/操作
  3. 理想人生卡和联合测评均实现与职业锚一致的查看（Eye）/下载（Download）/展开（ChevronDown）三项操作
  4. 新增 `useAllFusionReports`/`useOrgFusionReports` hooks 查询融合报告数据
  5. 理想人生卡展开行显示 Top10 卡片网格 + 分类分布；联合测评展开行显示锚点分数 + Top3 价值卡 + 三项指标面板
  涉及文件：`useAdminData.ts`, `AssessmentReportsView.tsx`, 超管+机构 `AssessmentReportsPage.tsx`
- **理想人生卡四项修复** [2026-03-12] — 
  1. 排名阶段拖拽修复：从 grid-cols-2 改为单列 flex 布局，解决 Reorder.Group 与 CSS Grid 不兼容导致卡片飞出问题
  2. 排名卡片 3D 美化：玻璃高光条、径向渐变叠加、多层柔阴影，拖拽时立体浮起效果
  3. 被忽略维度去编号：missingDimensionTexts 标题移除 一/二/三/四 前缀（网页 + PDF 同步生效）
  4. PDF 下载增强：blob 大小校验 + canvas 尺寸验证 + anchor 失败时 window.open 后备
  涉及文件：`IdealCardTestPage.tsx`, `missingDimensionTexts.ts`, `exportReport.ts`

**数字胶囊居中修复** [2026-03-12]

- `reportV3Generator.ts`: `renderNumberCircle` 函数移除 `padding-bottom:13px`，改用纯 flexbox (`align-items:center; justify-content:center`) 居中，解决焦點行動推薦数字偏上的问题
- `exportReport.ts`: 综合报告 PDF 中同类圆形 badge 的 `padding-bottom:3px` 也同步移除
- **联合测评报告体系重构** [2026-03-12] — 
  1. 封面改为「职业锚 × 理想人生卡\n联合测评」（`reportNumberGenerator.ts`: COVER_TITLES.fusion 更新，`white-space:pre-line`，fusion 专属副标题「融合发展分析报告」+ 说明段落）
  2. AI Edge Function (`supabase/functions/fusion-analysis/index.ts`) 完整重写为发展导向提示词，AI 输出从旧 6-section 结构改为新 6 字段结构：`report_understanding` / `structure_overview` / `development_focus` / `tension_integration` / `recommendations` / `stage_summary`；语言铁律禁止风险/冲突/人格定义/心理诊断/未来预测/因果推论
  3. `exportReport.ts`: `FusionNarrativeData` 接口新增上述 6 字段（可选）+ 保留 legacy 字段；`generateFusionV3SectionsHTML` 完整重写为 6 节发展导向 HTML（含 CSS 2D 轴位置图、双圆 Venn 图、发展结构胶囊标签、高亮 pills、三卡建议块、深蓝渐变总结块）；Part 3 标题从「交叉分析」改为「融合发展分析」；删除旧对齐卡片 HTML；新增 `generateLegacyFusionSectionsHTML` 向后兼容函数
  4. `FusionReportV3Page.tsx` 完整重写：`NarrativeData` 改为 `DevelopmentNarrative & LegacyNarrative` 联合类型；删除 `PathSimulationChart`；Section 3-7 改为发展导向节（融合结构总览 / 核心发展重心 / 发展张力与整合空间 / 情境发展建议 / 阶段总结）；新增 `RecommendationCard` 组件；in-file export HTML generator 同步更新
  - 颜色体系：深蓝 `#1C2857` + 绿色 `#B5D260` / `#6B8A1A`，国际咨询风格
  - 向后兼容：PDF 和网页均通过 `!!narrative.report_understanding` 检测格式，legacy 数据自动降级渲染
  涉及文件：`reportNumberGenerator.ts`, `supabase/functions/fusion-analysis/index.ts`, `exportReport.ts`, `FusionReportV3Page.tsx`
- **理想人生卡三项修复** [2026-03-12] — 
  1. 报告页 footer 文字被截断修复：`IdealCardReportViewPage.tsx` 报告容器移除 `overflow-hidden`，防止底部 SCPC 签名行被裁切
  2. 排序阶段拖拽失效修复：`IdealCardTestPage.tsx` 排序阶段的 AnimatePresence 包裹层从 `x:30→0` 改为仅 opacity 动画，避免 transform 干扰 Reorder 组件的坐标计算
  3. 结果页卡片等高修复：`IdealCardReportCard.tsx` 根容器改为 `h-full flex flex-col`，四象限网格加 `flex-1`；`IdealCardResultsPage.tsx` 网格子项 motion.div 加 `h-full`，两列卡片统一拉伸等高
  涉及文件：`IdealCardReportViewPage.tsx`, `IdealCardTestPage.tsx`, `IdealCardReportCard.tsx`, `IdealCardResultsPage.tsx`
- **联合测评报告三部分完整合并** [2026-03-12] —
  1. `reportFusionDownload.ts` 完整重写：新增 `generateCombinedFusionHTML()` 异步主函数，将完整 V3 职业锚报告 + 完整理想人生卡报告 + 融合分析报告 HTML 通过 `extractReportContent()` 提取后拼合成一份完整文档；新增 `COMBINED_FUSION_CSS` 常量（CPC CSS + V3 local CSS）；新增 `majorPartBanner()` 三大部分深蓝渐变分区标题；新增 `fetchIdealCardGeneratorData()` 和 `fetchAiCardDescriptions()` 导出函数供网页端复用
  2. `exportReport.ts`: `generateFusionV3SectionsHTML` 从私有函数改为 `export function`，修复编译错误
  3. `FusionReportV3Page.tsx` 完整重写为 `dangerouslySetInnerHTML` 模式：仿照 `ReportViewPage` / `IdealCardReportViewPage` 架构，异步调用 `generateCombinedFusionHTML()` 后渲染 HTML body，PDF 下载复用同一 HTML 内容，确保网页展示和 PDF 100% 一致
  4. `App.tsx`: 新增 `/fusion-report` 路由指向 FusionReportV3Page
  5. `ComprehensiveReportPage.tsx`: 顶栏新增「查看报告」按钮（Eye 图标），点击导航至 `/fusion-report`
  6. `AssessmentReportsView.tsx`: `handleViewFusionReport` 从旧的 `generateFusionAnalysisReportHTML()` + 新窗口模式，改为先将 anchor/card 数据存入 sessionStorage 再 `window.open("/fusion-report")`，统一使用三部分完整报告
  涉及文件：`reportFusionDownload.ts`, `exportReport.ts`, `FusionReportV3Page.tsx`, `App.tsx`, `ComprehensiveReportPage.tsx`, `AssessmentReportsView.tsx`
- 审计日志系统 + 稽核日誌/訂閱管理頁面重设计 [2026-03-12]
  - 新增 `src/lib/auditLogger.ts` 审计工具，自动记录登入/登出/删除用户
  - 审计接入 useAuth (SIGNED_IN/signOut) 和 useDeleteProfile
  - 稽核日誌頁面：卡片式列表 + 操作图标 + 智能时间 + 筛选面板 + 优化空状态
  - 訂閱管理頁面：基于实际schema字段重设计，方案梯度色徽章、到期预警、实体类型筛选

**最后更新**：2026-03-14 (机构验证码系统 + 移动端导航修复)  
**框架版本**：SCPC（專業完整版報告引擎）  
**部署**：superun.ai  
**数据库**：Supabase
**Logo CDN**：[https://b.ux-cdn.com/uxarts/20260226/1eeac3700a3d4b41ad6120512fa02969.png](https://b.ux-cdn.com/uxarts/20260226/1eeac3700a3d4b41ad6120512fa02969.png)

### v4 认证企业升级 [2026-02-27]

#### 5年/80学时标准

- 新认证默认 renewal_cycle_years=5, minimum_cdu_hours=80
- 现有认证保持原值不变（向后兼容）

#### A/B 类 CDU 分类体系

- **A类（官方课程）**：从 cdu_course_catalog 中选课完成后自动生成，cdu_type="A", auto_verified=true，无需人工审核
- **B类（外部活动）**：咨询师自行上传，cdu_type="B", auto_verified=false，需机构管理员或超管审核
- 7种活动类型：workshop, seminar, online_course, conference, supervision, self_study, other

#### 官方课程库 (cdu_course_catalog)

- 字段：course_code, course_name, course_provider, cdu_hours, cdu_type(固定"A"), description, is_active
- 超管端 CourseLibraryPage 支持完整 CRUD
- 课程不可删除，仅可停用 (is_active=false)

### 移动端底部导航修复 + 机构验证码系统 [2026-03-14]

- [x] **移动端底部导航修复** — 测评按钮增加登录判断+测评类型选择；记录/我的按钮恢复正常导航；NavLink改为button+navigate
- [x] **机构验证码三层门控** — handleCareerStageContinue重构为三层：登录检查→CP余额检查(仅isCpPointsEnabled)→机构验证码检查(仅profile.organization_id)→个人用户直接进入
- [x] **机构验证码数据库** — 新建org_assessment_codes和org_assessment_code_usage两张表，含RLS策略(super_admin全权/机构成员SELECT+UPDATE自己机构的码/用户INSERT自己的使用记录)
- [x] **CpPurchaseModal属性修复** — 移动端从错误的open/onOpenChange/service/getDiscountedPrice改为正确的isOpen/serviceName/originalPrice/discountedPrice
- [ ] **超管验证码管理UI** — 在OrganizationsPage中新增验证码管理功能（列表/创建/启停用/查看使用历史）

**机构验证码流程**：

1. 超管为机构创建验证码（设定max_uses）
2. 机构用户开始测评时，若CP功能未开启，弹出验证码弹窗
3. 输入验证码后校验：是否存在+是否激活+是否过期+是否有剩余次数
4. 校验通过后自动used_count+1，达到max_uses时自动停用
5. 记录使用日志到org_assessment_code_usage

#### 批量操作中心 (BatchOperationsPage)

- **CSV导入**：上传CSV认证名单（userId, certType, orgId），预览前10行后确认导入
- **批量派发A类CDU**：选择官方课程 → 选择活跃证书持有人 → 批量生成A类CDU记录
- **续证名单导出**：按日期范围筛选即将到期认证，导出CSV（UTF-8 BOM编码）

#### CCE格式导出 (CceExportPage)

- 13列固定格式CSV，供美国认证委员会使用
- 列：Certification Number, Holder Name/Email, Type, Status, Issue/Expiry Date, Renewal Cycle, Min CDU, Total/A-Type/B-Type Hours, Org ID
- 支持机构筛选和日期范围筛选
- A/B类学时分别汇总

#### 超管CDU审核 (CduAuditPage)

- 全平台CDU记录审核中心
- 三重筛选：搜索 + 状态 + CDU类型
- 批量选择待审核记录 → 批量通过/拒绝

#### 咨询师端重构 (MyCduRecordsPage)

- 5张汇总卡片：A类学时/B类学时/B类待审/总已批准/所需-剩余
- 进度条带颜色指示（<50%琥珀/50-99%蓝/100%+翠绿）
- B类上传弹窗：活动类型+标题+学时+日期+证明文件URL
- A类记录只读（自动核准标记）

#### 机构管理端重构 (CduMonitoringPage)

- 批量选择仅对pending B类记录生效
- A类记录显示"Auto-verified"徽章，不可操作
- 内联审核表单：评论+通过/拒绝
- 批量审核弹窗

### Edge Functions (认证系统)

1. **certification-reminders** - 认证到期提醒+CDU不足提醒+过期状态自动更新
  - 检测6/3个月内到期的active/pending_renewal认证
  - 计算CDU学时是否达标（含A/B类分类汇总）
  - 提醒内容包含 A类/B类学时明细
  - metadata 包含 type_a_hours, type_b_hours, renewal_cycle_years
  - 7天内不重复发送同类型提醒
  - 自动将到期认证状态更新为expired
  - 超管端可手动触发，也可配置cron定时任务

- **融合结构总览重设计** [2026-03-12] —
  1. `fusionEngineV3.ts`: 6种新结构标签替换旧评判性标签 — 结构一致/重点定位/发展张力/阶段探索/双重中心/均衡成长（含 SC/TC/EN 三语映射）
  2. `reportFusionDownload.ts`: `generateQuantitativeOverviewHTML()` 完整重设计 — 4张白底圆角卡片（一致度金色渐变/张力暖橙/平衡蓝/结构绿胶囊）；新增2D发展结构定位图（渐变背景+网格线+整合区虚线圆+用户渐变光点）；新增positionX/positionY计算逻辑（career vs life weight + concentration）；6种结构描述 structDescMap
  3. `exportReport.ts`: FusionV3Metrics接口新增positionX/positionY字段；S3节2D定位图完整重建 — 新轴标签（推進動力較強/節奏較柔性/職業發展關注/生活體驗關注）、整合区（dashed circle + radial-gradient）、用户光点（radial-gradient orb + glow shadow）；修复orphan `</div>` 嵌套bug；结构标签胶囊改为绿色背景
  涉及文件：`fusionEngineV3.ts`, `reportFusionDownload.ts`, `exportReport.ts`
  **CJK编码注意**：文件使用 `\uXXXX` 转义序列存储中文字符，MultiEdit时必须用 `\\uXXXX` 格式匹配
- **融合结构判定算法引擎重建 V2** [2026-03-12] —
完全重写 `fusionEngineV3.ts` 核心算法，从旧的 value-dimension→anchor 权重矩阵方式改为基于光谱×职业锚方向向量的三指标体系：
  1. **一致度 alignment_index**：职业锚方向向量 [career=mean(TF,GM,CH,EC), neutral=mean(LS,SV,TF), lifestyle=mean(LS,AU,SE)] 与理想人生卡光谱分布向量 [career_ratio×100, neutral_ratio×100, lifestyle_ratio×100] 的余弦相似度 ×100
  2. **张力 tension_index**：加权三部分 — 人生卡内部张力(max-min ratio)×35% + 职业锚Top3差距×25% + 跨系统方向差异×40%
  3. **平衡度 balance_index**：人生卡光谱标准差(100-stddev)×40% + 职业锚8锚标准差(100-stddev)×60%
  4. **结构标签判定**：优先级 重点定位>结构一致>均衡成长>双重中心>发展张力>阶段探索，各有阈值组合规则
  5. **边界缓冲**：3指标均变化≤±3时保留旧标签
  6. **光谱计算**：`reportFusionDownload.ts` 新增 `computeSpectrumFromCards()` 从 spectrumTypes DB映射计算 career/neutral/lifestyle 比例
  7. **FusionInputData** 扩展 `spectrumDistribution?` 和 `previousMetrics?` 字段
  8. **FusionComputedMetrics** 扩展 `structureSummary`, `crossTension`, `anchorDirectionVector`, `positionX`, `positionY`
  9. **2D定位**：X轴从spectrum ratio差值计算，Y轴从anchor concentration×1.2
  10. 旧算法（heatmap, valueDimWeights, supportStrengths）保留作为legacy用于报告其他section
  涉及文件：`fusionEngineV3.ts`(完全重写), `reportFusionDownload.ts`(光谱计算+引擎调用), `exportReport.ts`(接口扩展)
  **语言铁律**：禁用「风险/冲突/压抑/缺陷/失衡」等词，统一用「发展张力/结构差异/整合空间/阶段特征」
- **融合报告三章分隔** [2026-03-12] —
联合测评报告新增三章清晰分隔：第一章 职业锚测评报告 / 第二章 理想人生卡测评报告 / 第三章 融合分析报告。
  1. `reportFusionDownload.ts`: `majorPartBanner` 重命名为 `chapterBanner`，使用「第X章 / CHAPTER X」格式；深蓝渐变背景+金色顶线；每章含主标题+副标题；Step 6组装步骤在三段内容前插入章标题横幅
  2. `exportReport.ts`: `fusionPartHeader` 替换为 `fusionChapterHeader`，从「第X部分」改为「第X章」；标题从功能描述改为报告名称（职业锚测评报告/理想人生卡测评报告/融合分析报告）
  网页视图和PDF下载完全一致，均来自 `generateCombinedFusionHTML()` 单一源头
- **光谱方向向量映射调整 + 报告页UI优化** [2026-03-12] —
  1. `fusionEngineV3.ts` `computeAnchorDirectionVector`: 中性整合(neutral)从 mean(LS,SV,TF) 改为 mean(AU,SV,TF)；生活形态(lifestyle)从 mean(LS,AU,SE) 改为 mean(LS,SE)，除数从3改为2
  2. `ReportViewPage.tsx`: 顶部新增「职业锚测评报告」标题横幅（深蓝渐变+金色顶线，与融合报告章标题风格一致）
  3. `HistoryPage.tsx`: 测评历史列表移除「锚定清晰度/稳定性」元数据行，仅保留题数信息
- **理想人生卡结果页去掉查看报告按钮 + PDF标签居中修复** [2026-03-12] —
  1. `IdealCardResultsPage.tsx`: 移除底部「查看完整報告」按钮，仅保留下载报告按钮
  2. `exportReport.ts`: PDF卡片头部的类别/光谱标签添加 `display:inline-flex;align-items:center;line-height:1` 确保文字在胶囊内垂直居中
- **融合分析AI输出中英文术语混用修复** [2026-03-12] —
`supabase/functions/fusion-analysis/index.ts`:
  1. `spectrumPosition` 从硬编码英文 (balanced-integration/career-development/life-quality) 改为按语言本地化（如 zh-TW: 平衡整合/職涯發展導向/生活形態關注）
  2. `driveLevel` 从硬编码英文 (high/moderate/gentle) 改为按语言本地化（如 zh-TW: 高驅動力/中等驅動力/柔性驅動）
  3. 系统提示词和输出提示词均增加「严禁夹杂英文」的明确指令，防止 AI 在中文输出中插入英文术语
- **职业锚查看详情按钮加载反馈** [2026-03-12] —
`HistoryPage.tsx`: 新增 `viewingId` 状态，点击职业锚「查看詳情」按钮后显示旋转加载图标并禁用按钮，报告生成完成后自动恢复。解决报告动态导入+生成期间用户无反馈的体验问题
- **融合报告双图表结构理解模式重建** [2026-03-12] — Feature #59
彻底移除旧6标签体系（结构一致/双重中心/阶段探索/发展张力/均衡成长/重点定位），替换为双图表视觉理解模式：
  1. **新增文件 `src/data/cardAnchorMapping.ts`**：70张理想人生卡→8个职业锚代码的完整映射表（CARD_ANCHOR_MAP），每张卡唯一对应一个锚
  2. **新增文件 `src/lib/fusionChartGenerator.ts`**：全新Part 3 HTML生成器，5段结构：
    - 总览说明（含发展理解类型徽章）
    - 图表一：职业锚×人生卡映射结构图，4区模型（核心优势80-100金/高敏感65-79深蓝/中度影响45-64钢灰/开发中<45灰），按区分组锚点节点，每节点显示对应人生卡彩色chips
    - 图表二：人生卡发展分布图，inline SVG 760×380 散点图，X轴=Top10排名，Y轴=对应职业锚得分0-100，节点为带阴影的彩色卡片组件
    - 三类发展理解：兼容协同(compatible)/动态适配(adaptive)/关注需求(attentive)，三卡对比布局，活跃类型高亮
    - 情境建议：优先使用AI narrative，无则使用计算生成
  3. **判定逻辑 `computeDevelopmentUnderstanding()`**：兼容协同=top5均分≥65且低分卡≤1张；关注需求=top5中≥2张锚分<50；动态适配=默认
  4. **理想人生卡颜色铁律**：4类别固定色（intrinsic绿/interpersonal红/lifestyle橙/material蓝），绝不使用职业锚颜色映射
  5. **集成更新**：`reportFusionDownload.ts` 的 `generateCombinedFusionHTML()` 和 `exportReport.ts` 的 `generateFusionAnalysisReportHTML()` 均从旧的 `generateQuantitativeOverviewHTML()+generateFusionV3SectionsHTML()` 替换为 `generateFusionChartsHTML()`
  6. **语言铁律**：禁止人格定义/诊断/预测/评价性语言，统一发展导向表达
  涉及文件：`cardAnchorMapping.ts`(新), `fusionChartGenerator.ts`(新), `reportFusionDownload.ts`(集成), `exportReport.ts`(集成)
- **联合测评报告11项视觉与内容优化** [2026-03-12] — Feature #60 完成：
  1. 删除理想人生卡独立报告头部（`<header>`标题/用户名/日期）从联合报告中剥离（regex strip）
  2. 章节Banner 3D化升级：深渐变(#111d45→#243470)+4px金色光谱顶线+光反射线+底部glow+左侧accent线
  3. 职业锚Part 1（8锚核心驱动图）前加分页符（data-page-break）
  4. 封面标题简化为「联合测评报告 / 职业锚 × 理想人生卡」
  5. 行动推荐数字上移（inner span top:-1px）
  6. 胶囊badge文字上移（padding:1px 10px 5px 非对称）
  7. 第三章所有「融合」→「整合」：章标题+section标题+AI加载文字+概览标题（\u878d\u5408→\u6574\u5408）
  8. Chart 1（职业锚×人生卡映射结构图）卡片文字完整显示不截断（移除.slice(0,4)+"…"）
  9. 所有区域符号统一为◆（\u25C6）
  10. Chart 2（人生卡发展分布图）完整重设计：Y轴=[0,45,65,80,100]区间分隔；X轴从0开始(rank/11)；卡片改小圆点r=14+排名编号+SVG title hover tooltip；无连接线
  11. 删除支撑依据（Supporting Evidence）区块（evidenceItems+evidenceHtml全部移除）
  涉及文件：`reportFusionDownload.ts`(3编辑), `reportNumberGenerator.ts`(1编辑), `reportV3Generator.ts`(2编辑), `exportReport.ts`(4编辑), `fusionChartGenerator.ts`(4编辑)
- **融合报告6项修复：hover文字、分页切割、胶囊居中** [2026-03-12] — Feature #61 完成：
  1. Chart 2散点hover显示卡片名称标签（CSS class `cpc-chart2-dot:hover .cpc-chart2-label` + SVG `<text>` overlay，opacity 0→1过渡）
  2. 锚点卡片banner+强度条+首段Zone Structure Analysis合并为一个`data-keep-together`区块（原来banner+bar是一个块，content是另一个块，现在Zone Analysis也包入keep-together内）
  3. 移除理想人生卡Top 3卡片后的`data-page-break`标记（避免Top 3在新页顶部+大片空白）
  4. 光谱类型胶囊（生活方式/職業導向）padding从`1px 10px 5px`改为`4px 12px`+`justify-content:center`+`line-height:1.2`
  5. Chart 1卡片chips padding从`3px 8px`改为`5px 10px`，字号10px→11px/11px→12px
  6. 发展结构理解三卡+建议区块用外层`<div data-keep-together>`包裹为不可分割单元
  涉及文件：`fusionChartGenerator.ts`(3编辑), `exportReport.ts`(2编辑), `reportV3Generator.ts`(1编辑), `reportFusionDownload.ts`(1编辑—增加hover CSS)
- **Chart 2紧凑重设计+下载链路全面验证** [2026-03-12] — Feature #62 完成：
  1. Chart 2（理想人生卡发展分布图）紧凑化：SVG高度380→340、padRight 30→130、padTop 30→25、padBottom 60→48，右侧区间标签（核心/高敏/中度/開發中）完整显示不截断
  2. 圆点内容从排名数字改为职业锚代码（TF/GM/AU等），chipRadius 14→16以容纳2字符，字号11→10
  3. 区间标签字号8→10提高可读性
  4. Hover行为保持不变：悬停显示卡片名称，不显示职业锚
  5. 全平台下载链路验证（无需代码修改）：
    - 职业锚：ResultsOverviewPage / ReportViewPage / DeepDivePage / HistoryPage / AssessmentReportsView / consultant-ReportsPage — 全部正常
    - 理想人生卡：IdealCardResultsPage / IdealCardReportViewPage / HistoryPage / AssessmentReportsView — 全部正常
    - 联合测评：FusionReportV3Page / ComprehensiveReportPage / HistoryPage / AssessmentReportsView — 全部正常
    - 批次施测：超管+机构HR BatchAssessmentDetailPage 批量ZIP下载 — 全部正常
  涉及文件：`fusionChartGenerator.ts`(4编辑)
- **PDF胶囊文字居中修复** [2026-03-12] — Feature #63 完成：
  1. 理想人生卡报告PDF中分类胶囊（内在價值等）和光谱类型胶囊（職業導向等）文字不居中，溢出胶囊底部
  2. 根因：html2canvas对`display:inline-flex;align-items:center`的CJK文字渲染不可靠
  3. 修复：改为`display:inline-block;text-align:center`，CJK光学居中padding(5px top / 7px bottom)，字号11→12，padding 4px 12px → 5px 18px 7px 18px
  4. 同时修复融合报告结构类型胶囊（兼容協同等）的相同问题：padding改为7px 22px 9px 22px
  5. 网页版不受影响（浏览器正确支持flex居中）
  涉及文件：`exportReport.ts`(3编辑)
- **PDF智能分页全面修复** [2026-03-12] — Feature #64 完成：
6项PDF分页与样式问题一次性修复（附用户6张截图验证）：
  1. `findSafeCutRow` 像素扫描器三重改进：sampleStart 5%→8%跳过左边框artifact、亮度阈值235→218接受callout背景(如#dce4f2)、transitions ≤3→≤4适配CJK反锯齿；新增last-resort回退——无MIN_GAP连续安静行时查找最近单行安静行，彻底杜绝文字被切断
  2. `adjustCutForKeepTogether` 新增Option C松弛约束：当Option A(≥35%填充)和Option B(切后)均失败时，接受≥15%填充率切到区域前，消除大面积空白
  3. 补全所有缺失data-keep-together保护：renderTextAsSplitSections全3分支、锚点卡片4个内容子块(career_advice/anchor_explanation/risk_warning/development_path)、光谱取向条+图例、融合报告取向条
  4. 胶囊尺寸放大：分类/光谱胶囊 12px→13px + padding 6px 22px 8px 22px；结构类型胶囊 15px→16px + padding 8px 26px 10px 26px
  5. Chart 1卡片chips：gap 4px→8px、padding 5px 10px→6px 14px、font-size 12px→13px、rank font 11px→12px
  涉及文件：`exportReport.ts`(6处修改)、`reportV3Generator.ts`(2处修改)、`fusionChartGenerator.ts`(2处修改)
- **三项BUG修复：整合报告下载超时+术语统一+批次双测评流程** [2026-03-13] — Feature #64(新编号) 完成：
  1. **整合报告PDF下载超时**：`exportReport.ts`中`downloadReportWithCover`的renderScale在reportType==="fusion"时从2降为1.5，解决GPU OOM导致的45秒超时
  2. **全站术语统一**：21个文件中「融合/联合/聯合」→「整合」，涵盖侧边栏菜单、页面标题、报告内容、AI分析模块等
  3. **批次双测评(combined)流程断裂修复**：`BatchAssessmentParticipantPage.tsx`中，受测者完成职业锚测评后自动进入理想人生卡三阶段流程（选30→精选10→拖曳排序）。新增BatchCardGrid和BatchRankItem子组件、5个新PageView状态、completeIdealCardAssessment保存ideal_card_results(user_id:null)
- **批次测评完整报告展示 + 胶囊居中修复** [2026-03-13] — Feature #65:
  1. **胶囊文字居中修复**：`fusionChartGenerator.ts`中锚点-卡片映射chips的line-height从1改为1.3，padding从6px 14px改为5px 14px 7px 14px，解决CJK文字垂直居中偏移
  2. **批次测评完成后展示完整报告**：所有测评类型完成后不再展示简化结果页，而是直接生成并展示完整报告：
    - `career_anchor`类型：调用generateV3Report生成完整职业锚V3报告
    - `combined`类型：调用generateCombinedFusionHTML生成完整三章整合报告（职业锚+理想人生卡+整合分析）
    - `life_card`类型：调用generateIdealCardReportHTML生成完整理想人生卡报告
  3. **新增PageView状态**：`generating-report`（生成中加载页）和`report`（完整报告HTML渲染）
  4. **报告生成useEffect**：当view变为generating-report时触发，根据assessment_type调用不同的报告生成器，包括DB查询(spectrum/quadrant)和AI分析
  5. **下载PDF**：根据assessment_type使用不同的downloadReportWithCover配置（fusion/ideal_card/career_anchor）
  6. **权限控制保留**：report view保留employee_report_access_mode三态（hidden/view_only/view_and_download）
  涉及文件：`fusionChartGenerator.ts`、`BatchAssessmentParticipantPage.tsx`
- **理想人生卡测评完成跳转修复** [2026-03-13] — Feature #66:
  - `IdealCardTestPage.tsx`：完成测评后跳转从`/ideal-card-results`(简化结果页)改为`/ideal-card-report-view`(完整HTML报告页)
  - 完整报告页自动读取sessionStorage排名数据→查询DB光谱/四象限→生成AI解读→渲染完整报告
- **批次报告六项修复** [2026-03-13] — Feature #67:
  1. **下载按钮文字**：全站"生成中..."改为"下載中..."（BatchAssessmentParticipantPage 3处 + FusionReportV3Page 2处）
  2. **PDF文件名**：`SCPC-Combined-Report`统一改为`SCPC-Fusion-Report`（BatchAssessmentParticipantPage、FusionReportV3Page、reportFusionDownload.ts）
  3. **打包下载按测评类型生成正确报告**：org-admin和super-admin的`handleBatchDownloadReports`完全重写，按`batch.assessment_type`分三支：
    - `combined`：动态import reportFusionDownload，查scpc_assessment_results.value_ranking，生成fusion报告blob
    - `life_card`：动态import exportReport的generateIdealCardReportHTML，生成理想人生卡报告blob
    - `career_anchor`（默认）：保持原有generateV3ReportBlob
  4. **邮件范本适配测评类型**：org-admin和super-admin的`handleCopyEmailTemplate`根据`batch.assessment_type`生成不同文案：
    - `combined`：标题"職業錨 × 理想人生卡整合測評"，说明两项测评，时间25-35分钟
    - `life_card`：标题"理想人生卡測評"，说明卡片排序体验，时间10-15分钟
    - `career_anchor`：保持原有职业锚40题文案
  5. **数字胶囊居中修复**：exportReport.ts中两处数字badge移除多余的`position:relative;top:-0.28em`和`top:-0.38em`，让flex的align-items:center自然居中
  6. **代码清理**：org-admin删除无效的life_card分支死代码和未使用的静态import
  涉及文件：`BatchAssessmentParticipantPage.tsx`、`FusionReportV3Page.tsx`、`reportFusionDownload.ts`、`org-admin/BatchAssessmentDetailPage.tsx`、`super-admin/BatchAssessmentDetailPage.tsx`、`exportReport.ts`
- **三项修复：删页面+PDF分页+整合查询** [2026-03-13] — Feature #67:
  1. **删除旧綜合分析報告页面**：移除ComprehensiveReportPage及其路由，整合测评完成后直接跳转到FusionReportV3Page展示完整三章报告。修改IdealCardTestPage、FusionReportV3Page、App.tsx。
  2. **PDF卡片分页修复**：给理想人生卡报告中每张卡片的外层div添加`data-keep-together`属性，防止智能分页切断卡片Banner+四象限+AI说明。
  3. **超管/机构整合测评查询修复**：
    - DDL: `scpc_assessment_results`新增`value_ranking`字段（jsonb）
    - `BatchAssessmentParticipantPage`：整合测评完成理想人生卡后，将value_ranking回写到scpc_assessment_results
    - `useAllFusionReports()`和`useOrgFusionReports()`：从查询空表fusion_analysis_reports改为查询scpc_assessment_results + scpc_assessment_batches（assessment_type='combined'）
  涉及文件：`App.tsx`、`IdealCardTestPage.tsx`、`FusionReportV3Page.tsx`、`exportReport.ts`、`BatchAssessmentParticipantPage.tsx`、`useAdminData.ts`、DDL migration
- **四项修复：整合报告查看/下载+加载指示器+CP点数机构授权** [2026-03-13] — Feature #68:
  1. **整合测评报告查看/下载彻底修复**：旧代码`handleViewFusionReport`通过sessionStorage+页面导航方式打开报告，当`value_ranking`为空时FusionReportV3Page会redirect到首页；旧`handleDownloadFusionPdf`调用`downloadLatestFusionReport(userId)`查询`assessment_results`和`ideal_card_results`表（批次参与者数据在`scpc_assessment_results`中，这两张表无记录→返回false→"数据不足"）。修复：新增`buildFusionReportFromData` useCallback helper，直接用FusionReport对象的`anchor_scores`+`value_ranking`调用`generateCombinedFusionHTML()`生成HTML，查看用`window.open+document.write`，下载用`downloadReportWithCover`，完全绕过错误DB表查询。
  2. **全部报告操作加载状态**：新增`viewingReportId`/`downloadingReportId`状态变量，职业锚/理想人生卡/整合三个标签页的所有查看和下载按钮在操作期间显示Loader2旋转图标并禁用，操作完成后恢复。
  3. **CP点数加入机构功能权限系统**：`useFeaturePermissions.ts`的FEATURE_KEYS新增`"cp_points"`，返回`isCpPointsEnabled`便捷布尔值；`OrganizationsPage.tsx`默认true（超管可关闭）；`OrgTypesPage.tsx`默认false（机构类型模板需手动开启）。
  4. **MainLayout CP菜单门控**：在用户下拉菜单中，CP Wallet和Referral Rewards两个DropdownMenuItem用`{isCpPointsEnabled && (...)}` 条件包裹，超管未授权时不显示。
  涉及文件：`AssessmentReportsView.tsx`、`useFeaturePermissions.ts`、`OrganizationsPage.tsx`、`OrgTypesPage.tsx`、`MainLayout.tsx`
- **整合报告空数据提示改进 + insert显式传入** [2026-03-13]:
  1. **根因分析**：2条历史记录（昕昕、心心）在3月12日完成整合测评，但`value_ranking`列在3月13日才通过DDL添加（DEFAULT '[]'）。参与者完成时列不存在，写入被静默忽略，数据丢失。
  2. **错误提示改进**：从笼统的“缺少理想人生卡数据”改为明确解释原因（数据在数据库字段新增前完成）并建议参与者重新完成理想人生卡部分，toast显示6秒。
  3. **insert显式传入**：`BatchAssessmentParticipantPage`中`scpc_assessment_results`的insert显式包含`value_ranking: []`字段，不再依赖DB默认值。
  涉及文件：`AssessmentReportsView.tsx`、`BatchAssessmentParticipantPage.tsx`
- **三项改进：胶囊偏移+空数据过滤+超管删除报告** [2026-03-13] — Feature #69:
  1. **理想人生卡报告胶囊下移15%**：`exportReport.ts` 的 `generateQuadrantContentSection` 中，分类胶囊和光谱类型胶囊添加 `transform:translateY(15%)`，视觉上将色块向下微调。
  2. **整合测评过滤空数据记录**：`AssessmentReportsView.tsx` 新增 `validFusionReports` 变量，在 `filteredFusion` 之前先过滤掉 `value_ranking` 为空的记录。tab badge 数字也用过滤后的数组。数据被破坏的记录不再出现在整合测评列表中。
  3. **超管删除测评报告**：新增 `Trash2` 图标按钮（仅 `scope === 'super_admin'` 显示），点击弹出 `AlertDialog` 确认对话框，确认后调用 `supabase.from('scpc_assessment_results').delete()` 删除记录，成功后 `invalidateQueries` 刷新数据。新增 `deleteConfirmRecord`/`isDeletingReport` 状态管理。RLS policy `admin_results_all` 已支持 `FOR ALL`（含 DELETE）。
  涉及文件：`exportReport.ts`、`AssessmentReportsView.tsx`
- **四项修复：批次赠点用户选择+胶囊居中+工作台错误+整合报告完整查询+删除兼容** [2026-03-13] — Feature #70:
  1. **批次赠点改为搜索可选用户列表**：`RewardManagementPage.tsx` 移除手动输入 textarea，改为 `allUsersForBatch` 查询所有 profiles，searchable checkbox list (max-h-48)，`batchSelectedUserIds: Set<string>` 状态管理，`toggleBatchUser`/`toggleAllBatchUsers` 回调，`batchMutation` 直接使用 Set 中的 user_ids
  2. **联合报告胶囊向上移动15%**：`exportReport.ts` 的 `generateQuadrantContentSection` 分类胶囊和光谱类型胶囊两处 `transform:translateY(15%)` → `transform:translateY(-15%)`
  3. **工作台CDN缓存错误**：点击「進入工作台」出现404错误为部署后CDN缓存失效正常现象，无需代码修改，刷新页面即可
  4. **整合测评双源查询**：`useAdminData.ts` 的 `useAllFusionReports` 和 `useOrgFusionReports` 完整重写为双源合并：Source 1查 scpc_assessment_batches(combined)→scpc_assessment_results；Source 2查 assessment_results + ideal_card_results 按用户配对（最近时间戳策略），个人条目id前缀 `ind-${anchor.id}`
  5. **删除功能兼容ind-前缀**：`AssessmentReportsView.tsx` `handleDeleteRecord` 检测 `id.startsWith("ind-")`：若是则 `realId=id.slice(4)` 从 `assessment_results` 删除；否则从 `scpc_assessment_results` 删除
  涉及文件：`RewardManagementPage.tsx`、`exportReport.ts`、`useAdminData.ts`、`AssessmentReportsView.tsx`
- **PDF三项修复：胶囊上移20%+分页放松+数字圆圈上移** [2026-03-13] — Feature #71:
  1. **理想人生卡PDF胶囊上移20%**：`exportReport.ts` 的 `generateQuadrantContentSection` 中分类胶囊和光谱类型胶囊两处 `transform:translateY(-15%)` → `transform:translateY(-20%)`
  2. **职业锚PDF分页放松**：`reportV3Generator.ts` 锚点卡片结构重组——banner+强度条保留为不可拆分单元，分区结构解析从banner的keep-together中分离出来，核心诠释框架/锚点解释/风险警告/发展路径四个内容子块均移除 `data-keep-together` 和 `page-break-inside:avoid`，允许像素扫描器在安全行自然分页，消除分区结构解析后的大片空白
  3. **焦点行动推荐数字上移20%**：`reportV3Generator.ts` 的 `renderNumberCircle` 内层span从 `top:-1px` 改为 `transform:translateY(-20%)`
  涉及文件：`exportReport.ts`、`reportV3Generator.ts`
- **CP功能权限全面门控** [2026-03-13] — Feature #72:
机构disable CP功能后，该机构员工仍能看到CP相关内容的BUG修复。之前权限检查仅在MainLayout顶部导航菜单生效，以下位置未做门控：
  1. **HomePage CP区域**：钱包卡片+充值/推荐快捷按钮+角色下拉菜单CP入口，全部添加 `isCpPointsEnabled` 条件判断
  2. **CpWalletPage/RechargePage/ReferralPage**：三个页面添加 `useFeaturePermissions` + `Navigate to="/"` 路由级门控，功能禁用时自动跳转首页
  3. **Mobile ProfilePage**：CP钱包摘要区域添加 `isCpPointsEnabled` 条件判断
  涉及文件：`HomePage.tsx`、`CpWalletPage.tsx`、`RechargePage.tsx`、`ReferralPage.tsx`、`mobile/ProfilePage.tsx`
- **批次报告顶部PDF按钮移除** [2026-03-13] — Feature #73:
批次测评链接完成后显示报告页面，顶部sticky栏的「下載 PDF」按钮移除，只保留底部的下载完整报告按钮
涉及文件：`BatchAssessmentParticipantPage.tsx`
- **整合报告PDF四项修复+批次下载增强** [2026-03-13] — Feature #74:

1. 移除PDF中悬停提示文字（fusionChartGenerator Chart 2 legend）
2. 图表分页保护 — Chart 1/Chart 2 加 data-keep-together 防PDF切割
3. 全系统胶囊居中 — PILL_SIZES/CSS改对称padding、移除translateY偏移、number-circle居中
4. 批次打包下载combined fallback — rankedCards为空但有anchorScores时生成职业锚报告
5. 超管+机构端结果表每行新增单条下载按钮（Eye旁Download图标）

涉及文件：`fusionChartGenerator.ts`、`reportV3Generator.ts`、`reportDesignSystem.ts`、`org-admin/BatchAssessmentDetailPage.tsx`、`super-admin/BatchAssessmentDetailPage.tsx`

- **结果表眼睛UX增强+图表悬停提示修正** [2026-03-13] — Feature #75:

1. 眼睛按钮点击后详情面板自动滚动到可见区域(scrollIntoView)、选中行高亮bg-blue-50、图标切换Eye/EyeOff、面板入场动画
2. Chart 2图例区恢复悬停提示文字，改为繁中「滑鼠移到圓點處，即可查看詳情」，PDF导出时自动剥离(data-screen-only)

涉及文件：`org-admin/BatchAssessmentDetailPage.tsx`、`super-admin/BatchAssessmentDetailPage.tsx`、`fusionChartGenerator.ts`、`exportReport.ts`

- **PDF胶囊/圆圈文字居中修复** [2026-03-13] — Feature #76:

1. renderPill胶囊放大(sm:33→36/md:40→44/lg:48→52)+底部padding 3px将文字上推
2. renderNumberCircle圆圈增加padding-bottom:2px将数字上推
3. 理想人生卡Top3金色圆圈32→36px+padding-bottom:2px
4. 卡片详情rank badge 36→40px+padding-bottom:2px；分类/光谱胶囊移除translateY(-20%)改用inline-flex+非对称padding居中
5. 全系统所有数字圆圈(综合报告/AI解读/融合报告)统一添加padding-bottom:2px
6. reportDesignSystem.ts CSS-class胶囊同步更新(基础+scope lock+mobile响应式)

涉及文件：`reportV3Generator.ts`、`exportReport.ts`、`reportDesignSystem.ts`

- **五项BUG修复** [2026-03-15] — 
  1. **超管value_ranking下载逻辑修复**：`super-admin/BatchAssessmentDetailPage.tsx` 4处(handleBatchDownloadReports combined/life_card + handleSingleDownload combined/life_card)改为先从 `resultItem.value_ranking` 获取数据，为空才 fallback DB查询
  2. **机构HR handleSingleDownload life_card修复**：`org-admin/BatchAssessmentDetailPage.tsx` 同上修复
  3. **邮件模板简体中文支持**：两个管理端文件的 `handleCopyEmailTemplate` 三种测评类型(combined/life_card/career_anchor)均新增 `zh-CN` 分支（原仅 en/zh-TW）
  4. **测评历史页JSX修复**：`HistoryPage.tsx` FusionHistoryTab 中移除多余的 `</div>` 闭合标签（上个session响应式重构遗留），修复 build 错误
  5. 部署成功
  涉及文件：`super-admin/BatchAssessmentDetailPage.tsx`、`org-admin/BatchAssessmentDetailPage.tsx`、`HistoryPage.tsx`
- **四项移动端+分享链接修复** [2026-03-15] —
  1. **移动端报告四区框架图溢出修复**：`reportDesignSystem.ts` 的 `@media (max-width: 767px)` 媒体查询新增覆盖规则——`cpc-level-tag` 从固定 `width:140px` 改为 `width:auto; max-width:90px`(用 `!important` 覆盖内联样式)；`cpc-framework-zone` 新增 `flex-wrap:wrap`；`cpc-report-root` 新增 `overflow-x:hidden; max-width:100%`
  2. **机构管理员仪表盘移动端布局**：`org-admin/DashboardPage.tsx` grid从固定 `grid-cols-4`/`grid-cols-3` 改为响应式 `grid-cols-2 sm:grid-cols-4`/`grid-cols-1 sm:grid-cols-3`；部门进度栏 `col-span-2` 改为 `sm:col-span-2`；部门名称列 `w-24` 改为 `w-16 sm:w-24`
  3. **分享报告链接「報告未找到」修复**：根因是 `scpc_assessment_batches` 表的 RLS 策略 `anon_batches_read_active` 仅允许 anon 读取 `status='active'` 的批次，而 `SharedReportPage` 的 `!inner` join 需要同时读取批次元数据（assessment_type, language），当批次 status 为 completed/closed 时 join 失败返回 null。新增 RLS 策略 `anon_batches_read_for_shared_reports` 允许 anon 读取任何含有 share_token 的批次。另新增冗余策略 `allow_anon_read_shared_results` 于 `scpc_assessment_results`（实际该表已有 `anon_results_select USING(true)`）
  4. **移动端个人页CP钱包入口**：`mobile/ProfilePage.tsx` 新增 CP 钱包菜单项（`Wallet` 图标），通过 `useFeaturePermissions` 的 `isCpPointsEnabled` 动态控制显示
  涉及文件：`reportDesignSystem.ts`、`org-admin/DashboardPage.tsx`、`mobile/ProfilePage.tsx`、2个新 migration 文件
- **全局工作台移动端适配 + PWA优化** [2026-03-15] —
  1. **全局CSS响应式覆盖**：在 `index.css` 添加 `.admin-page-content` 包装类的 `@media (max-width: 767px)` 规则，一次性修复所有管理台页面的移动端布局：`grid-cols-4` → 2列，`grid-cols-3` → 1列，`col-span-2` → span 1，表格横向滚动(`:has(>table)` 设置 `overflow-x:auto` + `min-width:640px`)，搜索筛选栏垂直堆叠，卡片内距紧凑
  2. **布局容器类注入**：在 SuperAdminLayout、OrgAdminLayout、ConsultantLayout、AdminLayout 的 Outlet 包装 div 添加 `admin-page-content` 类，使全局CSS规则自动级联生效
  3. **20+高频页面显式修复**：手动将 `grid-cols-4` 改为 `grid-cols-2 sm:grid-cols-4`，`grid-cols-3` 改为 `grid-cols-1 sm:grid-cols-3`。涉及页面：超管 Dashboard/Organizations/AllUsers/SSO/Roles/CourseLibrary/ConsultantsPage/OrgTypes/MessagesMonitor/CceExport；机构 Assessments/Analytics/CduMonitoring/Departments/Reports/Messages；咨询师 Dashboard/Assessments/Reports/Messages；用户端 MyReports
  4. **机构管理页特殊布局**：OrganizationsPage header 添加 `flex-wrap gap-3`，搜索+筛选栏改为 `flex-col sm:flex-row`，筛选按钮添加 `whitespace-nowrap overflow-x-auto`
  5. **PWA safe-area 优化**：管理台顶栏移动端添加 `pt-[env(safe-area-inset-top)]`，manifest.json 背景色改为 `#f2f4f8` 匹配应用主题
  涉及文件：`index.css`、4个 layout 文件、20+个 page 文件、`manifest.json`
- **非CP授权机构验证码流程修复** [2026-03-15] — 修复桌面端首页 `pendingTargetPath` 状态变量从未声明的关键bug，导致非CP授权机构用户输入验证码通过后无法跳转测评页面。排查确认：CP功能可见性已由 `isCpPointsEnabled`（来自 `useFeaturePermissions` hook）在所有关键位置正确控制（MainLayout侧边栏/首页用户菜单/移动端个人页/钱包页/充值页/推荐页），当机构未授权CP时用户完全看不到CP相关入口；测评入口流程逻辑正确——CP授权机构走CP购买流程、非CP授权机构走验证码验证、无机构个人用户直接进入
- **整合测评批次报告下载修复** [2026-03-15] — 修复整合测评（combined）批次报告下载只生成职业锚报告的关键bug。根因：`scpc_assessment_results` 表 RLS 策略只有匿名 INSERT/SELECT，缺少 UPDATE 策略。整合测评流程分两步：①职业锚完成→INSERT记录（`value_ranking: []`）；②人生卡完成→UPDATE同一记录写入 `value_ranking`。第②步被RLS静默拦截，导致 `value_ranking` 永远为空数组，管理端下载时走进fallback分支只生成职业锚报告，文件名也从 `SCPC-Fusion-Report-` 降级为 `SCPC-Report-`。修复：添加 `anon_results_update` RLS策略 + 参与者页面update错误处理。注意：已有的数据无法恢复，需要重新做测评

**最后更新**：2026-03-15 (整合测评批次报告下载修复)