import { formatMacroValue } from '../lib/dates'
import { useCountUp } from '../hooks/useCountUp'

interface MacroItem {
  current: number
  goal: number
}

interface MacroProgressGroupProps {
  protein: MacroItem
  carbs: MacroItem
  fat: MacroItem
}

const MACROS = [
  { key: 'protein', label: 'Protein' },
  { key: 'carbs', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
] as const

function MacroProgress({
  kind,
  label,
  current,
  goal,
}: {
  kind: (typeof MACROS)[number]['key']
  label: string
  current: number
  goal: number
}) {
  const safeCurrent = Math.max(0, current)
  const safeGoal = Math.max(0, goal)
  const progress = safeGoal > 0 ? Math.min(1, safeCurrent / safeGoal) : 0
  const remaining = Math.max(0, safeGoal - safeCurrent)
  const over = Math.max(0, safeCurrent - safeGoal)
  const displayCurrent = useCountUp(Math.round(safeCurrent * 10) / 10)

  return (
    <div
      className={`home-macro-progress macro-${kind}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(safeGoal)}
      aria-valuenow={Math.round(safeCurrent)}
    >
      <div className="home-macro-progress-top">
        <span className="home-macro-progress-label">{label}</span>
        <span className="home-macro-progress-value">
          <strong>{formatMacroValue(displayCurrent)}g</strong>
          <span> / {formatMacroValue(safeGoal)}g</span>
        </span>
      </div>
      <div className="home-macro-progress-track" aria-hidden>
        <span
          className="home-macro-progress-fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="home-macro-progress-note">
        {over > 0
          ? `${formatMacroValue(over)}g over`
          : `${formatMacroValue(remaining)}g remaining`}
      </span>
    </div>
  )
}

/** One calm, token-driven macro group; nutrition remains subordinate to logging. */
export function MacroProgressGroup({ protein, carbs, fat }: MacroProgressGroupProps) {
  const values = { protein, carbs, fat }

  return (
    <section className="home-macro-block" aria-label="Macros">
      <div className="home-macro-group">
        {MACROS.map(macro => (
          <MacroProgress
            key={macro.key}
            kind={macro.key}
            label={macro.label}
            current={values[macro.key].current}
            goal={values[macro.key].goal}
          />
        ))}
      </div>
    </section>
  )
}
