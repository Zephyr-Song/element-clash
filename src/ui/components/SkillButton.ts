/**
 * SkillButton.ts - 技能按钮组件
 */

import type { Skill } from '../../data/types';
import { ELEMENT_COLORS, ELEMENT_NAMES } from '../../data/types';
import { AudioManager } from '../../utils/AudioManager';

export class SkillButton {
  readonly el: HTMLButtonElement;
  private skill: Skill;
  private ppLeft: number;
  private onClick: (skillIndex: number) => void;
  private index: number;

  constructor(skill: Skill, ppLeft: number, index: number, onClick: (idx: number) => void) {
    this.skill = skill;
    this.ppLeft = ppLeft;
    this.index = index;
    this.onClick = onClick;

    this.el = document.createElement('button');
    this.el.className = 'skill-btn';
    this.el.style.background = `${ELEMENT_COLORS[skill.element] || '#666'}cc`;

    this.render();

    this.el.addEventListener('click', () => {
      if (this.ppLeft > 0) {
        AudioManager.playClickSound();
        this.onClick(this.index);
      }
    });
  }

  render(): void {
    const catIcon = this.skill.category === 'physical' ? '⚔️' : this.skill.category === 'special' ? '✨' : '🔄';
    this.el.innerHTML = `
      <span class="sk-el">${ELEMENT_NAMES[this.skill.element] || ''} ${catIcon}</span>
      <span class="sk-name">${this.skill.name}</span>
      <span class="sk-pp">PP ${this.ppLeft}/${this.skill.maxPp}</span>
    `;

    this.el.disabled = this.ppLeft <= 0;
  }

  updatePp(pp: number): void {
    this.ppLeft = pp;
    this.render();
  }

  getCurrentPp(): number {
    return this.ppLeft;
  }
}
