import { describe, expect, it } from 'vitest'

import type { UserProfile } from '../types'
import {
  CALORIE_FLOOR,
  ageFromBirthday,
  computeBMR,
  computeTDEE,
  computeTargets,
  effectiveCalories,
  effectiveWeeklyChangeKg,
  goalWeightIssue,
  maxWeeklyChangeKg,
  minHealthyWeightKg,
  profileInputIssue,
} from './profile'

/**
 * §2.1 is a safety requirement, so these cover the floors from both sides:
 * that they bind when they should, and that they stay out of the way when the
 * requested number is already reasonable.
 */

function profileOf(over: Partial<UserProfile> = {}): UserProfile {
  const birthday = new Date()
  birthday.setFullYear(birthday.getFullYear() - 30)

  return {
    gender: 'male',
    birthday: birthday.toISOString(),
    heightCm: 180,
    weightKg: 80,
    activityLevel: 'moderate',
    goal: 'maintain',
    weeklyChangeKg: 0.5,
    ...over,
  }
}

describe('deficit cap', () => {
  it('holds a deficit to 25% of TDEE', () => {
    // 1.5 kg/week is a ~1500 kcal deficit, far past 25% of any normal TDEE.
    const profile = profileOf({ goal: 'lose', weeklyChangeKg: 1.5, weightKg: 200 })
    const tdee = computeTDEE(profile)
    const { calories, reasons } = computeTargets(profile)

    expect(reasons).toContain('deficit')
    // The rule is about the deficit, not the remainder — stated that way it is
    // immune to which side of a half-kcal the rounding lands on.
    expect(calories).toBeGreaterThanOrEqual(tdee * 0.75)
  })

  it('leaves a modest deficit untouched', () => {
    const profile = profileOf({ goal: 'lose', weeklyChangeKg: 0.25 })
    const { reasons, clamped } = computeTargets(profile)

    expect(reasons).not.toContain('deficit')
    expect(clamped).toBeNull()
  })
})

describe('calorie floors', () => {
  it('never sets a woman below 1200 kcal', () => {
    const profile = profileOf({
      gender: 'female',
      weightKg: 42,
      heightCm: 150,
      activityLevel: 'sedentary',
      goal: 'lose',
      weeklyChangeKg: 1,
    })

    expect(computeTargets(profile).calories).toBeGreaterThanOrEqual(CALORIE_FLOOR.female)
  })

  it('never sets anyone else below 1500 kcal', () => {
    const profile = profileOf({
      gender: 'male',
      weightKg: 50,
      heightCm: 160,
      activityLevel: 'sedentary',
      goal: 'lose',
      weeklyChangeKg: 1,
    })

    expect(computeTargets(profile).calories).toBeGreaterThanOrEqual(CALORIE_FLOOR.other)
  })

  it('never sets a target below BMR', () => {
    const profile = profileOf({
      activityLevel: 'sedentary',
      goal: 'lose',
      weeklyChangeKg: 0.8,
      weightKg: 80,
    })

    expect(computeTargets(profile).calories).toBeGreaterThanOrEqual(
      computeBMR(profile),
    )
  })
})

describe('clamp explanations', () => {
  it('explains itself whenever it moves the number', () => {
    const profile = profileOf({
      gender: 'female',
      weightKg: 45,
      heightCm: 152,
      activityLevel: 'sedentary',
      goal: 'lose',
      weeklyChangeKg: 1,
    })
    const { clamped, reasons } = computeTargets(profile)

    expect(reasons.length).toBeGreaterThan(0)
    expect(clamped).toBeTruthy()
    expect(clamped).toMatch(/\d/)
  })

  it('stays silent when nothing was clamped', () => {
    expect(computeTargets(profileOf()).clamped).toBeNull()
  })

  it('explains every adjustment when rate and deficit caps both apply', () => {
    const result = computeTargets(profileOf({
      goal: 'lose',
      weightKg: 100,
      weeklyChangeKg: 2,
    }))

    expect(result.reasons).toEqual(['rate', 'deficit'])
    expect(result.clamped).toContain('1% of your bodyweight')
    expect(result.clamped).toContain('25% deficit')
  })

  it('never moralises about food', () => {
    const banned = /\b(bad|cheat|guilty|earned|naughty|sinful|damage|burn it off)\b/i
    const profile = profileOf({
      gender: 'female',
      weightKg: 45,
      heightCm: 152,
      activityLevel: 'sedentary',
      goal: 'lose',
      weeklyChangeKg: 1,
    })

    expect(computeTargets(profile).clamped).not.toMatch(banned)
  })
})

describe('rate of change', () => {
  it('caps the weekly rate at 1% of bodyweight', () => {
    const profile = profileOf({ weightKg: 80, weeklyChangeKg: 1.5 })

    expect(maxWeeklyChangeKg(profile)).toBe(0.8)
    expect(effectiveWeeklyChangeKg(profile)).toBe(0.8)
  })

  it('leaves a rate under the cap alone', () => {
    const profile = profileOf({ weightKg: 80, weeklyChangeKg: 0.5 })

    expect(effectiveWeeklyChangeKg(profile)).toBe(0.5)
  })

  it('floors fractional maximums and never accepts a negative rate', () => {
    expect(maxWeeklyChangeKg(profileOf({ weightKg: 66.6 }))).toBe(0.66)
    expect(effectiveWeeklyChangeKg(profileOf({ weeklyChangeKg: -1 }))).toBe(0)
  })
})

describe('goal weight', () => {
  it('refuses a goal implying BMI below 18.5', () => {
    // Round the one-decimal UI boundary upward so it is not fractionally low.
    const profile = profileOf({ heightCm: 180, goalWeightKg: 55 })

    expect(minHealthyWeightKg(180)).toBe(60)
    expect(goalWeightIssue(profile)).toBeTruthy()
  })

  it('accepts a goal at or above the threshold', () => {
    expect(goalWeightIssue(profileOf({ heightCm: 180, goalWeightKg: 60 }))).toBeNull()
  })

  it('says nothing when no goal weight is set', () => {
    expect(goalWeightIssue(profileOf())).toBeNull()
  })
})

describe('custom targets', () => {
  it('holds a hand-entered target to the same 25% deficit cap', () => {
    const profile = profileOf({ customCalories: 1800 })
    const tdee = computeTDEE(profile)
    const result = computeTargets(profile)

    expect(result.calories).toBeGreaterThanOrEqual(tdee * 0.75)
    expect(result.reasons).toContain('deficit')
    expect(result.clamped).toContain('25% deficit')
  })

  it('holds a hand-entered target to the same floors', () => {
    const profile = profileOf({ gender: 'female', customCalories: 800 })

    expect(effectiveCalories(profile)).toBeGreaterThanOrEqual(CALORIE_FLOOR.female)
    expect(computeTargets(profile).clamped).toBeTruthy()
  })

  it('respects a reasonable custom target', () => {
    const profile = profileOf({ customCalories: 2400 })

    expect(effectiveCalories(profile)).toBe(2400)
  })
})

describe('date of birth validation', () => {
  it('rejects missing and impossible dates instead of treating them as adults', () => {
    expect(ageFromBirthday('')).toBeNaN()
    expect(ageFromBirthday('2020-02-31')).toBeNaN()
  })
})

describe('profile input validation', () => {
  it('refuses non-finite or non-positive body inputs', () => {
    expect(profileInputIssue(profileOf({ heightCm: Number.NaN }))).toMatch(/height/i)
    expect(profileInputIssue(profileOf({ weightKg: 0 }))).toMatch(/weight/i)
  })

  it('refuses a negative or non-finite weekly change', () => {
    expect(profileInputIssue(profileOf({ goal: 'lose', weeklyChangeKg: -1 }))).toMatch(/weekly/i)
    expect(profileInputIssue(profileOf({ goal: 'gain', weeklyChangeKg: Number.NaN }))).toMatch(/weekly/i)
  })
})
