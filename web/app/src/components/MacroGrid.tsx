import { useEffect, useRef, useState } from 'react'
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
  label, current, goal, color, bg, mountKey,
}: {
  label: string; current: number; goal: number; color: string; bg: string; mountKey: string
}) {
  const progress = goal > 0 ? Math.min(1, current / goal) : 0
  const left = Math.max(0, goal - current)
  const displayCurrent = useCountUp(Math.round(current * 10) / 10)
  const displayLeft = useCountUp(Math.round(left * 10) / 10)

  // Animate bar from 0 on mount/day-change
  const [barWidth, setBarWidth] = useState('0%')
  const prevKey = useRef(mountKey)

  useEffect(() => {
    if (prevKey.current !== mountKey) {
      setBarWidth('0%')
      prevKey.current = mountKey
    }
    const t = setTimeout(() => {
      setBarWidth(progress > 0 ? `${Math.max(progress * 100, 8)}%` : '0%')
    }, 30)
    return () => clearTimeout(t)
  }, [progress, mountKey])

  return (
    <div
      className="home-macro-card press-spring"
      style={{ '--macro-color': color, '--macro-bg': bg } as React.CSSProperties}
    >
      <div className="home-macro-pill" style={{ background: bg }}>
        <span className="home-macro-current" style={{ color }}>{formatMacroValue(displayCurrent)}g</span>
      </div>

      <div className="home-macro-bar">
        <div className="home-macro-bar-track" />
        <div
          className="home-macro-bar-fill"
          style={{
            width: barWidth,
            background: color,
            boxShadow: progress > 0 ? `0 2px 6px ${color}55` : undefined,
            transition: 'width 0.55s cubic-bezier(0.34,1.2,0.64,1)',
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
  // Use a string key that changes when the day changes (values reset to 0)
  const mountKey = `${protein.current}-${carbs.current}-${fat.current}`

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
            mountKey={mountKey}
          />
        ))}
      </div>
    </div>
  )
}
