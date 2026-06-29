import type { FoodEntry, SavedMeal } from '../types'
import { localDayKey } from './dates'

export function mealKey(entry: Pick<FoodEntry, 'name' | 'calories' | 'protein' | 'carbs' | 'fat'>): string {
  return [entry.name.toLowerCase().trim(), entry.calories, entry.protein, entry.carbs, entry.fat].join('|')
}

export function entryToSaved(entry: FoodEntry): SavedMeal {
  return {
    id: crypto.randomUUID(),
    name: entry.name,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    emoji: entry.emoji,
    mealType: entry.mealType,
    servingSizeGrams: entry.servingSizeGrams,
  }
}

export function savedToEntry(saved: SavedMeal, source: FoodEntry['source'] = 'manual'): FoodEntry {
  return {
    id: crypto.randomUUID(),
    name: saved.name,
    calories: saved.calories,
    protein: saved.protein,
    carbs: saved.carbs,
    fat: saved.fat,
    emoji: saved.emoji,
    mealType: saved.mealType,
    servingSizeGrams: saved.servingSizeGrams,
    source,
    timestamp: new Date().toISOString(),
  }
}

export function recentMeals(entries: FoodEntry[], limit = 20): FoodEntry[] {
  const seen = new Set<string>()
  const result: FoodEntry[] = []
  for (const e of [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp))) {
    const key = mealKey(e)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(e)
    if (result.length >= limit) break
  }
  return result
}

export function dailyCalorieSeries(entries: FoodEntry[], days: number): { label: string; calories: number }[] {
  const result: { label: string; calories: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = localDayKey(d)
    const dayEntries = entries.filter(e => localDayKey(e.timestamp) === key)
    const calories = dayEntries.reduce((s, e) => s + e.calories, 0)
    result.push({
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      calories,
    })
  }
  return result
}
