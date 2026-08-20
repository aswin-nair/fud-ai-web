import { defaultMealSlot as sharedDefaultMealSlot, MEAL_SLOTS as SHARED_MEAL_SLOTS } from '@fud-ai/domain/meals';
import { type MealSlot } from '@/db/schema';

export const MEAL_SLOTS: readonly MealSlot[] = SHARED_MEAL_SLOTS;

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
  return sharedDefaultMealSlot(localHour);
}
