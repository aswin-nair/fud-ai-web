import { ageOn } from '@/logic/nutrition'

export const ONBOARDING_DRAFT_SCHEMA_VERSION = 1 as const
export const MINIMUM_ONBOARDING_AGE = 18

export const ONBOARDING_STEPS = [
  'welcome',
  'profile',
  'activity',
  'goal',
  'review',
  'first-meal',
] as const

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

export type OnboardingDraftFields = {
  name: string
  dateOfBirth: string | null
  sex: 'female' | 'male' | null
  heightCm: number | null
  weightKg: number | null
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive' | null
  goal: 'lose' | 'maintain' | 'gain' | null
  weeklyRatePct: number
  goalWeightKg: number | null
}

export type PersistedOnboardingDraft = OnboardingDraftFields & {
  schemaVersion: typeof ONBOARDING_DRAFT_SCHEMA_VERSION
  step: OnboardingStep
  updatedAt: string
}

export type DraftRestore =
  | { status: 'empty' }
  | { status: 'ok'; draft: PersistedOnboardingDraft }
  | { status: 'quarantine'; reason: string; raw: string }

const SEX = new Set(['female', 'male'] as const)
const ACTIVITY = new Set(['sedentary', 'light', 'moderate', 'active', 'veryActive'] as const)
const GOAL = new Set(['lose', 'maintain', 'gain'] as const)
const STEPS = new Set<string>(ONBOARDING_STEPS)

export function pickDraftFields(value: OnboardingDraftFields): OnboardingDraftFields {
  return {
    name: value.name,
    dateOfBirth: value.dateOfBirth,
    sex: value.sex,
    heightCm: value.heightCm,
    weightKg: value.weightKg,
    activityLevel: value.activityLevel,
    goal: value.goal,
    weeklyRatePct: value.weeklyRatePct,
    goalWeightKg: value.goalWeightKg,
  }
}

export function emptyOnboardingFields(): OnboardingDraftFields {
  return {
    name: '',
    dateOfBirth: null,
    sex: null,
    heightCm: null,
    weightKg: null,
    activityLevel: null,
    goal: null,
    weeklyRatePct: 0.5,
    goalWeightKg: null,
  }
}

export function inferOnboardingStep(
  fields: OnboardingDraftFields,
  profilePresent = false,
  firstLogRecorded = false,
): OnboardingStep {
  if (profilePresent && !firstLogRecorded) return 'first-meal'
  if (profilePresent) return 'welcome'
  if (!fields.dateOfBirth || !fields.sex || !fields.heightCm || !fields.weightKg || !fields.name.trim()) {
    return 'profile'
  }
  if (!fields.activityLevel) return 'activity'
  if (!fields.goal) return 'goal'
  return 'review'
}

export function resumeHref(input: {
  profilePresent: boolean
  firstLogRecorded: boolean
  draft: PersistedOnboardingDraft | null
}): '/(tabs)' | '/log?firstMeal=1' | '/(onboarding)' | '/(onboarding)/profile' | '/(onboarding)/activity' | '/(onboarding)/goal' | '/(onboarding)/review' {
  if (input.profilePresent && !input.firstLogRecorded) return '/log?firstMeal=1'
  if (input.profilePresent) return '/(tabs)'
  if (!input.draft) return '/(onboarding)'

  switch (input.draft.step) {
    case 'activity':
      return '/(onboarding)/activity'
    case 'goal':
      return '/(onboarding)/goal'
    case 'review':
    case 'first-meal':
      return '/(onboarding)/review'
    case 'profile':
      return '/(onboarding)/profile'
    default:
      return '/(onboarding)'
  }
}

export function buildPersistedDraft(
  fields: OnboardingDraftFields,
  options: { profilePresent?: boolean; firstLogRecorded?: boolean; updatedAt?: string } = {},
): PersistedOnboardingDraft {
  return {
    schemaVersion: ONBOARDING_DRAFT_SCHEMA_VERSION,
    step: inferOnboardingStep(fields, options.profilePresent, options.firstLogRecorded),
    updatedAt: options.updatedAt ?? new Date().toISOString(),
    ...fields,
  }
}

export function restoreOnboardingDraft(raw: unknown): DraftRestore {
  if (raw == null || raw === '') return { status: 'empty' }

  const text = typeof raw === 'string' ? raw : JSON.stringify(raw)
  let parsed: unknown

  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return { status: 'quarantine', reason: 'unreadable', raw: text }
  }

  if (!isRecord(parsed)) {
    return { status: 'quarantine', reason: 'not-an-object', raw: text }
  }

  if (parsed.schemaVersion !== ONBOARDING_DRAFT_SCHEMA_VERSION) {
    return { status: 'quarantine', reason: 'incompatible-schema', raw: text }
  }

  const fields = validateFields(parsed)
  if (!fields.ok) {
    return { status: 'quarantine', reason: fields.reason, raw: text }
  }

  const step = typeof parsed.step === 'string' && STEPS.has(parsed.step)
    ? (parsed.step as OnboardingStep)
    : inferOnboardingStep(fields.value)

  return {
    status: 'ok',
    draft: {
      schemaVersion: ONBOARDING_DRAFT_SCHEMA_VERSION,
      step,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      ...fields.value,
    },
  }
}

function validateFields(raw: Record<string, unknown>):
  | { ok: true; value: OnboardingDraftFields }
  | { ok: false; reason: string } {
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 80) : ''
  const dateOfBirth = optionalDate(raw.dateOfBirth)
  if (raw.dateOfBirth != null && dateOfBirth === null) {
    return { ok: false, reason: 'invalid-date-of-birth' }
  }

  if (dateOfBirth) {
    const age = ageOn(dateOfBirth)
    if (age < MINIMUM_ONBOARDING_AGE || age > 130) {
      return { ok: false, reason: 'ineligible-age' }
    }
  }

  const sex = optionalEnum(raw.sex, SEX)
  const activityLevel = optionalEnum(raw.activityLevel, ACTIVITY)
  const goal = optionalEnum(raw.goal, GOAL)
  if (raw.sex != null && sex === null) return { ok: false, reason: 'invalid-sex' }
  if (raw.activityLevel != null && activityLevel === null) {
    return { ok: false, reason: 'invalid-activity' }
  }
  if (raw.goal != null && goal === null) return { ok: false, reason: 'invalid-goal' }

  const heightCm = optionalPositiveNumber(raw.heightCm)
  const weightKg = optionalPositiveNumber(raw.weightKg)
  const goalWeightKg = optionalPositiveNumber(raw.goalWeightKg)
  if (raw.heightCm != null && heightCm === null) return { ok: false, reason: 'invalid-height' }
  if (raw.weightKg != null && weightKg === null) return { ok: false, reason: 'invalid-weight' }
  if (raw.goalWeightKg != null && goalWeightKg === null) {
    return { ok: false, reason: 'invalid-goal-weight' }
  }

  const weeklyRatePct = typeof raw.weeklyRatePct === 'number' && Number.isFinite(raw.weeklyRatePct)
    ? raw.weeklyRatePct
    : 0.5

  return {
    ok: true,
    value: {
      name,
      dateOfBirth,
      sex,
      heightCm,
      weightKg,
      activityLevel,
      goal,
      weeklyRatePct,
      goalWeightKg,
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalDate(value: unknown): string | null {
  if (value == null) return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return value
}

function optionalEnum<T extends string>(value: unknown, allowed: Set<T>): T | null {
  if (value == null) return null
  return typeof value === 'string' && allowed.has(value as T) ? (value as T) : null
}

function optionalPositiveNumber(value: unknown): number | null {
  if (value == null) return null
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}
