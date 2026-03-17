-- Update anchor_score_ranges: rename 80-100 range labels from old to new
UPDATE anchor_score_ranges
SET
  range_label_en = 'Core Strength Anchor',
  range_label_zh_tw = '核心優勢錨點',
  range_label_zh_cn = '核心优势锚点',
  range_description_en = 'Core Strength Anchor',
  range_description_zh_tw = '核心優勢錨點',
  range_description_zh_cn = '核心优势锚点'
WHERE score_min = 80 AND score_max = 100;