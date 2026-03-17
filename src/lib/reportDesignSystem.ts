/**
 * CPC Report Design System v2.2 — Layout Contract
 * ========================================================
 * Single Source of Truth for all report rendering (HTML/PDF).
 * Does NOT affect business-side UI components.
 *
 * IRON RULES:
 *   1) Token single source — all colors/fonts/spacing from CPC tokens only.
 *   2) Component class priority — pills/badges/cards/titles MUST use cpc-* classes.
 *   3) CENTERING IRON RULE: html2canvas only supports line-height = height.
 *      ✗ flex + align-items:center  → FAILS in html2canvas
 *      ✗ inline-flex               → FAILS in html2canvas
 *      ✗ inline-grid + place-items  → FAILS in html2canvas
 *      ✗ table-cell                → clips auto-width content
 *      ✓ display:inline-block + height:Npx + line-height:Npx + padding:0 Xpx
 *      Pills use: height + line-height = height + horizontal-only padding.
 *      Circles use: width = height = line-height.
 *   4) All !important ONLY inside .cpc-report-root scope.
 *   5) Bar rows — CSS Grid (180px 1fr 60px), label/track/value strictly aligned.
 *   6) Zone level tags — cpc-level-tag (inline-block + padding centering for 2 lines).
 *   7) Dual/tri anchor hint rows — cpc-dual-hint-row (flex + align-items:center).
 *   8) Semantic classes (.cpc-sem-*) are DUAL OUTPUT: set CSS vars AND direct
 *      background/color/border-color. The .cpc-sem activator MUST appear BEFORE
 *      specific sem-* classes in CSS source order so they win in cascade.
 * ========================================================
 */

// ---------------------------------------------------------------------------
// Web body reset — append after CPC_REPORT_CSS on web pages to neutralise
// the body { max-width:820px } rule that is designed for standalone PDF HTML.
// ---------------------------------------------------------------------------

export const CPC_WEB_BODY_RESET = '\nbody{max-width:none!important;margin:initial!important;padding:initial!important;background:transparent!important;line-height:initial!important;font-size:initial!important;color:initial!important;}';

// ---------------------------------------------------------------------------
// Iron Rules Comment Block (paste at top of each generator)
// ---------------------------------------------------------------------------

export const CPC_IRON_RULES_COMMENT = `/* ========================================================
   CPC REPORT DESIGN SYSTEM v5.0 — LAYOUT CONTRACT (SCOPE LOCK)
   1) Token 单一来源：所有颜色/字号/圆角/间距只能来自 CPC Token。
   2) 组件封装优先：胶囊/徽章/卡片/标题必须使用 cpc-* 类。
   3) 居中铁律：html2canvas 只支持 line-height = height 居中。
      ✗ flex/inline-flex/inline-grid/table-cell 均失效。
      ✓ display:inline-block + height:Npx + line-height:Npx + padding:0 Xpx
   4) 强制排版锁：所有 !important 只允许在 .cpc-report-root 作用域内使用。
   5) 条形图行合约：cpc-bar-row 为 CSS Grid (180px 1fr 60px) !important。
   6) 四区标签合约：cpc-level-tag 为 inline-block + padding 居中。
   7) 双/三锚互动行：容器使用 cpc-dual-hint-row。
   8) 语义类双输出：cpc-sem-* 同时设 CSS 变量和直接属性。
   ======================================================== */`;

// ---------------------------------------------------------------------------
// CPC Report CSS — the complete, embeddable style block
// ---------------------------------------------------------------------------

export const CPC_REPORT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
  /* ========== CPC Report Design System v5.0 ========== */

  /* ---- Tokens ---- */
  :root {
    /* Brand */
    --cpc-primary: #1C2857;
    --cpc-primary-ink: #0F1736;
    --cpc-primary-soft: #E8ECF6;
    --cpc-accent: #4FA37A;
    --cpc-accent-soft: #E7F4ED;
    --cpc-warn: #F6C343;
    --cpc-warn-soft: #FFF4D6;
    --cpc-danger: #E76F51;
    --cpc-danger-soft: #FFE3DD;
    /* Neutral */
    --cpc-page-bg: #FFFFFF;
    --cpc-surface: #FFFFFF;
    --cpc-muted: #F4F6F8;
    --cpc-border: #E6E9EE;
    --cpc-ink: #111827;
    --cpc-subtle: #6B7280;
    /* Typography */
    --cpc-h1: 28px;
    --cpc-h2: 22px;
    --cpc-h3: 18px;
    --cpc-body: 15px;
    --cpc-caption: 13px;
    /* Line heights */
    --cpc-lh-title: 1.2;
    --cpc-lh-body: 1.6;
    --cpc-lh-pill: 1;
    /* Radius */
    --cpc-radius-lg: 20px;
    --cpc-radius-md: 14px;
    --cpc-radius-sm: 10px;
    --cpc-radius-pill: 999px;
    /* Spacing */
    --cpc-gap-section: 40px;
    --cpc-gap-block: 18px;
    --cpc-pad-card: 24px;
    /* Shadow */
    --cpc-shadow-soft: 0 4px 12px rgba(0,0,0,0.06);
  }

  /* ---- Report Root Reset ---- */
  .cpc-report-root,
  .cpc-report-root * {
    box-sizing: border-box;
  }
  .cpc-report-root {
    font-feature-settings: "kern";
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }
  .cpc-report-root span,
  .cpc-report-root strong,
  .cpc-report-root em {
    vertical-align: middle !important;
  }

  /* ---- Base Reset & Typography ---- */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans TC', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei',
                 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 820px;
    margin: 0 auto;
    padding: 0 24px 48px;
    background: var(--cpc-page-bg);
    color: var(--cpc-ink);
    line-height: 1.7;
    font-size: 14px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h2 { page-break-after: avoid; }
  h1, h3 { page-break-after: avoid; break-after: avoid; }
  img { page-break-inside: avoid !important; break-inside: avoid !important; display: block; }
  p { text-align: left; overflow-wrap: break-word; }

  .cpc-h1 { font-size: var(--cpc-h1); font-weight: 800; color: var(--cpc-primary); line-height: var(--cpc-lh-title); letter-spacing: -0.01em; }
  .cpc-h2 { font-size: var(--cpc-h2); font-weight: 800; color: var(--cpc-primary); line-height: var(--cpc-lh-title); }
  .cpc-h3 { font-size: var(--cpc-h3); font-weight: 700; color: var(--cpc-primary-ink); line-height: var(--cpc-lh-title); }
  .cpc-body { font-size: var(--cpc-body); color: var(--cpc-ink); }
  .cpc-caption { font-size: var(--cpc-caption); color: var(--cpc-subtle); }

  /* ---- Card / Block ---- */
  .cpc-card {
    background: var(--cpc-surface);
    border: 1px solid var(--cpc-border);
    border-radius: var(--cpc-radius-md);
    padding: var(--cpc-pad-card);
    box-shadow: var(--cpc-shadow-soft);
  }
  .cpc-card-muted {
    background: var(--cpc-muted);
    border: 1px solid var(--cpc-border);
    border-radius: var(--cpc-radius-md);
    padding: var(--cpc-pad-card);
    margin-bottom: var(--cpc-gap-block);
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .cpc-section { margin-top: var(--cpc-gap-section); }
  .cpc-divider {
    height: 2px;
    background: var(--cpc-primary);
    opacity: 0.25;
    border-radius: 999px;
    margin: 12px 0 0 0;
  }

  /* ============================================================
     PILL / BADGE SYSTEM — Layout Contract v5.0
     IRON RULE: line-height = height for html2canvas/PDF centering.
     flex/inline-flex/table-cell ALL fail in html2canvas.
     - Text MUST be wrapped in <span class="cpc-pill-text">
     ============================================================ */
  .cpc-pill {
    display: inline-block;
    text-align: center;
    vertical-align: middle;
    border-radius: var(--cpc-radius-pill);
    font-weight: 700;
    white-space: nowrap;
    background: var(--cpc-bg, #eee);
    color: var(--cpc-fg, #111);
    border: 1px solid var(--cpc-bd, transparent);
    page-break-inside: avoid;
    break-inside: avoid;
  }
  /* Inner text wrapper — inline, inherits parent line-height */
  .cpc-pill-text {
    display: inline;
    padding: 0;
    margin: 0;
  }
  /* Size tiers — IRON RULE: height + line-height = height + padding:0 Xpx */
  .cpc-pill-sm { height: 36px; line-height: 36px; padding: 0 14px; font-size: 12px; }
  .cpc-pill-md { height: 44px; line-height: 44px; padding: 0 18px; font-size: 13px; }
  .cpc-pill-lg { height: 52px; line-height: 52px; padding: 0 24px; font-size: 15px; }

  /* Semantic colors — override base bg/color directly */
  .cpc-pill-primary { background: var(--cpc-primary-soft); color: var(--cpc-primary); border-color: rgba(28,40,87,0.14); }
  .cpc-pill-accent  { background: var(--cpc-accent-soft);  color: var(--cpc-accent);  border-color: rgba(79,163,122,0.20); }
  .cpc-pill-warn    { background: var(--cpc-warn-soft);    color: #8A5A00;            border-color: rgba(246,195,67,0.35); }
  .cpc-pill-danger  { background: var(--cpc-danger-soft);  color: var(--cpc-danger);  border-color: rgba(231,111,81,0.25); }
  .cpc-pill-muted   { background: var(--cpc-muted);        color: var(--cpc-subtle);  border-color: rgba(230,233,238,1); }

  /* Inverted pills (dark bg, for anchor score chips in framework overview) */
  .cpc-pill-inv-core { background: #1C2857; color: #fff; border-color: transparent; }
  .cpc-pill-inv-high { background: #E67E22; color: #fff; border-color: transparent; }
  .cpc-pill-inv-mid  { background: #F6C343; color: #1C2857; border-color: transparent; }
  .cpc-pill-inv-low  { background: #10B981; color: #fff; border-color: transparent; }

  /* Zone opacity modifiers */
  .cpc-anchor-core { }
  .cpc-anchor-high { }
  .cpc-anchor-mid  { opacity: 0.95; }
  .cpc-anchor-low  { opacity: 0.85; }

  /* ============================================================
     SEMANTIC ZONE CONTRACT
     Each cpc-sem-* sets BOTH CSS variables (for inheritance to children
     like bar-fills) AND direct background/color/border-color properties
     (for html2canvas/PDF rendering engine compatibility).

     CRITICAL CASCADE ORDER:
     .cpc-sem activator MUST appear BEFORE specific .cpc-sem-* classes.
     Same specificity (single class) → later declaration wins.
     When html2canvas fails to resolve var(), the specific class's
     direct background/color/border-color will override .cpc-sem's fallback.
     ============================================================ */

  /* Activator fallback — MUST be FIRST so specific sem-* classes override it */
  .cpc-sem { background: var(--cpc-bg, #eee); color: var(--cpc-fg, #111827); border-color: var(--cpc-bd, transparent); }

  /* Zone semantic — dual output: CSS vars + direct properties */
  .cpc-sem-core      { --cpc-bg: #1C2857; --cpc-fg: #fff; --cpc-bd: #1C2857; background: #1C2857; color: #fff; border-color: #1C2857; }
  .cpc-sem-core-soft { --cpc-bg: #dce4f2; --cpc-fg: #1C2857; --cpc-bd: rgba(28,40,87,0.2); background: #dce4f2; color: #1C2857; border-color: rgba(28,40,87,0.2); }
  .cpc-sem-high      { --cpc-bg: #E67E22; --cpc-fg: #fff; --cpc-bd: #E67E22; background: #E67E22; color: #fff; border-color: #E67E22; }
  .cpc-sem-high-soft { --cpc-bg: #fde8d4; --cpc-fg: #9A4B0A; --cpc-bd: rgba(230,126,34,0.2); background: #fde8d4; color: #9A4B0A; border-color: rgba(230,126,34,0.2); }
  .cpc-sem-mid       { --cpc-bg: #F6C343; --cpc-fg: #1C2857; --cpc-bd: #F6C343; background: #F6C343; color: #1C2857; border-color: #F6C343; }
  .cpc-sem-mid-soft  { --cpc-bg: #fdf3d0; --cpc-fg: #8b6914; --cpc-bd: rgba(246,195,67,0.25); background: #fdf3d0; color: #8b6914; border-color: rgba(246,195,67,0.25); }
  .cpc-sem-low       { --cpc-bg: #10B981; --cpc-fg: #fff; --cpc-bd: #10B981; background: #10B981; color: #fff; border-color: #10B981; }
  .cpc-sem-low-soft  { --cpc-bg: #d1fae5; --cpc-fg: #065F46; --cpc-bd: rgba(16,185,129,0.2); background: #d1fae5; color: #065F46; border-color: rgba(16,185,129,0.2); }

  /* Non-zone semantic categories — dual output */
  .cpc-sem-warn         { --cpc-bg: #fef3c7; --cpc-fg: #92400e; --cpc-bd: rgba(246,195,67,0.35); background: #fef3c7; color: #92400e; border-color: rgba(246,195,67,0.35); }
  .cpc-sem-danger       { --cpc-bg: #fee2e2; --cpc-fg: #991b1b; --cpc-bd: rgba(220,38,38,0.25); background: #fee2e2; color: #991b1b; border-color: rgba(220,38,38,0.25); }
  .cpc-sem-danger-solid { --cpc-bg: #dc2626; --cpc-fg: #fff; --cpc-bd: #dc2626; background: #dc2626; color: #fff; border-color: #dc2626; }
  .cpc-sem-info         { --cpc-bg: #dbeafe; --cpc-fg: #1e40af; --cpc-bd: rgba(37,99,235,0.2); background: #dbeafe; color: #1e40af; border-color: rgba(37,99,235,0.2); }
  .cpc-sem-info-soft    { --cpc-bg: #e0e7ff; --cpc-fg: #3730a3; --cpc-bd: rgba(55,48,163,0.2); background: #e0e7ff; color: #3730a3; border-color: rgba(55,48,163,0.2); }
  .cpc-sem-featured     { --cpc-bg: #7c3aed; --cpc-fg: #fff; --cpc-bd: #7c3aed; background: #7c3aed; color: #fff; border-color: #7c3aed; }
  .cpc-sem-penalty      { --cpc-bg: #ffedd5; --cpc-fg: #9a3412; --cpc-bd: rgba(234,88,12,0.2); background: #ffedd5; color: #9a3412; border-color: rgba(234,88,12,0.2); }

  /* ---- Part Header ---- */
  .cpc-part-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 36px 0 20px 0;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--cpc-primary);
    page-break-after: avoid;
    page-break-inside: avoid;
  }
  .cpc-part-number {
    flex-shrink: 0;
    display: inline-block;
    text-align: center;
    vertical-align: middle;
    min-width: 28px;
    height: 28px;
    line-height: 28px;
    padding: 0 10px;
    background: var(--cpc-primary);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    border-radius: 6px;
    letter-spacing: 0.5px;
    white-space: nowrap;
    font-family: 'Noto Sans TC', 'PingFang TC', 'Montserrat', sans-serif;
  }
  .cpc-part-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--cpc-primary);
  }

  /* ---- Section Header ---- */
  .cpc-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 36px 0 20px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--cpc-border);
    page-break-after: avoid;
  }
  .cpc-section-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--cpc-primary);
    flex-shrink: 0;
  }
  .cpc-section-header-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--cpc-primary);
    line-height: 1;
  }

  /* Compact section header (for sub-sections) */
  .cpc-section-header-compact {
    margin: 28px 0 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--cpc-border);
    page-break-after: avoid;
  }
  .cpc-section-header-compact-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--cpc-primary);
    line-height: 1;
  }

  /* ---- Content Blocks ---- */
  .cpc-section-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #4a5568;
    margin-bottom: 8px;
    margin-top: 16px;
    line-height: 1.4;
    font-weight: 600;
    page-break-after: avoid;
    break-after: avoid;
  }
  .cpc-text-block {
    font-size: 14px;
    line-height: 1.8;
    color: #1e293b;
    white-space: pre-line;
    text-align: left;
    overflow-wrap: break-word;
  }
  /* Reset child element margins to ensure uniform line spacing.
     DB content may contain <p>, <ul>, <ol>, etc. whose default
     margins break the integer-multiple line-height assumption
     used by the pagination text-snap algorithm. */
  .cpc-text-block p,
  .cpc-text-block div,
  .cpc-text-block ul,
  .cpc-text-block ol,
  .cpc-text-block li,
  .cpc-text-block blockquote,
  .cpc-text-block h1, .cpc-text-block h2, .cpc-text-block h3,
  .cpc-text-block h4, .cpc-text-block h5, .cpc-text-block h6 {
    margin: 0;
    padding: 0;
    line-height: inherit;
    font-size: inherit;
  }
  .cpc-text-block ul, .cpc-text-block ol {
    list-style-position: inside;
  }
  .cpc-text-block-light {
    font-size: 14px;
    line-height: 1.8;
    color: rgba(255,255,255,0.9);
    white-space: pre-line;
    text-align: left;
    overflow-wrap: break-word;
  }
  .cpc-text-block-light p,
  .cpc-text-block-light div,
  .cpc-text-block-light ul,
  .cpc-text-block-light ol,
  .cpc-text-block-light li,
  .cpc-text-block-light blockquote {
    margin: 0;
    padding: 0;
    line-height: inherit;
    font-size: inherit;
  }
  .cpc-missing-content {
    padding: 16px;
    background: #fef3c7;
    border: 1px dashed var(--cpc-warn);
    border-radius: 8px;
    font-size: 13px;
    color: #92400e;
    text-align: center;
  }

  /* ---- Theme Cards (risk/dev analysis) ---- */
  .cpc-risk-section {
    padding: var(--cpc-pad-card);
    background: #fef8f0;
    border-radius: var(--cpc-radius-md);
    border: 1px solid #F4A261;
    margin-bottom: var(--cpc-gap-block);
    page-break-inside: avoid;
  }
  .cpc-dev-section {
    padding: var(--cpc-pad-card);
    background: #f0f4ff;
    border-radius: var(--cpc-radius-md);
    border: 1px solid #bfdbfe;
    margin-bottom: var(--cpc-gap-block);
    page-break-inside: avoid;
  }
  .cpc-risk-theme {
    margin-bottom: var(--cpc-gap-block);
    padding: 20px;
    border-left: 4px solid #F4A261;
    background: #fffbf5;
    border-radius: 0 8px 8px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .cpc-dev-theme {
    margin-bottom: var(--cpc-gap-block);
    padding: 20px;
    border-left: 4px solid var(--cpc-primary);
    background: #f0f4ff;
    border-radius: 0 8px 8px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* ---- V3 Report Specifics ---- */
  .cpc-svg-container {
    display: flex;
    justify-content: center;
    margin: 20px 0;
    page-break-inside: avoid;
  }
  .cpc-svg-container svg {
    max-width: 100%;
    height: auto;
  }

  .cpc-framework-overview {
    padding: 20px 24px;
    background: var(--cpc-muted);
    border-radius: var(--cpc-radius-md);
    border: 1px solid var(--cpc-border);
    margin-bottom: 24px;
    page-break-inside: avoid;
  }
  .cpc-framework-zone {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid var(--cpc-border);
    page-break-inside: avoid;
  }
  .cpc-framework-zone:last-child { border-bottom: none; }
  .cpc-zone-label {
    flex-shrink: 0;
    width: 140px;
    font-weight: 700;
    font-size: 13px;
    padding: 10px;
    border-radius: 8px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 1.3;
    page-break-inside: avoid;
  }
  .cpc-zone-anchors {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    flex: 1;
    align-items: center;
    page-break-inside: avoid;
  }

  /* ---- Strength bar (individual anchor cards) ---- */
  .cpc-strength-bar-track {
    height: 8px;
    background: var(--cpc-border);
    border-radius: 4px;
    overflow: hidden;
    margin: 8px 0 14px;
  }
  .cpc-strength-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
    background: var(--cpc-bg, var(--cpc-primary));
  }

  /* ============================================================
     ANCHOR WEIGHT CHART — Locked-column Grid (220px | 1fr | 64px)
     Bar start line MUST be identical across all rows.
     ============================================================ */
  .cpc-anchorRow {
    display: grid;
    grid-template-columns: 220px 1fr 64px;
    align-items: center;
    column-gap: 18px;
    row-gap: 0;
    padding: 12px 0;
  }
  .cpc-anchorLabel {
    width: 220px;
    text-align: right;
    white-space: nowrap;
    font-weight: 700;
    font-size: 13px;
    color: #6B7280;
    line-height: 1;
  }
  .cpc-anchorBarTrack {
    width: 100%;
    height: 18px;
    background: #E9EEF3;
    border-radius: 999px;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
  }
  .cpc-anchorBarFill {
    height: 100%;
    border-radius: 999px;
  }
  .cpc-anchorScore {
    width: 64px;
    text-align: right;
    font-weight: 900;
    font-size: 14px;
    color: #1C2857;
    font-family: 'Montserrat', sans-serif;
    line-height: 1;
  }

  /* ============================================================
     BAR CHART ROW (legacy) — CSS Grid Layout Contract
     grid-template-columns: 170px 1fr 54px (label / track / value)
     Zone class goes on the row; .cpc-bar-fill inherits --cpc-bg.
     ============================================================ */
  .cpc-bar-row {
    display: grid;
    grid-template-columns: 170px 1fr 54px;
    align-items: center;
    gap: 14px;
    padding: 10px 0;
    /* Override cpc-sem activator — row stays transparent */
    background: transparent !important;
    color: inherit !important;
  }
  .cpc-bar-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cpc-subtle, #6B7280);
    white-space: nowrap;
    line-height: 1 !important; /* Override body line-height: 1.7 inheritance */
    height: 18px; /* Match bar track height for pixel-perfect alignment */
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
  .cpc-bar-track {
    height: 18px;
    background: var(--cpc-muted);
    border-radius: 999px;
    overflow: hidden;
    position: relative;
  }
  .cpc-bar-fill {
    height: 100%;
    background: var(--cpc-bg);
    border-radius: 999px;
  }
  .cpc-bar-value {
    text-align: right;
    font-weight: 800;
    font-size: 14px;
    color: var(--cpc-primary);
    font-family: 'Montserrat', sans-serif;
    line-height: 1;
  }

  /* Number circle — IRON RULE: line-height = height for centering */
  .cpc-number-circle {
    width: 38px;
    height: 38px;
    line-height: 38px;
    border-radius: 50%;
    background: var(--cpc-primary);
    color: #fff;
    font-weight: 700;
    font-size: 15px;
    display: inline-block;
    text-align: center;
    vertical-align: middle;
    flex-shrink: 0;
    font-family: 'Montserrat', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .cpc-number-circle-lg {
    width: 36px;
    height: 36px;
    line-height: 36px;
    font-size: 15px;
  }
  .cpc-number-circle-score {
    width: 48px;
    height: 48px;
    line-height: 48px;
    font-size: 18px;
    font-weight: 800;
  }

  /* Page numbers via CSS counter (native browser print/PDF) */
  @page {
    @bottom-center {
      content: counter(page);
      font-size: 10px;
      color: #8b95a5;
      font-family: 'Montserrat', sans-serif;
      padding-top: 8px;
    }
  }

  /* ---- Mobile Responsive ---- */
  @media (max-width: 767px) {
    .cpc-report-root { font-size: 14px !important; overflow-x: hidden !important; max-width: 100% !important; }
    .cpc-part-header { padding: 18px 16px !important; margin: 24px 0 16px !important; }
    .cpc-part-header h2 { font-size: 18px !important; }
    .cpc-section-header, .cpc-section-header-compact { font-size: 15px !important; }
    .cpc-card-muted { padding: 14px !important; }
    .cpc-anchorRow {
      grid-template-columns: 90px 1fr 44px !important;
      column-gap: 8px !important;
      padding: 8px 0 !important;
    }
    .cpc-anchorLabel {
      width: 90px !important;
      min-width: 90px !important;
      max-width: 90px !important;
      font-size: 11px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .cpc-anchorScore {
      width: 44px !important;
      min-width: 44px !important;
      max-width: 44px !important;
      font-size: 13px !important;
    }
    .cpc-anchorBarTrack { height: 14px !important; }
    .cpc-bar-row {
      grid-template-columns: 90px 1fr 44px !important;
      gap: 8px !important;
      padding: 8px 0 !important;
    }
    .cpc-bar-label { font-size: 11px !important; height: 14px !important; }
    .cpc-bar-track { height: 14px !important; }
    .cpc-bar-value { font-size: 12px !important; }
    .cpc-pill.cpc-pill-sm { padding: 9px 8px 10px 8px !important; font-size: 11px !important; }
    .cpc-pill.cpc-pill-md { padding: 10px 10px 12px 10px !important; font-size: 12px !important; }
    .cpc-pill.cpc-pill-lg { padding: 13px 14px 14px 14px !important; font-size: 13px !important; max-width: 100% !important; overflow: hidden !important; text-overflow: ellipsis !important; }
    .cpc-dual-hint-row { gap: 6px !important; flex-wrap: wrap !important; }
    .cpc-level-tag { height: auto !important; min-height: 36px !important; width: auto !important; min-width: 70px !important; max-width: 90px !important; padding: 6px 8px !important; border-radius: 10px !important; font-size: 11px !important; }
    .cpc-framework-overview { padding: 12px !important; overflow: hidden !important; }
    .cpc-framework-zone { flex-wrap: wrap !important; gap: 8px !important; padding: 10px 0 !important; }
    .cpc-zone-anchors { gap: 6px !important; }
    .cpc-zone-label { width: auto !important; min-width: 70px !important; max-width: 90px !important; font-size: 11px !important; padding: 6px 8px !important; }
  }

  /* ---- Print ---- */
  @media print {
    body { padding: 0 12px; font-size: 12px; }
    .cpc-part-header { margin-top: 24px; }
  }

  /* ============================================================
     CPC REPORT SCOPE LOCK — Force Overrides (only inside report)
     Prevents Tailwind / component defaults from breaking layout.
     ============================================================ */
  .cpc-report-root * { box-sizing: border-box !important; }

  /* ---- PILL: scope lock — IRON RULE: line-height = height ---- */
  .cpc-report-root .cpc-pill {
    display: inline-block !important;
    text-align: center !important;
    vertical-align: middle !important;
    border-radius: 999px !important;
    font-weight: 800 !important;
    white-space: nowrap !important;
    -webkit-font-smoothing: antialiased !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .cpc-report-root .cpc-pill .cpc-pill-text {
    display: inline !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  /* Size tiers — IRON RULE: height + line-height = height + horizontal-only padding */
  .cpc-report-root .cpc-pill.cpc-pill-sm { height: 36px !important; line-height: 36px !important; padding: 0 14px !important; font-size: 12px !important; }
  .cpc-report-root .cpc-pill.cpc-pill-md { height: 44px !important; line-height: 44px !important; padding: 0 18px !important; font-size: 13px !important; }
  .cpc-report-root .cpc-pill.cpc-pill-lg { height: 52px !important; line-height: 52px !important; padding: 0 24px !important; font-size: 15px !important; }

  /* ---- DUAL-ANCHOR HINT ROW: pills + × on one line, no clip ---- */
  .cpc-report-root .cpc-dual-hint-row {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  /* ---- BAR CHART: strict 3-column grid per row ---- */
  /* ---- ANCHOR WEIGHT CHART: scope lock (fixed column grid) ---- */
  .cpc-report-root .cpc-anchorRow {
    display: grid !important;
    grid-template-columns: 220px 1fr 64px !important;
    align-items: center !important;
    column-gap: 18px !important;
    row-gap: 0 !important;
    padding: 12px 0 !important;
  }
  .cpc-report-root .cpc-anchorLabel {
    width: 220px !important;
    min-width: 220px !important;
    max-width: 220px !important;
    text-align: right !important;
    white-space: nowrap !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    color: #6B7280 !important;
    line-height: 1 !important;
  }
  .cpc-report-root .cpc-anchorBarTrack {
    width: 100% !important;
    height: 18px !important;
    background: #E9EEF3 !important;
    border-radius: 999px !important;
    overflow: hidden !important;
    position: relative !important;
    display: flex !important;
    align-items: center !important;
  }
  .cpc-report-root .cpc-anchorBarFill {
    height: 100% !important;
    border-radius: 999px !important;
  }
  .cpc-report-root .cpc-anchorScore {
    width: 64px !important;
    min-width: 64px !important;
    max-width: 64px !important;
    text-align: right !important;
    font-weight: 900 !important;
    font-size: 14px !important;
    color: #1C2857 !important;
    font-family: 'Montserrat', sans-serif !important;
    line-height: 1 !important;
  }

  /* ---- BAR CHART ROW (legacy): scope lock ---- */
  .cpc-report-root .cpc-bar-row {
    display: grid !important;
    grid-template-columns: 180px 1fr 60px !important;
    align-items: center !important;
    gap: 16px !important;
    padding: 10px 0 !important;
  }
  .cpc-report-root .cpc-bar-label {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    white-space: nowrap !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    height: 18px !important;
  }
  .cpc-report-root .cpc-bar-track {
    height: 18px !important;
    border-radius: 999px !important;
    overflow: hidden !important;
  }
  .cpc-report-root .cpc-bar-fill {
    height: 100% !important;
    border-radius: 999px !important;
  }
  .cpc-report-root .cpc-bar-value {
    text-align: right !important;
    font-weight: 800 !important;
  }

  /* ---- LEVEL TAG: zone labels in framework chart (two-line) ---- */
  /* Two lines of text ~30px total; 48px height → 9px top/bottom padding centers content */
  .cpc-report-root .cpc-level-tag {
    display: inline-block !important;
    text-align: center !important;
    vertical-align: middle !important;
    height: 48px !important;
    padding: 9px 18px !important;
    border-radius: 14px !important;
    line-height: 1.15 !important;
  }
  .cpc-report-root .cpc-level-tag .t1 { display: block !important; font-weight: 800 !important; }
  .cpc-report-root .cpc-level-tag .t2 { display: block !important; opacity: .75 !important; font-weight: 700 !important; }
`;

// ---------------------------------------------------------------------------
// Zone → CPC class helpers
// ---------------------------------------------------------------------------

/** Returns semantic pill class for anchor score zone (light bg) */
export function getZonePillClass(score: number): string {
  if (score >= 80) return "cpc-pill-primary cpc-anchor-core";
  if (score >= 65) return "cpc-pill-warn cpc-anchor-high";
  if (score >= 45) return "cpc-pill-muted cpc-anchor-mid";
  return "cpc-pill-muted cpc-anchor-low";
}

/** Returns inverted pill class for anchor chips (dark bg, used in framework overview) */
export function getZoneInvertedPillClass(score: number): string {
  if (score >= 80) return "cpc-pill-inv-core cpc-anchor-core";
  if (score >= 65) return "cpc-pill-inv-high cpc-anchor-high";
  if (score >= 45) return "cpc-pill-inv-mid cpc-anchor-mid";
  return "cpc-pill-inv-low cpc-anchor-low";
}

/** Semantic zone class — solid (dark bg, light text) for anchor chips & bar fills */
export function getZoneSemClass(score: number): string {
  if (score >= 80) return "cpc-sem-core";
  if (score >= 65) return "cpc-sem-high";
  if (score >= 45) return "cpc-sem-mid";
  return "cpc-sem-low";
}

/** Semantic zone class — soft (light bg, dark text) for zone labels & role badges */
export function getZoneSemSoftClass(score: number): string {
  if (score >= 80) return "cpc-sem-core-soft";
  if (score >= 65) return "cpc-sem-high-soft";
  if (score >= 45) return "cpc-sem-mid-soft";
  return "cpc-sem-low-soft";
}

/** Zone banner gradient for anchor card headers (dark gradient bg) */
export function getZoneBannerGradient(score: number): string {
  if (score >= 80) return "linear-gradient(135deg, #1C2857 0%, #2a3d6e 100%)";
  if (score >= 65) return "linear-gradient(135deg, #C0600A 0%, #E67E22 100%)";
  if (score >= 45) return "linear-gradient(135deg, #9A4B0A 0%, #D4A72C 100%)";
  return "linear-gradient(135deg, #0D9668 0%, #10B981 100%)";
}

/** Zone colors object (for inline style fallbacks where classes can't reach) */
export function getZoneColors(score: number) {
  if (score >= 80) return { bg: "#dce4f2", border: "#1C2857", text: "#1C2857", barFill: "#1C2857", roleLabel: "#1C2857", roleBg: "#dce4f2" };
  if (score >= 65) return { bg: "#fde8d4", border: "#E67E22", text: "#9A4B0A", barFill: "#E67E22", roleLabel: "#9A4B0A", roleBg: "#fde8d4" };
  if (score >= 45) return { bg: "#fdf3d0", border: "#F6C343", text: "#8b6914", barFill: "#F6C343", roleLabel: "#8b6914", roleBg: "#fdf3d0" };
  return { bg: "#d1fae5", border: "#10B981", text: "#065F46", barFill: "#10B981", roleLabel: "#065F46", roleBg: "#d1fae5" };
}

/** Alignment level color palette */
export function getAlignmentColors(level: "high" | "moderate" | "low") {
  if (level === "high")     return { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" };
  if (level === "moderate") return { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
  return                           { color: "#ca8a04", bg: "#fefce8", border: "#fde68a" };
}

/** Metric color for fusion V3 sections */
export function getMetricColor(value: number, isPositive: boolean) {
  const effectiveValue = isPositive ? value : 100 - value;
  if (effectiveValue >= 75) return { accent: "#059669", bg: "#ecfdf5", border: "#a7f3d0" };
  if (effectiveValue >= 50) return { accent: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
  if (effectiveValue >= 25) return { accent: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  return                          { accent: "#dc2626", bg: "#fef2f2", border: "#fca5a5" };
}

/** Severity style for risk warnings */
export function getSeverityStyle(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical": return { bg: "#fef2f2", border: "#fca5a5", accent: "#dc2626", label: "#dc2626", labelBg: "#fee2e2", icon: "\u26A0\uFE0F" };
    case "high":     return { bg: "#fffbeb", border: "#fde68a", accent: "#d97706", label: "#92400e", labelBg: "#fef3c7", icon: "\u26A0\uFE0F" };
    case "moderate": return { bg: "#eff6ff", border: "#bfdbfe", accent: "#2563eb", label: "#1e40af", labelBg: "#dbeafe", icon: "\u2139\uFE0F" };
    default:         return { bg: "#f0fdf4", border: "#bbf7d0", accent: "#16a34a", label: "#166534", labelBg: "#dcfce7", icon: "\u2705" };
  }
}

// ---------------------------------------------------------------------------
// HTML helpers that use CPC classes
// ---------------------------------------------------------------------------

/** Render a CPC part header */
export function cpcPartHeader(numberText: string, title: string): string {
  return `
    <div class="cpc-part-header">
      <span class="cpc-part-number">\${numberText}</span>
      <span class="cpc-part-title">\${title}</span>
    </div>`;
}

/** Render a CPC section header (dot + title) */
export function cpcSectionHeader(title: string): string {
  return `
    <div class="cpc-section-header">
      <div class="cpc-section-dot"></div>
      <span class="cpc-section-header-title">\${title}</span>
    </div>`;
}

/** Render a compact section header (title only, 1px border) */
export function cpcCompactSectionHeader(title: string): string {
  return `
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">\${title}</span>
    </div>`;
}

/** Page break marker for smart pagination */
export const CPC_PAGE_BREAK = '<div data-page-break style="height:0;overflow:hidden;"></div>';
