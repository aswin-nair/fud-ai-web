import {
  QUEST_TYPES,
  WEB_QUEST_CANDIDATES,
  questForDate as sharedQuestForDate,
  questProgress as sharedQuestProgress,
  questTitle as sharedQuestTitle,
  seedFor,
  type QuestType,
} from '@fud-ai/domain/quests'
import type { FoodEntry, GamificationState } from '../types'
import { localDayKey } from './dates'

export { QUEST_TYPES, seedFor, type QuestType }

export type DailyQuest = NonNullable<GamificationState['quest']>

/** Deterministic in the calendar date, so a relaunch cannot reroll the quest. */
export function questForDate(date: string): Omit<DailyQuest, 'progress' | 'completedAt'> {
  const spec = sharedQuestForDate(date, WEB_QUEST_CANDIDATES)
  return {
    date,
    type: spec.type,
    target: spec.target,
    ...(spec.beforeHour == null ? {} : { beforeHour: spec.beforeHour }),
  }
}

export function questTitle(quest: Pick<DailyQuest, 'type' | 'target' | 'beforeHour'>): string {
  return sharedQuestTitle(quest)
}

export function questProgress(
  quest: Pick<DailyQuest, 'type' | 'target' | 'beforeHour'>,
  input: { entriesToday: FoodEntry[]; streakCount: number },
): number {
  return sharedQuestProgress(quest, {
    entriesToday: input.entriesToday.map(entry => ({
      mealSlot: entry.mealType,
      localHour: new Date(entry.timestamp).getHours(),
    })),
    streakCount: input.streakCount,
  })
}

export function syncQuest(
  existing: DailyQuest | undefined,
  today: string,
  entries: FoodEntry[],
  streakCount: number,
  commitCompletion = true,
): DailyQuest {
  const spec = existing?.date === today ? existing : { ...questForDate(today), progress: 0, completedAt: null }
  const todayEntries = entries.filter(entry => localDayKey(new Date(entry.timestamp)) === today)
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
