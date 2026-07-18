import * as THREE from 'three';

export class Block {
  constructor({
    scene,
    x = 0,
    y = 0,
    z = 0,
    width,
    depth,
    heightWorld,
    heightCm = 0,
    color,
    milestone = false,
    blockNumber = 0,
    name = 'block',
  }) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.z = z;
    this.width = width;
    this.depth = depth;
    this.heightWorld = heightWorld;
    this.heightCm = heightCm;
    this.milestone = milestone;
    this.blockNumber = blockNumber;
    this.name = name;
    this.body = null;

    const baseColor = new THREE.Color(color);
    if (!milestone && blockNumber > 0) {
      baseColor.offsetHSL(((blockNumber % 9) - 4) * 0.007, 0, ((blockNumber % 5) - 2) * 0.018);
    }

    this.material = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: milestone ? 0.26 : 0.48,
      metalness: milestone ? 0.24 : 0.06,
      emissive: milestone ? baseColor.clone().multiplyScalar(0.14) : new THREE.Color(0x000000),
      emissiveIntensity: milestone ? 0.75 : 0,
    });

    this.mesh = new THREE.Mesh(this.createGeometry(), this.material);
    this.mesh.name = name;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(x, y, z);
    scene.add(this.mesh);
  }

  createGeometry() {
    return new THREE.BoxGeometry(this.width, this.heightWorld, this.depth);
  }

  setDimensions({ width = this.width, depth = this.depth, heightWorld = this.heightWorld }) {
    this.width = width;
    this.depth = depth;
    this.heightWorld = heightWorld;
    const oldGeometry = this.mesh.geometry;
    this.mesh.geometry = this.createGeometry();
    oldGeometry.dispose();
  }

  setPosition(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.mesh.position.set(x, y, z);
  }

  setAxisPosition(axis, value) {
    this[axis] = value;
    this.mesh.position[axis] = value;
  }

  get topY() {
    return this.y + this.heightWorld / 2;
  }

  get bottomY() {
    return this.y - this.heightWorld / 2;
  }

  getData() {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
      width: this.width,
      depth: this.depth,
      heightWorld: this.heightWorld,
      heightCm: this.heightCm,
    };
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
