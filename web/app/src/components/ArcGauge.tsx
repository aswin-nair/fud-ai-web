import type { ReactNode } from 'react'

interface ArcGaugeProps {
  /** 0–1 */
  progress: number
  segments?: number
  /** total sweep of the arc, in degrees */
  arcDegrees?: number
  filledColor?: string
  trackColor?: string
  strokeWidth?: number
  className?: string
  children?: ReactNode
}

const SIZE = 240
const CX = SIZE / 2
const CY = 122
const R = 94

function toXY(angleDeg: number, cx: number, cy: number, r: number) {
  const a = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

/**
 * Segmented radial dial (rounded pill segments across a wide arc), replacing
 * the old continuous ring. Angle convention here is screen-space (y grows
 * down), so increasing degrees sweeps clockwise starting from 3 o'clock.
 * The arc is centered on the bottom (90deg) with a gap there, opening like
 * an arch through the top of the circle.
 */
export function ArcGauge({
  progress,
  segments = 12,
  arcDegrees = 218,
  filledColor = 'var(--coral)',
  trackColor = 'var(--rule-strong)',
  strokeWidth = 15,
  className,
  children,
}: ArcGaugeProps) {
  const clamped = Math.max(0, Math.min(1, progress))
  const gapDeg = 360 - arcDegrees
  const startAngle = 90 + gapDeg / 2
  const gapBetween = 3
  const anglePer = (arcDegrees - gapBetween * (segments - 1)) / segments
  const filledCount = Math.round(clamped * segments)

  return (
    <div className={`arc-gauge${className ? ` ${className}` : ''}`}>
      <svg viewBox={`0 0 ${SIZE} 172`} className="arc-gauge-svg" aria-hidden>
        {Array.from({ length: segments }).map((_, i) => {
          const segStart = startAngle + i * (anglePer + gapBetween)
          const segEnd = segStart + anglePer
          const start = toXY(segStart, CX, CY, R)
          const end = toXY(segEnd, CX, CY, R)
          const filled = i < filledCount
          return (
            <path
              key={i}
              d={`M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`}
              fill="none"
              stroke={filled ? filledColor : trackColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="arc-gauge-segment"
            />
          )
        })}
      </svg>
      <div className="arc-gauge-center">{children}</div>
    </div>
  )
}
