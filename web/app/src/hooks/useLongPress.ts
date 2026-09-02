import { useRef } from 'react'

import { feel } from '../lib/feel'

const HOLD_MS = 480
/* Moving further than this means the user is scrolling, not holding. */
const MOVE_TOLERANCE_PX = 10

/**
 * Press-and-hold, paired with the context-menu gesture.
 *
 * A long press is invisible and not everyone can perform one, so whatever this
 * opens must also be reachable another way — `onContextMenu` covers right-click
 * and the keyboard Menu key, and the element's ordinary click still does the
 * plain thing.
 */
export function useLongPress(onHold: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  const clear = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    origin.current = null
  }

  return {
    /** True when the hold just fired, so the click that follows can be ignored. */
    consumed: () => {
      if (!fired.current) return false
      fired.current = false
      return true
    },
    handlers: {
      onPointerDown(e: React.PointerEvent) {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        origin.current = { x: e.clientX, y: e.clientY }
        fired.current = false
        timer.current = setTimeout(() => {
          fired.current = true
          feel('press')
          onHold()
        }, HOLD_MS)
      },
      onPointerMove(e: React.PointerEvent) {
        if (!origin.current) return
        const dx = Math.abs(e.clientX - origin.current.x)
        const dy = Math.abs(e.clientY - origin.current.y)
        if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) clear()
      },
      onPointerUp: clear,
      onPointerCancel: clear,
      onContextMenu(e: React.MouseEvent) {
        e.preventDefault()
        clear()
        fired.current = true
        onHold()
      },
    },
  }
}
