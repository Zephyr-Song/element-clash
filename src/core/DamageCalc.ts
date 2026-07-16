/**
 * DamageCalc.ts - 伤害计算器
 * 纯函数，输入状态+技能→输出伤害结果
 * 这是游戏核心数学模块，计算必须准确！
 */

import type { PetBattleState, Skill, DamageResult, StatusCondition } from '../data/types';
import { getEffectiveness, getEffectivenessText } from '../data/Elements';
import { getTraitDamageModifier, getTraitAccuracyModifier, getTraitDefenseModifier, isImmuneByTrait } from '../data/Traits';
import { getEffectiveStat } from './BattleState';
import { randomFloat, chance } from '../utils/helpers';

/** 等级固定50级 */
const LEVEL = 50;

/**
 * 计算一次攻击的伤害结果(纯函数)
 * @param attacker 攻击方战斗状态
 * @param defender 防御方战斗状态
 * @param skill 使用的技能
 * @returns 完整的伤害结果
 */
export function calculateDamage(
  attacker: PetBattleState,
  defender: PetBattleState,
  skill: Skill
): DamageResult {
  // 变化技能不造成直接伤害
  if (skill.category === 'status' && !skill.drainRatio) {
    return {
      damage: 0,
      effectiveness: 1,
      effectivenessText: '',
      isCritical: false,
      isMiss: false,
      traitBoost: false,
    };
  }

  // ======== 1. 命中判定 ========
  let accuracy = skill.accuracy;
  // 特性修正命中率
  accuracy *= getTraitAccuracyModifier(attacker.pet.trait, skill);
  // 命中等级修正
  accuracy *= getAccuracyStageMultiplier(attacker.stages.accuracy - defender.stages.evasion);

  const isMiss = !skill.alwaysHit && !chance(accuracy / 100);
  if (isMiss) {
    return {
      damage: 0,
      effectiveness: 1,
      effectivenessText: '',
      isCritical: false,
      isMiss: true,
      traitBoost: false,
    };
  }

  // ======== 2. 属性克制判定 ========
  let effectiveness = getEffectiveness(skill.element, defender.pet.element);
  // 双属性(如果有第二属性)
  if (defender.pet.secondaryElement) {
    effectiveness *= getEffectiveness(skill.element, defender.pet.secondaryElement);
  }
  // 完全无效
  if (effectiveness === 0) {
    return {
      damage: 0,
      effectiveness: 0,
      effectivenessText: getEffectivenessText(0),
      isCritical: false,
      isMiss: false,
      traitBoost: false,
    };
  }
  // 特性免疫判定
  if (isImmuneByTrait(defender.pet.trait, skill)) {
    return {
      damage: 0,
      effectiveness: 0,
      effectivenessText: getEffectivenessText(0),
      isCritical: false,
      isMiss: false,
      traitBoost: false,
    };
  }

  // ======== 3. 攻防比计算 ========
  let atkValue: number;
  let defValue: number;
  let burnPenalty = 1.0;

  if (skill.category === 'physical') {
    atkValue = getEffectiveStat(attacker.pet.baseAtk, attacker.stages.atk);
    defValue = getEffectiveStat(defender.pet.baseDef, defender.stages.def);
    // 灼烧：物理伤害×0.5
    if (attacker.status === 'burn') {
      burnPenalty = 0.5;
    }
  } else {
    atkValue = getEffectiveStat(attacker.pet.baseSpA, attacker.stages.spA);
    defValue = getEffectiveStat(defender.pet.baseSpD, defender.stages.spD);
  }

  // 防止除以0
  if (defValue === 0) defValue = 1;
  if (atkValue === 0) atkValue = 1;

  const attackDefenseRatio = atkValue / defValue;

  // ======== 4. 基础伤害公式 ========
  // 基础伤害 = ((50×2÷5+2) × 威力 × 攻防比 ÷ 50 + 2)
  const levelFactor = (LEVEL * 2 / 5 + 2);
  let baseDamage = Math.floor(
    (levelFactor * skill.power * attackDefenseRatio / 50 + 2) * burnPenalty
  );

  // ======== 5. 暴击判定 ========
  const critRate = skill.critRate ?? 0.0625;
  const isCritical = chance(critRate);
  if (isCritical) {
    baseDamage = Math.floor(baseDamage * 1.5);
  }

  // ======== 6. 随机系数 (0.85~1.0) ========
  const randomFactor = randomFloat(0.85, 1.0);

  // ======== 7. 克制倍率 ========
  // ======== 8. 特性加成 ========
  let traitBoost = false;
  const traitModifier = getTraitDamageModifier(attacker.pet.trait, skill, attacker);
  if (traitModifier > 1.0) {
    traitBoost = true;
  }

  // ======== 9. 特性防御减免 ========
  const defenseModifier = getTraitDefenseModifier(defender.pet.trait, skill);

  // ======== 10. 最终伤害 ========
  const finalDamage = Math.max(
    1,
    Math.floor(baseDamage * effectiveness * randomFactor * traitModifier * defenseModifier)
  );

  return {
    damage: finalDamage,
    effectiveness,
    effectivenessText: getEffectivenessText(effectiveness),
    isCritical,
    isMiss: false,
    traitBoost,
  };
}

/**
 * 获取命中率阶段倍率
 * @param stageDifference 命中等级-闪避等级 (-6 to +6)
 */
export function getAccuracyStageMultiplier(stageDifference: number): number {
  if (stageDifference >= 0) {
    return (3 + stageDifference) / 3;
  } else {
    return 3 / (3 + Math.abs(stageDifference));
  }
}
