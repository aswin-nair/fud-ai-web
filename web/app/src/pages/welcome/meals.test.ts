import { describe, expect, it } from 'vitest'
import { mealKcal, SAMPLE_MEALS } from './meals'

describe('welcome page sample meals', () => {
  it('have unique ids', () => {
    const ids = SAMPLE_MEALS.map(meal => meal.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keep macro energy within 10% of the listed items, so the sample numbers are believable', () => {
    for (const meal of SAMPLE_MEALS) {
      const fromMacros = meal.protein * 4 + meal.carbs * 4 + meal.fat * 9
      const total = mealKcal(meal)
      expect(Math.abs(fromMacros - total) / total, meal.name).toBeLessThan(0.1)
    }
  })

  it('place every scan marker on the plate', () => {
    for (const meal of SAMPLE_MEALS) {
      for (const item of meal.items) {
        expect(Math.hypot(item.x - 200, item.y - 200), `${meal.name}: ${item.label}`).toBeLessThan(170)
      }
    }
  })
})
