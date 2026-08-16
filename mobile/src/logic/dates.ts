import { formatInTimeZone } from 'date-fns-tz';

/** A calendar day in the profile's timezone, formatted 'YYYY-MM-DD'. */
export type LocalDate = string;

const DAY_MS = 86_400_000;

/**
 * The local calendar day an instant falls on, in the given zone. Called once at
 * write time and stored — never recomputed on read, so entries keep the day
 * they were logged on even after the user travels.
 */
export function toLocalDate(instant: Date | string, timeZone: string): LocalDate {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  return formatInTimeZone(date, timeZone, 'yyyy-MM-dd');
}

/** Hour of day (0-23) in the given zone. Drives the 18:00 at-risk window. */
export function localHourIn(timeZone: string, instant: Date = new Date()): number {
  return Number(formatInTimeZone(instant, timeZone, 'H'));
}

/**
 * Calendar arithmetic runs in UTC deliberately. A 'YYYY-MM-DD' string is a
 * calendar label, not an instant, so stepping it through a zone that observes
 * DST would occasionally skip or repeat a day and silently break the streak.
 */
function parse(date: LocalDate): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year as number, (month as number) - 1, day as number);
}

function format(ms: number): LocalDate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function previousDate(date: LocalDate): LocalDate {
  return format(parse(date) - DAY_MS);
}

export function nextDate(date: LocalDate): LocalDate {
  return format(parse(date) + DAY_MS);
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((parse(to) - parse(from)) / DAY_MS);
}

/** 'YYYY-MM' — the grant window for the one free monthly streak freeze. */
export function monthOf(date: LocalDate): string {
  return date.slice(0, 7);
}
