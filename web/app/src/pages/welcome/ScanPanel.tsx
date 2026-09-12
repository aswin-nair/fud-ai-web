import { useState, type CSSProperties } from 'react'
import { useCountUp } from '../../hooks/useCountUp'
import { PlateArt } from './PlateArt'
import { mealKcal, SAMPLE_MEALS } from './meals'

const VERTICALS = [50, 100, 150, 200, 250, 300, 350, 400, 450]
const HORIZONTALS = [50, 100, 150, 200, 250, 300, 350]
/** The 400 × 400 plate is drawn at 90% inside the 500 × 400 scan stage. */
const PLATE_X = 70
const PLATE_Y = 20
const PLATE_SCALE = 0.9

/** The hero: a sample plate gets "read" into labelled foods and a calorie total. */
export function ScanPanel() {
  const [index, setIndex] = useState(0)
  const meal = SAMPLE_MEALS[index]
  const total = mealKcal(meal)
  const kcal = useCountUp(total, 650)

  return (
    <figure className="wp-scan">
      <figcaption className="wp-scan-bar">
        <span>Scan {String(index + 1).padStart(2, '0')} — {meal.name}</span>
        <span>Sample estimate</span>
      </figcaption>

      {/* Keyed by meal so the scan replays each time a plate is chosen. */}
      <div className="wp-scan-stage" key={meal.id} aria-hidden="true">
        <svg className="wp-scan-svg" viewBox="0 0 500 400">
          <PlateArt meal={meal.id} x={PLATE_X} y={PLATE_Y} width={400 * PLATE_SCALE} height={400 * PLATE_SCALE} />
          <g className="wp-scan-grid">
            {VERTICALS.map((x, i) => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="400" style={{ '--i': i } as CSSProperties} />)}
            {HORIZONTALS.map((y, i) => <line key={`h${y}`} x1="0" y1={y} x2="500" y2={y} style={{ '--i': i + VERTICALS.length } as CSSProperties} />)}
          </g>
          <g className="wp-scan-corners">
            <path d="M14 44V14H44" /><path d="M456 14H486V44" /><path d="M14 356V386H44" /><path d="M486 356V386H456" />
          </g>
          {meal.items.map((item, i) => (
            <g key={item.label} transform={`translate(${PLATE_X + item.x * PLATE_SCALE} ${PLATE_Y + item.y * PLATE_SCALE})`}>
              <g className="wp-scan-marker" style={{ '--i': i } as CSSProperties}>
                <circle r="16" />
                <text>{i + 1}</text>
              </g>
            </g>
          ))}
        </svg>
        <span className="wp-scan-sweep" />
      </div>

      <ol className="wp-scan-legend" key={`legend-${meal.id}`}>
        {meal.items.map((item, i) => (
          <li key={item.label} style={{ '--i': i } as CSSProperties}>
            <span className="wp-scan-num">{i + 1}</span>
            <span className="wp-scan-item">{item.label}</span>
            <span className="tabular">{item.kcal} kcal</span>
          </li>
        ))}
      </ol>

      <div className="wp-scan-total">
        <strong className="tabular" aria-hidden="true">{kcal}</strong>
        <span aria-hidden="true">kcal<br />estimated</span>
        <ul className="wp-scan-macros" aria-label="Macros">
          <li>P {meal.protein} g</li>
          <li>C {meal.carbs} g</li>
          <li>F {meal.fat} g</li>
        </ul>
        <p className="sr-only" aria-live="polite" aria-atomic="true">{`${meal.name}: about ${total} kcal.`}</p>
      </div>

      <div className="wp-scan-picker" role="group" aria-label="Scan a sample meal">
        {SAMPLE_MEALS.map((option, i) => (
          <button key={option.id} type="button" aria-pressed={i === index} onClick={() => setIndex(i)}>
            <PlateArt meal={option.id} className="wp-scan-thumb" />
            <span>{option.short}</span>
          </button>
        ))}
      </div>
    </figure>
  )
}
