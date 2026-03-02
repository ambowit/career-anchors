
-- ============================================================
-- SCPC V3.1: Career Points (CP) Commercial System - Core Tables
-- ============================================================

-- 1. CP Wallets - One per user, summary balances by CP type
-- Enforces: CP cannot be negative (CHECK constraints)
CREATE TABLE cp_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance_paid numeric(12,2) NOT NULL DEFAULT 0 CHECK (balance_paid >= 0),
  balance_recharge_bonus numeric(12,2) NOT NULL DEFAULT 0 CHECK (balance_recharge_bonus >= 0),
  balance_activity numeric(12,2) NOT NULL DEFAULT 0 CHECK (balance_activity >= 0),
  total_balance numeric(12,2) GENERATED ALWAYS AS (balance_paid + balance_recharge_bonus + balance_activity) STORED,
  lifetime_recharged numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. CP Ledger Entries - Individual CP batches with 24-month expiry
-- Enforces: CP type must be one of three types; expires_at = acquired + 24 months
CREATE TABLE cp_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cp_type text NOT NULL CHECK (cp_type IN ('paid', 'recharge_bonus', 'activity')),
  original_amount numeric(12,2) NOT NULL CHECK (original_amount > 0),
  remaining_amount numeric(12,2) NOT NULL CHECK (remaining_amount >= 0),
  unit_currency_value numeric(10,4) DEFAULT NULL,
  currency text DEFAULT NULL,
  source_order_id uuid DEFAULT NULL,
  source_description text DEFAULT '',
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 months'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. CP Transactions - Complete audit trail of all CP movements
CREATE TABLE cp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'recharge', 'recharge_bonus', 'activity_grant',
    'consumption', 'refund', 'refund_bonus_deduct',
    'expiry', 'referral_reward', 'consultation_reward', 'sale_reward'
  )),
  cp_type text NOT NULL CHECK (cp_type IN ('paid', 'recharge_bonus', 'activity')),
  amount numeric(12,2) NOT NULL,
  balance_after numeric(12,2) NOT NULL,
  related_order_id uuid DEFAULT NULL,
  related_ledger_id uuid DEFAULT NULL REFERENCES cp_ledger_entries(id),
  description text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Membership Tiers - Configurable tier definitions (super admin can edit names/thresholds/discounts)
CREATE TABLE membership_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_code text NOT NULL UNIQUE,
  tier_name_zh_tw text NOT NULL,
  tier_name_zh_cn text NOT NULL,
  tier_name_en text NOT NULL,
  recharge_threshold_12m numeric(12,2) NOT NULL DEFAULT 0,
  single_recharge_threshold numeric(12,2) DEFAULT NULL,
  discount_rate numeric(4,3) NOT NULL DEFAULT 1.000 CHECK (discount_rate > 0 AND discount_rate <= 1),
  benefits jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  icon_emoji text DEFAULT NULL,
  color_hex text DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. User Memberships - Current membership status per user
CREATE TABLE user_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_tier_id uuid NOT NULL REFERENCES membership_tiers(id),
  tier_achieved_at timestamptz NOT NULL DEFAULT now(),
  has_purchase_history boolean NOT NULL DEFAULT false,
  rolling_12m_recharge_total numeric(12,2) NOT NULL DEFAULT 0,
  rolling_12m_start_date date NOT NULL DEFAULT CURRENT_DATE,
  next_evaluation_date date NOT NULL DEFAULT (CURRENT_DATE + interval '1 month')::date,
  previous_tier_id uuid DEFAULT NULL REFERENCES membership_tiers(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Recharge Packages - Purchasable CP bundles (super admin can design)
CREATE TABLE recharge_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name_zh_tw text NOT NULL,
  package_name_zh_cn text NOT NULL,
  package_name_en text NOT NULL,
  price_amount numeric(10,2) NOT NULL CHECK (price_amount > 0),
  currency text NOT NULL DEFAULT 'TWD',
  cp_amount integer NOT NULL CHECK (cp_amount > 0),
  bonus_cp_amount integer NOT NULL DEFAULT 0 CHECK (bonus_cp_amount >= 0),
  description_zh_tw text DEFAULT '',
  description_zh_cn text DEFAULT '',
  description_en text DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Recharge Orders - Payment records for CP purchases
CREATE TABLE recharge_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  package_id uuid REFERENCES recharge_packages(id),
  price_amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'TWD',
  cp_amount integer NOT NULL CHECK (cp_amount > 0),
  bonus_cp_amount integer NOT NULL DEFAULT 0 CHECK (bonus_cp_amount >= 0),
  payment_method text DEFAULT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_reference text DEFAULT NULL,
  completed_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Refund Requests - Enforces refund formula
CREATE TABLE refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES recharge_orders(id),
  reason text NOT NULL DEFAULT '',
  original_paid_cp numeric(12,2) NOT NULL,
  remaining_paid_cp numeric(12,2) NOT NULL,
  used_paid_cp numeric(12,2) GENERATED ALWAYS AS (original_paid_cp - remaining_paid_cp) STORED,
  refund_amount numeric(10,2) NOT NULL,
  refund_currency text NOT NULL,
  original_bonus_cp numeric(12,2) NOT NULL DEFAULT 0,
  bonus_cp_to_deduct numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  reviewer_id uuid DEFAULT NULL REFERENCES profiles(id),
  review_comment text DEFAULT '',
  reviewed_at timestamptz DEFAULT NULL,
  processed_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Membership Rules - Configurable rules (editable vs system-locked)
CREATE TABLE membership_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL UNIQUE,
  rule_value jsonb NOT NULL,
  rule_description_zh_tw text NOT NULL DEFAULT '',
  rule_description_zh_cn text NOT NULL DEFAULT '',
  rule_description_en text NOT NULL DEFAULT '',
  is_editable boolean NOT NULL DEFAULT true,
  is_system_locked boolean NOT NULL DEFAULT false,
  updated_by uuid DEFAULT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Service Catalog - Services priced in CP
CREATE TABLE service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text NOT NULL CHECK (service_type IN ('assessment', 'course', 'consultation', 'report', 'event', 'partner_product')),
  service_name_zh_tw text NOT NULL,
  service_name_zh_cn text DEFAULT '',
  service_name_en text DEFAULT '',
  cp_price integer NOT NULL CHECK (cp_price >= 0),
  description_zh_tw text DEFAULT '',
  description_zh_cn text DEFAULT '',
  description_en text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  related_entity_id uuid DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 11. CP Consumption Records - What services were purchased
CREATE TABLE cp_consumption_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_catalog_id uuid DEFAULT NULL REFERENCES service_catalog(id),
  cp_total_deducted numeric(12,2) NOT NULL,
  cp_paid_deducted numeric(12,2) NOT NULL DEFAULT 0,
  cp_bonus_deducted numeric(12,2) NOT NULL DEFAULT 0,
  cp_activity_deducted numeric(12,2) NOT NULL DEFAULT 0,
  original_cp_price integer NOT NULL,
  discount_rate numeric(4,3) NOT NULL DEFAULT 1.000,
  discounted_cp_price integer NOT NULL,
  description text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes for all CP tables
-- ============================================================
CREATE INDEX idx_cp_wallets_user ON cp_wallets(user_id);
CREATE INDEX idx_cp_ledger_user ON cp_ledger_entries(user_id);
CREATE INDEX idx_cp_ledger_type ON cp_ledger_entries(cp_type);
CREATE INDEX idx_cp_ledger_status ON cp_ledger_entries(status);
CREATE INDEX idx_cp_ledger_expires ON cp_ledger_entries(expires_at);
CREATE INDEX idx_cp_ledger_order ON cp_ledger_entries(source_order_id);
CREATE INDEX idx_cp_txn_user ON cp_transactions(user_id);
CREATE INDEX idx_cp_txn_type ON cp_transactions(transaction_type);
CREATE INDEX idx_cp_txn_created ON cp_transactions(created_at DESC);
CREATE INDEX idx_cp_txn_order ON cp_transactions(related_order_id);
CREATE INDEX idx_membership_tier_code ON membership_tiers(tier_code);
CREATE INDEX idx_membership_tier_sort ON membership_tiers(sort_order);
CREATE INDEX idx_user_membership_user ON user_memberships(user_id);
CREATE INDEX idx_user_membership_tier ON user_memberships(current_tier_id);
CREATE INDEX idx_recharge_pkg_active ON recharge_packages(is_active);
CREATE INDEX idx_recharge_order_user ON recharge_orders(user_id);
CREATE INDEX idx_recharge_order_status ON recharge_orders(payment_status);
CREATE INDEX idx_recharge_order_created ON recharge_orders(created_at DESC);
CREATE INDEX idx_refund_user ON refund_requests(user_id);
CREATE INDEX idx_refund_order ON refund_requests(order_id);
CREATE INDEX idx_refund_status ON refund_requests(status);
CREATE INDEX idx_membership_rules_key ON membership_rules(rule_key);
CREATE INDEX idx_service_catalog_type ON service_catalog(service_type);
CREATE INDEX idx_service_catalog_active ON service_catalog(is_active);
CREATE INDEX idx_consumption_user ON cp_consumption_records(user_id);
CREATE INDEX idx_consumption_created ON cp_consumption_records(created_at DESC);

-- ============================================================
-- Comments for documentation
-- ============================================================
COMMENT ON TABLE cp_wallets IS 'CP (Career Points) wallet per user. Balances split into 3 types: paid, recharge_bonus, activity. CP cannot be transferred, cashed, or exchanged across currencies.';
COMMENT ON TABLE cp_ledger_entries IS 'Individual CP batches with 24-month expiry. Each entry tracks original/remaining amounts. FIFO deduction within same type.';
COMMENT ON TABLE cp_transactions IS 'Complete audit trail of all CP movements: recharge, consumption, refund, expiry, rewards.';
COMMENT ON TABLE membership_tiers IS 'Configurable membership tier definitions. Super admin can edit names, thresholds, discounts, benefits.';
COMMENT ON TABLE user_memberships IS 'Current membership tier per user. Auto-upgraded via rolling 12-month recharge total. Cannot drop below Silver once any purchase made.';
COMMENT ON TABLE recharge_packages IS 'Purchasable CP bundles with optional bonus CP. Super admin can design packages.';
COMMENT ON TABLE recharge_orders IS 'Payment records for CP recharges. Links to ledger entries for refund traceability.';
COMMENT ON TABLE refund_requests IS 'Refund workflow. Formula: refund = remaining_paid_cp × unit_price. Bonus CP deducted proportionally.';
COMMENT ON TABLE membership_rules IS 'Configurable business rules. is_system_locked=true for immutable rules (3-ledger structure, deduction order, refund formula, CP validity).';
COMMENT ON TABLE service_catalog IS 'Services available for CP purchase: assessments, courses, consultations, reports, events, partner products.';
COMMENT ON TABLE cp_consumption_records IS 'Detailed record of CP consumption per service purchase, tracking deduction breakdown by CP type.';
