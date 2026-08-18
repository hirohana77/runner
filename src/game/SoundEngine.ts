/**
 * Procedural Web Audio API sound synthesizer for Infinite Shift 3D.
 * Handles sound effects and dynamic upbeat electronic background music.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxVolume: number = 0.8;
  private bgmVolume: number = 0.5;
  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmTimer: number | null = null;
  private coinPitchIndex: number = 0;
  private lastCoinTime: number = 0;
  private currentTempo: number = 125;
  private bgmNoteIndex: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isBgmPlaying) {
      this.stopBgm();
    } else if (!this.isMuted && !this.isBgmPlaying) {
      this.startBgm();
    }
    return this.isMuted;
  }

  public getIsMuted() {
    return this.isMuted;
  }

  public playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.18);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playDoubleJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Chime 1
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    gain1.gain.setValueAtTime(this.sfxVolume * 0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Chime 2
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(660, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.25);
    gain2.gain.setValueAtTime(this.sfxVolume * 0.4, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.3);
  }

  public playSlide() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Noise buffer for friction swoosh
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  public playLaneSwitch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastCoinTime < 0.6) {
      this.coinPitchIndex = (this.coinPitchIndex + 1) % 8;
    } else {
      this.coinPitchIndex = 0;
    }
    this.lastCoinTime = now;

    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
    const freq = scale[this.coinPitchIndex];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.setValueAtTime(freq * 1.5, now + 0.04);

    gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playPowerup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(this.sfxVolume * 0.4, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.2);
    });
  }

  public playSkill() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 0.3);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playBoardActivate() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.3);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playCrash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  public playThemeWarp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.8);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  }

  public startBgm() {
    if (this.isBgmPlaying || this.isMuted) return;
    this.initCtx();
    this.isBgmPlaying = true;
    this.scheduleBgmBeat();
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleBgmBeat() {
    if (!this.isBgmPlaying || this.isMuted || !this.ctx) return;

    const stepInterval = (60 / this.currentTempo) / 4; // 16th note
    const now = this.ctx.currentTime;

    // Bassline notes
    const bassline = [110, 110, 130.81, 110, 146.83, 130.81, 110, 98, 110, 110, 164.81, 146.83, 130.81, 110, 98, 82.41];
    // Melody arpeggios
    const melody = [440, 523.25, 659.25, 523.25, 587.33, 440, 659.25, 783.99, 880, 659.25, 587.33, 523.25, 659.25, 783.99, 880, 1046.5];

    const currentStep = this.bgmNoteIndex % 16;
    const bassFreq = bassline[currentStep];
    const melodyFreq = melody[currentStep];

    // Kick drum on 1, 5, 9, 13 (quarter beats)
    if (currentStep % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.frequency.setValueAtTime(140, now);
      kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
      kickGain.gain.setValueAtTime(this.bgmVolume * 0.45, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      kickOsc.connect(kickGain);
      kickGain.connect(this.ctx.destination);
      kickOsc.start(now);
      kickOsc.stop(now + 0.09);
    }

    // Hi-hat on every 16th note
    const hihatOsc = this.ctx.createOscillator();
    const hihatGain = this.ctx.createGain();
    hihatOsc.type = 'highpass' as unknown as OscillatorType;
    hihatOsc.frequency.setValueAtTime(8000, now);
    hihatGain.gain.setValueAtTime(currentStep % 2 === 0 ? this.bgmVolume * 0.08 : this.bgmVolume * 0.04, now);
    hihatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    hihatOsc.connect(hihatGain);
    hihatGain.connect(this.ctx.destination);
    hihatOsc.start(now);
    hihatOsc.stop(now + 0.03);

    // Synth Bass
    if (currentStep % 2 === 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      bassGain.gain.setValueAtTime(this.bgmVolume * 0.22, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepInterval * 1.8);

      bassOsc.connect(filter);
      filter.connect(bassGain);
      bassGain.connect(this.ctx.destination);

      bassOsc.start(now);
      bassOsc.stop(now + stepInterval * 1.8);
    }

    // Synth Lead / Arp (on specific steps)
    if (currentStep % 2 === 1 || currentStep % 3 === 0) {
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      leadOsc.type = 'triangle';
      leadOsc.frequency.setValueAtTime(melodyFreq, now);

      leadGain.gain.setValueAtTime(this.bgmVolume * 0.14, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + stepInterval * 0.9);

      leadOsc.connect(leadGain);
      leadGain.connect(this.ctx.destination);

      leadOsc.start(now);
      leadOsc.stop(now + stepInterval * 0.9);
    }

    this.bgmNoteIndex++;
    this.bgmTimer = window.setTimeout(() => {
      this.scheduleBgmBeat();
    }, stepInterval * 1000);
  }
}

export const soundEngine = new SoundEngine();
