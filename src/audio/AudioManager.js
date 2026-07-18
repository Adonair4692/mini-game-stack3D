export class AudioManager {
  constructor(config) {
    this.config = config;
    this.context = null;
    this.masterGain = null;
    this.noiseBuffer = null;
    this.musicEnabled = this.readPreference('musicEnabled', config.audio.musicEnabled);
    this.sfxEnabled = this.readPreference('soundEffectsEnabled', config.audio.soundEffectsEnabled);

    const relativePath = config.audio.soundtrackPath.replace(/^\/+/, '');
    this.music = new Audio(`${import.meta.env.BASE_URL}${relativePath}`);
    this.music.loop = true;
    this.music.preload = 'auto';
    this.music.volume = config.audio.musicVolume;
    this.music.addEventListener('error', () => {
      console.warn('Soundtrack non disponibile: il gioco continua con gli effetti sintetici.');
    });
  }

  readPreference(key, fallback) {
    try {
      const value = localStorage.getItem(`heightStack.${key}`);
      return value == null ? fallback : value === 'true';
    } catch {
      return fallback;
    }
  }

  storePreference(key, value) {
    try {
      localStorage.setItem(`heightStack.${key}`, String(value));
    } catch {
      // Storage is optional; gameplay must continue without it.
    }
  }

  async init() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.context = new AudioContextClass();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.config.audio.soundEffectsVolume;
      this.masterGain.connect(this.context.destination);
      this.noiseBuffer = this.createNoiseBuffer();
    }

    if (this.context.state === 'suspended') {
      await this.context.resume().catch(() => {});
    }
  }

  createNoiseBuffer() {
    const length = Math.floor(this.context.sampleRate * 0.35);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    return buffer;
  }

  async playMusic() {
    if (!this.musicEnabled) return;
    await this.init();
    this.music.volume = this.config.audio.musicVolume;
    this.music.play().catch(() => {
      console.warn('La musica non può essere avviata finché il browser non accetta l’interazione audio.');
    });
  }

  pauseMusic({ fade = false } = {}) {
    if (!fade) {
      this.music.pause();
      return;
    }

    const startVolume = this.music.volume;
    const started = performance.now();
    const duration = 260;
    const tick = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      this.music.volume = startVolume * (1 - progress);
      if (progress < 1) requestAnimationFrame(tick);
      else {
        this.music.pause();
        this.music.volume = this.config.audio.musicVolume;
      }
    };
    requestAnimationFrame(tick);
  }

  duckMusic(volumeFactor = 0.35) {
    this.music.volume = this.config.audio.musicVolume * volumeFactor;
  }

  restoreMusicVolume() {
    this.music.volume = this.config.audio.musicVolume;
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = Boolean(enabled);
    this.storePreference('musicEnabled', this.musicEnabled);
    if (!this.musicEnabled) this.pauseMusic();
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = Boolean(enabled);
    this.storePreference('soundEffectsEnabled', this.sfxEnabled);
  }

  setAllEnabled(enabled) {
    this.setMusicEnabled(enabled);
    this.setSfxEnabled(enabled);
    if (enabled) this.playMusic();
  }

  get allEnabled() {
    return this.musicEnabled || this.sfxEnabled;
  }

  tone({ frequency, endFrequency = frequency, duration = 0.12, type = 'sine', gain = 0.18, delay = 0 }) {
    if (!this.context || !this.masterGain) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(frequency, 20), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 20), start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(this.masterGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  noise({ duration = 0.09, gain = 0.12, frequency = 900, delay = 0 }) {
    if (!this.context || !this.masterGain || !this.noiseBuffer) return;
    const start = this.context.currentTime + delay;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = 0.8;
    envelope.gain.setValueAtTime(gain, start);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.masterGain);
    source.start(start);
    source.stop(start + duration);
  }

  async play(name, { intensity = 1 } = {}) {
    if (!this.sfxEnabled) return;
    await this.init();
    const scale = Math.min(Math.max(intensity, 0.35), 1.8);

    switch (name) {
      case 'button':
        this.tone({ frequency: 520, endFrequency: 650, duration: 0.055, type: 'triangle', gain: 0.075 });
        break;
      case 'spawn':
        this.tone({ frequency: 260, endFrequency: 390, duration: 0.08, type: 'sine', gain: 0.055 });
        break;
      case 'place':
        this.tone({ frequency: 180, endFrequency: 130, duration: 0.085, type: 'triangle', gain: 0.12 * scale });
        this.tone({ frequency: 540, endFrequency: 430, duration: 0.06, type: 'sine', gain: 0.04, delay: 0.018 });
        break;
      case 'cut':
        this.noise({ duration: 0.075, gain: 0.11 * scale, frequency: 1150 });
        this.tone({ frequency: 320, endFrequency: 115, duration: 0.13, type: 'sawtooth', gain: 0.065 * scale });
        this.tone({ frequency: 95, endFrequency: 70, duration: 0.11, type: 'sine', gain: 0.09 * scale });
        break;
      case 'perfect':
        this.tone({ frequency: 620, endFrequency: 920, duration: 0.16, type: 'sine', gain: 0.11 });
        this.tone({ frequency: 930, endFrequency: 1240, duration: 0.14, type: 'triangle', gain: 0.075, delay: 0.06 });
        break;
      case 'combo':
        this.tone({ frequency: 760, endFrequency: 1040, duration: 0.1, type: 'triangle', gain: 0.07 });
        break;
      case 'milestoneIn':
        this.tone({ frequency: 110, endFrequency: 185, duration: 0.34, type: 'sine', gain: 0.16 });
        this.tone({ frequency: 330, endFrequency: 520, duration: 0.28, type: 'triangle', gain: 0.08, delay: 0.06 });
        break;
      case 'milestonePlace':
        this.tone({ frequency: 85, endFrequency: 62, duration: 0.25, type: 'sine', gain: 0.18 * scale });
        this.noise({ duration: 0.12, gain: 0.08 * scale, frequency: 520 });
        break;
      case 'record':
        [660, 880, 1100].forEach((frequency, index) => {
          this.tone({ frequency, endFrequency: frequency * 1.08, duration: 0.13, type: 'sine', gain: 0.065, delay: index * 0.075 });
        });
        break;
      case 'miss':
        this.tone({ frequency: 210, endFrequency: 58, duration: 0.42, type: 'sawtooth', gain: 0.11 });
        break;
      case 'gameOver':
        this.tone({ frequency: 165, endFrequency: 72, duration: 0.55, type: 'triangle', gain: 0.12, delay: 0.12 });
        break;
      default:
        break;
    }
  }
}
