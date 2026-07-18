import * as THREE from 'three';

export class CameraController {
  constructor(camera, config) {
    this.camera = camera;
    this.config = config;
    this.target = new THREE.Vector3(0, 1.6, 0);
    this.currentTarget = this.target.clone();
    this.shakeAmount = 0;
    this.viewportAspect = 1;
    this.reset();
  }

  reset() {
    this.currentTarget.set(0, 1.6, 0);
    this.target.copy(this.currentTarget);
    this.camera.position.set(6.3, 5.7, 7.2);
    this.camera.lookAt(this.currentTarget);
    this.shakeAmount = 0;
  }

  setViewport(width, height) {
    this.viewportAspect = width / Math.max(height, 1);
  }

  follow(topSurfaceY, activeBlockHeight = 0.4) {
    this.target.y = Math.max(1.5, topSurfaceY + activeBlockHeight * this.config.camera.lookAheadFactor);
  }

  shake(amount = 0.12) {
    if (!this.config.effects.screenShake) return;
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  update(delta) {
    const smoothing = 1 - Math.exp(-this.config.camera.followSpeed * delta);
    this.currentTarget.lerp(this.target, smoothing);

    const portraitMultiplier =
      this.viewportAspect < 0.82 ? this.config.camera.portraitDistanceMultiplier : 1;
    const verticalBoost = this.config.camera.enableDynamicZoom
      ? Math.min(Math.max((this.target.y - 1.5) * 0.018, 0), 2.2)
      : 0;

    const desired = new THREE.Vector3(
      (6.3 + verticalBoost * 0.24) * portraitMultiplier,
      this.currentTarget.y + 4.2 + verticalBoost,
      (7.2 + verticalBoost * 0.34) * portraitMultiplier,
    );
    this.camera.position.lerp(desired, smoothing);

    if (this.shakeAmount > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeAmount;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeAmount * 0.65;
      this.camera.position.z += (Math.random() - 0.5) * this.shakeAmount;
      this.shakeAmount *= Math.exp(-11 * delta);
    } else {
      this.shakeAmount = 0;
    }

    this.camera.lookAt(this.currentTarget);
  }
}
