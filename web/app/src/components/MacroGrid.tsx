import { formatMacroValue } from '../lib/dates'
import { useCountUp } from '../hooks/useCountUp'

interface MacroItem {
  current: number
  goal: number
}

interface MacroGridProps {
  protein: MacroItem
  carbs: MacroItem
  fat: MacroItem
}

const MACROS = [
  { key: 'protein', label: 'Protein', color: '#6B9FFF', bg: 'rgba(107,159,255,0.12)' },
  { key: 'carbs',   label: 'Carbs',   color: '#FFB347', bg: 'rgba(255,179,71,0.12)'  },
  { key: 'fat',     label: 'Fat',     color: '#FF6B9D', bg: 'rgba(255,107,157,0.12)' },
] as const

function MacroCard({
  label, current, goal, color, bg,
}: {
  label: string; current: number; goal: number; color: string; bg: string
}) {
  const progress = goal > 0 ? Math.min(1, current / goal) : 0
  const left = Math.max(0, goal - current)
  const displayCurrent = useCountUp(Math.round(current * 10) / 10)
  const displayLeft = useCountUp(Math.round(left * 10) / 10)

  return (
    <div className="home-macro-card" style={{ '--macro-color': color, '--macro-bg': bg } as React.CSSProperties}>
      <div className="home-macro-pill" style={{ background: bg }}>
        <span className="home-macro-current" style={{ color }}>{formatMacroValue(displayCurrent)}g</span>
      </div>

      <div className="home-macro-bar">
        <div className="home-macro-bar-track" />
        <div
          className="home-macro-bar-fill"
          style={{
            width: progress > 0 ? `${Math.max(progress * 100, 8)}%` : '0%',
            background: color,
            boxShadow: progress > 0 ? `0 2px 6px ${color}55` : undefined,
          }}
        />
      </div>

      <span className="home-macro-label">{label}</span>
      <span className="home-macro-left">{formatMacroValue(displayLeft)}g left</span>
    </div>
  )
}

export function MacroGrid({ protein, carbs, fat }: MacroGridProps) {
  const values = { protein, carbs, fat }

  return (
    <div className="home-macro-block">
      <div className="home-macro-row">
        {MACROS.map(m => (
          <MacroCard
            key={m.key}
            label={m.label}
            current={values[m.key].current}
            goal={values[m.key].goal}
            color={m.color}
            bg={m.bg}
          />
        ))}
      </div>
    </div>
  )
}
