import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { Mascot, type MascotState } from './Mascot'
import { MascotSay } from './MascotSay'
import { pokeLine } from '../lib/mascotVoice'
import { prefersReducedMotion } from '../lib/tokens'

/**
 * The companion that turns up around the app.
 *
 * Rules it obeys, because an ambient character that ignores them stops being
 * charming within a day:
 *  - It never covers the primary action or the nav. Spots are chosen from a
 *    small set of safe edges, all above the dock and clear of the CTA.
 *  - It shows up, says one thing, and leaves on its own.
 *  - It can be dismissed, and dismissal is remembered for the session.
 *  - It stays away from screens where the user is concentrating — the log
 *    flow, onboarding, and anything about support.
 *  - Under reduced motion it appears without sliding.
 */
const SAFE_SPOTS = [
  { top: '18%', left: '6%' },
  { top: '26%', right: '6%' },
  { top: '46%', left: '5%' },
  { top: '54%', right: '5%' },
  { top: '36%', right: '8%' },
] as const

/** Screens where an interrupting character would be unwelcome. */
const QUIET_ROUTES = [
  '/log',
  '/onboarding',
  '/login',
  '/support',
  '/review',
  '/edit',
  '/settings',
]

const FIRST_APPEARANCE_MS = 9000
const BETWEEN_MS = 26000
const VISIBLE_MS = 6400
const DISMISS_KEY = 'fud-roamer-dismissed'

export function MascotRoamer({ state = 'idle' }: { state?: MascotState }) {
  const location = useLocation()
  const [spot, setSpot] = useState<(typeof SAFE_SPOTS)[number] | null>(null)
  const [pokes, setPokes] = useState(0)
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1',
  )
  const seen = useRef(0)

  const quiet = QUIET_ROUTES.some(route => location.pathname.startsWith(route))

  /*
   * Arriving and leaving are two effects on purpose.
   *
   * Scheduling the hide inside the show would tear itself down: setting `spot`
   * changes this effect's own dependency, cleanup runs, and it clears the very
   * timer it just set — so the roamer would arrive and never leave.
   */
  useEffect(() => {
    if (dismissed || quiet || spot) return

    const show = setTimeout(() => {
      setPokes(0)
      setSpot(SAFE_SPOTS[seen.current % SAFE_SPOTS.length]!)
      seen.current += 1
    }, seen.current === 0 ? FIRST_APPEARANCE_MS : BETWEEN_MS)

    return () => clearTimeout(show)
  }, [dismissed, quiet, spot, location.pathname])

  /** Keyed to the spot itself, so nothing upstream can cancel the exit. */
  useEffect(() => {
    if (!spot) return

    const hide = setTimeout(() => setSpot(null), VISIBLE_MS)
    return () => clearTimeout(hide)
  }, [spot])

  /** A route the character should stay out of clears it immediately. */
  useEffect(() => {
    if (quiet || dismissed) setSpot(null)
  }, [quiet, dismissed])

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
    setSpot(null)
  }

  if (!spot || dismissed) return null

  return (
    <div
      className={`mascot-roamer${prefersReducedMotion() ? '' : ' is-arriving'}`}
      style={spot}
    >
      <div className="mascot-roamer-bubble">
        <MascotSay
          state={state}
          seed={seen.current}
          line={pokes > 0 ? pokeLine(state, pokes) : undefined}
        />
        <button
          type="button"
          className="mascot-roamer-close"
          onClick={dismiss}
          aria-label="Hide the mascot for now"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <Mascot state={state} size={56} onPoke={() => setPokes(n => n + 1)} />
    </div>
  )
}
