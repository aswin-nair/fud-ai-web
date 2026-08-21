import { MEAL_SLOTS, type MealSlot } from '@fud-ai/domain/meals'
import type { FoodEntry } from '../types'
import { defaultMealType } from './meals'

export type PathStatus = 'done' | 'current' | 'later'

export interface PathNodeState {
  slot: MealSlot
  status: PathStatus
}

/**
 * Four path nodes from today's entries. `other` never becomes a fifth node
 * and never moves the mascot. Current is the time-of-day slot unless that
 * slot is already done, in which case the mascot walks to the next open one.
 */
export function mealPathStates(
  entries: readonly Pick<FoodEntry, 'mealType'>[],
  hour = new Date().getHours(),
): PathNodeState[] {
  const done = new Set(
    entries.filter(entry => MEAL_SLOTS.includes(entry.mealType as MealSlot)).map(entry => entry.mealType),
  )
  const now = defaultMealType(hour)
  const firstOpen = MEAL_SLOTS.find(slot => !done.has(slot))
  const currentSlot = done.has(now) ? firstOpen : now

  return MEAL_SLOTS.map(slot => {
    if (done.has(slot)) return { slot, status: 'done' }
    if (slot === currentSlot) return { slot, status: 'current' }
    return { slot, status: 'later' }
  })
}

export function mascotSlot(nodes: readonly PathNodeState[]): MealSlot {
  return nodes.find(node => node.status === 'current')?.slot
    ?? nodes.filter(node => node.status === 'done').at(-1)?.slot
    ?? MEAL_SLOTS[0]
}
