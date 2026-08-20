export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export type MealSlot = (typeof MEAL_SLOTS)[number]

/**
 * Pre-selects the slot from a local hour so the common log needs no extra tap.
 * Web may still store `other` as an explicit override; this default never
 * returns it.
 */
export function defaultMealSlot(localHour: number): MealSlot {
  if (localHour < 11) return 'breakfast'
  if (localHour < 16) return 'lunch'
  if (localHour < 21) return 'dinner'
  return 'snack'
}
