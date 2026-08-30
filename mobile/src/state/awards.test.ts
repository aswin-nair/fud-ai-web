import { ENAMEL_XP } from '@fud-ai/product'
import { describe, expect, it } from 'vitest'
import { awardLog, stampEntry } from './awards'
import { defaultGamification } from './defaults'
import type { FoodEntry } from './types'

function meal(over: Partial<FoodEntry> = {}): FoodEntry {
  return stampEntry({
    id: over.id ?? 'meal-1',
    name: 'Oats',
    calories: 300,
    protein: 12,
    carbs: 40,
    fat: 6,
    timestamp: over.timestamp ?? '2026-08-30T08:00:00',
    source: over.source ?? 'manual',
    mealType: over.mealType ?? 'breakfast',
  })
}

describe('mobile enamel awards', () => {
  it('pays a manual first log and stamps a calendar day', () => {
    const entry = meal()
    expect(entry.localDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const next = awardLog(defaultGamification(), entry, [])
    expect(next.xp).toBe(ENAMEL_XP.MANUAL + ENAMEL_XP.FIRST_OF_DAY)
  })
})
