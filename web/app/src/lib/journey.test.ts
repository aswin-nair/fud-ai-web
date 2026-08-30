import { describe, expect, it } from 'vitest'
import type { FoodEntry } from '../types'
import { getAllBadges, getBreakfastComparison } from './journey'

function breakfast(day: string, name = day): FoodEntry {
  return {
    id: day, name, calories: 1, protein: 0, carbs: 0, fat: 0,
    timestamp: `${day}T08:00:00`, source: 'manual', mealType: 'breakfast',
  }
}

describe('focused achievements', () => {
  it('keeps the catalog to six durable milestones', () => {
    expect(getAllBadges([], 0)).toHaveLength(6)
  })
})

describe('breakfast self-comparison', () => {
  it('compares the last seven days with the person’s own best window', () => {
    const entries = [
      breakfast('2026-08-01'), breakfast('2026-08-02'), breakfast('2026-08-03'),
      breakfast('2026-08-04'), breakfast('2026-08-05'),
      breakfast('2026-08-27'), breakfast('2026-08-29'),
    ]
    expect(getBreakfastComparison(entries, new Date('2026-08-30T12:00:00'))).toEqual({ recent: 2, best: 5, days: 7 })
  })
})
