import { useEffect, useState } from 'react'

import { Mascot } from './Mascot'
import { PressableButton } from './PressableButton'
import { useCountUp } from '../hooks/useCountUp'
import { prefersReducedMotion } from '../lib/tokens'
import type { XpEvent } from '../types'

/**
 * The signature moment, §11.1: the whole screen becomes the reward.
 *
 * Everything shown here is about the act of logging — what was earned, the
 * streak, the quest. Per §2.5 and §2.4 it never comments on the calorie total,
 * the macro split, or the food itself; there is no version of this screen that
 * appears because someone ate "well" or "badly".
 */
export interface LogCelebrationProps {
  foodName: string
  calories: number
  streak: number
  /** XP events awarded by this log, newest first. */
  awards: XpEvent[]
  quest?: { title: string; progress: number; target: number } | null
  onDone: () => void
}

export function LogCelebration({
  foodName,
  calories,
  streak,
  awards,
  quest,
  onDone,
}: LogCelebrationProps) {
  const [shown, setShown] = useState(false)
  const totalXp = awards.reduce((sum, a) => sum + a.xp, 0)
  const countedXp = useCountUp(totalXp)
  const countedCalories = useCountUp(Math.round(calories))

  useEffect(() => {
    // A frame's delay so the entrance transition has something to animate from.
    const t = setTimeout(() => setShown(true), prefersReducedMotion() ? 0 : 20)
    return () => clearTimeout(t)
  }, [])

  const questDone = quest ? quest.progress >= quest.target : false

  return (
    <div
      className={`celebrate-overlay${shown ? ' is-shown' : ''}`}
      role="dialog"
      aria-live="polite"
      aria-label="Meal logged"
    >
      <div className="celebrate-inner">
        <Mascot state={questDone ? 'celebrating' : 'happy'} size={128} />

        <h2 className="celebrate-title">
          {questDone ? 'Quest complete' : 'Logged'}
        </h2>
        <p className="celebrate-sub">
          {foodName} · {countedCalories.toLocaleString()} kcal
        </p>

        <div className="celebrate-stats">
          <div className="celebrate-stat">
            <span className="celebrate-stat-value">+{countedXp}</span>
            <span className="celebrate-stat-label">XP earned</span>
          </div>
          <div className="celebrate-stat">
            <span className="celebrate-stat-value">
              <span className="celebrate-flame">🔥</span>{streak}
            </span>
            <span className="celebrate-stat-label">
              {streak === 1 ? 'day streak' : 'day streak'}
            </span>
          </div>
        </div>

        {awards.length > 0 && (
          <ul className="celebrate-awards">
            {awards.map(award => (
              <li key={award.id}>
                <span>{award.label}</span>
                <strong>+{award.xp}</strong>
              </li>
            ))}
          </ul>
        )}

        {quest && (
          <div className={`celebrate-quest${questDone ? ' is-done' : ''}`}>
            <div className="celebrate-quest-top">
              <span>{quest.title}</span>
              <strong>{Math.min(quest.progress, quest.target)}/{quest.target}</strong>
            </div>
            <div className="celebrate-quest-track">
              <span
                className="celebrate-quest-fill"
                style={{ width: `${Math.min(1, quest.progress / Math.max(quest.target, 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        <PressableButton fullWidth label="Keep going" onClick={onDone} />
      </div>
    </div>
  )
}
