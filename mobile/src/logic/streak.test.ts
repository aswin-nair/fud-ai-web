import { describe, expect, it } from 'vitest';

import { toLocalDate } from '@/logic/dates';
import { deriveStreak } from '@/logic/streak';

const MORNING = 9;
const EVENING = 20;

describe('deriveStreak', () => {
  it('reports nothing for a user with no entries', () => {
    expect(deriveStreak([], [], '2026-03-10', MORNING)).toEqual({
      count: 0,
      loggedToday: false,
      atRisk: false,
    });
  });

  it('counts a single day logged today', () => {
    expect(deriveStreak(['2026-03-10'], [], '2026-03-10', MORNING)).toEqual({
      count: 1,
      loggedToday: true,
      atRisk: false,
    });
  });

  it('counts consecutive days ending today', () => {
    const logged = ['2026-03-10', '2026-03-09', '2026-03-08', '2026-03-07'];
    expect(deriveStreak(logged, [], '2026-03-10', MORNING).count).toBe(4);
  });

  it('stops at the first uncovered day', () => {
    // 03-08 missing, so 03-07 and earlier do not carry forward.
    const logged = ['2026-03-10', '2026-03-09', '2026-03-07', '2026-03-06'];
    expect(deriveStreak(logged, [], '2026-03-10', MORNING).count).toBe(2);
  });

  it('keeps the streak whole while today is still empty', () => {
    // Nothing logged yet today, but yesterday and before are intact. The day
    // has not ended, so the streak must not be zeroed.
    const logged = ['2026-03-09', '2026-03-08', '2026-03-07'];
    const streak = deriveStreak(logged, [], '2026-03-10', MORNING);

    expect(streak.count).toBe(3);
    expect(streak.loggedToday).toBe(false);
  });

  it('bridges a one-day gap when a freeze covers it', () => {
    const logged = ['2026-03-10', '2026-03-08', '2026-03-07'];
    const frozen = ['2026-03-09'];

    expect(deriveStreak(logged, frozen, '2026-03-10', MORNING).count).toBe(4);
  });

  it('breaks on a one-day gap with no freeze available', () => {
    const logged = ['2026-03-10', '2026-03-08', '2026-03-07'];

    expect(deriveStreak(logged, [], '2026-03-10', MORNING).count).toBe(1);
  });

  it('does not count a freeze granted but never consumed', () => {
    // Only consumed_local_date reaches this function, so an unused freeze is
    // simply absent from the list and cannot bridge anything.
    const logged = ['2026-03-10', '2026-03-08'];

    expect(deriveStreak(logged, [], '2026-03-10', MORNING).count).toBe(1);
  });

  describe('at risk', () => {
    it('stays calm in the morning with nothing logged', () => {
      expect(deriveStreak(['2026-03-09'], [], '2026-03-10', MORNING).atRisk).toBe(false);
    });

    it('flags the evening with nothing logged', () => {
      expect(deriveStreak(['2026-03-09'], [], '2026-03-10', EVENING).atRisk).toBe(true);
    });

    it('never flags once today is logged', () => {
      expect(deriveStreak(['2026-03-10'], [], '2026-03-10', EVENING).atRisk).toBe(false);
    });

    it('flags exactly at the boundary hour, not before', () => {
      expect(deriveStreak([], [], '2026-03-10', 17).atRisk).toBe(false);
      expect(deriveStreak([], [], '2026-03-10', 18).atRisk).toBe(true);
    });
  });

  describe('across timezones and DST', () => {
    it('survives travelling east across the date line boundary', () => {
      // Logged 23:30 in New York, which is already the next calendar day in
      // Tokyo. The stored local_date is whatever the profile timezone said at
      // write time, and the walk-back is pure calendar arithmetic after that.
      const logged = ['2026-03-10', '2026-03-09', '2026-03-08'];
      expect(deriveStreak(logged, [], '2026-03-10', MORNING).count).toBe(3);
    });

    it('assigns the correct local day either side of a UTC midnight', () => {
      // 22:30 on the 9th in New York, already the 10th in Tokyo and at UTC.
      const instant = '2026-03-10T02:30:00Z';

      expect(toLocalDate(instant, 'America/New_York')).toBe('2026-03-09');
      expect(toLocalDate(instant, 'Asia/Tokyo')).toBe('2026-03-10');
      expect(toLocalDate(instant, 'UTC')).toBe('2026-03-10');
    });

    it('does not skip a day across a spring-forward transition', () => {
      // US DST begins 2026-03-08; that local day is only 23 hours long.
      const logged = ['2026-03-09', '2026-03-08', '2026-03-07', '2026-03-06'];

      expect(deriveStreak(logged, [], '2026-03-09', MORNING).count).toBe(4);
    });

    it('does not double-count a day across a fall-back transition', () => {
      // US DST ends 2026-11-01; that local day is 25 hours long.
      const logged = ['2026-11-02', '2026-11-01', '2026-10-31'];

      expect(deriveStreak(logged, [], '2026-11-02', MORNING).count).toBe(3);
    });

    it('maps instants either side of spring-forward to the right local days', () => {
      // 06:30Z is 01:30 EST on 03-08; 07:30Z skips straight to 03:30 EDT.
      expect(toLocalDate('2026-03-08T06:30:00Z', 'America/New_York')).toBe('2026-03-08');
      expect(toLocalDate('2026-03-08T07:30:00Z', 'America/New_York')).toBe('2026-03-08');
      expect(toLocalDate('2026-03-08T04:30:00Z', 'America/New_York')).toBe('2026-03-07');
    });

    it('maps instants either side of fall-back to the right local days', () => {
      // 01:30 local happens twice on 2026-11-01; both are still that day.
      expect(toLocalDate('2026-11-01T05:30:00Z', 'America/New_York')).toBe('2026-11-01');
      expect(toLocalDate('2026-11-01T06:30:00Z', 'America/New_York')).toBe('2026-11-01');
      expect(toLocalDate('2026-11-01T03:30:00Z', 'America/New_York')).toBe('2026-10-31');
    });

    it('handles a half-hour offset zone', () => {
      expect(toLocalDate('2026-03-09T18:45:00Z', 'Asia/Kolkata')).toBe('2026-03-10');
      expect(toLocalDate('2026-03-09T18:15:00Z', 'Asia/Kolkata')).toBe('2026-03-09');
    });
  });

  it('walks back across a month boundary', () => {
    const logged = ['2026-03-01', '2026-02-28', '2026-02-27'];
    expect(deriveStreak(logged, [], '2026-03-01', MORNING).count).toBe(3);
  });

  it('walks back across a leap day', () => {
    // 2028 is a leap year, so 02-29 exists and must not be skipped.
    const logged = ['2028-03-01', '2028-02-29', '2028-02-28'];
    expect(deriveStreak(logged, [], '2028-03-01', MORNING).count).toBe(3);
  });

  it('walks back across a year boundary', () => {
    const logged = ['2027-01-01', '2026-12-31', '2026-12-30'];
    expect(deriveStreak(logged, [], '2027-01-01', MORNING).count).toBe(3);
  });

  it('ignores duplicate logged dates', () => {
    const logged = ['2026-03-10', '2026-03-10', '2026-03-09'];
    expect(deriveStreak(logged, [], '2026-03-10', MORNING).count).toBe(2);
  });

  it('ignores dates in the future', () => {
    const logged = ['2026-03-12', '2026-03-11', '2026-03-10'];
    expect(deriveStreak(logged, [], '2026-03-10', MORNING).count).toBe(1);
  });
});
