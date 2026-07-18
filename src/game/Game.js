import * as THREE from 'three';
import { Block } from './Block.js';
import { PhysicsManager } from './PhysicsManager.js';
import { StackManager } from './StackManager.js';
import { CameraController } from './CameraController.js';
import { InputManager } from './InputManager.js';
import {
  calculatePlacement,
  calculatePlacement2D,
} from '../utils/overlap.js';
import {
  addHeightCm,
  cmToWorld,
  getBlockHeightCm,
  getBlockSpeed,
  isMilestoneBlock,
} from '../utils/dimensions.js';
import { clampDelta } from '../utils/cleanup.js';

export class Game {
  constructor(config, ui, audio) {
    this.config = config;
    this.ui = ui;
    this.audio = audio;
    this.state = 'intro';
    this.clock = new THREE.Clock();
    this.pendingTimer = null;
    this.effects = [];
    this.currentBlock = null;
    this.currentMotion = null;
    this.initialRecordCm = this.loadRecord();
    this.recordCm = this.initialRecordCm;
    this.stats = this.createEmptyStats();

    this.initializeRenderer();
    this.initializeScene();
    this.physics = new PhysicsManager(config);
    this.stack = new StackManager();
    this.cameraController = new CameraController(this.camera, config);
    this.input = new InputManager(this.ui.stage, {
      onAction: () => this.handleAction(),
      onVisibilityChange: (hidden) => this.handleVisibilityChange(hidden),
    });

    this.bindUi();
    this.resetGameWorld({ preview: true });
    this.ui.syncAudioControls({
      musicEnabled: this.audio.musicEnabled,
      sfxEnabled: this.audio.sfxEnabled,
    });
    this.ui.showInstructions('start');

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleResize);
    this.handleResize();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  createEmptyStats() {
    return {
      heightCm: 0,
      placedBlocks: 0,
      perfects: 0,
      combo: 0,
      bestCombo: 0,
      milestoneBlocks: 0,
      newRecord: false,
      recordSoundPlayed: false,
    };
  }

  initializeRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, this.config.performance.maximumPixelRatio),
    );
    this.renderer.shadowMap.enabled = this.config.effects.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.ui.stage.append(this.renderer.domElement);
  }

  initializeScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.colors.background);
    this.scene.fog = new THREE.FogExp2(this.config.colors.background, 0.023);

    this.camera = new THREE.PerspectiveCamera(44, 1, 0.08, 1200);

    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x242938, 2.15);
    this.scene.add(hemisphere);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    this.keyLight.position.set(7, 13, 8);
    this.keyLight.castShadow = this.config.effects.shadows;
    this.keyLight.shadow.mapSize.set(1536, 1536);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 60;
    this.keyLight.shadow.camera.left = -12;
    this.keyLight.shadow.camera.right = 12;
    this.keyLight.shadow.camera.top = 18;
    this.keyLight.shadow.camera.bottom = -6;
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);

    const rimLight = new THREE.DirectionalLight(this.config.colors.primary, 1.05);
    rimLight.position.set(-8, 6, -7);
    this.scene.add(rimLight);

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.config.colors.background).offsetHSL(0, 0, 0.035),
      roughness: 0.88,
      metalness: 0.02,
    });
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -0.35;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    const grid = new THREE.GridHelper(40, 40, this.config.colors.primary, 0x30343d);
    grid.position.y = -0.345;
    grid.material.opacity = 0.1;
    grid.material.transparent = true;
    this.scene.add(grid);
  }

  bindUi() {
    this.ui.bindHandlers({
      onPrimary: (mode) => this.handlePrimary(mode),
      onRetry: () => {
        this.audio.play('button');
        this.startGame();
      },
      onInfo: () => this.pauseForInstructions(),
      onGameoverInfo: () => {
        this.audio.play('button');
        this.ui.showInstructions('gameover-help');
      },
      onAudio: () => {
        const enabled = !this.audio.allEnabled;
        this.audio.setAllEnabled(enabled);
        this.audio.play('button');
        this.ui.syncAudioControls({
          musicEnabled: this.audio.musicEnabled,
          sfxEnabled: this.audio.sfxEnabled,
        });
      },
      onMusicChange: (enabled) => {
        this.audio.setMusicEnabled(enabled);
        if (enabled && ['running', 'transition'].includes(this.state)) this.audio.playMusic();
        this.ui.syncAudioControls({ musicEnabled: enabled, sfxEnabled: this.audio.sfxEnabled });
      },
      onSfxChange: (enabled) => {
        this.audio.setSfxEnabled(enabled);
        if (enabled) this.audio.play('button');
        this.ui.syncAudioControls({ musicEnabled: this.audio.musicEnabled, sfxEnabled: enabled });
      },
    });
  }

  async handlePrimary(mode) {
    this.audio.play('button');
    if (mode === 'start') {
      await this.startGame();
    } else if (mode === 'resume') {
      this.resumeGame();
    } else if (mode === 'gameover-help') {
      this.ui.showGameOver({ ...this.stats, recordCm: this.recordCm });
    }
  }

  async startGame() {
    clearTimeout(this.pendingTimer);
    await this.audio.init();
    this.resetGameWorld({ preview: true });
    this.ui.hideDialogs();
    this.ui.showHud();
    this.state = 'countdown';
    this.currentMotion.active = false;
    if (this.audio.musicEnabled) this.audio.playMusic();

    if (this.config.instructions.enableCountdown) {
      await this.ui.runCountdown(this.config.instructions.countdownSeconds);
    }

    if (this.state !== 'countdown') return;
    this.state = 'running';
    this.currentMotion.active = true;
    this.audio.play('spawn');
    this.clock.getDelta();
  }

  pauseForInstructions() {
    if (this.state !== 'running') return;
    this.audio.play('button');
    clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
    this.state = 'paused';
    if (this.currentMotion) this.currentMotion.active = false;
    this.audio.duckMusic();
    this.ui.showInstructions('resume');
  }

  resumeGame() {
    if (this.state !== 'paused') return;
    this.ui.hideDialogs();
    this.audio.restoreMusicVolume();
    if (this.audio.musicEnabled) this.audio.playMusic();
    this.state = 'running';
    if (this.currentMotion) this.currentMotion.active = true;
    this.clock.getDelta();
  }

  handleVisibilityChange(hidden) {
    if (hidden && ['running', 'transition'].includes(this.state)) {
      this.pauseForInstructions();
    }
  }

  resetGameWorld({ preview = false } = {}) {
    clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
    this.ui.hideAnnouncement();
    this.clearEffects();

    if (this.currentBlock && !this.currentBlock.body && !this.stack.blocks.includes(this.currentBlock)) {
      this.currentBlock.dispose();
    }
    this.currentBlock = null;
    this.currentMotion = null;

    this.stack.clear(this.physics);
    this.physics.clear();
    this.stats = this.createEmptyStats();
    this.recordCm = this.loadRecord();
    this.ui.resetMilestones();
    this.ui.updateHeightImmediate(0, this.recordCm);
    this.ui.showCombo(0, false);

    const baseHeight = 0.36;
    const base = new Block({
      scene: this.scene,
      x: 0,
      y: -baseHeight / 2,
      z: 0,
      width: this.config.block.initialWidth,
      depth: this.config.block.initialDepth,
      heightWorld: baseHeight,
      heightCm: 0,
      color: this.config.colors.secondary,
      milestone: false,
      blockNumber: 0,
      name: 'base',
    });
    base.material.color.multiplyScalar(0.42);
    base.material.roughness = 0.7;
    this.physics.addStaticBlock(base);
    this.stack.add(base);

    this.cameraController.reset();
    this.spawnNextBlock({ activate: !preview, announce: false });
    this.cameraController.follow(this.stack.topSurfaceY, this.currentBlock.heightWorld);
  }

  spawnNextBlock({ activate = true, announce = true } = {}) {
    const lower = this.stack.top;
    const blockNumber = this.stats.placedBlocks + 1;
    const milestone = isMilestoneBlock(blockNumber, this.config.milestone.everyBlocks);
    const heightCm = getBlockHeightCm(blockNumber, this.config.block, this.config.milestone);
    const heightWorld = cmToWorld(heightCm, this.config.block.worldUnitsPerCm);
    const axis = blockNumber % 2 === 1 ? 'x' : 'z';
    const side = Math.floor((blockNumber - 1) / 2) % 2 === 0 ? -1 : 1;
    const perpendicularAxis = axis === 'x' ? 'z' : 'x';

const perpendicularSize =
  perpendicularAxis === 'x'
    ? lower.width
    : lower.depth;

const zigzagEnabled =
  milestone &&
  this.config.milestone.zigzag?.enabled;

const zigzagAmplitude = zigzagEnabled
  ? Math.min(
      perpendicularSize *
        this.config.milestone.zigzag.amplitudeRatio,
      this.config.milestone.zigzag.maximumAmplitude,
    )
  : 0;
    const position = {
      x: lower.x,
      z: lower.z,
    };
    position[axis] = lower[axis] + side * this.config.movement.travelDistance;

    this.currentBlock = new Block({
      scene: this.scene,
      x: position.x,
      y: lower.topY + heightWorld / 2,
      z: position.z,
      width: lower.width,
      depth: lower.depth,
      heightWorld,
      heightCm,
      color: milestone ? this.config.colors.milestone : this.config.colors.primary,
      milestone,
      blockNumber,
      name: `moving-block-${blockNumber}`,
    });

    this.currentMotion = {
      axis,
      perpendicularAxis,
perpendicularCenter: lower[perpendicularAxis],
zigzagAmplitude,
zigzagCyclesPerPass:
  this.config.milestone.zigzag?.cyclesPerPass ?? 0,
      direction: -side,
      speed: getBlockSpeed(
        blockNumber,
        this.stats.placedBlocks,
        this.config.movement,
        this.config.milestone,
      ),
      min: lower[axis] - this.config.movement.travelDistance,
      max: lower[axis] + this.config.movement.travelDistance,
      active: false,
    };

    this.ui.setNextBlock({ number: blockNumber, heightCm, milestone });
    this.cameraController.follow(lower.topY, heightWorld);

    if (!activate) return;

    if (milestone && announce && this.config.milestone.announce) {
      this.state = 'transition';
      this.audio.play('milestoneIn');
      this.ui.showAnnouncement(
        `BLOCCO TRAGUARDO<small>${blockNumber}° BLOCCO · ×${this.config.milestone.heightMultiplier} ALTEZZA · ${heightCm} cm</small>`,
        this.config.milestone.announcementDuration,
      );
      this.pendingTimer = window.setTimeout(() => {
        if (this.state !== 'transition') return;
        this.state = 'running';
        this.currentMotion.active = true;
        this.audio.play('spawn');
      }, this.config.milestone.announcementDuration);
    } else {
      this.state = 'running';
      this.currentMotion.active = true;
      this.audio.play('spawn');
    }
  }

  handleAction() {
    if (this.state !== 'running' || !this.currentBlock || !this.currentMotion?.active) return;
    this.placeCurrentBlock();
  }

  placeCurrentBlock() {
    this.state = 'transition';
    this.currentMotion.active = false;
    const lower = this.stack.top;
    const moving = this.currentBlock;
    const axis = this.currentMotion.axis;
    const original = moving.getData();
    const placement = calculatePlacement(
      lower.getData(),
      original,
      axis,
      this.config.perfectPlacement.tolerance,
    );

    if (!placement.hit) {
      const missed = moving;
      const impulseSide = Math.sign(missed[axis] - lower[axis]) || this.currentMotion.direction;
      this.physics.addDynamicBlock(missed, {
        impulseAxis: axis,
        impulseSide,
        impulseScale: 1.2,
      });
      this.currentBlock = null;
      this.currentMotion = null;
      this.audio.play('miss');
      this.cameraController.shake(0.16);
      this.finishGame();
      return;
    }

    let newWidth = original.width;
    let newDepth = original.depth;
    let newX = original.x;
    let newZ = original.z;

    if (axis === 'x') {
      newWidth = placement.retained.size;
      newX = placement.retained.center;
      if (placement.perfect) newZ = lower.z;
    } else {
      newDepth = placement.retained.size;
      newZ = placement.retained.center;
      if (placement.perfect) newX = lower.x;
    }

    moving.setDimensions({ width: newWidth, depth: newDepth });
    moving.setPosition(newX, original.y, newZ);
    this.physics.addStaticBlock(moving);
    this.stack.add(moving);

    if (placement.fragment) {
      const fragmentWidth = axis === 'x' ? placement.fragment.size : original.width;
      const fragmentDepth = axis === 'z' ? placement.fragment.size : original.depth;
      const fragmentX = axis === 'x' ? placement.fragment.center : original.x;
      const fragmentZ = axis === 'z' ? placement.fragment.center : original.z;
      const fragment = new Block({
        scene: this.scene,
        x: fragmentX,
        y: original.y,
        z: fragmentZ,
        width: fragmentWidth,
        depth: fragmentDepth,
        heightWorld: original.heightWorld,
        heightCm: original.heightCm,
        color: moving.milestone ? this.config.colors.milestone : this.config.colors.primary,
        milestone: moving.milestone,
        blockNumber: moving.blockNumber,
        name: `fragment-${moving.blockNumber}`,
      });
      const cutRatio = placement.fragment.size / (axis === 'x' ? original.width : original.depth);
      this.physics.addDynamicBlock(fragment, {
        impulseAxis: axis,
        impulseSide: placement.fragment.side,
        impulseScale: 0.8 + cutRatio * 0.8,
      });
      this.audio.play('cut', { intensity: 0.65 + cutRatio });
      if (cutRatio > 0.38) this.cameraController.shake(0.07 + cutRatio * 0.08);
      this.createBurst(fragment.mesh.position, moving.milestone ? this.config.colors.milestone : this.config.colors.primary, 7);
    }

    const oldHeight = this.stats.heightCm;
    this.stats.placedBlocks += 1;
    this.stats.heightCm = addHeightCm(this.stats.heightCm, moving.heightCm);

    if (placement.perfect) {
      this.stats.perfects += 1;
      this.stats.combo += 1;
      this.stats.bestCombo = Math.max(this.stats.bestCombo, this.stats.combo);
      this.audio.play('perfect');
      if (this.stats.combo > 1) this.audio.play('combo');
      this.ui.showCombo(this.stats.combo, true);
      this.ui.flash('perfect');
      this.createPerfectRing(moving.topY, moving.width, moving.depth);
    } else {
      this.stats.combo = 0;
      this.ui.showCombo(0, false);
      this.audio.play('place', { intensity: moving.milestone ? 1.45 : 1 });
    }

    if (moving.milestone) {
      this.stats.milestoneBlocks += 1;
      this.audio.play('milestonePlace', { intensity: 1.35 });
      this.ui.flash('milestone');
      this.cameraController.shake(0.12);
    } else if (!placement.perfect) {
      this.ui.flash('normal');
    }

    if (this.stats.heightCm > this.recordCm) {
      this.recordCm = this.stats.heightCm;
      this.stats.newRecord = true;
      this.saveRecord(this.recordCm);
      if (!this.stats.recordSoundPlayed && this.stats.heightCm > this.initialRecordCm) {
        this.stats.recordSoundPlayed = true;
        this.audio.play('record');
        this.ui.showAnnouncement('NUOVO RECORD<small>CONTINUA A SALIRE</small>', 720);
      }
    }

    this.ui.animateHeight(oldHeight, this.stats.heightCm, this.recordCm, {
      milestone: moving.milestone,
    });
    const suffix = moving.milestone
      ? ' · TRAGUARDO'
      : placement.perfect
        ? ' · PERFECT'
        : '';
    this.ui.showFloating(`+${moving.heightCm} cm${suffix}`, { milestone: moving.milestone });
    this.ui.announceStatus(`Altezza ${this.stats.heightCm} centimetri${placement.perfect ? ', perfect' : ''}`);

    for (const threshold of this.config.scoring.milestonesCm) {
      if (oldHeight < threshold && this.stats.heightCm >= threshold) {
        this.ui.showHeightMilestone(threshold);
      }
    }

    this.cameraController.follow(moving.topY, moving.heightWorld);
    this.currentBlock = null;
    this.currentMotion = null;

    const tooSmall =
      moving.width < this.config.block.minimumWidth ||
      moving.depth < this.config.block.minimumDepth;

    if (tooSmall) {
      this.pendingTimer = window.setTimeout(() => this.finishGame(), 520);
      return;
    }

    this.pendingTimer = window.setTimeout(() => {
      if (this.state !== 'transition') return;
      this.spawnNextBlock({ activate: true, announce: true });
    }, moving.milestone ? 260 : 150);

  }

  finishGame() {
    clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
    this.state = 'gameover';
    this.ui.showCombo(0, false);
    this.audio.pauseMusic({ fade: true });
    this.audio.play('gameOver');
    this.cameraController.shake(0.17);
    this.pendingTimer = window.setTimeout(() => {
      if (this.state !== 'gameover') return;
      this.ui.showGameOver({ ...this.stats, recordCm: this.recordCm });
    }, 780);
  }

  createBurst(position, color, count = 8) {
    if (!this.config.effects.particles || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const group = new THREE.Group();
    const particles = [];
    for (let index = 0; index < count; index += 1) {
      const geometry = new THREE.SphereGeometry(0.035 + Math.random() * 0.025, 6, 5);
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      group.add(mesh);
      particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2.5,
          0.7 + Math.random() * 1.5,
          (Math.random() - 0.5) * 2.5,
        ),
      });
    }
    this.scene.add(group);
    this.effects.push({ type: 'burst', group, particles, age: 0, lifetime: 0.62 });
  }

  createPerfectRing(y, width, depth) {
    if (!this.config.effects.perfectFlash) return;
    const radius = Math.max(Math.min(width, depth) * 0.55, 0.16);
    const geometry = new THREE.TorusGeometry(radius, 0.035, 8, 36);
    const material = new THREE.MeshBasicMaterial({
      color: this.config.colors.primary,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(this.stack.top.x, y + 0.025, this.stack.top.z);
    this.scene.add(ring);
    this.effects.push({ type: 'ring', mesh: ring, age: 0, lifetime: 0.48 });
  }

  updateEffects(delta) {
    for (const effect of [...this.effects]) {
      effect.age += delta;
      const progress = Math.min(effect.age / effect.lifetime, 1);
      if (effect.type === 'burst') {
        for (const particle of effect.particles) {
          particle.velocity.y -= 4.6 * delta;
          particle.mesh.position.addScaledVector(particle.velocity, delta);
          particle.mesh.material.opacity = 1 - progress;
        }
      } else if (effect.type === 'ring') {
        const scale = 1 + progress * 1.55;
        effect.mesh.scale.setScalar(scale);
        effect.mesh.material.opacity = 1 - progress;
      }

      if (progress >= 1) this.removeEffect(effect);
    }
  }

  removeEffect(effect) {
    const index = this.effects.indexOf(effect);
    if (index >= 0) this.effects.splice(index, 1);
    const root = effect.group ?? effect.mesh;
    root?.traverse?.((child) => {
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    });
    root?.removeFromParent?.();
  }

  clearEffects() {
    for (const effect of [...this.effects]) this.removeEffect(effect);
  }

  loadRecord() {
    try {
      const value = Number(localStorage.getItem('heightStack.bestHeightCm'));
      return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
    } catch {
      return 0;
    }
  }

  saveRecord(value) {
    try {
      localStorage.setItem('heightStack.bestHeightCm', String(Math.round(value)));
    } catch {
      // Optional storage failure must not affect gameplay.
    }
  }

  handleResize() {
    const width = this.ui.stage.clientWidth || window.innerWidth;
    const height = this.ui.stage.clientHeight || window.innerHeight;
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.near = 0.08;
    this.camera.far = Math.max(1200, this.stack?.topSurfaceY * 12 + 200);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, this.config.performance.maximumPixelRatio),
    );
    this.cameraController?.setViewport(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const delta = clampDelta(this.clock.getDelta(), 1 / 30);

    if (this.state === 'running' && this.currentBlock && this.currentMotion?.active) {
      const axis = this.currentMotion.axis;
      let next = this.currentBlock[axis] + this.currentMotion.direction * this.currentMotion.speed * delta;
      if (next >= this.currentMotion.max) {
        next = this.currentMotion.max;
        this.currentMotion.direction = -1;
      } else if (next <= this.currentMotion.min) {
        next = this.currentMotion.min;
        this.currentMotion.direction = 1;
      }
      this.currentBlock.setAxisPosition(axis, next);
      const {
  perpendicularAxis,
  perpendicularCenter,
  zigzagAmplitude,
  zigzagCyclesPerPass,
  min,
  max,
} = this.currentMotion;

if (zigzagAmplitude > 0 && perpendicularAxis) {
  const travelRange = Math.max(max - min, Number.EPSILON);

  const progress = Math.min(
    1,
    Math.max(0, (next - min) / travelRange),
  );

  const zigzagOffset =
    Math.sin(
      progress *
        Math.PI *
        2 *
        zigzagCyclesPerPass,
    ) * zigzagAmplitude;

  this.currentBlock.setAxisPosition(
    perpendicularAxis,
    perpendicularCenter + zigzagOffset,
  );
}
    }

    if (!['paused', 'intro', 'countdown'].includes(this.state)) {
      this.physics.step(delta);
      this.updateEffects(delta);
    }

    const activeHeight = this.currentBlock?.heightWorld ?? this.stack.top?.heightWorld ?? 0.4;
    this.cameraController.follow(this.stack.topSurfaceY, activeHeight);
    this.cameraController.update(delta);

    const top = this.stack.topSurfaceY;
    this.keyLight.position.y = Math.max(13, top + 12);
    this.keyLight.target.position.set(this.stack.top?.x ?? 0, top, this.stack.top?.z ?? 0);
    const desiredFar = Math.max(1200, top * 12 + 200);
    if (Math.abs(this.camera.far - desiredFar) > 10) {
      this.camera.far = desiredFar;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.render(this.scene, this.camera);
  }
}
