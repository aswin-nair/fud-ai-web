import type { DayRingProgress } from '../lib/dayRing'

// The streak-bearing log is the protected inner arc; optional ambition grows
// outward from it and can never make the inner promise look incomplete.
const SIZES = [52, 72, 92]
const COLORS = ['var(--coral-start)', 'var(--protein)', 'var(--icon-teal)']

export function DayRing({ progress }: { progress: DayRingProgress }) {
  return (
    <section className={`day-ring${progress.complete ? ' complete' : ''}`} aria-label="Your logging day">
      <div className="day-ring-graphic">
        <svg viewBox="0 0 112 112" role="img" aria-label={`${progress.requiredComplete} of ${progress.requiredTotal} chosen steps complete`}>
          {progress.arcs.map((arc, index) => {
            const diameter = SIZES[index]!
            const radius = diameter / 2
            const circumference = Math.PI * diameter
            return (
              <g key={arc.id}>
                <circle className="day-ring-track" cx="56" cy="56" r={radius} />
                <circle
                  className={`day-ring-fill day-ring-fill-${arc.id}`}
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke={COLORS[index]}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={circumference * (1 - Math.min(1, arc.value))}
                />
              </g>
            )
          })}
        </svg>
        <div className="day-ring-center" aria-hidden="true">
          <strong>{progress.complete ? '✓' : `${progress.requiredComplete}/${progress.requiredTotal}`}</strong>
          <span>{progress.complete ? 'day made' : 'your pace'}</span>
        </div>
      </div>
      <div className="day-ring-copy">
        <p className="home-today-kicker">YOUR DAY</p>
        <h2>{progress.complete ? 'You showed up.' : 'Build the day gently.'}</h2>
        <ul className="day-ring-legend">
          {progress.arcs.map((arc, index) => (
            <li key={arc.id} className={arc.value >= 1 ? 'done' : ''}>
              <span className="day-ring-dot" style={{ background: COLORS[index] }} aria-hidden="true" />
              <span>{arc.label}</span>
              <small>{arc.current}/{arc.total}{!arc.required ? ' · optional' : ''}</small>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
