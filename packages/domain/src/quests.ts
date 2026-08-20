export const QUEST_TYPES = ['log_n_meals', 'log_before', 'log_streak'] as const
export type QuestType = (typeof QUEST_TYPES)[number]

export interface QuestCandidate {
  type: QuestType
  targets: readonly number[]
  hours?: readonly number[]
}

export interface QuestSpec {
  type: QuestType
  target: number
  beforeHour?: number
}

export const WEB_QUEST_CANDIDATES: readonly QuestCandidate[] = [
  { type: 'log_n_meals', targets: [2, 3, 4] },
  { type: 'log_before', targets: [1], hours: [10, 11] },
  { type: 'log_streak', targets: [2, 3] },
]

/**
 * Mobile keeps a fourth candidate slot so older `hit_protein` dates stay
 * stable. That list is a recorded platform exception.
 */
export const MOBILE_QUEST_CANDIDATES: readonly QuestCandidate[] = [
  { type: 'log_n_meals', targets: [2, 3, 4] },
  { type: 'log_n_meals', targets: [2] },
  { type: 'log_before', targets: [1], hours: [10, 11] },
  { type: 'log_streak', targets: [2, 3] },
]

export function seedFor(date: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < date.length; i += 1) {
    hash ^= date.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

function pick<T>(options: readonly T[], draw: number): T {
  return options[draw % options.length] as T
}

export function questForDate(
  date: string,
  candidates: readonly QuestCandidate[] = WEB_QUEST_CANDIDATES,
): QuestSpec {
  const seed = seedFor(date)
  const candidate = candidates[seed % candidates.length] as QuestCandidate
  const target = pick(candidate.targets, Math.floor(seed / candidates.length))
  if (!candidate.hours) return { type: candidate.type, target }
  return {
    type: candidate.type,
    target,
    beforeHour: pick(candidate.hours, Math.floor(seed / 7)),
  }
}

export function questProgress(
  spec: Pick<QuestSpec, 'type' | 'target' | 'beforeHour'>,
  input: {
    entriesToday: readonly { mealSlot: string; localHour: number }[]
    streakCount: number
  },
): number {
  switch (spec.type) {
    case 'log_n_meals':
      return new Set(input.entriesToday.map(entry => entry.mealSlot)).size
    case 'log_before': {
      const cutoff = spec.beforeHour ?? 10
      return input.entriesToday.some(entry => entry.localHour < cutoff) ? 1 : 0
    }
    case 'log_streak':
      return Math.min(input.streakCount, spec.target)
  }
}

export function questTitle(spec: Pick<QuestSpec, 'type' | 'target' | 'beforeHour'>): string {
  switch (spec.type) {
    case 'log_n_meals':
      return `Log ${spec.target} ${spec.target === 1 ? 'meal' : 'meals'} today`
    case 'log_before': {
      const hour = spec.beforeHour ?? 10
      const suffix = hour < 12 ? 'am' : 'pm'
      const display = hour % 12 === 0 ? 12 : hour % 12
      return `Log breakfast before ${display}${suffix}`
    }
    case 'log_streak':
      return `Log something ${spec.target} days running`
  }
}
