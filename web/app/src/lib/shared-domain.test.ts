import { describe, expect, it } from 'vitest'

import { isLocalDate, localDaysBetween, nextLocalDate, previousLocalDate } from '@fud-ai/domain/calendar'
import {
  NUTRITION_SAFETY,
  bodyMassIndex,
  calorieProgress,
  mifflinStJeor,
} from '@fud-ai/domain/nutrition'

describe('shared calendar primitives', () => {
  it('walks leap days and year boundaries as calendar labels', () => {
    expect(previousLocalDate('2028-03-01')).toBe('2028-02-29')
    expect(nextLocalDate('2026-12-31')).toBe('2027-01-01')
    expect(localDaysBetween('2026-12-30', '2027-01-02')).toBe(3)
  })

  it('rejects impossible or ambiguous date labels', () => {
    expect(isLocalDate('2026-02-29')).toBe(false)
    expect(isLocalDate('2028-02-29')).toBe(true)
    expect(() => previousLocalDate('02/03/2026')).toThrow(RangeError)
  })
})

describe('shared nutrition primitives', () => {
  it('keeps the safety constants aligned', () => {
    expect(NUTRITION_SAFETY).toMatchObject({
      calorieFloor: { female: 1200, other: 1500 },
      maximumDeficitFraction: 0.25,
      maximumWeeklyRateFraction: 0.01,
      minimumHealthyBmi: 18.5,
    })
  })

  it('provides the common Mifflin and BMI math', () => {
    expect(mifflinStJeor({ sex: 'male', weightKg: 80, heightCm: 180, ageYears: 30 })).toBe(1780)
    expect(bodyMassIndex(80, 180)).toBeCloseTo(24.69, 2)
  })

  it('keeps invalid and over-target progress factual and bounded', () => {
    expect(calorieProgress(Number.NaN, Number.POSITIVE_INFINITY)).toMatchObject({
      consumed: 0,
      target: 0,
      progress: 0,
      overflow: 0,
    })
    expect(calorieProgress(2400, 2000)).toMatchObject({
      progress: 1,
      overflow: 0.2,
      isOver: true,
      remaining: 0,
      overBy: 400,
    })
  })
})
