import {
  CONTRACT_VERSION,
  validateEntityMutation,
  type EntityMutation,
} from '@fud-ai/contracts'

import type { MealEntry, MealSlot } from '@/db/schema'

const MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack'])

export function mealEntityId(entryId: number): string {
  return `meal-${entryId}`
}

export function mealEntryToMutation(input: {
  entry: Pick<MealEntry, 'id' | 'customName' | 'kcal' | 'proteinG' | 'carbsG' | 'fatG' | 'mealSlot' | 'loggedAtUtc' | 'localDate'>
  foodName?: string | null
  userId: string
  deviceId: string
  timeZone: string
  mutationId: string
  baseCursor: number
}): EntityMutation | null {
  if (!MEAL_TYPES.has(input.entry.mealSlot)) return null
  const name = input.entry.customName?.trim() || input.foodName?.trim()
  if (!name) return null
  const mutation: EntityMutation = {
    contractVersion: 1,
    mutationId: input.mutationId,
    deviceId: input.deviceId,
    baseCursor: input.baseCursor,
    kind: 'upsert',
    entity: {
      contractVersion: CONTRACT_VERSION,
      entityType: 'food_entry',
      entityId: mealEntityId(input.entry.id),
      deviceId: input.deviceId,
      localDate: input.entry.localDate,
      timeZone: input.timeZone,
      createdAt: input.entry.loggedAtUtc,
      updatedAt: input.entry.loggedAtUtc,
      deletedAt: null,
      recordVersion: 1,
      payload: {
        name,
        calories: input.entry.kcal,
        protein: input.entry.proteinG,
        carbs: input.entry.carbsG,
        fat: input.entry.fatG,
        source: 'manual',
        mealType: input.entry.mealSlot as MealSlot,
      },
    },
  }
  return validateEntityMutation(mutation).ok ? mutation : null
}
