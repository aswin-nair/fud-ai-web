import type { FoodEntry, GamificationState, MealType } from '../types'
import { localDayKey } from './dates'

/**
 * §10.1: every quest is about logging behaviour. There is no quest for staying
 * under target, running a deficit, or avoiding a food group.
 */
export type QuestType = 'log_n_meals' | 'log_before' | 'log_streak'

export const QUEST_TYPES: readonly QuestType[] = [
  'log_n_meals',
  'log_before',
  'log_streak',
]

export type DailyQuest = NonNullable<GamificationState['quest']>

function seedFor(date: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < date.length; i += 1) {
    hash ^= date.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

const CANDIDATES: readonly { type: QuestType; targets: readonly number[]; hours?: readonly number[] }[] = [
  { type: 'log_n_meals', targets: [2, 3, 4] },
  { type: 'log_before', targets: [1], hours: [10, 11] },
  { type: 'log_streak', targets: [2, 3] },
]

function pick<T>(options: readonly T[], draw: number): T {
  return options[draw % options.length] as T
}

/** Deterministic in the calendar date, so a relaunch cannot reroll the quest. */
export function questForDate(date: string): Omit<DailyQuest, 'progress' | 'completedAt'> {
  const seed = seedFor(date)
  const candidate = CANDIDATES[seed % CANDIDATES.length] as (typeof CANDIDATES)[number]
  const target = pick(candidate.targets, Math.floor(seed / CANDIDATES.length))

  if (!candidate.hours) {
    return { date, type: candidate.type, target }
  }

  return {
    date,
    type: candidate.type,
    target,
    beforeHour: pick(candidate.hours, Math.floor(seed / 7)),
  }
}

export function questTitle(quest: Pick<DailyQuest, 'type' | 'target' | 'beforeHour'>): string {
  switch (quest.type) {
    case 'log_n_meals':
      return `Log ${quest.target} ${quest.target === 1 ? 'meal' : 'meals'} today`
    case 'log_before': {
      const hour = quest.beforeHour ?? 10
      const suffix = hour < 12 ? 'am' : 'pm'
      const display = hour % 12 === 0 ? 12 : hour % 12
      return `Log breakfast before ${display}${suffix}`
    }
    case 'log_streak':
      return `Log something ${quest.target} days running`
  }
}

function distinctSlots(entries: FoodEntry[]): number {
  const slots = new Set<MealType>()
  for (const entry of entries) slots.add(entry.mealType)
  return slots.size
}

export function questProgress(
  quest: Pick<DailyQuest, 'type' | 'target' | 'beforeHour'>,
  input: { entriesToday: FoodEntry[]; streakCount: number },
): number {
  switch (quest.type) {
    case 'log_n_meals':
      return distinctSlots(input.entriesToday)
    case 'log_before': {
      const cutoff = quest.beforeHour ?? 10
      return input.entriesToday.some(e => new Date(e.timestamp).getHours() < cutoff) ? 1 : 0
    }
    case 'log_streak':
      return Math.min(input.streakCount, quest.target)
  }
}

export function syncQuest(
  existing: DailyQuest | undefined,
  today: string,
  entries: FoodEntry[],
  streakCount: number,
  commitCompletion = true,
): DailyQuest {
  const spec = existing?.date === today ? existing : { ...questForDate(today), progress: 0, completedAt: null }
  const todayEntries = entries.filter(e => localDayKey(new Date(e.timestamp)) === today)
  const progress = questProgress(spec, {
    entriesToday: todayEntries,
    streakCount,
  })
  const complete = progress >= spec.target
  return {
    ...spec,
    progress,
    completedAt: spec.completedAt ?? (complete && commitCompletion ? new Date().toISOString() : null),
  }
}
