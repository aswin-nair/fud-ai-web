import type { AppState, FoodEntry } from '../types'
import { defaultProfile } from './profile'
import { defaultAISettings, normalizeAISettings } from './aiConfig'

const LEGACY_KEY = 'fud-ai-web-state'

function storageKey(userId: string): string {
  return `fud-ai-web-state-${userId}`
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
    return normalizeState(parsed)
  } catch {
    return freshState()
  }
}

export function saveState(userId: string, state: AppState): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(state))
}

export function clearUserState(userId: string): void {
  localStorage.removeItem(storageKey(userId))
}

function normalizeState(parsed: AppState): AppState {
  return {
    onboarded: parsed.onboarded ?? false,
    profile: { ...defaultProfile(), ...parsed.profile },
    foodEntries: parsed.foodEntries ?? [],
    weightEntries: parsed.weightEntries ?? [],
    favoriteMeals: parsed.favoriteMeals ?? [],
    chatMessages: parsed.chatMessages ?? [],
    aiSettings: normalizeAISettings(parsed.aiSettings),
  }
}

export function freshState(): AppState {
  return {
    onboarded: false,
    profile: defaultProfile(),
    foodEntries: [],
    weightEntries: [],
    favoriteMeals: [],
    chatMessages: [],
    aiSettings: defaultAISettings(),
  }
}

export function exportData(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

export function importData(json: string): AppState {
  const parsed = JSON.parse(json) as AppState
  return normalizeState(parsed)
}

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function entriesForDay(entries: FoodEntry[], date: Date): FoodEntry[] {
  const key = dayKey(date)
  return entries
    .filter(e => e.timestamp.slice(0, 10) === key)
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
