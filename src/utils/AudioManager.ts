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
}

export const AudioManager = new AudioManagerClass();
