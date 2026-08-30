import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { dayRingProgress, type DayRingEntry } from './dayRing'

function entry(
  mealType: DayRingEntry['mealType'],
  source: DayRingEntry['source'] = 'manual',
  detailAdded = false,
): DayRingEntry {
  return { mealType, source, detailAdded }
}

describe('dayRingProgress', () => {
  it('makes one honest log enough for a light day', () => {
    const progress = dayRingProgress([entry('snack')], 0, 'light')
    expect(progress.complete).toBe(true)
    expect(progress.requiredTotal).toBe(1)
  })

  it('asks regular users for each main meal without requiring detail', () => {
    const partial = dayRingProgress([entry('breakfast'), entry('lunch')], 0, 'regular')
    const complete = dayRingProgress([entry('breakfast'), entry('lunch'), entry('dinner')], 0, 'regular')
    expect(partial.complete).toBe(false)
    expect(complete.complete).toBe(true)
    expect(complete.arcs[2].required).toBe(false)
  })

  it('recognizes a reviewed entry, photo, or note as detail', () => {
    expect(dayRingProgress([entry('breakfast', 'manual', true)], 0, 'detailed').arcs[2].value).toBe(1)
    expect(dayRingProgress([entry('breakfast', 'snapFood')], 0, 'detailed').arcs[2].value).toBe(1)
    expect(dayRingProgress([entry('breakfast')], 1, 'detailed').arcs[2].value).toBe(1)
  })

  it('keeps the progress engine independent of nutrition outcomes', () => {
    const source = readFileSync(new URL('./dayRing.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/\b(calories?|macros?|targets?)\b/i)
  })
})
