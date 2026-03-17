// Anonymous Assessment Center — Mock Data
// Supports SCPC Career Anchor, Life Card, and Fusion assessments

export type BatchStatus = "draft" | "active" | "completed" | "report_generated" | "closed";
export type LinkStatus = "unused" | "in_progress" | "completed" | "disabled";
export type AssessmentType = "career_anchor" | "life_card" | "fusion";

export interface AnonymousBatch {
  id: string;
  batchName: string;
  description: string;
  assessmentType: AssessmentType;
  totalLinks: number;
  completedCount: number;
  inProgressCount: number;
  status: BatchStatus;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  allowReportReopen: boolean;
  optionalIdentityEnabled: boolean;
  reportVisibility: "personal_only" | "personal_and_benchmark";
  language: string;
  instructions: string;
}

export interface AnonymousLink {
  id: string;
  batchId: string;
  token: string;
  status: LinkStatus;
  startedAt: string | null;
  completedAt: string | null;
  lastOpenedAt: string | null;
  reportId: string | null;
}

export interface BatchReport {
  id: string;
  batchId: string;
  generatedAt: string;
  totalParticipants: number;
  completionRate: number;
  dominantAnchors: string[];
  riskSignals: string[];
  aiInsights: string[];
  recommendations: string[];
}

export interface PermissionRole {
  roleId: string;
  roleName: string;
  roleNameZh: string;
  permissions: {
    createBatch: boolean;
    generateLinks: boolean;
    viewProgress: boolean;
    generateReport: boolean;
    exportLinks: boolean;
    exportReports: boolean;
    closeBatch: boolean;
  };
}

// ─── Assessment Type Labels ────────────────────────
export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, { en: string; zhTw: string; zhCn: string }> = {
  career_anchor: { en: "SCPC Career Anchor", zhTw: "SCPC 職業錨測評", zhCn: "SCPC 职业锚测评" },
  life_card: { en: "Espresso Card Assessment", zhTw: "人生卡測評", zhCn: "人生卡测评" },
  fusion: { en: "Integration Assessment", zhTw: "整合測評", zhCn: "整合测评" },
};

export const BATCH_STATUS_LABELS: Record<BatchStatus, { en: string; zhTw: string; zhCn: string; color: string }> = {
  draft: { en: "Draft", zhTw: "草稿", zhCn: "草稿", color: "bg-slate-100 text-slate-600 border-slate-200" },
  active: { en: "Active", zhTw: "進行中", zhCn: "进行中", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed: { en: "Completed", zhTw: "已完成", zhCn: "已完成", color: "bg-blue-50 text-blue-700 border-blue-200" },
  report_generated: { en: "Report Generated", zhTw: "已生成報告", zhCn: "已生成报告", color: "bg-violet-50 text-violet-700 border-violet-200" },
  closed: { en: "Closed", zhTw: "已關閉", zhCn: "已关闭", color: "bg-red-50 text-red-600 border-red-200" },
};

export const LINK_STATUS_LABELS: Record<LinkStatus, { en: string; zhTw: string; zhCn: string; color: string }> = {
  unused: { en: "Unused", zhTw: "未使用", zhCn: "未使用", color: "bg-slate-100 text-slate-500" },
  in_progress: { en: "In Progress", zhTw: "進行中", zhCn: "进行中", color: "bg-amber-50 text-amber-700" },
  completed: { en: "Completed", zhTw: "已完成", zhCn: "已完成", color: "bg-emerald-50 text-emerald-700" },
  disabled: { en: "Disabled", zhTw: "已停用", zhCn: "已停用", color: "bg-red-50 text-red-500" },
};

// ─── Mock Batches ──────────────────────────────────
export const MOCK_BATCHES: AnonymousBatch[] = [
  {
    id: "batch-001",
    batchName: "2026 Q1 全員職業錨普測",
    description: "針對全公司員工進行匿名職業錨測評，了解團隊整體職業價值觀分布",
    assessmentType: "career_anchor",
    totalLinks: 120,
    completedCount: 98,
    inProgressCount: 7,
    status: "report_generated",
    createdBy: "張明華",
    createdAt: "2026-01-15T09:00:00Z",
    expiresAt: "2026-03-31T23:59:59Z",
    allowReportReopen: true,
    optionalIdentityEnabled: false,
    reportVisibility: "personal_and_benchmark",
    language: "zh-TW",
    instructions: "請在安靜的環境下完成測評，預計需要 15-20 分鐘。所有回答均為匿名，請真實作答。",
  },
  {
    id: "batch-002",
    batchName: "研發部門人生卡團體測評",
    description: "了解研發團隊核心價值觀分布，為團隊建設提供參考",
    assessmentType: "life_card",
    totalLinks: 45,
    completedCount: 45,
    inProgressCount: 0,
    status: "completed",
    createdBy: "李佳琪",
    createdAt: "2026-02-01T10:30:00Z",
    expiresAt: "2026-02-28T23:59:59Z",
    allowReportReopen: true,
    optionalIdentityEnabled: false,
    reportVisibility: "personal_only",
    language: "zh-TW",
    instructions: "人生卡測評約 10 分鐘，請根據直覺選擇最接近您價值觀的卡片。",
  },
  {
    id: "batch-003",
    batchName: "管理層整合測評 — 領導力發展",
    description: "針對中高層管理者進行整合測評，分析領導力結構與組織適配度",
    assessmentType: "fusion",
    totalLinks: 25,
    completedCount: 18,
    inProgressCount: 3,
    status: "active",
    createdBy: "王建國",
    createdAt: "2026-02-20T14:00:00Z",
    expiresAt: "2026-04-15T23:59:59Z",
    allowReportReopen: true,
    optionalIdentityEnabled: true,
    reportVisibility: "personal_and_benchmark",
    language: "zh-TW",
    instructions: "本測評結合職業錨與人生卡，完整評估需約 30 分鐘。可選填姓名以便後續一對一回饋。",
  },
  {
    id: "batch-004",
    batchName: "新員工入職職業錨測評",
    description: "新進人員到職第一週進行匿名測評",
    assessmentType: "career_anchor",
    totalLinks: 30,
    completedCount: 12,
    inProgressCount: 5,
    status: "active",
    createdBy: "張明華",
    createdAt: "2026-03-01T08:00:00Z",
    expiresAt: "2026-03-31T23:59:59Z",
    allowReportReopen: true,
    optionalIdentityEnabled: false,
    reportVisibility: "personal_only",
    language: "zh-TW",
    instructions: "歡迎加入！請在本週內完成此匿名測評，幫助我們更好地了解新團隊成員的職業傾向。",
  },
  {
    id: "batch-005",
    batchName: "客戶企業 — 永豐金控外部施測",
    description: "為合作客戶永豐金控進行的外部匿名批次施測",
    assessmentType: "career_anchor",
    totalLinks: 200,
    completedCount: 0,
    inProgressCount: 0,
    status: "draft",
    createdBy: "李佳琪",
    createdAt: "2026-03-05T11:00:00Z",
    expiresAt: null,
    allowReportReopen: true,
    optionalIdentityEnabled: false,
    reportVisibility: "personal_and_benchmark",
    language: "zh-TW",
    instructions: "",
  },
  {
    id: "batch-006",
    batchName: "2025 Q4 跨部門人生卡",
    description: "季度跨部門團隊活動配套測評",
    assessmentType: "life_card",
    totalLinks: 80,
    completedCount: 76,
    inProgressCount: 0,
    status: "closed",
    createdBy: "王建國",
    createdAt: "2025-10-01T09:00:00Z",
    expiresAt: "2025-12-31T23:59:59Z",
    allowReportReopen: false,
    optionalIdentityEnabled: false,
    reportVisibility: "personal_only",
    language: "zh-TW",
    instructions: "",
  },
];

// ─── Mock Links (for batch-001) ────────────────────
function generateMockLinks(batchId: string, total: number, completed: number, inProgress: number): AnonymousLink[] {
  const links: AnonymousLink[] = [];
  for (let index = 0; index < total; index++) {
    const token = `${batchId}-${String(index + 1).padStart(4, "0")}`;
    let status: LinkStatus = "unused";
    let startedAt: string | null = null;
    let completedAt: string | null = null;
    let lastOpenedAt: string | null = null;

    if (index < completed) {
      status = "completed";
      startedAt = `2026-01-${String(16 + Math.floor(index / 10)).padStart(2, "0")}T${String(9 + (index % 8)).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}:00Z`;
      completedAt = `2026-01-${String(16 + Math.floor(index / 10)).padStart(2, "0")}T${String(10 + (index % 6)).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}:00Z`;
      lastOpenedAt = completedAt;
    } else if (index < completed + inProgress) {
      status = "in_progress";
      startedAt = `2026-03-05T${String(9 + (index % 8)).padStart(2, "0")}:00:00Z`;
      lastOpenedAt = startedAt;
    }

    links.push({
      id: `link-${batchId}-${index + 1}`,
      batchId,
      token,
      status,
      startedAt,
      completedAt,
      lastOpenedAt,
      reportId: status === "completed" ? `report-${batchId}-${index + 1}` : null,
    });
  }
  return links;
}

export const MOCK_LINKS_BATCH_001 = generateMockLinks("batch-001", 120, 98, 7);
export const MOCK_LINKS_BATCH_003 = generateMockLinks("batch-003", 25, 18, 3);
export const MOCK_LINKS_BATCH_004 = generateMockLinks("batch-004", 30, 12, 5);

// ─── Mock Anchor Distribution (for batch reports) ───
export const MOCK_ANCHOR_DISTRIBUTION = {
  labels: ["TF", "GM", "AU", "SE", "EC", "SV", "CH", "LS"],
  labelsFull: {
    en: ["Technical", "General Mgmt", "Autonomy", "Security", "Entrepreneurial", "Service", "Challenge", "Lifestyle"],
    zhTw: ["技術能力", "管理能力", "自主獨立", "安全穩定", "創業創造", "服務奉獻", "純粹挑戰", "生活型態"],
  },
  primaryCounts: [18, 12, 15, 22, 8, 6, 11, 6],
  averageScores: [72, 65, 68, 78, 55, 48, 62, 52],
};

export const MOCK_DAILY_COMPLETIONS = [
  { date: "01/16", count: 8 },
  { date: "01/17", count: 12 },
  { date: "01/18", count: 15 },
  { date: "01/19", count: 6 },
  { date: "01/20", count: 18 },
  { date: "01/21", count: 14 },
  { date: "01/22", count: 10 },
  { date: "01/23", count: 8 },
  { date: "01/24", count: 5 },
  { date: "01/25", count: 2 },
];

export const MOCK_VALUE_CLUSTERS = [
  { value: "自主與自由", count: 32, percentage: 33 },
  { value: "創新與突破", count: 25, percentage: 26 },
  { value: "穩定與安全", count: 18, percentage: 18 },
  { value: "服務與貢獻", count: 12, percentage: 12 },
  { value: "成就與挑戰", count: 11, percentage: 11 },
];

export const MOCK_FUSION_ALIGNMENT = [
  { range: "0-20", count: 2, label: "Low" },
  { range: "21-40", count: 3, label: "Below Average" },
  { range: "41-60", count: 5, label: "Average" },
  { range: "61-80", count: 6, label: "Above Average" },
  { range: "81-100", count: 2, label: "High" },
];

// ─── Mock Report AI Insights ───────────────────────
export const MOCK_AI_INSIGHTS_CAREER = [
  "本批次呈現顯著的安全穩定型（SE）集中趨勢，佔比 22.4%，這表明團隊整體傾向於追求結構化和可預測的工作環境。這在穩定運營期是優勢，但在需要快速轉型時可能形成組織慣性。",
  "技術能力型（TF）與自主獨立型（AU）合計佔比達 33.7%，顯示團隊有相當比例的專業導向人才。建議在職涯發展路徑中強化雙軌制（專家路線 vs 管理路線），以留住這些高專業度人才。",
  "創業創造型（EC）僅佔 8.2%，在創新驅動型產業中屬於偏低水準。若組織正在推動數位轉型或新業務開發，建議優先在此維度招募或培養人才。",
  "純粹挑戰型（CH）分布（11.2%）集中於 25-35 歲年齡段，顯示年輕員工具有較強的突破導向。這是推動組織變革的潛在動力源，但也需要妥善的挑戰機會設計，否則流動風險較高。",
];

export const MOCK_AI_INSIGHTS_LIFE_CARD = [
  "價值觀聚類分析顯示「自主與自由」是團隊最強烈的共同動機，這與研發團隊的特質高度吻合。建議在管理方式上保持彈性工作制和自主決策空間。",
  "「創新與突破」作為第二大價值聚類，與組織的技術創新目標高度契合。然而「穩定與安全」的第三位排名暗示部分成員可能在創新壓力下感受到張力。",
  "服務與貢獻意識相對較低（12%），建議在團隊活動中融入社會影響力元素，培養更廣泛的使命感。",
];

export const MOCK_AI_INSIGHTS_FUSION = [
  "整合分析顯示整體適配度呈常態分布，但有兩個明顯的極端群組：高適配（81-100分）的 2 人和低適配（0-20分）的 2 人。建議對低適配個體進行個別關注。",
  "張力指數分析揭示管理層在「控制 vs 賦能」維度上存在顯著分歧，這可能導致跨部門協作時的風格衝突。建議進行領導力對話工作坊。",
];

// ─── Mock Recommendations ──────────────────────────
export const MOCK_RECOMMENDATIONS = [
  {
    category: "人才部署",
    categoryEn: "Talent Deployment",
    items: [
      "基於 SE 型集中趨勢，建議在變革專案中刻意配置 EC 和 CH 型人才作為核心推動者",
      "TF 型人才應被賦予技術決策權和專業成長路徑，避免過早推向管理崗位",
    ],
  },
  {
    category: "領導力發展",
    categoryEn: "Leadership Development",
    items: [
      "GM 型人才（12.2%）是未來管理梯隊的自然候選人，建議優先納入領導力培訓計畫",
      "SV 型人才雖然佔比較低，但在組織文化建設和團隊凝聚力方面具有不可替代的價值",
    ],
  },
  {
    category: "風險緩解",
    categoryEn: "Risk Mitigation",
    items: [
      "CH 型年輕員工的高流動風險需要透過具有挑戰性的專案安排和快速成長機會來化解",
      "EC 型人才不足是組織創新能力的潛在瓶頸，建議在下一輪招聘中提高此維度的篩選權重",
    ],
  },
];

// ─── Permission Roles ──────────────────────────────
export const MOCK_PERMISSION_ROLES: PermissionRole[] = [
  {
    roleId: "super_admin",
    roleName: "Super Admin",
    roleNameZh: "超級管理員",
    permissions: { createBatch: true, generateLinks: true, viewProgress: true, generateReport: true, exportLinks: true, exportReports: true, closeBatch: true },
  },
  {
    roleId: "enterprise_admin",
    roleName: "Enterprise Admin",
    roleNameZh: "企業管理員",
    permissions: { createBatch: true, generateLinks: true, viewProgress: true, generateReport: true, exportLinks: true, exportReports: true, closeBatch: true },
  },
  {
    roleId: "hr_admin",
    roleName: "HR Admin",
    roleNameZh: "人資管理員",
    permissions: { createBatch: true, generateLinks: true, viewProgress: true, generateReport: true, exportLinks: true, exportReports: false, closeBatch: false },
  },
  {
    roleId: "assessment_admin",
    roleName: "Assessment Admin",
    roleNameZh: "測評管理員",
    permissions: { createBatch: true, generateLinks: true, viewProgress: true, generateReport: false, exportLinks: true, exportReports: false, closeBatch: false },
  },
  {
    roleId: "viewer",
    roleName: "Read-only Viewer",
    roleNameZh: "唯讀檢視者",
    permissions: { createBatch: false, generateLinks: false, viewProgress: true, generateReport: false, exportLinks: false, exportReports: false, closeBatch: false },
  },
];

// ─── Helper: get batch links by id ─────────────────
export function getMockLinksForBatch(batchId: string): AnonymousLink[] {
  switch (batchId) {
    case "batch-001": return MOCK_LINKS_BATCH_001;
    case "batch-003": return MOCK_LINKS_BATCH_003;
    case "batch-004": return MOCK_LINKS_BATCH_004;
    default: return generateMockLinks(batchId, 20, 8, 3);
  }
}
