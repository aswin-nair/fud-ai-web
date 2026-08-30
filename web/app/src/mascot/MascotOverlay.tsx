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
import { Momo } from '../components/Momo'

const SIZE = 88
const MOVE_MS = 600

let handle: { react(key: BehaviorKey): void } | null = null
export function mascotReact(key: BehaviorKey): void {
  handle?.react(key)
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
  const quiet = screen === 'insights'
    || location.pathname.startsWith('/support')
    || location.pathname.startsWith('/onboarding')
    || location.pathname.startsWith('/log')
    || location.pathname.startsWith('/settings')
    || location.pathname.startsWith('/edit')
    || location.pathname.startsWith('/review')

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

  /* `quiet` previously only stopped him scheduling new behaviours — he stayed
     on screen regardless, which is why he sat on top of the log options and
     the support page. A quiet screen means gone, not just still. */
  if (activity === 'off' || quiet) return null

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
        <Momo mood={mood} pose={pose} cosmeticId={state.gamification.equippedCosmeticId} />
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
