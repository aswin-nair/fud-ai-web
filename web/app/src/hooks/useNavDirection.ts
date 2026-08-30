import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export type NavDirection = 'forward' | 'back' | 'none'

function historyIndex(): number {
  if (typeof window === 'undefined') return 0
  return (window.history.state as { idx?: number } | null)?.idx ?? 0
}

/**
 * Which way the user just moved, so a screen can enter from the side it came
 * from rather than fading in place.
 *
 * The direction is derived during render, not in an effect: the enter
 * animation starts on the first paint of the new screen, so a direction that
 * arrives afterwards would always be one navigation stale.
 *
 * `useNavigationType` answers this for pushes. For POP it only says "the user
 * moved through history", so the history index — which react-router maintains
 * and which is still the previous value during this render — settles whether
 * that was the back button or the forward one.
 */
export function useNavDirection(): NavDirection {
  const navType = useNavigationType()
  const location = useLocation()
  const lastIdx = useRef(historyIndex())
  const idx = historyIndex()

  let direction: NavDirection = 'none'
  if (navType === 'PUSH') direction = 'forward'
  else if (navType === 'POP') direction = idx < lastIdx.current ? 'back' : 'forward'

  useEffect(() => {
    lastIdx.current = historyIndex()
  }, [location.key])

  return direction
}
