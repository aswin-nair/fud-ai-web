import { useEffect, useRef, useState } from 'react'
import { CalorieHero } from '../components/CalorieHero'
import { MacroGrid } from '../components/MacroGrid'
import { FoodList } from '../components/FoodList'
import { WeekStrip } from '../components/WeekStrip'
import { AddMenuButton } from '../components/AddMenuButton'
import { BottomNav } from '../components/BottomNav'
import { Confetti } from '../components/Confetti'
import { useToast } from '../components/Toast'
import { useApp } from '../store/AppContext'
import { entriesForDay, macroTotals } from '../lib/storage'
import { effectiveCalories, effectiveProtein, effectiveCarbs, effectiveFat } from '../lib/profile'
import { startOfDay, sameDay } from '../lib/dates'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function HomePage() {
  const { state } = useApp()
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState(() => startOfDay())
  const [showConfetti, setShowConfetti] = useState(false)
  const celebratedKey = useRef('')

  const dayEntries = entriesForDay(state.foodEntries, selectedDate)
  const totals = macroTotals(dayEntries)
  const profile = state.profile
  const firstName = profile.name?.split(' ')[0]
  const goal = effectiveCalories(profile)

  useEffect(() => {
    if (goal <= 0) return
    const dateKey = selectedDate.toDateString()
    const near = totals.calories >= goal && totals.calories <= goal * 1.08
    if (near && celebratedKey.current !== dateKey) {
      celebratedKey.current = dateKey
      setShowConfetti(true)
      if (sameDay(selectedDate, new Date())) {
        toast('🎉 Goal reached! Great work!')
      }
    }
  }, [totals.calories]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app-shell home-shell">
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      <header className="home-header">
        <div className="home-greeting">
          <span className="home-greeting-text">
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </span>
        </div>
        <AddMenuButton />
      </header>

      <main className="app-main home-main">
        <WeekStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

        <CalorieHero current={totals.calories} goal={goal} />

        <MacroGrid
          protein={{ current: totals.protein, goal: effectiveProtein(profile) }}
          carbs={{ current: totals.carbs, goal: effectiveCarbs(profile) }}
          fat={{ current: totals.fat, goal: effectiveFat(profile) }}
        />

        <FoodList entries={dayEntries} selectedDate={selectedDate} />
      </main>

      <BottomNav />
    </div>
  )
}
