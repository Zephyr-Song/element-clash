/**
 * GachaScene.ts - 抽卡场景
 * 单抽/十连抽卡，含动画效果
 */

import { PETS } from '../data/Pets';
import { GACHA_PET_IDS, GACHA_SINGLE_COST, GACHA_TEN_COST } from '../utils/Storage';
import { loadSave, spendCoins, drawGachaSingle, drawGachaTen } from '../utils/Storage';
import { AudioManager } from '../utils/AudioManager';
import type { GachaResult, GachaRarity } from '../data/types';
import { ELEMENT_NAMES, ELEMENT_COLORS, ELEMENT_EMOJIS } from '../data/types';

/** 稀有度配置 */
const RARITY_CONFIG: Record<GachaRarity, { color: string; bg: string; label: string; glow: string }> = {
  R:   { color: '#4facfe', bg: 'rgba(79,172,254,.15)', label: 'R 稀有', glow: '0 0 20px rgba(79,172,254,.4)' },
  SR:  { color: '#a55eea', bg: 'rgba(165,94,234,.15)', label: 'SR 超稀有', glow: '0 0 30px rgba(165,94,234,.5)' },
  SSR: { color: '#fed330', bg: 'rgba(254,211,48,.15)', label: 'SSR 传说', glow: '0 0 40px rgba(254,211,48,.6)' },
};

export class GachaScene {
  readonly el: HTMLElement;
  private onBack: () => void;
  private isAnimating = false;

  constructor(onBack: () => void) {
    this.onBack = onBack;
    this.el = document.createElement('div');
    this.el.className = 'scene gacha-scene';
    this.el.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:30px 20px';
    this.render();
  }

  private render(): void {
    const save = loadSave();
    const ownedCount = save.gachaPets.filter(id => GACHA_PET_IDS.includes(id)).length;

    // 标题
    const title = document.createElement('h2');
    title.style.cssText = 'font-size:1.6em;color:#fff;margin-bottom:8px;text-align:center';
    title.textContent = '🎰 精灵召唤';
    this.el.appendChild(title);

    // 金币显示
    const coinBar = document.createElement('div');
    coinBar.style.cssText = 'font-size:1.1em;color:#fed330;margin-bottom:16px;text-align:center';
    coinBar.innerHTML = `🪙 <span id="gacha-coins">${save.coins}</span> 金币`;
    this.el.appendChild(coinBar);

    // 收集进度
    const infoRow = document.createElement('div');
    infoRow.style.cssText = 'display:flex;gap:16px;margin-bottom:20px;font-size:.85em;color:rgba(255,255,255,.5);text-align:center';
    infoRow.innerHTML = `<span>📖 ${ownedCount}/${GACHA_PET_IDS.length} 已收集</span>`;
    this.el.appendChild(infoRow);

    // 抽卡区域
    const gachaArea = document.createElement('div');
    gachaArea.id = 'gacha-area';
    gachaArea.style.cssText = 'width:100%;max-width:500px;min-height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-bottom:20px';

    // 默认展示卡池预览
    gachaArea.innerHTML = this.renderPoolPreview();
    this.el.appendChild(gachaArea);

    // 按钮区
    const btnArea = document.createElement('div');
    btnArea.style.cssText = 'display:flex;gap:12px;width:100%;max-width:500px;margin-bottom:20px';

    const singleBtn = document.createElement('button');
    singleBtn.className = 'btn btn-primary';
    singleBtn.style.cssText = 'flex:1;font-size:1em';
    singleBtn.innerHTML = `🎰 单次召唤<br><span style="font-size:.8em;opacity:.7">🪙 ${GACHA_SINGLE_COST}</span>`;
    singleBtn.addEventListener('click', () => this.doDraw(false));

    const tenBtn = document.createElement('button');
    tenBtn.className = 'btn btn-primary';
    tenBtn.style.cssText = 'flex:1;font-size:1em;background:linear-gradient(135deg,#a55eea,#6c5ce7)';
    tenBtn.innerHTML = `✨ 十连召唤<br><span style="font-size:.8em;opacity:.7">🪙 ${GACHA_TEN_COST}</span>`;
    tenBtn.addEventListener('click', () => this.doDraw(true));

    btnArea.appendChild(singleBtn);
    btnArea.appendChild(tenBtn);
    this.el.appendChild(btnArea);

    // 卡池概率
    const probInfo = document.createElement('div');
    probInfo.style.cssText = 'font-size:.78em;color:rgba(255,255,255,.35);text-align:center;margin-bottom:20px';
    probInfo.innerHTML = `SSR ${(10).toFixed(1)}% | SR ${(30).toFixed(1)}% | R ${(60).toFixed(1)}%`;
    this.el.appendChild(probInfo);

    // 已拥有精灵展示
    const ownedSection = document.createElement('div');
    ownedSection.style.cssText = 'width:100%;max-width:500px;margin-bottom:20px';
    const ownedTitle = document.createElement('div');
    ownedTitle.style.cssText = 'font-size:.9em;color:rgba(255,255,255,.5);margin-bottom:8px';
    ownedTitle.textContent = '📦 已获得：';
    ownedSection.appendChild(ownedTitle);
    const ownedGrid = document.createElement('div');
    ownedGrid.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
    for (const petId of GACHA_PET_IDS) {
      const pet = PETS.find(p => p.id === petId);
      if (!pet) continue;
      const owned = save.gachaPets.includes(petId);
      const rc = pet.rarity && pet.rarity !== 'UR' ? RARITY_CONFIG[pet.rarity] : RARITY_CONFIG.R;
      ownedGrid.innerHTML += `
        <div style="display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:8px;border:1px solid ${owned ? rc.color + '44' : 'rgba(255,255,255,.08)'};background:${owned ? rc.bg : 'rgba(255,255,255,.02)'};opacity:${owned ? '1' : '0.35'};font-size:.85em">
          <span>${owned ? pet.emoji : '❓'}</span>
          <span style="color:${owned ? rc.color : 'rgba(255,255,255,.3)'}">${owned ? pet.name : '???'}</span>
          <span style="font-size:.7em;color:${rc.color}">${pet.rarity || ''}</span>
        </div>
      `;
    }
    ownedSection.appendChild(ownedGrid);
    this.el.appendChild(ownedSection);

    // 返回按钮
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.style.cssText = 'width:100%;max-width:500px';
    backBtn.textContent = '🏠 返回主菜单';
    backBtn.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onBack();
    });
    this.el.appendChild(backBtn);
  }

  /** 渲染卡池预览 */
  private renderPoolPreview(): string {
    let html = '<div style="text-align:center;color:rgba(255,255,255,.4);font-size:.95em;margin-bottom:12px">✨ 卡池精灵一览 ✨</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">';
    for (const petId of GACHA_PET_IDS) {
      const pet = PETS.find(p => p.id === petId);
      if (!pet) continue;
      const rc = pet.rarity && pet.rarity !== 'UR' ? RARITY_CONFIG[pet.rarity] : RARITY_CONFIG.R;
      html += `
        <div style="text-align:center;padding:10px 12px;border-radius:10px;border:1px solid ${rc.color}33;background:${rc.bg};min-width:70px">
          <div style="font-size:2em">${pet.emoji}</div>
          <div style="font-size:.8em;color:${rc.color};font-weight:700">${pet.rarity}</div>
          <div style="font-size:.75em;color:rgba(255,255,255,.5)">${pet.name}</div>
        </div>
      `;
    }
    html += '</div>';
    return html;
  }

  /** 执行抽卡 */
  private async doDraw(isTen: boolean): Promise<void> {
    if (this.isAnimating) return;
    const cost = isTen ? GACHA_TEN_COST : GACHA_SINGLE_COST;
    const save = loadSave();

    if (save.coins < cost) {
      this.showToast('🪙 金币不足！去签到获取金币吧');
      return;
    }

    this.isAnimating = true;
    AudioManager.playClickSound();

    // 扣除金币
    spendCoins(cost);

    // 抽卡
    let results: GachaResult[];
    if (isTen) {
      results = drawGachaTen();
    } else {
      results = [drawGachaSingle()];
    }

    // 播放动画
    const area = this.el.querySelector('#gacha-area') as HTMLElement;
    if (!area) { this.isAnimating = false; return; }

    // 动画：翻转卡牌
    await this.playDrawAnimation(area, results);

    this.isAnimating = false;
  }

  /** 抽卡动画 */
  private playDrawAnimation(area: HTMLElement, results: GachaResult[]): Promise<void> {
    return new Promise((resolve) => {
      area.innerHTML = '';

      // 展示阶段
      const container = document.createElement('div');
      container.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center';
      area.appendChild(container);

      let delay = 0;
      for (const result of results) {
        const pet = PETS.find(p => p.id === result.petId);
        if (!pet) continue;
        const rc = RARITY_CONFIG[result.rarity];

        const card = document.createElement('div');
        card.style.cssText = `
          width:${results.length > 1 ? '80px' : '120px'};
          padding:${results.length > 1 ? '10px 8px' : '16px'};
          border-radius:12px;text-align:center;
          border:2px solid ${rc.color}66;
          background:${rc.bg};
          box-shadow:${rc.glow};
          opacity:0;transform:scale(0.5) rotateY(180deg);
          transition:all .4s cubic-bezier(.34,1.56,.64,1);
        `;
        card.innerHTML = `
          <div style="font-size:${results.length > 1 ? '1.6em' : '2.4em'};margin-bottom:4px">${pet.emoji}</div>
          <div style="font-size:.85em;color:${rc.color};font-weight:700">${pet.rarity}</div>
          <div style="font-size:.8em;color:#fff;font-weight:600">${pet.name}</div>
          ${result.isNew ? '<div style="font-size:.7em;color:#26de81;margin-top:2px">✨ NEW!</div>' : ''}
          <div style="font-size:.7em;color:rgba(255,255,255,.4);margin-top:2px">${ELEMENT_EMOJIS[pet.element]}${ELEMENT_NAMES[pet.element]}${pet.secondaryElement ? '/' + ELEMENT_EMOJIS[pet.secondaryElement] + ELEMENT_NAMES[pet.secondaryElement] : ''}</div>
        `;
        container.appendChild(card);

        // 延迟翻转显示
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'scale(1) rotateY(0deg)';
          // SSR特效
          if (result.rarity === 'SSR') {
            AudioManager.playClickSound();
            card.style.animation = 'ssr-glow 1s ease-in-out infinite alternate';
          } else if (result.rarity === 'SR') {
            AudioManager.playClickSound();
          }
        }, delay);
        delay += results.length > 1 ? 150 : 300;
      }

      // 动画播完自动刷新
      setTimeout(() => {
        this.el.innerHTML = '';
        this.render();
        resolve();
      }, delay + 600);
    });
  }

  /** Toast提示 */
  private showToast(msg: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed;top:20%;left:50%;transform:translateX(-50%);
      padding:10px 24px;border-radius:10px;background:rgba(0,0,0,.85);
      color:#fff;font-size:.9em;z-index:999;pointer-events:none;
      animation:fadeInOut 2s ease forwards;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
}
