/**
 * Skills.ts - 全量技能数据库
 * 定义游戏中所有30个技能的详细数据
 */

import type { Skill } from './types';

export const SKILLS: Skill[] = [
  // ===== 火系技能 =====
  {
    id: 1, name: '火焰喷射', element: 'fire',
    power: 90, pp: 15, maxPp: 15, accuracy: 100,
    category: 'special', priority: 0, isContact: false,
  },
  {
    id: 2, name: '喷射火焰', element: 'fire',
    power: 85, pp: 15, maxPp: 15, accuracy: 100,
    category: 'special', priority: 0, statusInflict: 'burn',
    statusInflictChance: 0.1,
  },
  {
    id: 3, name: '火花', element: 'fire',
    power: 40, pp: 25, maxPp: 25, accuracy: 100,
    category: 'special', priority: 0,
  },
  {
    id: 4, name: '火焰漩涡', element: 'fire',
    power: 75, pp: 15, maxPp: 15, accuracy: 100,
    category: 'special', priority: 0,
    effect: '束缚(2-5回合)',
  },

  // ===== 水系技能 =====
  {
    id: 5, name: '水炮', element: 'water',
    power: 110, pp: 5, maxPp: 5, accuracy: 80,
    category: 'special', priority: 0,
  },
  {
    id: 6, name: '泡沫光线', element: 'water',
    power: 65, pp: 20, maxPp: 20, accuracy: 100,
    category: 'special', priority: 0,
    statChanges: { spA: -1 },
  },
  {
    id: 7, name: '冰冻之光', element: 'ice',
    power: 95, pp: 10, maxPp: 10, accuracy: 100,
    category: 'special', priority: 0, statusInflict: 'freeze',
    statusInflictChance: 0.1,
  },
  {
    id: 8, name: '水流冲击', element: 'water',
    power: 60, pp: 20, maxPp: 20, accuracy: 100,
    category: 'special', priority: 0,
  },

  // ===== 草系技能 =====
  {
    id: 9, name: '魔法藤鞭', element: 'grass',
    power: 45, pp: 25, maxPp: 25, accuracy: 100,
    category: 'physical', priority: 0,
    statChanges: { accuracy: -1 },
  },
  {
    id: 10, name: '魔法反射', element: 'psychic',
    power: 0, pp: 20, maxPp: 20, accuracy: 100,
    category: 'status', priority: 4,
    effect: '反弹本回合受到的变化技能',
  },
  {
    id: 11, name: '寄生种子', element: 'grass',
    power: 0, pp: 10, maxPp: 10, accuracy: 90,
    category: 'status', priority: 0,
    effect: '每回合吸目标1/8HP', drainRatio: 0.125,
  },
  {
    id: 12, name: '阳光烈焰', element: 'grass',
    power: 120, pp: 10, maxPp: 10, accuracy: 100,
    category: 'special', priority: 0, chargeTurn: true,
  },

  // ===== 电系技能 =====
  {
    id: 13, name: '雷电', element: 'electric',
    power: 65, pp: 20, maxPp: 20, accuracy: 100,
    category: 'special', priority: 0, statusInflict: 'paralyze',
    statusInflictChance: 0.1,
  },
  {
    id: 14, name: '电磁波', element: 'electric',
    power: 0, pp: 20, maxPp: 20, accuracy: 90,
    category: 'status', priority: 0, statusInflict: 'paralyze',
  },
  {
    id: 15, name: '高速移动', element: 'psychic',
    power: 0, pp: 30, maxPp: 30, accuracy: 100,
    category: 'status', priority: 0,
    statChanges: { spe: 2 },
  },
  {
    id: 16, name: '十万伏特', element: 'electric',
    power: 90, pp: 15, maxPp: 15, accuracy: 100,
    category: 'special', priority: 0,
  },

  // ===== 冰系技能 =====
  {
    id: 17, name: '冰雹', element: 'ice',
    power: 80, pp: 20, maxPp: 20, accuracy: 100,
    category: 'physical', priority: 0,
  },
  {
    id: 18, name: '暴风雪', element: 'ice',
    power: 110, pp: 5, maxPp: 5, accuracy: 70,
    category: 'special', priority: 0, statusInflict: 'freeze',
    statusInflictChance: 0.1,
  },
  {
    id: 19, name: '极光光线', element: 'ice',
    power: 65, pp: 20, maxPp: 20, accuracy: 100,
    category: 'special', priority: 0,
  },
  {
    id: 20, name: '咬碎', element: 'dark',
    power: 60, pp: 25, maxPp: 25, accuracy: 100,
    category: 'physical', priority: 0,
    statChanges: { spD: -2 },
  },

  // ===== 龙系技能 =====
  {
    id: 21, name: '龙息', element: 'dragon',
    power: 60, pp: 20, maxPp: 20, accuracy: 100,
    category: 'special', priority: 0, statusInflict: 'paralyze',
    statusInflictChance: 0.1,
  },
  {
    id: 22, name: '逆鳞', element: 'dragon',
    power: 120, pp: 10, maxPp: 10, accuracy: 100,
    category: 'physical', priority: 0, statusInflict: 'confuse',
    recoil: true, recoilRatio: 0.33,
  },
  {
    id: 23, name: '磨爪', element: 'dark',
    power: 0, pp: 20, maxPp: 20, accuracy: 100,
    category: 'status', priority: 0,
    statChanges: { atk: 1 },
  },

  // ===== 普通系技能 =====
  {
    id: 24, name: '破坏光线', element: 'normal',
    power: 150, pp: 5, maxPp: 5, accuracy: 90,
    category: 'special', priority: 0,
  },
  {
    id: 25, name: '猛撞', element: 'normal',
    power: 90, pp: 20, maxPp: 20, accuracy: 85,
    category: 'physical', priority: 0,
    recoil: true, recoilRatio: 0.25, isContact: true,
  },
  {
    id: 26, name: '变圆', element: 'normal',
    power: 0, pp: 40, maxPp: 40, accuracy: 100,
    category: 'status', priority: 0,
    statChanges: { def: 2 },
  },
  {
    id: 27, name: '神秘力量', element: 'normal',
    power: 0, pp: 20, maxPp: 20, accuracy: 100,
    category: 'status', priority: 0,
    statChanges: { spA: 1 },
  },
  {
    id: 28, name: '高速星星', element: 'normal',
    power: 60, pp: 20, maxPp: 20, accuracy: 100,
    category: 'special', priority: 0, alwaysHit: true,
  },
  {
    id: 29, name: '猛击', element: 'normal',
    power: 80, pp: 20, maxPp: 20, accuracy: 75,
    category: 'physical', priority: 0,
  },

  // ===== 岩系技能 =====
  {
    id: 30, name: '岩石封闭', element: 'rock',
    power: 60, pp: 15, maxPp: 15, accuracy: 95,
    category: 'physical', priority: 0,
    statChanges: { spe: -2 },
  },

  // ===== 地系技能 =====
  {
    id: 31, name: '大地震', element: 'ground',
    power: 100, pp: 10, maxPp: 10, accuracy: 100,
    category: 'physical', priority: -1,
  },
  {
    id: 32, name: '地震', element: 'ground',
    power: 100, pp: 10, maxPp: 10, accuracy: 100,
    category: 'physical', priority: -1,
  },

  // ===== 格斗系技能 =====
  {
    id: 33, name: '健美', element: 'fighting',
    power: 0, pp: 20, maxPp: 20, accuracy: 100,
    category: 'status', priority: 0,
    statChanges: { atk: 1, def: 1 },
  },

  // ===== 飞行系技能 =====
  {
    id: 34, name: '翼击', element: 'flying',
    power: 60, pp: 35, maxPp: 35, accuracy: 100,
    category: 'physical', priority: 0, isContact: true,
  },
  {
    id: 35, name: '空气斩', element: 'flying',
    power: 75, pp: 15, maxPp: 15, accuracy: 95,
    category: 'physical', priority: 0,
  },
  {
    id: 36, name: '旋风', element: 'flying',
    power: 0, pp: 20, maxPp: 20, accuracy: 100,
    category: 'status', priority: -6, forceSwitch: true,
  },

  // ===== 恶系技能 =====
  {
    id: 37, name: '暗影爪', element: 'dark',
    power: 70, pp: 15, maxPp: 15, accuracy: 100,
    category: 'physical', priority: 0,
    critRate: 0.25, isContact: true,
  },
  {
    id: 38, name: '假动作', element: 'dark',
    power: 40, pp: 10, maxPp: 10, accuracy: 100,
    category: 'physical', priority: 3, isContact: true,
  },
  {
    id: 39, name: '诡计', element: 'dark',
    power: 0, pp: 20, maxPp: 20, accuracy: 100,
    category: 'status', priority: 0,
    statChanges: { spA: 2, spe: 1 },
  },

  // ===== 超能系技能 =====
  {
    id: 40, name: '噬梦', element: 'psychic',
    power: 0, pp: 15, maxPp: 15, accuracy: 100,
    category: 'status', priority: 0,
    healRatio: 0.5, drainRatio: 0.5,
  },

  // ===== 毒系技能 =====
  {
    id: 41, name: '毒针', element: 'poison',
    power: 15, pp: 35, maxPp: 35, accuracy: 100,
    category: 'physical', priority: 0, statusInflict: 'poison',
    statusInflictChance: 0.3,
  },
  {
    id: 42, name: '污泥炸弹', element: 'poison',
    power: 90, pp: 10, maxPp: 10, accuracy: 100,
    category: 'special', priority: 0,
    statChanges: { spD: -2 },
  },
  {
    id: 43, name: '溶解', element: 'poison',
    power: 0, pp: 20, maxPp: 20, accuracy: 100,
    category: 'status', priority: 0,
    statChanges: { spD: -2 },
  },
  {
    id: 44, name: '剧毒牙', element: 'poison',
    power: 50, pp: 15, maxPp: 15, accuracy: 100,
    category: 'physical', priority: 0, statusInflict: 'poison',
    statusInflictChance: 0.5,
  },

  // ===== 钢系技能 =====
  {
    id: 45, name: '金属音', element: 'steel',
    power: 0, pp: 40, maxPp: 40, accuracy: 85,
    category: 'status', priority: 0,
    statChanges: { spD: -2 },
  },
  {
    id: 46, name: '加农光炮', element: 'steel',
    power: 120, pp: 5, maxPp: 5, accuracy: 80,
    category: 'special', priority: 0,
  },
  {
    id: 47, name: '充电光束', element: 'electric',
    power: 50, pp: 10, maxPp: 10, accuracy: 90,
    category: 'special', priority: 0,
    statChanges: { spA: 1 },
  },
  {
    id: 48, name: '自我再生', element: 'normal',
    power: 0, pp: 10, maxPp: 10, accuracy: 100,
    category: 'status', priority: 0,
    healRatio: 0.5,
  },

  // ===== 新增技能（抽卡精灵用） =====
  // 炽焰凰技能
  {
    id: 49, name: '神圣之火', element: 'fire',
    power: 100, pp: 5, maxPp: 5, accuracy: 95,
    category: 'special', priority: 0, statusInflict: 'burn',
    statusInflictChance: 0.5,
  },
  {
    id: 50, name: '烈焰冲锋', element: 'fire',
    power: 120, pp: 15, maxPp: 15, accuracy: 100,
    category: 'physical', priority: 0, recoil: true, recoilRatio: 0.33,
    statusInflict: 'burn', statusInflictChance: 0.1, isContact: true,
  },
  // 深海霸主技能
  {
    id: 51, name: '潮汐之力', element: 'water',
    power: 110, pp: 10, maxPp: 10, accuracy: 85,
    category: 'special', priority: 0,
  },
  {
    id: 52, name: '龙之波动', element: 'dragon',
    power: 85, pp: 10, maxPp: 10, accuracy: 100,
    category: 'special', priority: 0,
  },
  // 雷神技能
  {
    id: 53, name: '雷霆万钧', element: 'electric',
    power: 130, pp: 5, maxPp: 5, accuracy: 85,
    category: 'special', priority: 0, statusInflict: 'paralyze',
    statusInflictChance: 0.3,
  },
  {
    id: 54, name: '闪电拳', element: 'electric',
    power: 75, pp: 15, maxPp: 15, accuracy: 100,
    category: 'physical', priority: 0, statusInflict: 'paralyze',
    statusInflictChance: 0.1, isContact: true,
  },
  // 暗夜君主技能
  {
    id: 55, name: '暗影球', element: 'dark',
    power: 80, pp: 15, maxPp: 15, accuracy: 100,
    category: 'special', priority: 0, statChanges: { spD: -1 },
  },
  {
    id: 56, name: '精神强念', element: 'psychic',
    power: 90, pp: 10, maxPp: 10, accuracy: 100,
    category: 'special', priority: 0, statChanges: { spD: -1 },
  },
  // 大地守护者技能
  {
    id: 57, name: '大地之力', element: 'ground',
    power: 90, pp: 10, maxPp: 10, accuracy: 100,
    category: 'special', priority: 0, statChanges: { spD: -1 },
  },
  {
    id: 58, name: '沙尘暴', element: 'rock',
    power: 0, pp: 10, maxPp: 10, accuracy: 100,
    category: 'status', priority: 0,
    statChanges: { def: 2, spD: 1 },
  },
  // 钢铁战鹰技能
  {
    id: 59, name: '铁头', element: 'steel',
    power: 80, pp: 15, maxPp: 15, accuracy: 100,
    category: 'physical', priority: 0, statusInflict: 'freeze',
    statusInflictChance: 0.3, isContact: true,
  },
  {
    id: 60, name: '金属爆破', element: 'steel',
    power: 100, pp: 10, maxPp: 10, accuracy: 95,
    category: 'physical', priority: 0,
  },
  // ===== 大圣专属技能 (UR) =====
  {
    id: 61, name: '金箍棒', element: 'fighting',
    power: 120, pp: 5, maxPp: 5, accuracy: 90,
    category: 'physical', priority: 0,
    critRate: 0.125, isContact: true,
  },
  {
    id: 62, name: '筋斗云', element: 'flying',
    power: 85, pp: 10, maxPp: 10, accuracy: 100,
    category: 'physical', priority: 1, isContact: true,
  },
  {
    id: 63, name: '火眼金睛', element: 'fire',
    power: 90, pp: 15, maxPp: 15, accuracy: 100,
    category: 'special', priority: 0,
    statusInflict: 'burn', statusInflictChance: 0.3,
  },
  {
    id: 64, name: '七十二变', element: 'psychic',
    power: 0, pp: 10, maxPp: 10, accuracy: 100,
    category: 'status', priority: 0,
    statChanges: { atk: 2, spe: 1 },
  },
  // ===== 玉兔技能 =====
  {
    id: 65, name: '月光', element: 'psychic',
    power: 80, pp: 15, maxPp: 15, accuracy: 100,
    category: 'special', priority: 0,
    healRatio: 0.5, drainRatio: 0.5,
  },
];

/**
 * 根据ID获取技能
 */
export function getSkillById(id: number): Skill | undefined {
  return SKILLS.find(s => s.id === id);
}
