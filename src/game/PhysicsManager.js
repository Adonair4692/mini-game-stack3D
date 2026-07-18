import * as CANNON from 'cannon-es';

export class PhysicsManager {
  constructor(config) {
    this.config = config;
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, config.physics.gravity, 0),
    });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;

    this.staticMaterial = new CANNON.Material('static-block');
    this.fragmentMaterial = new CANNON.Material('fragment');
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.staticMaterial, this.fragmentMaterial, {
        friction: config.physics.fragmentFriction,
        restitution: config.physics.fragmentRestitution,
      }),
    );
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.fragmentMaterial, this.fragmentMaterial, {
        friction: config.physics.fragmentFriction,
        restitution: config.physics.fragmentRestitution * 0.65,
      }),
    );

    this.dynamicEntries = [];
    this.createGround();
  }

  createGround() {
    this.groundBody = new CANNON.Body({ mass: 0, material: this.staticMaterial });
    this.groundBody.addShape(new CANNON.Plane());
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.groundBody.position.set(0, -0.36, 0);
    this.world.addBody(this.groundBody);
  }

  createBoxShape(block) {
    return new CANNON.Box(
      new CANNON.Vec3(block.width / 2, block.heightWorld / 2, block.depth / 2),
    );
  }

  addStaticBlock(block) {
    const body = new CANNON.Body({ mass: 0, material: this.staticMaterial });
    body.addShape(this.createBoxShape(block));
    body.position.set(block.x, block.y, block.z);
    this.world.addBody(body);
    block.body = body;
    return body;
  }

  addDynamicBlock(block, { impulseAxis = 'x', impulseSide = 1, impulseScale = 1 } = {}) {
    const volume = Math.max(block.width * block.depth * block.heightWorld, 0.02);
    const mass = Math.min(Math.max(volume * 0.7, 0.08), 12);
    const body = new CANNON.Body({
      mass,
      material: this.fragmentMaterial,
      linearDamping: this.config.physics.fragmentLinearDamping,
      angularDamping: this.config.physics.fragmentAngularDamping,
      allowSleep: true,
      sleepSpeedLimit: 0.08,
      sleepTimeLimit: 1.5,
    });
    body.addShape(this.createBoxShape(block));
    body.position.set(block.x, block.y, block.z);

    const lateral = this.config.physics.impulseStrength * impulseScale * impulseSide;
    const impulse = new CANNON.Vec3(
      impulseAxis === 'x' ? lateral : (Math.random() - 0.5) * 0.25,
      0.15 * impulseScale,
      impulseAxis === 'z' ? lateral : (Math.random() - 0.5) * 0.25,
    );
    body.applyImpulse(impulse);

    const torque = this.config.physics.torqueStrength * impulseScale;
    body.angularVelocity.set(
      (Math.random() - 0.5) * torque,
      (Math.random() - 0.5) * torque * 0.55,
      (Math.random() - 0.5) * torque,
    );

    this.world.addBody(body);
    block.body = body;
    this.dynamicEntries.push({
      block,
      body,
      createdAt: performance.now(),
    });
    this.enforceFragmentLimit();
    return body;
  }

  enforceFragmentLimit() {
    while (this.dynamicEntries.length > this.config.performance.maximumDynamicFragments) {
      this.removeDynamicEntry(this.dynamicEntries[0]);
    }
  }

  step(delta) {
    this.world.step(1 / 60, delta, 3);
    const now = performance.now();
    const lifetimeMs = this.config.performance.fragmentLifetimeSeconds * 1000;

    for (const entry of [...this.dynamicEntries]) {
      entry.block.mesh.position.copy(entry.body.position);
      entry.block.mesh.quaternion.copy(entry.body.quaternion);

      if (entry.body.position.y < -25 || now - entry.createdAt > lifetimeMs) {
        this.removeDynamicEntry(entry);
      }
    }
  }

  removeDynamicEntry(entry) {
    const index = this.dynamicEntries.indexOf(entry);
    if (index >= 0) this.dynamicEntries.splice(index, 1);
    this.world.removeBody(entry.body);
    entry.block.body = null;
    entry.block.dispose();
  }

  removeBlockBody(block) {
    if (!block?.body) return;
    this.world.removeBody(block.body);
    block.body = null;
  }

  clear({ preserveGround = true } = {}) {
    for (const entry of [...this.dynamicEntries]) {
      this.removeDynamicEntry(entry);
    }

    for (const body of [...this.world.bodies]) {
      if (preserveGround && body === this.groundBody) continue;
      this.world.removeBody(body);
    }
  }
}
