import { describe, expect, it } from 'vitest';

import {
  daysBetween,
  localHourIn,
  monthOf,
  nextDate,
  previousDate,
  toLocalDate,
} from '@/logic/dates';

describe('toLocalDate', () => {
  it('uses the timezone it is given, not the device timezone', () => {
    // The suite runs with the machine's zone, whatever that is. The same
    // instant must still resolve differently per zone, which is what proves
    // the profile timezone is what decides local_date at write time.
    const instant = '2026-07-07T20:00:00Z';

    expect(toLocalDate(instant, 'Pacific/Kiritimati')).toBe('2026-07-08');
    expect(toLocalDate(instant, 'UTC')).toBe('2026-07-07');
    expect(toLocalDate(instant, 'Pacific/Midway')).toBe('2026-07-07');

    const spread = new Set([
      toLocalDate(instant, 'Pacific/Kiritimati'),
      toLocalDate(instant, 'Pacific/Midway'),
    ]);
    expect(spread.size).toBe(2);
  });

  it('accepts a Date as well as an ISO string', () => {
    const instant = new Date('2026-07-07T20:00:00Z');
    expect(toLocalDate(instant, 'UTC')).toBe('2026-07-07');
  });

  it('keeps a late-evening log on the day the user experienced it', () => {
    // 23:30 in Los Angeles is already the next day at UTC. Storing the UTC day
    // would move the entry to tomorrow and break the streak.
    const instant = '2026-07-08T06:30:00Z';

    expect(toLocalDate(instant, 'America/Los_Angeles')).toBe('2026-07-07');
    expect(toLocalDate(instant, 'UTC')).toBe('2026-07-08');
  });
});

describe('localHourIn', () => {
  it('reads the hour in the given zone', () => {
    const instant = new Date('2026-07-07T20:00:00Z');

    expect(localHourIn('UTC', instant)).toBe(20);
    expect(localHourIn('Asia/Tokyo', instant)).toBe(5);
  });

  it('returns a number in range for a half-hour offset zone', () => {
    const hour = localHourIn('Asia/Kolkata', new Date('2026-07-07T20:00:00Z'));

    expect(hour).toBe(1);
  });
});

describe('calendar arithmetic', () => {
  it('steps back a day', () => {
    expect(previousDate('2026-03-10')).toBe('2026-03-09');
  });

  it('steps forward a day', () => {
    expect(nextDate('2026-03-09')).toBe('2026-03-10');
  });

  it('crosses a month boundary', () => {
    expect(previousDate('2026-03-01')).toBe('2026-02-28');
    expect(nextDate('2026-02-28')).toBe('2026-03-01');
  });

  it('crosses a leap day', () => {
    expect(previousDate('2028-03-01')).toBe('2028-02-29');
    expect(nextDate('2028-02-29')).toBe('2028-03-01');
  });

  it('crosses a year boundary', () => {
    expect(previousDate('2027-01-01')).toBe('2026-12-31');
    expect(nextDate('2026-12-31')).toBe('2027-01-01');
  });

  it('is unaffected by a DST transition', () => {
    // Stepping through 2026-03-08 in a zone that springs forward must still
    // advance exactly one calendar day.
    expect(nextDate('2026-03-07')).toBe('2026-03-08');
    expect(nextDate('2026-03-08')).toBe('2026-03-09');
    expect(previousDate('2026-11-02')).toBe('2026-11-01');
    expect(previousDate('2026-11-01')).toBe('2026-10-31');
  });

  it('counts whole days between two dates', () => {
    expect(daysBetween('2026-03-01', '2026-03-10')).toBe(9);
    expect(daysBetween('2026-03-10', '2026-03-01')).toBe(-9);
    expect(daysBetween('2026-03-10', '2026-03-10')).toBe(0);
  });

  it('counts across a DST transition without drifting', () => {
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
  });

  it('reduces a date to its grant month', () => {
    expect(monthOf('2026-03-10')).toBe('2026-03');
  });
});
