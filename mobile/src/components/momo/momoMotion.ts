import type { MascotActivity } from '@/state/types';

export const MOMO_SIZE = 88;

const SIDE_GUTTER = 16;
const HEADER_CLEARANCE = 92;
const DIALOGUE_CLEARANCE = 76;
const TAB_BAR_HEIGHT = 72;
const TAB_BAR_GAP = 12;

export type MomoPoint = {
  x: number;
  y: number;
};

export type MomoRoamBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type SafeAreaInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

function unit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * The dialogue bubble sits above Momo, so the top limit reserves room for both
 * it and the screen header. The bottom limit mirrors the tab bar height in the
 * tabs layout and adds the device's home-indicator inset.
 */
export function momoRoamBounds(
  width: number,
  height: number,
  insets: SafeAreaInsets,
  size = MOMO_SIZE,
): MomoRoamBounds {
  const minX = insets.left + SIDE_GUTTER;
  const maxX = Math.max(minX, width - insets.right - SIDE_GUTTER - size);
  const maxY = Math.max(
    0,
    height - insets.bottom - TAB_BAR_HEIGHT - TAB_BAR_GAP - size,
  );
  const desiredMinY = insets.top + HEADER_CLEARANCE + DIALOGUE_CLEARANCE;
  const minY = Math.min(desiredMinY, maxY);

  return { minX, maxX, minY, maxY };
}

export function settledMomoPoint(bounds: MomoRoamBounds): MomoPoint {
  return { x: bounds.maxX, y: bounds.maxY };
}

export function clampMomoPoint(point: MomoPoint, bounds: MomoRoamBounds): MomoPoint {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, point.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, point.y)),
  };
}

/**
 * Pick a point on a side rail. Keeping the resting positions at the edges
 * leaves the centre of Today readable, while the trip between them still feels
 * like a short walk. A near-identical result is moved to the opposite rail.
 */
export function nextMomoRoamPoint(
  bounds: MomoRoamBounds,
  current: MomoPoint,
  horizontalSeed: number,
  verticalSeed: number,
): MomoPoint {
  const verticalRange = bounds.maxY - bounds.minY;
  const y = bounds.minY + verticalRange * unit(verticalSeed);
  let x = unit(horizontalSeed) < 0.5 ? bounds.minX : bounds.maxX;

  if (Math.abs(current.x - x) < 1 && Math.abs(current.y - y) < 48) {
    x = x === bounds.minX ? bounds.maxX : bounds.minX;
  }

  return { x, y };
}

/** Lively spans 20–45s; calm stays in the quieter 32–45s end of that range. */
export function momoCadenceMs(activity: MascotActivity, seed: number): number | null {
  if (activity === 'off') return null;
  const min = activity === 'lively' ? 20_000 : 32_000;
  return Math.round(min + (45_000 - min) * unit(seed));
}

/** Select a random gesture without immediately repeating the previous one. */
export function nextMomoPoseIndex(length: number, previous: number, seed: number): number {
  if (length <= 1) return 0;
  const candidate = Math.min(length - 1, Math.floor(unit(seed) * length));
  return candidate === previous ? (candidate + 1) % length : candidate;
}
