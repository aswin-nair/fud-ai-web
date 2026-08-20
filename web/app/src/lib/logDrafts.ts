import type { FoodAnalysis, FoodSource, MealType } from '../types'

const VERSION = 1 as const
const KEY_PREFIX = 'fud-log-drafts-v1-'
const RECOVERY_PREFIX = 'fud-log-drafts-recovery-v1-'

const MEAL_TYPES = new Set<MealType>(['breakfast', 'lunch', 'dinner', 'snack', 'other'])
const FOOD_SOURCES = new Set<FoodSource>(['textInput', 'manual', 'snapFood', 'quickAdd', 'recent'])

export const REVIEW_NUMERIC_FIELDS = ['calories', 'protein', 'carbs', 'fat'] as const
export type ReviewNumericField = typeof REVIEW_NUMERIC_FIELDS[number]

export interface ManualLogDraft {
  name: string
  calories: string
  protein: string
  carbs: string
  fat: string
  mealType: MealType
  servings: number
  updatedAt: string
}

export interface ReviewLogDraft {
  analysis: FoodAnalysis
  baseAnalysis: FoodAnalysis
  mealType: MealType
  servings: number
  source: FoodSource
  emptyNumericFields: ReviewNumericField[]
  updatedAt: string
}

export interface LogDraftEnvelope {
  version: typeof VERSION
  text?: { text: string; updatedAt: string }
  manual?: ManualLogDraft
  review?: ReviewLogDraft
}

function storageKey(userId: string): string {
  return `${KEY_PREFIX}${encodeURIComponent(userId)}`
}

function recoveryKey(userId: string): string {
  return `${RECOVERY_PREFIX}${encodeURIComponent(userId)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isFiniteNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function isText(value: unknown, max: number, allowEmpty = true): value is string {
  return typeof value === 'string' && value.length <= max && (allowEmpty || value.trim().length > 0)
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 100 && Number.isFinite(Date.parse(value))
}

function hasOnly(value: Record<string, unknown>, fields: readonly string[]): boolean {
  const allowed = new Set(fields)
  return Object.keys(value).every(key => allowed.has(key))
}

function isIngredient(value: unknown): boolean {
  return isRecord(value)
    && hasOnly(value, ['item', 'grams', 'calories', 'protein', 'carbs', 'fat'])
    && isText(value.item, 500, false)
    && isFiniteNumber(value.grams, 0, 100_000)
    && isFiniteNumber(value.calories, 0, 100_000)
    && isFiniteNumber(value.protein, 0, 10_000)
    && isFiniteNumber(value.carbs, 0, 10_000)
    && isFiniteNumber(value.fat, 0, 10_000)
}

export function isSafeFoodAnalysis(value: unknown): value is FoodAnalysis {
  if (!isRecord(value)) return false
  if (!hasOnly(value, ['name', 'calories', 'protein', 'carbs', 'fat', 'servingSizeGrams', 'emoji', 'ingredients'])) {
    return false
  }
  return isText(value.name, 500, false)
    && isFiniteNumber(value.calories, 0, 100_000)
    && isFiniteNumber(value.protein, 0, 10_000)
    && isFiniteNumber(value.carbs, 0, 10_000)
    && isFiniteNumber(value.fat, 0, 10_000)
    && isFiniteNumber(value.servingSizeGrams, 0, 100_000)
    && (value.emoji === undefined || isText(value.emoji, 32))
    && (value.ingredients === undefined
      || (Array.isArray(value.ingredients) && value.ingredients.length <= 200 && value.ingredients.every(isIngredient)))
}

function isTextDraft(value: unknown): value is NonNullable<LogDraftEnvelope['text']> {
  return isRecord(value)
    && hasOnly(value, ['text', 'updatedAt'])
    && isText(value.text, 5_000)
    && isTimestamp(value.updatedAt)
}

function isManualDraft(value: unknown): value is ManualLogDraft {
  return isRecord(value)
    && hasOnly(value, ['name', 'calories', 'protein', 'carbs', 'fat', 'mealType', 'servings', 'updatedAt'])
    && isText(value.name, 500)
    && isText(value.calories, 40)
    && isText(value.protein, 40)
    && isText(value.carbs, 40)
    && isText(value.fat, 40)
    && typeof value.mealType === 'string'
    && MEAL_TYPES.has(value.mealType as MealType)
    && isFiniteNumber(value.servings, 0.25, 1_000)
    && isTimestamp(value.updatedAt)
}

function isReviewDraft(value: unknown): value is ReviewLogDraft {
  return isRecord(value)
    && hasOnly(value, [
      'analysis', 'baseAnalysis', 'mealType', 'servings', 'source', 'emptyNumericFields', 'updatedAt',
    ])
    && isSafeFoodAnalysis(value.analysis)
    && isSafeFoodAnalysis(value.baseAnalysis)
    && typeof value.mealType === 'string'
    && MEAL_TYPES.has(value.mealType as MealType)
    && isFiniteNumber(value.servings, 0.25, 1_000)
    && typeof value.source === 'string'
    && FOOD_SOURCES.has(value.source as FoodSource)
    && Array.isArray(value.emptyNumericFields)
    && value.emptyNumericFields.length <= REVIEW_NUMERIC_FIELDS.length
    && value.emptyNumericFields.every(field => REVIEW_NUMERIC_FIELDS.includes(field as ReviewNumericField))
    && new Set(value.emptyNumericFields).size === value.emptyNumericFields.length
    && isTimestamp(value.updatedAt)
}

function isEnvelope(value: unknown): value is LogDraftEnvelope {
  return isRecord(value)
    && hasOnly(value, ['version', 'text', 'manual', 'review'])
    && value.version === VERSION
    && (value.text === undefined || isTextDraft(value.text))
    && (value.manual === undefined || isManualDraft(value.manual))
    && (value.review === undefined || isReviewDraft(value.review))
}

function emptyEnvelope(): LogDraftEnvelope {
  return { version: VERSION }
}

export function loadLogDrafts(userId: string): LogDraftEnvelope {
  if (!userId) return emptyEnvelope()
  const key = storageKey(userId)
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return emptyEnvelope()
    const parsed: unknown = JSON.parse(raw)
    if (isEnvelope(parsed)) return parsed
    localStorage.setItem(recoveryKey(userId), raw)
    localStorage.removeItem(key)
  } catch {
    try {
      const raw = localStorage.getItem(key)
      if (raw) localStorage.setItem(recoveryKey(userId), raw)
      localStorage.removeItem(key)
    } catch {
      // Storage may be unavailable; the in-memory form remains usable.
    }
  }
  return emptyEnvelope()
}

function write(userId: string, next: LogDraftEnvelope): boolean {
  if (!userId) return false
  try {
    if (!next.text && !next.manual && !next.review) localStorage.removeItem(storageKey(userId))
    else localStorage.setItem(storageKey(userId), JSON.stringify(next))
    return true
  } catch {
    return false
  }
}

export function saveTextLogDraft(userId: string, text: string): boolean {
  const current = loadLogDrafts(userId)
  const next = { ...current }
  if (text.length === 0) delete next.text
  else next.text = { text: text.slice(0, 5_000), updatedAt: new Date().toISOString() }
  return write(userId, next)
}

export function saveManualLogDraft(userId: string, draft: Omit<ManualLogDraft, 'updatedAt'>): boolean {
  const current = loadLogDrafts(userId)
  return write(userId, { ...current, manual: { ...draft, updatedAt: new Date().toISOString() } })
}

export function saveReviewLogDraft(userId: string, draft: Omit<ReviewLogDraft, 'updatedAt'>): boolean {
  const current = loadLogDrafts(userId)
  return write(userId, { ...current, review: { ...draft, updatedAt: new Date().toISOString() } })
}

export function clearLogDraft(userId: string, section?: 'text' | 'manual' | 'review'): void {
  if (!userId) return
  if (!section) {
    try {
      localStorage.removeItem(storageKey(userId))
      localStorage.removeItem(recoveryKey(userId))
    } catch {
      // Best effort for browsers with unavailable storage.
    }
    return
  }
  const current = loadLogDrafts(userId)
  delete current[section]
  write(userId, current)
}

export function logDraftStorageKeys(userId: string): string[] {
  return [storageKey(userId), recoveryKey(userId)]
}
