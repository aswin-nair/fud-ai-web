import { formatMacroValue } from '../lib/dates'

interface MacroItem {
  current: number
  goal: number
}

interface MacroGridProps {
  protein: MacroItem
  carbs: MacroItem
  fat: MacroItem
}

function MacroCard({ label, current, goal }: { label: string; current: number; goal: number }) {
  const progress = goal > 0 ? Math.min(1, current / goal) : 0
  const left = Math.max(0, goal - current)
  const currentText = formatMacroValue(current)
  const atZero = progress === 0

  return (
    <div className="home-macro-card">
      <div className="home-macro-values">
        <span className="home-macro-current">{currentText}</span>
        <span className="home-macro-goal">/{goal}g</span>
      </div>

      <div className="home-macro-bar">
        <div className="home-macro-bar-track" />
        {atZero ? (
          <div className="home-macro-bar-dot" aria-hidden />
        ) : (
          <div
            className="home-macro-bar-fill"
            style={{ width: `${Math.max(progress * 100, 8)}%` }}
          />
        )}
      </div>

      <span className="home-macro-label">{label}</span>
      <span className="home-macro-left">{formatMacroValue(left)}g left</span>
    </div>
  )
}

export function MacroGrid({ protein, carbs, fat }: MacroGridProps) {
  return (
    <div className="home-macro-block">
      <div className="home-macro-row">
        <MacroCard label="Protein" current={protein.current} goal={protein.goal} />
        <MacroCard label="Carbs" current={carbs.current} goal={carbs.goal} />
        <MacroCard label="Fat" current={fat.current} goal={fat.goal} />
      </div>
      <button type="button" className="view-more-btn">
        View More
        <span aria-hidden>›</span>
      </button>
    </div>
  )
}
