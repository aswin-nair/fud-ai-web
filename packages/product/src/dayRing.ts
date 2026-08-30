export type LoggingCommitment = 'light' | 'regular' | 'detailed'
export type DayRingMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'
export type DayRingSource = 'textInput' | 'manual' | 'snapFood' | 'quickAdd' | 'recent'

export interface DayRingArc {
  id: 'logged' | 'meals' | 'detail'
  label: string
  value: number
  current: number
  total: number
  required: boolean
}

export interface DayRingProgress {
  arcs: [DayRingArc, DayRingArc, DayRingArc]
  complete: boolean
  requiredComplete: number
  requiredTotal: number
}

export type DayRingEntry = {
  mealType: DayRingMealType
  source: DayRingSource
  detailAdded?: boolean
}

const MAIN_MEALS: DayRingMealType[] = ['breakfast', 'lunch', 'dinner']

export function dayRingProgress(
  entries: DayRingEntry[],
  noteCount: number,
  commitment: LoggingCommitment = 'light',
): DayRingProgress {
  const mainMeals = new Set(
    entries
      .map(entry => entry.mealType)
      .filter((meal): meal is DayRingMealType => MAIN_MEALS.includes(meal)),
  )
  const hasDetail = noteCount > 0 || entries.some(entry => entry.source === 'snapFood' || entry.detailAdded)
  const required = {
    logged: true,
    meals: commitment !== 'light',
    detail: commitment === 'detailed',
  }
  const arcs: DayRingProgress['arcs'] = [
    {
      id: 'logged',
      label: 'Log something',
      value: entries.length > 0 ? 1 : 0,
      current: entries.length > 0 ? 1 : 0,
      total: 1,
      required: required.logged,
    },
    {
      id: 'meals',
      label: 'Main meals',
      value: mainMeals.size / MAIN_MEALS.length,
      current: mainMeals.size,
      total: MAIN_MEALS.length,
      required: required.meals,
    },
    {
      id: 'detail',
      label: 'Add a detail',
      value: hasDetail ? 1 : 0,
      current: hasDetail ? 1 : 0,
      total: 1,
      required: required.detail,
    },
  ]
  const requiredArcs = arcs.filter(arc => arc.required)
  const requiredComplete = requiredArcs.filter(arc => arc.value >= 1).length

  return {
    arcs,
    complete: requiredComplete === requiredArcs.length,
    requiredComplete,
    requiredTotal: requiredArcs.length,
  }
}
