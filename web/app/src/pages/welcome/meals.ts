/** Sample meals for the welcome page. Illustrative estimates, never a user's data. */
export type MealId = 'toast' | 'bowl' | 'pizza' | 'yogurt'

export interface MealItem {
  label: string
  kcal: number
  /** Where the scan marker sits on the 400 × 400 plate drawing. */
  x: number
  y: number
}

export interface SampleMeal {
  id: MealId
  name: string
  short: string
  protein: number
  carbs: number
  fat: number
  items: readonly MealItem[]
}

export const SAMPLE_MEALS: readonly SampleMeal[] = [
  {
    id: 'toast', name: 'Avocado toast', short: 'Toast', protein: 15, carbs: 34, fat: 20,
    items: [
      { label: 'Sourdough', kcal: 150, x: 128, y: 272 },
      { label: 'Avocado', kcal: 160, x: 198, y: 170 },
      { label: 'Poached egg', kcal: 70, x: 252, y: 256 },
    ],
  },
  {
    id: 'bowl', name: 'Chicken rice bowl', short: 'Bowl', protein: 38, carbs: 72, fat: 16,
    items: [
      { label: 'Rice', kcal: 260, x: 140, y: 238 },
      { label: 'Chicken', kcal: 230, x: 268, y: 160 },
      { label: 'Chili sauce', kcal: 80, x: 176, y: 158 },
      { label: 'Greens', kcal: 40, x: 270, y: 276 },
    ],
  },
  {
    id: 'pizza', name: 'Veggie pizza', short: 'Pizza', protein: 22, carbs: 62, fat: 20,
    items: [
      { label: 'Crust', kcal: 280, x: 323, y: 97 },
      { label: 'Mozzarella', kcal: 160, x: 241, y: 113 },
      { label: 'Tomato sauce', kcal: 40, x: 127, y: 202 },
      { label: 'Peppers', kcal: 40, x: 78, y: 231 },
    ],
  },
  {
    id: 'yogurt', name: 'Yogurt and berries', short: 'Yogurt', protein: 18, carbs: 40, fat: 8,
    items: [
      { label: 'Greek yogurt', kcal: 150, x: 138, y: 118 },
      { label: 'Granola', kcal: 120, x: 178, y: 204 },
      { label: 'Berries', kcal: 50, x: 272, y: 176 },
    ],
  },
]

export function mealKcal(meal: SampleMeal): number {
  return meal.items.reduce((sum, item) => sum + item.kcal, 0)
}
