import { useEffect, useState } from 'react'

import { track } from '../lib/analytics'
import { useCountUp } from '../hooks/useCountUp'
import { prefersReducedMotion } from '../lib/tokens'
import type { XpEvent } from '../types'
import { Momo } from './Momo'
import { useFeel } from '../hooks/useHaptic'

export interface LogCelebrationProps {
  foodName: string
  streak: number
  awards: XpEvent[]
  cosmeticId?: string | null
  onDone: () => void
}

export function LogCelebration({
  foodName,
  streak,
  awards,
  cosmeticId,
  onDone,
}: LogCelebrationProps) {
  const [reduced] = useState(() => prefersReducedMotion())
  const [shown, setShown] = useState(false)
  const [visibleCount, setVisibleCount] = useState(reduced ? awards.length : 0)
  const feel = useFeel()
  const visibleAwards = awards.slice(0, visibleCount)
  const revealedXp = visibleAwards.reduce((sum, award) => sum + award.xp, 0)
  const countedXp = useCountUp(revealedXp)

  useEffect(() => {
    const t = setTimeout(() => setShown(true), reduced ? 0 : 20)
    return () => clearTimeout(t)
  }, [reduced])

  useEffect(() => {
    if (reduced || awards.length === 0) return
    let count = 0
    const timer = setInterval(() => {
      count += 1
      setVisibleCount(count)
      feel('select')
      if (count >= awards.length) clearInterval(timer)
    }, 420)
    return () => clearInterval(timer)
  }, [awards.length, feel, reduced])

  useEffect(() => {
    const ms = reduced ? 1800 : Math.max(2300, awards.length * 420 + 1600)
    const t = setTimeout(() => {
      track({ name: 'log_celebration_completed' })
      onDone()
    }, ms)
    return () => clearTimeout(t)
  }, [awards.length, onDone, reduced])

  return (
    <div
      className={`celebrate-overlay${shown ? ' is-shown' : ''}`}
      role="dialog"
      aria-live="polite"
      aria-label="Meal logged"
    >
      <div className="celebrate-burst" aria-hidden />
      <div className="celebrate-inner">
        <div className="celebrate-momo" aria-hidden>
          <div style={{ width: 112, height: 112 }}><Momo mood="excited" cosmeticId={cosmeticId} /></div>
        </div>
        <h2 className="celebrate-title">Logged.</h2>
        <p className="celebrate-sub">{foodName}</p>

        {awards.length > 0 && (
          <ul className="celebrate-awards" aria-label="Rewards revealed">
            {visibleAwards.map(award => (
              <li key={award.key}>
                <span>{award.label}</span>
                <strong className="tabular">+{award.xp} XP</strong>
              </li>
            ))}
          </ul>
        )}

        <div className="celebrate-stats">
          <div className="celebrate-stat">
            <span className="celebrate-stat-value tabular">+{countedXp}</span>
            <span className="celebrate-stat-label">XP revealed</span>
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
