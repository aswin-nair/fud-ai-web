import { Link } from 'react-router-dom'
import type { FoodEntry, GamificationState } from '../types'
import { sameDay } from '../lib/dates'
import { levelFromXp, LEVEL_COMPANIONS } from '../lib/xp'

const MILESTONES = [3, 7, 14, 30, 60, 100]

function nextMilestone(streak: number): number {
  return MILESTONES.find(m => m > streak) ?? MILESTONES[MILESTONES.length - 1]
}

function flameScale(streak: number): string {
  if (streak >= 30) return 'flame-tier-4'
  if (streak >= 7)  return 'flame-tier-3'
  if (streak >= 3)  return 'flame-tier-2'
  return 'flame-tier-1'
}

interface StreakCardProps {
  streak: number
  entries: FoodEntry[]
  gamification: GamificationState
}

export function StreakCard({ streak, entries, gamification }: StreakCardProps) {
  const hasLoggedToday = entries.some(e => sameDay(new Date(e.timestamp), new Date()))
  const atRisk = streak > 0 && !hasLoggedToday

  const level = levelFromXp(gamification.xp)
  const companion = LEVEL_COMPANIONS[Math.min(level, LEVEL_COMPANIONS.length - 1)]

  if (streak === 0 && entries.length === 0) {
    return (
      <Link to="/journey" className="streak-card streak-card-zero">
        <span className="streak-fire streak-fire-dim">🔥</span>
        <span className="streak-zero-text">Start your streak today!</span>
      </Link>
    )
  }

  if (streak === 0) {
    return (
      <Link to="/journey" className="streak-card streak-card-zero">
        <span className="streak-fire streak-fire-dim">🔥</span>
        <span className="streak-zero-text">Log today to start a streak!</span>
      </Link>
    )
  }

  const next = nextMilestone(streak)
  const prev = MILESTONES.find(m => m <= streak) ?? 0
  const progress = next === prev ? 1 : (streak - prev) / (next - prev)

  return (
    <Link to="/journey" className={`streak-card${atRisk ? ' at-risk' : ''}`}>
      <span className={`streak-fire ${flameScale(streak)}`} aria-hidden>🔥</span>
      <div className="streak-body">
        <div className="streak-row">
          <span className="streak-count">{streak}</span>
          <span className="streak-label">day streak</span>
          {atRisk && <span className="streak-risk-badge">Log today!</span>}
          {gamification.streakFreezes > 0 && (
            <span className="streak-freeze-badge" title="Streak freeze available">
              ❄️{gamification.streakFreezes}
            </span>
          )}
        </div>
        <div className="streak-progress-track">
          <div
            className="streak-progress-fill"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
        <span className="streak-milestone-hint">{next - streak} to {next}-day badge</span>
      </div>
      <div className="streak-level-badge">
        <span className="streak-companion">{companion}</span>
        <span className="streak-level-num">{level}</span>
      </div>
    </Link>
  )
}
