import type { AppState, FoodEntry, GamificationState } from '../types'
import { localDayKey } from './dates'
import { applyFreeze, getAllBadges, getStreakWithFreezes } from './journey'
import { syncQuest } from './quests'
import { computeXpAwards, makeXpEvents, levelFromXp } from './xp'
import { track } from './analytics'

export type LogAdvance = {
  gamification: GamificationState
  freezeApplied: { protectedStreak: number } | null
  questJustCompleted: boolean
  streakMilestone: boolean
}

type Quest = NonNullable<GamificationState['quest']>

/** A completed quest is new when this quest itself was not already complete. */
export function isNewQuestCompletion(previous: Quest | undefined, current: Quest): boolean {
  return Boolean(
    current.completedAt
    && (previous?.date !== current.date || !previous.completedAt),
  )
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365]

export function openSession(state: AppState): LogAdvance {
  const beforeFreezes = state.gamification.freezeUsedDates.length
  const freezeUpdate = applyFreeze(state.foodEntries, state.gamification)
  const freezeApplied = freezeUpdate.freezeUsedDates.length > beforeFreezes
    ? { protectedStreak: getStreakWithFreezes(state.foodEntries, freezeUpdate.freezeUsedDates) }
    : null

  if (freezeApplied) {
    track({ name: 'freeze_applied', protectedStreak: freezeApplied.protectedStreak })
  }

  const today = localDayKey(new Date())
  const streak = getStreakWithFreezes(state.foodEntries, freezeUpdate.freezeUsedDates)
  const quest = syncQuest(state.gamification.quest, today, state.foodEntries, streak)

  return {
    gamification: { ...state.gamification, ...freezeUpdate, quest },
    freezeApplied,
    questJustCompleted: false,
    streakMilestone: false,
  }
}

export function advanceAfterLog(state: AppState, entry: FoodEntry): LogAdvance {
  const allEntries = [...state.foodEntries, entry]
  const beforeFreezes = new Set(state.gamification.freezeUsedDates)
  const freezeUpdate = applyFreeze(state.foodEntries, state.gamification)
  const freezeApplied = freezeUpdate.freezeUsedDates.some(d => !beforeFreezes.has(d))
    ? { protectedStreak: getStreakWithFreezes(allEntries, freezeUpdate.freezeUsedDates) }
    : null

  const awards = computeXpAwards(entry, state.foodEntries, { ...state.gamification, ...freezeUpdate })
  const logEventAt = new Date().toISOString()
  const newEvents = makeXpEvents(awards, logEventAt)
  const awardedKeys = new Set(state.gamification.awardedKeys)
  for (const award of awards) awardedKeys.add(award.key)
  const earnedXp = awards.reduce((sum, a) => sum + a.xp, 0)
  const newXp = state.gamification.xp + earnedXp
  const newLevel = levelFromXp(newXp)
  const didLevelUp = newLevel > state.gamification.level

  const today = localDayKey(new Date(entry.timestamp))
  const streak = getStreakWithFreezes(allEntries, freezeUpdate.freezeUsedDates)
  const prevQuest = state.gamification.quest
  const quest = syncQuest(prevQuest, today, allEntries, streak)
  const questJustCompleted = isNewQuestCompletion(prevQuest, quest)

  let xp = newXp
  let events = [...newEvents, ...state.gamification.xpEvents]
  const questKey = `quest-${quest.date}`
  if (questJustCompleted && !awardedKeys.has(questKey)) {
    events = [{
      id: crypto.randomUUID(),
      key: questKey,
      xp: 25,
      label: 'Quest completed',
      timestamp: logEventAt,
    }, ...events]
    awardedKeys.add(questKey)
    xp += 25
    track({ name: 'quest_completed', type: quest.type })
  }

  const streakKey = `streak-${streak}`
  const streakMilestone = STREAK_MILESTONES.includes(streak)
    && !awardedKeys.has(streakKey)
  if (streakMilestone) {
    events = [{
      id: crypto.randomUUID(),
      key: streakKey,
      xp: 50,
      label: `${streak}-day streak`,
      timestamp: logEventAt,
    }, ...events]
    awardedKeys.add(streakKey)
    xp += 50
    track({ name: 'streak_extended', count: streak })
  }

  const newGam: GamificationState = {
    ...state.gamification,
    ...freezeUpdate,
    xp,
    level: levelFromXp(xp),
    pendingLevelUp: didLevelUp || levelFromXp(xp) > state.gamification.level
      ? levelFromXp(xp)
      : state.gamification.pendingLevelUp,
    xpEvents: events.slice(0, 50),
    awardedKeys: [...awardedKeys],
    quest,
  }

  const allBadges = getAllBadges(allEntries, streak)
  const seenSet = new Set(newGam.seenBadgeIds)
  const newlyUnlocked = allBadges.filter(b => b.unlocked && !seenSet.has(b.id))
  if (newlyUnlocked.length > 0) {
    newGam.seenBadgeIds = [...newGam.seenBadgeIds, ...newlyUnlocked.map(b => b.id)]
  }

  if (freezeApplied) {
    track({ name: 'freeze_applied', protectedStreak: freezeApplied.protectedStreak })
  }

  return { gamification: newGam, freezeApplied, questJustCompleted, streakMilestone }
}
