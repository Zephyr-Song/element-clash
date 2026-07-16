/**
 * AIController.ts - AI三级决策系统
 * 根据难度等级做出不同的对战决策
 */

import type { PetBattleState, Action, Difficulty, Skill } from '../data/types';
import { getSkillById } from '../data/Skills';
import { getEffectiveness } from '../data/Elements';
import { getFirstAliveIdx, getEffectiveSpeed } from './BattleState';
import { randomPick, chance } from '../utils/helpers';

/**
 * AI决策函数
 * 根据当前战斗状态和难度级别返回行动
 */
export function aiDecide(
  aiParty: PetBattleState[],
  playerParty: PetBattleState[],
  activeAiIdx: number,
  activePlayerIdx: number,
  difficulty: Difficulty
): Action {
  const ai = aiParty[activeAiIdx];
  const player = playerParty[activePlayerIdx];

  switch (difficulty) {
    case 'easy': return easyDecision(aiParty, playerParty, activeAiIdx, activePlayerIdx);
    case 'medium': return mediumDecision(aiParty, playerParty, activeAiIdx, activePlayerIdx);
    case 'hard': return hardDecision(aiParty, playerParty, activeAiIdx, activePlayerIdx);
    case 'insane': return hardDecision(aiParty, playerParty, activeAiIdx, activePlayerIdx);
    default: return easyDecision(aiParty, playerParty, activeAiIdx, activePlayerIdx);
  }
}

// ==================== Easy - 随机型 ====================
function easyDecision(
  aiParty: PetBattleState[],
  _playerParty: PetBattleState[],
  activeAiIdx: number,
  _activePlayerIdx: number,
): Action {
  const ai = aiParty[activeAiIdx];

  // 10%概率换宠
  if (chance(0.1)) {
    const switchIdx = getFirstAliveIdx(aiParty);
    if (switchIdx !== -1 && switchIdx !== activeAiIdx) {
      return { type: 'switch', petIndex: switchIdx };
    }
  }

  // 随机选可用技能
  const availableSkills = ai.pet.skills
    .map((id, idx) => ({ id, idx }))
    .filter(({ idx }) => ai.skillPp[idx] > 0);

  if (availableSkills.length === 0) {
    // 没有PP了，挣扎(如果实现了的话)或者换宠
    const switchIdx = getFirstAliveIdx(aiParty);
    if (switchIdx !== -1 && switchIdx !== activeAiIdx) {
      return { type: 'switch', petIndex: switchIdx };
    }
    return { type: 'move', skillIndex: 0 };
  }

  const chosen = randomPick(availableSkills);
  return { type: 'move', skillIndex: chosen.idx };
}

// ==================== Medium - 克制型 ====================
function mediumDecision(
  aiParty: PetBattleState[],
  playerParty: PetBattleState[],
  activeAiIdx: number,
  activePlayerIdx: number,
): Action {
  const ai = aiParty[activeAiIdx];
  const player = playerParty[activePlayerIdx];

  // 如果当前宠物被克制，30%概率换宠
  if (isAtDisadvantage(ai, player) && chance(0.3)) {
    const betterSwitch = findBetterSwitch(aiParty, playerParty, activePlayerIdx);
    if (betterSwitch !== -1) {
      return { type: 'switch', petIndex: betterSwitch };
    }
  }

  // 优先使用克制技能
  const superEffectiveSkill = findSuperEffectiveSkill(ai, player);
  if (superEffectiveSkill !== -1) {
    return { type: 'move', skillIndex: superEffectiveSkill };
  }

  // PP低于25%时改用其他技能
  const skillWithPp = findSkillWithPp(ai);
  if (skillWithPp !== -1) {
    return { type: 'move', skillIndex: skillWithPp };
  }

  return easyDecision(aiParty, playerParty, activeAiIdx, activePlayerIdx);
}

// ==================== Hard - 策略型 ====================
function hardDecision(
  aiParty: PetBattleState[],
  playerParty: PetBattleState[],
  activeAiIdx: number,
  activePlayerIdx: number,
): Action {
  const ai = aiParty[activeAiIdx];
  const player = playerParty[activePlayerIdx];

  // 策略1：对方残血，使用最高威力技能斩杀
  if (player.currentHp < player.maxHp * 0.25) {
    const strongestMove = findStrongestMove(ai, player);
    if (strongestMove !== -1) {
      return { type: 'move', skillIndex: strongestMove };
    }
  }

  // 策略2：我方不利时换宠
  if (isAtDisadvantage(ai, player)) {
    const betterSwitch = findBetterSwitch(aiParty, playerParty, activeAiIdx);
    if (betterSwitch !== -1 && chance(0.5)) {
      return { type: 'switch', petIndex: betterSwitch };
    }
  }

  // 策略3：对面刚上场(第一回合安全窗口)，使用强化技能
  if (player.currentHp === player.maxHp) {
    const setupMove = findSetupMove(ai);
    if (setupMove !== -1 && chance(0.6)) {
      return { type: 'move', skillIndex: setupMove };
    }
  }

  // 策略4：优先使用克制技能
  const superEffectiveSkill = findSuperEffectiveSkill(ai, player);
  if (superEffectiveSkill !== -1 && ai.skillPp[superEffectiveSkill] > 1) {
    return { type: 'move', skillIndex: superEffectiveSkill };
  }

  // 策略5：PP管理，高威力低PP留到最后
  const balancedMove = findBalancedMove(ai, player);
  if (balancedMove !== -1) {
    return { type: 'move', skillIndex: balancedMove };
  }

  // 策略6：保留高先手技能应对紧急情况
  const emergencySkill = findEmergencyMove(ai);
  if (ai.currentHp < ai.maxHp * 0.3 && emergencySkill !== -1) {
    return { type: 'move', skillIndex: emergencySkill };
  }

  // 兜底：选最高威力可用技能
  return { type: 'move', skillIndex: findAnyMove(ai) };
}

// ==================== 辅助函数 ====================

/**
 * 判断AI是否处于不利属性
 */
function isAtDisadvantage(ai: PetBattleState, player: PetBattleState): boolean {
  // 检查对方的技能是否克制我方
  for (const skillId of player.pet.skills) {
    const skill = getSkillById(skillId);
    if (!skill || skill.power === 0) continue;
    const eff = getEffectiveness(skill.element, ai.pet.element);
    if (ai.pet.secondaryElement) {
      const eff2 = getEffectiveness(skill.element, ai.pet.secondaryElement);
      if (eff * eff2 >= 2) return true;
    } else if (eff >= 2) {
      return true;
    }
  }
  return false;
}

/**
 * 寻找更好的换宠选择(属性有利)
 */
function findBetterSwitch(
  aiParty: PetBattleState[],
  playerParty: PetBattleState[],
  activePlayerIdx: number,
): number {
  let bestIdx = -1;
  let bestScore = -Infinity;

  const player = playerParty[activePlayerIdx];

  for (let i = 0; i < aiParty.length; i++) {
    if (!aiParty[i].isAlive) continue;
    const candidate = aiParty[i];

    // 计算候选宠物对当前敌方宠物的属性优势分
    let score = 0;
    for (const skillId of candidate.pet.skills) {
      const skill = getSkillById(skillId);
      if (!skill || skill.power === 0) continue;
      const eff = getEffectiveness(skill.element, player.pet.element);
      score += eff * skill.power;
    }
    // 优先保留HP高的
    score += (candidate.currentHp / candidate.maxHp) * 50;

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestIdx;
}

/**
 * 找到克制敌方属性的技能
 */
function findSuperEffectiveSkill(ai: PetBattleState, player: PetBattleState): number {
  let bestIdx = -1;
  let bestScore = 0;

  for (let i = 0; i < ai.pet.skills.length; i++) {
    const skill = getSkillById(ai.pet.skills[i]);
    if (!skill || skill.power === 0 || ai.skillPp[i] <= 0) continue;

    let eff = getEffectiveness(skill.element, player.pet.element);
    if (player.pet.secondaryElement) {
      eff *= getEffectiveness(skill.element, player.pet.secondaryElement);
    }

    if (eff >= 2) {
      const score = eff * skill.power;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
  }

  return bestIdx;
}

/**
 * 找到有PP的技能
 */
function findSkillWithPp(ai: PetBattleState): number {
  for (let i = 0; i < ai.pet.skills.length; i++) {
    if (ai.skillPp[i] > ai.pet.skills.length * 2) {
      return i;
    }
  }
  for (let i = 0; i < ai.pet.skills.length; i++) {
    if (ai.skillPp[i] > 0) {
      return i;
    }
  }
  return -1;
}

/**
 * 找最强攻击技能
 */
function findStrongestMove(ai: PetBattleState, player: PetBattleState): number {
  let bestIdx = -1;
  let bestDamage = 0;

  for (let i = 0; i < ai.pet.skills.length; i++) {
    const skill = getSkillById(ai.pet.skills[i]);
    if (!skill || skill.power === 0 || ai.skillPp[i] <= 0) continue;

    let eff = getEffectiveness(skill.element, player.pet.element);
    if (player.pet.secondaryElement) {
      eff *= getEffectiveness(skill.element, player.pet.secondaryElement);
    }

    const estimatedDamage = skill.power * eff;
    if (estimatedDamage > bestDamage) {
      bestDamage = estimatedDamage;
      bestIdx = i;
    }
  }

  return bestIdx;
}

/**
 * 找强化技能(setup move)
 */
function findSetupMove(ai: PetBattleState): number {
  for (let i = 0; i < ai.pet.skills.length; i++) {
    const skill = getSkillById(ai.pet.skills[i]);
    if (skill && skill.category === 'status' && skill.statChanges && ai.skillPp[i] > 0) {
      // 只选择有强化效果的(正面变化)
      const hasBuff = Object.values(skill.statChanges).some(v => v && v > 0);
      if (hasBuff) return i;
    }
  }
  return -1;
}

/**
 * 找均衡技能(平衡PP和威力)
 */
function findBalancedMove(ai: PetBattleState, player: PetBattleState): number {
  let bestIdx = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < ai.pet.skills.length; i++) {
    const skill = getSkillById(ai.pet.skills[i]);
    if (!skill || skill.power === 0 || ai.skillPp[i] <= 0) continue;

    let eff = getEffectiveness(skill.element, player.pet.element);
    if (player.pet.secondaryElement) {
      eff *= getEffectiveness(skill.element, player.pet.secondaryElement);
    }

    // 综合考虑威力和剩余PP
    const ppRatio = ai.skillPp[i] / (skill.maxPp || 1);
    const score = skill.power * eff * (ppRatio > 0.25 ? 1 : 0.5);

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestIdx;
}

/**
 * 找紧急先手技能
 */
function findEmergencyMove(ai: PetBattleState): number {
  // 找到先手值最高的技能
  let bestIdx = -1;
  let bestPriority = -Infinity;

  for (let i = 0; i < ai.pet.skills.length; i++) {
    const skill = getSkillById(ai.pet.skills[i]);
    if (!skill || skill.power === 0 || ai.skillPp[i] <= 0) continue;
    if (skill.priority > bestPriority) {
      bestPriority = skill.priority;
      bestIdx = i;
    }
  }

  return bestIdx;
}

/**
 * 找任意可用技能
 */
function findAnyMove(ai: PetBattleState): number {
  for (let i = 0; i < ai.pet.skills.length; i++) {
    if (ai.skillPp[i] > 0) return i;
  }
  return 0;
}
