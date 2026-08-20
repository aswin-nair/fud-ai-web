/** Cross-client safety constants. Client-specific activity models stay local. */
export const NUTRITION_SAFETY = {
  calorieFloor: { female: 1200, other: 1500 },
  maximumDeficitFraction: 0.25,
  maximumWeeklyRateFraction: 0.01,
  minimumHealthyBmi: 18.5,
} as const

export type MifflinSex = 'female' | 'male'

export interface MifflinInput {
  sex: MifflinSex
  weightKg: number
  heightCm: number
  ageYears: number
}

/** Mifflin-St Jeor basal metabolic rate. */
export function mifflinStJeor(input: MifflinInput): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears
  return input.sex === 'male' ? base + 5 : base - 161
}

export function bodyMassIndex(weightKg: number, heightCm: number): number {
  const metres = heightCm / 100
  return weightKg / (metres * metres)
}

/** Raw boundary; clients retain their existing display-rounding policies. */
export function minimumWeightForBmi(
  heightCm: number,
  bmi = NUTRITION_SAFETY.minimumHealthyBmi,
): number {
  const metres = heightCm / 100
  return bmi * metres * metres
}

export interface CalorieProgress {
  consumed: number
  target: number
  progress: number
  overflow: number
  isOver: boolean
  remaining: number
  overBy: number
}

/** Shared factual display model for the web and mobile calorie rings. */
export function calorieProgress(consumed: number, target: number): CalorieProgress {
  const safeConsumed = Number.isFinite(consumed) ? Math.max(0, consumed) : 0
  const safeTarget = Number.isFinite(target) ? Math.max(0, target) : 0
  const divisor = safeTarget > 0 ? safeTarget : 1
  const isOver = safeConsumed > safeTarget

  return {
    consumed: safeConsumed,
    target: safeTarget,
    progress: Math.min(safeConsumed / divisor, 1),
    overflow: Math.min(Math.max(safeConsumed - divisor, 0) / divisor, 1),
    isOver,
    remaining: Math.max(Math.round(safeTarget - safeConsumed), 0),
    overBy: Math.max(Math.round(safeConsumed - safeTarget), 0),
  }
}
