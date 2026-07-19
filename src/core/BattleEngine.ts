/**
 * BattleEngine.ts - 战斗引擎状态机
 * 驱动整个对战流程，是游戏的心脏
 * 处理：速度判定、先手值、技能执行、异常状态、胜负判定
 */

import type {
  BattleState, Action, BattleEvent, BattleConfig, Pet, Difficulty,
} from '../data/types';
import { getSkillById } from '../data/Skills';
import { getItemById, getItemHealRatio } from '../data/Items';
import {
  createInitialState, checkBattleEnd, hasAlivePets, getFirstAliveIdx,
  getEffectiveSpeed,
} from './BattleState';
import { calculateDamage } from './DamageCalc';
import {
  processStartOfTurnEffects, processEndOfTurnDamage,
  isPreventedByStatus, checkConfusionSelfHit, getConfusionSelfDamage,
  tryInflictStatus, checkFireThaw, checkSleepWakeOnHit,
  applyStatChanges, getStatusName,
} from './EffectProcessor';
import { aiDecide } from './AIController';
import {
  shouldSturdyTrigger, shouldStaticTrigger, shouldStenchTrigger,
  onSwitchOut, TRAITS,
} from '../data/Traits';
import { chance } from '../utils/helpers';

/**
 * 战斗引擎
 * 管理战斗状态机和所有对战逻辑
 */
export class BattleEngine {
  private state: BattleState | null = null;
  private difficulty: Difficulty = 'hard';

  /**
   * 初始化战斗
   */
  init(config: BattleConfig): BattleState {
    this.difficulty = config.difficulty;
    this.state = createInitialState(config.playerParty, config.enemyParty);
    this.state.phase = 'player_action';
    return this.state;
  }

  /**
   * 获取当前战斗状态(只读)
   */
  getState(): BattleState | null {
    return this.state;
  }

  /**
   * 处理玩家行动并执行完整回合
   * @returns 所有生成的事件列表
   */
  async executeTurn(playerAction: Action): Promise<BattleEvent[]> {
    if (!this.state) return [];

    const state = this.state;
    state.turn++;
    state.phase = 'execute';
    const allEvents: BattleEvent[] = [];

    // 获取双方活跃宠物
    const playerActive = state.playerParty[state.playerActiveIdx];
    const enemyActive = state.enemyParty[state.enemyActiveIdx];

    // 处理换宠行动
    if (playerAction.type === 'switch') {
      await this.handleSwitch(state, 'player', playerAction.petIndex!, allEvents);
      // AI决策
      const aiAction = aiDecide(
        state.enemyParty, state.playerParty,
        state.enemyActiveIdx, state.playerActiveIdx,
        this.difficulty
      );
      if (aiAction.type === 'switch') {
        await this.handleSwitch(state, 'enemy', aiAction.petIndex!, allEvents);
      } else {
        // AI行动
        await this.executeMove(state, 'enemy', aiAction.skillIndex!, allEvents);
      }
      this.endTurn(state, allEvents);
      return allEvents;
    }

    // AI决策
    const aiAction = aiDecide(
      state.enemyParty, state.playerParty,
      state.enemyActiveIdx, state.playerActiveIdx,
      this.difficulty
    );

    // AI换宠
    if (aiAction.type === 'switch') {
      await this.handleSwitch(state, 'enemy', aiAction.petIndex!, allEvents);
      // 玩家行动
      if (playerAction.type === 'move') {
        await this.executeMove(state, 'player', playerAction.skillIndex!, allEvents);
      } else if (playerAction.type === 'item') {
        await this.handleItemUse(state, playerAction.itemId!, allEvents);
      }
      this.endTurn(state, allEvents);
      return allEvents;
    }

    // 双方都选择攻击 → 速度判定
    const playerSpeed = getEffectiveSpeed(playerActive);
    const enemySpeed = getEffectiveSpeed(enemyActive);

    const playerSkill = playerAction.type === 'move'
      ? getSkillById(playerActive.pet.skills[playerAction.skillIndex!])
      : null;
    const enemySkill = aiAction.type === 'move'
      ? getSkillById(enemyActive.pet.skills[aiAction.skillIndex!])
      : null;

    let playerPriority = playerSkill?.priority ?? 0;
    let enemyPriority = enemySkill?.priority ?? 0;

    // 确定先后手
    let firstSide: 'player' | 'enemy';
    let secondSide: 'player' | 'enemy';

    if (playerPriority !== enemyPriority) {
      // 先手值高的先行动
      firstSide = playerPriority > enemyPriority ? 'player' : 'enemy';
      secondSide = firstSide === 'player' ? 'enemy' : 'player';
    } else {
      // 速度快的先行动
      firstSide = playerSpeed >= enemySpeed ? 'player' : 'enemy';
      secondSide = firstSide === 'player' ? 'enemy' : 'player';
    }

    // 先手执行
    const firstAction = firstSide === 'player' ? playerAction : aiAction;
    const secondAction = firstSide === 'player' ? aiAction : playerAction;

    if (firstAction.type === 'move') {
      await this.executeMove(state, firstSide, firstAction.skillIndex!, allEvents);
    } else if (firstAction.type === 'item') {
      await this.handleItemUse(state, firstAction.itemId!, allEvents);
    }

    // 先手后检查对方是否存活，存活才执行后手
    const firstTarget = firstSide === 'player' ? state.enemyParty[state.enemyActiveIdx] : state.playerParty[state.playerActiveIdx];
    if (firstTarget.isAlive) {
      if (secondAction.type === 'move') {
        await this.executeMove(state, secondSide, secondAction.skillIndex!, allEvents);
      } else if (secondAction.type === 'item') {
        await this.handleItemUse(state, secondAction.itemId!, allEvents);
      }
    }

    this.endTurn(state, allEvents);
    return allEvents;
  }

  /**
   * 处理AI强制换宠(一方宠物倒下后)
   */
  forceSwitch(side: 'player' | 'enemy', petIndex: number): BattleEvent[] {
    if (!this.state) return [];
    const events: BattleEvent[] = [];
    this.handleSwitch(this.state, side, petIndex, events);
    return events;
  }

  /**
   * AI自动选择换宠
   */
  aiAutoSwitch(): BattleEvent[] {
    if (!this.state) return [];
    const events: BattleEvent[] = [];

    const aiParty = this.state.enemyParty;
    const aliveIdx = getFirstAliveIdx(aiParty);
    if (aliveIdx !== -1) {
      this.handleSwitch(this.state, 'enemy', aliveIdx, events);
    }

    return events;
  }

  /**
   * 检查战斗是否结束
   */
  checkEnd(): 'player' | 'enemy' | null {
    if (!this.state) return null;
    return checkBattleEnd(this.state);
  }

  // ==================== 内部方法 ====================

  /**
   * 执行一次攻击
   */
  private async executeMove(
    state: BattleState,
    side: 'player' | 'enemy',
    skillIndex: number,
    events: BattleEvent[],
  ): Promise<void> {
    const party = side === 'player' ? state.playerParty : state.enemyParty;
    const enemyParty = side === 'player' ? state.enemyParty : state.playerParty;
    const activeIdx = side === 'player' ? state.playerActiveIdx : state.enemyActiveIdx;
    const targetIdx = side === 'player' ? state.enemyActiveIdx : state.playerActiveIdx;

    const attacker = party[activeIdx];
    const defender = enemyParty[targetIdx];

    if (!attacker.isAlive || !defender.isAlive) return;

    const skillId = attacker.pet.skills[skillIndex];
    const skill = getSkillById(skillId);
    if (!skill || attacker.skillPp[skillIndex] <= 0) return;

    // 消耗PP
    attacker.skillPp[skillIndex]--;

    // 蓄力技能处理
    if (skill.chargeTurn && !attacker.isCharging) {
      attacker.isCharging = true;
      attacker.chargingSkillId = skillId;
      events.push({
        type: 'charge',
        side,
        petName: attacker.pet.name,
        skillName: skill.name,
      });
      return;
    }

    // 释放蓄力
    if (attacker.isCharging) {
      attacker.isCharging = false;
      attacker.chargingSkillId = null;
    }

    // 异常状态判定：是否无法行动
    const preventResult = isPreventedByStatus(attacker);
    if (preventResult.prevented && preventResult.event) {
      const evt = { ...preventResult.event, side };
      events.push(evt);
      return;
    }

    // 混乱判定
    if (attacker.confuseTurns > 0 && checkConfusionSelfHit()) {
      const selfDmg = getConfusionSelfDamage(attacker.maxHp);
      attacker.currentHp = Math.max(0, attacker.currentHp - selfDmg);
      events.push({
        type: 'damage',
        side,
        petName: attacker.pet.name,
        damage: selfDmg,
      });
      if (attacker.currentHp <= 0) {
        attacker.isAlive = false;
        events.push({ type: 'faint', side, petName: attacker.pet.name });
      }
      return;
    }

    // 使用技能事件
    events.push({
      type: 'move_use',
      side,
      petName: attacker.pet.name,
      skillName: skill.name,
    });

    // 变化技能处理
    if (skill.category === 'status') {
      await this.executeStatusMove(state, side, attacker, defender, skill, events);
      return;
    }

    // 吸血/寄生类技能
    if (skill.drainRatio && skill.drainRatio > 0 && skill.power === 0) {
      const drainAmount = Math.floor(defender.maxHp * skill.drainRatio);
      defender.currentHp = Math.max(0, defender.currentHp - drainAmount);
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + drainAmount);

      events.push({
        type: 'move_hit',
        side,
        petName: attacker.pet.name,
        skillName: skill.name,
      });
      events.push({
        type: 'damage',
        side: side === 'player' ? 'enemy' : 'player',
        petName: defender.pet.name,
        damage: drainAmount,
      });
      events.push({
        type: 'drain',
        side,
        petName: attacker.pet.name,
        healAmount: drainAmount,
      });

      if (defender.currentHp <= 0) {
        defender.isAlive = false;
        events.push({ type: 'faint', side: side === 'player' ? 'enemy' : 'player', petName: defender.pet.name });
        this.updateStats(state, side, drainAmount, true);
      }
      return;
    }

    // 伤害计算
    const result = calculateDamage(attacker, defender, skill);

    if (result.isMiss) {
      events.push({ type: 'miss', side, petName: attacker.pet.name });
      return;
    }

    // 火系技能解冰
    if (checkFireThaw(defender, skill.element)) {
      events.push({
        type: 'status_cure',
        side: side === 'player' ? 'enemy' : 'player',
        petName: defender.pet.name,
        statusName: '❄️冰冻',
      });
    }

    // 受击解除睡眠
    if (checkSleepWakeOnHit(defender)) {
      events.push({
        type: 'status_cure',
        side: side === 'player' ? 'enemy' : 'player',
        petName: defender.pet.name,
        statusName: '💤睡眠',
      });
    }

    // 命中事件
    events.push({ type: 'move_hit', side, petName: attacker.pet.name, skillName: skill.name });

    // 暴击事件
    if (result.isCritical) {
      events.push({ type: 'critical', side, petName: attacker.pet.name });
    }

    // 属性克制事件
    if (result.effectivenessText) {
      events.push({
        type: 'effectiveness',
        side,
        petName: attacker.pet.name,
        effectivenessText: result.effectivenessText,
      });
    }

    // 特性发动
    if (result.traitBoost) {
      events.push({
        type: 'trait_activate',
        side,
        petName: attacker.pet.name,
        traitName: TRAITS[attacker.pet.trait].name,
      });
    }

    // 结实特性判定
    let finalDamage = result.damage;
    if (shouldSturdyTrigger(defender)) {
      defender.traitTriggered = true;
      finalDamage = defender.currentHp - 1;
      events.push({
        type: 'trait_activate',
        side: side === 'player' ? 'enemy' : 'player',
        petName: defender.pet.name,
        traitName: '结实',
      });
    }

    // 扣血
    defender.currentHp = Math.max(0, defender.currentHp - finalDamage);

    events.push({
      type: 'damage',
      side: side === 'player' ? 'enemy' : 'player',
      petName: defender.pet.name,
      damage: finalDamage,
    });

    // 反伤处理
    if (skill.recoil && finalDamage > 0) {
      const recoilRatio = skill.recoilRatio ?? 0.33;
      const recoilDamage = Math.max(1, Math.floor(finalDamage * recoilRatio));
      attacker.currentHp = Math.max(0, attacker.currentHp - recoilDamage);
      events.push({
        type: 'recoil',
        side,
        petName: attacker.pet.name,
        damage: recoilDamage,
      });
      if (attacker.currentHp <= 0) {
        attacker.isAlive = false;
        events.push({ type: 'faint', side, petName: attacker.pet.name });
      }
    }

    // 宠物倒下判定
    if (defender.currentHp <= 0 && defender.isAlive) {
      defender.isAlive = false;
      events.push({
        type: 'faint',
        side: side === 'player' ? 'enemy' : 'player',
        petName: defender.pet.name,
      });
      this.updateStats(state, side, finalDamage, true);
    } else if (finalDamage > 0) {
      this.updateStats(state, side, finalDamage, false);
    }

    // 附加异常状态
    if (skill.statusInflict) {
      const targetSide = side === 'player' ? 'enemy' : 'player';
      const inflictChance = skill.statusInflictChance ?? 0.3;
      // 恒久之躯降低异常命中率
      let finalChance = inflictChance;
      if (defender.pet.trait === 'iron_body') {
        finalChance *= 0.7;
      }
      const statusResult = tryInflictStatus(defender, skill.statusInflict, finalChance, targetSide);
      if (statusResult.success && statusResult.event) {
        events.push(statusResult.event);
      }
    }

    // 能力变化
    if (skill.statChanges && Object.keys(skill.statChanges).length > 0) {
      const targetSide = side === 'player' ? 'enemy' : 'player';
      const statEvents = applyStatChanges(defender, skill.statChanges, targetSide);
      events.push(...statEvents);
    }

    // 静电特性判定(被接触类技能命中时30%麻痹攻击者)
    if (shouldStaticTrigger(defender.pet.trait, skill)) {
      const staticResult = tryInflictStatus(attacker, 'paralyze', 1.0, side);
      if (staticResult.success && staticResult.event) {
        events.push(staticResult.event);
      }
    }

    // 恶臭特性判定
    if (shouldStenchTrigger(defender.pet.trait, skill)) {
      const stenchEvents = applyStatChanges(attacker, { atk: -2 }, side);
      events.push(...stenchEvents);
    }

    // 强制换宠
    if (skill.forceSwitch && defender.isAlive) {
      events.push({
        type: 'force_switch',
        side: side === 'player' ? 'enemy' : 'player',
        petName: defender.pet.name,
      });
    }
  }

  /**
   * 执行变化技能
   */
  private async executeStatusMove(
    state: BattleState,
    side: 'player' | 'enemy',
    attacker: { pet: Pet; currentHp: number; maxHp: number; skillPp: number[]; isAlive: boolean; isCharging: boolean; chargingSkillId: number | null } & import('../data/types').PetBattleState,
    defender: import('../data/types').PetBattleState,
    skill: import('../data/types').Skill,
    events: BattleEvent[],
  ): Promise<void> {
    const targetSide = side === 'player' ? 'enemy' : 'player';

    // 回复技能
    if (skill.healRatio && skill.healRatio > 0) {
      const healAmount = Math.floor(attacker.maxHp * skill.healRatio);
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
      events.push({
        type: 'move_hit',
        side,
        petName: attacker.pet.name,
        skillName: skill.name,
      });
      events.push({
        type: 'heal',
        side,
        petName: attacker.pet.name,
        healAmount,
      });
      return;
    }

    // 能力强化/弱化(作用于自己)
    if (skill.statChanges) {
      // 判断是强化自己还是弱化对方
      const hasBuff = Object.values(skill.statChanges).some(v => v && v > 0);
      const hasDebuff = Object.values(skill.statChanges).some(v => v && v < 0);

      if (hasBuff && !hasDebuff) {
        // 强化自己
        const statEvents = applyStatChanges(attacker, skill.statChanges, side);
        events.push({ type: 'move_hit', side, petName: attacker.pet.name, skillName: skill.name });
        events.push(...statEvents);
      } else {
        // 弱化对方
        events.push({ type: 'move_hit', side, petName: attacker.pet.name, skillName: skill.name });
        const statEvents = applyStatChanges(defender, skill.statChanges, targetSide);
        events.push(...statEvents);
      }
      return;
    }

    // 附加异常状态
    if (skill.statusInflict) {
      events.push({ type: 'move_hit', side, petName: attacker.pet.name, skillName: skill.name });
      const targetSide2 = side === 'player' ? 'enemy' : 'player';
      let finalChance = skill.statusInflictChance ?? 1.0;
      if (defender.pet.trait === 'iron_body') {
        finalChance *= 0.7;
      }
      const statusResult = tryInflictStatus(defender, skill.statusInflict, finalChance, targetSide2);
      if (statusResult.success && statusResult.event) {
        events.push(statusResult.event);
      }
      return;
    }

    // 强制换宠
    if (skill.forceSwitch) {
      events.push({ type: 'move_hit', side, petName: attacker.pet.name, skillName: skill.name });
      events.push({
        type: 'force_switch',
        side: targetSide,
        petName: defender.pet.name,
      });
      return;
    }

    // 默认：技能使用事件
    events.push({ type: 'move_hit', side, petName: attacker.pet.name, skillName: skill.name });
  }

  /**
   * 处理换宠
   */
  private handleSwitch(
    state: BattleState,
    side: 'player' | 'enemy',
    petIndex: number,
    events: BattleEvent[],
  ): void {
    const party = side === 'player' ? state.playerParty : state.enemyParty;
    if (petIndex < 0 || petIndex >= party.length) return;

    const currentIdx = side === 'player' ? state.playerActiveIdx : state.enemyActiveIdx;

    if (currentIdx === petIndex || !party[petIndex].isAlive) return;

    const oldPet = party[currentIdx];
    const newPet = party[petIndex];

    // 自然恢复特性：换出时治愈异常
    const oldState = onSwitchOut(oldPet);
    party[currentIdx] = oldState;

    events.push({
      type: 'switch_out',
      side,
      petName: oldPet.pet.name,
      oldPetName: oldPet.pet.name,
    });

    if (side === 'player') {
      state.playerActiveIdx = petIndex;
    } else {
      state.enemyActiveIdx = petIndex;
    }

    events.push({
      type: 'switch_in',
      side,
      petName: newPet.pet.name,
      newPetName: newPet.pet.name,
    });
  }

  /**
   * 处理道具使用
   */
  private async handleItemUse(
    state: BattleState,
    itemId: number,
    events: BattleEvent[],
  ): Promise<void> {
    const target = state.playerParty[state.playerActiveIdx];
    const item = getItemById(itemId);
    const ratio = item ? getItemHealRatio(item.type) : 0.3;
    const healAmount = Math.floor(target.maxHp * ratio);
    target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount);

    events.push({
      type: 'item_use',
      side: 'player',
      petName: target.pet.name,
      itemName: item ? item.name : '小药水',
      healAmount,
    });
    events.push({
      type: 'heal',
      side: 'player',
      petName: target.pet.name,
      healAmount,
    });
  }

  /**
   * 回合结束处理
   */
  private endTurn(state: BattleState, events: BattleEvent[]): void {
    const playerActive = state.playerParty[state.playerActiveIdx];
    const enemyActive = state.enemyParty[state.enemyActiveIdx];

    // 回合结束持续伤害
    if (playerActive.isAlive) {
      const pEvents = processEndOfTurnDamage(playerActive, 'player');
      for (const e of pEvents) {
        e.turn = state.turn;
        events.push(e);
      }
    }

    if (enemyActive.isAlive) {
      const eEvents = processEndOfTurnDamage(enemyActive, 'enemy');
      for (const e of eEvents) {
        e.turn = state.turn;
        events.push(e);
      }
    }

    // 检查战斗结束
    const winner = checkBattleEnd(state);
    if (winner) {
      state.phase = 'end';
      state.stats.winner = winner;
      state.stats.totalTurns = state.turn;
      events.push({
        type: winner === 'player' ? 'win' : 'lose',
        side: 'player',
        petName: '',
        turn: state.turn,
      });
    } else {
      state.phase = 'player_action';
      state.isPlayerTurn = true;
    }
  }

  /**
   * 更新战斗统计
   */
  private updateStats(state: BattleState, attackerSide: 'player' | 'enemy', damage: number, isKill: boolean): void {
    if (attackerSide === 'player') {
      state.stats.totalDamageDealt += damage;
      if (isKill) state.stats.kills++;
    } else {
      state.stats.totalDamageTaken += damage;
    }
    if (damage > state.stats.highestSingleDamage) {
      state.stats.highestSingleDamage = damage;
    }
  }

  /**
   * 处理回合开始效果
   */
  processStartOfTurn(): BattleEvent[] {
    if (!this.state) return [];
    const events: BattleEvent[] = [];
    const state = this.state;

    const playerActive = state.playerParty[state.playerActiveIdx];
    const enemyActive = state.enemyParty[state.enemyActiveIdx];

    if (playerActive.isAlive) {
      const pEvents = processStartOfTurnEffects(playerActive, 'player');
      events.push(...pEvents);
    }

    if (enemyActive.isAlive) {
      const eEvents = processStartOfTurnEffects(enemyActive, 'enemy');
      events.push(...eEvents);
    }

    return events;
  }
}
