import type { AppState, FoodEntry, GamificationState } from '../types'
import { localDayKey } from './dates'
import {
  applyEnamelLogAwards,
  grantFreeFreezeAtStreak,
  markBrokenIfNeeded,
} from './enamelEconomy'
import { applyFreeze, getAllBadges, getStreakWithFreezes } from './journey'
import { levelFromXp } from './xp'
import { track } from './analytics'

export type LogAdvance = {
  gamification: GamificationState
  freezeApplied: { protectedStreak: number } | null
  streakMilestone: boolean
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

  const streak = getStreakWithFreezes(
    state.foodEntries,
    freezeUpdate.freezeUsedDates,
    state.gamification.pauseProtectedDates,
  )
  // The retired legacy quest field remains untouched for stored-state
  // compatibility. It no longer runs or awards invisible XP.
  const enamelBase = { ...state.gamification, ...freezeUpdate }

  return {
    gamification: grantFreeFreezeAtStreak(enamelBase, streak),
    freezeApplied,
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

  const logEventAt = new Date().toISOString()
  const today = localDayKey(new Date(entry.timestamp))
  const streak = getStreakWithFreezes(
    allEntries,
    freezeUpdate.freezeUsedDates,
    state.gamification.pauseProtectedDates,
  )
  let newGam = applyEnamelLogAwards(
    { ...state.gamification, ...freezeUpdate },
    entry,
    state.foodEntries,
  )
  const awardedKeys = new Set(newGam.awardedKeys)
  let events = [...newGam.xpEvents]
  let xp = newGam.xp

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
    // Streak milestones stay a local XP award.
  }

  const nextLevel = levelFromXp(xp)
  newGam = {
    ...newGam,
    xp,
    level: nextLevel,
    pendingLevelUp: nextLevel > state.gamification.level
      ? nextLevel
      : state.gamification.pendingLevelUp,
    xpEvents: events.slice(0, 50),
    awardedKeys: [...awardedKeys],
  }

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

  return { gamification: newGam, freezeApplied, streakMilestone }
}
