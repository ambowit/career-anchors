
-- Life Cards: Admin-managed card definitions (70 initial cards)
CREATE TABLE IF NOT EXISTS life_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_zh_cn text NOT NULL,
  name_zh_tw text NOT NULL,
  name_en text NOT NULL,
  short_description_zh_cn text,
  short_description_zh_tw text,
  short_description_en text,
  category text NOT NULL DEFAULT 'general',
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Life Card Text Blocks: Interpretation text managed by super admin
CREATE TABLE IF NOT EXISTS life_card_text_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES life_cards(id) ON DELETE CASCADE,
  core_value_text text NOT NULL DEFAULT '',
  career_tendency_text text NOT NULL DEFAULT '',
  strength_potential_text text NOT NULL DEFAULT '',
  development_advice_text text NOT NULL DEFAULT '',
  risk_warning_text text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'zh-TW',
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fusion Life Card Rules: Combination interpretation for top 3 cards
CREATE TABLE IF NOT EXISTS fusion_life_card_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id_1 uuid NOT NULL REFERENCES life_cards(id),
  card_id_2 uuid NOT NULL REFERENCES life_cards(id),
  card_id_3 uuid NOT NULL REFERENCES life_cards(id),
  combination_text_zh_cn text NOT NULL DEFAULT '',
  combination_text_zh_tw text NOT NULL DEFAULT '',
  combination_text_en text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Life Card User Results: Complete selection path tracking
CREATE TABLE IF NOT EXISTS life_card_user_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  selected_30_ids uuid[] NOT NULL,
  selected_10_ids uuid[] NOT NULL,
  ranking_order jsonb NOT NULL DEFAULT '[]',
  report_generated boolean NOT NULL DEFAULT false,
  report_id uuid,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Partner Sales: Detailed sales records with snapshot data
CREATE TABLE IF NOT EXISTS partner_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES product_partners(id),
  product_id uuid NOT NULL REFERENCES partner_products(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  cp_paid integer NOT NULL,
  partner_income integer NOT NULL,
  platform_income integer NOT NULL,
  revenue_split_snapshot numeric(3,2) NOT NULL,
  user_membership_tier text,
  original_cp_price integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_life_cards_active ON life_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_life_cards_category ON life_cards(category);
CREATE INDEX IF NOT EXISTS idx_lctb_card ON life_card_text_blocks(card_id);
CREATE INDEX IF NOT EXISTS idx_lctb_lang ON life_card_text_blocks(language);
CREATE INDEX IF NOT EXISTS idx_lctb_active ON life_card_text_blocks(is_active);
CREATE INDEX IF NOT EXISTS idx_flcr_cards ON fusion_life_card_rules(card_id_1, card_id_2, card_id_3);
CREATE INDEX IF NOT EXISTS idx_lcur_user ON life_card_user_results(user_id);
CREATE INDEX IF NOT EXISTS idx_lcur_completed ON life_card_user_results(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ps_partner ON partner_sales(partner_id);
CREATE INDEX IF NOT EXISTS idx_ps_product ON partner_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_ps_created ON partner_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ps_user ON partner_sales(user_id);

COMMENT ON TABLE life_cards IS 'Admin-managed ideal life card definitions. Super admin can add/edit/deactivate cards. Initial set: 70 cards.';
COMMENT ON TABLE life_card_text_blocks IS 'Versioned interpretation text for each life card. Includes core value, career tendency, strengths, development advice, and risk warnings. Published versions are locked.';
COMMENT ON TABLE fusion_life_card_rules IS 'Combination interpretation rules for top 3 ranked cards. Matches specific card combinations to provide integrated analysis.';
COMMENT ON TABLE life_card_user_results IS 'Complete selection path tracking for ideal life card assessments: 70→30→10→ranking. Used for analytics, growth tracking, and enterprise group analysis.';
COMMENT ON TABLE partner_sales IS 'Detailed partner sales records with revenue split snapshots. Each transaction records CP paid, partner/platform income, and user membership tier at time of purchase.';
