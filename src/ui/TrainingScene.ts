/**
 * TrainingScene.ts - 宠物养成窗口
 * 集中展示已拥有（已解锁）宠物的等级 / 经验 / 进化进度 / 实时属性。
 * 打关卡获胜获得的经验会自动汇总到这里（由 Storage.addBattleExp 写入）。
 */

import type { Pet } from '../data/types';
import { ELEMENT_COLORS, ELEMENT_NAMES, ELEMENT_EMOJIS } from '../data/types';
import { PETS, getEvolution } from '../data/Pets';
import { getUnlockedPetIds } from '../data/Stages';
import {
  loadSave,
  getPetLevel,
  getPetExp,
  isPetEvolved,
  expToNext,
  DEFAULT_PET_LEVEL,
} from '../utils/Storage';
import { AudioManager } from '../utils/AudioManager';

export class TrainingScene {
  readonly el: HTMLElement;
  private onBack: () => void;

  constructor(onBack: () => void) {
    this.onBack = onBack;
    this.el = document.createElement('div');
    this.el.className = 'scene training-scene';
    this.render();
  }

  private render(): void {
    const save = loadSave();
    const unlockedIds = getUnlockedPetIds(save.completedStages);
    const pets = PETS.filter(p => unlockedIds.includes(p.id));

    // 概览统计
    let totalLevel = 0;
    let evolvableSoon: { pet: Pet; remain: number } | null = null;
    for (const p of pets) {
      const lv = getPetLevel(p.id);
      totalLevel += lv;
      const evo = getEvolution(p.id);
      if (evo && !isPetEvolved(p.id) && lv < evo.level) {
        const remain = evo.level - lv;
        if (!evolvableSoon || remain < evolvableSoon.remain) {
          evolvableSoon = { pet: p, remain };
        }
      }
    }
    const avgLevel = pets.length ? Math.round(totalLevel / pets.length) : 0;

    this.el.innerHTML = `
      <div class="train-head">
        <button class="train-back" id="btn-train-back">🏠 返回</button>
        <div class="train-title">🐾 宠物养成</div>
        <div class="train-sub">通关关卡获取经验 · 提升等级与进化你的伙伴</div>
      </div>

      <div class="train-stats">
        <div class="tstat"><span class="tstat-ic">📕</span><span>已拥有 ${pets.length} 只</span></div>
        <div class="tstat"><span class="tstat-ic">⭐</span><span>平均等级 Lv.${avgLevel}</span></div>
        <div class="tstat"><span class="tstat-ic">🌟</span><span>${evolvableSoon
          ? `${evolvableSoon.pet.emoji} ${evolvableSoon.pet.name} 距进化还差 ${evolvableSoon.remain} 级`
          : '暂无临近进化'}</span></div>
      </div>

      <div class="train-grid">
        ${pets.map(p => this.renderCard(p)).join('')}
      </div>
    `;

    this.el.querySelector('#btn-train-back')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onBack();
    });
  }

  private renderCard(pet: Pet): string {
    const level = getPetLevel(pet.id);
    const exp = getPetExp(pet.id);
    const need = expToNext(level);
    const pct = Math.max(3, Math.min(100, Math.floor((exp / need) * 100)));
    const evolved = isPetEvolved(pet.id);
    const evo = getEvolution(pet.id);
    const color = ELEMENT_COLORS[pet.element] || '#667eea';

    // 与战斗一致的属性缩放：基准 50 级，进化再乘 (1+bonus)
    const lvMul = level / DEFAULT_PET_LEVEL;
    const evoMul = evolved && evo ? 1 + evo.bonus : 1;
    const stat = (base: number) => Math.round(base * lvMul * evoMul);

    let evoLine: string;
    if (evolved && evo) {
      evoLine = `<div class="tr-evo done">🌟 已进化为 <b>${evo.emoji} ${evo.name}</b></div>`;
    } else if (evo) {
      const remain = evo.level - level;
      evoLine = `<div class="tr-evo">⬆ Lv.${evo.level} 进化为 ${evo.emoji} ${evo.name}<span class="tr-evo-remain">（还差 ${remain} 级）</span></div>`;
    } else {
      evoLine = `<div class="tr-evo muted">— 无法进化 —</div>`;
    }

    return `
      <div class="train-card" style="--c:${color}">
        <div class="tr-top">
          <span class="tr-emoji">${pet.emoji}</span>
          <div class="tr-name">${pet.name}</div>
          <div class="tr-lv">Lv.${level}</div>
        </div>
        <div class="tr-elem">
          <span class="tr-el" style="background:${color}22;color:${color}">${ELEMENT_EMOJIS[pet.element]}${ELEMENT_NAMES[pet.element]}</span>
          ${pet.secondaryElement
            ? `<span class="tr-el" style="background:${ELEMENT_COLORS[pet.secondaryElement]}22;color:${ELEMENT_COLORS[pet.secondaryElement]}">${ELEMENT_EMOJIS[pet.secondaryElement]}${ELEMENT_NAMES[pet.secondaryElement]}</span>`
            : ''}
        </div>
        <div class="tr-xpbar"><div class="tr-xpfill" style="width:${pct}%"></div></div>
        <div class="tr-xptxt">EXP ${exp} / ${need}</div>
        ${evoLine}
        <div class="tr-stats">
          <span>HP ${stat(pet.baseHp)}</span>
          <span>攻 ${stat(pet.baseAtk)}</span>
          <span>防 ${stat(pet.baseDef)}</span>
          <span>魔 ${stat(pet.baseSpA)}</span>
          <span>抗 ${stat(pet.baseSpD)}</span>
          <span>速 ${stat(pet.baseSpe)}</span>
        </div>
      </div>
    `;
  }
}
