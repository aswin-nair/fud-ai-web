import { describe, expect, it } from 'vitest'
import type { FoodEntry } from '../types'
import { dayRingProgress } from './dayRing'

function entry(mealType: FoodEntry['mealType'], source: FoodEntry['source'] = 'manual', detailAdded = false) {
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

  /* The §3.3 guardrail — that the ring never reads calories, macros or targets —
     is asserted against the real implementation in
     packages/product/src/dayRing.test.ts, which the root `npm test` runs. It was
     duplicated here until dayRing.ts became a re-export, at which point this
     copy was scanning a four-line shim and passing without checking anything. */
})
