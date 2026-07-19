/**
 * MainMenuScene.ts - 主菜单场景
 */

import { AudioManager } from '../utils/AudioManager';
import { loadSave, saveSave, hasCheckedInToday, getCheckInInfo, canClaimNewbiePack } from '../utils/Storage';
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
  private onClaimNewbiePack: () => void;
  private onOpenTraining: () => void;

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
    onClaimNewbiePack: () => void,
    onOpenTraining: () => void,
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
    this.onClaimNewbiePack = onClaimNewbiePack;
    this.onOpenTraining = onOpenTraining;

    this.el = document.createElement('div');
    this.el.className = 'scene main-menu';
    this.render();
  }

  render(): void {
    const save = loadSave();
    const checkInInfo = getCheckInInfo();

    // 粒子背景（固定全屏，作为底层）
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

    this.el.innerHTML = `
      <button class="btn-bgm-toggle ${AudioManager.bgmEnabled ? '' : 'off'}" id="btn-bgm" title="背景音乐开关">${AudioManager.bgmEnabled ? '🎵' : '🔇'}</button>
      <button class="btn-newbie ${canClaimNewbiePack() ? '' : 'claimed'}" id="btn-newbie">🎁 新手礼包</button>

      <div class="menu-shell">
        <div class="menu-topbar">
          <div class="stat-chip"><span class="chip-ic">🗺️</span><span class="chip-txt">关卡 ${save.completedStages.length}/${STAGES.length}</span></div>
          <div class="stat-chip"><span class="chip-ic">🪙</span><span class="chip-txt">${save.coins}</span></div>
          <div class="stat-chip"><span class="chip-ic">🏆</span><span class="chip-txt">${save.wins}胜 ${save.losses}负</span></div>
          <div class="stat-chip"><span class="chip-ic">🔊</span><span class="chip-txt">${save.soundEnabled ? '开' : '关'}</span></div>
        </div>

        <header class="menu-hero">
          <h1 class="main-title">⚔️ 元素对决 ⚔️</h1>
          <p class="main-subtitle">Element Clash · 属性克制回合制卡牌对战</p>
        </header>

        <div class="menu-section-label">核心玩法</div>
        <div class="menu-grid menu-grid-core">
          <button class="menu-card card-primary" id="btn-start">
            <span class="mc-icon">🗺️</span>
            <span class="mc-body"><span class="mc-title">关卡冒险</span><span class="mc-desc">挑战 ${STAGES.length} 关 · 收服元素精灵</span></span>
            <span class="mc-arrow">›</span>
          </button>
          <button class="menu-card card-gacha" id="btn-gacha">
            <span class="mc-icon">🎰</span>
            <span class="mc-body"><span class="mc-title">精灵召唤</span><span class="mc-desc">抽取稀有伙伴 · 强化阵容</span></span>
            <span class="mc-arrow">›</span>
          </button>
        </div>

        <div class="menu-section-label">培养</div>
        <div class="menu-grid menu-grid-core">
          <button class="menu-card card-train" id="btn-training">
            <span class="mc-icon">📊</span>
            <span class="mc-body"><span class="mc-title">宠物属性</span><span class="mc-desc">查看属性与技能</span></span>
            <span class="mc-arrow">›</span>
          </button>
        </div>

        <div class="menu-section-label">日常 & 收藏</div>
        <div class="menu-grid menu-grid-sub">
          <button class="menu-card" id="btn-checkin">
            <span class="mc-icon">📅</span>
            <span class="mc-body"><span class="mc-title">每日签到</span><span class="mc-desc">领金币与药水</span></span>
            ${checkInInfo.canCheckIn ? '<span class="dot"></span>' : ''}
          </button>
          <button class="menu-card" id="btn-tasks">
            <span class="mc-icon">📋</span>
            <span class="mc-body"><span class="mc-title">每日任务</span><span class="mc-desc">完成任务得奖励</span></span>
          </button>
          <button class="menu-card" id="btn-achievements">
            <span class="mc-icon">🏅</span>
            <span class="mc-body"><span class="mc-title">成就</span><span class="mc-desc">解锁收藏荣誉</span></span>
          </button>
          <button class="menu-card" id="btn-bag">
            <span class="mc-icon">🎒</span>
            <span class="mc-body"><span class="mc-title">背包</span><span class="mc-desc">药水与道具</span></span>
          </button>
          <button class="menu-card" id="btn-pokedex">
            <span class="mc-icon">📕</span>
            <span class="mc-body"><span class="mc-title">宠物图鉴</span><span class="mc-desc">查看全部精灵</span></span>
          </button>
          <button class="menu-card" id="btn-guide">
            <span class="mc-icon">📖</span>
            <span class="mc-body"><span class="mc-title">玩法介绍</span><span class="mc-desc">属性克制说明</span></span>
          </button>
          <button class="menu-card" id="btn-settings">
            <span class="mc-icon">⚙️</span>
            <span class="mc-body"><span class="mc-title">游戏设置</span><span class="mc-desc">音效 · 音量</span></span>
          </button>
        </div>

        <footer class="menu-footer">⚔️ 元素对决 · 收集 · 养成 · 对战</footer>
      </div>
    `;

    this.el.appendChild(particles); // 粒子作为底层背景

    // 事件绑定
    this.el.querySelector('#btn-start')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onStartBattle();
    });
    this.el.querySelector('#btn-gacha')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onOpenGacha();
    });
    this.el.querySelector('#btn-training')!.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onOpenTraining();
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

    // 侧边新手礼包
    const newbieBtn = this.el.querySelector('#btn-newbie') as HTMLButtonElement;
    newbieBtn.addEventListener('click', () => {
      AudioManager.playClickSound();
      this.onClaimNewbiePack();
    });

    // 主界面音乐开关
    const bgmBtn = this.el.querySelector('#btn-bgm') as HTMLButtonElement;
    bgmBtn.addEventListener('click', () => {
      const newVal = !AudioManager.bgmEnabled;
      AudioManager.setBgmEnabled(newVal);
      const cs = loadSave();
      saveSave({ ...cs, bgmEnabled: newVal });
      bgmBtn.textContent = newVal ? '🎵' : '🔇';
      bgmBtn.classList.toggle('off', !newVal);
    });
  }

  refresh(): void {
    const save = loadSave();
    const topbar = this.el.querySelector('.menu-topbar');
    if (topbar) {
      topbar.innerHTML = `
        <div class="stat-chip"><span class="chip-ic">🗺️</span><span class="chip-txt">关卡 ${save.completedStages.length}/${STAGES.length}</span></div>
        <div class="stat-chip"><span class="chip-ic">🪙</span><span class="chip-txt">${save.coins}</span></div>
        <div class="stat-chip"><span class="chip-ic">🏆</span><span class="chip-txt">${save.wins}胜 ${save.losses}负</span></div>
        <div class="stat-chip"><span class="chip-ic">🔊</span><span class="chip-txt">${save.soundEnabled ? '开' : '关'}</span></div>
      `;
    }
    // 签到红点刷新
    const card = this.el.querySelector('#btn-checkin');
    if (card) {
      const ci = getCheckInInfo();
      const has = card.querySelector('.dot');
      if (ci.canCheckIn && !has) {
        const d = document.createElement('span');
        d.className = 'dot';
        card.appendChild(d);
      } else if (!ci.canCheckIn && has) {
        has.remove();
      }
    }
  }
}
