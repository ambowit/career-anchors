
-- ============================================
-- Fix service_catalog per PDF spec
-- Add Ideal Life Card Assessment (5 CP)
-- Update SCPC Career Anchor price to 150 CP
-- ============================================

-- Add Ideal Life Card Assessment
INSERT INTO service_catalog (id, service_type, service_name_zh_tw, service_name_zh_cn, service_name_en, cp_price, description_zh_tw, description_zh_cn, description_en, is_active, sort_order)
VALUES (gen_random_uuid(), 'assessment', '理想人生卡測評', '理想人生卡测评', 'Ideal Life Card Assessment', 5, '探索您的理想人生藍圖，發現核心價值取向', '探索您的理想人生蓝图，发现核心价值取向', 'Explore your ideal life blueprint and core values', true, 0);

-- Update SCPC Career Anchor price from 100 to 150 CP
UPDATE service_catalog SET cp_price = 150 WHERE service_type = 'assessment' AND service_name_en LIKE '%Career Anchor%';

-- ============================================
-- Fix membership_rules per PDF spec
-- Add registration bonus (5 CP)
-- Add tier-based referral rewards (3/10/20/30/40)
-- Remove old fixed referral_reward_cp
-- ============================================

-- Add registration bonus rule
INSERT INTO membership_rules (id, rule_key, rule_value, rule_description_zh_tw, rule_description_zh_cn, rule_description_en, is_editable, is_system_locked, created_at, updated_at)
VALUES (gen_random_uuid(), 'registration_bonus_cp', '{"amount": 5}'::jsonb, '新用戶註冊獎勵 CP（生涯點）數量', '新用户注册奖励 CP（生涯点）数量', 'CP (Career Points) reward for new user registration', true, false, NOW(), NOW());

-- Add tier-based referral reward rule
INSERT INTO membership_rules (id, rule_key, rule_value, rule_description_zh_tw, rule_description_zh_cn, rule_description_en, is_editable, is_system_locked, created_at, updated_at)
VALUES (gen_random_uuid(), 'referral_reward_by_tier', '{"normal": 3, "silver": 10, "gold": 20, "platinum": 30, "diamond": 40}'::jsonb, '依會員等級的推薦獎勵 CP（免費/銀卡/金卡/白金/鑽石）', '依会员等级的推荐奖励 CP（免费/银卡/金卡/白金/钻石）', 'Referral reward CP by membership tier (Free/Silver/Gold/Platinum/Diamond)', true, false, NOW(), NOW());

-- Remove old fixed referral_reward_cp rule
DELETE FROM membership_rules WHERE rule_key = 'referral_reward_cp';
