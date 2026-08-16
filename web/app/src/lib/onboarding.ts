import type { MealType, UserProfile } from '../types'

export type BirthdayEligibility = 'missing' | 'invalid' | 'underage' | 'eligible'

export interface FirstMealDraft {
  name: string
  calories: string
  protein: string
  carbs: string
  fat: string
  mealType: MealType
}

export interface OnboardingDraft {
  version: 1
  welcomeIndex: number
  step: number
  blocked: boolean
  birthdayInput: string
  profile: UserProfile
  firstMeal: FirstMealDraft
}

const DRAFT_PREFIX = 'fud-onboarding-draft-'
const LAST_STEP = 6
const LAST_WELCOME_INDEX = 3
const MEAL_TYPES = new Set<MealType>(['breakfast', 'lunch', 'dinner', 'snack', 'other'])

interface DateParts {
  year: number
  month: number
  day: number
}

function parseDateInput(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1900 || month < 1 || month > 12 || day < 1) return null

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (day > daysInMonth) return null
  return { year, month, day }
}

function localDateParts(date: Date): DateParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  }
}

function compareDateParts(a: DateParts, b: DateParts): number {
  if (a.year !== b.year) return a.year - b.year
  if (a.month !== b.month) return a.month - b.month
  return a.day - b.day
}

/**
 * Validates a date-only birthday without routing it through UTC parsing.
 * Someone becomes eligible on their eighteenth birthday, never the day before.
 * A leap-day birthday is handled conservatively in a non-leap year: March 1.
 */
export function birthdayEligibility(value: string, today = new Date()): BirthdayEligibility {
  if (!value) return 'missing'
  const birth = parseDateInput(value)
  if (!birth || Number.isNaN(today.getTime())) return 'invalid'

  const current = localDateParts(today)
  if (compareDateParts(birth, current) > 0) return 'invalid'

  const eighteenthBirthday: DateParts = {
    year: birth.year + 18,
    month: birth.month,
    day: birth.day,
  }
  return compareDateParts(current, eighteenthBirthday) >= 0 ? 'eligible' : 'underage'
}

export function birthdayToIso(value: string): string | null {
  const parts = parseDateInput(value)
  if (!parts) return null
  // Store local noon so profile calculations that read this timestamp back in
  // the user's timezone retain the selected calendar day, including UTC+14.
  return new Date(parts.year, parts.month - 1, parts.day, 12).toISOString()
}

export function localDateInputValue(date = new Date()): string {
  const { year, month, day } = localDateParts(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function createOnboardingDraft(profile: UserProfile): OnboardingDraft {
  return {
    version: 1,
    welcomeIndex: 0,
    step: 0,
    blocked: false,
    birthdayInput: '',
    profile: { ...profile, birthday: '' },
    firstMeal: {
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      mealType: inferMealType(),
    },
  }
}

function inferMealType(date = new Date()): MealType {
  const hour = date.getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 16) return 'lunch'
  if (hour < 21) return 'dinner'
  return 'snack'
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeDraft(raw: unknown, fallback: OnboardingDraft): OnboardingDraft {
  if (!raw || typeof raw !== 'object') return fallback
  const candidate = raw as Partial<OnboardingDraft>
  const rawProfile = candidate.profile && typeof candidate.profile === 'object'
    ? candidate.profile
    : fallback.profile
  const rawMeal = candidate.firstMeal && typeof candidate.firstMeal === 'object'
    ? candidate.firstMeal
    : fallback.firstMeal
  const birthdayInput = stringValue(candidate.birthdayInput)
  const birthday = birthdayToIso(birthdayInput) ?? ''
  const mealType = MEAL_TYPES.has(rawMeal.mealType) ? rawMeal.mealType : fallback.firstMeal.mealType

  return {
    version: 1,
    welcomeIndex: clampInteger(candidate.welcomeIndex, 0, LAST_WELCOME_INDEX, 0),
    step: clampInteger(candidate.step, 0, LAST_STEP, 0),
    blocked: candidate.blocked === true,
    birthdayInput,
    profile: { ...fallback.profile, ...rawProfile, birthday },
    firstMeal: {
      name: stringValue(rawMeal.name),
      calories: stringValue(rawMeal.calories),
      protein: stringValue(rawMeal.protein),
      carbs: stringValue(rawMeal.carbs),
      fat: stringValue(rawMeal.fat),
      mealType,
    },
  }
}

function draftKey(userId: string): string {
  return `${DRAFT_PREFIX}${userId}`
}

export function loadOnboardingDraft(userId: string, profile: UserProfile): OnboardingDraft {
  const fallback = createOnboardingDraft(profile)
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(draftKey(userId))
    return raw ? normalizeDraft(JSON.parse(raw), fallback) : fallback
  } catch {
    return fallback
  }
}

export function saveOnboardingDraft(userId: string, draft: OnboardingDraft): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify(draft))
  } catch {
    // Onboarding remains usable when browser storage is unavailable.
  }
}

export function clearOnboardingDraft(userId: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(draftKey(userId))
  } catch {
    // Nothing else is required if storage is unavailable.
  }
}
