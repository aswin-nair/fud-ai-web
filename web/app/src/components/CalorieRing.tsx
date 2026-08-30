import { useState } from 'react'

import { RING_STROKE_RATIO } from '../lib/tokens'
import { useCountUp } from '../hooks/useCountUp'
import { useFeel } from '../hooks/useHaptic'
import { calorieProgress } from '@fud-ai/domain/nutrition'

/**
 * The hero element on Home, §7.1.
 *
 * The arc animates via a CSS transition on stroke-dashoffset, which means it
 * always moves from wherever it currently is rather than restarting from
 * empty on every render — the single most common bug in this component.
 *
 * Over target draws a second arc on top in --on-track-soft, a lighter tint of
 * the same coral. Per §2.4 that is not a warning: no colour shift, no icon,
 * and the label stays factual.
 */
export interface CalorieRingProps {
  consumed: number
  target: number
  size?: number
  /** Shown under the number when set, e.g. a date other than today. */
  caption?: string
  /**
   * Makes the centre a real button that starts the log flow. Omitted, the ring
   * stays a plain readout — the same component serves History, where there is
   * nothing to log into.
   */
  onLog?: () => void
  /** Label for the centre action. */
  actionLabel?: string
}

export function CalorieRing({
  consumed,
  target,
  size = 200,
  caption,
  onLog,
  actionLabel = 'Tap to log',
}: CalorieRingProps) {
  const feel = useFeel()
  const [pressed, setPressed] = useState(false)
  const strokeWidth = size * RING_STROKE_RATIO
  const radius = size / 2 - strokeWidth / 2
  const circumference = 2 * Math.PI * radius
  const centre = size / 2

  const progressState = calorieProgress(consumed, target)
  const { progress, overflow, isOver, remaining, overBy } = progressState
  const valueText = isOver
    ? `${Math.round(progressState.consumed)} of ${Math.round(progressState.target)} kilocalories, ${overBy} over`
    : `${Math.round(progressState.consumed)} of ${Math.round(progressState.target)} kilocalories, ${remaining} left`

  const shownValue = useCountUp(Math.round(isOver ? overBy : remaining))

  const centreContent = (
    <>
      <strong className={`calorie-ring-value${isOver ? ' is-over' : ''}`}>
        {shownValue.toLocaleString()}
      </strong>
      <span className="calorie-ring-unit">{isOver ? 'kcal over' : 'kcal left'}</span>
      {caption && <span className="calorie-ring-caption">{caption}</span>}
    </>
  )

  return (
    <div
      className="calorie-ring"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label="Calories consumed"
      aria-valuemin={0}
      aria-valuemax={Math.round(progressState.target)}
      aria-valuenow={Math.min(Math.round(progressState.consumed), Math.round(progressState.target))}
      aria-valuetext={valueText}
    >
      <svg width={size} height={size} className="calorie-ring-svg" aria-hidden>
        {/* Rotated so the arc starts at twelve o'clock rather than three. */}
        <g transform={`rotate(-90 ${centre} ${centre})`}>
          <circle
            cx={centre}
            cy={centre}
            r={radius}
            fill="none"
            stroke="var(--paper-deep)"
            strokeWidth={strokeWidth}
          />
          <circle
            className="calorie-ring-arc"
            cx={centre}
            cy={centre}
            r={radius}
            fill="none"
            stroke="var(--on-track)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
          {isOver && (
            <circle
              className="calorie-ring-arc"
              cx={centre}
              cy={centre}
              r={radius}
              fill="none"
              stroke="var(--on-track-soft)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - overflow)}
            />
          )}
        </g>
      </svg>

      {onLog ? (
        <button
          type="button"
          className={`calorie-ring-centre is-actionable clay-squish${pressed ? ' is-pressed' : ''}`}
          onClick={onLog}
          onPointerDown={() => { setPressed(true); feel('press') }}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
          aria-label={`${actionLabel}. ${valueText}`}
        >
          {centreContent}
          <span className="calorie-ring-action">{actionLabel}</span>
        </button>
      ) : (
        <div className="calorie-ring-centre">{centreContent}</div>
      )}
    </div>
  )
}
