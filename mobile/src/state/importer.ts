import { db } from '@/db/client'
import { mealEntries, profile } from '@/db/schema'
import { stampLocalDate } from '@fud-ai/product'
import { defaultGamification, defaultProfile, freshState } from './defaults'
import type { AppState, FoodEntry, MealType } from './types'

const SLOTS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'other']

function mealType(slot: string): MealType {
  return SLOTS.includes(slot as MealType) ? slot as MealType : 'other'
}

/**
 * One-way lift of the alpha SQLite profile and meal log into AppState.
 * Points and quests stay behind — they are not live XP.
 */
export async function importLegacySqlite(): Promise<AppState | null> {
  const row = await db.select().from(profile).limit(1).then(rows => rows[0] ?? null)
  const meals = await db.select().from(mealEntries)
  if (!row && meals.length === 0) return null

  const state = freshState()
  if (row) {
    state.profile = {
      ...defaultProfile(),
      name: row.name,
      birthday: row.dateOfBirth,
      gender: row.sex === 'female' ? 'female' : 'male',
      heightCm: row.heightCm,
      weightKg: row.weightKg,
      activityLevel: row.activityLevel,
      goal: row.goal,
      weeklyChangeKg: row.weeklyRatePct,
      soundEnabled: row.soundEnabled,
      hapticsEnabled: row.hapticsEnabled,
      trackingPaused: row.trackingPaused,
    }
    state.onboarded = meals.length > 0
  }

  state.foodEntries = meals.map((meal): FoodEntry => ({
    id: `legacy-${meal.id}`,
    name: meal.customName ?? 'Logged meal',
    calories: meal.kcal,
    protein: meal.proteinG,
    carbs: meal.carbsG,
    fat: meal.fatG,
    timestamp: meal.loggedAtUtc,
    source: 'manual',
    mealType: mealType(meal.mealSlot),
    localDate: meal.localDate || stampLocalDate(meal.loggedAtUtc),
  }))
  state.gamification = defaultGamification()
  return state
}

export const LEGACY_IMPORT_NOTICE =
  'Your previous meals and profile moved across. Points and daily quests did not — logging now builds XP instead.'
