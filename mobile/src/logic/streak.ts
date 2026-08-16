import { previousDate, type LocalDate } from '@/logic/dates';

/** The hour after which an unlogged day is worth surfacing. See §2.3. */
export const AT_RISK_HOUR = 18;

export type Streak = {
  count: number;
  loggedToday: boolean;
  atRisk: boolean;
};

/**
 * Derived on every read, never stored. A stored counter drifts the moment a
 * write fails, a device clock jumps, or the user crosses a timezone; a
 * derivation from the entries table is always correct.
 *
 * `localHour` is a parameter rather than read from the clock so the at-risk
 * window is testable and so the caller resolves it in the profile's timezone
 * rather than the device's.
 */
export function deriveStreak(
  loggedDates: LocalDate[],
  freezeDates: LocalDate[],
  todayLocal: LocalDate,
  localHour: number,
): Streak {
  const covered = new Set([...loggedDates, ...freezeDates]);
  const loggedToday = loggedDates.includes(todayLocal);

  // A day that has not ended yet is not a broken day. If today is still empty
  // the streak stays whole and extendable, anchored on yesterday.
  let cursor = covered.has(todayLocal) ? todayLocal : previousDate(todayLocal);

  let count = 0;
  while (covered.has(cursor)) {
    count += 1;
    cursor = previousDate(cursor);
  }

  return {
    count,
    loggedToday,
    atRisk: !loggedToday && localHour >= AT_RISK_HOUR,
  };
}
