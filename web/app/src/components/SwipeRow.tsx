import { useRef, useState, type ReactNode } from 'react'

import { feel } from '../lib/feel'
import { prefersReducedMotion } from '../lib/feel'

const OPEN_PX = 148
/* Past this much horizontal movement the gesture is a swipe, not a scroll. */
const DIRECTION_LOCK_PX = 8

export interface SwipeAction {
  label: string
  onAct: () => void
  tone?: 'neutral' | 'danger'
}

/**
 * A row that reveals actions when dragged left.
 *
 * Two things this deliberately does NOT do:
 *
 *  - It never becomes the only way to reach an action. The buttons are real
 *    buttons, present in the DOM at all times, so keyboard and screen-reader
 *    users get them without performing a gesture they cannot perform.
 *  - It never hijacks vertical scrolling. `touch-action: pan-y` leaves the
 *    browser owning the vertical axis, and the horizontal drag only engages
 *    once the pointer has clearly committed sideways.
 */
export function SwipeRow({
  children,
  actions,
  label,
}: {
  children: ReactNode
  actions: SwipeAction[]
  label: string
}) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ x: number; y: number } | null>(null)
  const axis = useRef<'none' | 'x' | 'y'>('none')

  const open = offset <= -OPEN_PX / 2

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY }
    axis.current = 'none'
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y

    if (axis.current === 'none') {
      if (Math.abs(dy) > DIRECTION_LOCK_PX && Math.abs(dy) > Math.abs(dx)) {
        // The user is scrolling. Stand down for the rest of this gesture.
        axis.current = 'y'
        return
      }
      if (Math.abs(dx) > DIRECTION_LOCK_PX) {
        axis.current = 'x'
        setDragging(true)
        e.currentTarget.setPointerCapture?.(e.pointerId)
      } else {
        return
      }
    }
    if (axis.current !== 'x') return

    const base = open ? -OPEN_PX : 0
    // Rubber-band past the ends so the row never feels stuck or over-travelled.
    const next = Math.max(-OPEN_PX - 24, Math.min(0, base + dx))
    setOffset(next)
  }

  function onPointerUp() {
    if (axis.current === 'x') {
      const shouldOpen = offset < -OPEN_PX / 2
      setOffset(shouldOpen ? -OPEN_PX : 0)
      if (shouldOpen !== open) feel('tap')
    }
    start.current = null
    axis.current = 'none'
    setDragging(false)
  }

  return (
    <div className="swipe-row" data-open={open || undefined}>
      <div className="swipe-row-actions" aria-label={`Actions for ${label}`}>
        {actions.map(a => (
          <button
            key={a.label}
            type="button"
            className={`swipe-row-action${a.tone === 'danger' ? ' is-danger' : ''}`}
            onClick={() => {
              feel(a.tone === 'danger' ? 'press' : 'tap')
              setOffset(0)
              a.onAct()
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div
        className="swipe-row-face"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging || prefersReducedMotion()
            ? 'none'
            : 'transform 0.24s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}
      </div>
    </div>
  )
}
