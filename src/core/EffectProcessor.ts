/**
 * EffectProcessor.ts - 异常状态处理
 * 处理持续伤害结算、状态解除判断、能力变化
 */

import type { PetBattleState, BattleEvent, StatusCondition, StatStages } from '../data/types';
import { getIceBodyHeal, shouldShedSkinCure } from '../data/Traits';
import { randomInRange, chance } from '../utils/helpers';

/** 异常状态信息 */
const STATUS_INFO: Record<StatusCondition, { name: string; emoji: string }> = {
  poison: { name: '中毒', emoji: '🟣' },
  burn: { name: '灼烧', emoji: '🔥' },
  paralyze: { name: '麻痹', emoji: '⚡' },
  freeze: { name: '冰冻', emoji: '❄️' },
  sleep: { name: '睡眠', emoji: '💤' },
  confuse: { name: '混乱', emoji: '🌀' },
};

/**
 * 处理回合开始时的异常状态效果
 * @param state 宠物战斗状态
 * @param side 哪一方
 * @returns 事件列表
 */
export function processStartOfTurnEffects(
  state: PetBattleState,
  side: 'player' | 'enemy'
): BattleEvent[] {
  const events: BattleEvent[] = [];
  if (!state.isAlive) return events;

  // 冰封皮肤：每回合回复1/16
  const iceBodyHeal = getIceBodyHeal(state.pet.trait, state.maxHp);
  if (iceBodyHeal > 0) {
    state.currentHp = Math.min(state.maxHp, state.currentHp + iceBodyHeal);
    events.push({
      type: 'heal',
      side,
      petName: state.pet.name,
      healAmount: iceBodyHeal,
    });
  }

  // 蜕皮：每回合20%治愈异常
  if (state.status && shouldShedSkinCure(state.pet.trait)) {
    const oldStatus = STATUS_INFO[state.status];
    events.push({
      type: 'status_cure',
      side,
      petName: state.pet.name,
      statusName: `${oldStatus.emoji}${oldStatus.name}`,
    });
    state.status = null;
    state.statusTurns = 0;
  }

  // 混乱：独立回合倒计时
  if (state.confuseTurns > 0) {
    state.confuseTurns--;
    if (state.confuseTurns <= 0) {
      events.push({
        type: 'status_cure',
        side,
        petName: state.pet.name,
        statusName: '🌀混乱',
      });
    }
  }

  return events;
}

/**
 * 处理回合结束时的持续伤害
 * @param state 宠物战斗状态
 * @param side 哪一方
 * @returns 事件列表(含伤害数值)
 */
export function processEndOfTurnDamage(
  state: PetBattleState,
  side: 'player' | 'enemy'
): BattleEvent[] {
  const events: BattleEvent[] = [];
  if (!state.isAlive || !state.status) return events;

  let damage = 0;

  switch (state.status) {
    case 'poison':
      // 每回合扣maxHP的1/8
      damage = Math.max(1, Math.floor(state.maxHp / 8));
      break;

    case 'burn':
      // 每回合扣maxHP的1/16
      damage = Math.max(1, Math.floor(state.maxHp / 16));
      break;

    case 'freeze':
      // 冰冻持续回合倒计时
      state.statusTurns--;
      if (state.statusTurns <= 0 || chance(0.2)) {
        // 自然解除
        state.status = null;
        events.push({
          type: 'status_cure',
          side,
          petName: state.pet.name,
          statusName: '❄️冰冻',
        });
      }
      // 冰冻本身不造成持续伤害
      return events;

    case 'sleep':
      // 睡眠持续回合倒计时
      state.statusTurns--;
      if (state.statusTurns <= 0) {
        state.status = null;
        events.push({
          type: 'status_cure',
          side,
          petName: state.pet.name,
          statusName: '💤睡眠',
        });
      }
      return events;
  }

  if (damage > 0) {
    state.currentHp = Math.max(0, state.currentHp - damage);
    events.push({
      type: 'status_damage',
      side,
      petName: state.pet.name,
      damage,
      statusName: STATUS_INFO[state.status]
        ? `${STATUS_INFO[state.status].emoji}${STATUS_INFO[state.status].name}`
        : state.status,
    });

    // 检查是否被持续伤害击倒
    if (state.currentHp <= 0) {
      state.isAlive = false;
      events.push({
        type: 'faint',
        side,
        petName: state.pet.name,
      });
    }
  }

  return events;
}

/**
 * 判定异常状态是否阻止行动
 * @returns true=无法行动, false=可以行动
 */
export function isPreventedByStatus(state: PetBattleState): {
  prevented: boolean;
  event?: BattleEvent;
} {
  if (!state.status) return { prevented: false };

  switch (state.status) {
    case 'paralyze':
      // 25%概率无法行动
      if (chance(0.25)) {
        return {
          prevented: true,
          event: {
            type: 'status_damage',
            side: 'player', // 调用者会覆盖
            petName: state.pet.name,
            damage: 0,
            statusName: '⚡麻痹',
          },
        };
      }
      return { prevented: false };

    case 'freeze':
      // 冰冻无法行动
      return {
        prevented: true,
        event: {
          type: 'status_damage',
          side: 'player',
          petName: state.pet.name,
          damage: 0,
          statusName: '❄️冰冻',
        },
      };

    case 'sleep':
      // 睡眠无法行动
      return {
        prevented: true,
        event: {
          type: 'status_damage',
          side: 'player',
          petName: state.pet.name,
          damage: 0,
          statusName: '💤睡眠',
        },
      };
  }

  // 混乱判定(在行动时而非回合开始判定)
  return { prevented: false };
}

/**
 * 判定混乱是否导致自伤
 * @returns true=自伤, false=正常行动
 */
export function checkConfusionSelfHit(): boolean {
  return chance(0.33);
}

/**
 * 计算混乱自伤伤害(40威力无视防御)
 */
export function getConfusionSelfDamage(maxHp: number): number {
  // 固定伤害：maxHP的1/8
  return Math.max(1, Math.floor(maxHp / 8));
}

/**
 * 尝试附加异常状态
 * @returns true=附加成功, false=失败(已有状态或概率未命中)
 */
export function tryInflictStatus(
  target: PetBattleState,
  status: StatusCondition,
  inflictChance: number,
  targetSide: 'player' | 'enemy'
): {
  success: boolean;
  event?: BattleEvent;
} {
  // 已有异常状态不能叠加(混乱可以与其他状态共存)
  if (status !== 'confuse' && target.status !== null) {
    return { success: false };
  }
  if (status === 'confuse' && target.confuseTurns > 0) {
    return { success: false };
  }

  if (!chance(inflictChance)) {
    return { success: false };
  }

  const info = STATUS_INFO[status];
  const statusName = info ? `${info.emoji}${info.name}` : status;

  let turns = 0;
  switch (status) {
    case 'poison': turns = 999; break; // 中毒持续到战斗结束
    case 'burn': turns = randomInRange(3, 5); break;
    case 'paralyze': turns = 999; break; // 麻痹持续到战斗结束
    case 'freeze': turns = randomInRange(1, 5); break;
    case 'sleep': turns = randomInRange(1, 3); break;
    case 'confuse': turns = randomInRange(2, 4); break;
  }

  if (status === 'confuse') {
    target.confuseTurns = turns;
  } else {
    target.status = status;
    target.statusTurns = turns;
  }

  return {
    success: true,
    event: {
      type: 'status_inflict',
      side: targetSide,
      petName: target.pet.name,
      statusName,
    },
  };
}

/**
 * 火系技能解除冰冻
 */
export function checkFireThaw(target: PetBattleState, moveElement: string): boolean {
  if (target.status === 'freeze' && moveElement === 'fire') {
    target.status = null;
    target.statusTurns = 0;
    return true;
  }
  return false;
}

/**
 * 受击解除睡眠
 */
export function checkSleepWakeOnHit(target: PetBattleState): boolean {
  if (target.status === 'sleep') {
    target.status = null;
    target.statusTurns = 0;
    return true;
  }
  return false;
}

/**
 * 应用能力等级变化
 * @param target 目标宠物状态
 * @param changes 能力变化 {atk: +1, def: -2, ...}
 * @param side 目标方
 * @returns 事件列表
 */
export function applyStatChanges(
  target: PetBattleState,
  changes: Partial<StatStages>,
  side: 'player' | 'enemy'
): BattleEvent[] {
  const events: BattleEvent[] = [];
  const statNames: Record<string, string> = {
    atk: '物攻', def: '物防', spA: '魔攻', spD: '魔防',
    spe: '速度', accuracy: '命中', evasion: '闪避',
  };

  for (const [stat, change] of Object.entries(changes)) {
    if (change === 0 || change === undefined) continue;

    const key = stat as keyof StatStages;
    const oldValue = target.stages[key];
    target.stages[key] = Math.max(-6, Math.min(6, oldValue + change));
    const actualChange = target.stages[key] - oldValue;

    if (actualChange !== 0) {
      const arrow = actualChange > 0 ? '↑' : '↓';
      const magnitude = Math.abs(actualChange);
      events.push({
        type: 'stat_change',
        side,
        petName: target.pet.name,
        statChangeText: `${statNames[stat] || stat} ${magnitude > 1 ? arrow + magnitude : arrow}`,
      });
    }
  }

  return events;
}

/**
 * 获取状态emoji(用于UI显示)
 */
export function getStatusEmoji(status: StatusCondition | null): string {
  if (!status) return '';
  return STATUS_INFO[status]?.emoji || '';
}

/**
 * 获取状态名称
 */
export function getStatusName(status: StatusCondition | null): string {
  if (!status) return '';
  return STATUS_INFO[status]?.name || status;
}
