import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LevelUpOverlay } from '../components/LevelUpOverlay'
import { DatePickerModal } from '../components/DatePickerModal'
import { BottomNav } from '../components/BottomNav'
import { HomeSkeleton } from '../components/HomeSkeleton'
import { Ticket } from '../components/Ticket'
import { SwipeRow } from '../components/SwipeRow'
import { PullToRefresh } from '../components/PullToRefresh'
import { useToast } from '../components/Toast'
import { useApp } from '../store/AppContext'
import { entriesForDay, macroTotals } from '../lib/storage'
import { effectiveProtein, effectiveCarbs, effectiveFat } from '../lib/profile'
import { formatDayLabel, startOfDay, sameDay, localDayKey } from '../lib/dates'
import { getStreakWithFreezes, getAllBadges, getTotalLoggedDays } from '../lib/journey'
import { applyNote, applyWaterChange, ticketNumber } from '../lib/enamelEconomy'
import { useFeel } from '../hooks/useHaptic'
import { useTransitionNavigate } from '../hooks/useTransitionNavigate'
import { playLogConfirm, setFeelEnabled } from '../lib/feel'
import { evaluateNotifications } from '../lib/notifications'
import { LogCelebration } from '../components/LogCelebration'
import { Surface } from '../components/Surface'
import { MEAL_LABELS, type XpEvent } from '../types'
import { useAnchor } from '../mascot/anchors'
import { CalorieRing } from '../components/CalorieRing'
import { effectiveCalories } from '../lib/profile'
import { mascotEvent } from '../mascot/MascotOverlay'
import { dayRingProgress } from '../lib/dayRing'
import { DayRing } from '../components/DayRing'

const REVEAL_DELAY_MS = 420

interface JustLogged { id?: string; calories: number; name: string }

interface CelebrationState {
  foodName: string
  awards: XpEvent[]
  mascotEvent: 'log_success' | 'milestone'
}

export function HomePage({ guest = false }: { guest?: boolean }) {
  const { state, ackLevelUp, patchGamification, deleteEntry, refresh } = useApp()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const feel = useFeel()
  const transitionTo = useTransitionNavigate()
  const streakAnchor = useAnchor('streak_flame')
  const ringAnchor = useAnchor('calorie_ring')
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
  const selectedDayLabel = formatDayLabel(selectedDate)
  const selectedDayIsToday = selectedDayLabel === 'Today'
  const snapshotLabel = selectedDayIsToday
    ? 'Today’s snapshot'
    : selectedDayLabel === 'Yesterday'
      ? 'Yesterday’s snapshot'
      : `${selectedDayLabel} snapshot`
  const totalDateLabel = selectedDayIsToday
    ? 'today'
    : selectedDayLabel === 'Yesterday'
      ? 'yesterday'
      : `on ${selectedDayLabel}`
  const paused = Boolean(profile.trackingPaused)
  const streak = getStreakWithFreezes(
    state.foodEntries,
    state.gamification.freezeUsedDates,
    state.gamification.pauseProtectedDates,
  )
  const hasLoggedToday = state.foodEntries.some(e => sameDay(new Date(e.timestamp), new Date()))
  const water = state.gamification.waterByDate[selectedDayKey] ?? 0
  const notes = state.gamification.notesByDate[selectedDayKey] ?? 0
  const calorieTarget = effectiveCalories(profile)
  const dayProgress = dayRingProgress(dayEntries, notes, profile.loggingCommitment ?? 'light')
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
      ? state.gamification.xpEvents.filter(event => (
          Math.abs(new Date(event.timestamp).getTime() - new Date(mealEvent.timestamp).getTime()) < 2_000
        ))
      : state.gamification.xpEvents.slice(0, 4)
    const streakMilestone = fresh.some(event => event.key.startsWith('streak-'))
    playLogConfirm({ streakMilestone })
    setCelebration({
      foodName: justLogged.name,
      awards: fresh,
      mascotEvent: streakMilestone ? 'milestone' : 'log_success',
    })
  }, [location.key]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const prev = prevSeenBadgeCount.current
    const current = state.gamification.seenBadgeIds.length
    if (current > prev) {
      const allBadges = getAllBadges(state.foodEntries, streak)
      const newIds = state.gamification.seenBadgeIds.slice(prev)
      const newBadge = allBadges.find(b => newIds.includes(b.id))
      if (newBadge) {
        feel('badge')
        toast(`${newBadge.emoji} Badge unlocked: ${newBadge.name}!`)
        mascotEvent('milestone')
      }
    }
    prevSeenBadgeCount.current = current
  }, [state.gamification.seenBadgeIds.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const pendingLevelUp = state.gamification.pendingLevelUp

  return (
    <div className="app-shell home-shell today-refresh">
      {!paused && pendingLevelUp && <LevelUpOverlay level={pendingLevelUp} onDone={ackLevelUp} />}
      {!paused && celebration && !pendingLevelUp && (
        <LogCelebration
          foodName={celebration.foodName}
          streak={streak}
          awards={celebration.awards}
          cosmeticId={state.gamification.equippedCosmeticId}
          onDone={() => {
            const event = celebration.mascotEvent
            setCelebration(null)
            window.setTimeout(() => mascotEvent(event), 120)
          }}
        />
      )}

      {/* Streak and level are durable context. The day's actual action lives
          in the Day ring below instead of a second points target. */}
      <header className="home-counter-chips">
        <div className="today-heading">
          <p className="today-date">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <h1>{selectedDayLabel}</h1>
        </div>
        <button
          type="button"
          className="home-chip"
          ref={streakAnchor}
          onClick={() => { feel('open'); setShowDatePicker(true) }}
          aria-label={`${streak} day streak. Choose date.`}
        >
          <span className="home-chip-icon" aria-hidden>🔥</span>
          <span className="tabular">{streak}<span className="today-streak-label"> day streak</span></span>
        </button>
        <div className="home-chip" aria-label={`Level ${state.gamification.level}, ${state.gamification.xp} total XP`}>
          <span className="home-chip-icon" aria-hidden>⭐</span>
          <span className="tabular">Level {state.gamification.level}</span>
        </div>
      </header>

      {showDatePicker && (
        <DatePickerModal
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      <PullToRefresh onRefresh={refresh}>
      <main className="app-main home-main">
        {!revealed ? (
          <HomeSkeleton />
        ) : paused ? (
          <Surface className="home-ring-hero" style={{ textAlign: 'center' }}>
            <p className="onboarding-title" style={{ fontSize: '1.2rem' }}>Tracking is paused</p>
            <p className="page-sub">Calorie and macro numbers are hidden. Your streak is held where it is.</p>
          </Surface>
        ) : (
          <>
            {guest && (
              <Surface className="guest-save-card">
                <p className="home-today-kicker">YOUR FIRST LOG IS HERE</p>
                <h1 className="onboarding-title">Save your progress</h1>
                <p className="page-sub">
                  Continue to create an account and keep this device copy available across sign-in.
                </p>
                <button
                  type="button"
                  className="home-log-cta"
                  onClick={() => navigate('/login?mode=signup&claim=1')}
                >
                  Continue
                </button>
                <button
                  type="button"
                  className="settings-data-btn"
                  onClick={() => navigate('/login?mode=signin&claim=1')}
                >
                  I already have an account
                </button>
              </Surface>
            )}
            {/* The Day ring is deliberately calculated from logging actions
                only. The nutrition readout remains available just below it. */}
            <div ref={ringAnchor} className="home-ring-anchor">
              <Surface className="home-ring-hero">
                <div className="home-factual-readout">
                  <CalorieRing
                    consumed={totals.calories}
                    target={calorieTarget}
                    size={132}
                    onLog={() => guest ? navigate('/login?mode=signup&claim=1') : transitionTo('/log')}
                    actionLabel={selectedDayIsToday ? 'Tap to log' : 'Log for today'}
                  />
                  <div className="home-factual-copy">
                    <p className="home-ring-say">{snapshotLabel}</p>
                    <p className="home-ring-sub tabular">
                      {Math.round(totals.calories).toLocaleString()} of {Math.round(calorieTarget).toLocaleString()} kcal {totalDateLabel}
                    </p>
                  </div>
                </div>
                {!guest && <button
                  type="button"
                  className="home-log-cta"
                  onClick={() => { feel('press'); navigate('/log') }}
                >
                  <span aria-hidden>＋</span> {selectedDayIsToday ? 'Log a meal' : 'Log a meal today'}
                </button>}
                <DayRing progress={dayProgress} />
              </Surface>
            </div>

            <div className="home-macro-chips">
              {[
                { k: 'protein', label: 'PROTEIN', name: 'Protein', have: totals.protein, goal: effectiveProtein(profile) },
                { k: 'carbs', label: 'CARBS', name: 'Carbs', have: totals.carbs, goal: effectiveCarbs(profile) },
                { k: 'fat', label: 'FAT', name: 'Fat', have: totals.fat, goal: effectiveFat(profile) },
              ].map(m => (
                <div key={m.k} className={`home-macro-chip tone-${m.k}`}>
                  <div className="home-macro-top">
                    <span className="home-macro-label">{m.name}</span>
                    <span className="home-macro-value tabular">{Math.round(m.have)}g</span>
                  </div>
                  <span className="today-macro-goal">of {Math.round(m.goal)}g</span>
                  <div
                    className="home-macro-track"
                    role="progressbar"
                    aria-label={m.name}
                    aria-valuemin={0}
                    aria-valuemax={Math.round(m.goal)}
                    aria-valuenow={Math.round(Math.min(m.have, m.goal))}
                  >
                    <span
                      className="home-macro-fill"
                      style={{ width: `${m.goal > 0 ? Math.min(100, (m.have / m.goal) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="home-today-list">
              <div className="home-today-head">
                <h2 className="home-today-kicker">Your meals</h2>
                <span className="home-today-count">
                  {dayEntries.length === 0
                    ? 'No meals yet'
                    : `${dayEntries.length} ${dayEntries.length === 1 ? 'meal' : 'meals'} · ${Math.round(totals.calories).toLocaleString()} kcal`}
                </span>
              </div>
              {dayEntries.length === 0 ? (
                <p className="home-today-empty">
                  {selectedDayIsToday
                    ? 'Your day starts the moment you log something. Anything counts.'
                    : `Nothing was logged ${totalDateLabel}.`}
                </p>
              ) : (
                <div className="home-today-rows motion-stagger">
                  {dayEntries.map(entry => (
                    <SwipeRow
                      key={entry.id}
                      label={entry.name}
                      actions={[
                        { label: 'Edit', onAct: () => navigate(`/edit/${entry.id}`) },
                        { label: 'Delete', tone: 'danger', onAct: () => deleteEntry(entry.id) },
                      ]}
                    >
                      <button
                        type="button"
                        className="home-today-row"
                        onClick={() => { feel('tap'); navigate(`/edit/${entry.id}`) }}
                      >
                        <span className="home-today-emoji" aria-hidden>{entry.emoji ?? '🍽'}</span>
                        <span className="home-today-name">
                          {entry.name}
                          <small>{MEAL_LABELS[entry.mealType] ?? 'Meal'}</small>
                        </span>
                        <span className="home-today-kcal tabular">{Math.round(entry.calories)} kcal</span>
                      </button>
                    </SwipeRow>
                  ))}
                </div>
              )}
            </div>

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
              variant="extras"
            />

          </>
        )}
        <div className="home-scroll-pad" />
      </main>
      </PullToRefresh>

      {!guest && <BottomNav />}
    </div>
  )
}
