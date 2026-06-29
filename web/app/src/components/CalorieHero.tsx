interface CalorieHeroProps {
  current: number
  goal: number
}

export function CalorieHero({ current, goal }: CalorieHeroProps) {
  const progress = goal > 0 ? Math.min(1, current / goal) : 0
  const remaining = Math.max(0, goal - current)
  const goalLabel = goal.toLocaleString()
  const atZero = progress === 0

  return (
    <div className="calorie-hero">
      <div className="calorie-hero-head">
        <span className="calorie-hero-value">{Math.round(current)}</span>
        <span className="calorie-hero-goal">of {goalLabel} kcal</span>
      </div>

      <div className="calorie-hero-bar">
        <div className="calorie-hero-bar-track" />
        {atZero ? (
          <div className="calorie-hero-bar-dot" aria-hidden />
        ) : (
          <div
            className="calorie-hero-bar-fill"
            style={{ width: `${Math.max(progress * 100, 4)}%` }}
          />
        )}
      </div>

      <span className="calorie-hero-left">{remaining.toLocaleString()} left</span>
    </div>
  )
}
