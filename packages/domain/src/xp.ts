/** Web product level thresholds. Mobile uses a different quadratic curve. */
export const WEB_LEVEL_XP = [0, 100, 250, 500, 850, 1300, 1900, 2700, 3700, 5000] as const

export const WEB_MEAL_XP = {
  meal: 15,
  firstMeal: 10,
  threeMeals: 20,
  fourMeals: 10,
  newFood: 20,
} as const

export interface XpAward {
  key: string
  label: string
  xp: number
}

export function levelFromXp(xp: number, thresholds: readonly number[] = WEB_LEVEL_XP): number {
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]!) return i + 1
  }
  return 1
}

export function xpForLevel(level: number, thresholds: readonly number[] = WEB_LEVEL_XP): number {
  return thresholds[Math.min(level - 1, thresholds.length - 1)] ?? 0
}

export function xpForNextLevel(level: number, thresholds: readonly number[] = WEB_LEVEL_XP): number {
  return thresholds[Math.min(level, thresholds.length - 1)] ?? thresholds[thresholds.length - 1]!
}

/**
 * Eligibility only. Amounts are the web product constants. Mobile keeps its
 * own ledger amounts as an explicit exception.
 */
export function eligibleMealXpAwards(input: {
  entryId: string
  entryName: string
  dayKey: string
  existingSameDayCount: number
  recentFoodNames: readonly string[]
  usedKeys: ReadonlySet<string>
}): XpAward[] {
  const awards: XpAward[] = [
    { key: `meal-${input.entryId}`, label: 'Logged a meal', xp: WEB_MEAL_XP.meal },
  ]

  if (input.existingSameDayCount === 0 && !input.usedKeys.has(`first-meal-${input.dayKey}`)) {
    awards.push({
      key: `first-meal-${input.dayKey}`,
      label: 'First meal of the day!',
      xp: WEB_MEAL_XP.firstMeal,
    })
  }
  if (input.existingSameDayCount === 2 && !input.usedKeys.has(`three-meals-${input.dayKey}`)) {
    awards.push({
      key: `three-meals-${input.dayKey}`,
      label: 'Three meals tracked!',
      xp: WEB_MEAL_XP.threeMeals,
    })
  }
  if (input.existingSameDayCount === 3 && !input.usedKeys.has(`four-meals-${input.dayKey}`)) {
    awards.push({
      key: `four-meals-${input.dayKey}`,
      label: 'Full day logged!',
      xp: WEB_MEAL_XP.fourMeals,
    })
  }

  const name = input.entryName.toLowerCase().trim()
  if (!input.recentFoodNames.some(existing => existing.toLowerCase().trim() === name)) {
    awards.push({
      key: `new-food-${input.entryId}`,
      label: 'New food discovered!',
      xp: WEB_MEAL_XP.newFood,
    })
  }

  return awards.filter(award => !input.usedKeys.has(award.key))
}
