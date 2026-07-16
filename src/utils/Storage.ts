/**
 * Storage.ts - localStorage 存档管理
 */

import type { SaveData, GachaResult, GachaRarity } from '../data/types';
import { PETS } from '../data/Pets';

const SAVE_KEY = 'element_clash_save';

/** 抽卡精灵ID列表 */
export const GACHA_PET_IDS = [13, 14, 15, 16, 17, 18];

/** 抽卡消耗 */
export const GACHA_SINGLE_COST = 200;
export const GACHA_TEN_COST = 1800;

/** 签到奖励 */
export const CHECKIN_REWARD = 100;
export const CHECKIN_STREAK_BONUS = 50; // 每连续签到天额外+50
export const CHECKIN_STREAK_7_BONUS = 500; // 7天额外奖励

/** SSR保底次数 */
export const PITY_LIMIT = 30;

/** 稀有度权重 */
const RARITY_WEIGHTS: { rarity: GachaRarity; weight: number }[] = [
  { rarity: 'R', weight: 60 },
  { rarity: 'SR', weight: 30 },
  { rarity: 'SSR', weight: 10 },
];

/** 新手福利金币 */
export const NEW_PLAYER_BONUS = 1000;

const DEFAULT_SAVE: SaveData = {
  wins: 0,
  losses: 0,
  completedStages: [],
  soundEnabled: true,
  coins: NEW_PLAYER_BONUS,
  lastCheckIn: '',
  checkInStreak: 0,
  gachaPets: [],
  totalDraws: 0,
  pityCounter: 0,
  gacha90RewardCollected: false,
  checkInRewardCollected: false,
  checkInReward7Collected: false,
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<SaveData> & { urRewardCollected?: boolean };
      const merged = { ...DEFAULT_SAVE, ...data };
      // 兼容旧存档：通关UR奖励(urRewardCollected) -> 累计抽90抽奖励
      if (data.urRewardCollected && !merged.gacha90RewardCollected) {
        merged.gacha90RewardCollected = true;
      }
      return merged;
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SAVE };
}

export function saveSave(data: SaveData): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export function updateRecord(won: boolean): SaveData {
  const save = loadSave();
  if (won) { save.wins++; }
  else { save.losses++; }
  saveSave(save);
  return save;
}

/** 检查关卡是否已通关 */
export function isStageCompleted(stageId: number): boolean {
  const save = loadSave();
  return save.completedStages.includes(stageId);
}

/** 标记关卡通关（如果尚未记录） */
export function completeStage(stageId: number): void {
  const save = loadSave();
  if (!save.completedStages.includes(stageId)) {
    save.completedStages.push(stageId);
    saveSave(save);
  }
}

/** 检查今天是否已签到 */
export function hasCheckedInToday(): boolean {
  const save = loadSave();
  if (!save.lastCheckIn) return false;
  const today = new Date().toISOString().slice(0, 10);
  return save.lastCheckIn === today;
}

/** 签到，返回获得的金币数 */
export function checkIn(): number {
  const save = loadSave();
  const today = new Date().toISOString().slice(0, 10);
  if (save.lastCheckIn === today) return 0; // 已签到

  // 计算连续签到
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (save.lastCheckIn === yesterday) {
    save.checkInStreak++;
  } else {
    save.checkInStreak = 1;
  }

  let reward = CHECKIN_REWARD + CHECKIN_STREAK_BONUS * (save.checkInStreak - 1);
  // 7天额外奖励
  if (save.checkInStreak >= 7 && save.checkInStreak % 7 === 0) {
    reward += CHECKIN_STREAK_7_BONUS;
  }

  save.coins += reward;
  save.lastCheckIn = today;
  saveSave(save);
  return reward;
}

/** 获取签到信息 */
export function getCheckInInfo(): { streak: number; canCheckIn: boolean; todayReward: number } {
  const save = loadSave();
  const canCheckIn = !hasCheckedInToday();
  let reward = CHECKIN_REWARD + CHECKIN_STREAK_BONUS * save.checkInStreak;
  const nextStreak = canCheckIn ? save.checkInStreak + 1 : save.checkInStreak;
  if (nextStreak >= 7 && nextStreak % 7 === 0) {
    reward += CHECKIN_STREAK_7_BONUS;
  }
  return { streak: save.checkInStreak, canCheckIn, todayReward: reward };
}

/** 添加金币 */
export function addCoins(amount: number): void {
  const save = loadSave();
  save.coins += amount;
  saveSave(save);
}

/** 扣除金币，返回是否成功 */
export function spendCoins(amount: number): boolean {
  const save = loadSave();
  if (save.coins < amount) return false;
  save.coins -= amount;
  saveSave(save);
  return true;
}

/** 抽卡（单抽） */
export function drawGachaSingle(): GachaResult {
  const save = loadSave();
  const result = rollGacha(save.gachaPets);
  if (!save.gachaPets.includes(result.petId)) {
    save.gachaPets.push(result.petId);
  }
  save.totalDraws += 1; // 累计抽卡次数+1
  saveSave(save);
  return result;
}

/** 抽卡（十连） */
export function drawGachaTen(): GachaResult[] {
  const save = loadSave();
  const results: GachaResult[] = [];
  for (let i = 0; i < 10; i++) {
    const result = rollGacha([...save.gachaPets, ...results.map(r => r.petId)]);
    results.push(result);
  }
  for (const r of results) {
    if (!save.gachaPets.includes(r.petId)) {
      save.gachaPets.push(r.petId);
    }
  }
  save.totalDraws += 10; // 十连计10次
  saveSave(save);
  return results;
}

/** 掷骰决定抽卡结果 */
function rollGacha(ownedPetIds: number[]): GachaResult {
  const totalWeight = RARITY_WEIGHTS.reduce((sum, rw) => sum + rw.weight, 0);
  let roll = Math.random() * totalWeight;
  let selectedRarity: GachaRarity = 'R';
  const ssrWeight = RARITY_WEIGHTS.find(rw => rw.rarity === 'SSR')!.weight;
  if (roll < ssrWeight) {
    selectedRarity = 'SSR';
  } else if (roll < ssrWeight + RARITY_WEIGHTS.find(rw => rw.rarity === 'SR')!.weight) {
    selectedRarity = 'SR';
  } else {
    selectedRarity = 'R';
  }
  return rollPetByRarity(selectedRarity, ownedPetIds);
}

/** 根据稀有度随机选一只精灵 */
function rollPetByRarity(rarity: GachaRarity, ownedPetIds: number[]): GachaResult {
  const petsOfRarity = PETS.filter(p => GACHA_PET_IDS.includes(p.id) && p.rarity === rarity);
  if (petsOfRarity.length === 0) {
    // 没有该稀有度的精灵，降级
    if (rarity === 'SSR') return rollPetByRarity('SR', ownedPetIds);
    if (rarity === 'SR') return rollPetByRarity('R', ownedPetIds);
  }
  const pet = petsOfRarity[Math.floor(Math.random() * petsOfRarity.length)];
  const isNew = !ownedPetIds.includes(pet.id);
  return { petId: pet.id, rarity, isNew };
}

// ==================== 累计抽卡里程碑奖励 ====================

/** 累计抽卡里程碑奖励宠物ID（大圣） */
export const GACHA_90_PET_ID = 19;
/** 解锁所需累计抽卡次数 */
export const GACHA_90_DRAWS = 90;

/** 检查是否满足累计抽90抽奖励条件且未领取 */
export function canClaimGacha90(): boolean {
  const save = loadSave();
  return save.totalDraws >= GACHA_90_DRAWS && !save.gacha90RewardCollected;
}

/** 领取累计抽90抽奖励（永久记录已领取） */
export function claimGacha90(): void {
  const save = loadSave();
  save.gacha90RewardCollected = true;
  saveSave(save);
}

// ==================== 签到奖励精灵 ====================

/** 签到3天奖励精灵ID */
export const CHECKIN_REWARD_PET_ID = 20;
/** 签到3天所需连续天数 */
export const CHECKIN_REWARD_STREAK = 3;
/** 签到7天奖励精灵ID */
export const CHECKIN_REWARD_PET_ID_7 = 21;
/** 签到7天所需连续天数 */
export const CHECKIN_REWARD_STREAK_7 = 7;

/** 检查是否可以领取签到3天奖励 */
export function canClaimCheckInReward(): boolean {
  const save = loadSave();
  return save.checkInStreak >= CHECKIN_REWARD_STREAK && !save.checkInRewardCollected;
}

/** 领取签到3天奖励 */
export function claimCheckInReward(): void {
  const save = loadSave();
  save.checkInRewardCollected = true;
  saveSave(save);
}

/** 检查是否可以领取签到7天奖励 */
export function canClaimCheckInReward7(): boolean {
  const save = loadSave();
  return save.checkInStreak >= CHECKIN_REWARD_STREAK_7 && !save.checkInReward7Collected;
}

/** 领取签到7天奖励 */
export function claimCheckInReward7(): void {
  const save = loadSave();
  save.checkInReward7Collected = true;
  saveSave(save);
}

