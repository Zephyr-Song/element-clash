/**
 * BattleState.ts - 完整战斗状态接口+初始状态工厂
 * 管理战斗运行时状态
 */

import type { Pet, PetBattleState, BattleState, BattleStats, StatStages } from '../data/types';
import { getSkillById } from '../data/Skills';

/** 50级HP计算公式 */
function calcMaxHp(baseHp: number): number {
  return Math.floor((baseHp * 2 + 110));
}

/** 50级其他属性计算公式 */
function calcStat(baseStat: number): number {
  return Math.floor((baseStat * 2 + 36));
}

/** 创建空白能力等级 */
function createDefaultStages(): StatStages {
  return { atk: 0, def: 0, spA: 0, spD: 0, spe: 0, accuracy: 0, evasion: 0 };
}

/**
 * 从宠物模板创建战斗状态
 */
export function createPetBattleState(pet: Pet): PetBattleState {
  return {
    pet,
    currentHp: calcMaxHp(pet.baseHp),
    maxHp: calcMaxHp(pet.baseHp),
    stages: createDefaultStages(),
    status: null,
    statusTurns: 0,
    confuseTurns: 0,
    traitTriggered: false,
    skillPp: pet.skills.map(id => {
      const skill = getSkillById(id);
      return skill ? skill.maxPp : 0;
    }),
    isCharging: false,
    chargingSkillId: null,
    isAlive: true,
  };
}

/**
 * 创建初始战斗状态
 */
export function createInitialState(
  playerParty: Pet[],
  enemyParty: Pet[],
): BattleState {
  return {
    playerParty: playerParty.map(createPetBattleState),
    enemyParty: enemyParty.map(createPetBattleState),
    playerActiveIdx: 0,
    enemyActiveIdx: 0,
    turn: 0,
    phase: 'start',
    events: [],
    stats: {
      totalTurns: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      highestSingleDamage: 0,
      kills: 0,
      winner: 'player',
    },
    isPlayerTurn: true,
  };
}

/**
 * 获取宠物实际属性值(含能力等级修正)
 */
export function getEffectiveStat(
  baseStat: number,
  stage: number
): number {
  if (stage >= 0) {
    // 正强化: 每级+1 → ×(2+stage)/2
    // +1→×1.5, +2→×2, +3→×2.5, +4→×3, +5→×3.5, +6→×4
    return Math.floor(calcStat(baseStat) * (2 + stage) / 2);
  } else {
    // 负强化: 每级-1 → ×2/(2+|stage|)
    // -1→×2/3, -2→×0.5, -3→×0.4
    return Math.floor(calcStat(baseStat) * 2 / (2 + Math.abs(stage)));
  }
}

/**
 * 获取宠物的速度值(含能力等级修正)
 */
export function getEffectiveSpeed(state: PetBattleState): number {
  let speed = getEffectiveStat(state.pet.baseSpe, state.stages.spe);
  // 麻痹减速
  if (state.status === 'paralyze') {
    speed = Math.floor(speed * 0.5);
  }
  return speed;
}

/**
 * 判断某方是否还有存活的宠物
 */
export function hasAlivePets(party: PetBattleState[]): boolean {
  return party.some(p => p.isAlive);
}

/**
 * 获取第一个存活宠物的索引
 */
export function getFirstAliveIdx(party: PetBattleState[]): number {
  return party.findIndex(p => p.isAlive);
}

/**
 * 判定战斗是否结束
 * @returns 'player' 玩家胜 | 'enemy' 敌人胜 | null 未结束
 */
export function checkBattleEnd(state: BattleState): 'player' | 'enemy' | null {
  if (!hasAlivePets(state.enemyParty)) return 'player';
  if (!hasAlivePets(state.playerParty)) return 'enemy';
  return null;
}
