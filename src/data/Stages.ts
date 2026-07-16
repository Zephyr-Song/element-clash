/**
 * Stages.ts - 关卡数据
 * 6个递增难度的关卡，每关有固定敌方队伍和通关奖励精灵
 */

import type { Stage, Difficulty } from './types';
import { PETS } from './Pets';
import { loadSave, GACHA_PET_IDS, GACHA_90_PET_ID, CHECKIN_REWARD_PET_ID, CHECKIN_REWARD_PET_ID_7 } from '../utils/Storage';

export const STAGES: Stage[] = [
  {
    id: 1,
    name: '新手草原',
    emoji: '🌿',
    description: '风和日丽的草原，适合新手磨练战斗技巧',
    enemyPetIds: [3, 4, 1],    // 海洋精灵、自然守护者、烈焰狐
    difficulty: 'easy' as Difficulty,
    rewardPetId: 2,            // 熔岩巨人
  },
  {
    id: 2,
    name: '烈焰火山',
    emoji: '🌋',
    description: '熔岩翻涌的火山地带，火系宠物称霸一方',
    enemyPetIds: [1, 2, 11],   // 烈焰狐、熔岩巨人、剧毒蛇
    difficulty: 'easy' as Difficulty,
    rewardPetId: 10,           // 风之翼
  },
  {
    id: 3,
    name: '雷鸣之巅',
    emoji: '⚡',
    description: '雷云密布的山巅，电系与钢系联手出击',
    enemyPetIds: [5, 10, 12],  // 雷电鸟、风之翼、铁甲机器人
    difficulty: 'medium' as Difficulty,
    rewardPetId: 5,            // 雷电鸟
  },
  {
    id: 4,
    name: '暗夜幽林',
    emoji: '🌙',
    description: '月光下的幽暗森林，暗影与毒雾交织',
    enemyPetIds: [9, 11, 6],   // 暗影猫、剧毒蛇、雪原狼
    difficulty: 'medium' as Difficulty,
    rewardPetId: 9,            // 暗影猫
  },
  {
    id: 5,
    name: '冰封龙谷',
    emoji: '🐉',
    description: '冰雪覆盖的远古龙谷，龙族与岩石守卫沉睡于此',
    enemyPetIds: [7, 8, 6],    // 幼龙、岩石巨人、雪原狼
    difficulty: 'hard' as Difficulty,
    rewardPetId: 8,            // 岩石巨人
  },
  {
    id: 6,
    name: '终极试炼',
    emoji: '👑',
    description: '最强训练家的最终考验，只有精英才能通过',
    enemyPetIds: [5, 7, 2],    // 雷电鸟、幼龙、熔岩巨人
    difficulty: 'hard' as Difficulty,
    rewardPetId: 12,           // 铁甲机器人
  },
  // ===== 挑战关卡（极限难度，需通关前6关后逐关解锁） =====
  {
    id: 7,
    name: '神兽试炼·朱雀',
    emoji: '🔥',
    description: '烈焰神鸟朱雀降临，唯有强者能将其收服',
    enemyPetIds: [22, 14, 21],   // 朱雀、深海鲲王、金乌
    difficulty: 'insane' as Difficulty,
    rewardPetId: 22,             // 朱雀
  },
  {
    id: 8,
    name: '神兽试炼·白虎',
    emoji: '⚡',
    description: '西方白虎咆哮，金铁交织的死亡风暴',
    enemyPetIds: [24, 15, 17],   // 白虎、雷霆虎、四不像
    difficulty: 'insane' as Difficulty,
    rewardPetId: 24,             // 白虎
  },
  {
    id: 9,
    name: '四象归一·终极试炼',
    emoji: '🌟',
    description: '青龙、玄武、麒麟齐聚，四象之力的终极考验',
    enemyPetIds: [25, 23, 26],   // 青龙、玄武、麒麟
    difficulty: 'insane' as Difficulty,
    rewardPetId: 26,             // 麒麟
  },
];

/** 初始可用精灵ID（无需通关解锁） */
export const STARTER_PET_IDS: number[] = [1, 3, 4, 6, 7, 11];

/**
 * 根据已通关关卡，返回已解锁的精灵ID列表
 * 包含初始精灵 + 通关奖励 + 抽卡获得
 */
export function getUnlockedPetIds(completedStages: number[]): number[] {
  const save = loadSave();
  const unlocked = new Set(STARTER_PET_IDS);
  for (const stageId of completedStages) {
    const stage = STAGES.find(s => s.id === stageId);
    if (stage) unlocked.add(stage.rewardPetId);
  }
  // 加入抽卡获得的精灵
  for (const pid of save.gachaPets) {
    if (GACHA_PET_IDS.includes(pid)) unlocked.add(pid);
  }
  // 累计抽90抽里程碑奖励（已领取才解锁）
  if (save.gacha90RewardCollected) unlocked.add(GACHA_90_PET_ID);
  // 签到奖励（已领取才解锁）
  if (save.checkInRewardCollected) unlocked.add(CHECKIN_REWARD_PET_ID);
  if (save.checkInReward7Collected) unlocked.add(CHECKIN_REWARD_PET_ID_7);
  return [...unlocked];
}

/**
 * 根据ID获取关卡
 */
export function getStageById(id: number): Stage | undefined {
  return STAGES.find(s => s.id === id);
}

/**
 * 根据关卡ID获取敌方宠物数组
 */
export function getEnemyPets(stageId: number): import('./types').Pet[] {
  const stage = getStageById(stageId);
  if (!stage) return [];
  return stage.enemyPetIds
    .map(pid => PETS.find(p => p.id === pid))
    .filter((p): p is import('./types').Pet => p !== undefined);
}
