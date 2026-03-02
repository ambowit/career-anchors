
-- 1. Enhance cp_transactions with per-category balance snapshots and consumption breakdown
ALTER TABLE cp_transactions
  ADD COLUMN IF NOT EXISTS balance_after_paid numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_after_bonus numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_after_activity numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_used numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_used numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS activity_used numeric(12,2) DEFAULT 0;

COMMENT ON COLUMN cp_transactions.balance_after_paid IS 'Paid CP balance after this transaction';
COMMENT ON COLUMN cp_transactions.balance_after_bonus IS 'Recharge Bonus CP balance after this transaction';
COMMENT ON COLUMN cp_transactions.balance_after_activity IS 'Activity CP balance after this transaction';
COMMENT ON COLUMN cp_transactions.paid_used IS 'Paid CP consumed in this transaction (consumption only)';
COMMENT ON COLUMN cp_transactions.bonus_used IS 'Bonus CP consumed in this transaction (consumption only)';
COMMENT ON COLUMN cp_transactions.activity_used IS 'Activity CP consumed in this transaction (consumption only)';

-- 2. Create cp_rules_versions table for versioned rule management
CREATE TABLE IF NOT EXISTS cp_rules_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type text NOT NULL CHECK (rule_type IN ('DEDUCTION_ORDER', 'REFERRAL_REWARD', 'RECHARGE_BONUS')),
  version integer NOT NULL DEFAULT 1,
  config_json jsonb NOT NULL DEFAULT '{}',
  description text DEFAULT '',
  effective_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE cp_rules_versions IS 'Versioned CP rule configurations. rule_type: DEDUCTION_ORDER (consumption order), REFERRAL_REWARD (referral reward rules), RECHARGE_BONUS (recharge bonus rules). Only one active version per rule_type.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cp_rules_type ON cp_rules_versions(rule_type);
CREATE INDEX IF NOT EXISTS idx_cp_rules_active ON cp_rules_versions(rule_type, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cp_rules_effective ON cp_rules_versions(effective_at DESC);

-- Unique: only one active version per rule_type
CREATE UNIQUE INDEX IF NOT EXISTS uq_cp_rules_active_per_type ON cp_rules_versions(rule_type) WHERE is_active = true;
