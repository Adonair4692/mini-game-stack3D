export class StackManager {
  constructor() {
    this.blocks = [];
  }

  add(block) {
    this.blocks.push(block);
  }

  get top() {
    return this.blocks.at(-1) ?? null;
  }

  get topSurfaceY() {
    return this.top?.topY ?? 0;
  }

  clear(physics) {
    for (const block of this.blocks) {
      physics?.removeBlockBody(block);
      block.dispose();
    }
    this.blocks.length = 0;
  }
}
