/**
 * HpBar.ts - HP条组件
 */

export class HpBar {
  readonly el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'hp-wrap';
    this.el.innerHTML = `
      <div class="hp-text"><span class="hp-current"></span><span class="hp-max"></span></div>
      <div class="hp-outer"><div class="hp-inner high"></div></div>
    `;
  }

  update(current: number, max: number): void {
    const pct = max > 0 ? (current / max) * 100 : 0;
    const inner = this.el.querySelector('.hp-inner') as HTMLElement;
    const curSpan = this.el.querySelector('.hp-current') as HTMLElement;
    const maxSpan = this.el.querySelector('.hp-max') as HTMLElement;

    inner.style.width = `${Math.max(0, pct)}%`;
    curSpan.textContent = `${current}`;
    maxSpan.textContent = `/${max}`;

    inner.classList.remove('high', 'mid', 'low', 'crit');
    if (pct > 50) inner.classList.add('high');
    else if (pct > 25) inner.classList.add('mid');
    else if (pct > 10) inner.classList.add('low');
    else inner.classList.add('crit');
  }
}
