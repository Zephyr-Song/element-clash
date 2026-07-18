/**
 * AudioManager.ts - Web Audio API 音效管理器
 * 使用OscillatorNode合成简单音效
 */

class AudioManagerClass {
  private ctx: AudioContext | null = null;
  private _enabled: boolean = true;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  get enabled(): boolean { return this._enabled; }
  setEnabled(val: boolean): void { this._enabled = val; }
  toggle(): boolean { this._enabled = !this._enabled; return this._enabled; }

  private playTone(freq: number, duration: number, type: OscillatorType = 'square', volume: number = 0.12): void {
    if (!this._enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.05);
    } catch { /* ignore */ }
  }

  playMoveSound(): void {
    if (!this._enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.linearRampToValueAtTime(600, t + 0.1);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.2);
    } catch { /* ignore */ }
  }

  playHitSound(): void { this.playTone(150, 0.08, 'sawtooth', 0.18); }

  playSuperEffectiveSound(): void {
    if (!this._enabled) return;
    try {
      const ctx = this.getContext();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.linearRampToValueAtTime(1200, t + 0.1);
      osc.frequency.setValueAtTime(1000, t + 0.12);
      osc.frequency.linearRampToValueAtTime(1400, t + 0.22);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.35);
    } catch { /* ignore */ }
  }

  playClickSound(): void { this.playTone(600, 0.05, 'sine', 0.08); }

  playVictorySound(): void {
    if (!this._enabled) return;
    try {
      const ctx = this.getContext();
      [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + i * 0.2;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.35);
      });
    } catch { /* ignore */ }
  }

  playDefeatSound(): void {
    if (!this._enabled) return;
    try {
      const ctx = this.getContext();
      [392.00, 329.63, 261.63].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + i * 0.25;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.13, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.38);
      });
    } catch { /* ignore */ }
  }

  playCriticalSound(): void { this.playTone(1100, 0.12, 'square', 0.16); }

  playFaintSound(): void {
    if (!this._enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.linearRampToValueAtTime(80, t + 0.5);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.6);
    } catch { /* ignore */ }
  }

  // ===== 背景音乐 (BGM) =====
  // 播放本地打包的轻音乐 mp3（public/music/ 下），可循环、可切换曲目、独立开关与音量。
  private _bgmEnabled: boolean = true;
  private _bgmVolume: number = 0.22;
  private _bgmTrackIndex: number = 0;
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmGestureArmed: boolean = false;

  /** 本地轻音乐清单（CC BY 授权，作者署名见游戏内说明） */
  private static readonly BGM_TRACKS: Array<{ file: string; title: string; author: string }> = [
    { file: 'music/Carefree.mp3', title: 'Carefree', author: 'Kevin MacLeod' },
  ];

  get bgmEnabled(): boolean { return this._bgmEnabled; }
  get bgmVolume(): number { return this._bgmVolume; }
  get bgmTrackIndex(): number { return this._bgmTrackIndex; }
  get bgmTracks(): Array<{ file: string; title: string; author: string }> { return AudioManagerClass.BGM_TRACKS; }

  setBgmEnabled(val: boolean): void {
    this._bgmEnabled = val;
    if (val) { this.startBgm(); this.armBgmGesture(); }
    else { this.stopBgm(); }
  }

  setBgmVolume(v: number): void {
    this._bgmVolume = Math.max(0, Math.min(1, v));
    if (this.bgmAudio) this.bgmAudio.volume = this._bgmVolume;
  }

  setBgmTrack(index: number): void {
    this._bgmTrackIndex = Math.max(0, Math.min(AudioManagerClass.BGM_TRACKS.length - 1, index));
    if (this._bgmEnabled) this.startBgm();
  }

  startBgm(): void {
    if (!this._bgmEnabled) return;
    try {
      const track = AudioManagerClass.BGM_TRACKS[this._bgmTrackIndex % AudioManagerClass.BGM_TRACKS.length];
      const base = (import.meta.env.BASE_URL || '/');
      if (!this.bgmAudio) {
        this.bgmAudio = new Audio();
        this.bgmAudio.loop = true;
        this.bgmAudio.preload = 'auto';
      }
      this.bgmAudio.src = base + track.file;
      this.bgmAudio.volume = this._bgmVolume;
      const pr = this.bgmAudio.play();
      if (pr && typeof pr.catch === 'function') {
        pr.catch(() => { /* 浏览器自动播放限制：等待用户手势后由 armBgmGesture 启动 */ });
      }
    } catch { /* ignore */ }
  }

  stopBgm(): void {
    if (this.bgmAudio) this.bgmAudio.pause();
  }

  /** 浏览器禁止无手势播放音频：注册一次性手势监听器，首次点击/按键时启动 BGM */
  private armBgmGesture(): void {
    if (this.bgmGestureArmed) return;
    this.bgmGestureArmed = true;
    const handler = () => {
      if (this._bgmEnabled && this.bgmAudio && this.bgmAudio.paused) {
        this.startBgm();
      }
    };
    document.addEventListener('pointerdown', handler);
    document.addEventListener('keydown', handler);
  }
}

export const AudioManager = new AudioManagerClass();
