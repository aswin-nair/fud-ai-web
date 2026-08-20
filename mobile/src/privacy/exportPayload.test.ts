import { describe, expect, it } from 'vitest'

import {
  buildLocalExport,
  secretKeysInExport,
  serializeLocalExport,
  type ExportSource,
} from './exportPayload'

function source(overrides: Partial<ExportSource> = {}): ExportSource {
  return {
    exportedAt: '2026-08-20T12:00:00.000Z',
    profile: {
      name: 'Ada',
      dateOfBirth: '1990-01-02',
      sex: 'female',
      heightCm: 170,
      weightKg: 65,
      activityLevel: 'light',
      goal: 'maintain',
      weeklyRatePct: 0,
      timezone: 'Asia/Kolkata',
      dailyKcalTarget: 2000,
      proteinGTarget: 100,
      carbsGTarget: 200,
      fatGTarget: 60,
      soundEnabled: true,
      hapticsEnabled: false,
      trackingPaused: false,
    },
    foods: [
      {
        id: 1,
        name: 'Egg',
        brand: null,
        servingLabel: '1 egg',
        servingGrams: 50,
        kcal: 72,
        proteinG: 6,
        carbsG: 0,
        fatG: 5,
        source: 'builtin',
        isFavorite: false,
      },
      {
        id: 2,
        name: 'Home dal',
        brand: null,
        servingLabel: '1 bowl',
        servingGrams: 200,
        kcal: 180,
        proteinG: 12,
        carbsG: 20,
        fatG: 4,
        source: 'custom',
        isFavorite: true,
      },
    ],
    meals: [
      {
        id: 9,
        foodId: 2,
        customName: null,
        servings: 1,
        kcal: 180,
        proteinG: 12,
        carbsG: 20,
        fatG: 4,
        mealSlot: 'lunch',
        loggedAtUtc: '2026-08-20T06:30:00.000Z',
        localDate: '2026-08-20',
      },
    ],
    points: [{ delta: 10, reason: 'meal_logged', localDate: '2026-08-20' }],
    quests: [{ localDate: '2026-08-20', type: 'log_n_meals', target: 1, progress: 1 }],
    freezes: [{ grantedLocalDate: '2026-08-01', consumedLocalDate: null }],
    ...overrides,
  }
}

describe('local export payload', () => {
  it('includes profile, custom foods, meals, and settings in readable JSON', () => {
    const json = serializeLocalExport(buildLocalExport(source()))
    const parsed = JSON.parse(json) as ReturnType<typeof buildLocalExport>

    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.app).toBe('fud-ai-mobile')
    expect(parsed.profile?.name).toBe('Ada')
    expect(parsed.settings?.hapticsEnabled).toBe(false)
    expect(parsed.foods).toHaveLength(1)
    expect(parsed.foods[0]?.name).toBe('Home dal')
    expect(parsed.meals).toHaveLength(1)
    expect(parsed.weight).toEqual([])
    expect(parsed.exercise).toEqual([])
    expect(json).toContain('"name": "Ada"')
  })

  it('excludes secrets, lock credentials, and builtin catalogue rows', () => {
    const payload = buildLocalExport(source())
    const json = serializeLocalExport({
      ...payload,
      // If a future caller tries to smuggle a key onto the object, the scanner
      // still has to reject the serialized form.
    })

    expect(secretKeysInExport(json)).toEqual([])
    expect(json).not.toMatch(/Egg/)
    expect(json).not.toMatch(/app-lock|apiKey|bearer/i)
  })

  it('flags a leaked key in serialized export text', () => {
    expect(secretKeysInExport('{"apiKey":"sk-test"}')).toEqual(['apiKey'])
  })
})
