// Web Audio API Sound Synthesizer for Dice Rolls & Tactile Gaming Feedback
class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Play dice rattle / roll sound
  public playDiceRoll() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Multiple tiny noise bursts simulating dice tumbling on felt/wood
    for (let i = 0; i < 4; i++) {
      const delay = i * 0.08 + Math.random() * 0.03;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 120, now + delay);
      osc.frequency.exponentialRampToValueAtTime(60, now + delay + 0.07);

      gain.gain.setValueAtTime(0.18, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.08);
    }

    // Final solid impact thud
    const impactTime = now + 0.35;
    const impactOsc = ctx.createOscillator();
    const impactGain = ctx.createGain();

    impactOsc.type = 'triangle';
    impactOsc.frequency.setValueAtTime(110, impactTime);
    impactOsc.frequency.exponentialRampToValueAtTime(40, impactTime + 0.12);

    impactGain.gain.setValueAtTime(0.28, impactTime);
    impactGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.12);

    impactOsc.connect(impactGain);
    impactGain.connect(ctx.destination);

    impactOsc.start(impactTime);
    impactOsc.stop(impactTime + 0.13);
  }

  // Tactile button click
  public playClick(pitch: number = 440) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Success / 6 rolled chime
  public playSixChime() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.2);
    });
  }
}

export const sound = new SoundManager();
