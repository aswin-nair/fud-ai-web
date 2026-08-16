/**
 * Every reason here rewards an *action*. Nothing awards points for eating
 * less, hitting a deficit, or ending the day under target — per §2.3, the app
 * streaks the logging, never the restriction.
 */
export const POINTS = {
  meal_logged: 10,
  first_log_of_day: 15,
  protein_target_hit: 20,
  quest_completed: 25,
  streak_milestone: 50,
} as const;

export type PointsReason = keyof typeof POINTS;

export type PointsAward = {
  reason: PointsReason;
  delta: number;
};

export function award(reason: PointsReason): PointsAward {
  return { reason, delta: POINTS[reason] };
}

/** Sum of an append-only ledger. */
export function totalPoints(ledger: readonly { delta: number }[]): number {
  return ledger.reduce((sum, row) => sum + row.delta, 0);
}

/**
 * §10.3: level = floor(sqrt(points / 100)) + 1. Quadratic spacing, so level n
 * starts at 100(n-1)^2 and the band widens by 200 points each time. Cosmetic
 * only — nothing in the app is ever gated on level.
 */
export function levelFor(points: number): { level: number; into: number; span: number } {
  const safe = Math.max(0, points);
  const level = Math.floor(Math.sqrt(safe / 100)) + 1;

  const floorPoints = 100 * (level - 1) ** 2;
  const ceilPoints = 100 * level ** 2;

  return { level, into: safe - floorPoints, span: ceilPoints - floorPoints };
}

/** Streak lengths worth a one-off celebration. */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365] as const;

export function isStreakMilestone(count: number): boolean {
  return (STREAK_MILESTONES as readonly number[]).includes(count);
}
