import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { ActivityLevel, Gender, UserProfile, WeightGoal } from '../types'
import { computeBMR, computeTDEE, computeTargets, goalWeightIssue } from './profile'

interface FixtureCase {
  id: string
  input: {
    sex: Gender
    ageYears: number
    heightCm: number
    weightKg: number
    activityLevel: ActivityLevel
    goal: WeightGoal
    weeklyRatePct: number
    weeklyChangeKg: number
    goalWeightKg?: number
  }
  web: {
    goalRefused: boolean
    bmr?: number
    tdee?: number
    calories?: number
    reasons?: string[]
  }
}

const fixture = JSON.parse(readFileSync(
  resolve(process.cwd(), '../../packages/domain/fixtures/targets.v1.json'),
  'utf8',
)) as { asOfDate: string; cases: FixtureCase[] }

function webProfile(testCase: FixtureCase): UserProfile {
  const input = testCase.input
  const birthYear = Number(fixture.asOfDate.slice(0, 4)) - input.ageYears
  return {
    gender: input.sex,
    birthday: `${birthYear}-08-17T12:00:00.000Z`,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    activityLevel: input.activityLevel,
    goal: input.goal,
    weeklyChangeKg: input.weeklyChangeKg,
    goalWeightKg: input.goalWeightKg,
  }
}

describe('shared target characterization fixture — web adapter', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(`${fixture.asOfDate}T12:00:00`))
  })

  afterAll(() => vi.useRealTimers())

  for (const testCase of fixture.cases) {
    it(testCase.id, () => {
      const profile = webProfile(testCase)
      expect(Boolean(goalWeightIssue(profile))).toBe(testCase.web.goalRefused)
      if (testCase.web.goalRefused) return

      const target = computeTargets(profile)
      expect(Math.round(computeBMR(profile))).toBe(testCase.web.bmr)
      expect(Math.round(computeTDEE(profile))).toBe(testCase.web.tdee)
      expect(target.calories).toBe(testCase.web.calories)
      expect(target.reasons).toEqual(testCase.web.reasons)
    })
  }
})
