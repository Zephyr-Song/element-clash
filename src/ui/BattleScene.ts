/**
 * BattleScene.ts - ★★★ 对战场景（最核心最复杂的UI）★★★
 * 组装所有子组件，监听用户输入，调用引擎，更新显示
 */

import type { Pet, PetBattleState, BattleEvent, BattleState, Action, Difficulty } from '../data/types';
import { ELEMENT_COLORS, ELEMENT_NAMES } from '../data/types';
import { getSkillById } from '../data/Skills';
import { BattleEngine } from '../core/BattleEngine';
import { getFirstAliveIdx, getEffectiveSpeed } from '../core/BattleState';
import { HpBar } from './components/HpBar';
import { PetSprite } from './components/PetSprite';
import { SkillButton } from './components/SkillButton';
import { ActionLog } from './components/ActionLog';
import { DamagePopup } from './components/DamagePopup';
import { AudioManager } from '../utils/AudioManager';
import { delay } from '../utils/helpers';
import { TRAITS } from '../data/Traits';

export class BattleScene {
  readonly el: HTMLElement;
  private engine: BattleEngine;
  private difficulty: Difficulty;

  // 子组件
  private enemyHpBar: HpBar;
  private playerHpBar: HpBar;
  private enemySprite: PetSprite;
  private playerSprite: PetSprite;
  private actionLog: ActionLog;
  private damagePopup: DamagePopup;

  // UI元素
  private skillPanelEl!: HTMLElement;
  private benchPanelEl!: HTMLElement;
  private turnInfoEl!: HTMLElement;
  private fieldFxEl!: HTMLElement;
  private skillButtons: SkillButton[] = [];

  // 状态
  private isProcessing: boolean = false;
  private onBattleEnd: (state: BattleState) => void;
  private onQuit?: () => void;
  private quitRequested: boolean = false;
  private state: BattleState | null = null;

  constructor(
    playerParty: Pet[],
    enemyParty: Pet[],
    difficulty: Difficulty,
    onBattleEnd: (state: BattleState) => void,
    onQuit?: () => void,
  ) {
    this.onBattleEnd = onBattleEnd;
    this.onQuit = onQuit;
    this.difficulty = difficulty;
    this.engine = new BattleEngine();

    this.el = document.createElement('div');
    this.el.className = 'scene battle-scene';

    // 初始化组件
    this.enemyHpBar = new HpBar();
    this.playerHpBar = new HpBar();
    this.enemySprite = new PetSprite(true);
    this.playerSprite = new PetSprite(false);
    this.actionLog = new ActionLog();
    this.damagePopup = new DamagePopup(this.el);

    this.fieldFxEl = document.createElement('div');
    this.fieldFxEl.className = 'field-fx';

    this.render(playerParty, enemyParty);
  }

  private render(playerParty: Pet[], enemyParty: Pet[]): void {
    // 初始化引擎
    this.state = this.engine.init({ playerParty, enemyParty, difficulty: this.difficulty });

    this.el.innerHTML = '';

    // === 敌方信息栏 ===
    const enemyInfo = this.createPetInfoBar('enemy');
    this.el.appendChild(enemyInfo);

    // === 敌方精灵 ===
    this.el.appendChild(this.enemySprite.el);

    // === 战场特效区 ===
    this.el.appendChild(this.fieldFxEl);

    // === 我方精灵 ===
    this.el.appendChild(this.playerSprite.el);

    // === 我方信息栏 ===
    const playerInfo = this.createPetInfoBar('player');
    this.el.appendChild(playerInfo);

    // === 技能面板 ===
    this.skillPanelEl = document.createElement('div');
    this.skillPanelEl.className = 'skill-panel';
    this.el.appendChild(this.skillPanelEl);

    // === 操作栏（道具+切换）===
    const actionBar = document.createElement('div');
    actionBar.className = 'action-bar';
    actionBar.innerHTML = `
      <button class="btn btn-sm btn-secondary" id="btn-item">🎒 回复药水</button>
      <button class="btn btn-sm btn-secondary" id="btn-switch">🔄 切换宠物</button>
    `;
    this.el.appendChild(actionBar);

    // === 备用宠物+回合数 ===
    const bottomRow = document.createElement('div');
    bottomRow.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 0';

    this.benchPanelEl = document.createElement('div');
    this.benchPanelEl.className = 'bench';
    bottomRow.appendChild(this.benchPanelEl);

    this.turnInfoEl = document.createElement('div');
    this.turnInfoEl.className = 'turn-info';
    bottomRow.appendChild(this.turnInfoEl);

    this.el.appendChild(bottomRow);

    // === 战斗日志 ===
    this.el.appendChild(this.actionLog.el);

    // === 退出战斗按钮（右上角悬浮）===
    const quitBtn = document.createElement('button');
    quitBtn.className = 'btn btn-sm btn-danger battle-quit-btn';
    quitBtn.textContent = '🚪 退出战斗';
    quitBtn.addEventListener('click', () => this.confirmQuit());
    this.el.appendChild(quitBtn);

    // === 事件绑定 ===
    actionBar.querySelector('#btn-item')!.addEventListener('click', () => this.useItem());
    actionBar.querySelector('#btn-switch')!.addEventListener('click', () => this.openSwitchModal());

    // 初始显示
    this.updateDisplay();
    this.actionLog.addMessage('⚔️ 对战开始!');
  }

  private createPetInfoBar(side: 'player' | 'enemy'): HTMLElement {
    const bar = document.createElement('div');
    bar.className = `battle-info ${side === 'enemy' ? 'right' : ''}`;
    bar.id = `info-${side}`;

    const emoji = document.createElement('div');
    emoji.className = 'bp-emoji';
    bar.appendChild(emoji);

    const hpBar = side === 'enemy' ? this.enemyHpBar : this.playerHpBar;
    bar.appendChild(hpBar.el);

    const nameEl = document.createElement('div');
    nameEl.style.cssText = 'text-align:center';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'bp-name';
    nameEl.appendChild(nameSpan);
    bar.appendChild(nameEl);

    return bar;
  }

  private updateDisplay(): void {
    if (!this.state) return;
    const { playerParty, enemyParty, playerActiveIdx, enemyActiveIdx, turn } = this.state;

    const player = playerParty[playerActiveIdx];
    const enemy = enemyParty[enemyActiveIdx];

    // 更新信息栏
    this.updateInfoBar('player', player);
    this.updateInfoBar('enemy', enemy);

    // 更新HP条
    this.playerHpBar.update(player.currentHp, player.maxHp);
    this.enemyHpBar.update(enemy.currentHp, enemy.maxHp);

    // 更新精灵
    this.playerSprite.update(player);
    this.enemySprite.update(enemy);

    // 更新技能按钮
    this.renderSkillButtons(player);

    // 更新备用宠物
    this.renderBenchPets('player');
    this.renderBenchPets('enemy');

    // 更新回合数
    this.turnInfoEl.textContent = `回合: ${turn}`;

    // 设置按钮状态
    this.setActionButtonsEnabled(!this.isProcessing);
  }

  private updateInfoBar(side: 'player' | 'enemy', petState: PetBattleState): void {
    const bar = this.el.querySelector(`#info-${side}`);
    if (!bar) return;

    const emoji = bar.querySelector('.bp-emoji') as HTMLElement;
    const nameSpan = bar.querySelector('.bp-name') as HTMLElement;

    if (emoji) emoji.textContent = petState.pet.emoji;
    if (nameSpan) {
      nameSpan.textContent = petState.pet.name;
      // 移除旧的badge
      const oldBadge = bar.querySelector('.bp-badge');
      if (oldBadge) oldBadge.remove();

      const badge = document.createElement('span');
      badge.className = 'bp-badge';
      const color = ELEMENT_COLORS[petState.pet.element] || '#666';
      badge.style.cssText = `background:${color}33;color:${color}`;
      badge.textContent = `${ELEMENT_NAMES[petState.pet.element] || ''} Lv.50`;
      nameSpan.appendChild(badge);
    }
  }

  private renderSkillButtons(petState: PetBattleState): void {
    this.skillPanelEl.innerHTML = '';
    this.skillButtons = [];

    petState.pet.skills.forEach((skillId, idx) => {
      const skill = getSkillById(skillId);
      if (!skill) return;

      const btn = new SkillButton(skill, petState.skillPp[idx], idx, (skillIdx) => {
        this.selectMove(skillIdx);
      });
      this.skillButtons.push(btn);
      this.skillPanelEl.appendChild(btn.el);
    });
  }

  private renderBenchPets(side: 'player' | 'enemy'): void {
    // 仅渲染我方bench（敌方不显示）
    if (side !== 'player') return;
    if (!this.state) return;

    this.benchPanelEl.innerHTML = '';
    const { playerParty, playerActiveIdx } = this.state;

    playerParty.forEach((pet, idx) => {
      const div = document.createElement('div');
      div.className = 'bench-pet';
      if (!pet.isAlive) div.classList.add('fainted');
      if (idx === playerActiveIdx) div.classList.add('active');

      div.innerHTML = `
        <span class="bench-emoji">${pet.pet.emoji}</span>
        <span>${pet.pet.name}</span>
        <span class="bench-hp">${pet.isAlive ? `${pet.currentHp}/${pet.maxHp}` : '倒下'}</span>
      `;

      if (pet.isAlive && idx !== playerActiveIdx && !this.isProcessing) {
        div.addEventListener('click', () => {
          AudioManager.playClickSound();
          this.switchPet(idx);
        });
      }

      this.benchPanelEl.appendChild(div);
    });
  }

  private setActionButtonsEnabled(enabled: boolean): void {
    this.skillButtons.forEach(btn => {
      const buttonEl = btn.el as HTMLButtonElement;
      if (enabled) {
        // 启用时：由按钮自己的PP状态决定是否可点击
        // SkillButton.render() 已经处理了 disabled 状态
        buttonEl.disabled = btn.getCurrentPp() <= 0;
      } else {
        buttonEl.disabled = true;
      }
    });
    const itemBtn = this.el.querySelector('#btn-item') as HTMLButtonElement;
    const switchBtn = this.el.querySelector('#btn-switch') as HTMLButtonElement;
    if (itemBtn) itemBtn.disabled = !enabled;
    if (switchBtn) switchBtn.disabled = !enabled;
  }

  // ==================== 用户操作处理 ====================

  private selectMove(skillIndex: number): void {
    if (this.isProcessing) return;
    this.executeAction({ type: 'move', skillIndex });
  }

  private switchPet(petIndex: number): void {
    if (this.isProcessing) return;
    this.executeAction({ type: 'switch', petIndex });
  }

  private useItem(): void {
    if (this.isProcessing) return;
    this.executeAction({ type: 'item', itemId: 1 });
  }

  private openSwitchModal(): void {
    if (this.isProcessing || !this.state) return;

    const { playerParty, playerActiveIdx } = this.state;

    // 创建切换模态框
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay switch-modal';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<h2>🔄 切换宠物</h2>`;

    const list = document.createElement('div');
    list.className = 'switch-pet-list';

    playerParty.forEach((pet, idx) => {
      const option = document.createElement('div');
      option.className = 'switch-pet-option';
      if (!pet.isAlive || idx === playerActiveIdx) option.classList.add('disabled');

      option.innerHTML = `
        <span class="sp-emoji">${pet.pet.emoji}</span>
        <div class="sp-info">
          <div class="sp-name">${pet.pet.name}</div>
          <div class="sp-hp">HP: ${pet.currentHp}/${pet.maxHp}</div>
        </div>
      `;

      if (pet.isAlive && idx !== playerActiveIdx) {
        option.addEventListener('click', () => {
          AudioManager.playClickSound();
          this.removeOverlay(overlay);
          this.switchPet(idx);
        });
      }

      list.appendChild(option);
    });

    modal.appendChild(list);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-sm btn-secondary';
    closeBtn.textContent = '取消';
    closeBtn.addEventListener('click', () => this.removeOverlay(overlay));
    modal.appendChild(closeBtn);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.removeOverlay(overlay);
    });

    overlay.appendChild(modal);
    this.el.appendChild(overlay);
  }

  /** 中途退出战斗：弹确认框，确认后回调上层返回关卡选择 */
  private confirmQuit(): void {
    if (this.quitRequested) return;
    AudioManager.playClickSound();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay switch-modal';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <h2>退出战斗？</h2>
      <div class="modal-body">确定要放弃当前战斗并返回关卡选择吗？<br>本次进度不会保存。</div>
    `;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-sm btn-secondary';
    cancelBtn.textContent = '继续战斗';
    cancelBtn.addEventListener('click', () => this.removeOverlay(overlay));

    const okBtn = document.createElement('button');
    okBtn.className = 'btn btn-sm btn-danger';
    okBtn.textContent = '退出';
    okBtn.addEventListener('click', () => {
      this.removeOverlay(overlay);
      this.quitRequested = true;
      if (this.onQuit) this.onQuit();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(okBtn);
    modal.appendChild(footer);

    overlay.appendChild(modal);
    this.el.appendChild(overlay);
  }

  private removeOverlay(overlay: HTMLElement): void {
    try {
      if (overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
      } else {
        overlay.remove();
      }
    } catch {
      // overlay已不存在，无需处理
    }
  }

  // ==================== 执行回合 ====================

  private async executeAction(action: Action): Promise<void> {
    if (this.isProcessing || !this.state || this.quitRequested) return;
    this.isProcessing = true;
    this.setActionButtonsEnabled(false);

    try {
      // 回合开始效果
      const startEvents = this.engine.processStartOfTurn();
      for (const evt of startEvents) {
        this.actionLog.addEvent(evt);
        await this.playEventAnimation(evt);
      }

      // 执行回合
      const events = await this.engine.executeTurn(action);

      // 逐个播放事件动画
      for (const evt of events) {
        this.actionLog.addEvent(evt);
        await this.playEventAnimation(evt);
      }

      // 检查是否需要强制换宠
      await this.checkForceSwitch();

      // 更新显示
      this.updateDisplay();

      // 检查战斗结束
      const winner = this.engine.checkEnd();
      if (winner) {
        await delay(500);
        this.onBattleEnd(this.state);
      }
    } catch (err) {
      // 动画或引擎出错时不影响战斗继续
      console.warn('[BattleScene] executeAction error:', err);
      this.updateDisplay();
    } finally {
      this.isProcessing = false;
      this.updateDisplay();
    }
  }

  private async checkForceSwitch(): Promise<void> {
    if (!this.state) return;

    // 检查当前活跃宠物是否存活
    const playerActive = this.state.playerParty[this.state.playerActiveIdx];
    const enemyActive = this.state.enemyParty[this.state.enemyActiveIdx];

    if (!playerActive.isAlive) {
      // 玩家需要换宠
      const aliveIdx = getFirstAliveIdx(this.state.playerParty);
      if (aliveIdx !== -1) {
        await this.playerSwitchAnimation(aliveIdx);
        const switchEvents = this.engine.forceSwitch('player', aliveIdx);
        for (const evt of switchEvents) {
          this.actionLog.addEvent(evt);
          await delay(300);
        }
      }
    }

    if (!enemyActive.isAlive) {
      // AI自动换宠
      const aiEvents = this.engine.aiAutoSwitch();
      for (const evt of aiEvents) {
        this.actionLog.addEvent(evt);
        await this.enemySwitchAnimation();
        await delay(300);
      }
    }
  }

  // ==================== 事件动画播放 ====================

  private async playEventAnimation(event: BattleEvent): Promise<void> {
    const delayMs = (ms: number) => delay(ms);

    switch (event.type) {
      case 'move_use':
        AudioManager.playMoveSound();
        // 攻击方精灵动画
        if (event.side === 'player') {
          await this.playerSprite.playAttack(false);
        } else {
          await this.enemySprite.playAttack(true);
        }
        break;

      case 'damage':
        AudioManager.playHitSound();
        // 受击方动画
        if (event.side === 'player') {
          await this.playerSprite.playHit();
          this.showDamagePopup(event.damage || 0, 25, 280, event.isCritical || false, 1);
        } else {
          await this.enemySprite.playHit();
          this.showDamagePopup(event.damage || 0, 75, 80, event.isCritical || false, 1);
        }
        // 屏幕闪红
        this.showScreenFlash('red');
        await delayMs(100);
        break;

      case 'effectiveness':
        if (event.effectivenessText?.includes('拔群')) {
          AudioManager.playSuperEffectiveSound();
          this.showScreenFlash('white');
          // 显示"效果拔群"文字
          this.damagePopup.showText(event.effectivenessText, 50, 160);
          await delayMs(400);
        }
        break;

      case 'critical':
        AudioManager.playCriticalSound();
        this.damagePopup.showText('💥 暴击!', 50, 130);
        await delayMs(300);
        break;

      case 'miss':
        if (event.side === 'player') {
          this.damagePopup.showMiss(25, 280);
        } else {
          this.damagePopup.showMiss(75, 80);
        }
        await delayMs(300);
        break;

      case 'heal':
        if (event.healAmount && event.healAmount > 0) {
          if (event.side === 'player') {
            this.damagePopup.showHeal(event.healAmount, 25, 280);
          } else {
            this.damagePopup.showHeal(event.healAmount, 75, 80);
          }
        }
        await delayMs(200);
        break;

      case 'faint':
        AudioManager.playFaintSound();
        if (event.side === 'player') {
          await this.playerSprite.playFaint();
        } else {
          await this.enemySprite.playFaint();
        }
        await delayMs(400);
        break;

      case 'switch_in':
        if (event.side === 'player') {
          await this.playerSprite.playEnter();
        } else {
          await this.enemySprite.playEnter();
        }
        break;

      case 'switch_out':
        if (event.side === 'player') {
          await this.playerSprite.playSwitchOut();
        } else {
          await this.enemySprite.playSwitchOut();
        }
        break;

      case 'status_inflict':
        await delayMs(200);
        break;

      case 'trait_activate':
        await delayMs(200);
        break;

      case 'recoil':
        if (event.side === 'player') {
          this.damagePopup.showDamage(event.damage || 0, 25, 280, false, 1);
          await this.playerSprite.playHit();
        } else {
          this.damagePopup.showDamage(event.damage || 0, 75, 80, false, 1);
          await this.enemySprite.playHit();
        }
        await delayMs(200);
        break;

      case 'charge':
        await delayMs(200);
        break;

      case 'drain':
        if (event.healAmount && event.healAmount > 0) {
          if (event.side === 'player') {
            this.damagePopup.showHeal(event.healAmount, 25, 260);
          } else {
            this.damagePopup.showHeal(event.healAmount, 75, 100);
          }
        }
        await delayMs(200);
        break;

      default:
        await delayMs(150);
    }
  }

  private showDamagePopup(
    damage: number,
    x: number,
    y: number,
    isCritical: boolean,
    effectiveness: number,
  ): void {
    if (damage <= 0) return;
    this.damagePopup.showDamage(damage, x, y, isCritical, effectiveness);
  }

  private async playerSwitchAnimation(newIdx: number): Promise<void> {
    await this.playerSprite.playSwitchOut();
    // 更新精灵
    if (this.state) {
      this.playerSprite.update(this.state.playerParty[newIdx]);
    }
    await this.playerSprite.playSwitchIn();
  }

  private async enemySwitchAnimation(): Promise<void> {
    await this.enemySprite.playSwitchOut();
    if (this.state) {
      this.enemySprite.update(this.state.enemyParty[this.state.enemyActiveIdx]);
    }
    await this.enemySprite.playSwitchIn();
  }

  private showScreenFlash(color: 'red' | 'white'): void {
    const flash = document.createElement('div');
    flash.className = `screen-flash ${color}`;
    document.body.appendChild(flash);
    // 超时兜底：即使 animationend 不触发也移除
    let removed = false;
    const remove = () => {
      if (removed) return;
      removed = true;
      flash.remove();
    };
    flash.addEventListener('animationend', remove, { once: true });
    setTimeout(remove, 400);
  }
}
