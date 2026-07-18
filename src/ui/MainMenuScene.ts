/**
 * MainMenuScene.ts - 主菜单场景
 */

import { AudioManager } from '../utils/AudioManager';
import { loadSave, hasCheckedInToday, getCheckInInfo } from '../utils/Storage';
import { STAGES } from '../data/Stages';

export class MainMenuScene {
  readonly el: HTMLElement;
  private onStartBattle: () => void;
  private onOpenPokedex: () => void;
  private onOpenSettings: () => void;
  private onOpenGuide: () => void;
  private onOpenGacha: () => void;
  private onOpenCheckIn: () => void;
  private onOpenTasks: () => void;
  private onOpenAchievements: () => void;
  private onOpenBag: () => void;

  constructor(
    onStartBattle: () => void,
    onOpenPokedex: () => void,
    onOpenSettings: () => void,
    onOpenGuide: () => void,
    onOpenGacha: () => void,
    onOpenCheckIn: () => void,
    onOpenTasks: () => void,
    onOpenAchievements: () => void,
    onOpenBag: () => void,
  ) {
    this.onStartBattle = onStartBattle;
    this.onOpenPokedex = onOpenPokedex;
    this.onOpenSettings = onOpenSettings;
    this.onOpenGuide = onOpenGuide;
    this.onOpenGacha = onOpenGacha;
    this.onOpenCheckIn = onOpenCheckIn;
    this.onOpenTasks = onOpenTasks;
    this.onOpenAchievements = onOpenAchievements;
    this.onOpenBag = onOpenBag;

    this.el = document.createElement('div');
    this.el.className = 'scene main-menu';
    this.render();
  }

  render(): void {
    const save = loadSave();
    const checkInInfo = getCheckInInfo();

    // 粒子背景
    const particles = document.createElement('div');
    particles.className = 'particles';
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 4 + 2;
      const colors = ['#f1c40f', '#e84545', '#667eea', '#26de81', '#4facfe', '#a55eea'];
      p.style.cssText = `
        width:${size}px;height:${size}px;
        left:${Math.random() * 100}%;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        animation-duration:${Math.random() * 8 + 6}s;
        animation-delay:${Math.random() * 6}s;
      `;
      particles.appendChild(p);
    }
    this.el.appendChild(particles);

    this.el.innerHTML += `
      <h1 class="main-title">⚔️ 元素对决 ⚔️</h1>
      <p class="main-subtitle">Element Clash — 属性克制回合制卡牌对战</p>
      <div class="main-buttons">
        <button class="btn btn-primary" id="btn-start">🗺️ 关卡冒险</button>
        <button class="btn btn-primary" id="btn-gacha" style="background:linear-gradient(135deg,#a55eea,#6c5ce7)">🎰 精灵召唤</button>
        <button class="btn btn-secondary" id="btn-checkin" style="position:relative">
          📅 每日签到
          ${checkInInfo.canCheckIn ? '<span style="position:absolute;top:-4px;right:-4px;width:10px;height:10px;border-radius:50%;background:#e84545;animation:pulse 1s infinite"></span>' : ''}
        </button>
        <button class="btn btn-secondary" id="btn-guide">📖 玩法介绍</button>
        <button class="btn btn-secondary" id="btn-pokedex">📕 宠物图鉴</button>
        <button class="btn btn-secondary" id="btn-settings">⚙️ 游戏设置</button>
        <button class="btn btn-secondary" id="btn-tasks">📋 每日任务</button>
        <button class="btn btn-secondary" id="btn-achievements">🏅 成就</button>
        <button class="btn btn-secondary" id="btn-bag">🎒 背包</button>
      </div>
      <div class="main-info">
        <span>🗺️ 关卡: ${save.completedStages.length}/${STAGES.length}</span>
        <span>🪙 ${save.coins}</span>
        <span>🏆 ${save.wins}胜 ${save.losses}负</span>
        <span>🔊 ${save.soundEnabled ? '开' : '关'}</span>
      </div>
    `;

    // 事件绑定
    this.el.querySelector('#btn-start')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onStartBattle();
    });
    this.el.querySelector('#btn-gacha')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onOpenGacha();
    });
    this.el.querySelector('#btn-checkin')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onOpenCheckIn();
    });
    this.el.querySelector('#btn-guide')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onOpenGuide();
    });
    this.el.querySelector('#btn-pokedex')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onOpenPokedex();
    });
    this.el.querySelector('#btn-settings')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onOpenSettings();
    });
    this.el.querySelector('#btn-tasks')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onOpenTasks();
    });
    this.el.querySelector('#btn-achievements')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onOpenAchievements();
    });
    this.el.querySelector('#btn-bag')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onOpenBag();
    });
  }

  refresh(): void {
    const save = loadSave();
    const info = this.el.querySelector('.main-info');
    if (info) {
      info.innerHTML = `
        <span>🗺️ 关卡: ${save.completedStages.length}/${STAGES.length}</span>
        <span>🪙 ${save.coins}</span>
        <span>🏆 ${save.wins}胜 ${save.losses}负</span>
        <span>🔊 ${save.soundEnabled ? '开' : '关'}</span>
      `;
    }
  }
}
