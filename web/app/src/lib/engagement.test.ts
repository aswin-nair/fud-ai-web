import { describe, expect, it } from 'vitest'

import type { FoodEntry, GamificationState } from '../types'
import { isNewQuestCompletion } from './gamification'
import { QUEST_TYPES, questForDate, questTitle } from './quests'
import { defaultGamification } from './storage'
import { computeXpAwards } from './xp'

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
  it('generates logging-only quests', () => {
    expect(QUEST_TYPES).toEqual(['log_n_meals', 'log_before', 'log_streak'])

    for (let day = 1; day <= 28; day += 1) {
      const date = `2026-08-${String(day).padStart(2, '0')}`
      expect(questTitle(questForDate(date))).not.toMatch(/calorie|macro|protein|target|deficit/i)
    }
  })

  it('does not award XP for calorie or macro outcomes', () => {
    const awards = computeXpAwards(entry, [], emptyGamification)
    expect(awards.map(award => award.key)).not.toContain('balanced-2026-08-17')
    expect(awards.map(award => award.label).join(' ')).not.toMatch(/calorie|macro|protein|target/i)
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

    expect(computeXpAwards(entry, [], gamification)).toEqual([])
  })

  it('recognizes a completed quest after the calendar day changes', () => {
    const yesterday = {
      date: '2026-08-16',
      type: 'log_before' as const,
      target: 1,
      progress: 1,
      completedAt: '2026-08-16T08:00:00.000Z',
    }
    const today = {
      ...yesterday,
      date: '2026-08-17',
      completedAt: '2026-08-17T08:00:00.000Z',
    }

    expect(isNewQuestCompletion(yesterday, today)).toBe(true)
    expect(isNewQuestCompletion(today, today)).toBe(false)
  })
})
