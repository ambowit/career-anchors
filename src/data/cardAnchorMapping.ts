/**
 * Card → Career Anchor Mapping
 *
 * Maps each of the 70 Ideal Life Cards to its corresponding
 * Career Anchor code. This mapping is the foundation for the
 * Fusion Structure Charts that show how life values distribute
 * across career development dimensions.
 *
 * Source: SCPC Professional Assessment System mapping table.
 */

import type { AnchorCode } from "@/lib/fusionEngineV3";

/**
 * Card ID (1-70) → Career Anchor code mapping.
 * Every card maps to exactly one primary anchor.
 */
export const CARD_ANCHOR_MAP: Record<number, AnchorCode> = {
  // ── Intrinsic Values (内在价值) ──
  1:  "SV",  // 做善事
  2:  "AU",  // 不断的自我探索
  3:  "AU",  // 做自己
  4:  "SV",  // 公平
  5:  "SV",  // 有赤子之心
  6:  "LS",  // 内心的平静
  7:  "SE",  // 相信信仰的力量
  8:  "SV",  // 有内涵的生命
  9:  "SE",  // 安全感
  10: "AU",  // 享受自由
  11: "AU",  // 自主权
  12: "CH",  // 勇于挑战/冒险
  13: "GM",  // 自信
  14: "SE",  // 务实踏实
  15: "SV",  // 做善良的人
  16: "LS",  // 欣赏美的事物
  17: "CH",  // 为梦想奋斗
  18: "SV",  // 工作有意义
  19: "TF",  // 专业能力被认可
  20: "SV",  // 富正义感
  21: "TF",  // 做事勤奋
  22: "EC",  // 发挥创造力
  23: "EC",  // 拥抱改变
  24: "GM",  // 受人尊重
  25: "TF",  // 发挥专业的技巧
  26: "SV",  // 有诚信
  27: "GM",  // 成就感

  // ── Interpersonal Relationships (人际关系) ──
  28: "SV",  // 讲义气
  29: "GM",  // 有社会地位
  30: "GM",  // 喜欢交朋友
  31: "GM",  // 影响他人
  32: "GM",  // 激励他人
  33: "SV",  // 喜欢帮助他人
  34: "LS",  // 能谈心的朋友
  35: "LS",  // 向往美满的婚姻
  36: "LS",  // 有火花的爱情关系
  37: "LS",  // 亲密的家人关系
  38: "SV",  // 孝顺
  39: "LS",  // 陪孩子成长
  40: "GM",  // 与伙伴一起奋斗
  41: "EC",  // 与众不同
  42: "SV",  // 喜欢参与志愿者活动

  // ── Lifestyle (生活方式) ──
  43: "SV",  // 追求精神生活
  44: "LS",  // 活得久
  45: "LS",  // 享受美味
  46: "LS",  // 拥有健康的身体
  47: "LS",  // 长期/固定运动
  48: "LS",  // 生活规律/单纯
  49: "LS",  // 有兴趣爱好
  50: "AU",  // 喜欢外出
  51: "AU",  // 喜欢发呆
  52: "AU",  // 爱好独处
  53: "AU",  // 四处旅行
  54: "AU",  // 做喜欢的事
  55: "LS",  // 喜欢户外和大自然
  56: "LS",  // 有机生活
  57: "CH",  // 对生活保持热忱
  58: "SE",  // 喜欢稳定
  59: "TF",  // 保持学习
  60: "AU",  // 多彩多姿的生活
  61: "LS",  // 生活单纯

  // ── Material Conditions (物质条件) ──
  62: "SE",  // 实现财务自由
  63: "TF",  // 有赚钱的能力
  64: "SE",  // 赚得钱够用
  65: "SE",  // 有房有车
  66: "LS",  // 有收藏的喜好
  67: "LS",  // 潮流的打扮
  68: "SE",  // 有财富
  69: "GM",  // 有权有势
  70: "GM",  // 追求升迁/高薪
};

/**
 * Get the career anchor code for a given card ID.
 * Returns undefined if the card ID is not in the mapping.
 */
export function getCardAnchor(cardId: number): AnchorCode | undefined {
  return CARD_ANCHOR_MAP[cardId];
}
