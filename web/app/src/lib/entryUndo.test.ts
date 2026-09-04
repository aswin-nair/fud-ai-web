import { describe, expect, it } from 'vitest'
import { restoreDeletedEntry } from './entryUndo'
import type { FoodEntry } from '../types'

const meal: FoodEntry = { id: 'oats', name: 'Oats', calories: 250, protein: 8, carbs: 40,
  fat: 5, timestamp: '2026-09-04T08:00:00Z', localDate: '2026-09-04', source: 'manual', mealType: 'breakfast' }

describe('deletion undo', () => {
  it('restores the exact record, including date and portion, without changing existing entries', () => {
    const existing = [{ ...meal, id: 'rice', name: 'Rice' }]
    expect(restoreDeletedEntry(existing, meal)).toEqual([...existing, meal])
    expect(existing).toHaveLength(1)
  })
  it('is idempotent and never overwrites a newer edit', () => {
    const existing = [{ ...meal, calories: 375 }]
    expect(restoreDeletedEntry(existing, meal)).toBe(existing)
    expect(restoreDeletedEntry(restoreDeletedEntry([], meal), meal)).toHaveLength(1)
  })
})
