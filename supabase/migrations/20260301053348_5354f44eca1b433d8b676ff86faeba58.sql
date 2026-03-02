
-- ============================================================
-- SCPC V3.1: Partner Tables + Referral + DB Functions + Seed Data
-- ============================================================

-- 12. Product Partners
CREATE TABLE product_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  company_name text NOT NULL,
  company_description text DEFAULT '',
  contact_email text NOT NULL,
  contact_phone text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
  approved_by uuid DEFAULT NULL REFERENCES profiles(id),
  approved_at timestamptz DEFAULT NULL,
  total_products integer NOT NULL DEFAULT 0,
  total_revenue_cp numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 13. Partner Products
CREATE TABLE partner_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES product_partners(id) ON DELETE CASCADE,
  product_name_zh_tw text NOT NULL,
  product_name_zh_cn text DEFAULT '',
  product_name_en text DEFAULT '',
  product_type text NOT NULL CHECK (product_type IN ('design_document', 'test_link')),
  description text DEFAULT '',
  document_url text DEFAULT NULL,
  test_url text DEFAULT NULL,
  authorization_details text DEFAULT '',
  cp_price integer NOT NULL CHECK (cp_price > 0),
  revenue_split_platform numeric(3,2) NOT NULL CHECK (revenue_split_platform >= 0 AND revenue_split_platform <= 1),
  revenue_split_partner numeric(3,2) NOT NULL CHECK (revenue_split_partner >= 0 AND revenue_split_partner <= 1),
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'suspended')),
  reviewer_id uuid DEFAULT NULL REFERENCES profiles(id),
  review_comment text DEFAULT '',
  reviewed_at timestamptz DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT false,
  total_sales integer NOT NULL DEFAULT 0,
  total_revenue_cp numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (revenue_split_platform + revenue_split_partner = 1.00)
);

-- 14. Partner Revenue Records
CREATE TABLE partner_revenue_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES product_partners(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES partner_products(id),
  buyer_id uuid NOT NULL REFERENCES profiles(id),
  cp_total integer NOT NULL,
  cp_platform_share integer NOT NULL,
  cp_partner_share integer NOT NULL,
  original_cp_price integer NOT NULL,
  discount_rate numeric(4,3) NOT NULL DEFAULT 1.000,
  discounted_cp_price integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 15. Referral Rewards
CREATE TABLE referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id),
  referred_id uuid DEFAULT NULL REFERENCES profiles(id),
  reward_type text NOT NULL CHECK (reward_type IN ('consultation_completed', 'successful_referral', 'sale_achieved')),
  cp_amount integer NOT NULL CHECK (cp_amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'cancelled')),
  granted_at timestamptz DEFAULT NULL,
  ledger_entry_id uuid DEFAULT NULL REFERENCES cp_ledger_entries(id),
  description text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for partner/referral tables
CREATE INDEX idx_partner_user ON product_partners(user_id);
CREATE INDEX idx_partner_status ON product_partners(status);
CREATE INDEX idx_partner_product_partner ON partner_products(partner_id);
CREATE INDEX idx_partner_product_status ON partner_products(review_status);
CREATE INDEX idx_partner_product_active ON partner_products(is_active);
CREATE INDEX idx_partner_revenue_partner ON partner_revenue_records(partner_id);
CREATE INDEX idx_partner_revenue_product ON partner_revenue_records(product_id);
CREATE INDEX idx_partner_revenue_created ON partner_revenue_records(created_at DESC);
CREATE INDEX idx_referral_referrer ON referral_rewards(referrer_id);
CREATE INDEX idx_referral_referred ON referral_rewards(referred_id);
CREATE INDEX idx_referral_status ON referral_rewards(status);
CREATE INDEX idx_referral_type ON referral_rewards(reward_type);

-- Comments
COMMENT ON TABLE product_partners IS 'Product partner profiles. Partners upload test designs or links. Revenue split: design_document=5:5, test_link=3:7.';
COMMENT ON TABLE partner_products IS 'Products submitted by partners for review and sale. Revenue split enforced by product_type.';
COMMENT ON TABLE partner_revenue_records IS 'Revenue records per sale: tracks CP distribution between platform and partner.';
COMMENT ON TABLE referral_rewards IS 'Referral reward tracking. CP granted as activity CP (non-refundable). Types: consultation, referral, sale.';

-- ============================================================
-- Seed: Default Membership Tiers (普通/銀卡/金卡/白金/鑽石)
-- ============================================================
INSERT INTO membership_tiers (tier_code, tier_name_zh_tw, tier_name_zh_cn, tier_name_en, recharge_threshold_12m, single_recharge_threshold, discount_rate, benefits, sort_order, icon_emoji, color_hex)
VALUES
  ('normal', '普通會員', '普通会员', 'Standard', 0, NULL, 1.000,
   '[{"key":"basic_access","label_zh_tw":"基礎服務存取","label_zh_cn":"基础服务访问","label_en":"Basic service access"}]'::jsonb,
   1, '👤', '#94a3b8'),
  ('silver', '銀卡會員', '银卡会员', 'Silver', 1000, 1000, 0.950,
   '[{"key":"5pct_discount","label_zh_tw":"全站 95 折","label_zh_cn":"全站 95 折","label_en":"5% discount sitewide"},{"key":"priority_support","label_zh_tw":"優先客服支援","label_zh_cn":"优先客服支援","label_en":"Priority support"}]'::jsonb,
   2, '🥈', '#cbd5e1'),
  ('gold', '金卡會員', '金卡会员', 'Gold', 5000, 5000, 0.900,
   '[{"key":"10pct_discount","label_zh_tw":"全站 9 折","label_zh_cn":"全站 9 折","label_en":"10% discount sitewide"},{"key":"exclusive_courses","label_zh_tw":"專屬課程","label_zh_cn":"专属课程","label_en":"Exclusive courses"},{"key":"priority_support","label_zh_tw":"優先客服支援","label_zh_cn":"优先客服支援","label_en":"Priority support"}]'::jsonb,
   3, '🥇', '#fbbf24'),
  ('platinum', '白金會員', '白金会员', 'Platinum', 15000, 15000, 0.850,
   '[{"key":"15pct_discount","label_zh_tw":"全站 85 折","label_zh_cn":"全站 85 折","label_en":"15% discount sitewide"},{"key":"exclusive_courses","label_zh_tw":"專屬課程","label_zh_cn":"专属课程","label_en":"Exclusive courses"},{"key":"1on1_consultation","label_zh_tw":"一對一諮詢","label_zh_cn":"一对一咨询","label_en":"1-on-1 consultation"},{"key":"priority_support","label_zh_tw":"VIP 客服","label_zh_cn":"VIP 客服","label_en":"VIP support"}]'::jsonb,
   4, '💎', '#a78bfa'),
  ('diamond', '鑽石會員', '钻石会员', 'Diamond', 50000, 50000, 0.800,
   '[{"key":"20pct_discount","label_zh_tw":"全站 8 折","label_zh_cn":"全站 8 折","label_en":"20% discount sitewide"},{"key":"all_courses","label_zh_tw":"所有課程免費","label_zh_cn":"所有课程免费","label_en":"All courses free"},{"key":"1on1_consultation","label_zh_tw":"無限一對一諮詢","label_zh_cn":"无限一对一咨询","label_en":"Unlimited 1-on-1 consultation"},{"key":"vip_events","label_zh_tw":"VIP 專屬活動","label_zh_cn":"VIP 专属活动","label_en":"VIP exclusive events"},{"key":"priority_support","label_zh_tw":"VVIP 客服","label_zh_cn":"VVIP 客服","label_en":"VVIP support"}]'::jsonb,
   5, '👑', '#f59e0b');

-- ============================================================
-- Seed: System-locked Membership Rules (immutable)
-- ============================================================
INSERT INTO membership_rules (rule_key, rule_value, rule_description_zh_tw, rule_description_zh_cn, rule_description_en, is_editable, is_system_locked)
VALUES
  ('cp_no_transfer', '{"enforced":true}', 'CP 不可轉讓', 'CP 不可转让', 'CP is non-transferable', false, true),
  ('cp_no_cash_out', '{"enforced":true}', 'CP 不可兌現為現金', 'CP 不可兑现为现金', 'CP cannot be cashed out', false, true),
  ('cp_no_cross_account', '{"enforced":true}', 'CP 不可跨帳戶轉移', 'CP 不可跨账户转移', 'CP cannot be transferred across accounts', false, true),
  ('cp_no_cross_currency', '{"enforced":true}', 'CP 不可跨幣別兌換', 'CP 不可跨币别兑换', 'CP cannot be exchanged across currencies', false, true),
  ('cp_validity_months', '{"months":24}', 'CP 有效期限 24 個月', 'CP 有效期限 24 个月', 'CP validity: 24 months', false, true),
  ('cp_deduction_order', '{"order":["paid","recharge_bonus","activity"]}', '扣點順序：付費CP → 充值贈與CP → 活動贈與CP', '扣点顺序：付费CP → 充值赠与CP → 活动赠与CP', 'Deduction order: Paid → Recharge Bonus → Activity', false, true),
  ('cp_three_ledger', '{"types":["paid","recharge_bonus","activity"]}', '三分帳結構', '三分账结构', 'Three-ledger structure', false, true),
  ('refund_formula', '{"formula":"remaining_paid_cp * unit_currency_value","bonus_deduct":"bonus_cp * (used_paid_cp / original_paid_cp)","rounding":"round_half_up","activity_cp_deduct":false}', '退費公式（固定）', '退费公式（固定）', 'Refund formula (fixed)', false, true);

-- Seed: Editable rules (super admin can modify)
INSERT INTO membership_rules (rule_key, rule_value, rule_description_zh_tw, rule_description_zh_cn, rule_description_en, is_editable, is_system_locked)
VALUES
  ('referral_reward_cp', '{"amount":50}', '成功推薦獎勵 CP 數量', '成功推荐奖励 CP 数量', 'Referral reward CP amount', true, false),
  ('consultation_reward_cp', '{"amount":30}', '完成諮詢獎勵 CP 數量', '完成咨询奖励 CP 数量', 'Consultation completion reward CP amount', true, false),
  ('sale_reward_cp', '{"amount":20}', '達成銷售獎勵 CP 數量', '达成销售奖励 CP 数量', 'Sale achievement reward CP amount', true, false),
  ('min_downgrade_tier', '{"tier_code":"silver"}', '降級後最低等級（有消費記錄者）', '降级后最低等级（有消费记录者）', 'Minimum tier after downgrade (for users with purchase history)', true, false);

-- ============================================================
-- Seed: Default Recharge Packages
-- ============================================================
INSERT INTO recharge_packages (package_name_zh_tw, package_name_zh_cn, package_name_en, price_amount, currency, cp_amount, bonus_cp_amount, description_zh_tw, description_zh_cn, description_en, is_featured, sort_order)
VALUES
  ('入門包', '入门包', 'Starter Pack', 300, 'TWD', 300, 0, '適合初次體驗', '适合初次体验', 'Perfect for first-time users', false, 1),
  ('標準包', '标准包', 'Standard Pack', 1000, 'TWD', 1000, 50, '充值 1000 CP，額外贈送 50 CP', '充值 1000 CP，额外赠送 50 CP', 'Recharge 1000 CP, get 50 bonus CP', false, 2),
  ('超值包', '超值包', 'Value Pack', 3000, 'TWD', 3000, 200, '充值 3000 CP，額外贈送 200 CP', '充值 3000 CP，额外赠送 200 CP', 'Recharge 3000 CP, get 200 bonus CP', true, 3),
  ('尊享包', '尊享包', 'Premium Pack', 5000, 'TWD', 5000, 500, '充值 5000 CP，額外贈送 500 CP，直升金卡', '充值 5000 CP，额外赠送 500 CP，直升金卡', 'Recharge 5000 CP, get 500 bonus CP, instant Gold', true, 4),
  ('至尊包', '至尊包', 'Ultimate Pack', 15000, 'TWD', 15000, 2000, '充值 15000 CP，額外贈送 2000 CP，直升白金', '充值 15000 CP，额外赠送 2000 CP，直升白金', 'Recharge 15000 CP, get 2000 bonus CP, instant Platinum', false, 5);

-- ============================================================
-- Seed: Default Service Catalog
-- ============================================================
INSERT INTO service_catalog (service_type, service_name_zh_tw, service_name_zh_cn, service_name_en, cp_price, description_zh_tw, description_zh_cn, description_en, sort_order)
VALUES
  ('assessment', 'SCPC 職業錨測評', 'SCPC 职业锚测评', 'SCPC Career Anchor Assessment', 100, '40 題專業職業決策測評', '40 题专业职业决策测评', '40-question professional career assessment', 1),
  ('report', 'AI 深度解讀報告', 'AI 深度解读报告', 'AI Deep Analysis Report', 200, 'AI 個性化職業錨深度分析報告', 'AI 个性化职业锚深度分析报告', 'AI personalized career anchor analysis report', 2),
  ('consultation', '一對一職涯諮詢（30分鐘）', '一对一职涯咨询（30分钟）', '1-on-1 Career Consultation (30 min)', 500, '與認證諮詢師一對一視頻諮詢', '与认证咨询师一对一视频咨询', 'Video consultation with certified consultant', 3),
  ('course', '職涯發展工作坊', '职涯发展工作坊', 'Career Development Workshop', 300, '線上互動式職涯工作坊', '线上互动式职涯工作坊', 'Online interactive career workshop', 4),
  ('event', '行業交流活動', '行业交流活动', 'Industry Networking Event', 150, '線上行業交流與分享活動', '线上行业交流与分享活动', 'Online industry networking event', 5);
