/**
 * ActionLog.ts - 战斗日志组件
 */

import type { BattleEvent } from '../../data/types';

export class ActionLog {
  readonly el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'battle-log';
  }

  addEvent(event: BattleEvent): void {
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const side = event.side === 'player' ? '🛡️' : '💀';
    const text = this.formatEvent(event);
    if (!text) return;

    entry.textContent = `${side} ${text}`;

    // 添加类型样式
    if (event.type === 'move_use' || event.type === 'move_hit') entry.classList.add('log-move');
    else if (event.type === 'damage' || event.type === 'status_damage' || event.type === 'recoil') entry.classList.add('log-damage');
    else if (event.type === 'heal' || event.type === 'drain') entry.classList.add('log-heal');
    else if (event.type === 'miss') entry.classList.add('log-miss');
    else if (event.type === 'critical') entry.classList.add('log-crit');
    else if (event.type === 'effectiveness') entry.classList.add('log-effective');
    else if (event.type === 'status_inflict' || event.type === 'status_cure') entry.classList.add('log-status');
    else if (event.type === 'stat_change') entry.classList.add('log-stat');
    else if (event.type === 'faint') entry.classList.add('log-faint');
    else if (event.type === 'switch_in' || event.type === 'switch_out') entry.classList.add('log-switch');
    else if (event.type === 'trait_activate') entry.classList.add('log-trait');
    else if (event.type === 'win' || event.type === 'lose') entry.classList.add('log-system');

    this.el.appendChild(entry);
    // 自动滚动到底部
    this.el.scrollTop = this.el.scrollHeight;
  }

  addMessage(text: string): void {
    const entry = document.createElement('div');
    entry.className = 'log-entry log-system';
    entry.textContent = text;
    this.el.appendChild(entry);
    this.el.scrollTop = this.el.scrollHeight;
  }

  clear(): void {
    this.el.innerHTML = '';
  }

  private formatEvent(event: BattleEvent): string {
    switch (event.type) {
      case 'move_use': return `${event.petName} 使用了 ${event.skillName}!`;
      case 'move_hit': return '';
      case 'damage': return `${event.petName} 受到了 ${event.damage} 点伤害!`;
      case 'heal': return `${event.petName} 恢复了 ${event.healAmount} HP!`;
      case 'miss': return `攻击未命中!`;
      case 'critical': return '暴击!';
      case 'effectiveness': return event.effectivenessText || '';
      case 'status_inflict': return `${event.petName} ${event.statusName}了!`;
      case 'status_damage':
        return event.damage && event.damage > 0
          ? `${event.petName} 受到${event.statusName}伤害 ${event.damage}!`
          : `${event.petName} 因${event.statusName}无法行动!`;
      case 'status_cure': return `${event.petName} 的${event.statusName}解除了!`;
      case 'stat_change': return `${event.petName} ${event.statChangeText}`;
      case 'faint': return `${event.petName} 倒下了!`;
      case 'switch_in': return `上吧，${event.petName}!`;
      case 'switch_out': return `${event.petName}，回来吧!`;
      case 'item_use': return `使用了${event.itemName}!`;
      case 'trait_activate': return `${event.petName} 的${event.traitName}发动了!`;
      case 'charge': return `${event.petName} 正在蓄力 ${event.skillName}!`;
      case 'recoil': return `${event.petName} 受到了反伤 ${event.damage}!`;
      case 'drain': return `${event.petName} 吸取了 ${event.healAmount} HP!`;
      case 'force_switch': return `${event.petName} 被强制换下场!`;
      case 'win': return '🎉 胜利! 所有敌方宠物被击败!';
      case 'lose': return '💔 战败... 我方宠物全灭了。';
      default: return '';
    }
  }
}
