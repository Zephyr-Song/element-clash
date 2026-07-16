/**
 * PetSelectScene.ts - 选宠场景
 * 支持显示对手预览、精灵解锁状态
 */

import type { Pet } from '../data/types';
import { PETS } from '../data/Pets';
import { getUnlockedPetIds, STAGES } from '../data/Stages';
import { PetCard } from './components/PetCard';
import { AudioManager } from '../utils/AudioManager';
import { loadSave } from '../utils/Storage';

export class PetSelectScene {
  readonly el: HTMLElement;
  private selectedPets: Set<number> = new Set();
  private cards: PetCard[] = [];
  private onConfirm: (pets: Pet[]) => void;
  private onBack: () => void;
  private enemyPets: Pet[];

  constructor(onConfirm: (pets: Pet[]) => void, onBack: () => void, enemyPets?: Pet[]) {
    this.onConfirm = onConfirm;
    this.onBack = onBack;
    this.enemyPets = enemyPets || [];

    this.el = document.createElement('div');
    this.el.className = 'scene pet-select';
    this.render();
  }

  private render(): void {
    this.el.innerHTML = '';

    const save = loadSave();
    const unlockedIds = new Set(getUnlockedPetIds(save.completedStages));

    // 计算解锁进度
    const totalPets = PETS.length;
    const unlockedCount = unlockedIds.size;

    const title = document.createElement('h2');
    title.className = 'ps-title';
    title.textContent = `选择你的战队（选3只）`;
    this.el.appendChild(title);

    // 解锁进度提示
    const progressHint = document.createElement('p');
    progressHint.style.cssText = 'font-size:.8em;color:rgba(255,255,255,.4);margin:-8px 0 12px';
    progressHint.textContent = `📖 已解锁 ${unlockedCount}/${totalPets} 只精灵，通关关卡可解锁更多`;
    this.el.appendChild(progressHint);

    // 对手预览区域
    if (this.enemyPets.length > 0) {
      const preview = document.createElement('div');
      preview.style.cssText = 'background:rgba(255,80,80,.08);border:1px solid rgba(255,80,80,.2);border-radius:12px;padding:12px 16px;margin-bottom:16px;text-align:center';
      const previewTitle = document.createElement('div');
      previewTitle.style.cssText = 'font-size:.85em;color:rgba(255,255,255,.5);margin-bottom:8px';
      previewTitle.textContent = '⚠️ 对手阵容';
      preview.appendChild(previewTitle);
      const petRow = document.createElement('div');
      petRow.style.cssText = 'display:flex;justify-content:center;gap:16px;flex-wrap:wrap';
      for (const ep of this.enemyPets) {
        const tag = document.createElement('span');
        tag.style.cssText = 'color:#fff;font-size:.95em';
        tag.textContent = `${ep.emoji} ${ep.name}`;
        petRow.appendChild(tag);
      }
      preview.appendChild(petRow);
      this.el.appendChild(preview);
    }

    const count = document.createElement('p');
    count.className = 'ps-count';
    count.id = 'select-count';
    count.textContent = '已选择: 0/3';
    this.el.appendChild(count);

    const grid = document.createElement('div');
    grid.className = 'pet-grid';
    this.cards = [];

    // 构建奖励精灵到关卡名的映射
    const rewardMap = new Map<number, string>();
    for (const stage of STAGES) {
      rewardMap.set(stage.rewardPetId, `通关「${stage.name}」解锁`);
    }

    for (const pet of PETS) {
      const isUnlocked = unlockedIds.has(pet.id);
      const hint = rewardMap.get(pet.id) || '';

      const card = new PetCard(pet, (p) => {
        if (card.isSelected) {
          this.selectedPets.add(p.id);
          if (this.selectedPets.size > 3) {
            this.selectedPets.delete(p.id);
            card.setSelected(false);
          }
        } else {
          this.selectedPets.delete(p.id);
        }
        this.updateCount();
      }, !isUnlocked, hint);

      this.cards.push(card);
      grid.appendChild(card.el);
    }
    this.el.appendChild(grid);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;justify-content:center';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = '🏠 返回';
    backBtn.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onBack();
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-success';
    confirmBtn.textContent = '✅ 确认组队';
    confirmBtn.id = 'btn-confirm-team';
    confirmBtn.disabled = true;
    confirmBtn.addEventListener('click', () => {
      if (this.selectedPets.size === 3) {
        AudioManager.playClickSound();
        const pets = PETS.filter(p => this.selectedPets.has(p.id));
        this.onConfirm(pets);
      }
    });

    btnRow.appendChild(backBtn);
    btnRow.appendChild(confirmBtn);
    this.el.appendChild(btnRow);
  }

  private updateCount(): void {
    const countEl = this.el.querySelector('#select-count');
    const confirmBtn = this.el.querySelector('#btn-confirm-team') as HTMLButtonElement;
    if (countEl) countEl.textContent = `已选择: ${this.selectedPets.size}/3`;
    if (confirmBtn) confirmBtn.disabled = this.selectedPets.size !== 3;
  }
}
