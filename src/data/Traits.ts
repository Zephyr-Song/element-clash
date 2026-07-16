/**
 * Traits.ts - 特性定义 + 效果判定逻辑
 * 每只宠物的被动能力
 */

import type { TraitId, Pet, PetBattleState, Skill, StatusCondition } from './types';
import { getEffectiveness } from './Elements';

/** 特性信息 */
export interface TraitInfo {
  id: TraitId;
  name: string;
  description: string;
}

/** 所有特性定义 */
export const TRAITS: Record<TraitId, TraitInfo> = {
  blaze: { id: 'blaze', name: '猛火', description: 'HP<30%时，火系技能威力×1.5' },
  sturdy: { id: 'sturdy', name: '结实', description: 'HP满时受到致死伤害保留1HP（整场战斗1次）' },
  damp: { id: 'damp', name: '湿润', description: '免疫爆炸类技能，火系伤害×0.5' },
  natural_cure: { id: 'natural_cure', name: '自然恢复', description: '换宠时治愈所有异常状态' },
  static: { id: 'static', name: '静电', description: '被接触类技能击中时，攻击者30%麻痹' },
  ice_body: { id: 'ice_body', name: '冰封皮肤', description: '每回合回复1/16最大HP' },
  hustle: { id: 'hustle', name: '斗争心', description: '物理伤害×1.25但物理命中率×0.8' },
  levitate: { id: 'levitate', name: '飘浮', description: '免疫地面系技能' },
  stench: { id: 'stench', name: '恶臭', description: '接触类技能命中时，攻击者物攻-2(20%概率)' },
  adaptability: { id: 'adaptability', name: '适应力', description: '同属性技能威力×1.2' },
  iron_body: { id: 'iron_body', name: '恒久之躯', description: '异常状态抗性+30%' },
  shed_skin: { id: 'shed_skin', name: '蜕皮', description: '每回合20%概率治愈一个异常状态' },
  intimidate: { id: 'intimidate', name: '威吓', description: '上场时对手物攻-1' },
  speed_boost: { id: 'speed_boost', name: '加速', description: '每回合结束速度+1' },
  steel_worker: { id: 'steel_worker', name: '钢匠', description: '钢系技能威力×1.5' },
  technician: { id: 'technician', name: '技术员', description: '威力≤60的技能威力×1.5' },
  unrivaled: { id: 'unrivaled', name: '齐天', description: '上场时物攻+1,速度+1' },
};

/**
 * 判定特性对伤害的加成倍率
 * @param trait 攻击方特性
 * @param skill 使用的技能
 * @param attacker 攻击方状态
 * @returns 威力倍率
 */
export function getTraitDamageModifier(
  trait: TraitId,
  skill: Skill,
  attacker: PetBattleState
): number {
  // 猛火：HP<30%时火系技能威力×1.5
  if (trait === 'blaze' && skill.element === 'fire') {
    if (attacker.currentHp < attacker.maxHp * 0.3) {
      return 1.5;
    }
  }

  // 斗争心：物理技能×1.25
  if (trait === 'hustle' && skill.category === 'physical') {
    return 1.25;
  }

  // 适应力：同属性技能×1.2
  if (trait === 'adaptability') {
    if (skill.element === attacker.pet.element || skill.element === attacker.pet.secondaryElement) {
      return 1.2;
    }
  }

  // 钢匠：钢系技能威力×1.5
  if (trait === 'steel_worker' && skill.element === 'steel') {
    return 1.5;
  }

  // 技术员：威力≤60的技能×1.5
  if (trait === 'technician' && skill.power > 0 && skill.power <= 60) {
    return 1.5;
  }

  return 1.0;
}

/**
 * 判定特性对命中率的修正
 * @param trait 攻击方特性
 * @param skill 使用的技能
 * @returns 命中率倍率
 */
export function getTraitAccuracyModifier(trait: TraitId, skill: Skill): number {
  // 斗争心：物理技能命中率×0.8
  if (trait === 'hustle' && skill.category === 'physical') {
    return 0.8;
  }
  return 1.0;
}

/**
 * 判定特性对受到伤害的减免倍率
 * @param trait 防御方特性
 * @param incomingSkill 攻击方的技能
 * @returns 伤害倍率 (1=不变, 0.5=减半)
 */
export function getTraitDefenseModifier(trait: TraitId, incomingSkill: Skill): number {
  // 湿润：火系伤害×0.5
  if (trait === 'damp' && incomingSkill.element === 'fire') {
    return 0.5;
  }
  return 1.0;
}

/**
 * 判定飘浮特性是否免疫某技能
 * @param trait 防御方特性
 * @param incomingSkill 攻击方的技能
 */
export function isImmuneByTrait(trait: TraitId, incomingSkill: Skill): boolean {
  // 飘浮：免疫地面系
  if (trait === 'levitate' && incomingSkill.element === 'ground') {
    return true;
  }
  return false;
}

/**
 * 判定结实特性是否触发(满HP时保留1HP)
 */
export function shouldSturdyTrigger(state: PetBattleState): boolean {
  if (state.pet.trait === 'sturdy' && !state.traitTriggered && state.currentHp === state.maxHp) {
    return true;
  }
  return false;
}

/**
 * 处理换宠时的特性效果（自然恢复）
 */
export function onSwitchOut(state: PetBattleState): PetBattleState {
  if (state.pet.trait === 'natural_cure') {
    return {
      ...state,
      status: null,
      statusTurns: 0,
      confuseTurns: 0,
    };
  }
  return state;
}

/**
 * 处理静电特性（被接触类技能击中时30%麻痹）
 * @returns 是否触发麻痹
 */
export function shouldStaticTrigger(defenderTrait: TraitId, move: Skill): boolean {
  return defenderTrait === 'static' && move.isContact === true && Math.random() < 0.3;
}

/**
 * 处理恶臭特性（被接触类技能命中时20%物攻-2）
 * @returns 是否触发
 */
export function shouldStenchTrigger(defenderTrait: TraitId, move: Skill): boolean {
  return defenderTrait === 'stench' && move.isContact === true && Math.random() < 0.2;
}

/**
 * 处理恒久之躯特性（异常命中率×0.7）
 */
export function shouldBlockStatus(trait: TraitId): boolean {
  return trait === 'iron_body' && Math.random() < 0.3;
}

/**
 * 处理蜕皮特性（每回合20%概率治愈异常）
 * @returns 是否触发治愈
 */
export function shouldShedSkinCure(trait: TraitId): boolean {
  return trait === 'shed_skin' && Math.random() < 0.2;
}

/**
 * 处理冰封皮肤特性（每回合回复1/16 HP）
 * @returns 回复量
 */
export function getIceBodyHeal(trait: TraitId, maxHp: number): number {
  if (trait === 'ice_body') {
    return Math.floor(maxHp / 16);
  }
  return 0;
}
