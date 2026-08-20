import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { deriveLoggingStreak, type LoggingStreak } from '@fud-ai/domain/streak'
import type { FoodEntry } from '../types'
import { getStreakWithFreezes } from './journey'

interface FixtureCase {
  id: string
  today: string
  localHour: number
  loggedDates: string[]
  freezeDates: string[]
  neutralDates: string[]
  expected: LoggingStreak
}

const fixture = JSON.parse(readFileSync(
  resolve(process.cwd(), '../../packages/domain/fixtures/streaks.v1.json'),
  'utf8',
)) as { schemaVersion: number; cases: FixtureCase[] }

function entryOn(day: string, index: number): FoodEntry {
  return {
    id: `${day}-${index}`,
    name: 'Fixture meal',
    calories: 400,
    protein: 20,
    carbs: 40,
    fat: 10,
    timestamp: `${day}T12:00:00`,
    source: 'manual',
    mealType: 'lunch',
  }
}

afterEach(() => vi.useRealTimers())

describe('shared streaks.v1 web adapter', () => {
  it('uses the supported fixture schema', () => {
    expect(fixture.schemaVersion).toBe(1)
  })

  it.each(fixture.cases)('$id', (testCase) => {
    const shared = deriveLoggingStreak({
      loggedDates: testCase.loggedDates,
      freezeDates: testCase.freezeDates,
      neutralDates: testCase.neutralDates,
      today: testCase.today,
      localHour: testCase.localHour,
    })
    expect(shared).toEqual(testCase.expected)

    vi.useFakeTimers()
    vi.setSystemTime(new Date(`${testCase.today}T${String(testCase.localHour).padStart(2, '0')}:00:00`))
    const entries = testCase.loggedDates.map(entryOn)
    expect(getStreakWithFreezes(
      entries,
      testCase.freezeDates,
      testCase.neutralDates,
    )).toBe(testCase.expected.count)
  })
})
