
-- Seed: First ensure we have a profile for an existing auth user to satisfy FK constraints
-- Then insert all 70 life cards and their zh-TW quadrant contents

DO $$
DECLARE
  admin_uid uuid;
  card_record RECORD;
BEGIN
  -- Find first user from auth.users
  SELECT id INTO admin_uid FROM auth.users LIMIT 1;
  
  IF admin_uid IS NULL THEN
    RAISE EXCEPTION 'No auth users found. Please create at least one user first.';
  END IF;
  
  RAISE NOTICE 'Using auth user: %', admin_uid;
  
  -- Ensure profile exists for this user (upsert)
  INSERT INTO profiles (id, role_type)
  VALUES (admin_uid, 'super_admin')
  ON CONFLICT (id) DO NOTHING;
  
  -- Verify profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = admin_uid) THEN
    RAISE EXCEPTION 'Failed to create profile for user %', admin_uid;
  END IF;
  
  RAISE NOTICE 'Profile ensured for user: %', admin_uid;
  
  -- ═══════════════════════════════════════════════════
  -- INSERT 70 LIFE CARDS
  -- ═══════════════════════════════════════════════════
  
  -- 1. 做善事
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (1, 'Doing Good', '做善事', '做善事', 'Doing Good', '做善事', '做善事', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 2. 不斷的自我探索
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (2, 'Continuous Self-Exploration', '不断的自我探索', '不斷的自我探索', 'Continuous Self-Exploration', '不断的自我探索', '不斷的自我探索', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 3. 做自己
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (3, 'Authenticity', '做自己', '做自己', 'Authenticity', '做自己', '做自己', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 4. 公平
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (4, 'Fairness', '公平', '公平', 'Fairness', '公平', '公平', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 5. 有赤子之心
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (5, 'Childlike Wonder', '有赤子之心', '有赤子之心', 'Childlike Wonder', '有赤子之心', '有赤子之心', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 6. 內心的平靜
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (6, 'Inner Peace', '内心的平静', '內心的平靜', 'Inner Peace', '内心的平静', '內心的平靜', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 7. 相信信仰的力量
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (7, 'Faith', '相信信仰的力量', '相信信仰的力量', 'Faith', '相信信仰的力量', '相信信仰的力量', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 8. 有內涵的生命
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (8, 'A Meaningful Life', '有内涵的生命', '有內涵的生命', 'A Meaningful Life', '有内涵的生命', '有內涵的生命', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 9. 安全感
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (9, 'Security', '安全感', '安全感', 'Security', '安全感', '安全感', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 10. 享受自由
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (10, 'Freedom', '享受自由', '享受自由', 'Freedom', '享受自由', '享受自由', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 11. 自主權
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (11, 'Autonomy', '自主权', '自主權', 'Autonomy', '自主权', '自主權', 'intrinsic', '💎', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 12. 勇於挑戰/冒險
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (12, 'Courage to Take Risks', '勇于挑战/冒险', '勇於挑戰/冒險', 'Courage to Take Risks', '勇于挑战/冒险', '勇於挑戰/冒險', 'intrinsic', '💎', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 13. 自信
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (13, 'Self-Confidence', '自信', '自信', 'Self-Confidence', '自信', '自信', 'intrinsic', '💎', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 14. 務實踏實
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (14, 'Practicality', '务实踏实', '務實踏實', 'Practicality', '务实踏实', '務實踏實', 'intrinsic', '💎', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 15. 做善良的人
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (15, 'Kindness', '做善良的人', '做善良的人', 'Kindness', '做善良的人', '做善良的人', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 16. 欣賞美的事物
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (16, 'Appreciation of Beauty', '欣赏美的事物', '欣賞美的事物', 'Appreciation of Beauty', '欣赏美的事物', '欣賞美的事物', 'intrinsic', '💎', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 17. 為夢想奮鬥
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (17, 'Pursuing Dreams', '为梦想奋斗', '為夢想奮鬥', 'Pursuing Dreams', '为梦想奋斗', '為夢想奮鬥', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 18. 工作有意義
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (18, 'Meaningful Work', '工作有意义', '工作有意義', 'Meaningful Work', '工作有意义', '工作有意義', 'intrinsic', '💎', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 19. 專業能力被認可
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (19, 'Professional Recognition', '专业能力被认可', '專業能力被認可', 'Professional Recognition', '专业能力被认可', '專業能力被認可', 'intrinsic', '💎', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 20. 富正義感
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (20, 'Sense of Justice', '富正义感', '富正義感', 'Sense of Justice', '富正义感', '富正義感', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 21. 做事勤奮
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (21, 'Diligence', '做事勤奋', '做事勤奮', 'Diligence', '做事勤奋', '做事勤奮', 'intrinsic', '💎', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 22. 發揮創造力
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (22, 'Creativity', '发挥创造力', '發揮創造力', 'Creativity', '发挥创造力', '發揮創造力', 'intrinsic', '💎', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 23. 擁抱改變
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (23, 'Openness to Change', '拥抱改变', '擁抱改變', 'Openness to Change', '拥抱改变', '擁抱改變', 'intrinsic', '💎', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 24. 受人尊重
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (24, 'Being Respected', '受人尊重', '受人尊重', 'Being Respected', '受人尊重', '受人尊重', 'intrinsic', '💎', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 25. 發揮專業的技巧
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (25, 'Applying Professional Expertise', '发挥专业的技巧', '發揮專業的技巧', 'Applying Professional Expertise', '发挥专业的技巧', '發揮專業的技巧', 'intrinsic', '💎', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 26. 有誠信
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (26, 'Integrity', '有诚信', '有誠信', 'Integrity', '有诚信', '有誠信', 'intrinsic', '💎', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 27. 成就感
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (27, 'Sense of Achievement', '成就感', '成就感', 'Sense of Achievement', '成就感', '成就感', 'intrinsic', '💎', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);

  -- ═══ 人際關係 (15 cards: 28-42) ═══
  
  -- 28. 講義氣
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (28, 'Loyalty', '讲义气', '講義氣', 'Loyalty', '讲义气', '講義氣', 'interpersonal', '🤝', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 29. 有社會地位
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (29, 'Social Recognition', '有社会地位', '有社會地位', 'Social Recognition', '有社会地位', '有社會地位', 'interpersonal', '🤝', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 30. 喜歡交朋友
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (30, 'Building Friendships', '喜欢交朋友', '喜歡交朋友', 'Building Friendships', '喜欢交朋友', '喜歡交朋友', 'interpersonal', '🤝', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 31. 影響他人
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (31, 'Influence', '影响他人', '影響他人', 'Influence', '影响他人', '影響他人', 'interpersonal', '🤝', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 32. 激勵他人
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (32, 'Inspiring Others', '激励他人', '激勵他人', 'Inspiring Others', '激励他人', '激勵他人', 'interpersonal', '🤝', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 33. 喜歡幫助他人
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (33, 'Helping Others', '喜欢帮助他人', '喜歡幫助他人', 'Helping Others', '喜欢帮助他人', '喜歡幫助他人', 'interpersonal', '🤝', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 34. 能談心的朋友
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (34, 'A Friend I Can Open Up To', '能谈心的朋友', '能談心的朋友', 'A Friend I Can Open Up To', '能谈心的朋友', '能談心的朋友', 'interpersonal', '🤝', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 35. 嚮往美滿的婚姻
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (35, 'Fulfilling Marriage', '向往美满的婚姻', '嚮往美滿的婚姻', 'Fulfilling Marriage', '向往美满的婚姻', '嚮往美滿的婚姻', 'interpersonal', '🤝', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 36. 有火花的愛情關係
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (36, 'Passionate Relationship', '有火花的爱情关系', '有火花的愛情關係', 'Passionate Relationship', '有火花的爱情关系', '有火花的愛情關係', 'interpersonal', '🤝', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 37. 親密的家人關係
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (37, 'Close Family Relationships', '亲密的家人关系', '親密的家人關係', 'Close Family Relationships', '亲密的家人关系', '親密的家人關係', 'interpersonal', '🤝', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 38. 孝順
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (38, 'Filial Responsibility', '孝顺', '孝順', 'Filial Responsibility', '孝顺', '孝順', 'interpersonal', '🤝', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 39. 陪孩子成長
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (39, 'Being Present in Children''s Growth', '陪孩子成长', '陪孩子成長', 'Being Present in Children''s Growth', '陪孩子成长', '陪孩子成長', 'interpersonal', '🤝', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 40. 與夥伴一起奮鬥
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (40, 'Collaborative Partnership', '与伙伴一起奋斗', '與夥伴一起奮鬥', 'Collaborative Partnership', '与伙伴一起奋斗', '與夥伴一起奮鬥', 'interpersonal', '🤝', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 41. 與眾不同
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (41, 'Individuality', '与众不同', '與眾不同', 'Individuality', '与众不同', '與眾不同', 'interpersonal', '🤝', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 42. 喜歡參與志願者活動
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (42, 'Volunteering', '喜欢参与志愿者活动', '喜歡參與志願者活動', 'Volunteering', '喜欢参与志愿者活动', '喜歡參與志願者活動', 'interpersonal', '🤝', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);

  -- ═══ 生活風格 (19 cards: 43-61) ═══
  
  -- 43. 追求精神生活
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (43, 'Spiritual Fulfillment', '追求精神生活', '追求精神生活', 'Spiritual Fulfillment', '追求精神生活', '追求精神生活', 'lifestyle', '🌿', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 44. 活得久
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (44, 'Longevity', '活得久', '活得久', 'Longevity', '活得久', '活得久', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 45. 享受美味
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (45, 'Enjoying Good Food', '享受美味', '享受美味', 'Enjoying Good Food', '享受美味', '享受美味', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 46. 擁有健康的身體
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (46, 'Physical Health', '拥有健康的身体', '擁有健康的身體', 'Physical Health', '拥有健康的身体', '擁有健康的身體', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 47. 長期/固定運動
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (47, 'Regular Physical Activity', '长期/固定运动', '長期/固定運動', 'Regular Physical Activity', '长期/固定运动', '長期/固定運動', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 48. 生活規律/單純
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (48, 'Simple and Structured Living', '生活规律/单纯', '生活規律/單純', 'Simple and Structured Living', '生活规律/单纯', '生活規律/單純', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 49. 有興趣愛好
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (49, 'Personal Hobbies', '有兴趣爱好', '有興趣愛好', 'Personal Hobbies', '有兴趣爱好', '有興趣愛好', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 50. 喜歡外出
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (50, 'Enjoying Going Out', '喜欢外出', '喜歡外出', 'Enjoying Going Out', '喜欢外出', '喜歡外出', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 51. 喜歡發呆
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (51, 'Quiet Reflection', '喜欢发呆', '喜歡發呆', 'Quiet Reflection', '喜欢发呆', '喜歡發呆', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 52. 愛好獨處
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (52, 'Enjoying Solitude', '爱好独处', '愛好獨處', 'Enjoying Solitude', '爱好独处', '愛好獨處', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 53. 四處旅行
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (53, 'Traveling', '四处旅行', '四處旅行', 'Traveling', '四处旅行', '四處旅行', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 54. 做喜歡的事
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (54, 'Doing What I Enjoy', '做喜欢的事', '做喜歡的事', 'Doing What I Enjoy', '做喜欢的事', '做喜歡的事', 'lifestyle', '🌿', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 55. 喜歡戶外和大自然
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (55, 'Enjoying Nature', '喜欢户外和大自然', '喜歡戶外和大自然', 'Enjoying Nature', '喜欢户外和大自然', '喜歡戶外和大自然', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 56. 有機生活
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (56, 'Organic Lifestyle', '有机生活', '有機生活', 'Organic Lifestyle', '有机生活', '有機生活', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 57. 對生活保持熱誠
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (57, 'Passion for Life', '对生活保持热忱', '對生活保持熱誠', 'Passion for Life', '对生活保持热忱', '對生活保持熱誠', 'lifestyle', '🌿', true, 'neutral', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 58. 喜歡穩定
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (58, 'Preference for Stability', '喜欢稳定', '喜歡穩定', 'Preference for Stability', '喜欢稳定', '喜歡穩定', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 59. 保持學習
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (59, 'Continuous Learning', '保持学习', '保持學習', 'Continuous Learning', '保持学习', '保持學習', 'lifestyle', '🌿', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 60. 多彩多姿的生活
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (60, 'A Vibrant Life', '多彩多姿的生活', '多彩多姿的生活', 'A Vibrant Life', '多彩多姿的生活', '多彩多姿的生活', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 61. 生活單純
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (61, 'Simple Living', '生活单纯', '生活單純', 'Simple Living', '生活单纯', '生活單純', 'lifestyle', '🌿', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);

  -- ═══ 物質條件 (9 cards: 62-70) ═══
  
  -- 62. 實現財務自由
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (62, 'Financial Independence', '实现财务自由', '實現財務自由', 'Financial Independence', '实现财务自由', '實現財務自由', 'material', '💰', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 63. 有賺錢的能力
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (63, 'Income-Generating Ability', '有赚钱的能力', '有賺錢的能力', 'Income-Generating Ability', '有赚钱的能力', '有賺錢的能力', 'material', '💰', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 64. 賺得錢夠用
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (64, 'Financial Sufficiency', '赚得钱够用', '賺得錢夠用', 'Financial Sufficiency', '赚得钱够用', '賺得錢夠用', 'material', '💰', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 65. 有房有車
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (65, 'Property and Asset (House/Car)', '有房有车', '有房有車', 'Property and Asset (House/Car)', '有房有车', '有房有車', 'material', '💰', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 66. 有收藏的喜好
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (66, 'Collecting Valuables', '有收藏的喜好', '有收藏的喜好', 'Collecting Valuables', '有收藏的喜好', '有收藏的喜好', 'material', '💰', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 67. 潮流的打扮
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (67, 'Personal Style and Fashion', '潮流的打扮', '潮流的打扮', 'Personal Style and Fashion', '潮流的打扮', '潮流的打扮', 'material', '💰', true, 'lifestyle', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 68. 有財富
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (68, 'Wealth', '有财富', '有財富', 'Wealth', '有财富', '有財富', 'material', '💰', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 69. 有權有勢
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (69, 'Power and Influence', '有权有势', '有權有勢', 'Power and Influence', '有权有势', '有權有勢', 'material', '💰', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);
  
  -- 70. 追求升遷/高薪
  INSERT INTO life_cards (sort_order, name_en, name_zh_cn, name_zh_tw, short_description_en, short_description_zh_cn, short_description_zh_tw, category, icon, is_active, spectrum_type, content_locked, created_by, locked_by, locked_at, version_no)
  VALUES (70, 'Career Advancement and High Income', '追求升迁/高薪', '追求升遷/高薪', 'Career Advancement and High Income', '追求升迁/高薪', '追求升遷/高薪', 'material', '💰', true, 'career', false, admin_uid, admin_uid, '1970-01-01T00:00:00+00:00', 1);

  RAISE NOTICE 'Successfully inserted 70 life cards';

  -- ═══════════════════════════════════════════════════
  -- INSERT ZH-TW QUADRANT CONTENTS FOR ALL 70 CARDS
  -- ═══════════════════════════════════════════════════
  
  FOR card_record IN SELECT id, name_zh_tw FROM life_cards ORDER BY sort_order ASC LOOP
    CASE card_record.name_zh_tw
      WHEN '做善事' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '世界充滿需要幫助的人與可以付出的機會', '我存在的價值在於能為他人帶來正向影響', '傾向選擇能助人或創造社會價值的工作', '主動付出、協助他人解決困難、樂於支持', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '不斷的自我探索' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '世界是一個可以持續學習與發現的場域', '我是一個正在成長與進化中的人', '願意嘗試不同角色與可能性，不害怕轉換', '分享成長歷程，也鼓勵他人探索自我', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '做自己' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '環境可能期待一致性，但真實比迎合更重要', '我需要忠於內在價值與感受', '拒絕違背自我原則的工作', '真誠表達立場，不刻意討好', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '公平' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '社會存在不平等，需要被修正', '我應該站在公正的位置上', '重視制度透明與合理報酬', '遇到不公會發聲，強調公平對待', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '有赤子之心' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '世界仍有純真與美好', '保持單純與真誠是力量', '不願過度功利化', '表達情感直接、信任他人', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '內心的平靜' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '外在波動不可避免，但內在可穩定', '情緒管理與內在穩定最重要', '不追求過度競爭或高壓環境', '衝突時傾向冷靜溝通', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '相信信仰的力量' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '世界有超越個人的秩序或意義', '我被更高價值引導', '工作需符合信念與價值觀', '以信念支持他人、提供精神鼓勵', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '有內涵的生命' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '生命應該深刻而非表面化', '我要活得有深度與思考', '選擇有學習與思想含量的工作', '重視深度對話', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '安全感' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '環境充滿風險與不確定', '穩定讓我能發揮', '重視穩定收入與制度保障', '為家人規劃保障與未來', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '享受自由' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '限制會壓抑個體發展', '自主安排時間與方式是基本需求', '偏好彈性工作模式', '尊重彼此空間', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '自主權' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '控制過多會降低效能', '我需要決策權', '偏好自主決策角色', '不喜歡被干涉', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '勇於挑戰/冒險' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '變動是機會', '突破帶來成長', '願意承擔風險', '鼓勵嘗試新事物', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '自信' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '挑戰是可被克服的', '我有能力解決問題', '願意承擔責任', '提供支持與肯定', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '務實踏實' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '結果來自努力', '一步一步完成目標', '重視穩定累積', '負責可靠', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '做善良的人' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '人際關係需要溫度', '品格比成就重要', '不傷害他人原則下競爭', '體貼、關懷', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '欣賞美的事物' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '生活需要美感', '美能滋養心靈', '偏好創意或設計感環境', '分享藝術與美好經驗', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '為夢想奮鬥' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '世界可被改變', '理想值得投入', '願意為目標長期努力', '堅持理念', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '工作有意義' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '工作應連結價值', '我要知道為何而做', '不接受空洞的工作', '談論工作的意義', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '專業能力被認可' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '能力應該被看見', '專業是身份核心', '追求專業精進', '分享成就', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '富正義感' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '不公必須被指出', '我有責任維護正義', '不容忍違法或不公', '替弱者發聲', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '做事勤奮' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '努力帶來成果', '付出是基本態度', '重視責任感', '承擔家庭責任', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '發揮創造力' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '世界可被重新詮釋', '創造是自我表達', '追求創新空間', '提出新點子', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '擁抱改變' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '變化是常態', '調整是生存能力', '願意轉型', '鼓勵適應', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '受人尊重' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '關係建立在尊重上', '我的價值值得被肯定', '重視專業地位', '也尊重他人界線', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '發揮專業的技巧' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '專業是解決問題的工具', '技巧代表能力', '專注精進技能', '以專業協助他人', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '有誠信' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '信任是長期基礎', '言行一致', '重視信用與承諾', '守信用', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '成就感' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '成果是努力的回饋', '完成目標帶來自我肯定', '追求可衡量成果', '分享成功喜悅', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      -- 人際關係
      WHEN '講義氣' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '人與人之間最重要的是忠誠與承諾', '我是重情重義、值得信任的人', '重視團隊情誼勝於個人利益，願意為夥伴承擔', '朋友有難必定相挺，守承諾、不輕易背棄', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '有社會地位' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '社會評價與身份象徵具有重要意義', '我的價值需要被社會肯定', '傾向追求具有頭銜、影響力或地位象徵的角色', '希望讓家人以自己為榮，重視外在形象', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '喜歡交朋友' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '世界充滿可以連結與互動的人', '我從人際互動中獲得能量', '偏好高度互動與社交性的工作', '主動聯繫朋友，經營人際圈', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '影響他人' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '個體可以對他人產生實質改變', '我希望我的存在有影響力', '傾向領導、教育、管理或倡議角色', '主動給建議，帶動群體方向', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '激勵他人' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '人需要鼓舞與支持才能成長', '我希望成為他人的力量來源', '適合培育型、教練型或啟發型角色', '鼓勵低潮中的朋友，給予正向回饋', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '喜歡幫助他人' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '社會需要互助', '付出讓我感到有價值', '偏好服務導向或助人型職業', '主動提供實際協助', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '能談心的朋友' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '關係的深度比數量重要', '我渴望被真正理解', '重視信任感與長期合作關係', '願意分享內在感受，也傾聽他人', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '嚮往美滿的婚姻' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '穩定關係是人生重要基石', '親密關係是長期安全感來源', '職涯選擇會考量婚姻穩定性', '投入經營伴侶關係', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '有火花的愛情關係' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '愛情應該充滿激情與吸引力', '我渴望情感的熱度與新鮮感', '不願因工作犧牲情感活力', '重視浪漫與情感表達', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '親密的家人關係' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '家庭是情感核心', '我與家人之間的連結定義我', '避免長期遠離家庭', '定期陪伴與關心家人', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '孝順' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '對父母的責任是基本倫理', '履行家庭責任是義務', '考量是否能照顧父母', '主動照顧長輩需求', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '陪孩子成長' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '孩子的成長不可逆', '參與孩子生命歷程是重要角色', '選擇可兼顧育兒時間的工作', '參與孩子活動與教育', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '與夥伴一起奮鬥' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '成就來自共同努力', '我不是孤軍奮戰的人', '偏好團隊型環境', '重視合作與共同目標', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '與眾不同' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '多數人選擇平凡，我希望特別', '獨特性是我的價值來源', '不喜歡過度標準化角色', '保有個人風格與立場', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '喜歡參與志願者活動' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '社會議題需要行動', '我願意為公共利益投入', '即使本職工作不同，也願意參與公益', '帶動家人參與公益活動', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      -- 生活風格
      WHEN '追求精神生活' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '物質之外，精神層面的充實更重要', '內在成長與心靈提升是人生核心', '不只追求收入，更重視價值與意義', '喜歡分享閱讀、思想或心靈對話', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '活得久' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '健康與時間是最珍貴的資源', '長期自我照顧是責任', '避免過勞與高風險環境', '注重健康習慣與體檢', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '享受美味' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '生活品質體現在感官體驗', '飲食是一種享受與儀式', '願意為生活品質保留時間與資源', '與親友分享美食、聚餐', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '擁有健康的身體' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '健康是行動力的基礎', '身體狀態影響整體人生品質', '拒絕長期傷害身體的工作型態', '規律作息、關注健康議題', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '長期/固定運動' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '持續性的習慣創造成果', '紀律是自我掌控的表現', '時間管理清晰，重視平衡', '固定安排運動時間', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '生活規律/單純' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '過度複雜會消耗能量', '簡單帶來安心', '偏好穩定明確的工作節奏', '作息規律、生活節制', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '有興趣愛好' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '人生不只工作', '興趣是自我滋養來源', '避免讓工作完全佔據生活', '投入個人興趣活動', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '喜歡外出' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '外界帶來刺激與活力', '移動讓我保持新鮮感', '偏好動態與變化環境', '安排出遊或聚會', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '喜歡發呆' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '空白時間是創造力來源', '放空是一種自我修復', '需要緩衝與反思空間', '保留獨處與沉思時間', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '愛好獨處' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '過多社交會耗能', '獨處能讓我整合自己', '偏好自主與專注型工作', '需要個人空間', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '四處旅行' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '世界值得探索', '旅行擴展視野', '傾向彈性工作模式', '規劃旅行、分享見聞', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '做喜歡的事' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '人生應該忠於熱情', '內在喜悅比外在標準重要', '追求興趣導向的職涯選擇', '優先安排喜歡的活動', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '喜歡戶外和大自然' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '自然能帶來平衡與療癒', '與自然連結讓我恢復能量', '偏好非高度封閉環境', '安排戶外活動', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '有機生活' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '自然與健康密切相關', '選擇純淨生活是一種責任', '避免違背環保或健康原則', '選擇有機食品、環保行動', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '對生活保持熱誠' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '世界充滿可能性', '熱情是生命動力', '傾向投入感強的工作', '感染他人、帶動氣氛', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '喜歡穩定' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '穩定帶來安心', '可預期性讓我安全', '偏好長期規劃', '建立固定生活節奏', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '保持學習' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '知識不斷更新', '成長是一輩子的事', '願意進修與轉型', '閱讀、參加課程', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '多彩多姿的生活' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '單一節奏容易枯燥', '多元體驗帶來滿足', '可能嘗試多重角色', '安排不同活動', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '生活單純' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '簡化能減少壓力', '少即是多', '避免過度競爭與複雜結構', '生活節制、不鋪張', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      -- 物質條件
      WHEN '實現財務自由' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '金錢代表選擇權與自主權', '不被金錢限制才是真正的自由', '願意長期規劃投資與資產配置', '建立理財制度，規劃未來保障', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '有賺錢的能力' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '市場競爭現實，能力決定收入', '收入是能力的證明', '重視提升市場價值與技能變現', '積極尋找收入機會', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '賺得錢夠用' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '物質需求應該被滿足但不必過度', '足夠比過多更重要', '不盲目追求極高薪資', '理性消費，避免財務壓力', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '有房有車' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '穩定資產象徵安全與成功', '擁有固定資產讓我踏實', '願意為資產目標努力', '優先規劃購屋或重大支出', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '有收藏的喜好' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '物件可以承載價值與品味', '收藏是身份與興趣的延伸', '願意為興趣投入資源', '投入時間與金錢在收藏品', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '潮流的打扮' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '外在形象影響社會互動', '穿著是自我表達方式', '重視專業形象與品牌感', '關注流行趨勢，注重外觀', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '有財富' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '財富代表資源與影響力', '累積資產帶來成就感與安全', '傾向高回報產業或創業', '關注投資與資產增值', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '有權有勢' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '權力影響資源分配與決策方向', '掌握權力才能主導局勢', '追求管理層或決策角色', '在群體中扮演主導角色', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      WHEN '追求升遷/高薪' THEN
        INSERT INTO life_card_quadrant_contents (card_id, language, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked, locked_by, locked_at, created_by)
        VALUES (card_record.id, 'zh-TW', '升遷象徵能力與價值提升', '向上流動代表進步', '高度競爭導向，設定明確目標', '投入時間在工作發展，可能壓縮陪伴時間', false, admin_uid, '1970-01-01T00:00:00+00:00', admin_uid);
      ELSE
        RAISE NOTICE 'No quadrant data found for card: %', card_record.name_zh_tw;
    END CASE;
  END LOOP;
  
  RAISE NOTICE 'Successfully inserted quadrant contents for all cards';
END $$;
