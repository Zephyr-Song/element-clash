/**
 * DamagePopup.ts - 伤害飘字组件（含对象池）
 * 所有动画都加了超时兜底，防止 animationend 不触发导致元素泄漏
 */

import { ObjectPool } from '../../utils/ObjectPool';

type PopupType = 'normal' | 'critical' | 'effective' | 'heal' | 'miss';

export class DamagePopup {
  private container: HTMLElement;
  private pool: ObjectPool<HTMLElement>;

  constructor(container: HTMLElement) {
    this.container = container;

    this.pool = new ObjectPool<HTMLElement>(
      () => {
        const el = document.createElement('div');
        el.className = 'dmg-popup';
        return el;
      },
      (el) => {
        el.className = 'dmg-popup';
        el.textContent = '';
        el.style.left = '';
        el.style.top = '';
      },
      10,
      20,
    );
  }

  /**
   * 显示飘字
   * @param text 显示文本
   * @param x 相对container的x位置(%)
   * @param y 相对container的y位置(px)
   * @param type 飘字类型
   */
  show(text: string, x: number, y: number, type: PopupType = 'normal'): void {
    const el = this.pool.acquire();
    el.className = `dmg-popup ${type}`;
    el.textContent = text;
    el.style.left = `${x}%`;
    el.style.top = `${y}px`;
    this.container.appendChild(el);

    // 超时兜底：即使 animationend 不触发也能回收元素
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      this.pool.release(el);
    };

    // 根据动画类型设置不同超时
    const timeout = type === 'effective' ? 1200 : 1000;
    const timer = setTimeout(release, timeout);

    el.addEventListener('animationend', () => {
      clearTimeout(timer);
      release();
    }, { once: true });
  }

  showDamage(damage: number, x: number, y: number, isCritical: boolean, effectiveness: number): void {
    let type: PopupType = 'normal';
    if (effectiveness >= 2) type = 'effective';
    else if (isCritical) type = 'critical';

    this.show(`-${damage}`, x, y, type);
  }

  showHeal(amount: number, x: number, y: number): void {
    this.show(`+${amount}`, x, y, 'heal');
  }

  showMiss(x: number, y: number): void {
    this.show('MISS', x, y, 'miss');
  }

  showText(text: string, x: number, y: number): void {
    this.show(text, x, y - 30, 'effective');
  }
}
