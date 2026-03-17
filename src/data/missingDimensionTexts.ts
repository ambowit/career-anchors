import type { CardCategory } from "@/data/idealCards";

interface MissingDimensionText {
  title: Record<string, string>;
  questions: Record<string, string[]>;
  closing: Record<string, string>;
}

export const REFLECTION_HEADER: Record<string, string> = {
  "zh-TW": "反思問題",
  "zh-CN": "反思问题",
  en: "Reflection Questions",
};

export const MISSING_DIMENSION_TEXTS: Record<CardCategory, MissingDimensionText> = {
  intrinsic: {
    title: {
      "zh-TW": "內在價值",
      "zh-CN": "内在价值",
      en: "Intrinsic Values",
    },
    questions: {
      "zh-TW": [
        "在你選出的卡片中，有哪些目標其實需要長期的自我成長或能力累積才能達成？",
        "當外在條件改變時，你是否有內在的動機或價值來支撐持續投入？",
        "你的職業選擇主要來自現實條件，還是也包含對「意義感」的追尋？",
        "在未來十年，你是否希望自己在能力或視野上有某種持續的成長？",
      ],
      "zh-CN": [
        "在你选出的卡片中，有哪些目标其实需要长期的自我成长或能力累积才能达成？",
        "当外在条件改变时，你是否有内在的动机或价值来支撑持续投入？",
        "你的职业选择主要来自现实条件，还是也包含对「意义感」的追寻？",
        "在未来十年，你是否希望自己在能力或视野上有某种持续的成长？",
      ],
      en: [
        "Among the cards you selected, which goals actually require long-term self-growth or skill accumulation to achieve?",
        "When external conditions change, do you have internal motivation or values to sustain your commitment?",
        "Are your career choices mainly driven by practical conditions, or do they also include a pursuit of 'meaning'?",
        "In the next decade, do you hope to achieve sustained growth in your abilities or perspective?",
      ],
    },
    closing: {
      "zh-TW": "當某一類價值卡沒有被選入前十順位時，並不代表它對你完全不重要，而可能只是目前的注意力焦點不同。有時候，一些價值會以「支持條件」的形式存在，例如某些生活方式可能需要經濟資源支持，某些職業目標則需要長期成長與人際合作。透過檢視這些未被選入的維度，有助於更全面地理解自己的價值結構。",
      "zh-CN": "当某一类价值卡没有被选入前十顺位时，并不代表它对你完全不重要，而可能只是目前的注意力焦点不同。有时候，一些价值会以「支持条件」的形式存在，例如某些生活方式可能需要经济资源支持，某些职业目标则需要长期成长与人际合作。通过检视这些未被选入的维度，有助于更全面地理解自己的价值结构。",
      en: "When a category of value cards is not selected in the top ten, it doesn't mean it's completely unimportant to you — it may simply reflect your current focus of attention. Sometimes, certain values exist as 'supporting conditions.' For example, some lifestyles may require financial resources, and some career goals require long-term growth and interpersonal cooperation. Examining these unselected dimensions helps you understand your value structure more comprehensively.",
    },
  },
  material: {
    title: {
      "zh-TW": "物質條件",
      "zh-CN": "物质条件",
      en: "Material Conditions",
    },
    questions: {
      "zh-TW": [
        "在你選出的卡片中，有哪些目標其實需要一定的經濟資源才能支持？",
        "你希望的生活方式，大致需要怎樣的經濟基礎？",
        "如果收入不穩定或資源不足，是否會影響你目前重視的其他價值？",
        "在追求理想或興趣時，你是否思考過如何維持基本的經濟安全？",
      ],
      "zh-CN": [
        "在你选出的卡片中，有哪些目标其实需要一定的经济资源才能支持？",
        "你希望的生活方式，大致需要怎样的经济基础？",
        "如果收入不稳定或资源不足，是否会影响你目前重视的其他价值？",
        "在追求理想或兴趣时，你是否思考过如何维持基本的经济安全？",
      ],
      en: [
        "Among the cards you selected, which goals actually require certain financial resources to support?",
        "What kind of economic foundation does your desired lifestyle roughly require?",
        "If income is unstable or resources are insufficient, would it affect other values you currently prioritize?",
        "When pursuing ideals or interests, have you considered how to maintain basic financial security?",
      ],
    },
    closing: {
      "zh-TW": "當某一類價值卡沒有被選入前十順位時，並不代表它對你完全不重要，而可能只是目前的注意力焦點不同。有時候，一些價值會以「支持條件」的形式存在，例如某些生活方式可能需要經濟資源支持，某些職業目標則需要長期成長與人際合作。透過檢視這些未被選入的維度，有助於更全面地理解自己的價值結構。",
      "zh-CN": "当某一类价值卡没有被选入前十顺位时，并不代表它对你完全不重要，而可能只是目前的注意力焦点不同。有时候，一些价值会以「支持条件」的形式存在，例如某些生活方式可能需要经济资源支持，某些职业目标则需要长期成长与人际合作。通过检视这些未被选入的维度，有助于更全面地理解自己的价值结构。",
      en: "When a category of value cards is not selected in the top ten, it doesn't mean it's completely unimportant to you — it may simply reflect your current focus of attention. Sometimes, certain values exist as 'supporting conditions.' For example, some lifestyles may require financial resources, and some career goals require long-term growth and interpersonal cooperation. Examining these unselected dimensions helps you understand your value structure more comprehensively.",
    },
  },
  lifestyle: {
    title: {
      "zh-TW": "生活風格",
      "zh-CN": "生活风格",
      en: "Lifestyle",
    },
    questions: {
      "zh-TW": [
        "你目前的職業選擇或生活方式是否會影響生活節奏或健康狀態？",
        "在追求成就或發展的過程中，你希望保留哪些生活空間？",
        "你理想的的生活節奏是什麼樣子？",
        "長期來看，你是否希望工作與生活之間保持某種平衡？",
      ],
      "zh-CN": [
        "你目前的职业选择或生活方式是否会影响生活节奏或健康状态？",
        "在追求成就或发展的过程中，你希望保留哪些生活空间？",
        "你理想的生活节奏是什么样子？",
        "长期来看，你是否希望工作与生活之间保持某种平衡？",
      ],
      en: [
        "Do your current career choices or lifestyle affect your life rhythm or health?",
        "In the process of pursuing achievement or development, what life spaces do you want to preserve?",
        "What does your ideal life rhythm look like?",
        "In the long run, do you hope to maintain some balance between work and life?",
      ],
    },
    closing: {
      "zh-TW": "當某一類價值卡沒有被選入前十順位時，並不代表它對你完全不重要，而可能只是目前的注意力焦點不同。有時候，一些價值會以「支持條件」的形式存在，例如某些生活方式可能需要經濟資源支持，某些職業目標則需要長期成長與人際合作。透過檢視這些未被選入的維度，有助於更全面地理解自己的價值結構。",
      "zh-CN": "当某一类价值卡没有被选入前十顺位时，并不代表它对你完全不重要，而可能只是目前的注意力焦点不同。有时候，一些价值会以「支持条件」的形式存在，例如某些生活方式可能需要经济资源支持，某些职业目标则需要长期成长与人际合作。通过检视这些未被选入的维度，有助于更全面地理解自己的价值结构。",
      en: "When a category of value cards is not selected in the top ten, it doesn't mean it's completely unimportant to you — it may simply reflect your current focus of attention. Sometimes, certain values exist as 'supporting conditions.' For example, some lifestyles may require financial resources, and some career goals require long-term growth and interpersonal cooperation. Examining these unselected dimensions helps you understand your value structure more comprehensively.",
    },
  },
  interpersonal: {
    title: {
      "zh-TW": "人際關係",
      "zh-CN": "人际关系",
      en: "Interpersonal Relationships",
    },
    questions: {
      "zh-TW": [
        "在你的生活中，有哪些重要的人會影響你的職業選擇？",
        "你的成功或成就是否希望與他人分享或共同完成？",
        "當工作與人際關係出現衝突時，你通常如何取捨？",
        "你是否期待在未來的生活中建立某種穩定的人際支持系統？",
      ],
      "zh-CN": [
        "在你的生活中，有哪些重要的人会影响你的职业选择？",
        "你的成功或成就是否希望与他人分享或共同完成？",
        "当工作与人际关系出现冲突时，你通常如何取舍？",
        "你是否期待在未来的生活中建立某种稳定的人际支持系统？",
      ],
      en: [
        "In your life, which important people influence your career choices?",
        "Do you hope to share or co-create your success or achievements with others?",
        "When work and interpersonal relationships conflict, how do you usually make trade-offs?",
        "Do you look forward to building some kind of stable interpersonal support system in your future life?",
      ],
    },
    closing: {
      "zh-TW": "當某一類價值卡沒有被選入前十順位時，並不代表它對你完全不重要，而可能只是目前的注意力焦點不同。有時候，一些價值會以「支持條件」的形式存在，例如某些生活方式可能需要經濟資源支持，某些職業目標則需要長期成長與人際合作。透過檢視這些未被選入的維度，有助於更全面地理解自己的價值結構。",
      "zh-CN": "当某一类价值卡没有被选入前十顺位时，并不代表它对你完全不重要，而可能只是目前的注意力焦点不同。有时候，一些价值会以「支持条件」的形式存在，例如某些生活方式可能需要经济资源支持，某些职业目标则需要长期成长与人际合作。通过检视这些未被选入的维度，有助于更全面地理解自己的价值结构。",
      en: "When a category of value cards is not selected in the top ten, it doesn't mean it's completely unimportant to you — it may simply reflect your current focus of attention. Sometimes, certain values exist as 'supporting conditions.' For example, some lifestyles may require financial resources, and some career goals require long-term growth and interpersonal cooperation. Examining these unselected dimensions helps you understand your value structure more comprehensively.",
    },
  },
};
