import { useEffect, useState } from 'react'

import { track } from '../lib/analytics'
import { useCountUp } from '../hooks/useCountUp'
import { prefersReducedMotion } from '../lib/tokens'
import type { XpEvent } from '../types'

export interface LogCelebrationProps {
  foodName: string
  streak: number
  awards: XpEvent[]
  onDone: () => void
}

export function LogCelebration({
  foodName,
  streak,
  awards,
  onDone,
}: LogCelebrationProps) {
  const [shown, setShown] = useState(false)
  const totalXp = awards.reduce((sum, a) => sum + a.xp, 0)
  const countedXp = useCountUp(totalXp)

  useEffect(() => {
    const t = setTimeout(() => setShown(true), prefersReducedMotion() ? 0 : 20)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const ms = prefersReducedMotion() ? 200 : 1400
    const t = setTimeout(() => {
      track({ name: 'log_celebration_completed' })
      onDone()
    }, ms)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      className={`celebrate-overlay${shown ? ' is-shown' : ''}`}
      role="dialog"
      aria-live="polite"
      aria-label="Meal logged"
    >
      <div className="celebrate-burst" aria-hidden />
      <div className="celebrate-inner">
        <h2 className="celebrate-title">Logged.</h2>
        <p className="celebrate-sub">{foodName}</p>

        <div className="celebrate-stats">
          <div className="celebrate-stat">
            <span className="celebrate-stat-value tabular">+{countedXp}</span>
            <span className="celebrate-stat-label">XP added</span>
          </div>
          <div className="celebrate-stat">
            <span className="celebrate-stat-value tabular">{streak}</span>
            <span className="celebrate-stat-label">
              {streak === 1 ? 'day streak' : 'day streak'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
