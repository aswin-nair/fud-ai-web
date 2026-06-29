interface LineChartProps {
  points: { label: string; value: number }[]
  unit?: string
  goal?: number
  color?: string
}

export function LineChart({ points, unit = '', goal, color = 'var(--coral)' }: LineChartProps) {
  if (points.length === 0) {
    return <p className="chart-empty">No data yet</p>
  }

  const values = points.map(p => p.value)
  const min = Math.min(...values, goal ?? values[0]) * 0.98
  const max = Math.max(...values, goal ?? values[0]) * 1.02
  const range = max - min || 1
  const w = 320
  const h = 120
  const pad = 8

  const coords = points.map((p, i) => {
    const x = pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2)
    const y = h - pad - ((p.value - min) / range) * (h - pad * 2)
    return { x, y, ...p }
  })

  const polyline = coords.map(c => `${c.x},${c.y}`).join(' ')
  const goalY = goal != null ? h - pad - ((goal - min) / range) * (h - pad * 2) : null

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="line-chart" aria-hidden>
        {goalY != null && (
          <line x1={pad} y1={goalY} x2={w - pad} y2={goalY} stroke="var(--ink-mute)" strokeDasharray="4 4" strokeWidth="1" />
        )}
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={polyline} />
        {coords.map(c => (
          <circle key={c.label} cx={c.x} cy={c.y} r="3.5" fill={color} />
        ))}
      </svg>
      <div className="chart-labels">
        {points.map(p => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
      <div className="chart-latest">
        Latest: <strong>{points[points.length - 1].value.toFixed(1)}{unit}</strong>
      </div>
    </div>
  )
}

interface BarChartProps {
  bars: { label: string; value: number }[]
  goal?: number
}

export function BarChart({ bars, goal }: BarChartProps) {
  if (bars.length === 0) return <p className="chart-empty">No data yet</p>
  const max = Math.max(...bars.map(b => b.value), goal ?? 0, 1)

  return (
    <div className="bar-chart">
      {bars.map(b => {
        const pct = (b.value / max) * 100
        const overGoal = goal != null && b.value > goal
        return (
          <div key={b.label} className="bar-col">
            <div className="bar-track">
              <div
                className={`bar-fill${overGoal ? ' over' : ''}`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="bar-val">{b.value || '—'}</span>
            <span className="bar-label">{b.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Progress tab line chart with Y-axis labels (mobile-style). */
export function ProgressLineChart({
  points,
  goal,
  unit = '',
}: {
  points: { label: string; value: number }[]
  goal?: number
  unit?: string
}) {
  if (points.length === 0) {
    return <p className="chart-empty">No weight logged in this range</p>
  }

  const values = points.map(p => p.value)
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const min = Math.min(dataMin, goal ?? dataMin) - 2
  const max = Math.max(dataMax, goal ?? dataMax) + 2
  const range = max - min || 1

  const w = 340
  const h = 160
  const padL = 36
  const padR = 12
  const padT = 12
  const padB = 28
  const chartW = w - padL - padR
  const chartH = h - padT - padB

  const yTicks = [max, (max + min) / 2, min].map(v => Math.round(v))

  const coords = points.map((p, i) => {
    const x = padL + (i / Math.max(points.length - 1, 1)) * chartW
    const y = padT + chartH - ((p.value - min) / range) * chartH
    return { x, y, ...p }
  })

  const goalY = goal != null ? padT + chartH - ((goal - min) / range) * chartH : null

  return (
    <div className="progress-chart-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="progress-line-chart" aria-hidden>
        {yTicks.map(tick => {
          const y = padT + chartH - ((tick - min) / range) * chartH
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fill="var(--ink-mute)" fontSize="10">{tick}</text>
            </g>
          )
        })}
        {goalY != null && (
          <line
            x1={padL}
            y1={goalY}
            x2={w - padR}
            y2={goalY}
            stroke="#34C759"
            strokeDasharray="5 4"
            strokeWidth="1.5"
            opacity="0.85"
          />
        )}
        {coords.length > 1 && (
          <polyline
            fill="none"
            stroke="var(--coral-start)"
            strokeWidth="2"
            strokeLinecap="round"
            points={coords.map(c => `${c.x},${c.y}`).join(' ')}
          />
        )}
        {coords.map(c => (
          <circle key={c.label} cx={c.x} cy={c.y} r="4" fill="var(--coral-start)" />
        ))}
        {coords.map(c => (
          <text key={`${c.label}-x`} x={c.x} y={h - 6} textAnchor="middle" fill="var(--ink-mute)" fontSize="9">{c.label}</text>
        ))}
      </svg>
      {points.length > 0 && (
        <p className="chart-footnote">
          Latest: <strong>{points[points.length - 1].value.toFixed(1)}{unit}</strong>
        </p>
      )}
    </div>
  )
}

/** Progress tab calorie bar chart with goal line (mobile-style). */
export function ProgressBarChart({
  bars,
  goal,
}: {
  bars: { label: string; value: number }[]
  goal?: number
}) {
  if (bars.length === 0) return <p className="chart-empty">No calorie data in this range</p>

  const maxVal = Math.max(...bars.map(b => b.value), goal ?? 0, 4000)
  const yMax = Math.ceil(maxVal / 1000) * 1000
  const h = 180
  const w = 340
  const padL = 36
  const padR = 8
  const padT = 8
  const padB = 28
  const chartH = h - padT - padB
  const chartW = w - padL - padR
  const barW = Math.min(28, chartW / bars.length - 6)

  const yTicks = [0, yMax / 2, yMax]

  const goalY = goal != null ? padT + chartH - (goal / yMax) * chartH : null

  return (
    <div className="progress-chart-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="progress-bar-chart" aria-hidden>
        {yTicks.map(tick => {
          const y = padT + chartH - (tick / yMax) * chartH
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fill="var(--ink-mute)" fontSize="10">{tick.toLocaleString()}</text>
            </g>
          )
        })}
        {goalY != null && (
          <line
            x1={padL}
            y1={goalY}
            x2={w - padR}
            y2={goalY}
            stroke="var(--coral-start)"
            strokeDasharray="5 4"
            strokeWidth="1.5"
            opacity="0.7"
          />
        )}
        {bars.map((b, i) => {
          const barH = (b.value / yMax) * chartH
          const x = padL + (i + 0.5) * (chartW / bars.length) - barW / 2
          const y = padT + chartH - barH
          const over = goal != null && b.value > goal
          return (
            <g key={b.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(barH, b.value > 0 ? 3 : 0)}
                rx="4"
                fill={over ? 'var(--coral-start)' : 'rgba(255, 55, 95, 0.45)'}
              />
              <text x={x + barW / 2} y={h - 6} textAnchor="middle" fill="var(--ink-mute)" fontSize="9">{b.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
