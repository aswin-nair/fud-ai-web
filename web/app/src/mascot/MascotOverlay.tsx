import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import {
  behaviorByKey,
  pickAmbient,
  restPosition,
  scheduleDelay,
  shouldVolunteerTaunt,
  targetFromRect,
} from './controller'
import {
  daysSincePreviousLog,
  momoLine,
  pokeAct,
  tauntAct,
  TAUNT_POSES,
  type MascotState,
} from '../lib/mascotVoice'
import { recentLines, rememberLine, sessionVariant } from '../lib/mascotMemory'
import { dayRingProgress } from '../lib/dayRing'
import { Momo } from '../components/Momo'
import {
  generateMascotLines,
  mascotDayPart,
  mascotStreakStage,
  type MascotAIContext,
  type MascotAIEvent,
} from '../lib/mascotAI'

const SIZE = 88
const MOVE_MS = 600
/** A mascot that comments every time he moves is a mascot you turn off. */
const SPEAK_COOLDOWN_MS = 45_000

let handle: {
  react(key: BehaviorKey): void
  event(event: MascotAIEvent): void
} | null = null
let queuedEvent: MascotAIEvent | null = null
export function mascotReact(key: BehaviorKey): void {
  handle?.react(key)
}

/**
 * Let any screen tell Momo what kind of moment just happened without exposing
 * the screen's text, nutrition data or provider error. The event label is the
 * entire cross-feature AI surface.
 */
export function mascotEvent(event: MascotAIEvent): void {
  if (handle) handle.event(event)
  else queuedEvent = event
}

const EVENT_FALLBACKS: Record<Exclude<MascotAIEvent, 'ambient' | 'poke'>, string> = {
  log_success: 'Logged. Administrative excellence looks good on you.',
  milestone: 'That is consistency with suspiciously good timing.',
  form_fumble: 'Tiny form rebellion. Very dramatic.',
  ai_fumble: 'The robots have misplaced the plot. Again.',
  empty_search: 'The search found nothing and seems oddly proud of itself.',
  comeback: 'There you are. I kept your corner warm.',
  ring_complete: 'The day is neatly tied up. Lovely work.',
}

function aiCacheKey(context: MascotAIContext): string {
  return [
    context.event,
    context.screen,
    context.mood,
    context.dayPart,
    context.streakStage,
    context.presence,
    context.personality,
    context.pokeStage ?? 'none',
  ].join('|')
}

export function MascotOverlay() {
  const { state } = useApp()
  const location = useLocation()
  const anchors = useAnchorRegistry()
  const hostRef = useRef<HTMLButtonElement>(null)
  const lastInteraction = useRef(Date.now())
  const currentRef = useRef<{ key: BehaviorKey; endsAt: number } | null>(null)
  const cooldowns = useRef(new Map<BehaviorKey, number>())
  const timerRef = useRef<number | null>(null)
  const [pose, setPose] = useState<BehaviorKey>('idle_breathe')
  const [poseRun, setPoseRun] = useState(0)
  const [mood, setMood] = useState<Mood>('neutral')
  const [paused, setPaused] = useState(false)
  const [says, setSays] = useState<string | null>(null)
  const [thinking, setThinking] = useState(false)
  const pokes = useRef(0)
  const sayTimer = useRef<number | null>(null)
  const lastSpokeAt = useRef(0)
  const aiPools = useRef(new Map<string, string[]>())
  const aiRequests = useRef(new Map<string, Promise<string[]>>())
  const aiControllers = useRef(new Set<AbortController>())
  const thinkingCount = useRef(0)

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

  /* Logging-derived context only — see the note on BehaviorContext. Nothing
     below reads a calorie, a macro or a target. */
  const todayKey = localDayKey(new Date())
  const todayEntries = state.foodEntries.filter(e => localDayKey(new Date(e.timestamp)) === todayKey)
  const loggedToday = todayEntries.length > 0
  const ringComplete = dayRingProgress(
    todayEntries,
    state.gamification.notesByDate[todayKey] ?? 0,
    state.profile.loggingCommitment ?? 'light',
  ).complete
  const loggedDayKeys = useMemo(
    () => [...new Set(state.foodEntries.map(e => localDayKey(new Date(e.timestamp))))],
    [state.foodEntries],
  )

  /* Same derivation as Home, and the same §3.5 rule: logging and streak decide
     the tone, never the calorie total. */
  const voiceState: MascotState = state.profile.trackingPaused
    ? 'neutral'
    : !loggedToday
      ? 'sleepy'
      : [7, 30, 100].includes(streak)
        ? 'proud'
        : 'idle'
  const reduced = prefersReducedMotion() || activity === 'off'
  const quiet = location.pathname.startsWith('/support')
    || location.pathname.startsWith('/onboarding')
    || location.pathname.startsWith('/settings')
    || location.pathname.startsWith('/coach')
  const aiEnabled = Boolean(
    state.aiSettings.apiKey.trim()
    && state.aiSettings.mascotEnabled !== false,
  )

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
    // A one-shot CSS animation does not restart when React receives the same
    // pose string twice. Remount only the performance wrapper so two waves in
    // different taunts both visibly wave.
    setPoseRun(run => run + 1)
  }, [anchors, place])

  const react = useCallback((key: BehaviorKey) => {
    lastInteraction.current = Date.now()
    if (reduced || paused) return
    play(key)
  }, [play, reduced, paused])

  const say = useCallback((line: string) => {
    setSays(line)
    if (sayTimer.current) window.clearTimeout(sayTimer.current)
    sayTimer.current = window.setTimeout(() => setSays(null), 3200)
  }, [])

  const contextFor = useCallback((event: MascotAIEvent, pokeStage?: MascotAIContext['pokeStage']): MascotAIContext => {
    const hour = new Date().getHours()
    return {
      event,
      screen,
      mood,
      dayPart: mascotDayPart(hour),
      streakStage: mascotStreakStage(streak),
      presence: ringComplete ? 'day_complete' : loggedToday ? 'showed_up' : 'nothing_logged',
      personality: state.aiSettings.mascotPersonality ?? 'sassy',
      pokeStage,
    }
  }, [loggedToday, mood, ringComplete, screen, state.aiSettings.mascotPersonality, streak])

  const fillAIPool = useCallback((context: MascotAIContext): Promise<string[]> => {
    if (!aiEnabled) return Promise.resolve([])
    const key = aiCacheKey(context)
    const pending = aiRequests.current.get(key)
    if (pending) return pending

    const controller = new AbortController()
    aiControllers.current.add(controller)
    const request = generateMascotLines(
      state.aiSettings,
      context,
      recentLines(),
      controller.signal,
    ).then(lines => {
      if (lines.length > 0) aiPools.current.set(key, lines)
      return lines
    }).catch(() => []).finally(() => {
      aiRequests.current.delete(key)
      aiControllers.current.delete(controller)
    })
    aiRequests.current.set(key, request)
    return request
  }, [aiEnabled, state.aiSettings])

  /**
   * Consume a prefetched model line synchronously when possible. On the first
   * encounter, Momo visibly thinks while a batch is generated; later reactions
   * from that context are instant. A provider failure quietly returns the safe
   * local line instead of leaving her speechless.
   */
  const deliver = useCallback(async (
    event: MascotAIEvent,
    fallback: string,
    pokeStage?: MascotAIContext['pokeStage'],
  ) => {
    const context = contextFor(event, pokeStage)
    const key = aiCacheKey(context)
    const pool = aiPools.current.get(key)
    const cached = pool?.shift()

    if (cached) {
      rememberLine(cached)
      say(cached)
      if ((pool?.length ?? 0) <= 2) void fillAIPool(context)
      return
    }
    if (!aiEnabled) {
      rememberLine(fallback)
      say(fallback)
      return
    }

    // An AI-provider failure cannot reliably ask that same provider to write
    // the joke about its failure. Prefer an immediate safe line unless a batch
    // was already cached from a healthy request.
    if (event === 'ai_fumble') {
      rememberLine(fallback)
      say(fallback)
      return
    }

    setSays(null)
    thinkingCount.current += 1
    setThinking(true)
    const lines = await fillAIPool(context)
    thinkingCount.current = Math.max(0, thinkingCount.current - 1)
    setThinking(thinkingCount.current > 0)
    const line = lines.shift() ?? fallback
    aiPools.current.set(key, lines)
    rememberLine(line)
    say(line)
  }, [aiEnabled, contextFor, fillAIPool, say])

  /**
   * A remark to go with having walked somewhere.
   *
   * Rate-limited hard: a mascot that comments every time she moves is a mascot
   * you turn off. The same session memory keeps her from repeating
   * the line it just showed.
   */
  const speak = useCallback((hour: number) => {
    if (Date.now() - lastSpokeAt.current < SPEAK_COOLDOWN_MS) return
    lastSpokeAt.current = Date.now()
    const line = momoLine({
      state: voiceState,
      dayKey: todayKey,
      hour,
      entryCount: todayEntries.length,
      firstLogOfDay: todayEntries.length === 1,
      daysAway: daysSincePreviousLog(loggedDayKeys, todayKey),
      ringComplete,
    }, recentLines())
    const daysAway = daysSincePreviousLog(loggedDayKeys, todayKey)
    const event: MascotAIEvent = daysAway >= 2
      ? 'comeback'
      : ringComplete
        ? 'ring_complete'
        : 'ambient'
    void deliver(event, event === 'ambient' ? line : EVENT_FALLBACKS[event])
  }, [deliver, voiceState, todayKey, todayEntries.length, loggedDayKeys, ringComplete])

  /**
   * A volunteered joke is local on purpose: the shared repertoire pairs each
   * exact line with a wave, glance or stretch. Running it through the ambient
   * AI pool could swap the wording after the pose had already started and lose
   * that tiny piece of comic timing.
   */
  const volunteerTaunt = useCallback((idleSeconds: number) => {
    const now = Date.now()
    if (!shouldVolunteerTaunt({
      activity,
      idleSeconds,
      elapsedSinceSpeechMs: now - lastSpokeAt.current,
      speechCooldownMs: SPEAK_COOLDOWN_MS,
      reducedMotion: reduced,
      paused,
      quietScreen: quiet,
    })) return false

    const poseIndex = Math.floor(Math.random() * TAUNT_POSES.length)
    const tauntPose = TAUNT_POSES[poseIndex] ?? TAUNT_POSES[0]
    const seed = sessionVariant() + Math.floor(Math.random() * 10_000)
    const act = tauntAct(tauntPose, seed, recentLines())

    lastSpokeAt.current = now
    play(act.pose)
    rememberLine(act.line)
    say(act.line)
    return true
  }, [activity, paused, play, quiet, reduced, say])

  const respond = useCallback((event: MascotAIEvent) => {
    const reaction: Partial<Record<MascotAIEvent, BehaviorKey>> = {
      log_success: 'celebrate_small',
      milestone: 'celebrate_big',
      form_fumble: 'poke_squish',
      ai_fumble: 'poke_tip',
      empty_search: 'look_around',
      comeback: 'wave_at_user',
      ring_complete: 'celebrate_big',
    }
    const key = reaction[event]
    if (key) react(key)
    if (event === 'ambient' || event === 'poke') return
    lastSpokeAt.current = Date.now()
    void deliver(event, EVENT_FALLBACKS[event])
  }, [deliver, react])

  useEffect(() => {
    handle = { react, event: respond }
    if (queuedEvent) {
      const event = queuedEvent
      queuedEvent = null
      respond(event)
    }
    return () => { if (handle?.react === react) handle = null }
  }, [react, respond])

  /* Warm the common pool before the first volunteered remark. This is one
     batched request, not one call per animation. */
  useEffect(() => {
    // Hidden, paused and reduced-motion mascots must be silent at the network
    // boundary too—not merely absent from the screen. This prevents an idle
    // provider request from consuming quota after Momo has been turned off.
    if (!aiEnabled || activity === 'off' || quiet || reduced || paused) return
    void fillAIPool(contextFor('ambient'))
  }, [activity, aiEnabled, contextFor, fillAIPool, paused, quiet, reduced])

  /**
   * Put him in his corner the moment the element exists.
   *
   * This used to be an effect keyed on `place`, which ran once — and on a quiet
   * screen (onboarding, log, settings) the overlay renders null, so the ref was
   * empty and the effect returned early. It never ran again, so on reaching Home
   * Momo had no transform at all and sat at (0, 0), on top of the header.
   */
  const attachHost = useCallback((el: HTMLButtonElement | null) => {
    hostRef.current = el
    if (!el || el.style.transform) return
    const rest = restPosition(SIZE)
    el.style.transition = 'none'
    el.style.transform = `translate3d(${rest.x}px, ${rest.y}px, 0)`
  }, [])

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
          loggedToday,
          ringComplete,
          idleSeconds: (Date.now() - lastInteraction.current) / 1000,
          hasAnchor: (id: Parameters<NonNullable<typeof anchors>['has']>[0]) => anchors?.getRect(id) != null,
        }
        setMood(deriveMood(ctx))
        if (!currentRef.current || currentRef.current.endsAt <= Date.now()) {
          if (!volunteerTaunt(ctx.idleSeconds)) {
            const next = pickAmbient(ctx, cooldowns.current, Date.now())
            if (next) {
              play(next.key)
              // She speaks when she has walked somewhere: an anchored behaviour means
              // she crossed the screen to look at something, which is the moment a
              // remark belongs. Unanchored filler stays silent so he is not chatty.
              if (next.anchor) speak(ctx.hour)
            } else setPose('idle_breathe')
          }
        }
        tick()
      }, delay)
    }
    tick()
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [accountAgeDays, activity, anchors, loggedToday, mood, paused, play, quiet, reduced, ringComplete, screen, speak, streak, volunteerTaunt])

  /* `exit` was in the behaviour table but nothing ever played it, so Momo
     teleported between screens. Playing it on the way out gives the move a
     beginning and an end. */
  const previousScreen = useRef<typeof screen | null>(null)
  useEffect(() => {
    const leaving = previousScreen.current
    previousScreen.current = screen
    if (leaving !== null && leaving !== screen) react('exit')
    const t = window.setTimeout(() => {
      if (screen === 'log') react('sniff_plate')
      else react('enter')
    }, leaving === null ? 0 : 260)
    return () => window.clearTimeout(t)
  }, [screen]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * A poke plays the next beat of the repertoire and says the line written for
   * it. The count is deliberately not reset by time — walking away and coming
   * back mid-sulk is funnier than a character that forgets.
   */
  const poke = useCallback(() => {
    pokes.current += 1
    // The pose ladder is the joke and stays put; the session variant shifts only
    // the wording, so the fourth poke is recognisably the fourth without being
    // word-for-word what it was last visit.
    const act = pokeAct(pokes.current, sessionVariant())
    react(act.pose)
    // A poke is always answered — it bypasses the ambient speak cooldown, but
    // resets it so she does not immediately volunteer a second remark.
    lastSpokeAt.current = Date.now()
    const pokeStage = pokes.current <= 1 ? 'hello' : pokes.current <= 4 ? 'again' : 'relentless'
    void deliver('poke', act.line, pokeStage)
  }, [deliver, react])

  useEffect(() => () => {
    if (sayTimer.current) window.clearTimeout(sayTimer.current)
    for (const controller of aiControllers.current) controller.abort()
  }, [])

  /* `quiet` previously only stopped him scheduling new behaviours — he stayed
     on screen regardless, which is why he sat on top of the log options and
     the support page. A quiet screen means gone, not just still. */
  if (activity === 'off' || quiet) return null

  return (
    <div className="mascot-overlay">
      <button
        ref={attachHost}
        type="button"
        className={`mascot-host mood-${mood}${reduced ? ' is-static' : ''}`}
        onClick={(event) => {
          event.stopPropagation()
          poke()
        }}
        aria-label="Talk to Momo"
        aria-expanded={Boolean(says || thinking)}
      >
        <div key={poseRun} className={`mascot-pose pose-${pose}`}>
          <Momo
            mood={mood}
            pose={pose}
            cosmeticId={state.gamification.equippedCosmeticId}
            thinking={thinking}
          />
        </div>
        {(says || thinking) && (
          <span className={`mascot-quip${thinking && !says ? ' is-thinking' : ''}`} role="status" aria-live="polite">
            {says ?? <span className="mascot-thinking-dots" aria-label="Momo is thinking"><i /><i /><i /></span>}
          </span>
        )}
      </button>
    </div>
  )
}

export function accountAgeFrom(startedAt: string, today = localDayKey(new Date())): number {
  const start = startedAt.slice(0, 10)
  if (!start) return 0
  return Math.max(0, Math.floor((Date.parse(`${today}T12:00:00`) - Date.parse(`${start}T12:00:00`)) / 86400_000))
}
