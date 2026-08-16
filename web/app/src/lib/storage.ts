import type { AppState, FoodEntry, GamificationState, ExerciseEntry } from '../types'
import { localDayKey } from './dates'
import { defaultProfile, profileInputIssue } from './profile'
import { defaultAISettings, normalizeAISettings } from './aiConfig'

const LEGACY_KEY = 'fud-ai-web-state'
const PRIVATE_AI_KEY_PREFIX = 'fud-ai-private-ai-key-'

function storageKey(userId: string): string {
  return `fud-ai-web-state-${userId}`
}

function privateAIKey(userId: string): string {
  return `${PRIVATE_AI_KEY_PREFIX}${userId}`
}

/**
 * BYOK credentials are device-local secrets. They are deliberately stored
 * outside AppState so exports and cloud sync cannot include them accidentally.
 */
export function loadPrivateAIKey(userId: string): string {
  return localStorage.getItem(privateAIKey(userId)) ?? ''
}

export function savePrivateAIKey(userId: string, apiKey: string): void {
  if (apiKey.trim()) localStorage.setItem(privateAIKey(userId), apiKey)
  else localStorage.removeItem(privateAIKey(userId))
}

export function clearPrivateAIKey(userId: string): void {
  localStorage.removeItem(privateAIKey(userId))
}

/** A copy suitable for export or transport across the network. */
export function stateWithoutPrivateSecrets(state: AppState): AppState {
  return {
    ...state,
    aiSettings: { ...state.aiSettings, apiKey: '' },
  }
}

export function loadState(userId: string): AppState {
  try {
    const key = storageKey(userId)
    let raw = localStorage.getItem(key)

    // Migrate anonymous data from before Google auth was added.
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        localStorage.setItem(key, legacy)
        localStorage.removeItem(LEGACY_KEY)
        raw = legacy
      }
    }

    if (!raw) return freshState()
    const parsed = JSON.parse(raw) as AppState
    const normalized = normalizeState(parsed)

    // One-time migration from older state blobs that embedded the key.
    const localKey = loadPrivateAIKey(userId)
    const legacyKey = normalized.aiSettings.apiKey
    if (!localKey && legacyKey) savePrivateAIKey(userId, legacyKey)

    return {
      ...normalized,
      aiSettings: { ...normalized.aiSettings, apiKey: localKey || legacyKey },
    }
  } catch {
    return freshState()
  }
}

export function saveState(userId: string, state: AppState): void {
  savePrivateAIKey(userId, state.aiSettings.apiKey)
  localStorage.setItem(storageKey(userId), JSON.stringify(stateWithoutPrivateSecrets(state)))
}

export function clearUserState(userId: string): void {
  localStorage.removeItem(storageKey(userId))
  clearPrivateAIKey(userId)
}

function normalizeState(parsed: AppState): AppState {
  return {
    onboarded: parsed.onboarded ?? false,
    profile: { ...defaultProfile(), ...parsed.profile },
    foodEntries: parsed.foodEntries ?? [],
    weightEntries: parsed.weightEntries ?? [],
    exerciseEntries: normalizeExerciseEntries(parsed.exerciseEntries),
    favoriteMeals: parsed.favoriteMeals ?? [],
    chatMessages: parsed.chatMessages ?? [],
    aiSettings: normalizeAISettings(parsed.aiSettings),
    gamification: normalizeGamification(parsed.gamification),
  }
}

function normalizeExerciseEntries(raw: unknown): ExerciseEntry[] {
  if (!Array.isArray(raw)) return []
  return raw as ExerciseEntry[]
}

function normalizeGamification(g: GamificationState | undefined): GamificationState {
  const base = defaultGamification()
  if (!g) {
    // Migrate old seen-badge IDs from localStorage
    try {
      const old = localStorage.getItem('fud-seen-badges')
      if (old) base.seenBadgeIds = JSON.parse(old) as string[]
    } catch { /* ignore */ }
    return base
  }
  return {
    xp: g.xp ?? 0,
    level: g.level ?? 1,
    streakFreezes: g.streakFreezes ?? 1,
    freezeUsedDates: g.freezeUsedDates ?? [],
    freezeEarnedMonth: g.freezeEarnedMonth ?? '',
    xpEvents: g.xpEvents ?? [],
    awardedKeys: [...new Set([
      ...(g.awardedKeys ?? []),
      ...(g.xpEvents ?? []).map(event => event.key),
    ])],
    pendingLevelUp: g.pendingLevelUp ?? null,
    seenBadgeIds: g.seenBadgeIds ?? base.seenBadgeIds,
    // Nutrition-outcome quests were removed from the healthy-engagement
    // policy. A legacy same-day quest is regenerated on the next session.
    quest: (g.quest as { type?: string } | undefined)?.type === 'hit_protein'
      ? undefined
      : g.quest,
  }
}

export function defaultGamification(): GamificationState {
  return {
    xp: 0,
    level: 1,
    streakFreezes: 1,
    freezeUsedDates: [],
    freezeEarnedMonth: new Date().toISOString().slice(0, 7),
    xpEvents: [],
    awardedKeys: [],
    pendingLevelUp: null,
    seenBadgeIds: [],
  }
}

export function freshState(): AppState {
  return {
    onboarded: false,
    profile: defaultProfile(),
    foodEntries: [],
    weightEntries: [],
    exerciseEntries: [],
    favoriteMeals: [],
    chatMessages: [],
    aiSettings: defaultAISettings(),
    gamification: defaultGamification(),
  }
}

export function exportData(state: AppState): string {
  return JSON.stringify(stateWithoutPrivateSecrets(state), null, 2)
}

export function importData(json: string, localApiKey = ''): AppState {
  const parsed = JSON.parse(json) as AppState
  const normalized = normalizeState(parsed)
  const profileIssue = profileInputIssue(normalized.profile)
  if (profileIssue) throw new Error(profileIssue)
  return {
    ...normalized,
    aiSettings: { ...normalized.aiSettings, apiKey: localApiKey },
  }
}

export function dayKey(date: Date): string {
  return localDayKey(date)
}

export function entriesForDay(entries: FoodEntry[], date: Date): FoodEntry[] {
  const key = dayKey(date)
  return entries
    .filter(e => localDayKey(e.timestamp) === key)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export function macroTotals(entries: FoodEntry[]) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}
