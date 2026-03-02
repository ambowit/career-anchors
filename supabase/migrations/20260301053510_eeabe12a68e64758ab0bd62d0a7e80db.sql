
-- ============================================================
-- CP System Core Functions
-- ============================================================

-- Function 1: deduct_cp - Enforces fixed deduction order: paid → recharge_bonus → activity
-- Returns JSON with deduction breakdown
CREATE OR REPLACE FUNCTION deduct_cp(
  p_user_id uuid,
  p_amount numeric,
  p_description text DEFAULT '',
  p_service_catalog_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining numeric := p_amount;
  v_paid_deducted numeric := 0;
  v_bonus_deducted numeric := 0;
  v_activity_deducted numeric := 0;
  v_wallet cp_wallets%ROWTYPE;
  v_entry RECORD;
  v_deduct_from_entry numeric;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Get or create wallet
  SELECT * INTO v_wallet FROM cp_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Check total balance
  IF v_wallet.total_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient CP balance',
      'required', p_amount, 'available', v_wallet.total_balance);
  END IF;

  -- STEP 1: Deduct from PAID CP (FIFO by acquired_at)
  IF v_remaining > 0 THEN
    FOR v_entry IN
      SELECT id, remaining_amount
      FROM cp_ledger_entries
      WHERE user_id = p_user_id
        AND cp_type = 'paid'
        AND status = 'active'
        AND remaining_amount > 0
        AND expires_at > now()
      ORDER BY acquired_at ASC
      FOR UPDATE
    LOOP
      EXIT WHEN v_remaining <= 0;
      v_deduct_from_entry := LEAST(v_entry.remaining_amount, v_remaining);
      
      UPDATE cp_ledger_entries
      SET remaining_amount = remaining_amount - v_deduct_from_entry,
          status = CASE WHEN remaining_amount - v_deduct_from_entry <= 0 THEN 'depleted' ELSE 'active' END
      WHERE id = v_entry.id;
      
      v_paid_deducted := v_paid_deducted + v_deduct_from_entry;
      v_remaining := v_remaining - v_deduct_from_entry;
    END LOOP;
  END IF;

  -- STEP 2: Deduct from RECHARGE BONUS CP (FIFO)
  IF v_remaining > 0 THEN
    FOR v_entry IN
      SELECT id, remaining_amount
      FROM cp_ledger_entries
      WHERE user_id = p_user_id
        AND cp_type = 'recharge_bonus'
        AND status = 'active'
        AND remaining_amount > 0
        AND expires_at > now()
      ORDER BY acquired_at ASC
      FOR UPDATE
    LOOP
      EXIT WHEN v_remaining <= 0;
      v_deduct_from_entry := LEAST(v_entry.remaining_amount, v_remaining);
      
      UPDATE cp_ledger_entries
      SET remaining_amount = remaining_amount - v_deduct_from_entry,
          status = CASE WHEN remaining_amount - v_deduct_from_entry <= 0 THEN 'depleted' ELSE 'active' END
      WHERE id = v_entry.id;
      
      v_bonus_deducted := v_bonus_deducted + v_deduct_from_entry;
      v_remaining := v_remaining - v_deduct_from_entry;
    END LOOP;
  END IF;

  -- STEP 3: Deduct from ACTIVITY CP (FIFO)
  IF v_remaining > 0 THEN
    FOR v_entry IN
      SELECT id, remaining_amount
      FROM cp_ledger_entries
      WHERE user_id = p_user_id
        AND cp_type = 'activity'
        AND status = 'active'
        AND remaining_amount > 0
        AND expires_at > now()
      ORDER BY acquired_at ASC
      FOR UPDATE
    LOOP
      EXIT WHEN v_remaining <= 0;
      v_deduct_from_entry := LEAST(v_entry.remaining_amount, v_remaining);
      
      UPDATE cp_ledger_entries
      SET remaining_amount = remaining_amount - v_deduct_from_entry,
          status = CASE WHEN remaining_amount - v_deduct_from_entry <= 0 THEN 'depleted' ELSE 'active' END
      WHERE id = v_entry.id;
      
      v_activity_deducted := v_activity_deducted + v_deduct_from_entry;
      v_remaining := v_remaining - v_deduct_from_entry;
    END LOOP;
  END IF;

  -- Safety check: should not happen if balance check passed
  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Deduction failed: remaining=% after processing all ledger entries', v_remaining;
  END IF;

  -- Update wallet balances
  UPDATE cp_wallets
  SET balance_paid = balance_paid - v_paid_deducted,
      balance_recharge_bonus = balance_recharge_bonus - v_bonus_deducted,
      balance_activity = balance_activity - v_activity_deducted,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transactions
  IF v_paid_deducted > 0 THEN
    INSERT INTO cp_transactions (user_id, transaction_type, cp_type, amount, balance_after, description, metadata)
    VALUES (p_user_id, 'consumption', 'paid', -v_paid_deducted,
      (SELECT balance_paid FROM cp_wallets WHERE user_id = p_user_id),
      p_description, p_metadata);
  END IF;
  IF v_bonus_deducted > 0 THEN
    INSERT INTO cp_transactions (user_id, transaction_type, cp_type, amount, balance_after, description, metadata)
    VALUES (p_user_id, 'consumption', 'recharge_bonus', -v_bonus_deducted,
      (SELECT balance_recharge_bonus FROM cp_wallets WHERE user_id = p_user_id),
      p_description, p_metadata);
  END IF;
  IF v_activity_deducted > 0 THEN
    INSERT INTO cp_transactions (user_id, transaction_type, cp_type, amount, balance_after, description, metadata)
    VALUES (p_user_id, 'consumption', 'activity', -v_activity_deducted,
      (SELECT balance_activity FROM cp_wallets WHERE user_id = p_user_id),
      p_description, p_metadata);
  END IF;

  -- Record consumption
  INSERT INTO cp_consumption_records (user_id, service_catalog_id, cp_total_deducted,
    cp_paid_deducted, cp_bonus_deducted, cp_activity_deducted,
    original_cp_price, discount_rate, discounted_cp_price, description, metadata)
  VALUES (p_user_id, p_service_catalog_id, p_amount,
    v_paid_deducted, v_bonus_deducted, v_activity_deducted,
    p_amount, 1.000, p_amount, p_description, p_metadata);

  -- Mark has_purchase_history
  UPDATE user_memberships SET has_purchase_history = true, updated_at = now()
  WHERE user_id = p_user_id AND has_purchase_history = false;

  RETURN jsonb_build_object(
    'success', true,
    'total_deducted', p_amount,
    'paid_deducted', v_paid_deducted,
    'bonus_deducted', v_bonus_deducted,
    'activity_deducted', v_activity_deducted
  );
END;
$$;

-- Function 2: calculate_refund - Implements fixed refund formula
-- refund_amount = remaining_paid_cp × unit_currency_value
-- bonus_cp_deduct = original_bonus_cp × (used_paid_cp / original_paid_cp), rounded
CREATE OR REPLACE FUNCTION calculate_refund(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order recharge_orders%ROWTYPE;
  v_remaining_paid numeric := 0;
  v_original_paid numeric;
  v_used_paid numeric;
  v_original_bonus numeric;
  v_unit_price numeric;
  v_refund_amount numeric;
  v_bonus_deduct numeric;
BEGIN
  SELECT * INTO v_order FROM recharge_orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  IF v_order.payment_status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not eligible for refund');
  END IF;

  v_original_paid := v_order.cp_amount;
  v_original_bonus := v_order.bonus_cp_amount;
  v_unit_price := v_order.price_amount / v_order.cp_amount;

  -- Calculate remaining paid CP from this order's ledger entries
  SELECT COALESCE(SUM(remaining_amount), 0) INTO v_remaining_paid
  FROM cp_ledger_entries
  WHERE source_order_id = p_order_id
    AND cp_type = 'paid'
    AND status IN ('active', 'depleted');

  v_used_paid := v_original_paid - v_remaining_paid;

  -- Refund formula: remaining_paid_cp × unit_price
  v_refund_amount := ROUND(v_remaining_paid * v_unit_price, 2);

  -- Bonus deduction formula: bonus × (used / original), rounded
  IF v_original_paid > 0 AND v_original_bonus > 0 THEN
    v_bonus_deduct := ROUND(v_original_bonus * (v_used_paid / v_original_paid));
  ELSE
    v_bonus_deduct := 0;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'original_paid_cp', v_original_paid,
    'remaining_paid_cp', v_remaining_paid,
    'used_paid_cp', v_used_paid,
    'unit_price', v_unit_price,
    'refund_amount', v_refund_amount,
    'refund_currency', v_order.currency,
    'original_bonus_cp', v_original_bonus,
    'bonus_cp_to_deduct', v_bonus_deduct
  );
END;
$$;

-- Function 3: grant_activity_cp - Grant activity CP (for rewards, referrals)
CREATE OR REPLACE FUNCTION grant_activity_cp(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT '',
  p_transaction_type text DEFAULT 'activity_grant'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ledger_id uuid;
  v_new_balance numeric;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Ensure wallet exists
  INSERT INTO cp_wallets (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create ledger entry (24-month expiry enforced by default)
  INSERT INTO cp_ledger_entries (user_id, cp_type, original_amount, remaining_amount, source_description)
  VALUES (p_user_id, 'activity', p_amount, p_amount, p_description)
  RETURNING id INTO v_ledger_id;

  -- Update wallet
  UPDATE cp_wallets
  SET balance_activity = balance_activity + p_amount, updated_at = now()
  WHERE user_id = p_user_id;

  SELECT balance_activity INTO v_new_balance FROM cp_wallets WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO cp_transactions (user_id, transaction_type, cp_type, amount, balance_after, related_ledger_id, description)
  VALUES (p_user_id, p_transaction_type, 'activity', p_amount, v_new_balance, v_ledger_id, p_description);

  RETURN jsonb_build_object('success', true, 'ledger_entry_id', v_ledger_id, 'balance_after', v_new_balance);
END;
$$;

-- Function 4: process_recharge - Handle complete recharge flow
CREATE OR REPLACE FUNCTION process_recharge(
  p_user_id uuid,
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order recharge_orders%ROWTYPE;
  v_unit_price numeric;
  v_paid_ledger_id uuid;
  v_bonus_ledger_id uuid;
  v_new_paid_balance numeric;
  v_new_bonus_balance numeric;
  v_normal_tier_id uuid;
BEGIN
  SELECT * INTO v_order FROM recharge_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  IF v_order.payment_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order already processed');
  END IF;
  IF v_order.user_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order does not belong to user');
  END IF;

  -- Ensure wallet exists
  INSERT INTO cp_wallets (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Ensure membership exists
  SELECT id INTO v_normal_tier_id FROM membership_tiers WHERE tier_code = 'normal' LIMIT 1;
  INSERT INTO user_memberships (user_id, current_tier_id)
  VALUES (p_user_id, v_normal_tier_id)
  ON CONFLICT (user_id) DO NOTHING;

  v_unit_price := v_order.price_amount / v_order.cp_amount;

  -- Create paid CP ledger entry
  INSERT INTO cp_ledger_entries (user_id, cp_type, original_amount, remaining_amount,
    unit_currency_value, currency, source_order_id, source_description)
  VALUES (p_user_id, 'paid', v_order.cp_amount, v_order.cp_amount,
    v_unit_price, v_order.currency, p_order_id, 'Recharge order ' || p_order_id::text)
  RETURNING id INTO v_paid_ledger_id;

  -- Update wallet - paid
  UPDATE cp_wallets
  SET balance_paid = balance_paid + v_order.cp_amount,
      lifetime_recharged = lifetime_recharged + v_order.price_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  SELECT balance_paid INTO v_new_paid_balance FROM cp_wallets WHERE user_id = p_user_id;

  -- Transaction record - paid
  INSERT INTO cp_transactions (user_id, transaction_type, cp_type, amount, balance_after,
    related_order_id, related_ledger_id, description)
  VALUES (p_user_id, 'recharge', 'paid', v_order.cp_amount, v_new_paid_balance,
    p_order_id, v_paid_ledger_id, 'Recharge ' || v_order.cp_amount || ' CP');

  -- Grant bonus CP if any
  IF v_order.bonus_cp_amount > 0 THEN
    INSERT INTO cp_ledger_entries (user_id, cp_type, original_amount, remaining_amount,
      source_order_id, source_description)
    VALUES (p_user_id, 'recharge_bonus', v_order.bonus_cp_amount, v_order.bonus_cp_amount,
      p_order_id, 'Recharge bonus for order ' || p_order_id::text)
    RETURNING id INTO v_bonus_ledger_id;

    UPDATE cp_wallets
    SET balance_recharge_bonus = balance_recharge_bonus + v_order.bonus_cp_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    SELECT balance_recharge_bonus INTO v_new_bonus_balance FROM cp_wallets WHERE user_id = p_user_id;

    INSERT INTO cp_transactions (user_id, transaction_type, cp_type, amount, balance_after,
      related_order_id, related_ledger_id, description)
    VALUES (p_user_id, 'recharge_bonus', 'recharge_bonus', v_order.bonus_cp_amount, v_new_bonus_balance,
      p_order_id, v_bonus_ledger_id, 'Bonus ' || v_order.bonus_cp_amount || ' CP');
  END IF;

  -- Mark order completed
  UPDATE recharge_orders SET payment_status = 'completed', completed_at = now() WHERE id = p_order_id;

  -- Update rolling 12m recharge and check tier upgrade
  UPDATE user_memberships
  SET rolling_12m_recharge_total = rolling_12m_recharge_total + v_order.price_amount,
      has_purchase_history = true,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Auto-upgrade check
  PERFORM evaluate_membership_tier(p_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'paid_cp', v_order.cp_amount,
    'bonus_cp', v_order.bonus_cp_amount,
    'total_cp', v_order.cp_amount + v_order.bonus_cp_amount
  );
END;
$$;

-- Function 5: evaluate_membership_tier - Auto upgrade/downgrade
CREATE OR REPLACE FUNCTION evaluate_membership_tier(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership user_memberships%ROWTYPE;
  v_current_tier membership_tiers%ROWTYPE;
  v_target_tier membership_tiers%ROWTYPE;
  v_min_tier_code text;
  v_rolling_total numeric;
  v_changed boolean := false;
BEGIN
  SELECT * INTO v_membership FROM user_memberships WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Membership not found');
  END IF;

  SELECT * INTO v_current_tier FROM membership_tiers WHERE id = v_membership.current_tier_id;
  v_rolling_total := v_membership.rolling_12m_recharge_total;

  -- Find highest qualifying tier (by rolling 12m total OR single recharge)
  SELECT * INTO v_target_tier
  FROM membership_tiers
  WHERE is_active = true
    AND (recharge_threshold_12m <= v_rolling_total
         OR (single_recharge_threshold IS NOT NULL AND single_recharge_threshold <= v_rolling_total))
  ORDER BY sort_order DESC
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT * INTO v_target_tier FROM membership_tiers WHERE tier_code = 'normal';
  END IF;

  -- Downgrade protection: if has_purchase_history, cannot go below silver
  IF v_membership.has_purchase_history AND v_target_tier.sort_order < 2 THEN
    SELECT rule_value->>'tier_code' INTO v_min_tier_code
    FROM membership_rules WHERE rule_key = 'min_downgrade_tier';
    
    IF v_min_tier_code IS NOT NULL THEN
      SELECT * INTO v_target_tier FROM membership_tiers WHERE tier_code = v_min_tier_code;
    ELSE
      SELECT * INTO v_target_tier FROM membership_tiers WHERE tier_code = 'silver';
    END IF;
  END IF;

  -- Update if tier changed
  IF v_target_tier.id != v_membership.current_tier_id THEN
    UPDATE user_memberships
    SET previous_tier_id = current_tier_id,
        current_tier_id = v_target_tier.id,
        tier_achieved_at = now(),
        updated_at = now()
    WHERE user_id = p_user_id;
    v_changed := true;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'changed', v_changed,
    'tier_code', v_target_tier.tier_code,
    'tier_name', v_target_tier.tier_name_zh_tw,
    'rolling_12m_total', v_rolling_total
  );
END;
$$;

-- Function 6: expire_cp_entries - Batch expire old CP (to be called by cron)
CREATE OR REPLACE FUNCTION expire_cp_entries()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_entry RECORD;
BEGIN
  FOR v_entry IN
    SELECT id, user_id, cp_type, remaining_amount
    FROM cp_ledger_entries
    WHERE status = 'active'
      AND expires_at <= now()
      AND remaining_amount > 0
    FOR UPDATE
  LOOP
    -- Mark as expired
    UPDATE cp_ledger_entries SET status = 'expired' WHERE id = v_entry.id;

    -- Deduct from wallet
    IF v_entry.cp_type = 'paid' THEN
      UPDATE cp_wallets SET balance_paid = GREATEST(balance_paid - v_entry.remaining_amount, 0), updated_at = now()
      WHERE user_id = v_entry.user_id;
    ELSIF v_entry.cp_type = 'recharge_bonus' THEN
      UPDATE cp_wallets SET balance_recharge_bonus = GREATEST(balance_recharge_bonus - v_entry.remaining_amount, 0), updated_at = now()
      WHERE user_id = v_entry.user_id;
    ELSIF v_entry.cp_type = 'activity' THEN
      UPDATE cp_wallets SET balance_activity = GREATEST(balance_activity - v_entry.remaining_amount, 0), updated_at = now()
      WHERE user_id = v_entry.user_id;
    END IF;

    -- Record transaction
    INSERT INTO cp_transactions (user_id, transaction_type, cp_type, amount, balance_after, related_ledger_id, description)
    VALUES (v_entry.user_id, 'expiry', v_entry.cp_type, -v_entry.remaining_amount,
      CASE v_entry.cp_type
        WHEN 'paid' THEN (SELECT balance_paid FROM cp_wallets WHERE user_id = v_entry.user_id)
        WHEN 'recharge_bonus' THEN (SELECT balance_recharge_bonus FROM cp_wallets WHERE user_id = v_entry.user_id)
        WHEN 'activity' THEN (SELECT balance_activity FROM cp_wallets WHERE user_id = v_entry.user_id)
      END,
      v_entry.id, 'CP expired after 24 months');

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Comments for functions
COMMENT ON FUNCTION deduct_cp IS 'Deducts CP following immutable order: paid → recharge_bonus → activity. FIFO within each type. Creates audit trail.';
COMMENT ON FUNCTION calculate_refund IS 'Calculates refund per immutable formula: refund = remaining_paid_cp × unit_price. Bonus deduct = bonus × (used/original).';
COMMENT ON FUNCTION grant_activity_cp IS 'Grants activity CP (for rewards, referrals). 24-month expiry. Non-refundable.';
COMMENT ON FUNCTION process_recharge IS 'Processes recharge order: creates paid CP + bonus CP ledger entries, updates wallet, triggers tier evaluation.';
COMMENT ON FUNCTION evaluate_membership_tier IS 'Auto-evaluates membership tier based on rolling 12-month recharge. Cannot drop below Silver if has_purchase_history.';
COMMENT ON FUNCTION expire_cp_entries IS 'Batch expires CP entries past 24-month validity. To be called by scheduled cron job.';
