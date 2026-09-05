import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LevelUpOverlay } from '../components/LevelUpOverlay'
import { DatePickerModal } from '../components/DatePickerModal'
import { BottomNav } from '../components/BottomNav'
import { MomoSticker } from '../components/MomoSticker'
import { HabitMilestones } from '../components/HabitMilestones'
import { FoodIcon, IconCalendar, IconFlame, IconStar, IconPlus, IconCamera, IconJourney, IconArrowRight, IconProtein, IconCarbs, IconWater, IconMeal, IconShield } from '../components/icons'
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
import { playLogConfirm, setFeelEnabled } from '../lib/feel'
import { evaluateNotifications } from '../lib/notifications'
import { LogCelebration } from '../components/LogCelebration'
import { Surface } from '../components/Surface'
import { MEAL_LABELS, type FoodEntry, type XpEvent } from '../types'
import { useAnchor } from '../mascot/anchors'
import { CalorieRing } from '../components/CalorieRing'
import { effectiveCalories } from '../lib/profile'
import { mascotEvent } from '../mascot/MascotOverlay'
import { dayRingProgress } from '../lib/dayRing'
import { DayRing } from '../components/DayRing'

interface JustLogged { id?: string; calories: number; name: string }

interface CelebrationState {
  entryId?: string
  foodName: string
  awards: XpEvent[]
  mascotEvent: 'log_success' | 'milestone'
}

export function HomePage({ guest = false }: { guest?: boolean }) {
  const { state, ackLevelUp, patchGamification, deleteEntry, restoreEntry, refresh } = useApp()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const feel = useFeel()
  const streakAnchor = useAnchor('streak_flame')
  const ringAnchor = useAnchor('calorie_ring')
  const [selectedDate, setSelectedDate] = useState(() => startOfDay())
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
      entryId: justLogged.id,
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
        toast(`Badge unlocked: ${newBadge.name}!`)
        mascotEvent('milestone')
      }
    }
    prevSeenBadgeCount.current = current
  }, [state.gamification.seenBadgeIds.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const pendingLevelUp = state.gamification.pendingLevelUp
  function removeMeal(entry: FoodEntry) {
    deleteEntry(entry.id)
    toast(`Removed ${entry.name}`, {
      type: 'info',
      action: { label: 'Undo', fn: () => restoreEntry(entry) },
    })
  }

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
            const entryId = celebration.entryId
            if (entryId) toast(`Logged ${celebration.foodName}`, {
              action: { label: 'Undo', fn: () => deleteEntry(entryId) },
            })
            setCelebration(null)
            window.setTimeout(() => mascotEvent(event), 120)
          }}
        />
      )}

      {/* Streak and level remain context; meal logging is the primary action. */}
      <header className="home-counter-chips" data-mascot-avoid>
        <div className="today-heading">
          <p className="today-date">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <h1>{selectedDayLabel}</h1>
        </div>
        <div className="today-badges">
          <button
            type="button"
            className="home-chip"
            ref={streakAnchor}
            onClick={() => { feel('open'); setShowDatePicker(true) }}
            aria-label={`${streak} day streak. Choose date.`}
          >
            <IconFlame size={22} />
            <span className="tabular">{streak}<span className="today-streak-label"> day streak</span></span>
          </button>
          <div className="home-chip" aria-label={`Level ${state.gamification.level}, ${state.gamification.xp} total XP`}>
            <IconStar size={22} />
            <span className="tabular">Level {state.gamification.level}</span>
          </div>
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
        {paused ? (
          <Surface className="home-ring-hero" style={{ textAlign: 'center' }}>
            <p className="onboarding-title" style={{ fontSize: '1.2rem' }}>Tracking is paused</p>
            <p className="page-sub">Calorie and macro numbers are hidden. Your streak is held where it is.</p>
            <Link className="today-shortcut" to="/settings">Manage pause <IconArrowRight /></Link>
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
            {/* Nutrition stays factual; optional habit progress is separate below. */}
            <div ref={ringAnchor} className="home-ring-anchor" data-mascot-avoid>
              <Surface className="home-ring-hero today-nutrition-card">
                <div className="today-summary-heading">
                  <h2>{snapshotLabel}</h2>
                  <button type="button" className="today-date-button" onClick={() => setShowDatePicker(true)} aria-label="Choose date"><IconCalendar /></button>
                </div>
                <div className="home-factual-readout">
                  <CalorieRing
                    consumed={totals.calories}
                    target={calorieTarget}
                    size={156}
                  />
                  <div className="home-factual-copy">
                    <p className="today-energy-value tabular">{Math.round(totals.calories).toLocaleString()}<span>kcal logged</span></p>
                    <p className="home-ring-sub tabular">
                      Daily guide: {Math.round(calorieTarget).toLocaleString()} kcal
                    </p>
                  </div>
                </div>
                {!guest && <button
                  type="button"
                  className="home-log-cta"
                  onClick={() => { feel('press'); navigate('/log') }}
                >
                  <IconPlus size={24} /> {selectedDayIsToday ? 'Log a meal' : 'Log a meal today'} <IconArrowRight size={22} />
                </button>}
                {!guest && <div className="today-shortcuts">
                  <Link className="today-shortcut" to="/log/photo"><IconCamera /> Scan food</Link>
                  <Link className="today-shortcut" to="/log/saved"><IconJourney /> Saved meals</Link>
                </div>}
                <p className="today-guide-note">A guide, not a grade.</p>
              </Surface>
            </div>

            <div className="home-macro-chips" data-mascot-avoid>
              {[
                { k: 'protein', Icon: IconProtein, name: 'Protein', have: totals.protein, goal: effectiveProtein(profile) },
                { k: 'carbs', Icon: IconCarbs, name: 'Carbs', have: totals.carbs, goal: effectiveCarbs(profile) },
                { k: 'fat', Icon: IconWater, name: 'Fat', have: totals.fat, goal: effectiveFat(profile) },
              ].map(m => (
                <div key={m.k} className={`home-macro-chip tone-${m.k}`}>
                  <div className="home-macro-top">
                    <span className="home-macro-label"><m.Icon size={16} />{m.name}</span>
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
                <div className="home-today-empty"><IconMeal size={32} />
                  <strong>{selectedDayIsToday ? 'Your table is ready' : 'A quiet page'}</strong>
                  <p>{selectedDayIsToday ? 'Start with whatever you ate. You can change the details later.' : `Nothing was logged ${totalDateLabel}.`}</p>
                </div>
              ) : (
                <div className="home-today-rows motion-stagger">
                  {dayEntries.map(entry => (
                    <SwipeRow
                      key={entry.id}
                      label={entry.name}
                      actions={[
                        { label: 'Edit', onAct: () => navigate(`/edit/${entry.id}`) },
                        { label: 'Delete', tone: 'danger', onAct: () => removeMeal(entry) },
                      ]}
                    >
                      <button
                        type="button"
                        className="home-today-row"
                        onClick={() => { feel('tap'); navigate(`/edit/${entry.id}`) }}
                      >
                        <span className="home-today-emoji"><FoodIcon emoji={entry.emoji} /></span>
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

            {state.gamification.mascotActivity !== 'off' && !profile.mascotMuted && <aside className="today-momo-note">
              <MomoSticker mood={dayEntries.length > 0 ? 'proud' : 'cozy'} />
              <div><strong>Momo’s little reminder</strong><p>{selectedDayIsToday
                ? dayEntries.length > 0 ? 'You showed up. That’s the part worth celebrating.' : 'Fancy breakfast, leftover pizza—it all belongs here.'
                : 'A page from your food story. No grades attached.'}</p>
                {profile.mascotRoasts && <button type="button" className="today-roast-button" onClick={() => mascotEvent('poke')}>Roast me <IconFlame size={18} /></button>}
              </div>
            </aside>}

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
            <section className="today-routine-card">
              <DayRing progress={dayProgress} />
              {state.gamification.streakFreezes > 0 && <p className="today-freeze-note"><IconShield /> {state.gamification.streakFreezes} streak {state.gamification.streakFreezes === 1 ? 'freeze' : 'freezes'} available for a day off.</p>}
            </section>
            <HabitMilestones loggedDays={getTotalLoggedDays(state.foodEntries)} />

          </>
        )}
        <div className="home-scroll-pad" />
      </main>
      </PullToRefresh>

      {!guest && <BottomNav />}
    </div>
  )
}
