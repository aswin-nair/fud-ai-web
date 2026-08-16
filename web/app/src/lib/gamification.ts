import type { AppState, FoodEntry, GamificationState } from '../types'
import { localDayKey } from './dates'
import { applyFreeze, getAllBadges, getStreakWithFreezes } from './journey'
import { entriesForDay, macroTotals } from './storage'
import { syncQuest } from './quests'
import { computeXpAwards, makeXpEvents, levelFromXp } from './xp'
import { track } from './analytics'

export type LogAdvance = {
  gamification: GamificationState
  freezeApplied: { protectedStreak: number } | null
  questJustCompleted: boolean
  streakMilestone: boolean
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
  const totals = macroTotals(entriesForDay(state.foodEntries, new Date()))
  const streak = getStreakWithFreezes(state.foodEntries, freezeUpdate.freezeUsedDates)
  const quest = syncQuest(state.gamification.quest, today, state.foodEntries, totals.protein, state.profile, streak)

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
  const newEvents = makeXpEvents(awards)
  const earnedXp = awards.reduce((sum, a) => sum + a.xp, 0)
  const newXp = state.gamification.xp + earnedXp
  const newLevel = levelFromXp(newXp)
  const didLevelUp = newLevel > state.gamification.level

  const today = localDayKey(new Date(entry.timestamp))
  const totals = macroTotals(entriesForDay(allEntries, new Date(entry.timestamp)))
  const streak = getStreakWithFreezes(allEntries, freezeUpdate.freezeUsedDates)
  const prevQuest = state.gamification.quest
  const quest = syncQuest(prevQuest, today, allEntries, totals.protein, state.profile, streak)
  const questJustCompleted = Boolean(quest.completedAt && !prevQuest?.completedAt)

  let xp = newXp
  let events = [...newEvents, ...state.gamification.xpEvents]
  if (questJustCompleted) {
    events = [{
      id: crypto.randomUUID(),
      key: `quest-${quest.date}`,
      xp: 25,
      label: 'Quest completed',
      timestamp: new Date().toISOString(),
    }, ...events]
    xp += 25
    track({ name: 'quest_completed', type: quest.type })
  }

  const streakMilestone = STREAK_MILESTONES.includes(streak)
    && !events.some(e => e.key === `streak-${streak}`)
  if (streakMilestone) {
    events = [{
      id: crypto.randomUUID(),
      key: `streak-${streak}`,
      xp: 50,
      label: `${streak}-day streak`,
      timestamp: new Date().toISOString(),
    }, ...events]
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
    quest,
  }

  const allBadges = getAllBadges(allEntries, streak, newGam)
  const seenSet = new Set(newGam.seenBadgeIds)
  const newlyUnlocked = allBadges.filter(b => b.unlocked && !seenSet.has(b.id))
  if (newlyUnlocked.length > 0) {
    newGam.seenBadgeIds = [...newGam.seenBadgeIds, ...newlyUnlocked.map(b => b.id)]
  }

  track({
    name: 'meal_logged',
    slot: entry.mealType,
    source: entry.source,
  })

  if (freezeApplied) {
    track({ name: 'freeze_applied', protectedStreak: freezeApplied.protectedStreak })
  }

  return { gamification: newGam, freezeApplied, questJustCompleted, streakMilestone }
}
