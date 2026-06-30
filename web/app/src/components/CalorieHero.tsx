import { useCountUp } from '../hooks/useCountUp'

const RADIUS = 82
const CIRC = 2 * Math.PI * RADIUS

interface CalorieHeroProps {
  current: number
  goal: number
}

export function CalorieHero({ current, goal }: CalorieHeroProps) {
  const raw = goal > 0 ? current / goal : 0
  const progress = Math.min(1, raw)
  const over = raw > 1
  const remaining = Math.max(0, goal - current)
  const offset = CIRC * (1 - progress)

  const displayCalories = useCountUp(Math.round(current))
  const displayRemaining = useCountUp(Math.round(over ? current - goal : remaining))

  return (
    <div className="calorie-hero">
      <div className="calorie-ring-wrap">
        <svg className="calorie-ring-svg" viewBox="0 0 200 200" aria-hidden>
          <defs>
            <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--coral-start)" />
              <stop offset="100%" stopColor="var(--coral-end)" />
            </linearGradient>
          </defs>
          <circle
            cx="100" cy="100" r={RADIUS}
            fill="none"
            stroke="rgba(255,55,95,0.10)"
            strokeWidth="14"
          />
          <circle
            cx="100" cy="100" r={RADIUS}
            fill="none"
            stroke={over ? 'var(--coral-deep)' : 'url(#ring-grad)'}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              transition: 'stroke-dashoffset 0.65s cubic-bezier(0.34,1.2,0.64,1)',
              filter: over ? undefined : 'drop-shadow(0 0 6px rgba(255,55,95,0.5))',
            }}
          />
        </svg>

        <div className="calorie-ring-center">
          <span className="calorie-hero-value">{displayCalories.toLocaleString()}</span>
          <span className="calorie-hero-unit">kcal eaten</span>
        </div>
      </div>

      <div className="calorie-hero-meta">
        <span className="calorie-hero-goal-label">goal {goal.toLocaleString()}</span>
        <span className="calorie-hero-sep" aria-hidden>·</span>
        <span className={`calorie-hero-left${over ? ' over' : ''}`}>
          {over
            ? `${displayRemaining.toLocaleString()} over`
            : `${displayRemaining.toLocaleString()} left`}
        </span>
      </div>
    </div>
  )
}
