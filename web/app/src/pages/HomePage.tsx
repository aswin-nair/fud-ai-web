import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalorieHero } from '../components/CalorieHero'
import { MacroGrid } from '../components/MacroGrid'
import { FoodList } from '../components/FoodList'
import { WeekStrip } from '../components/WeekStrip'
import { StreakCard } from '../components/StreakCard'
import { LevelUpOverlay } from '../components/LevelUpOverlay'
import { AddMenuButton } from '../components/AddMenuButton'
import { BottomNav } from '../components/BottomNav'
import { Confetti } from '../components/Confetti'
import { useToast } from '../components/Toast'
import { useApp } from '../store/AppContext'
import { entriesForDay, macroTotals } from '../lib/storage'
import { effectiveCalories, effectiveProtein, effectiveCarbs, effectiveFat } from '../lib/profile'
import { startOfDay, sameDay } from '../lib/dates'
import { getStreakWithFreezes, getAllBadges } from '../lib/journey'
import { useHaptic } from '../hooks/useHaptic'

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
  const celebratedKey = useRef('')
  const loggedNavKey = useRef('')
  const prevSeenBadgeCount = useRef(state.gamification.seenBadgeIds.length)

  const dayEntries = entriesForDay(state.foodEntries, selectedDate)
  const totals = macroTotals(dayEntries)
  const profile = state.profile
  const firstName = profile.name?.split(' ')[0]
  const goal = effectiveCalories(profile)

  const streak = getStreakWithFreezes(state.foodEntries, state.gamification.freezeUsedDates)

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
      {showConfetti && !pendingLevelUp && <Confetti onDone={() => setShowConfetti(false)} />}
      {pendingLevelUp && <LevelUpOverlay level={pendingLevelUp} onDone={ackLevelUp} />}

      <header className="home-header">
        <div className="home-greeting">
          <span className="home-greeting-text">
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </span>
          <StreakCard streak={streak} entries={state.foodEntries} gamification={state.gamification} />
        </div>
        <AddMenuButton />
      </header>

      <main className="app-main home-main">
        <div className="home-section-enter" style={{ '--enter-delay': '0ms' } as React.CSSProperties}>
          <WeekStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
        </div>
        <div className="home-section-enter" style={{ '--enter-delay': '60ms' } as React.CSSProperties}>
          <CalorieHero current={totals.calories} goal={goal} pop={ringPop} />
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
      </main>

      <BottomNav />
    </div>
  )
}
