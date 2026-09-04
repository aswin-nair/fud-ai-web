import { describe, expect, it } from 'vitest';

import {
  clampMomoPoint,
  MOMO_SIZE,
  momoCadenceMs,
  momoRoamBounds,
  nextMomoPoseIndex,
  nextMomoRoamPoint,
  settledMomoPoint,
} from './momoMotion';

describe('mobile Momo motion policy', () => {
  const insets = { top: 47, right: 0, bottom: 34, left: 0 };
  const bounds = momoRoamBounds(390, 844, insets);

  it('keeps Momo below the header and above the tab bar', () => {
    expect(bounds.minY).toBeGreaterThan(insets.top + 92);
    expect(bounds.maxY + MOMO_SIZE).toBeLessThan(844 - insets.bottom - 72);
    expect(bounds.minX).toBeGreaterThanOrEqual(insets.left);
    expect(bounds.maxX + MOMO_SIZE).toBeLessThanOrEqual(390 - insets.right);
  });

  it('keeps every random destination inside the safe side rails', () => {
    const current = settledMomoPoint(bounds);
    for (const horizontal of [0, 0.2, 0.7, 1]) {
      for (const vertical of [0, 0.25, 0.75, 1]) {
        const point = nextMomoRoamPoint(bounds, current, horizontal, vertical);
        expect([bounds.minX, bounds.maxX]).toContain(point.x);
        expect(point.y).toBeGreaterThanOrEqual(bounds.minY);
        expect(point.y).toBeLessThanOrEqual(bounds.maxY);
      }
    }
  });

  it('clamps the settled position after a resize or rotation', () => {
    expect(clampMomoPoint({ x: -500, y: 4_000 }, bounds)).toEqual({
      x: bounds.minX,
      y: bounds.maxY,
    });
  });

  it('uses the promised cadence and stops scheduling while off', () => {
    expect(momoCadenceMs('lively', 0)).toBe(20_000);
    expect(momoCadenceMs('lively', 1)).toBe(45_000);
    expect(momoCadenceMs('calm', 0)).toBe(32_000);
    expect(momoCadenceMs('calm', 1)).toBe(45_000);
    expect(momoCadenceMs('off', 0.5)).toBeNull();
  });

  it('does not repeat the same gesture immediately', () => {
    expect(nextMomoPoseIndex(8, 0, 0)).not.toBe(0);
    expect(nextMomoPoseIndex(8, 7, 1)).not.toBe(7);
  });
});
