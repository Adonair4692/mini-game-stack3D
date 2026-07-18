import { describe, expect, it } from 'vitest';
import {
  addHeightCm,
  cmToWorld,
  getBlockHeightCm,
  getRegularHeightCm,
  isMilestoneBlock,
} from '../src/utils/dimensions.js';

const block = {
  initialHeightCm: 10,
  increasePerPlacedBlockCm: 1,
  maximumRegularHeightCm: null,
};
const milestone = { everyBlocks: 5, heightMultiplier: 3 };

describe('block dimensions', () => {
  it('calculates block 1', () => {
    expect(getBlockHeightCm(1, block, milestone)).toBe(10);
  });

  it('calculates block 2', () => {
    expect(getBlockHeightCm(2, block, milestone)).toBe(11);
  });

  it('calculates milestone block 5', () => {
    expect(getRegularHeightCm(5, block)).toBe(14);
    expect(getBlockHeightCm(5, block, milestone)).toBe(42);
  });

  it('calculates milestone block 10', () => {
    expect(getBlockHeightCm(10, block, milestone)).toBe(57);
  });

  it('detects milestones', () => {
    expect(isMilestoneBlock(5, 5)).toBe(true);
    expect(isMilestoneBlock(6, 5)).toBe(false);
  });

  it('converts centimetres to world units', () => {
    expect(cmToWorld(42, 0.04)).toBeCloseTo(1.68);
  });

  it('accumulates integer height', () => {
    expect(addHeightCm(46, 42)).toBe(88);
  });

  it('applies the optional regular-height cap before milestone multiplication', () => {
    const capped = { ...block, initialHeightCm: 58, maximumRegularHeightCm: 50 };
    expect(getRegularHeightCm(1, capped)).toBe(50);
    expect(getBlockHeightCm(5, capped, milestone)).toBe(150);
  });
});
