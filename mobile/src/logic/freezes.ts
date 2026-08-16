import { previousDate, type LocalDate } from '@/logic/dates';

/**
 * §10.2: a freeze is a pressure valve, not a product. Losing a long streak is
 * the most common reason people abandon a habit app for good, so the freeze is
 * granted free, applied automatically, and never offered as a purchase or a
 * reward for engagement.
 */

export type FreezePlan = {
  /** Days the freeze should cover, oldest first. Empty when nothing is at risk. */
  cover: LocalDate[];
  /** The streak length that survives, for the next-morning notification. */
  protectedStreak: number;
};

/**
 * Decides whether an unlogged yesterday should silently consume a freeze.
 *
 * Only yesterday is ever covered. Back-filling a longer gap would let someone
 * return after a fortnight to an intact streak, which makes the number
 * meaningless — and there is only one freeze a month to spend anyway.
 */
export function planFreeze(
  loggedDates: readonly LocalDate[],
  freezeDates: readonly LocalDate[],
  todayLocal: LocalDate,
  freezesAvailable: number,
): FreezePlan {
  const none: FreezePlan = { cover: [], protectedStreak: 0 };

  if (freezesAvailable < 1) return none;

  const covered = new Set([...loggedDates, ...freezeDates]);
  const yesterday = previousDate(todayLocal);

  // Nothing to rescue if yesterday is already accounted for.
  if (covered.has(yesterday)) return none;

  // A freeze extends a run; it does not conjure one. If the day before
  // yesterday is also empty the streak was already gone, and spending the
  // month's only freeze on it would buy nothing.
  const dayBefore = previousDate(yesterday);
  if (!covered.has(dayBefore)) return none;

  let count = 0;
  let cursor = dayBefore;

  while (covered.has(cursor)) {
    count += 1;
    cursor = previousDate(cursor);
  }

  // +1 for the day the freeze now covers.
  return { cover: [yesterday], protectedStreak: count + 1 };
}

/** The gentle next-morning message from §10.2. States the fact, asks nothing. */
export function freezeNotice(protectedStreak: number): string {
  return `Your freeze covered yesterday. Streak safe at ${protectedStreak}.`;
}
