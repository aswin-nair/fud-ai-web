import { describe, expect, it } from 'vitest'

import type { FoodAnalysis } from '../types'
import { reviewFoodIssue, validateManualFood } from './foodEntryValidation'

const analysis: FoodAnalysis = {
  name: 'Toast', calories: 180, protein: 6, carbs: 30, fat: 4, servingSizeGrams: 70,
}

describe('food entry validation', () => {
  it('normalizes valid manual values after applying servings', () => {
    expect(validateManualFood({
      name: ' Soup ', calories: '120.4', protein: '3', carbs: '', fat: '2', servings: 1.5,
    })).toEqual({
      ok: true,
      value: { name: 'Soup', calories: 181, protein: 4.5, carbs: 0, fat: 3 },
    })
  })

  it.each([
    { name: 'Soup', calories: '-1', protein: '', carbs: '', fat: '', servings: 1 },
    { name: 'Soup', calories: 'Infinity', protein: '', carbs: '', fat: '', servings: 1 },
    { name: 'Soup', calories: '100000', protein: '', carbs: '', fat: '', servings: 2 },
    { name: 'Soup', calories: '100', protein: '', carbs: '', fat: '', servings: Number.NaN },
  ])('rejects unsafe manual input %#', input => {
    expect(validateManualFood(input).ok).toBe(false)
  })

  it('rejects blank and non-finite review values', () => {
    expect(reviewFoodIssue(analysis, new Set(['calories']))).toMatch(/numeric/i)
    expect(reviewFoodIssue({ ...analysis, fat: Number.NaN }, new Set())).toMatch(/finite/i)
  })
})
