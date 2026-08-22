import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LevelUpOverlay } from '../components/LevelUpOverlay'
import { DatePickerModal } from '../components/DatePickerModal'
import { BottomNav } from '../components/BottomNav'
import { HomeSkeleton } from '../components/HomeSkeleton'
import { Ticket } from '../components/Ticket'
import { useToast } from '../components/Toast'
import { useApp } from '../store/AppContext'
import { entriesForDay, macroTotals } from '../lib/storage'
import { effectiveProtein, effectiveCarbs, effectiveFat } from '../lib/profile'
import { startOfDay, sameDay, localDayKey } from '../lib/dates'
import { getStreakWithFreezes, getAllBadges, getTotalLoggedDays } from '../lib/journey'
import { DAILY_XP_GOAL, applyNote, applyWaterChange, dailyXpTowardGoal, ticketNumber } from '../lib/enamelEconomy'
import { useHaptic } from '../hooks/useHaptic'
import { playLogConfirm, prefersReducedMotion, setFeelEnabled } from '../lib/feel'
import { evaluateNotifications } from '../lib/notifications'
import { LogCelebration } from '../components/LogCelebration'
import { Surface } from '../components/Surface'
import type { XpEvent } from '../types'
import { useAnchor } from '../mascot/anchors'
import { mascotReact } from '../mascot/MascotOverlay'

const REVEAL_DELAY_MS = 420

interface JustLogged { id?: string; calories: number; name: string }

interface CelebrationState {
  foodName: string
  awards: XpEvent[]
  questJustCompleted: boolean
}

export function HomePage() {
  const { state, ackLevelUp, patchGamification } = useApp()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const vibrate = useHaptic()
  const streakAnchor = useAnchor('streak_flame')
  const [selectedDate, setSelectedDate] = useState(() => startOfDay())
  const [revealed, setRevealed] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [celebration, setCelebration] = useState<CelebrationState | null>(null)
  const loggedNavKey = useRef('')
  const prevSeenBadgeCount = useRef(state.gamification.seenBadgeIds.length)

  const dayEntries = entriesForDay(state.foodEntries, selectedDate)
  const totals = macroTotals(dayEntries)
  const profile = state.profile
  const selectedDayKey = localDayKey(selectedDate)
  const paused = Boolean(profile.trackingPaused)
  const streak = getStreakWithFreezes(
    state.foodEntries,
    state.gamification.freezeUsedDates,
    state.gamification.pauseProtectedDates,
  )
  const hasLoggedToday = state.foodEntries.some(e => sameDay(new Date(e.timestamp), new Date()))
  const dayXp = dailyXpTowardGoal(state.gamification, selectedDayKey)
  const water = state.gamification.waterByDate[selectedDayKey] ?? 0
  const notes = state.gamification.notesByDate[selectedDayKey] ?? 0

  useEffect(() => {
    setFeelEnabled({
      sound: profile.soundEnabled !== false,
      haptics: profile.hapticsEnabled !== false,
    })
  }, [profile.soundEnabled, profile.hapticsEnabled])

  useEffect(() => {
    if (paused) return
    const hours = state.foodEntries.map(e => new Date(e.timestamp).getHours())
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
      ? state.gamification.xpEvents.find(event => event.key === `meal-${justLogged.id}` || event.key === `enamel-manual-${justLogged.id}` || event.key === `enamel-photo-${justLogged.id}`)
      : undefined
    const fresh = mealEvent
      ? state.gamification.xpEvents.filter(event => event.timestamp === mealEvent.timestamp)
      : state.gamification.xpEvents.slice(0, 4)
    const questDone = fresh.some(event => event.key.startsWith('quest-') || event.key.startsWith('enamel-quest-'))
    playLogConfirm({ questJustCompleted: questDone })
    if (!prefersReducedMotion()) vibrate(15)
    mascotReact(questDone ? 'celebrate_big' : 'celebrate_small')
    setCelebration({
      foodName: justLogged.name,
      awards: fresh,
      questJustCompleted: questDone,
    })
  }, [location.key]) // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div className="app-shell home-shell">
      {!paused && pendingLevelUp && <LevelUpOverlay level={pendingLevelUp} onDone={ackLevelUp} />}
      {!paused && celebration && !pendingLevelUp && (
        <LogCelebration
          foodName={celebration.foodName}
          streak={streak}
          awards={celebration.awards}
          onDone={() => setCelebration(null)}
        />
      )}

      <header className="home-enamel-header">
        <button
          type="button"
          className="home-streak-btn"
          ref={streakAnchor}
          onClick={() => {
            vibrate(10)
            setShowDatePicker(true)
          }}
          aria-label="Choose date"
        >
          <span className="tabular">{streak}</span>
          <small>day streak</small>
        </button>
        <div>
          <h1 className="home-title">Today</h1>
          <div className="home-xp-track" aria-hidden>
            <div className="home-xp-fill" style={{ width: `${Math.min(100, (dayXp / DAILY_XP_GOAL) * 100)}%` }} />
          </div>
        </div>
        <div className="home-gems tabular" aria-label={`${state.gamification.gems} gems`}>
          ◆ {state.gamification.gems}
        </div>
      </header>

      {showDatePicker && (
        <DatePickerModal
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      <main className="app-main home-main">
        {!revealed ? (
          <HomeSkeleton />
        ) : paused ? (
          <Surface className="home-ring-hero" style={{ textAlign: 'center' }}>
            <p className="onboarding-title" style={{ fontSize: '1.2rem' }}>Tracking is paused</p>
            <p className="page-sub">Calorie and macro numbers are hidden. Your streak is held where it is.</p>
          </Surface>
        ) : (
          <Ticket
            date={selectedDate}
            ticketNo={ticketNumber(state.foodEntries) || getTotalLoggedDays(state.foodEntries) || 1}
            entries={dayEntries}
            protein={totals.protein}
            carbs={totals.carbs}
            fat={totals.fat}
            proteinGoal={effectiveProtein(profile)}
            carbsGoal={effectiveCarbs(profile)}
            fatGoal={effectiveFat(profile)}
            water={water}
            notes={notes}
            paused={paused}
            onWater={n => patchGamification(g => applyWaterChange(g, selectedDayKey, n))}
            onNote={() => patchGamification(g => applyNote(g, selectedDayKey))}
          />
        )}
        <div className="home-scroll-pad" />
      </main>

      <BottomNav />
    </div>
  )
}
