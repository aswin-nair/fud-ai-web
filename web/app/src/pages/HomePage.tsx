import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalorieHero } from '../components/CalorieHero'
import { MacroGrid } from '../components/MacroGrid'
import { FoodList } from '../components/FoodList'
import { WeekStrip } from '../components/WeekStrip'
import { StreakCard } from '../components/StreakCard'
import { LevelUpOverlay } from '../components/LevelUpOverlay'
import { ActivitySheet } from '../components/ActivitySheet'
import { AddMenuButton } from '../components/AddMenuButton'
import { BottomNav } from '../components/BottomNav'
import { Confetti } from '../components/Confetti'
import { HomeSkeleton } from '../components/HomeSkeleton'
import { useToast } from '../components/Toast'
import { useApp } from '../store/AppContext'
import { entriesForDay, macroTotals } from '../lib/storage'
import { effectiveCalories, effectiveProtein, effectiveCarbs, effectiveFat } from '../lib/profile'
import { startOfDay, sameDay, localDayKey } from '../lib/dates'
import { getStreakWithFreezes, getAllBadges } from '../lib/journey'
import { getMotivation } from '../lib/motivation'
import { useHaptic } from '../hooks/useHaptic'
import { ACTIVITY_PRESETS, type ActivityPreset } from '../lib/activities'

const REVEAL_DELAY_MS = 420

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function dateLabel(): string {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
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
  const celebratedKey = useRef('')
  const loggedNavKey = useRef('')
  const prevSeenBadgeCount = useRef(state.gamification.seenBadgeIds.length)

  const dayEntries = entriesForDay(state.foodEntries, selectedDate)
  const totals = macroTotals(dayEntries)
  const profile = state.profile
  const firstName = profile.name?.split(' ')[0]
  const initial = (firstName ?? profile.name ?? 'F').trim().charAt(0) || 'F'
  const goal = effectiveCalories(profile)

  const selectedDayKey = localDayKey(selectedDate)
  const burned = state.exerciseEntries
    .filter(e => localDayKey(new Date(e.timestamp)) === selectedDayKey)
    .reduce((sum, e) => sum + e.caloriesBurned, 0)

  const streak = getStreakWithFreezes(state.foodEntries, state.gamification.freezeUsedDates)
  const motivation = getMotivation(totals.calories, goal + burned)

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
    vibrate(15)
    setRingPop(true)
    const t = setTimeout(() => setRingPop(false), 600)
    return () => clearTimeout(t)
  }, [location.key]) // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div className="app-shell home-shell">
      <div className={`home-ambient-glow zone-${motivation.zone}`} aria-hidden />

      {showConfetti && !pendingLevelUp && <Confetti onDone={() => setShowConfetti(false)} />}
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
        <div className="home-header-left">
          <div className="home-avatar" aria-hidden>{initial}</div>
          <div className="home-greeting">
            <span className="home-greeting-text">
              {greeting()}{firstName ? `, ${firstName}` : ''}
            </span>
            <span className="home-date">{dateLabel()}</span>
            <StreakCard streak={streak} entries={state.foodEntries} gamification={state.gamification} />
          </div>
        </div>
        <AddMenuButton />
      </header>

      <main className="app-main home-main">
        {!revealed ? (
          <HomeSkeleton />
        ) : (
          <>
            <div className="home-section-enter" style={{ '--enter-delay': '0ms' } as React.CSSProperties}>
              <WeekStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
            </div>
            <div className="home-hero-enter" style={{ '--enter-delay': '60ms' } as React.CSSProperties}>
              <CalorieHero current={totals.calories} goal={goal} burned={burned} pop={ringPop} />
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

            <div className="home-section-enter" style={{ '--enter-delay': '120ms' } as React.CSSProperties}>
              <MacroGrid
                protein={{ current: totals.protein, goal: effectiveProtein(profile) }}
                carbs={{ current: totals.carbs, goal: effectiveCarbs(profile) }}
                fat={{ current: totals.fat, goal: effectiveFat(profile) }}
              />
            </div>
            <div className="home-section-enter" style={{ '--enter-delay': '180ms' } as React.CSSProperties}>
              <FoodList entries={dayEntries} selectedDate={selectedDate} />
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
