import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MacroProgressGroup } from '../components/MacroGrid'
import { FoodList } from '../components/FoodList'
import { LevelUpOverlay } from '../components/LevelUpOverlay'
import { DatePickerModal } from '../components/DatePickerModal'
import { BottomNav } from '../components/BottomNav'
import { HomeSkeleton } from '../components/HomeSkeleton'
import { IconBell, IconCalendar } from '../components/icons'
import { useToast } from '../components/Toast'
import { useApp } from '../store/AppContext'
import { entriesForDay, macroTotals } from '../lib/storage'
import { effectiveCalories, effectiveProtein, effectiveCarbs, effectiveFat } from '../lib/profile'
import { startOfDay, sameDay, localDayKey } from '../lib/dates'
import { getStreakWithFreezes, getAllBadges } from '../lib/journey'
import { useHaptic } from '../hooks/useHaptic'
import { playLogConfirm, prefersReducedMotion, setFeelEnabled } from '../lib/feel'
import { questTitle } from '../lib/quests'
import { evaluateNotifications } from '../lib/notifications'
import { type MascotState } from '../components/Mascot'
import { LogCelebration } from '../components/LogCelebration'
import { PressableButton } from '../components/PressableButton'
import { MealPath } from '../components/MealPath'
import { Counter } from '../components/Counter'
import { Surface } from '../components/Surface'
import { mealPathStates } from '../lib/mealPath'
import { levelFromXp } from '../lib/xp'
import type { XpEvent } from '../types'
import { startLogFlow, track } from '../lib/analytics'

const REVEAL_DELAY_MS = 420
const MASCOT_BEAT_MS = 2400
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
  const [revealed, setRevealed] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
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
  const target = goal + burned
  const paused = Boolean(profile.trackingPaused)
  const streak = getStreakWithFreezes(
    state.foodEntries,
    state.gamification.freezeUsedDates,
    state.gamification.pauseProtectedDates,
  )
  const hasLoggedToday = state.foodEntries.some(e => sameDay(new Date(e.timestamp), new Date()))
  const streakAtRisk = !paused && streak > 0 && !hasLoggedToday
  const quest = state.gamification.quest
  const xp = state.gamification.xp
  const level = levelFromXp(xp)
  const mealsDone = mealPathStates(dayEntries).filter(node => node.status === 'done').length

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
    if (paused) return
    const hours = state.foodEntries
      .map(e => new Date(e.timestamp).getHours())
    void evaluateNotifications({
      loggedToday: hasLoggedToday,
      streak,
      freezeAvailable: state.gamification.streakFreezes,
      firstLogHours: hours,
      localHour: new Date().getHours(),
      trackingPaused: paused,
    })
  }, [paused, hasLoggedToday, streak, state.gamification.streakFreezes, state.foodEntries])

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), REVEAL_DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const justLogged = (location.state as { justLogged?: JustLogged } | null)?.justLogged
    if (!justLogged) return
    if (loggedNavKey.current === location.key) return
    loggedNavKey.current = location.key
    navigate('.', { replace: true, state: null })
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
    setMascotBeat(questDone ? 'celebrating' : 'happy')
    setCelebration({
      foodName: justLogged.name,
      calories: justLogged.calories,
      awards: fresh,
      questJustCompleted: questDone,
    })
  }, [location.key]) // eslint-disable-line react-hooks/exhaustive-deps

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
      toast('Log today to keep your streak alive!')
      navigate('/journey')
    } else {
      toast("You're all caught up!")
    }
  }

  return (
    <div className="app-shell home-shell">
      <div className="home-ambient-glow" aria-hidden />
      {!paused && pendingLevelUp && <LevelUpOverlay level={pendingLevelUp} onDone={ackLevelUp} />}
      {!paused && celebration && !pendingLevelUp && (
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
          <h1 className="home-title">Today</h1>
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

      {!paused && (
        <div className="home-counter-row">
          <Counter icon="🔥" label={streak === 1 ? 'day' : 'days'} value={streak} />
          <Counter icon="⭐" label={`level ${level}`} value={xp} />
          <Counter icon="❄️" label="freezes" value={state.gamification.streakFreezes} />
        </div>
      )}

      <main className="app-main home-main">
        {!revealed ? (
          <HomeSkeleton />
        ) : (
          <>
            <div className="home-hero-enter" style={{ '--enter-delay': '0ms' } as React.CSSProperties}>
              {paused ? (
                <Surface className="home-path-hero" style={{ textAlign: 'center' }}>
                  <p className="onboarding-title" style={{ fontSize: '1.2rem' }}>Tracking is paused</p>
                  <p className="page-sub">Calorie and macro numbers are hidden. Your streak is held where it is.</p>
                  <MealPath entries={dayEntries} paused mascotState="neutral" />
                </Surface>
              ) : (
                <Surface className={`home-path-hero${ringPop ? ' ring-pop' : ''}`}>
                  <div className="home-path-hero-top">
                    <div>
                      <strong className={`home-kcal-left${totals.calories > target ? ' is-over' : ''}`}>
                        {Math.max(0, Math.round(target - totals.calories)).toLocaleString()}
                      </strong>
                      <span className="home-day-sub">kcal left today</span>
                    </div>
                    <div className="home-meals-logged">
                      <strong>{mealsDone} of 4</strong>
                      <span>meals logged</span>
                    </div>
                  </div>
                  <MealPath
                    entries={dayEntries}
                    mascotState={mascotState}
                    onSelectSlot={slot => {
                      startLogFlow('search', state.foodEntries.length === 0)
                      navigate('/log/manual', { state: { mealType: slot } })
                    }}
                  />
                </Surface>
              )}
            </div>

            {!paused && (
              <div className="home-section-enter" style={{ '--enter-delay': '60ms' } as React.CSSProperties}>
                <MacroProgressGroup
                  protein={{ current: totals.protein, goal: effectiveProtein(profile) }}
                  carbs={{ current: totals.carbs, goal: effectiveCarbs(profile) }}
                  fat={{ current: totals.fat, goal: effectiveFat(profile) }}
                />
              </div>
            )}

            {!paused && quest && (
              <Link to="/journey" className="home-quest-row home-section-enter" style={{ '--enter-delay': '90ms' } as React.CSSProperties}>
                <span>{questTitle(quest)}</span>
                <span>{Math.min(quest.progress, quest.target)}/{quest.target}</span>
              </Link>
            )}

            {!paused && (
              <div className="home-section-enter" style={{ '--enter-delay': '120ms' } as React.CSSProperties}>
                <FoodList entries={dayEntries} selectedDate={selectedDate} />
              </div>
            )}

            <div className="home-scroll-pad" />
          </>
        )}
      </main>

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

      <BottomNav />
    </div>
  )
}
