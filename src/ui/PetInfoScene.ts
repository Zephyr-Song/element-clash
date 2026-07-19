/**
 * PetInfoScene.ts - 宠物属性 & 技能查看界面
 * 集中浏览所有精灵的详细属性与技能，便于玩家配队前查阅。
 * 属性数值与战斗内一致（50级基准：HP=base*2+110，其余=base*2+36）。
 */

import type { Pet, Skill } from '../data/types';
import {
  ELEMENT_COLORS,
  ELEMENT_NAMES,
  ELEMENT_EMOJIS,
} from '../data/types';
import { PETS } from '../data/Pets';
import { getSkillById } from '../data/Skills';
import { TRAITS } from '../data/Traits';
import { AudioManager } from '../utils/AudioManager';

/** 与 BattleState 一致：50级属性换算 */
function maxHp(baseHp: number): number {
  return Math.floor(baseHp * 2 + 110);
}
function stat(base: number): number {
  return Math.floor(base * 2 + 36);
}

const STAT_LABELS: Record<string, string> = {
  atk: '攻', def: '防', spA: '魔', spD: '抗', spe: '速', accuracy: '命中', evasion: '闪避',
};
const STATUS_NAMES: Record<string, string> = {
  burn: '灼烧', freeze: '冰冻', paralyze: '麻痹', poison: '中毒', confuse: '混乱',
};
const CAT_LABEL: Record<string, string> = {
  physical: '物理', special: '特殊', status: '变化',
};

/** 把技能字段拼成一句简短效果说明 */
function buildSkillDesc(s: Skill): string {
  const parts: string[] = [];
  if (s.power > 0) parts.push(`威力 ${s.power}`);
  if (s.accuracy < 100) parts.push(`命中 ${s.accuracy}%`);
  if (s.alwaysHit) parts.push('必定命中');
  if (s.statusInflict) {
    const ch = s.statusInflictChance ? ` ${Math.round(s.statusInflictChance * 100)}%` : '';
    parts.push(`使对手${STATUS_NAMES[s.statusInflict] || s.statusInflict}${ch}`);
  }
  if (s.statChanges) {
    const txt = Object.entries(s.statChanges)
      .map(([k, v]) => `${STAT_LABELS[k] || k}${v > 0 ? '+' : ''}${v}`)
      .join(' ');
    parts.push(`变化 ${txt}`);
  }
  if (s.effect) parts.push(s.effect);
  if (s.healRatio) parts.push(`回复${Math.round(s.healRatio * 100)}%`);
  if (s.drainRatio) parts.push(`吸取${Math.round(s.drainRatio * 100)}%`);
  if (s.recoil) parts.push(`反伤${Math.round((s.recoilRatio || 0) * 100)}%`);
  if (s.critRate) parts.push('易暴击');
  if (s.chargeTurn) parts.push('蓄力一回合');
  if (s.forceSwitch) parts.push('强制换宠');
  return parts.join(' · ');
}

export class PetInfoScene {
  readonly el: HTMLElement;
  private onBack: () => void;
  private selectedId: number;

  constructor(onBack: () => void) {
    this.onBack = onBack;
    this.selectedId = PETS[0]?.id ?? 0;
    this.el = document.createElement('div');
    this.el.className = 'scene pi-scene';
    this.render();
  }

  private render(): void {
    this.el.innerHTML = `
      <div class="pi-head">
        <button class="pi-back" id="btn-pi-back">🏠 返回</button>
        <div class="pi-title">📊 宠物属性</div>
        <div class="pi-sub">查阅精灵属性与技能 · 配队前心里有数</div>
      </div>
      <div class="pi-body">
        <div class="pi-list" id="pi-list"></div>
        <div class="pi-detail" id="pi-detail"></div>
      </div>
    `;

    const list = this.el.querySelector('#pi-list') as HTMLElement;
    list.innerHTML = PETS.map(p => {
      const color = ELEMENT_COLORS[p.element] || '#667eea';
      return `
        <div class="pi-item ${p.id === this.selectedId ? 'active' : ''}" data-pet-id="${p.id}" style="--c:${color}">
          <span class="pi-item-emoji">${p.emoji}</span>
          <span class="pi-item-name">${p.name}</span>
        </div>`;
    }).join('');

    list.querySelectorAll('.pi-item').forEach(item => {
      item.addEventListener('click', () => {
        AudioManager.playClickSound();
        const id = Number((item as HTMLElement).dataset.petId);
        this.selectedId = id;
        list.querySelectorAll('.pi-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.renderDetail();
      });
    });

    this.el.querySelector('#btn-pi-back')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onBack();
    });

    this.renderDetail();
  }

  private renderDetail(): void {
    const detail = this.el.querySelector('#pi-detail') as HTMLElement;
    const pet = PETS.find(p => p.id === this.selectedId);
    if (!pet) {
      detail.innerHTML = '<div class="pi-empty">未找到该宠物</div>';
      return;
    }

    const color = ELEMENT_COLORS[pet.element] || '#667eea';
    const secColor = pet.secondaryElement ? ELEMENT_COLORS[pet.secondaryElement] : null;
    const trait = TRAITS[pet.trait];

    const attrs = [
      { key: 'HP', val: maxHp(pet.baseHp), cap: 360 },
      { key: '攻击', val: stat(pet.baseAtk), cap: 320 },
      { key: '防御', val: stat(pet.baseDef), cap: 320 },
      { key: '魔攻', val: stat(pet.baseSpA), cap: 320 },
      { key: '魔抗', val: stat(pet.baseSpD), cap: 320 },
      { key: '速度', val: stat(pet.baseSpe), cap: 320 },
    ];
    const statsHtml = attrs.map(a => `
      <div class="pd-stat">
        <span class="pd-stat-key">${a.key}</span>
        <div class="pd-stat-bar"><div class="pd-stat-fill" style="width:${Math.min(100, Math.floor(a.val / a.cap * 100))}%;background:${color}"></div></div>
        <span class="pd-stat-val">${a.val}</span>
      </div>`).join('');

    const skillsHtml = pet.skills.map(id => {
      const s = getSkillById(id);
      if (!s) return '';
      const sc = ELEMENT_COLORS[s.element] || '#888';
      return `
        <div class="pd-skill" style="--sc:${sc}">
          <div class="pd-skill-top">
            <span class="pd-skill-el" style="background:${sc}22;color:${sc}">${ELEMENT_EMOJIS[s.element] || ''}${ELEMENT_NAMES[s.element] || ''}</span>
            <span class="pd-skill-name">${s.name}</span>
            <span class="pd-skill-cat cat-${s.category}">${CAT_LABEL[s.category] || s.category}</span>
          </div>
          <div class="pd-skill-meta">
            <span>威力 ${s.power > 0 ? s.power : '—'}</span>
            <span>命中 ${s.accuracy}%</span>
            <span>PP ${s.maxPp}</span>
          </div>
          <div class="pd-skill-desc">${buildSkillDesc(s) || '—'}</div>
        </div>`;
    }).join('');

    detail.innerHTML = `
      <div class="pd-head" style="--c:${color}">
        <span class="pd-emoji">${pet.emoji}</span>
        <div class="pd-id">
          <div class="pd-name">${pet.name}</div>
          <div class="pd-elems">
            <span class="pd-el" style="background:${color}22;color:${color}">${ELEMENT_EMOJIS[pet.element]}${ELEMENT_NAMES[pet.element]}</span>
            ${secColor ? `<span class="pd-el" style="background:${secColor}22;color:${secColor}">${ELEMENT_EMOJIS[pet.secondaryElement!]}${ELEMENT_NAMES[pet.secondaryElement!]}</span>` : ''}
            ${pet.rarity ? `<span class="pd-rarity">${pet.rarity}</span>` : ''}
          </div>
          ${trait ? `<div class="pd-trait">特性 · ${trait.name}：${trait.description}</div>` : ''}
          ${pet.description ? `<div class="pd-desc">${pet.description}</div>` : ''}
        </div>
      </div>
      <div class="pd-section-title">属性（50级基准）</div>
      <div class="pd-stats">${statsHtml}</div>
      <div class="pd-section-title">技能（${pet.skills.length}）</div>
      <div class="pd-skills">${skillsHtml}</div>
    `;
  }
}
