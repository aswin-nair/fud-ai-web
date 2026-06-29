import type { ActivityLevel, UserProfile, WeightGoal } from '../types'

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

function ageFromBirthday(birthday: string): number {
  const birth = new Date(birthday)
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
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age - 161
  return profile.gender === 'male' ? base + 166 : base
}

export function computeTDEE(profile: UserProfile): number {
  return computeBMR(profile) * ACTIVITY_MULTIPLIERS[profile.activityLevel]
}

export function calorieAdjustment(profile: UserProfile): number {
  if (profile.goal === 'maintain') return 0
  const rate = profile.weeklyChangeKg ?? 0.5
  const delta = Math.round(rate * 7000 / 7)
  return profile.goal === 'lose' ? -delta : delta
}

export function dailyCalories(profile: UserProfile): number {
  return Math.round(computeTDEE(profile)) + calorieAdjustment(profile)
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

export function effectiveCalories(profile: UserProfile): number {
  return profile.customCalories ?? dailyCalories(profile)
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
  }
}

export function goalLabel(goal: WeightGoal): string {
  switch (goal) {
    case 'lose': return 'Cutting'
    case 'gain': return 'Bulking'
    case 'maintain': return 'Recomp'
  }
}
