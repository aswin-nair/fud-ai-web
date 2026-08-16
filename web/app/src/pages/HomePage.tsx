import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CalorieHero } from '../components/CalorieHero'
import { MacroGrid } from '../components/MacroGrid'
import { FoodList } from '../components/FoodList'
import { WeekStrip } from '../components/WeekStrip'
import { StreakCard } from '../components/StreakCard'
import { LevelUpOverlay } from '../components/LevelUpOverlay'
import { ActivitySheet } from '../components/ActivitySheet'
import { DatePickerModal } from '../components/DatePickerModal'
import { BottomNav } from '../components/BottomNav'
import { Confetti } from '../components/Confetti'
import { HomeSkeleton } from '../components/HomeSkeleton'
import { IconBell, IconCalendar, IconCoach, IconPlus } from '../components/icons'
import { useToast } from '../components/Toast'
import { useApp } from '../store/AppContext'
import { entriesForDay, macroTotals } from '../lib/storage'
import { effectiveCalories, effectiveProtein, effectiveCarbs, effectiveFat } from '../lib/profile'
import { startOfDay, sameDay, localDayKey } from '../lib/dates'
import { getStreakWithFreezes, getAllBadges } from '../lib/journey'
import { getMotivation } from '../lib/motivation'
import { useHaptic } from '../hooks/useHaptic'
import { ACTIVITY_PRESETS, type ActivityPreset } from '../lib/activities'
import { playLogConfirm, prefersReducedMotion, setFeelEnabled } from '../lib/feel'
import { questTitle } from '../lib/quests'
import { evaluateNotifications } from '../lib/notifications'
import { Mascot, type MascotState } from '../components/Mascot'

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

interface JustLogged { calories: number; name: string }

export function HomePage() {
  const { state, ackLevelUp } = useApp()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const vibrate = useHaptic()
  const [selectedDate, setSelectedDate] = useState(() => startOfDay())
  const [showConfetti, setShowConfetti] = useState(false)
  const [ringPop, setRingPop] = useState(false)
  const [activePreset, setActivePreset] = useState<ActivityPreset | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  // Transient mascot reaction, held for MASCOT_BEAT_MS after a log lands.
  const [mascotBeat, setMascotBeat] = useState<MascotState | null>(null)
  const celebratedKey = useRef('')
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
  const motivation = getMotivation(totals.calories, goal + burned)
  const hasLoggedToday = state.foodEntries.some(e => sameDay(new Date(e.timestamp), new Date()))
  const streakAtRisk = streak > 0 && !hasLoggedToday
  const paused = Boolean(profile.trackingPaused)
  const quest = state.gamification.quest

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
    toast(`+${justLogged.calories} kcal logged`)
    const questDone = Boolean(state.gamification.quest?.completedAt)
    playLogConfirm({ questJustCompleted: questDone })
    if (!prefersReducedMotion()) {
      vibrate(15)
      setRingPop(true)
    }

    // A quest finishing is the bigger moment; a plain log is still worth a nod.
    setMascotBeat(questDone ? 'celebrating' : 'happy')
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

  // Calorie goal confetti
  useEffect(() => {
    if (goal <= 0) return
    const dateKey = selectedDate.toDateString()
    const near = totals.calories >= goal && totals.calories <= goal * 1.08
    if (near && celebratedKey.current !== dateKey) {
      celebratedKey.current = dateKey
      setShowConfetti(true)
      if (sameDay(selectedDate, new Date())) toast('🎉 Goal reached! Great work!')
    }
  }, [totals.calories]) // eslint-disable-line react-hooks/exhaustive-deps

  // Badge unlock toast (uses gamification.seenBadgeIds, not old localStorage key)
  useEffect(() => {
    const prev = prevSeenBadgeCount.current
    const current = state.gamification.seenBadgeIds.length
    if (current > prev) {
      const allBadges = getAllBadges(state.foodEntries, streak, state.gamification)
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
      <div className={`home-ambient-glow zone-${motivation.zone}`} aria-hidden />

      {showConfetti && !pendingLevelUp && !prefersReducedMotion() && (
        <Confetti onDone={() => setShowConfetti(false)} />
      )}
      {pendingLevelUp && <LevelUpOverlay level={pendingLevelUp} onDone={ackLevelUp} />}
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

      <div className="home-streak-row">
        <Mascot state={mascotState} size={46} />
        <StreakCard streak={streak} entries={state.foodEntries} gamification={state.gamification} />
      </div>
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
              <WeekStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
            </div>
            <div className="home-hero-enter" style={{ '--enter-delay': '60ms' } as React.CSSProperties}>
              {paused ? (
                <div className="onboarding-goal-card" style={{ textAlign: 'center' }}>
                  <p className="onboarding-title" style={{ fontSize: '1.2rem' }}>Tracking is paused</p>
                  <p className="page-sub">Numbers are hidden. Your streak is held where it is.</p>
                </div>
              ) : (
                <CalorieHero current={totals.calories} goal={goal} burned={burned} pop={ringPop} selectedDate={selectedDate} />
              )}
            </div>

            <div className="home-section-enter" style={{ '--enter-delay': '75ms' } as React.CSSProperties}>
              <button type="button" className="home-add-pill press-spring" onClick={() => navigate('/log')}>
                <IconPlus size={18} strokeWidth={2.6} />
                Log a meal
              </button>
            </div>

            {/* Quick activity presets */}
            <div className="home-section-enter" style={{ '--enter-delay': '90ms' } as React.CSSProperties}>
              <div className="activity-quick-row">
                {ACTIVITY_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    className="activity-quick-chip"
                    onClick={() => { setActivePreset(preset); vibrate(8) }}
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {!paused && (
            <div className="home-section-enter" style={{ '--enter-delay': '120ms' } as React.CSSProperties}>
              <MacroGrid
                protein={{ current: totals.protein, goal: effectiveProtein(profile) }}
                carbs={{ current: totals.carbs, goal: effectiveCarbs(profile) }}
                fat={{ current: totals.fat, goal: effectiveFat(profile) }}
              />
            </div>
            )}
            <div className="home-section-enter" style={{ '--enter-delay': '180ms' } as React.CSSProperties}>
              <FoodList entries={dayEntries} selectedDate={selectedDate} dailyGoal={goal} />
            </div>
          </>
        )}
      </main>

      <Link to="/coach" className="fab" aria-label="Chat with your coach">
        <IconCoach size={24} />
      </Link>

      <BottomNav />
    </div>
  )
}
