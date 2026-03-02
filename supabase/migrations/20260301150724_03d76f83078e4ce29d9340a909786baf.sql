
-- ============================================
-- Fix membership_tiers thresholds per PDF spec
-- TWD thresholds: Silver=300, Gold=800, Platinum=3000, Diamond=10000
-- ============================================
UPDATE membership_tiers SET recharge_threshold_12m = 300, single_recharge_threshold = 300 WHERE tier_code = 'silver';
UPDATE membership_tiers SET recharge_threshold_12m = 800, single_recharge_threshold = 800 WHERE tier_code = 'gold';
UPDATE membership_tiers SET recharge_threshold_12m = 3000, single_recharge_threshold = 3000 WHERE tier_code = 'platinum';
UPDATE membership_tiers SET recharge_threshold_12m = 10000, single_recharge_threshold = 10000 WHERE tier_code = 'diamond';
