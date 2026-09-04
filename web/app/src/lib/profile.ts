import type { ActivityLevel, UserProfile, WeightGoal } from '../types'
import {
  NUTRITION_SAFETY,
  mifflinStJeor,
  minimumWeightForBmi,
} from '@fud-ai/domain/nutrition'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.465,
  active: 1.55,
  veryActive: 1.725,
  extraActive: 1.9,
}

const PROTEIN_PER_KG: Record<ActivityLevel, number> = {
  sedentary: 0.8,
  light: 1.2,
  moderate: 1.6,
  active: 1.8,
  veryActive: 2.0,
  extraActive: 2.2,
}

export function ageFromBirthday(birthday: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthday)
  if (!match) return Number.NaN

  const [, year, month, day] = match
  const birth = new Date(Number(year), Number(month) - 1, Number(day))
  if (
    birth.getFullYear() !== Number(year)
    || birth.getMonth() !== Number(month) - 1
    || birth.getDate() !== Number(day)
  ) return Number.NaN

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function computeBMR(profile: UserProfile): number {
  if (profile.bodyFatPercentage != null) {
    return 370 + 21.6 * (1 - profile.bodyFatPercentage) * profile.weightKg
  }
  const age = ageFromBirthday(profile.birthday)
  return mifflinStJeor({
    sex: profile.gender === 'male' ? 'male' : 'female',
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    ageYears: age,
  })
}

export function computeTDEE(profile: UserProfile): number {
  return computeBMR(profile) * ACTIVITY_MULTIPLIERS[profile.activityLevel]
}

/* ── §2.1 floors and caps ──────────────────────────────────────
 * Safety requirements, not preferences. Every calorie target the app shows
 * passes through computeTargets, including a hand-entered custom one, so there
 * is no route to a number below these floors.
 */

/** The lowest daily intake the app will set. §2.1. */
export const CALORIE_FLOOR = NUTRITION_SAFETY.calorieFloor

/** A deficit may not exceed this share of TDEE. §2.1. */
export const MAX_DEFICIT_FRACTION = NUTRITION_SAFETY.maximumDeficitFraction

/** Rate of loss is capped at this share of bodyweight per week. §2.1. */
export const MAX_WEEKLY_CHANGE_FRACTION = NUTRITION_SAFETY.maximumWeeklyRateFraction

/** A goal weight below this BMI is refused outright. §2.1. */
export const MIN_HEALTHY_BMI = NUTRITION_SAFETY.minimumHealthyBmi

export type ClampReason = 'rate' | 'deficit' | 'floor' | 'bmr'

export interface CalorieTarget {
  calories: number
  /** Plain-language explanation, or null when nothing moved the number. */
  clamped: string | null
  reasons: ClampReason[]
}

function calorieFloor(profile: UserProfile): number {
  return profile.gender === 'female' ? CALORIE_FLOOR.female : CALORIE_FLOOR.other
}

/** The fastest weekly change allowed for this bodyweight. */
export function maxWeeklyChangeKg(profile: UserProfile): number {
  return Math.floor(profile.weightKg * MAX_WEEKLY_CHANGE_FRACTION * 100) / 100
}

/** The lightest goal weight allowed for this height. */
export function minHealthyWeightKg(heightCm: number): number {
  return Math.ceil(minimumWeightForBmi(heightCm, MIN_HEALTHY_BMI) * 10) / 10
}

/**
 * Why a goal weight cannot be saved, or null when it is fine. §2.1 is explicit
 * that this is refused rather than clamped — the number is the user's to change.
 */
export function goalWeightIssue(profile: UserProfile): string | null {
  const goal = profile.goalWeightKg
  if (goal == null || profile.heightCm <= 0) return null

  const lightest = minHealthyWeightKg(profile.heightCm)
  if (goal >= lightest) return null

  return `A goal of ${goal} kg sits below a healthy weight for your height. Enter ${lightest} kg or more to continue.`
}

/** The requested rate, held to the §2.1 cap. */
export function effectiveWeeklyChangeKg(profile: UserProfile): number {
  const requested = profile.weeklyChangeKg ?? 0.5
  if (!Number.isFinite(requested)) return 0
  return Math.min(Math.max(0, requested), maxWeeklyChangeKg(profile))
}

/** A plain-language refusal for profile values that cannot safely be saved. */
export function profileInputIssue(profile: UserProfile): string | null {
  if (!Number.isFinite(profile.heightCm) || profile.heightCm <= 0) {
    return 'Enter a valid height greater than zero.'
  }
  if (!Number.isFinite(profile.weightKg) || profile.weightKg <= 0) {
    return 'Enter a valid weight greater than zero.'
  }

  const age = ageFromBirthday(profile.birthday)
  if (!Number.isFinite(age)) return 'Enter a valid date of birth.'
  if (age < 18) return 'Fud AI is only available to adults.'

  if (profile.goal !== 'maintain') {
    const weekly = profile.weeklyChangeKg ?? 0.5
    if (!Number.isFinite(weekly) || weekly < 0) {
      return 'Enter a weekly change of zero or more.'
    }
  }

  if (
    profile.bodyFatPercentage != null
    && (!Number.isFinite(profile.bodyFatPercentage)
      || profile.bodyFatPercentage < 0
      || profile.bodyFatPercentage > 1)
  ) {
    return 'Enter body fat as a percentage from 0 to 100.'
  }

  for (const [label, value] of [
    ['calorie target', profile.customCalories],
    ['protein target', profile.customProtein],
    ['carbohydrate target', profile.customCarbs],
    ['fat target', profile.customFat],
  ] as const) {
    if (value != null && (!Number.isFinite(value) || value < 0)) {
      return `Enter a valid ${label}.`
    }
  }

  if (
    profile.goalWeightKg != null
    && (!Number.isFinite(profile.goalWeightKg) || profile.goalWeightKg <= 0)
  ) {
    return 'Enter a valid goal weight greater than zero.'
  }

  return goalWeightIssue(profile)
}

export function calorieAdjustment(profile: UserProfile): number {
  if (profile.goal === 'maintain') return 0
  const delta = Math.round(effectiveWeeklyChangeKg(profile) * 7000 / 7)
  return profile.goal === 'lose' ? -delta : delta
}

function explainClamp(
  reasons: ClampReason[],
  profile: UserProfile,
  floor: number,
  bmr: number,
): string | null {
  const messages = reasons.map(reason => {
    switch (reason) {
      case 'rate':
        return `Your rate is held to ${maxWeeklyChangeKg(profile)} kg per week, which does not exceed 1% of your bodyweight.`
      case 'deficit':
        return 'Your calorie target is held to a 25% deficit, the fastest pace this app will plan for.'
      case 'floor':
        return `Your target is held at ${floor} kcal, the lowest daily intake this app will set.`
      case 'bmr':
        return `Your target is held at ${bmr} kcal, at or above what your body uses at rest. This app will not plan below that.`
    }
  })
  return messages.length ? messages.join(' ') : null
}

/**
 * The daily calorie target with every §2.1 floor applied, plus the reason when
 * one of them moved the number. Returns a reason rather than a bare number so
 * the UI can explain itself — silently clamping is what §2.1 forbids.
 *
 * A custom target entered by hand is treated as the requested value and passes
 * through the same floors.
 */
export function computeTargets(profile: UserProfile): CalorieTarget {
  const rawBmr = computeBMR(profile)
  const rawTdee = computeTDEE(profile)
  const bmr = Math.ceil(rawBmr)
  const floor = calorieFloor(profile)
  const reasons: ClampReason[] = []

  if ((profile.weeklyChangeKg ?? 0.5) > maxWeeklyChangeKg(profile)) {
    reasons.push('rate')
  }

  let calories: number

  if (profile.customCalories != null) {
    const minimumFromDeficitCap = Math.ceil(rawTdee * (1 - MAX_DEFICIT_FRACTION))
    calories = profile.customCalories
    if (calories < minimumFromDeficitCap) {
      calories = minimumFromDeficitCap
      reasons.push('deficit')
    }
  } else {
    const requested = calorieAdjustment(profile)
    const maxDeficit = Math.floor(rawTdee * MAX_DEFICIT_FRACTION)

    // Surpluses are not capped here; only deficits carry a floor.
    const adjustment = requested < 0 && Math.abs(requested) > maxDeficit
      ? -maxDeficit
      : requested

    if (adjustment !== requested) reasons.push('deficit')
    calories = rawTdee + adjustment
  }

  if (calories < floor) {
    calories = floor
    reasons.push('floor')
  }
  if (calories < bmr) {
    calories = bmr
    reasons.push('bmr')
  }

  return {
    calories: Math.ceil(calories),
    clamped: explainClamp(reasons, profile, floor, bmr),
    reasons,
  }
}

export function dailyCalories(profile: UserProfile): number {
  return computeTargets({ ...profile, customCalories: undefined }).calories
}

function proteinBasisWeightKg(profile: UserProfile): number {
  if (profile.bodyFatPercentage == null) return profile.weightKg
  const lean = Math.max(0.05, Math.min(1.0, 1 - profile.bodyFatPercentage))
  return profile.weightKg * lean
}

function proteinMultiplier(profile: UserProfile): number {
  const base = PROTEIN_PER_KG[profile.activityLevel]
  const cuttingBoost = profile.goal === 'lose' ? 0.2 : 0
  const bodyweightEquivalent = base + cuttingBoost
  if (profile.bodyFatPercentage == null) return bodyweightEquivalent
  const lean = Math.max(0.05, Math.min(1.0, 1 - profile.bodyFatPercentage))
  return bodyweightEquivalent / lean
}

export function proteinGoal(profile: UserProfile): number {
  return Math.round(proteinMultiplier(profile) * proteinBasisWeightKg(profile))
}

export function fatGoal(profile: UserProfile): number {
  return Math.round(0.6 * profile.weightKg)
}

export function carbsGoal(profile: UserProfile): number {
  const cals = dailyCalories(profile)
  const p = proteinGoal(profile)
  const f = fatGoal(profile)
  return Math.max(0, Math.floor((cals - p * 4 - f * 9) / 4))
}

/** The target actually shown and budgeted against, custom or computed. */
export function effectiveCalories(profile: UserProfile): number {
  return computeTargets(profile).calories
}

export function effectiveProtein(profile: UserProfile): number {
  return profile.customProtein ?? proteinGoal(profile)
}

export function effectiveFat(profile: UserProfile): number {
  return profile.customFat ?? fatGoal(profile)
}

export function effectiveCarbs(profile: UserProfile): number {
  return profile.customCarbs ?? carbsGoal(profile)
}

export function defaultProfile(): UserProfile {
  const birthday = new Date()
  birthday.setFullYear(birthday.getFullYear() - 25)
  return {
    gender: 'male',
    birthday: birthday.toISOString(),
    heightCm: 175,
    weightKg: 70,
    activityLevel: 'moderate',
    goal: 'maintain',
    weeklyChangeKg: 0.5,
    soundEnabled: true,
    hapticsEnabled: true,
    mascotMuted: false,
    mascotReducedMotion: false,
    mascotRoasts: false,
    trackingPaused: false,
    loggingCommitment: 'light',
  }
}

export function goalLabel(goal: WeightGoal): string {
  switch (goal) {
    case 'lose': return 'Cutting'
    case 'gain': return 'Bulking'
    case 'maintain': return 'Recomp'
  }
}
