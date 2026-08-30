import { afterEach, describe, expect, it, vi } from 'vitest'

import type { FoodEntry } from '../types'
import { freshState } from './storage'
import { advanceAfterLog, openSession, transitionTrackingPause } from './gamification'
import { applyFreeze } from './journey'

function entryDaysAgo(daysAgo: number, id = `meal-${daysAgo}`): FoodEntry {
  const timestamp = new Date()
  timestamp.setDate(timestamp.getDate() - daysAgo)
  timestamp.setHours(12, 0, 0, 0)
  return {
    id,
    name: 'Test meal',
    calories: 400,
    protein: 20,
    carbs: 40,
    fat: 10,
    timestamp: timestamp.toISOString(),
    source: 'manual',
    mealType: 'lunch',
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('tracking pause lifecycle', () => {
  it('uses the local month for freeze grants at a UTC month boundary', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 11, 31, 23, 30))

    const state = freshState()
    expect(state.gamification.freezeEarnedMonth).toBe('2025-12')

    const update = applyFreeze([], {
      ...state.gamification,
      streakFreezes: 0,
      freezeEarnedMonth: '2025-12',
    })
    expect(update.freezeEarnedMonth).toBe('2025-12')
    expect(update.streakFreezes).toBe(0)
  })

  it('protects completed pause dates, excluding the resume date', () => {
    const state = freshState()
    const paused = transitionTrackingPause(
      state.gamification,
      false,
      true,
      new Date(2025, 5, 7, 9),
    )
    const resumed = transitionTrackingPause(
      paused,
      true,
      false,
      new Date(2025, 5, 10, 9),
    )

    expect(paused.pauseStartedDate).toBe('2025-06-07')
    expect(resumed.pauseStartedDate).toBeNull()
    expect(resumed.pauseProtectedDates).toEqual([
      '2025-06-07',
      '2025-06-08',
      '2025-06-09',
    ])
  })

  it('does not consume a freeze or mutate a retired quest during a paused session or log', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 10, 12))

    const state = freshState()
    state.profile.trackingPaused = true
    state.foodEntries = [entryDaysAgo(2)]
    state.gamification.quest = {
      date: '2025-06-10',
      type: 'log_n_meals',
      target: 1,
      progress: 0,
      completedAt: null,
    }

    const opened = openSession(state)
    expect(opened.gamification.pauseStartedDate).toBe('2025-06-10')
    expect(opened.gamification.streakFreezes).toBe(1)
    expect(opened.gamification.freezeUsedDates).toEqual([])
    expect(opened.gamification.quest).toEqual(state.gamification.quest)

    const advanced = advanceAfterLog(
      { ...state, gamification: opened.gamification },
      entryDaysAgo(0, 'paused-meal'),
    )
    expect(advanced.gamification.xp).toBe(0)
    expect(advanced.gamification.quest).toEqual(state.gamification.quest)
    expect(advanced.gamification.pauseProtectedDates).toEqual(['2025-06-10'])
    expect(advanced.freezeApplied).toBeNull()
  })
})

describe('retired quest compatibility', () => {
  it('preserves stored quest data without running it or awarding invisible XP', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 10, 12))

    const state = freshState()
    state.foodEntries = [1, 2, 3].map(daysAgo => entryDaysAgo(daysAgo))
    state.gamification.quest = {
      date: '2025-06-10',
      type: 'log_streak',
      target: 3,
      progress: 2,
      completedAt: null,
    }

    const opened = openSession(state)
    expect(opened.gamification.quest?.progress).toBe(2)
    expect(opened.gamification.quest?.completedAt).toBeNull()

    const advanced = advanceAfterLog(
      { ...state, gamification: opened.gamification },
      entryDaysAgo(0, 'committing-meal'),
    )
    expect(advanced.gamification.quest).toEqual(state.gamification.quest)
    expect(advanced.gamification.xpEvents.some(event => event.key.startsWith('quest-'))).toBe(false)
  })
})
