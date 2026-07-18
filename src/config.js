export const GAME_CONFIG = {
  // Brand: edit these two lines to rename the game.
  gameTitle: 'HEIGHT STACK',
  gameSubtitle: 'Build higher. Place better.',

  colors: {
    // Main brand color: this is the only value normally needed for recoloring.
    primary: '#F2E600',
    secondary: '#FFFFFF',
    background: '#08090C',
    interface: '#FFFFFF',
    milestone: '#7DF9FF',
  },

  block: {
    initialWidth: 3,
    initialDepth: 3,

    // Vertical progression in logical centimetres.
    initialHeightCm: 10,
    increasePerPlacedBlockCm: 1,
    // Set a number (for example 50) to cap regular blocks; null means unlimited.
    maximumRegularHeightCm: null,

    // Conversion from logical centimetres to Three.js/Cannon world units.
    worldUnitsPerCm: 0.04,

    minimumWidth: 0.08,
    minimumDepth: 0.08,
  },

  milestone: {
    everyBlocks: 10,
    heightMultiplier: 3,
    speedMultiplier: 0.55,
    announce: true,
    announcementDuration: 850,
    zigzag: {
  enabled: true,
  amplitudeRatio: 0.18,
  maximumAmplitude: 0.4,
  cyclesPerPass: 2,
},
  },

  movement: {
    initialSpeed: 3,
    maximumSpeed: 8,
    speedIncreasePerPlacedBlock: 0.08,
    travelDistance: 7,
  },

  perfectPlacement: {
    tolerance: 0.06,
    enableCombo: true,
  },

  camera: {
    followSpeed: 5.2,
    lookAheadFactor: 0.35,
    enableDynamicZoom: true,
    portraitDistanceMultiplier: 1.18,
  },

  scoring: {
    showHeightRuler: true,
    showFloatingIncrease: true,
    normalAnimationDuration: 300,
    milestoneAnimationDuration: 600,
    floatingTextDuration: 750,
    milestonesCm: [100, 250, 500, 1000],
  },

  audio: {
    // Replace public/audio/soundtrack.mp3 with the final soundtrack.
    musicEnabled: true,
    musicVolume: 0.25,
    soundtrackPath: 'audio/soundtrack.mp3',

    soundEffectsEnabled: true,
    soundEffectsVolume: 0.55,
  },

  instructions: {
    showAtEveryLaunch: true,
    enableCountdown: true,
    countdownSeconds: 3,
    showInfoButtonDuringGame: true,
  },

  effects: {
    shadows: true,
    particles: true,
    screenShake: true,
    perfectFlash: true,
  },

  physics: {
    gravity: -13,
    fragmentRestitution: 0.18,
    fragmentFriction: 0.45,
    fragmentLinearDamping: 0.08,
    fragmentAngularDamping: 0.12,
    impulseStrength: 1.1,
    torqueStrength: 0.75,
  },

  performance: {
    maximumDynamicFragments: 30,
    fragmentLifetimeSeconds: 7,
    maximumPixelRatio: 2,
  },
};
