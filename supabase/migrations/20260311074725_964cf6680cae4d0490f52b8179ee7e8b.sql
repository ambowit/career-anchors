
-- ================================================
-- 理想人生卡報告生成器 — 數據庫架構升級
-- ================================================

-- 1. life_cards 新增 spectrum_type + content_locked 字段
ALTER TABLE life_cards
  ADD COLUMN IF NOT EXISTS spectrum_type TEXT NOT NULL DEFAULT 'neutral'
    CHECK (spectrum_type IN ('career', 'neutral', 'lifestyle')),
  ADD COLUMN IF NOT EXISTS content_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_by UUID,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS version_no INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_life_cards_spectrum ON life_cards (spectrum_type);

-- 2. 四象限內容表 — 每張卡 × 每語言一行
CREATE TABLE IF NOT EXISTS life_card_quadrant_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES life_cards(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('zh-TW', 'zh-CN', 'en')),
  quadrant_external TEXT NOT NULL DEFAULT '',
  quadrant_internal TEXT NOT NULL DEFAULT '',
  quadrant_career TEXT NOT NULL DEFAULT '',
  quadrant_relationship TEXT NOT NULL DEFAULT '',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_by UUID,
  locked_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(card_id, language)
);

CREATE INDEX IF NOT EXISTS idx_lcqc_card ON life_card_quadrant_contents (card_id);
CREATE INDEX IF NOT EXISTS idx_lcqc_lang ON life_card_quadrant_contents (language);
CREATE INDEX IF NOT EXISTS idx_lcqc_locked ON life_card_quadrant_contents (is_locked);

-- 3. 審計日誌表
CREATE TABLE IF NOT EXISTS life_card_content_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES life_cards(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'edit', 'lock', 'unlock', 'ai_generate', 'spectrum_change')),
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  language TEXT,
  performed_by UUID,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lccal_card ON life_card_content_audit_logs (card_id);
CREATE INDEX IF NOT EXISTS idx_lccal_action ON life_card_content_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_lccal_time ON life_card_content_audit_logs (performed_at DESC);

COMMENT ON TABLE life_card_quadrant_contents IS 'Four-quadrant content for each ideal life card in 3 languages (zh-TW, zh-CN, en). Each quadrant: external perception, internal thinking, career attitude, relationship behavior. Locked content used for formal reports.';
COMMENT ON TABLE life_card_content_audit_logs IS 'Audit trail for all life card content changes: edits, locks, unlocks, AI translations, spectrum type changes.';
