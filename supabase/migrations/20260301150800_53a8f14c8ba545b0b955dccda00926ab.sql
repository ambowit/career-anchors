
-- ============================================
-- Rebuild recharge_packages per PDF spec
-- Deactivate old packages (preserve referential integrity)
-- Insert 4 new packages per PDF 1:10 ratio
-- ============================================

-- Deactivate all old packages
UPDATE recharge_packages SET is_active = false;

-- NT$300 Starter (30 paid + 10 bonus = 40 total)
INSERT INTO recharge_packages (id, package_name_zh_tw, package_name_zh_cn, package_name_en, price_amount, currency, cp_amount, bonus_cp_amount, description_zh_tw, description_zh_cn, description_en, is_featured, is_active, sort_order)
VALUES (gen_random_uuid(), '入門套餐', '入门套餐', 'Starter Package', 300, 'TWD', 30, 10, '適合新手用戶，體驗平台服務', '适合新手用户，体验平台服务', 'Perfect for new users to try our services', false, true, 1);

-- NT$800 Advanced (80 paid + 45 bonus = 125 total)
INSERT INTO recharge_packages (id, package_name_zh_tw, package_name_zh_cn, package_name_en, price_amount, currency, cp_amount, bonus_cp_amount, description_zh_tw, description_zh_cn, description_en, is_featured, is_active, sort_order)
VALUES (gen_random_uuid(), '進階套餐', '进阶套餐', 'Advanced Package', 800, 'TWD', 80, 45, '超值贈點，升級銀卡會員', '超值赠点，升级银卡会员', 'Great value with bonus CP, upgrade to Silver', true, true, 2);

-- NT$3,000 Premium (300 paid + 300 bonus = 600 total)
INSERT INTO recharge_packages (id, package_name_zh_tw, package_name_zh_cn, package_name_en, price_amount, currency, cp_amount, bonus_cp_amount, description_zh_tw, description_zh_cn, description_en, is_featured, is_active, sort_order)
VALUES (gen_random_uuid(), '超值套餐', '超值套餐', 'Premium Package', 3000, 'TWD', 300, 300, '加倍贈送 CP，升級金卡會員', '加倍赠送 CP，升级金卡会员', 'Double bonus CP, upgrade to Gold membership', true, true, 3);

-- NT$10,000 Diamond (1000 paid + 1000 bonus = 2000 total)
INSERT INTO recharge_packages (id, package_name_zh_tw, package_name_zh_cn, package_name_en, price_amount, currency, cp_amount, bonus_cp_amount, description_zh_tw, description_zh_cn, description_en, is_featured, is_active, sort_order)
VALUES (gen_random_uuid(), '鑽石尊享套餐', '钻石尊享套餐', 'Diamond Package', 10000, 'TWD', 1000, 1000, '升級鑽石會員，尊享頂級權益', '升级钻石会员，尊享顶级权益', 'Upgrade to Diamond with maximum benefits', false, true, 4);
