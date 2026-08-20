import {
  localDateInZone,
  localDaysBetween,
  localHourInZone,
  nextLocalDate,
  previousLocalDate,
  type LocalDate as DomainLocalDate,
} from '@fud-ai/domain/calendar';

/** A calendar day in the profile's timezone, formatted 'YYYY-MM-DD'. */
export type LocalDate = DomainLocalDate;

/**
 * The local calendar day an instant falls on, in the given zone. Called once at
 * write time and stored — never recomputed on read, so entries keep the day
 * they were logged on even after the user travels.
 */
export function toLocalDate(instant: Date | string, timeZone: string): LocalDate {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  return localDateInZone(date, timeZone);
}

/** Hour of day (0-23) in the given zone. Drives the 18:00 at-risk window. */
export function localHourIn(timeZone: string, instant: Date = new Date()): number {
  return localHourInZone(instant, timeZone);
}

/**
 * Calendar arithmetic runs in UTC deliberately. A 'YYYY-MM-DD' string is a
 * calendar label, not an instant, so stepping it through a zone that observes
 * DST would occasionally skip or repeat a day and silently break the streak.
 */
function format(ms: number): LocalDate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function previousDate(date: LocalDate): LocalDate {
  return previousLocalDate(date);
}

export function nextDate(date: LocalDate): LocalDate {
  return nextLocalDate(date);
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return localDaysBetween(from, to);
}

/** 'YYYY-MM' — the grant window for the one free monthly streak freeze. */
export function monthOf(date: LocalDate): string {
  return date.slice(0, 7);
}

/** 'YYYY-MM' shifted by whole months. */
export function addMonths(month: string, delta: number): string {
  const [year, index] = month.split('-').map(Number);
  const total = (year as number) * 12 + ((index as number) - 1) + delta;

  const nextYear = Math.floor(total / 12);
  const nextMonth = (total % 12) + 1;

  return `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}`;
}

/** Every calendar day in a 'YYYY-MM' month, in order. */
export function monthDays(month: string): LocalDate[] {
  const [year, index] = month.split('-').map(Number);
  const count = new Date(Date.UTC(year as number, index as number, 0)).getUTCDate();

  return Array.from(
    { length: count },
    (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`,
  );
}

/** Weekday of the first of the month, 0 = Sunday. */
export function firstWeekdayOfMonth(month: string): number {
  const [year, index] = month.split('-').map(Number);
  return new Date(Date.UTC(year as number, (index as number) - 1, 1)).getUTCDay();
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function monthLabel(month: string): string {
  const [year, index] = month.split('-').map(Number);
  return `${MONTH_NAMES[(index as number) - 1]} ${year}`;
}

/**
 * Builds a calendar date from user-entered parts, rejecting anything that is
 * not a real day. Returns null rather than rolling 31 February forward into
 * March, which would silently change someone's stated date of birth.
 */
export function buildLocalDate(
  year: number,
  month: number,
  day: number,
): LocalDate | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const ms = Date.UTC(year, month - 1, day);
  const date = new Date(ms);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return format(ms);
}
