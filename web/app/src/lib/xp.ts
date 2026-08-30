import {
  WEB_LEVEL_XP,
  levelFromXp as sharedLevelFromXp,
  xpForLevel as sharedXpForLevel,
  xpForNextLevel as sharedXpForNextLevel,
} from '@fud-ai/domain/xp'

export const LEVEL_XP = [...WEB_LEVEL_XP]

export const LEVEL_NAMES = [
  '', 'First Steps', 'Curious Explorer', 'Building Habits', 'Finding Balance',
  'Nutrition Aware', 'Steady Logger', 'Consistent Tracker', 'Wellness Enthusiast',
  'Journey Veteran', 'Nutrition Master',
]

export const LEVEL_COMPANIONS = ['', '🌱', '🌿', '🪴', '🌳', '🌲', '🌟', '🏆', '💎', '✨', '🌈']

export function levelFromXp(xp: number): number {
  return sharedLevelFromXp(xp, LEVEL_XP)
}

export function xpForLevel(level: number): number {
  return sharedXpForLevel(level, LEVEL_XP)
}

export function xpForNextLevel(level: number): number {
  return sharedXpForNextLevel(level, LEVEL_XP)
}
