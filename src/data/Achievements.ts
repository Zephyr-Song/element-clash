/**
 * Achievements.ts - 成就模板定义
 * check(save) 在 Storage 埋点中调用，返回是否已满足条件
 */

import type { SaveData } from './types';
import { STAGES, getUnlockedPetIds } from './Stages';
import { PETS } from './Pets';

export interface AchievementTemplate {
  id: number;
  name: string;
  description: string;
  /** 判断是否满足（传入当前存档） */
  check: (save: SaveData) => boolean;
  /** 解锁时一次性奖励金币 */
  rewardCoins: number;
}

/** 成就列表（按解锁难度从易到难排列） */
export const ACHIEVEMENTS: AchievementTemplate[] = [
  {
    id: 1,
    name: '初出茅庐',
    description: '通关第一个关卡',
    check: (s) => s.completedStages.includes(1),
    rewardCoins: 100,
  },
  {
    id: 2,
    name: '四象齐聚',
    description: '集齐朱雀/白虎/青龙/玄武四只神兽',
    check: (s) => [22, 23, 24, 25].every(id => getUnlockedPetIds(s.completedStages).includes(id)),
    rewardCoins: 300,
  },
  {
    id: 3,
    name: '召唤大师',
    description: '累计召唤达到 90 次',
    check: (s) => s.totalDraws >= 90,
    rewardCoins: 200,
  },
  {
    id: 4,
    name: '签到达人',
    description: '连续签到达到 7 天',
    check: (s) => s.checkInStreak >= 7,
    rewardCoins: 150,
  },
  {
    id: 5,
    name: '百战之师',
    description: '累计赢得 10 场战斗',
    check: (s) => s.wins >= 10,
    rewardCoins: 200,
  },
  {
    id: 6,
    name: '全境通关',
    description: '通关全部 10 个关卡',
    check: (s) => s.completedStages.length >= STAGES.length,
    rewardCoins: 500,
  },
  {
    id: 7,
    name: '图鉴大师',
    description: '解锁图鉴中的全部精灵',
    check: (s) => getUnlockedPetIds(s.completedStages).length >= PETS.length,
    rewardCoins: 300,
  },
];
