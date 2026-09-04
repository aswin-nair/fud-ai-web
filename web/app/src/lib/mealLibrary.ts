/** Apply the same search and meal-type choice to saved and recent meals. */
export function filterMealLibrary<T extends { name: string; mealType: string }>(
  meals: T[], query: string, mealType: string,
): T[] {
  const needle = query.trim().toLowerCase()
  return meals.filter(meal => (
    (!needle || meal.name.toLowerCase().includes(needle))
    && (mealType === 'all' || meal.mealType === mealType)
  ))
}
