import { describe, expect, it } from 'vitest'

import type { UserProfile } from '../types'
import {
  CALORIE_FLOOR,
  computeBMR,
  computeTDEE,
  computeTargets,
  effectiveCalories,
  effectiveWeeklyChangeKg,
  goalWeightIssue,
  maxWeeklyChangeKg,
  minHealthyWeightKg,
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
    const tdee = Math.round(computeTDEE(profile))
    const { calories, reasons } = computeTargets(profile)

    expect(reasons).toContain('deficit')
    // The rule is about the deficit, not the remainder — stated that way it is
    // immune to which side of a half-kcal the rounding lands on.
    expect(tdee - calories).toBeLessThanOrEqual(Math.ceil(tdee * 0.25))
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
      Math.round(computeBMR(profile)),
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
})

describe('goal weight', () => {
  it('refuses a goal implying BMI below 18.5', () => {
    // 18.5 BMI at 180cm is 59.9 kg.
    const profile = profileOf({ heightCm: 180, goalWeightKg: 55 })

    expect(minHealthyWeightKg(180)).toBe(59.9)
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
