import { planFreeze as sharedPlanFreeze, type FreezePlan as SharedFreezePlan } from '@fud-ai/domain/freezes';
import { type LocalDate } from '@/logic/dates';

/**
 * §10.2: a freeze is a pressure valve, not a product. Losing a long streak is
 * the most common reason people abandon a habit app for good, so the freeze is
 * granted free, applied automatically, and never offered as a purchase or a
 * reward for engagement.
 */

export type FreezePlan = SharedFreezePlan;

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
  return sharedPlanFreeze(loggedDates, freezeDates, todayLocal, freezesAvailable);
}

/** The gentle next-morning message from §10.2. States the fact, asks nothing. */
export function freezeNotice(protectedStreak: number): string {
  return `Your freeze covered yesterday. Streak safe at ${protectedStreak}.`;
}
