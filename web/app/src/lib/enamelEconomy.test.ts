import { describe, expect, it } from 'vitest'

import type { FoodEntry, GamificationState } from '../types'
import { defaultGamification } from './storage'
import {
  ENAMEL_CAPS,
  ENAMEL_COSTS,
  ENAMEL_XP,
  SUBTRACTIVE_QUEST_PATTERN,
  applyEnamelLogAwards,
  applyNote,
  applyWaterChange,
  buyFreeze,
  canRepairStreak,
  repairStreak,
  rollEnamelQuests,
  syncEnamelQuests,
} from './enamelEconomy'

function meal(over: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id: over.id ?? 'meal-1',
    name: over.name ?? 'Oats',
    calories: 300,
    protein: 12,
    carbs: 40,
    fat: 6,
    timestamp: over.timestamp ?? '2026-08-22T08:00:00',
    source: over.source ?? 'manual',
    mealType: over.mealType ?? 'breakfast',
  }
}

function g(over: Partial<GamificationState> = {}): GamificationState {
  return { ...defaultGamification(), ...over }
}

describe('enamel XP caps', () => {
  it('pays photo 15 and manual 10, then first-of-day once', () => {
    const first = applyEnamelLogAwards(g(), meal({ id: 'a', source: 'manual' }), [])
    expect(first.xp).toBe(ENAMEL_XP.MANUAL + ENAMEL_XP.FIRST_OF_DAY)
    const photo = applyEnamelLogAwards(first, meal({ id: 'b', source: 'snapFood', mealType: 'lunch', timestamp: '2026-08-22T12:00:00' }), [meal({ id: 'a' })])
    expect(photo.xp - first.xp).toBe(ENAMEL_XP.PHOTO)
    const again = applyEnamelLogAwards(first, meal({ id: 'a', source: 'manual' }), [])
    expect(again.xp).toBe(first.xp)
  })

  it('caps water at 8 glasses and notes at 3', () => {
    let state = g()
    for (let i = 1; i <= 10; i++) state = applyWaterChange(state, '2026-08-22', i)
    expect(state.waterByDate['2026-08-22']).toBe(ENAMEL_CAPS.WATER)
    expect(state.xp).toBe(ENAMEL_XP.WATER * ENAMEL_CAPS.WATER)

    for (let i = 0; i < 5; i++) state = applyNote(state, '2026-08-22')
    expect(state.notesByDate['2026-08-22']).toBe(ENAMEL_CAPS.NOTES)
    expect(state.xp).toBe(ENAMEL_XP.WATER * ENAMEL_CAPS.WATER + ENAMEL_XP.NOTE * ENAMEL_CAPS.NOTES)
  })

  it('awards three-mains once when breakfast, lunch, and dinner are present', () => {
    const breakfast = meal({ id: 'b', mealType: 'breakfast' })
    const lunch = meal({ id: 'l', mealType: 'lunch', timestamp: '2026-08-22T12:00:00' })
    const dinner = meal({ id: 'd', mealType: 'dinner', timestamp: '2026-08-22T19:00:00' })
    const afterTwo = applyEnamelLogAwards(applyEnamelLogAwards(g(), breakfast, []), lunch, [breakfast])
    const afterThree = applyEnamelLogAwards(afterTwo, dinner, [breakfast, lunch])
    expect(afterThree.awardedKeys).toContain('enamel-mains-2026-08-22')
    expect(afterThree.xp - afterTwo.xp).toBe(ENAMEL_XP.MANUAL + ENAMEL_XP.THREE_MAINS)
  })
})

describe('freeze and repair', () => {
  it('caps bought freezes at 2 and charges 100 gems', () => {
    let state = g({ gems: 400, streakFreezes: 0 })
    state = buyFreeze(state)!
    state = buyFreeze(state)!
    expect(state.streakFreezes).toBe(2)
    expect(state.gems).toBe(200)
    expect(buyFreeze(state)).toBeNull()
  })

  it('allows one repair inside 48h and rejects a second in the same month', () => {
    const broken = g({
      gems: 500,
      brokenOn: '2026-08-21',
      brokenFrom: 12,
    })
    expect(canRepairStreak(broken, '2026-08-19', '2026-08-22')).toBe(true)
    const repaired = repairStreak(broken, '2026-08-19', '2026-08-22')
    expect(repaired?.gems).toBe(500 - ENAMEL_COSTS.REPAIR)
    expect(repaired?.repairsUsedMonth).toBe('2026-08')
    expect(canRepairStreak(repaired!, '2026-08-19', '2026-08-23')).toBe(false)
    expect(repairStreak(repaired!, '2026-08-19', '2026-08-23')).toBeNull()
  })

  it('rejects repair outside the window', () => {
    const broken = g({ gems: 500, brokenOn: '2026-08-18', brokenFrom: 9 })
    expect(canRepairStreak(broken, '2026-08-16', '2026-08-22')).toBe(false)
  })
})

describe('additive-only quest catalog', () => {
  it('never ships subtractive, fasting, or protein-hit quest copy', () => {
    const monday = rollEnamelQuests('2026-08-17')
    const labels = [...monday.daily, monday.weekly].map(quest => quest.label)
    for (const label of labels) {
      expect(label).not.toMatch(SUBTRACTIVE_QUEST_PATTERN)
    }

    for (let day = 1; day <= 28; day++) {
      const date = `2026-08-${String(day).padStart(2, '0')}`
      const rolled = rollEnamelQuests(date)
      const synced = syncEnamelQuests(
        g({ enamelQuests: rolled }),
        date,
        { entries: [], water: 0, notes: 0 },
        false,
      )
      for (const quest of [...synced.daily, synced.weekly]) {
        expect(quest.label).not.toMatch(SUBTRACTIVE_QUEST_PATTERN)
        expect(quest.label).not.toMatch(/calorie|macro|protein|fasting/i)
      }
    }
  })
})
