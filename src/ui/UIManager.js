export class UIManager {
  constructor(config) {
    this.config = config;
    this.heightAnimationFrame = null;
    this.announcementTimer = null;
    this.primaryMode = 'start';
    this.reachedMilestones = new Set();

    this.stage = document.querySelector('#game-stage');
    this.hud = document.querySelector('#hud');
    this.heightDisplay = document.querySelector('.height-display');
    this.heightValue = document.querySelector('#height-value');
    this.recordValue = document.querySelector('#record-value');
    this.comboDisplay = document.querySelector('#combo-display');
    this.nextBlock = document.querySelector('#next-block');
    this.floatingLayer = document.querySelector('#floating-layer');
    this.ruler = document.querySelector('#height-ruler');
    this.rulerProgress = document.querySelector('#ruler-progress');
    this.rulerMarks = document.querySelector('#ruler-marks');
    this.countdown = document.querySelector('#countdown');
    this.announcement = document.querySelector('#announcement');
    this.statusLive = document.querySelector('#status-live');

    this.backdrop = document.querySelector('#dialog-backdrop');
    this.introDialog = document.querySelector('#intro-dialog');
    this.gameoverDialog = document.querySelector('#gameover-dialog');
    this.dialogTitle = document.querySelector('#dialog-title');
    this.dialogSubtitle = document.querySelector('#dialog-subtitle');
    this.inputHint = document.querySelector('#input-hint');
    this.primaryButton = document.querySelector('#primary-dialog-button');
    this.retryButton = document.querySelector('#retry-button');
    this.infoButton = document.querySelector('#info-button');
    this.gameoverInfoButton = document.querySelector('#gameover-info-button');
    this.audioButton = document.querySelector('#audio-button');
    this.musicToggle = document.querySelector('#music-toggle');
    this.sfxToggle = document.querySelector('#sfx-toggle');

    this.finalHeight = document.querySelector('#final-height-value');
    this.finalRecord = document.querySelector('#final-record');
    this.finalBlocks = document.querySelector('#final-blocks');
    this.finalPerfects = document.querySelector('#final-perfects');
    this.finalCombo = document.querySelector('#final-combo');
    this.finalMilestones = document.querySelector('#final-milestones');
    this.newRecordLabel = document.querySelector('#new-record-label');

    this.applyBranding();
    this.setInputHint();
    this.buildRuler();
  }

  applyBranding() {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', this.config.colors.primary);
    root.style.setProperty('--secondary-color', this.config.colors.secondary);
    root.style.setProperty('--background-color', this.config.colors.background);
    root.style.setProperty('--interface-color', this.config.colors.interface);
    root.style.setProperty('--milestone-color', this.config.colors.milestone);
    document.title = this.config.gameTitle;
    this.dialogTitle.textContent = this.config.gameTitle;
    this.dialogSubtitle.textContent = this.config.gameSubtitle;
  }

  setInputHint() {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    const fine = window.matchMedia?.('(pointer: fine)').matches;
    this.inputHint.textContent = coarse && fine
      ? 'TOCCA, CLICCA O PREMI SPAZIO'
      : coarse
        ? 'TOCCA PER POSIZIONARE'
        : 'CLICCA O PREMI SPAZIO';
  }

  buildRuler() {
    this.ruler.classList.toggle('is-hidden', !this.config.scoring.showHeightRuler);
    this.rulerMarks.replaceChildren();
    const max = Math.max(...this.config.scoring.milestonesCm, 1);
    for (const height of this.config.scoring.milestonesCm) {
      const mark = document.createElement('div');
      mark.className = 'ruler-mark';
      mark.dataset.height = String(height);
      mark.style.bottom = `${Math.min((height / max) * 100, 100)}%`;
      const label = document.createElement('span');
      label.textContent = `${height} cm`;
      mark.append(label);
      this.rulerMarks.append(mark);
    }
  }

  bindHandlers(handlers) {
    const stop = (event) => event.stopPropagation();
    [
      this.primaryButton,
      this.retryButton,
      this.infoButton,
      this.gameoverInfoButton,
      this.audioButton,
      this.musicToggle,
      this.sfxToggle,
    ].forEach((element) => element.addEventListener('pointerdown', stop));

    this.primaryButton.addEventListener('click', () => handlers.onPrimary?.(this.primaryMode));
    this.retryButton.addEventListener('click', () => handlers.onRetry?.());
    this.infoButton.addEventListener('click', () => handlers.onInfo?.());
    this.gameoverInfoButton.addEventListener('click', () => handlers.onGameoverInfo?.());
    this.audioButton.addEventListener('click', () => handlers.onAudio?.());
    this.musicToggle.addEventListener('change', () => handlers.onMusicChange?.(this.musicToggle.checked));
    this.sfxToggle.addEventListener('change', () => handlers.onSfxChange?.(this.sfxToggle.checked));
  }

  syncAudioControls({ musicEnabled, sfxEnabled }) {
    this.musicToggle.checked = musicEnabled;
    this.sfxToggle.checked = sfxEnabled;
    const anyEnabled = musicEnabled || sfxEnabled;
    this.audioButton.setAttribute('aria-pressed', String(anyEnabled));
    this.audioButton.setAttribute('aria-label', anyEnabled ? 'Disattiva audio' : 'Attiva audio');
    this.audioButton.textContent = anyEnabled ? '♪' : '×';
  }

  showInstructions(mode = 'start') {
    this.primaryMode = mode;
    this.backdrop.classList.remove('is-hidden');
    this.introDialog.classList.remove('is-hidden');
    this.gameoverDialog.classList.add('is-hidden');
    this.primaryButton.textContent = mode === 'resume'
      ? 'RIPRENDI'
      : mode === 'gameover-help'
        ? 'INDIETRO'
        : 'GIOCA';
    queueMicrotask(() => this.primaryButton.focus());
  }

  hideDialogs() {
    this.backdrop.classList.add('is-hidden');
  }

  showHud() {
    this.hud.classList.remove('is-hidden');
  }

  hideHud() {
    this.hud.classList.add('is-hidden');
  }

  showGameOver(stats) {
    this.backdrop.classList.remove('is-hidden');
    this.introDialog.classList.add('is-hidden');
    this.gameoverDialog.classList.remove('is-hidden');
    this.finalHeight.textContent = String(stats.heightCm);
    this.finalRecord.textContent = `${stats.recordCm} cm`;
    this.finalBlocks.textContent = String(stats.placedBlocks);
    this.finalPerfects.textContent = String(stats.perfects);
    this.finalCombo.textContent = `×${stats.bestCombo}`;
    this.finalMilestones.textContent = String(stats.milestoneBlocks);
    this.newRecordLabel.classList.toggle('is-hidden', !stats.newRecord);
    queueMicrotask(() => this.retryButton.focus());
  }

  updateHeightImmediate(heightCm, recordCm) {
    cancelAnimationFrame(this.heightAnimationFrame);
    this.heightValue.textContent = String(heightCm);
    this.recordValue.textContent = `RECORD ${recordCm} cm`;
    this.updateRuler(heightCm);
  }

  animateHeight(from, to, recordCm, { milestone = false } = {}) {
    cancelAnimationFrame(this.heightAnimationFrame);
    const duration = milestone
      ? this.config.scoring.milestoneAnimationDuration
      : this.config.scoring.normalAnimationDuration;
    const started = performance.now();
    this.heightDisplay.classList.remove('is-pulsing', 'is-milestone-pulsing');
    void this.heightDisplay.offsetWidth;
    this.heightDisplay.classList.add(milestone ? 'is-milestone-pulsing' : 'is-pulsing');

    const tick = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const displayed = Math.round(from + (to - from) * eased);
      this.heightValue.textContent = String(displayed);
      this.recordValue.textContent = `RECORD ${recordCm} cm`;
      this.updateRuler(displayed);
      if (progress < 1) this.heightAnimationFrame = requestAnimationFrame(tick);
    };
    this.heightAnimationFrame = requestAnimationFrame(tick);
  }

  updateRuler(heightCm) {
    const max = Math.max(...this.config.scoring.milestonesCm, 1);
    this.rulerProgress.style.height = `${Math.min((heightCm / max) * 100, 100)}%`;
    for (const mark of this.rulerMarks.children) {
      const value = Number(mark.dataset.height);
      mark.classList.toggle('is-reached', heightCm >= value);
    }
  }

  resetMilestones() {
    this.reachedMilestones.clear();
    for (const mark of this.rulerMarks.children) mark.classList.remove('is-reached');
  }

  showFloating(text, { milestone = false } = {}) {
    if (!this.config.scoring.showFloatingIncrease) return;
    const element = document.createElement('div');
    element.className = `floating-score${milestone ? ' milestone' : ''}`;
    element.textContent = text;
    element.style.setProperty('--duration', `${this.config.scoring.floatingTextDuration}ms`);
    this.floatingLayer.append(element);
    window.setTimeout(() => element.remove(), this.config.scoring.floatingTextDuration + 80);
  }

  showCombo(combo, perfect = true) {
    if (!perfect || combo < 1) {
      this.comboDisplay.classList.add('is-hidden');
      return;
    }
    this.comboDisplay.textContent = combo > 1 ? `PERFECT ×${combo}` : 'PERFECT';
    this.comboDisplay.classList.remove('is-hidden');
  }

  setNextBlock({ number, heightCm, milestone }) {
    this.nextBlock.textContent = milestone
      ? `BLOCCO ${number} · TRAGUARDO · ${heightCm} cm`
      : `BLOCCO ${number} · ${heightCm} cm`;
  }

  showAnnouncement(html, duration = this.config.milestone.announcementDuration) {
    clearTimeout(this.announcementTimer);
    this.announcement.innerHTML = `<div class="announcement-card">${html}</div>`;
    this.announcement.classList.remove('is-hidden');
    this.announcementTimer = window.setTimeout(() => {
      this.announcement.classList.add('is-hidden');
      this.announcement.replaceChildren();
    }, duration);
  }

  hideAnnouncement() {
    clearTimeout(this.announcementTimer);
    this.announcement.classList.add('is-hidden');
    this.announcement.replaceChildren();
  }

  async runCountdown(seconds) {
    this.countdown.classList.remove('is-hidden');
    for (let remaining = seconds; remaining >= 1; remaining -= 1) {
      this.countdown.textContent = String(remaining);
      await new Promise((resolve) => window.setTimeout(resolve, 650));
    }
    this.countdown.textContent = 'VIA';
    await new Promise((resolve) => window.setTimeout(resolve, 420));
    this.countdown.classList.add('is-hidden');
    this.countdown.textContent = '';
  }

  announceStatus(text) {
    this.statusLive.textContent = '';
    requestAnimationFrame(() => {
      this.statusLive.textContent = text;
    });
  }

  showHeightMilestone(heightCm) {
    if (this.reachedMilestones.has(heightCm)) return;
    this.reachedMilestones.add(heightCm);
    this.showAnnouncement(`${heightCm} CM!<small>TRAGUARDO DI ALTEZZA</small>`, 720);
  }

  flash(kind = 'normal') {
    const flash = document.createElement('div');
    flash.className = `screen-flash ${kind}`;
    document.querySelector('#app').append(flash);
    window.setTimeout(() => flash.remove(), 360);
  }
}
