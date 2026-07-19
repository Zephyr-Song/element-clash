/**
 * PetCard.ts - 宠物卡片组件（用于选宠界面）
 * 支持锁定状态（未解锁的精灵显示为灰色锁定卡片）
 */

import type { Pet } from '../../data/types';
import { ELEMENT_COLORS, ELEMENT_NAMES, ELEMENT_EMOJIS } from '../../data/types';
import { TRAITS } from '../../data/Traits';
import { AudioManager } from '../../utils/AudioManager';
import { getPetLevel, isPetEvolved } from '../../utils/Storage';
import { getEvolution } from '../../data/Pets';

const STAT_MAX = 130; // 归一化用的最大值

export class PetCard {
  readonly el: HTMLElement;
  private pet: Pet;
  private selected: boolean = false;
  private locked: boolean;
  private unlockHint: string;
  private onSelect: (pet: Pet) => void;

  constructor(pet: Pet, onSelect: (pet: Pet) => void, locked: boolean = false, unlockHint: string = '') {
    this.pet = pet;
    this.onSelect = onSelect;
    this.locked = locked;
    this.unlockHint = unlockHint;

    this.el = document.createElement('div');
    this.el.className = 'pet-card' + (locked ? ' locked' : '');
    this.render();

    if (!locked) {
      this.el.addEventListener('click', () => {
        AudioManager.playClickSound();
        this.selected = !this.selected;
        this.el.classList.toggle('selected', this.selected);
        this.onSelect(this.pet);
      });
    }
  }

  get isSelected(): boolean { return this.selected; }
  setSelected(val: boolean): void {
    this.selected = val;
    this.el.classList.toggle('selected', val);
  }

  private render(): void {
    if (this.locked) {
      this.el.innerHTML = `
        <div class="el-bar" style="background:#555"></div>
        <span class="emoji" style="filter:grayscale(1);opacity:.4">❓</span>
        <div class="name" style="color:#888">未解锁</div>
        <span class="el-tag" style="background:rgba(255,255,255,.05);color:#888">🔒 ${this.unlockHint}</span>
        <div class="stats" style="opacity:.3">
          <div class="stat-row"><span class="stat-lbl">???</span><div class="stat-bar"><div class="stat-fill" style="width:0"></div></div></div>
        </div>
        <div class="trait" style="color:#666">???</div>
      `;
      this.el.style.cssText = 'opacity:.5;cursor:not-allowed;filter:grayscale(.6)';
      return;
    }

    const color = ELEMENT_COLORS[this.pet.element] || '#666';
    const level = getPetLevel(this.pet.id);
    const evolved = isPetEvolved(this.pet.id);
    const evo = getEvolution(this.pet.id);
    let evoHtml = '';
    if (evo && evolved) evoHtml = `<div class="evo-badge">⬆ 已进化 ${evo.emoji}${evo.name}</div>`;
    else if (evo) evoHtml = `<div class="evo-hint">⬆ Lv.${evo.level} 进化</div>`;
    const stats = [
      { label: 'HP', val: this.pet.baseHp },
      { label: '攻', val: this.pet.baseAtk },
      { label: '防', val: this.pet.baseDef },
      { label: '魔', val: this.pet.baseSpA },
      { label: '抗', val: this.pet.baseSpD },
      { label: '速', val: this.pet.baseSpe },
    ];

    const statsHtml = stats.map(s => `
      <div class="stat-row">
        <span class="stat-lbl">${s.label}</span>
        <div class="stat-bar"><div class="stat-fill" style="width:${Math.min(100, (s.val / STAT_MAX) * 100)}%;background:${color}"></div></div>
      </div>
    `).join('');

    this.el.innerHTML = `
      <div class="el-bar" style="background:${color}"></div>
      <span class="emoji">${this.pet.emoji}</span>
      <div class="name">${this.pet.name}</div>
      <div class="pet-level">Lv.${level}</div>
      ${evoHtml}
      <span class="el-tag" style="background:${color}33;color:${color}">
        ${ELEMENT_EMOJIS[this.pet.element] || ''} ${ELEMENT_NAMES[this.pet.element] || ''}
        ${this.pet.secondaryElement ? ' ' + (ELEMENT_EMOJIS[this.pet.secondaryElement] || '') + ' ' + (ELEMENT_NAMES[this.pet.secondaryElement] || '') : ''}
      </span>
      <div class="stats">${statsHtml}</div>
      <div class="trait">${TRAITS[this.pet.trait]?.name || ''}</div>
    `;
  }
}
