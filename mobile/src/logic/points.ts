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
 * Levels widen as they go so early progress is quick and later levels still
 * mean something. Level 1 starts at zero points.
 */
const LEVEL_STEP = 250;

export function levelFor(points: number): { level: number; into: number; span: number } {
  if (points < 0) return { level: 1, into: 0, span: LEVEL_STEP };

  let level = 1;
  let span = LEVEL_STEP;
  let remaining = points;

  while (remaining >= span) {
    remaining -= span;
    level += 1;
    span = LEVEL_STEP * level;
  }

  return { level, into: remaining, span };
}

/** Streak lengths worth a one-off celebration. */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365] as const;

export function isStreakMilestone(count: number): boolean {
  return (STREAK_MILESTONES as readonly number[]).includes(count);
}
