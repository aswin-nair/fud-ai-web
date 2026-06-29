interface CalorieRingProps {
  consumed: number
  goal: number
}

export function CalorieRing({ consumed, goal }: CalorieRingProps) {
  const remaining = Math.max(0, goal - consumed)
  const over = consumed > goal
  const pct = Math.min(1, consumed / Math.max(goal, 1))
  const r = 70
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct)

  return (
    <div className="ring-wrap">
      <div className="calorie-ring">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={r} fill="none" stroke="var(--rule)" strokeWidth="10" />
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke={over ? 'var(--coral-deep)' : 'var(--coral)'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="ring-center">
          <span className="ring-value">{Math.round(consumed)}</span>
          <span className="ring-label">kcal eaten</span>
        </div>
      </div>
      <span className="ring-remaining">
        {over
          ? `${Math.round(consumed - goal)} over goal`
          : `${Math.round(remaining)} remaining · ${goal} goal`}
      </span>
    </div>
  )
}
