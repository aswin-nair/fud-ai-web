import { describe, expect, it } from 'vitest'

import type { FoodEntry, GamificationState } from '../types'
import { advanceAfterLog } from './gamification'
import { defaultGamification } from './storage'
import { applyEnamelLogAwards } from './enamelEconomy'

const emptyGamification: GamificationState = {
  ...defaultGamification(),
  freezeEarnedMonth: '2026-08',
}

const entry: FoodEntry = {
  id: 'meal-1',
  name: 'Lunch',
  calories: 600,
  protein: 30,
  carbs: 70,
  fat: 20,
  timestamp: '2026-08-17T12:00:00-04:00',
  source: 'manual',
  mealType: 'lunch',
}

describe('healthy engagement policy', () => {
  it('does not award XP for calorie or macro outcomes', () => {
    const next = applyEnamelLogAwards(emptyGamification, entry, [])
    expect(next.xpEvents.map(event => event.label).join(' ')).not.toMatch(/calorie|macro|protein|target/i)
  })

  it('keeps old entry IDs idempotent after the visible feed is truncated', () => {
    const laterEvents = Array.from({ length: 50 }, (_, index) => ({
      id: `event-${index}`,
      key: `meal-later-${index}`,
      xp: 15,
      label: 'Logged a meal',
      timestamp: `2026-08-17T12:${String(index).padStart(2, '0')}:00.000Z`,
    }))
    const gamification: GamificationState = {
      ...emptyGamification,
      xpEvents: laterEvents,
      awardedKeys: [
        'meal-meal-1',
        'new-food-meal-1',
        'first-meal-2026-08-17',
        ...laterEvents.map(event => event.key),
      ],
    }

    const first = applyEnamelLogAwards(gamification, entry, [])
    const replayed = applyEnamelLogAwards(first, entry, [])
    expect(replayed).toEqual(first)
  })

  it('does not advance or award a persisted legacy quest', () => {
    const state = {
      onboarded: true,
      profile: {
        name: '', gender: 'male' as const, birthday: '1990-01-01', heightCm: 175, weightKg: 70,
        activityLevel: 'moderate' as const, goal: 'maintain' as const, trackingPaused: false,
      },
      foodEntries: [], weightEntries: [], exerciseEntries: [], favoriteMeals: [], chatMessages: [],
      aiSettings: { provider: 'gemini' as const, apiKey: '', model: 'gemini-2.0-flash' },
      gamification: {
        ...emptyGamification,
        quest: { date: '2026-08-17', type: 'log_n_meals' as const, target: 1, progress: 0, completedAt: null },
      },
    }
    const next = advanceAfterLog(state, entry)
    expect(next.gamification.quest).toEqual(state.gamification.quest)
    expect(next.gamification.xpEvents.some(event => event.key.startsWith('quest-'))).toBe(false)
  })
})
