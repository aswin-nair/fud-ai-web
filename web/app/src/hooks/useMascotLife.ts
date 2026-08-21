import { useEffect, useRef } from 'react'

import { prefersReducedMotion } from '../lib/tokens'

/** How far the eyes may travel, in viewBox units (the art is 100 wide). */
const EYE_TRAVEL = 2.6
/** How far the body may lean, in degrees. */
const LEAN = 2.2
/** Pointer distance, in element half-widths, at which it notices you. */
const NOTICE_RADIUS = 6
/** Beyond this, the eyes stay pinned on you rather than easing off. */
const LOCK_RADIUS = 2.4
/** How long the pointer must be still before it starts looking around. */
const IDLE_AFTER_MS = 2600

/**
 * What makes the character read as present rather than decorative.
 *
 * Three things, none of which involve a number: the eyes follow the pointer,
 * the body leans very slightly toward it, and it perks up when you come close.
 * §2.5 is untouched — this responds to where a finger is, never to what was
 * eaten.
 *
 * Written through CSS custom properties on the root node rather than React
 * state. Re-rendering a component on every pointermove is how you turn a
 * charming detail into a dropped frame on a cheap phone.
 */
export function useMascotLife<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node || prefersReducedMotion()) return

    let frame = 0
    let pending: { x: number; y: number } | null = null

    function apply() {
      frame = 0
      const el = ref.current
      if (!el || !pending) return

      const box = el.getBoundingClientRect()
      if (!box.width) return

      const cx = box.left + box.width / 2
      const cy = box.top + box.height / 2
      const dx = (pending.x - cx) / (box.width / 2)
      const dy = (pending.y - cy) / (box.height / 2)

      // Beyond LOCK_RADIUS the eyes are fully deflected: it keeps looking at
      // you rather than losing interest with distance.
      const dist = Math.hypot(dx, dy)
      const reach = Math.min(1, dist / LOCK_RADIUS)
      const unit = reach === 0 ? 0 : reach / Math.max(dist, 0.0001)

      el.style.setProperty('--gaze-x', `${(dx * unit * EYE_TRAVEL).toFixed(2)}`)
      el.style.setProperty('--gaze-y', `${(dy * unit * EYE_TRAVEL).toFixed(2)}`)
      el.style.setProperty('--lean', `${(dx * unit * LEAN).toFixed(2)}deg`)
      el.classList.toggle('is-noticing', dist < NOTICE_RADIUS)
    }

    function onMove(event: PointerEvent) {
      lastMove = Date.now()
      pending = { x: event.clientX, y: event.clientY }
      if (!frame) frame = requestAnimationFrame(apply)
    }

    /**
     * Phones have no hover, so without this the eyes would sit dead centre for
     * most people. When the pointer has been quiet it looks around on its own.
     */
    function wander() {
      const el = ref.current
      if (!el) return
      if (Date.now() - lastMove < IDLE_AFTER_MS) return

      const angle = Math.random() * Math.PI * 2
      const reach = 0.45 + Math.random() * 0.55
      el.style.setProperty('--gaze-x', (Math.cos(angle) * EYE_TRAVEL * reach).toFixed(2))
      el.style.setProperty('--gaze-y', (Math.sin(angle) * EYE_TRAVEL * reach).toFixed(2))
      el.style.setProperty('--lean', `${(Math.cos(angle) * LEAN * reach * 0.6).toFixed(2)}deg`)
    }

    /** Look back to centre when the pointer leaves entirely. */
    function onLeave() {
      const el = ref.current
      if (!el) return
      el.style.setProperty('--gaze-x', '0')
      el.style.setProperty('--gaze-y', '0')
      el.style.setProperty('--lean', '0deg')
      el.classList.remove('is-noticing')
    }

    let lastMove = 0
    const wanderTimer = setInterval(wander, 1900)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)

    // Blinks are not metronomic. A random gap is most of what sells them.
    let blinkTimer: ReturnType<typeof setTimeout>
    function scheduleBlink() {
      blinkTimer = setTimeout(() => {
        const el = ref.current
        if (el) {
          el.classList.add('is-blinking')
          setTimeout(() => el?.classList.remove('is-blinking'), 160)
        }
        scheduleBlink()
      }, 2200 + Math.random() * 4200)
    }
    scheduleBlink()

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
      if (frame) cancelAnimationFrame(frame)
      clearInterval(wanderTimer)
      clearTimeout(blinkTimer)
    }
  }, [])

  return ref
}
