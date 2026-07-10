import { useCountUp } from '../hooks/useCountUp'
import { getMotivation } from '../lib/motivation'
import { ArcGauge } from './ArcGauge'
import { formatDayLabel } from '../lib/dates'

interface CalorieHeroProps {
  current: number
  goal: number
  burned?: number
  pop?: boolean
  selectedDate?: Date
}

export function CalorieHero({ current, goal, burned = 0, pop, selectedDate }: CalorieHeroProps) {
  const effectiveBudget = goal + burned
  const raw = effectiveBudget > 0 ? current / effectiveBudget : 0
  const progress = Math.min(1, raw)
  const over = raw > 1
  const remaining = Math.max(0, effectiveBudget - current)

  const displayCalories = useCountUp(Math.round(current))
  const displayRemaining = useCountUp(Math.round(over ? current - effectiveBudget : remaining))

  const { status, emoji, ringClass, zone } = getMotivation(current, effectiveBudget)
  const filledColor = zone === 'over' ? 'var(--coral-deep)' : zone === 'goal' ? 'var(--green-goal)' : 'var(--coral)'

  return (
    <div className={`calorie-hero${pop ? ' ring-pop' : ''}${ringClass ? ` ${ringClass}` : ''}`}>
      <ArcGauge
        progress={progress}
        filledColor={filledColor}
      >
        <div className="arc-gauge-top">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--ink)" aria-hidden>
            <path d="M13 2L4.5 13.5h5.7L9 22l9.5-12.5h-5.9z" />
          </svg>
          <span>{selectedDate ? formatDayLabel(selectedDate) : 'Today'}</span>
        </div>
        <span className="calorie-hero-value">
          {displayCalories.toLocaleString()} <span className="calorie-hero-unit">kcal</span>
        </span>
        <span className={`calorie-hero-goal-line${over ? ' over' : ''}`}>
          {over
            ? `${displayRemaining.toLocaleString()} kcal over`
            : `Goal ${effectiveBudget.toLocaleString()} kcal`}
        </span>
        {current > 0 && (
          <span className="calorie-hero-status" aria-live="polite">
            {emoji} {status}
          </span>
        )}
      </ArcGauge>

      {burned > 0 && (
        <div className="calorie-burned-chip" aria-label={`${burned} kcal burned from exercise`}>
          <span>🏃</span>
          <span>+{burned.toLocaleString()} burned</span>
        </div>
      )}
    </div>
  )
}
