import { useRef, useState, type ReactNode } from 'react'

import { feel } from '../lib/feel'
import { prefersReducedMotion } from '../lib/feel'
import { Momo } from './Momo'

const TRIGGER_PX = 72
const MAX_PULL_PX = 110

type Phase = 'idle' | 'pulling' | 'ready' | 'refreshing'

/**
 * Pull down at the top of the page to refresh, with Momo as the indicator.
 *
 * Only engages when the scroller is already at the top and the drag is clearly
 * vertical, so it never competes with ordinary scrolling or with the
 * horizontal swipe on a meal row.
 */
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>
  children: ReactNode
}) {
  const [pull, setPull] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const start = useRef<{ x: number; y: number } | null>(null)
  const engaged = useRef(false)

  const atTop = () => (window.scrollY || document.documentElement.scrollTop || 0) <= 0

  function onPointerDown(e: React.PointerEvent) {
    if (phase === 'refreshing') return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (!atTop()) return
    start.current = { x: e.clientX, y: e.clientY }
    engaged.current = false
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!start.current || phase === 'refreshing') return
    const dy = e.clientY - start.current.y
    const dx = e.clientX - start.current.x

    if (!engaged.current) {
      // A sideways drag belongs to the swipe rows; an upward one is a scroll.
      if (Math.abs(dx) > Math.abs(dy) || dy < 6) { start.current = null; return }
      if (!atTop()) { start.current = null; return }
      engaged.current = true
    }

    // Resistance, so the sheet follows the finger without matching it.
    const eased = Math.min(MAX_PULL_PX, dy * 0.5)
    setPull(eased)
    const next = eased >= TRIGGER_PX ? 'ready' : 'pulling'
    if (next !== phase) {
      if (next === 'ready') feel('tap')
      setPhase(next)
    }
  }

  async function onPointerUp() {
    start.current = null
    if (!engaged.current) return
    engaged.current = false

    if (phase === 'ready') {
      setPhase('refreshing')
      setPull(TRIGGER_PX)
      feel('select')
      try {
        await onRefresh()
      } finally {
        setPull(0)
        setPhase('idle')
      }
    } else {
      setPull(0)
      setPhase('idle')
    }
  }

  const smooth = phase !== 'pulling' && phase !== 'ready'

  return (
    <div
      className="ptr"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className={`ptr-indicator phase-${phase}`}
        style={{ height: pull, opacity: pull > 0 ? 1 : 0 }}
        aria-hidden={phase !== 'refreshing'}
      >
        <div
          className="ptr-momo"
          style={{
            transform: `scale(${Math.min(1, 0.4 + pull / TRIGGER_PX * 0.6)})`,
            transition: prefersReducedMotion() ? 'none' : undefined,
          }}
        >
          <Momo mood={phase === 'ready' || phase === 'refreshing' ? 'excited' : 'neutral'} />
        </div>
      </div>
      <div
        className="ptr-content"
        style={{
          transform: `translateY(${pull}px)`,
          transition: smooth && !prefersReducedMotion()
            ? 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
            : 'none',
        }}
      >
        {children}
      </div>
      <span className="sr-only" role="status">
        {phase === 'refreshing' ? 'Refreshing' : ''}
      </span>
    </div>
  )
}
