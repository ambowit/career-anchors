/**
 * Report Download Progress Store
 *
 * A minimal reactive store that tracks PDF generation progress.
 * Any component can subscribe to progress updates via useSyncExternalStore.
 * The export functions in exportReport.ts emit updates to this store.
 */

export interface ReportProgress {
  /** Whether a download is currently in progress */
  active: boolean;
  /** 0-100 progress percentage */
  percent: number;
  /** Human-readable step label (will be displayed to user) */
  stepLabel: string;
}

type Listener = () => void;

const listeners = new Set<Listener>();

let currentProgress: ReportProgress = {
  active: false,
  percent: 0,
  stepLabel: "",
};

function emitChange() {
  // Create new object reference so useSyncExternalStore detects the change
  currentProgress = { ...currentProgress };
  listeners.forEach((listener) => listener());
}

// ── Public API (called from export functions) ──

export function reportProgressStart(stepLabel: string) {
  currentProgress.active = true;
  currentProgress.percent = 0;
  currentProgress.stepLabel = stepLabel;
  emitChange();
}

export function reportProgressUpdate(percent: number, stepLabel: string) {
  currentProgress.percent = Math.min(100, Math.max(0, percent));
  currentProgress.stepLabel = stepLabel;
  emitChange();
}

export function reportProgressEnd() {
  currentProgress.active = false;
  currentProgress.percent = 100;
  currentProgress.stepLabel = "";
  emitChange();
}

// ── Step label translations ──

const STEP_LABELS: Record<string, Record<string, string>> = {
  loading: { en: "Loading PDF engine…", "zh-TW": "正在載入 PDF 引擎…", "zh-CN": "正在载入 PDF 引擎…" },
  fonts: { en: "Loading fonts…", "zh-TW": "正在載入字體…", "zh-CN": "正在载入字体…" },
  rendering: { en: "Rendering report…", "zh-TW": "正在渲染報告…", "zh-CN": "正在渲染报告…" },
  analyzing: { en: "Analyzing layout…", "zh-TW": "正在分析排版…", "zh-CN": "正在分析排版…" },
  paginating: { en: "Generating pages…", "zh-TW": "正在生成頁面…", "zh-CN": "正在生成页面…" },
  saving: { en: "Saving PDF…", "zh-TW": "正在儲存 PDF…", "zh-CN": "正在储存 PDF…" },
  generating: { en: "Generating report content…", "zh-TW": "正在生成報告內容…", "zh-CN": "正在生成报告内容…" },
};

/**
 * Get a translated step label. Falls back to the key if not found.
 * @param stepKey - one of the keys in STEP_LABELS
 * @param language - "en" | "zh-TW" | "zh-CN"
 */
export function getStepLabel(stepKey: string, language: string): string {
  return STEP_LABELS[stepKey]?.[language] || STEP_LABELS[stepKey]?.en || stepKey;
}

// ── React integration (useSyncExternalStore compatible) ──

export function subscribeReportProgress(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getReportProgressSnapshot(): ReportProgress {
  return currentProgress;
}
