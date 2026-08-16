import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MacroProgressGroup } from '../components/MacroGrid'
import { FoodList } from '../components/FoodList'
import { WeekStrip } from '../components/WeekStrip'
import { LevelUpOverlay } from '../components/LevelUpOverlay'
import { ActivitySheet } from '../components/ActivitySheet'
import { DatePickerModal } from '../components/DatePickerModal'
import { BottomNav } from '../components/BottomNav'
import { HomeSkeleton } from '../components/HomeSkeleton'
import { IconBell, IconCalendar, IconCoach } from '../components/icons'
import { useToast } from '../components/Toast'
import { useApp } from '../store/AppContext'
import { entriesForDay, macroTotals } from '../lib/storage'
import { effectiveCalories, effectiveProtein, effectiveCarbs, effectiveFat } from '../lib/profile'
import { startOfDay, sameDay, localDayKey } from '../lib/dates'
import { getStreakWithFreezes, getAllBadges } from '../lib/journey'
import { useHaptic } from '../hooks/useHaptic'
import { ACTIVITY_PRESETS, type ActivityPreset } from '../lib/activities'
import { playLogConfirm, prefersReducedMotion, setFeelEnabled } from '../lib/feel'
import { questTitle } from '../lib/quests'
import { evaluateNotifications } from '../lib/notifications'
import { Mascot, type MascotState } from '../components/Mascot'
import { MascotSay } from '../components/MascotSay'
import { LogCelebration } from '../components/LogCelebration'
import { CalorieRing } from '../components/CalorieRing'
import { PressableButton } from '../components/PressableButton'
import { levelFromXp, xpForLevel, xpForNextLevel } from '../lib/xp'
import type { XpEvent } from '../types'
import { startLogFlow, track } from '../lib/analytics'

const REVEAL_DELAY_MS = 420

/** How long the mascot holds its post-log reaction. */
const MASCOT_BEAT_MS = 2400

/** Streak lengths that earn `proud`, per the §7.6 state table. */
const PROUD_STREAKS = [7, 30, 100]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

interface JustLogged { id?: string; calories: number; name: string }

interface CelebrationState {
  foodName: string
  calories: number
  awards: XpEvent[]
  questJustCompleted: boolean
}

export function HomePage() {
  const { state, ackLevelUp } = useApp()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const vibrate = useHaptic()
  const [selectedDate, setSelectedDate] = useState(() => startOfDay())
  const [ringPop, setRingPop] = useState(false)
  const [activePreset, setActivePreset] = useState<ActivityPreset | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  // Transient mascot reaction, held for MASCOT_BEAT_MS after a log lands.
  const [mascotBeat, setMascotBeat] = useState<MascotState | null>(null)
  const [celebration, setCelebration] = useState<CelebrationState | null>(null)
  const loggedNavKey = useRef('')
  const prevSeenBadgeCount = useRef(state.gamification.seenBadgeIds.length)

  const dayEntries = entriesForDay(state.foodEntries, selectedDate)
  const totals = macroTotals(dayEntries)
  const profile = state.profile
  const firstName = profile.name?.split(' ')[0]
  const goal = effectiveCalories(profile)

  const selectedDayKey = localDayKey(selectedDate)
  const burned = state.exerciseEntries
    .filter(e => localDayKey(new Date(e.timestamp)) === selectedDayKey)
    .reduce((sum, e) => sum + e.caloriesBurned, 0)

  const streak = getStreakWithFreezes(state.foodEntries, state.gamification.freezeUsedDates)
  const hasLoggedToday = state.foodEntries.some(e => sameDay(new Date(e.timestamp), new Date()))
  const streakAtRisk = streak > 0 && !hasLoggedToday
  const paused = Boolean(profile.trackingPaused)
  const quest = state.gamification.quest

  const loggedDayKeys = new Set(state.foodEntries.map(e => localDayKey(new Date(e.timestamp))))
  const frozenDayKeys = new Set(state.gamification.freezeUsedDates)

  const xp = state.gamification.xp
  const level = levelFromXp(xp)
  const levelFloor = xpForLevel(level)
  const levelCeiling = xpForNextLevel(level)
  // Guard the top level, where floor and ceiling meet and the span is zero.
  const levelProgress = levelCeiling > levelFloor
    ? Math.min(1, (xp - levelFloor) / (levelCeiling - levelFloor))
    : 1

  /**
   * §2.5 / §7.6: the mascot reads logging behaviour and nothing else. It never
   * sees totals, macros or a particular food, so there is no path from "went
   * over" to a reaction — that case lands on `neutral` like any ordinary day.
   */
  const mascotState: MascotState = mascotBeat ?? (
    !hasLoggedToday ? 'sleepy'
      : PROUD_STREAKS.includes(streak) ? 'proud'
        : paused ? 'neutral'
          : 'idle'
  )

  useEffect(() => {
    setFeelEnabled({
      sound: profile.soundEnabled !== false,
      haptics: profile.hapticsEnabled !== false,
    })
  }, [profile.soundEnabled, profile.hapticsEnabled])

  useEffect(() => {
    const hours = state.foodEntries
      .map(e => new Date(e.timestamp).getHours())
    void evaluateNotifications({
      loggedToday: hasLoggedToday,
      streak,
      freezeAvailable: state.gamification.streakFreezes,
      firstLogHours: hours,
      localHour: new Date().getHours(),
    })
  }, [hasLoggedToday, streak, state.gamification.streakFreezes, state.foodEntries])

  // Brief choreographed skeleton reveal so the splash hands off smoothly into content.
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), REVEAL_DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  // Meal-log celebration
  useEffect(() => {
    const justLogged = (location.state as { justLogged?: JustLogged } | null)?.justLogged
    if (!justLogged) return
    if (loggedNavKey.current === location.key) return
    loggedNavKey.current = location.key
    navigate('.', { replace: true, state: null })
    // No toast here — the celebration overlay below says the same thing, and
    // the two stack on top of each other.
    const mealEvent = justLogged.id
      ? state.gamification.xpEvents.find(event => event.key === `meal-${justLogged.id}`)
      : undefined
    const fresh = mealEvent
      ? state.gamification.xpEvents.filter(event => event.timestamp === mealEvent.timestamp)
      : []
    const questDone = fresh.some(event => event.key.startsWith('quest-'))
    playLogConfirm({ questJustCompleted: questDone })
    if (!prefersReducedMotion()) {
      vibrate(15)
      setRingPop(true)
    }

    // A quest finishing is the bigger moment; a plain log is still worth a nod.
    setMascotBeat(questDone ? 'celebrating' : 'happy')

    setCelebration({
      foodName: justLogged.name,
      calories: justLogged.calories,
      // Keep every event produced by this exact log. The celebration total
      // must match the ledger even when a meal, quest, and streak coincide.
      awards: fresh,
      questJustCompleted: questDone,
    })
  }, [location.key]) // eslint-disable-line react-hooks/exhaustive-deps

  /*
   * These two resets are keyed to the values themselves, not to location.key.
   * The effect above navigates to clear the router state, which changes
   * location.key — so a timer started there is torn down by its own cleanup
   * before it can fire, and the state would stick on forever.
   */
  useEffect(() => {
    if (!ringPop) return
    const t = setTimeout(() => setRingPop(false), prefersReducedMotion() ? 0 : 600)
    return () => clearTimeout(t)
  }, [ringPop])

  useEffect(() => {
    if (!mascotBeat) return
    const t = setTimeout(() => setMascotBeat(null), MASCOT_BEAT_MS)
    return () => clearTimeout(t)
  }, [mascotBeat])

  // Badge unlock toast (uses gamification.seenBadgeIds, not old localStorage key)
  useEffect(() => {
    const prev = prevSeenBadgeCount.current
    const current = state.gamification.seenBadgeIds.length
    if (current > prev) {
      const allBadges = getAllBadges(state.foodEntries, streak)
      const newIds = state.gamification.seenBadgeIds.slice(prev)
      const newBadge = allBadges.find(b => newIds.includes(b.id))
      if (newBadge) toast(`${newBadge.emoji} Badge unlocked: ${newBadge.name}!`)
    }
    prevSeenBadgeCount.current = current
  }, [state.gamification.seenBadgeIds.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const pendingLevelUp = state.gamification.pendingLevelUp

  function handleBellClick() {
    if (streakAtRisk) {
      toast('🔥 Log today to keep your streak alive!')
      navigate('/journey')
    } else {
      toast("You're all caught up!")
    }
  }

  return (
    <div className="app-shell home-shell">
      <div className="home-ambient-glow" aria-hidden />
      {pendingLevelUp && <LevelUpOverlay level={pendingLevelUp} onDone={ackLevelUp} />}

      {/* The signature moment. Held behind the level-up overlay so the two
          never stack on top of each other. */}
      {celebration && !pendingLevelUp && (
        <LogCelebration
          foodName={celebration.foodName}
          calories={celebration.calories}
          streak={streak}
          awards={celebration.awards}
          quest={quest ? {
            title: questTitle(quest),
            progress: quest.progress,
            target: quest.target,
            justCompleted: celebration.questJustCompleted,
          } : null}
          onDone={() => setCelebration(null)}
        />
      )}
      {activePreset && (
        <ActivitySheet
          defaultPreset={activePreset}
          onClose={() => setActivePreset(null)}
          onLogged={(kcal, name) => {
            toast(`🏃 +${kcal} kcal burned (${name})`)
            vibrate(15)
          }}
        />
      )}

      <header className="home-header">
        <button
          type="button"
          className="home-icon-btn"
          onClick={() => setShowDatePicker(true)}
          aria-label="Choose date"
        >
          <IconCalendar size={19} />
        </button>

        <div className="home-header-center">
          <h1 className="home-title">Dashboard</h1>
          <span className="home-header-sub">
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </span>
        </div>

        <button
          type="button"
          className="home-icon-btn"
          onClick={handleBellClick}
          aria-label="Notifications"
        >
          <IconBell size={19} dot={streakAtRisk} />
        </button>
      </header>

      {showDatePicker && (
        <DatePickerModal
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {/* §9.2 opens with the streak, then points and level. */}
      <div className="home-top-row">
        <span className={`home-streak-badge${streakAtRisk ? ' is-at-risk' : ''}`}>
          <span className="home-streak-flame">🔥</span>
          {streak} day{streak === 1 ? '' : 's'}
        </span>
        <div className="home-xp">
          <div className="home-points">
            <strong>{state.gamification.xp} XP</strong>
            <span>Level {level}</span>
          </div>
          <div className="home-xp-track">
            <span className="home-xp-fill" style={{ width: `${levelProgress * 100}%` }} />
          </div>
        </div>
      </div>

      {!paused && (
        <div className="home-say-row">
          <Mascot state={mascotState} size={54} />
          <MascotSay state={mascotState} seed={streak + dayEntries.length} />
        </div>
      )}

      {quest && (
        <Link to="/journey" className="home-quest-row">
          <span>{questTitle(quest)}</span>
          <span>{Math.min(quest.progress, quest.target)}/{quest.target}</span>
        </Link>
      )}

      <main className="app-main home-main">
        {!revealed ? (
          <HomeSkeleton />
        ) : (
          <>
            <div className="home-section-enter" style={{ '--enter-delay': '0ms' } as React.CSSProperties}>
              <WeekStrip
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                loggedDays={loggedDayKeys}
                frozenDays={frozenDayKeys}
              />
            </div>
            <div className="home-hero-enter" style={{ '--enter-delay': '60ms' } as React.CSSProperties}>
              {paused ? (
                <div className="onboarding-goal-card" style={{ textAlign: 'center' }}>
                  <p className="onboarding-title" style={{ fontSize: '1.2rem' }}>Tracking is paused</p>
                  <p className="page-sub">Numbers are hidden. Your streak is held where it is.</p>
                </div>
              ) : (
                <div className={`home-ring-block${ringPop ? ' ring-pop' : ''}`}>
                  <div style={{ position: 'relative' }}>
                    <CalorieRing
                      consumed={totals.calories}
                      target={goal + burned}
                      caption={burned > 0 ? `+${burned.toLocaleString()} burned` : undefined}
                    />
                  </div>
                  <span className="home-ring-sub">
                    {Math.round(totals.calories).toLocaleString()} of {(goal + burned).toLocaleString()} today
                  </span>
                </div>
              )}
            </div>

            {/* Activity is optional detail, not a competing primary action. */}
            <div className="home-section-enter" style={{ '--enter-delay': '90ms' } as React.CSSProperties}>
              <button
                type="button"
                className="activity-detail-row"
                onClick={() => { setActivePreset(ACTIVITY_PRESETS[0]); vibrate(8) }}
              >
                <span>Activity</span>
                <span>{burned > 0 ? `${burned.toLocaleString()} kcal logged` : 'Add optional details'} →</span>
              </button>
            </div>

            {!paused && (
            <div className="home-section-enter" style={{ '--enter-delay': '120ms' } as React.CSSProperties}>
              <MacroProgressGroup
                protein={{ current: totals.protein, goal: effectiveProtein(profile) }}
                carbs={{ current: totals.carbs, goal: effectiveCarbs(profile) }}
                fat={{ current: totals.fat, goal: effectiveFat(profile) }}
              />
            </div>
            )}
            <div className="home-section-enter" style={{ '--enter-delay': '180ms' } as React.CSSProperties}>
              <FoodList entries={dayEntries} selectedDate={selectedDate} dailyGoal={goal} />
            </div>

            {/* Clears the pinned button so the last meal is never hidden. */}
            <div className="home-scroll-pad" />
          </>
        )}
      </main>

      {/* §9.2: the primary action is pinned, not scrolled to. */}
      <div className="home-log-dock">
        <PressableButton
          fullWidth
          label="Log a meal"
          onClick={() => {
            track({ name: 'home_primary_action_used' })
            startLogFlow('search', state.foodEntries.length === 0)
            navigate('/log')
          }}
        />
      </div>

      <Link to="/coach" className="fab" aria-label="Chat with your coach">
        <IconCoach size={24} />
      </Link>

      <BottomNav />
    </div>
  )
}
