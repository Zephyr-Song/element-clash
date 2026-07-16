/**
 * Pets.ts - 12只宠物数据库
 * 定义所有可用的宠物模板
 */

import type { Pet } from './types';

/** 50级HP计算公式: HP = (base * 2 + 60) (简化版，不做IV/EV) */
function calcHp(base: number): number {
  return Math.floor((base * 2 + 60));
}

/** 50级其他属性计算公式: stat = Math.floor((base * 2 + 36)) (简化版) */
function calcStat(base: number): number {
  return Math.floor((base * 2 + 36));
}

export const PETS: Pet[] = [
  {
    id: 1, name: '烈焰狐', emoji: '🦊', element: 'fire',
    baseHp: 70, baseAtk: 55, baseDef: 45, baseSpA: 95, baseSpD: 55, baseSpe: 90,
    trait: 'blaze', skills: [1, 2, 27, 3],
    description: '身披烈焰的灵狐，擅长高速特攻',
  },
  {
    id: 2, name: '熔岩巨人', emoji: '🗿', element: 'fire', secondaryElement: 'rock',
    baseHp: 100, baseAtk: 80, baseDef: 100, baseSpA: 45, baseSpD: 60, baseSpe: 35,
    trait: 'sturdy', skills: [29, 4, 33, 31],
    description: '由熔岩凝聚的巨人，物理防御极高',
    rarity: 'R',
  },
  {
    id: 3, name: '海洋精灵', emoji: '🧜', element: 'water',
    baseHp: 85, baseAtk: 60, baseDef: 65, baseSpA: 85, baseSpD: 75, baseSpe: 80,
    trait: 'damp', skills: [5, 6, 7, 8],
    description: '来自深海的精灵，攻守均衡',
  },
  {
    id: 4, name: '自然守护者', emoji: '🌳', element: 'grass',
    baseHp: 75, baseAtk: 55, baseDef: 75, baseSpA: 90, baseSpD: 85, baseSpe: 60,
    trait: 'natural_cure', skills: [9, 10, 11, 12],
    description: '森林的守护者，擅长控制与恢复',
  },
  {
    id: 5, name: '雷电鸟', emoji: '🦅', element: 'electric',
    baseHp: 65, baseAtk: 50, baseDef: 45, baseSpA: 105, baseSpD: 65, baseSpe: 110,
    trait: 'static', skills: [13, 14, 15, 16],
    description: '雷云中飞翔的神鸟，速度极快',
    rarity: 'SR',
  },
  {
    id: 6, name: '雪原狼', emoji: '🐺', element: 'ice',
    baseHp: 80, baseAtk: 70, baseDef: 60, baseSpA: 100, baseSpD: 70, baseSpe: 75,
    trait: 'ice_body', skills: [17, 18, 19, 20],
    description: '雪原中的苍狼，擅长冰系法术',
  },
  {
    id: 7, name: '幼龙', emoji: '🐉', element: 'dragon',
    baseHp: 75, baseAtk: 85, baseDef: 60, baseSpA: 80, baseSpD: 70, baseSpe: 85,
    trait: 'hustle', skills: [21, 22, 23, 24],
    description: '年幼但潜力无穷的龙族，攻击力强',
  },
  {
    id: 8, name: '岩石巨人', emoji: '🪨', element: 'rock', secondaryElement: 'normal',
    baseHp: 110, baseAtk: 90, baseDef: 130, baseSpA: 40, baseSpD: 50, baseSpe: 30,
    trait: 'iron_body', skills: [25, 30, 26, 32],
    description: '岩石构成的巨人，防御力惊人',
    rarity: 'SSR',
  },
  {
    id: 9, name: '暗影猫', emoji: '🐱', element: 'dark',
    baseHp: 70, baseAtk: 80, baseDef: 55, baseSpA: 85, baseSpD: 65, baseSpe: 95,
    trait: 'stench', skills: [37, 38, 39, 40],
    description: '暗影中潜行的猫，诡术多变',
    rarity: 'SR',
  },
  {
    id: 10, name: '风之翼', emoji: '🐦', element: 'flying',
    baseHp: 72, baseAtk: 95, baseDef: 55, baseSpA: 65, baseSpD: 55, baseSpe: 100,
    trait: 'levitate', skills: [34, 35, 28, 36],
    description: '翱翔天际的飞鸟，速度与物攻出众',
    rarity: 'R',
  },
  {
    id: 11, name: '剧毒蛇', emoji: '🐍', element: 'poison',
    baseHp: 68, baseAtk: 60, baseDef: 55, baseSpA: 85, baseSpD: 75, baseSpe: 70,
    trait: 'adaptability', skills: [41, 42, 43, 44],
    description: '剧毒缠身的巨蛇，善于消耗战',
  },
  {
    id: 12, name: '铁甲机器人', emoji: '🤖', element: 'steel', secondaryElement: 'electric',
    baseHp: 90, baseAtk: 60, baseDef: 120, baseSpA: 55, baseSpD: 120, baseSpe: 40,
    trait: 'shed_skin', skills: [45, 46, 47, 48],
    description: '钢铁铸造的机器人，双防极高',
    rarity: 'SSR',
  },
  // ===== 抽卡限定精灵 =====
  {
    id: 13, name: '暗夜君主', emoji: '🧛', element: 'fire', secondaryElement: 'flying',
    baseHp: 85, baseAtk: 80, baseDef: 60, baseSpA: 110, baseSpD: 65, baseSpe: 105,
    trait: 'blaze', skills: [49, 50, 2, 35],
    description: '暗夜中的烈焰君主，浴火重生焚尽万物',
    rarity: 'SSR',
  },
  {
    id: 14, name: '深海鲲王', emoji: '🐋', element: 'water', secondaryElement: 'dragon',
    baseHp: 110, baseAtk: 70, baseDef: 75, baseSpA: 100, baseSpD: 85, baseSpe: 60,
    trait: 'damp', skills: [51, 52, 5, 8],
    description: '深海中的远古鲲王，呼风唤雨攻守兼备',
    rarity: 'SSR',
  },
  {
    id: 15, name: '雷霆虎', emoji: '🐯', element: 'electric', secondaryElement: 'fighting',
    baseHp: 75, baseAtk: 90, baseDef: 55, baseSpA: 105, baseSpD: 60, baseSpe: 115,
    trait: 'speed_boost', skills: [53, 54, 13, 16],
    description: '雷霆之虎，越战越快',
    rarity: 'SR',
  },
  {
    id: 16, name: '暗影龟', emoji: '🐢', element: 'dark', secondaryElement: 'psychic',
    baseHp: 80, baseAtk: 65, baseDef: 60, baseSpA: 110, baseSpD: 70, baseSpe: 100,
    trait: 'intimidate', skills: [55, 56, 39, 40],
    description: '暗影神龟，上场即威吓对手',
    rarity: 'SR',
  },
  {
    id: 17, name: '四不像', emoji: '🦌', element: 'ground', secondaryElement: 'rock',
    baseHp: 105, baseAtk: 75, baseDef: 110, baseSpA: 55, baseSpD: 85, baseSpe: 35,
    trait: 'sturdy', skills: [57, 58, 31, 32],
    description: '似鹿非鹿的四不像，坚不可摧',
    rarity: 'R',
  },
  {
    id: 18, name: '大地守护者', emoji: '🏔️', element: 'steel', secondaryElement: 'flying',
    baseHp: 78, baseAtk: 100, baseDef: 80, baseSpA: 55, baseSpD: 70, baseSpe: 95,
    trait: 'technician', skills: [59, 60, 34, 35],
    description: '大地之力的守护者，低威力技能伤害惊人',
    rarity: 'R',
  },
  // ===== 通关UR奖励 =====
  {
    id: 19, name: '大圣', emoji: '🐵', element: 'fighting', secondaryElement: 'dragon',
    baseHp: 95, baseAtk: 120, baseDef: 80, baseSpA: 105, baseSpD: 75, baseSpe: 115,
    trait: 'unrivaled', skills: [61, 62, 63, 64],
    description: '齐天大圣孙悟空，金箍棒横扫千军',
    rarity: 'UR',
  },
  // ===== 签到奖励（连续3天） =====
  {
    id: 20, name: '玉兔', emoji: '🐰', element: 'grass', secondaryElement: 'psychic',
    baseHp: 80, baseAtk: 55, baseDef: 70, baseSpA: 95, baseSpD: 85, baseSpe: 100,
    trait: 'natural_cure', skills: [65, 9, 10, 11],
    description: '月宫仙兔，签到3天解锁的灵宠',
    rarity: 'SR',
  },
  // ===== 签到奖励（连续7天） =====
  {
    id: 21, name: '金乌', emoji: '☀️', element: 'fire', secondaryElement: 'flying',
    baseHp: 85, baseAtk: 75, baseDef: 60, baseSpA: 115, baseSpD: 65, baseSpe: 110,
    trait: 'blaze', skills: [49, 50, 35, 63],
    description: '日出扶桑的金乌神鸟，签到7天解锁',
    rarity: 'SSR',
  },
];

/**
 * 根据ID获取宠物
 */
export function getPetById(id: number): Pet | undefined {
  return PETS.find(p => p.id === id);
}
