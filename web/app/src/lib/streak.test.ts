import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FoodEntry } from '../types'
import { localDayKey } from './dates'
import { getStreakWithFreezes } from './journey'

/**
 * §14 requires the streak to survive DST and timezone shifts. The streak walks
 * calendar days derived from local date parts, so the cases that matter are the
 * ones where "local day" and "UTC day" disagree: a late-evening log, and the
 * two DST transitions.
 *
 * vitest.config.ts pins TZ to America/New_York. The first test fails loudly if
 * that stops being true, because every DST case below would otherwise pass for
 * the wrong reason.
 */

function entryAt(date: Date, id = date.toISOString()): FoodEntry {
  return {
    id,
    name: 'Test meal',
    calories: 400,
    protein: 20,
    carbs: 40,
    fat: 10,
    timestamp: date.toISOString(),
    source: 'manual',
    mealType: 'lunch',
  }
}

/** An entry at local noon, `daysAgo` before the current mocked time. */
function entryDaysAgo(daysAgo: number): FoodEntry {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(12, 0, 0, 0)
  return entryAt(d, `d-${daysAgo}`)
}

afterEach(() => {
  vi.useRealTimers()
})

describe('test environment', () => {
  it('runs in a timezone that observes DST', () => {
    const january = new Date(2025, 0, 15).getTimezoneOffset()
    const july = new Date(2025, 6, 15).getTimezoneOffset()

    expect(january).not.toBe(july)
  })
})

describe('streak basics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 10, 12, 0, 0))
  })

  it('is zero with no entries', () => {
    expect(getStreakWithFreezes([], [])).toBe(0)
  })

  it('counts a single day logged today', () => {
    expect(getStreakWithFreezes([entryDaysAgo(0)], [])).toBe(1)
  })

  it('counts consecutive days', () => {
    const entries = [0, 1, 2, 3].map(entryDaysAgo)

    expect(getStreakWithFreezes(entries, [])).toBe(4)
  })

  it('holds the streak when today is not logged yet', () => {
    // §2.3: the day is not over, so nothing is lost yet.
    const entries = [1, 2, 3].map(entryDaysAgo)

    expect(getStreakWithFreezes(entries, [])).toBe(3)
  })

  it('stops at a gap with no freeze', () => {
    // Today and yesterday logged, then a hole at two days ago.
    const entries = [0, 1, 3, 4].map(entryDaysAgo)

    expect(getStreakWithFreezes(entries, [])).toBe(2)
  })

  it('bridges a gap covered by a freeze', () => {
    const entries = [0, 1, 3, 4].map(entryDaysAgo)
    const missed = new Date()
    missed.setDate(missed.getDate() - 2)

    expect(getStreakWithFreezes(entries, [localDayKey(missed)])).toBe(5)
  })

  it('ignores duplicate logs on one day', () => {
    const noon = entryDaysAgo(0)
    const evening = new Date()
    evening.setHours(19, 0, 0, 0)

    expect(getStreakWithFreezes([noon, entryAt(evening, 'x')], [])).toBe(1)
  })
})

describe('local day boundaries', () => {
  it('counts a late-evening log against the local day, not the UTC one', () => {
    // 23:30 in New York is already the next day in UTC. Reading the UTC date
    // here would shift the log a day forward and break the streak.
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 10, 23, 45, 0))

    const tonight = new Date(2025, 5, 10, 23, 30, 0)
    expect(tonight.toISOString().slice(0, 10)).toBe('2025-06-11')
    expect(localDayKey(tonight)).toBe('2025-06-10')
    expect(getStreakWithFreezes([entryAt(tonight)], [])).toBe(1)
  })

  it('counts an early-morning log against the local day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 10, 8, 0, 0))

    const earlier = new Date(2025, 5, 10, 0, 30, 0)
    expect(localDayKey(earlier)).toBe('2025-06-10')
    expect(getStreakWithFreezes([entryAt(earlier)], [])).toBe(1)
  })
})

describe('daylight saving transitions', () => {
  it('survives spring forward', () => {
    // US Eastern springs forward on 2025-03-09; that day is only 23 hours long.
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 2, 10, 12, 0, 0))

    const entries = [0, 1, 2, 3].map(entryDaysAgo)

    expect(getStreakWithFreezes(entries, [])).toBe(4)
  })

  it('survives falling back', () => {
    // US Eastern falls back on 2025-11-02; that day is 25 hours long, which is
    // what breaks naive "subtract 86400000ms" implementations.
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 10, 3, 12, 0, 0))

    const entries = [0, 1, 2, 3].map(entryDaysAgo)

    expect(getStreakWithFreezes(entries, [])).toBe(4)
  })

  it('counts the long day exactly once', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 10, 2, 23, 0, 0))

    // Both sides of the repeated 01:00 hour on the fall-back day.
    const before = new Date(2025, 10, 2, 0, 30, 0)
    const after = new Date(2025, 10, 2, 22, 30, 0)

    expect(localDayKey(before)).toBe(localDayKey(after))
    expect(getStreakWithFreezes([entryAt(before, 'a'), entryAt(after, 'b')], [])).toBe(1)
  })
})
