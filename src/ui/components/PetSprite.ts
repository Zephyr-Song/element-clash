/**
 * PetSprite.ts - 战场上的宠物渲染组件
 * 所有动画方法都加了超时兜底，防止 animationend 不触发导致 Promise 永远挂起
 */

import type { PetBattleState } from '../../data/types';
import { ELEMENT_COLORS } from '../../data/types';

export class PetSprite {
  readonly el: HTMLElement;
  private spriteEl: HTMLElement;
  private statusContainer: HTMLElement;

  constructor(isEnemy: boolean = false) {
    this.el = document.createElement('div');
    this.el.className = 'sprite-zone';

    this.spriteEl = document.createElement('div');
    this.spriteEl.className = `sprite${isEnemy ? ' flip' : ''}`;
    this.el.appendChild(this.spriteEl);

    this.statusContainer = document.createElement('div');
    this.statusContainer.className = 'status-icons';
    this.el.appendChild(this.statusContainer);
  }

  update(state: PetBattleState): void {
    this.spriteEl.textContent = state.pet.emoji;

    // 更新状态图标
    this.statusContainer.innerHTML = '';
    if (state.status) {
      const icon = document.createElement('span');
      icon.className = 'status-icon';
      icon.textContent = getStatusEmoji(state.status);
      icon.title = getStatusName(state.status);
      this.statusContainer.appendChild(icon);
    }
    if (state.confuseTurns > 0) {
      const icon = document.createElement('span');
      icon.className = 'status-icon';
      icon.textContent = '🌀';
      icon.title = '混乱';
      this.statusContainer.appendChild(icon);
    }
    if (state.isCharging) {
      const icon = document.createElement('span');
      icon.className = 'status-icon';
      icon.textContent = '⚡';
      icon.title = '蓄力中';
      this.statusContainer.appendChild(icon);
    }
  }

  /**
   * 通用动画执行方法，带超时兜底
   * 如果 animationend 未触发（如 prefers-reduced-motion、元素不可见等），超时后自动 resolve
   */
  private animateWithTimeout(cls: string, durationMs: number): Promise<void> {
    this.spriteEl.classList.add(cls);
    return new Promise<void>(resolve => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        this.spriteEl.classList.remove(cls);
        resolve();
      };
      // 超时兜底：确保即使 animationend 不触发也能继续
      const timer = setTimeout(finish, durationMs + 100);
      this.spriteEl.addEventListener('animationend', () => {
        clearTimeout(timer);
        finish();
      }, { once: true });
    });
  }

  playEnter(): Promise<void> {
    return this.animateWithTimeout('entering', 400);
  }

  playAttack(isEnemy: boolean): Promise<void> {
    const cls = isEnemy ? 'attack-left' : 'attack-right';
    return this.animateWithTimeout(cls, 200);
  }

  playHit(): Promise<void> {
    return this.animateWithTimeout('hit', 250);
  }

  playFaint(): Promise<void> {
    return this.animateWithTimeout('faint', 500);
  }

  playSwitchOut(): Promise<void> {
    return this.animateWithTimeout('switch-out', 250);
  }

  playSwitchIn(): Promise<void> {
    return this.animateWithTimeout('switch-in', 300);
  }
}

function getStatusEmoji(status: string): string {
  const map: Record<string, string> = {
    poison: '🟣', burn: '🔥', paralyze: '⚡', freeze: '❄️', sleep: '💤', confuse: '🌀',
  };
  return map[status] || '';
}

function getStatusName(status: string): string {
  const map: Record<string, string> = {
    poison: '中毒', burn: '灼烧', paralyze: '麻痹', freeze: '冰冻', sleep: '睡眠', confuse: '混乱',
  };
  return map[status] || status;
}
