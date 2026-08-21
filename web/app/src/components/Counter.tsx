import { useCountUp } from '../hooks/useCountUp'

export function Counter({
  label,
  value,
  tone = 'neutral',
  icon,
}: {
  label: string
  value: number
  tone?: 'streak' | 'xp' | 'freeze' | 'neutral'
  icon?: string
}) {
  const shown = useCountUp(value)
  return (
    <div className={`counter clay-chip counter-${tone}`}>
      {icon && <span className="counter-icon" aria-hidden>{icon}</span>}
      <strong className="counter-value">{shown.toLocaleString()}</strong>
      <span className="counter-label sr-only">{label}</span>
    </div>
  )
}
