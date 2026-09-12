import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { useReducedMotion } from 'motion/react'

/** Matches the .wp-cut transition in welcome-poster.css. */
const CUT_MS = 320

/**
 * Leaving the welcome page for the app plays a short full-screen cut first.
 * New-tab clicks, modified clicks and reduced motion go straight through.
 */
export function useCutNavigation() {
  const reduced = useReducedMotion()
  const [cutting, setCutting] = useState(false)
  const timer = useRef(0)

  useEffect(() => {
    // Coming back through the browser's page cache must not leave the page covered.
    const reset = () => {
      window.clearTimeout(timer.current)
      setCutting(false)
    }
    window.addEventListener('pageshow', reset)
    return () => {
      window.removeEventListener('pageshow', reset)
      window.clearTimeout(timer.current)
    }
  }, [])

  const onNavigate = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (reduced || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const { href, target } = event.currentTarget
    if (target && target !== '_self') return
    event.preventDefault()
    setCutting(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => window.location.assign(href), CUT_MS)
  }, [reduced])

  return { cutting, onNavigate }
}
