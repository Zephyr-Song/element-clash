/**
 * ResultScene.ts - 结果场景
 * 支持关卡通过提示和下一关按钮
 */

import type { BattleState, Pet } from '../data/types';
import { PETS } from '../data/Pets';
import { AudioManager } from '../utils/AudioManager';

export class ResultScene {
  readonly el: HTMLElement;
  private onReplay: () => void;
  private onHome: () => void;
  private onShare: () => void;
  private onNextStage?: () => void;
  private state: BattleState;
  private isStageCleared: boolean;
  private hasNextStage: boolean;
  private rewardPetId?: number;

  constructor(
    state: BattleState,
    onReplay: () => void,
    onHome: () => void,
    onShare: () => void,
    isStageCleared: boolean = false,
    hasNextStage: boolean = false,
    onNextStage?: () => void,
    rewardPetId?: number,
  ) {
    this.state = state;
    this.onReplay = onReplay;
    this.onHome = onHome;
    this.onShare = onShare;
    this.onNextStage = onNextStage;
    this.isStageCleared = isStageCleared;
    this.hasNextStage = hasNextStage;
    this.rewardPetId = rewardPetId;

    this.el = document.createElement('div');
    this.el.className = 'scene result-scene';
    this.render();
  }

  private render(): void {
    const isWin = this.state.stats.winner === 'player';

    // 胜利粒子
    if (isWin) {
      const particles = document.createElement('div');
      particles.className = 'victory-particles';
      for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.className = 'v-particle';
        const size = Math.random() * 8 + 4;
        const colors = ['#f1c40f', '#e84545', '#667eea', '#26de81', '#4facfe', '#fd79a8'];
        const cx = 50 + (Math.random() - 0.5) * 20;
        const cy = 50 + (Math.random() - 0.5) * 20;
        const tx = (Math.random() - 0.5) * 100;
        const ty = -(Math.random() * 80 + 40);
        p.style.cssText = `
          width:${size}px;height:${size}px;
          left:${cx}%;top:${cy}%;
          background:${colors[Math.floor(Math.random() * colors.length)]};
          animation-delay:${Math.random() * 0.3}s;
          --tx:${tx}vw;--ty:${ty}vh;
          animation:vBurst ${Math.random() * 0.8 + 0.8}s ease-out ${Math.random() * 0.3}s forwards;
        `;
        // 覆盖动画终点
        p.animate([
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
          { transform: `translate(${tx}vw, ${ty}vh) scale(0)`, opacity: 0 },
        ], {
          duration: Math.random() * 800 + 800,
          delay: Math.random() * 300,
          fill: 'forwards',
          easing: 'ease-out',
        });
        particles.appendChild(p);
      }
      this.el.appendChild(particles);
    }

    const text = document.createElement('div');
    text.className = `result-text ${isWin ? 'win' : 'lose'}`;
    if (this.isStageCleared) {
      text.textContent = '🎉 关卡通过!';
    } else {
      text.textContent = isWin ? '🎉 VICTORY!' : '💔 DEFEAT...';
    }
    this.el.appendChild(text);

    // 新精灵解锁提示
    if (this.isStageCleared && this.rewardPetId) {
      const rewardPet = PETS.find(p => p.id === this.rewardPetId);
      if (rewardPet) {
        const unlockBanner = document.createElement('div');
        unlockBanner.style.cssText = 'background:rgba(38,222,129,.12);border:1px solid rgba(38,222,129,.3);border-radius:12px;padding:14px 20px;margin:8px 0;text-align:center';
        unlockBanner.innerHTML = `
          <div style="font-size:.85em;color:rgba(255,255,255,.6);margin-bottom:6px">🎁 新精灵解锁!</div>
          <div style="font-size:1.8em;margin:4px 0">${rewardPet.emoji}</div>
          <div style="font-weight:700;color:#26de81;font-size:1.1em">${rewardPet.name}</div>
        `;
        this.el.appendChild(unlockBanner);
      }
    }

    // 找出MVP宠物
    const mvpPet = this.findMvp();

    const panel = document.createElement('div');
    panel.className = 'result-panel';
    panel.innerHTML = `
      <h3>📊 战斗统计</h3>
      <div class="result-stat"><span class="label">总回合数</span><span class="value">${this.state.stats.totalTurns}</span></div>
      <div class="result-stat"><span class="label">造成总伤害</span><span class="value">${this.state.stats.totalDamageDealt}</span></div>
      <div class="result-stat"><span class="label">承受总伤害</span><span class="value">${this.state.stats.totalDamageTaken}</span></div>
      <div class="result-stat"><span class="label">最高单次伤害</span><span class="value">${this.state.stats.highestSingleDamage}</span></div>
      <div class="result-stat"><span class="label">击杀数</span><span class="value">${this.state.stats.kills}</span></div>
      ${mvpPet ? `<div class="result-stat"><span class="label">MVP</span><span class="value">${mvpPet.pet.emoji} ${mvpPet.pet.name}</span></div>` : ''}
    `;
    this.el.appendChild(panel);

    const buttons = document.createElement('div');
    buttons.className = 'result-buttons';

    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn btn-secondary';
    shareBtn.textContent = '📤 分享战绩';
    shareBtn.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onShare();
    });

    const replayBtn = document.createElement('button');
    replayBtn.className = 'btn btn-primary';
    replayBtn.textContent = '🔄 重试本关';
    replayBtn.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onReplay();
    });

    // 下一关按钮（通关后显示）
    if (this.hasNextStage && this.onNextStage) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-success';
      nextBtn.textContent = '➡️ 下一关';
      nextBtn.style.cssText = 'animation:pulse 1.5s infinite';
      nextBtn.addEventListener('click', () => {
        AudioManager.playClickSound();
        this.onNextStage!();
      });
      buttons.appendChild(nextBtn);
    }

    const homeBtn = document.createElement('button');
    homeBtn.className = 'btn btn-secondary';
    homeBtn.textContent = '🗺️ 关卡选择';
    homeBtn.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onHome();
    });

    buttons.appendChild(shareBtn);
    buttons.appendChild(replayBtn);
    buttons.appendChild(homeBtn);
    this.el.appendChild(buttons);

    // 播放音效
    if (isWin) AudioManager.playVictorySound();
    else AudioManager.playDefeatSound();
  }

  private findMvp(): { pet: { emoji: string; name: string }; damageDealt: number } | null {
    // MVP = 存活且造成最多伤害（简化：取存活的最后活跃宠物）
    const alivePets = this.state.playerParty.filter(p => p.isAlive);
    if (alivePets.length > 0) {
      return { pet: { emoji: alivePets[0].pet.emoji, name: alivePets[0].pet.name }, damageDealt: 0 };
    }
    // 全灭则取最后倒下的
    const all = this.state.playerParty;
    return { pet: { emoji: all[0].pet.emoji, name: all[0].pet.name }, damageDealt: 0 };
  }

  getShareText(): string {
    const isWin = this.state.stats.winner === 'player';
    const mvp = this.findMvp();
    return [
      '⚔️ 元素对决 · 战绩分享 ⚔️',
      '',
      isWin ? '🎉 我赢得了胜利!' : '😢 遗憾落败...',
      mvp ? `MVP: ${mvp.pet.emoji} ${mvp.pet.name}` : '',
      `📊 最高单次伤害: ${this.state.stats.highestSingleDamage}`,
      `⏱️ 总回合: ${this.state.stats.totalTurns}`,
      `🔥 击杀数: ${this.state.stats.kills}`,
      '',
      '👇 来挑战我吧！',
    ].filter(Boolean).join('\n');
  }
}
