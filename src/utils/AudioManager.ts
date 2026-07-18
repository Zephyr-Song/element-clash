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
  // 用 Web Audio 实时合成一段轻快的 chiptune 循环，无需外部音频文件。
  private _bgmEnabled: boolean = true;
  private _bgmVolume: number = 0.4;
  private bgmTimer: number | null = null;
  private bgmMelodyIdx: number = 0;
  private bgmBassIdx: number = 0;
  private bgmMelodyNextTime: number = 0;
  private bgmBassNextTime: number = 0;

  /** 八分音符时值（秒），越大越舒缓 */
  private static readonly STEP: number = 0.42;
  /** 调度提前量 */
  private static readonly LOOKAHEAD: number = 0.2;

  // 主旋律：C大调轻音乐，和弦进行 C - G - Am - F，低八度更柔和，每和弦末尾留白(休止符 midi:0)
  private static readonly BGM_MELODY: Array<{ midi: number; dur: number }> = [
    { midi: 72, dur: 1 }, { midi: 76, dur: 1 }, { midi: 79, dur: 1 }, { midi: 0, dur: 1 },
    { midi: 71, dur: 1 }, { midi: 74, dur: 1 }, { midi: 79, dur: 1 }, { midi: 0, dur: 1 },
    { midi: 69, dur: 1 }, { midi: 72, dur: 1 }, { midi: 76, dur: 1 }, { midi: 0, dur: 1 },
    { midi: 65, dur: 1 }, { midi: 69, dur: 1 }, { midi: 72, dur: 1 }, { midi: 0, dur: 1 },
    { midi: 72, dur: 1 }, { midi: 76, dur: 1 }, { midi: 79, dur: 1 }, { midi: 0, dur: 1 },
    { midi: 71, dur: 1 }, { midi: 74, dur: 1 }, { midi: 79, dur: 1 }, { midi: 0, dur: 1 },
    { midi: 69, dur: 1 }, { midi: 72, dur: 1 }, { midi: 76, dur: 1 }, { midi: 0, dur: 1 },
    { midi: 65, dur: 1 }, { midi: 69, dur: 1 }, { midi: 72, dur: 1 }, { midi: 0, dur: 1 },
  ];

  // 低音：每 4 个八分音符换一个根音(dur=4)，与主旋律循环等长(16秒)
  private static readonly BGM_BASS: Array<{ midi: number; dur: number }> = [
    { midi: 48, dur: 4 }, { midi: 43, dur: 4 }, { midi: 45, dur: 4 }, { midi: 41, dur: 4 },
    { midi: 48, dur: 4 }, { midi: 43, dur: 4 }, { midi: 45, dur: 4 }, { midi: 41, dur: 4 },
  ];

  get bgmEnabled(): boolean { return this._bgmEnabled; }
  get bgmVolume(): number { return this._bgmVolume; }

  setBgmEnabled(val: boolean): void {
    this._bgmEnabled = val;
    if (val) { this.startBgm(); }
    else { this.stopBgm(); }
  }

  setBgmVolume(v: number): void {
    this._bgmVolume = Math.max(0, Math.min(1, v));
  }

  startBgm(): void {
    if (!this._bgmEnabled) return;
    if (this.bgmTimer !== null) return;
    try {
      const ctx = this.getContext();
      this.bgmMelodyNextTime = ctx.currentTime + 0.1;
      this.bgmBassNextTime = ctx.currentTime + 0.1;
      this.bgmTimer = window.setInterval(() => this.scheduleBgm(), 25);
    } catch { /* ignore */ }
  }

  stopBgm(): void {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleBgm(): void {
    let ctx: AudioContext;
    try { ctx = this.getContext(); } catch { return; }
    // 主旋律轨道（柔和正弦波 + 较长延音）
    while (this.bgmMelodyNextTime < ctx.currentTime + AudioManagerClass.LOOKAHEAD) {
      const note = AudioManagerClass.BGM_MELODY[this.bgmMelodyIdx % AudioManagerClass.BGM_MELODY.length];
      this.scheduleBgmNote(note, this.bgmMelodyNextTime, 'sine', this._bgmVolume * 0.45, 1.8);
      this.bgmMelodyNextTime += note.dur * AudioManagerClass.STEP;
      this.bgmMelodyIdx++;
    }
    // 低音轨道（柔和正弦波）
    while (this.bgmBassNextTime < ctx.currentTime + AudioManagerClass.LOOKAHEAD) {
      const note = AudioManagerClass.BGM_BASS[this.bgmBassIdx % AudioManagerClass.BGM_BASS.length];
      this.scheduleBgmNote(note, this.bgmBassNextTime, 'sine', this._bgmVolume * 0.4, 1.0);
      this.bgmBassNextTime += note.dur * AudioManagerClass.STEP;
      this.bgmBassIdx++;
    }
  }

  private scheduleBgmNote(note: { midi: number; dur: number }, time: number, type: OscillatorType, vol: number, releaseMul: number = 1): void {
    if (note.midi <= 0) return; // 休止符
    try {
      const ctx = this.getContext();
      const freq = 440 * Math.pow(2, (note.midi - 69) / 12);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      const dur = note.dur * AudioManagerClass.STEP;
      const release = dur * releaseMul;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(Math.max(0.0002, vol), time + 0.04); // 柔和起音，避免咔哒声
      gain.gain.exponentialRampToValueAtTime(0.0001, time + release); // 缓慢衰减，余韵绵长
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + release + 0.05);
    } catch { /* ignore */ }
  }
}

export const AudioManager = new AudioManagerClass();
