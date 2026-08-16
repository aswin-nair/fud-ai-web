import { type MealSlot } from '@/db/schema';

export const MEAL_SLOTS: readonly MealSlot[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
] as const;

export const MEAL_SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

/**
 * Pre-selects the slot from the clock so the common case needs no tap. The
 * user can always override; this only has to be right more often than not.
 */
export function defaultMealSlot(localHour: number): MealSlot {
  if (localHour < 11) return 'breakfast';
  if (localHour < 16) return 'lunch';
  if (localHour < 21) return 'dinner';
  return 'snack';
}
