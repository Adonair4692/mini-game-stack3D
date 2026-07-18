import { describe, expect, it } from 'vitest';
import { calculatePlacement } from '../src/utils/overlap.js';

const lower = { x: 0, z: 0, width: 3, depth: 3 };

describe('placement overlap', () => {
  it('handles complete overlap', () => {
    const result = calculatePlacement(lower, { ...lower }, 'x', 0);
    expect(result.hit).toBe(true);
    expect(result.overlap).toBe(3);
    expect(result.fragment).toBeNull();
  });

  it('handles positive partial overlap and fragment position', () => {
    const result = calculatePlacement(lower, { ...lower, x: 1 }, 'x', 0);
    expect(result.hit).toBe(true);
    expect(result.overlap).toBe(2);
    expect(result.retained.center).toBeCloseTo(0.5);
    expect(result.fragment.size).toBeCloseTo(1);
    expect(result.fragment.center).toBeCloseTo(2);
  });

  it('handles negative partial overlap and fragment position', () => {
    const result = calculatePlacement(lower, { ...lower, x: -1 }, 'x', 0);
    expect(result.hit).toBe(true);
    expect(result.overlap).toBe(2);
    expect(result.retained.center).toBeCloseTo(-0.5);
    expect(result.fragment.size).toBeCloseTo(1);
    expect(result.fragment.center).toBeCloseTo(-2);
  });

  it('handles no overlap', () => {
    const result = calculatePlacement(lower, { ...lower, x: 3.2 }, 'x', 0);
    expect(result.hit).toBe(false);
    expect(result.overlap).toBe(0);
  });

  it('detects perfect placement within tolerance', () => {
    const result = calculatePlacement(lower, { ...lower, x: 0.04 }, 'x', 0.06);
    expect(result.perfect).toBe(true);
    expect(result.retained.center).toBe(0);
  });

  it('does not detect perfect placement outside tolerance', () => {
    const result = calculatePlacement(lower, { ...lower, x: 0.07 }, 'x', 0.06);
    expect(result.perfect).toBe(false);
  });
});
