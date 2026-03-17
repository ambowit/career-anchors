-- Update anchor_score_ranges: fix 65-79 range labels across ALL versions
-- Old: 高敏感度；僅能短期妥協 / 高敏感度；仅能短期妥协
-- New: 高敏感度；可持續發展 / 高敏感度；可持续发展

UPDATE anchor_score_ranges
SET
  range_label_en = 'High sensitivity; sustainable development',
  range_label_zh_tw = '高敏感度；可持續發展',
  range_label_zh_cn = '高敏感度；可持续发展',
  range_description_en = 'High sensitivity; sustainable development',
  range_description_zh_tw = '高敏感度；可持續發展',
  range_description_zh_cn = '高敏感度；可持续发展'
WHERE score_min = 65 AND score_max = 79;
