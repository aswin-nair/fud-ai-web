import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { localDayKey } from '../lib/dates'
import { getStreakWithFreezes } from '../lib/journey'
import { prefersReducedMotion } from '../lib/tokens'
import { useAnchorRegistry } from './anchors'
import {
  deriveMood,
  screenFromPath,
  type ActivityLevel,
  type BehaviorKey,
  type Mood,
} from './behaviors'
import { behaviorByKey, pickAmbient, restPosition, scheduleDelay, targetFromRect } from './controller'
import { pokeAct } from '../lib/mascotVoice'

const SIZE = 88
const MOVE_MS = 600

let handle: { react(key: BehaviorKey): void } | null = null
export function mascotReact(key: BehaviorKey): void {
  handle?.react(key)
}

/**
 * Momo.
 *
 * A dumpling rather than a blob: the pleated crown gives a silhouette you can
 * recognise at 20px, and dough is the one material where squash-and-stretch is
 * literally true, so the poke animations read as the character rather than as
 * an effect applied to it.
 */
function Dumpling({ mood, pose }: { mood: Mood; pose: string }) {
  const blush = mood === 'excited' || mood === 'proud' || mood === 'cozy'
  const blinking = pose === 'idle_blink'
  const eyeR = blinking ? 1.1 : 5

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id="momo-dough" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#FFF6E4" />
          <stop offset="100%" stopColor="#E9C89A" />
        </linearGradient>
      </defs>

      <ellipse cx="50" cy="93" rx="26" ry="4.5" fill="#3A2A22" opacity="0.13" />

      {/* Stub arms, behind the body so every join stays soft. */}
      <path d="M22 76 Q14 84 22 88" stroke="#E4BE8C" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M78 76 Q86 84 78 88" stroke="#E4BE8C" strokeWidth="7" fill="none" strokeLinecap="round" />

      <ellipse cx="50" cy="60" rx="35" ry="30" fill="url(#momo-dough)" />
      {/* The light sits top-left, matching every other surface in the app. */}
      <ellipse cx="42" cy="45" rx="17" ry="8" fill="#FFFFFF" opacity="0.55" />

      {/* Real pleats — the one detail that makes it a dumpling and not a bun. */}
      <path
        d="M16 48q8.5-14 17 0 8.5-14 17 0 8.5-14 17 0 8.5-14 17 0"
        fill="none"
        stroke="#E4BE8C"
        strokeWidth="4.6"
        strokeLinecap="round"
      />

      <circle cx="39" cy="59" r={eyeR} fill="#3A2A22" />
      <circle cx="61" cy="59" r={eyeR} fill="#3A2A22" />
      {!blinking && <circle cx="40.8" cy="57.2" r="1.7" fill="#FFFFFF" />}
      {!blinking && <circle cx="62.8" cy="57.2" r="1.7" fill="#FFFFFF" />}

      {blush && <ellipse cx="30" cy="68" rx="5" ry="3.4" fill="#FF9070" opacity="0.42" />}
      {blush && <ellipse cx="70" cy="68" rx="5" ry="3.4" fill="#FF9070" opacity="0.42" />}

      <path
        d={mood === 'sleepy' ? 'M44 70h12' : 'M44 70a6.5 6.5 0 0 0 12 0'}
        fill="none"
        stroke="#3A2A22"
        strokeWidth="3.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MascotOverlay() {
  const { state } = useApp()
  const location = useLocation()
  const anchors = useAnchorRegistry()
  const hostRef = useRef<HTMLDivElement>(null)
  const lastInteraction = useRef(Date.now())
  const currentRef = useRef<{ key: BehaviorKey; endsAt: number } | null>(null)
  const cooldowns = useRef(new Map<BehaviorKey, number>())
  const timerRef = useRef<number | null>(null)
  const [pose, setPose] = useState<BehaviorKey>('idle_breathe')
  const [mood, setMood] = useState<Mood>('neutral')
  const [paused, setPaused] = useState(false)
  const [says, setSays] = useState<string | null>(null)
  const pokes = useRef(0)
  const sayTimer = useRef<number | null>(null)

  const screen = screenFromPath(location.pathname)
  const activity = (state.gamification.mascotActivity ?? 'lively') as ActivityLevel
  const streak = getStreakWithFreezes(
    state.foodEntries,
    state.gamification.freezeUsedDates,
    state.gamification.pauseProtectedDates,
  )
  const accountAgeDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(state.gamification.startedAt || Date.now()).getTime()) / 86400_000),
  )
  const reduced = prefersReducedMotion() || activity === 'off'
  const quiet = screen === 'insights' || location.pathname.startsWith('/support') || location.pathname.startsWith('/onboarding')

  const place = useCallback((x: number, y: number, ms = MOVE_MS) => {
    const host = hostRef.current
    if (!host) return
    host.style.transition = reduced ? 'none' : `transform ${ms}ms cubic-bezier(.34,1.4,.64,1)`
    host.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }, [reduced])

  const play = useCallback((key: BehaviorKey) => {
    const behavior = behaviorByKey(key)
    if (!behavior) return
    if (behavior.anchor && anchors) {
      const rect = anchors.getRect(behavior.anchor)
      if (!rect) return
      const next = targetFromRect(rect, SIZE)
      place(next.x, next.y)
    }
    currentRef.current = { key, endsAt: Date.now() + behavior.durationMs }
    cooldowns.current.set(key, Date.now() + behavior.cooldownMs)
    setPose(key)
  }, [anchors, place])

  const react = useCallback((key: BehaviorKey) => {
    lastInteraction.current = Date.now()
    if (reduced || paused) return
    play(key)
  }, [play, reduced, paused])

  useEffect(() => {
    handle = { react }
    return () => { if (handle?.react === react) handle = null }
  }, [react])

  useEffect(() => {
    const rest = restPosition(SIZE)
    place(rest.x, rest.y, 0)
  }, [place])

  useEffect(() => {
    const touch = () => { lastInteraction.current = Date.now() }
    window.addEventListener('pointerdown', touch, { passive: true })
    window.addEventListener('keydown', touch, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', touch)
      window.removeEventListener('keydown', touch)
    }
  }, [])

  useEffect(() => {
    const check = () => {
      const keyboard = window.visualViewport
        ? window.innerHeight - window.visualViewport.height > 120
        : false
      const modal = Boolean(document.querySelector('[role="dialog"][aria-modal="true"], [role="dialog"].celebrate-overlay'))
      setPaused(keyboard || modal)
    }
    check()
    window.visualViewport?.addEventListener('resize', check)
    const obs = new MutationObserver(check)
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    return () => {
      window.visualViewport?.removeEventListener('resize', check)
      obs.disconnect()
    }
  }, [])

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    // `reduced` already covers activity === 'off' — see where it is defined.
    if (reduced || paused || quiet) return
    const tick = () => {
      const delay = scheduleDelay(accountAgeDays, activity)
      if (!Number.isFinite(delay)) return
      timerRef.current = window.setTimeout(() => {
        const ctx = {
          screen,
          mood,
          hour: new Date().getHours(),
          streak,
          accountAgeDays,
          idleSeconds: (Date.now() - lastInteraction.current) / 1000,
          hasAnchor: (id: Parameters<NonNullable<typeof anchors>['has']>[0]) => anchors?.getRect(id) != null,
        }
        setMood(deriveMood(ctx))
        if (!currentRef.current || currentRef.current.endsAt <= Date.now()) {
          const next = pickAmbient(ctx, cooldowns.current, Date.now())
          if (next) play(next.key)
          else setPose('idle_breathe')
        }
        tick()
      }, delay)
    }
    tick()
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [accountAgeDays, activity, anchors, mood, paused, play, quiet, reduced, screen, streak])

  useEffect(() => {
    if (screen === 'log') react('sniff_plate')
    else react('enter')
  }, [screen]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * A poke plays the next beat of the repertoire and says the line written for
   * it. The count is deliberately not reset by time — walking away and coming
   * back mid-sulk is funnier than a character that forgets.
   */
  const poke = useCallback(() => {
    pokes.current += 1
    const act = pokeAct(pokes.current)
    react(act.pose)
    setSays(act.line)
    if (sayTimer.current) window.clearTimeout(sayTimer.current)
    sayTimer.current = window.setTimeout(() => setSays(null), 3200)
  }, [react])

  useEffect(() => () => {
    if (sayTimer.current) window.clearTimeout(sayTimer.current)
  }, [])

  if (activity === 'off') return null

  return (
    <div className="mascot-overlay" aria-hidden="true">
      <div
        ref={hostRef}
        className={`mascot-host pose-${pose} mood-${mood}${reduced ? ' is-static' : ''}`}
        onPointerDown={(event) => {
          event.stopPropagation()
          poke()
        }}
      >
        <Dumpling mood={mood} pose={pose} />
      </div>
      {says && <p className="mascot-quip">{says}</p>}
    </div>
  )
}

export function accountAgeFrom(startedAt: string, today = localDayKey(new Date())): number {
  const start = startedAt.slice(0, 10)
  if (!start) return 0
  return Math.max(0, Math.floor((Date.parse(`${today}T12:00:00`) - Date.parse(`${start}T12:00:00`)) / 86400_000))
}
