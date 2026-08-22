import type { AppState, FoodEntry, GamificationState } from '../types'
import { localDayKey } from './dates'
import {
  applyEnamelLogAwards,
  grantFreeFreezeAtStreak,
  markBrokenIfNeeded,
  syncEnamelQuests,
} from './enamelEconomy'
import { applyFreeze, getAllBadges, getStreakWithFreezes } from './journey'
import { syncQuest } from './quests'
import { computeXpAwards, makeXpEvents, levelFromXp } from './xp'
import { track } from './analytics'

let sessionOpenedAt = Date.now()

export function markSessionOpened(at = Date.now()): void {
  sessionOpenedAt = at
}

export type LogAdvance = {
  gamification: GamificationState
  freezeApplied: { protectedStreak: number } | null
  questJustCompleted: boolean
  streakMilestone: boolean
}

type Quest = NonNullable<GamificationState['quest']>

function entriesOutsidePausedDays(
  entries: FoodEntry[],
  gamification: GamificationState,
): FoodEntry[] {
  const protectedDays = new Set(gamification.pauseProtectedDates)
  return entries.filter(entry => !protectedDays.has(localDayKey(new Date(entry.timestamp))))
}

/** A completed quest is new when this quest itself was not already complete. */
export function isNewQuestCompletion(previous: Quest | undefined, current: Quest): boolean {
  return Boolean(
    current.completedAt
    && (previous?.date !== current.date || !previous.completedAt),
  )
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365]

/**
 * Persist the local calendar days covered by a tracking pause. Completed pause
 * days bridge the streak without adding to its count; the resume day is left
 * active so the person can choose to log it normally.
 */
export function transitionTrackingPause(
  gamification: GamificationState,
  wasPaused: boolean,
  nextPaused: boolean,
  now = new Date(),
): GamificationState {
  const today = localDayKey(now)

  if (nextPaused) {
    if (wasPaused && gamification.pauseStartedDate) return gamification
    return { ...gamification, pauseStartedDate: today }
  }

  if (!wasPaused) return gamification

  const protectedDates = new Set(gamification.pauseProtectedDates)
  const [year, month, day] = (gamification.pauseStartedDate ?? today).split('-').map(Number)
  const cursor = new Date(year, month - 1, day, 12)
  const resumeDay = new Date(now)
  resumeDay.setHours(12, 0, 0, 0)

  while (cursor < resumeDay) {
    protectedDates.add(localDayKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return {
    ...gamification,
    pauseStartedDate: null,
    pauseProtectedDates: [...protectedDates].sort(),
  }
}

export function openSession(state: AppState): LogAdvance {
  if (state.profile.trackingPaused) {
    return {
      gamification: transitionTrackingPause(state.gamification, true, true),
      freezeApplied: null,
      questJustCompleted: false,
      streakMilestone: false,
    }
  }

  const beforeFreezes = state.gamification.freezeUsedDates.length
  const freezeUpdate = applyFreeze(state.foodEntries, state.gamification)
  const freezeApplied = freezeUpdate.freezeUsedDates.length > beforeFreezes
    ? { protectedStreak: getStreakWithFreezes(
        state.foodEntries,
        freezeUpdate.freezeUsedDates,
        state.gamification.pauseProtectedDates,
      ) }
    : null

  if (freezeApplied) {
    track({ name: 'streak_freeze_applied', protected_streak: freezeApplied.protectedStreak })
  }

  const today = localDayKey(new Date())
  const streak = getStreakWithFreezes(
    state.foodEntries,
    freezeUpdate.freezeUsedDates,
    state.gamification.pauseProtectedDates,
  )
  // Opening the app may refresh visible progress, but it must not manufacture
  // a completion timestamp or award. Only a real log commits completion.
  const quest = syncQuest(
    state.gamification.quest,
    today,
    entriesOutsidePausedDays(state.foodEntries, state.gamification),
    streak,
    false,
  )
  const enamelBase = { ...state.gamification, ...freezeUpdate, quest }
  const enamelQuests = syncEnamelQuests(
    enamelBase,
    today,
    {
      entries: entriesOutsidePausedDays(state.foodEntries, state.gamification),
      water: enamelBase.waterByDate?.[today] ?? 0,
      notes: enamelBase.notesByDate?.[today] ?? 0,
      sessionOpenedAt,
    },
    false,
  )

  return {
    gamification: grantFreeFreezeAtStreak({ ...enamelBase, enamelQuests }, streak),
    freezeApplied,
    questJustCompleted: false,
    streakMilestone: false,
  }
}

export function advanceAfterLog(state: AppState, entry: FoodEntry): LogAdvance {
  if (state.profile.trackingPaused) {
    const paused = transitionTrackingPause(state.gamification, true, true)
    const pauseProtectedDates = new Set(paused.pauseProtectedDates)
    // If someone reaches a logging route while paused, the record can still be
    // saved, but its calendar day stays neutral even when pause and resume both
    // happen on that same day.
    pauseProtectedDates.add(localDayKey(new Date(entry.timestamp)))
    return {
      gamification: { ...paused, pauseProtectedDates: [...pauseProtectedDates].sort() },
      freezeApplied: null,
      questJustCompleted: false,
      streakMilestone: false,
    }
  }

  const allEntries = [...state.foodEntries, entry]
  const beforeFreezes = new Set(state.gamification.freezeUsedDates)
  const freezeUpdate = applyFreeze(state.foodEntries, state.gamification)
  const freezeApplied = freezeUpdate.freezeUsedDates.some(d => !beforeFreezes.has(d))
    ? { protectedStreak: getStreakWithFreezes(
        allEntries,
        freezeUpdate.freezeUsedDates,
        state.gamification.pauseProtectedDates,
      ) }
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
  const streak = getStreakWithFreezes(
    allEntries,
    freezeUpdate.freezeUsedDates,
    state.gamification.pauseProtectedDates,
  )
  const prevQuest = state.gamification.quest
  const quest = syncQuest(
    prevQuest,
    today,
    entriesOutsidePausedDays(allEntries, state.gamification),
    streak,
    true,
  )
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
    // Streak milestones stay a local XP award. Product telemetry only records
    // the canonical freeze and quest events.
  }

  let newGam: GamificationState = applyEnamelLogAwards({
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
  }, entry, state.foodEntries, { sessionOpenedAt })

  newGam.enamelQuests = syncEnamelQuests(
    newGam,
    today,
    {
      entries: entriesOutsidePausedDays(allEntries, newGam),
      water: newGam.waterByDate?.[today] ?? 0,
      notes: newGam.notesByDate?.[today] ?? 0,
      sessionOpenedAt,
    },
    true,
  )
  newGam = grantFreeFreezeAtStreak(newGam, streak)
  newGam = markBrokenIfNeeded(newGam, getStreakWithFreezes(
    state.foodEntries,
    state.gamification.freezeUsedDates,
    state.gamification.pauseProtectedDates,
  ), streak, today)

  const allBadges = getAllBadges(allEntries, streak)
  const seenSet = new Set(newGam.seenBadgeIds)
  const newlyUnlocked = allBadges.filter(b => b.unlocked && !seenSet.has(b.id))
  if (newlyUnlocked.length > 0) {
    newGam.seenBadgeIds = [...newGam.seenBadgeIds, ...newlyUnlocked.map(b => b.id)]
  }

  if (freezeApplied) {
    track({ name: 'streak_freeze_applied', protected_streak: freezeApplied.protectedStreak })
  }

  return { gamification: newGam, freezeApplied, questJustCompleted, streakMilestone }
}
