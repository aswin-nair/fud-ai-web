import { useState } from 'react'
import { CalorieHero } from '../components/CalorieHero'
import { MacroGrid } from '../components/MacroGrid'
import { FoodList } from '../components/FoodList'
import { WeekStrip } from '../components/WeekStrip'
import { AddMenuButton } from '../components/AddMenuButton'
import { BottomNav } from '../components/BottomNav'
import { useApp } from '../store/AppContext'
import { entriesForDay, macroTotals } from '../lib/storage'
import { effectiveCalories, effectiveProtein, effectiveCarbs, effectiveFat } from '../lib/profile'
import { startOfDay } from '../lib/dates'

export function HomePage() {
  const { state } = useApp()
  const [selectedDate, setSelectedDate] = useState(() => startOfDay())
  const dayEntries = entriesForDay(state.foodEntries, selectedDate)
  const totals = macroTotals(dayEntries)
  const profile = state.profile

  return (
    <div className="app-shell home-shell">
      <header className="home-header">
        <div />
        <AddMenuButton />
      </header>

      <main className="app-main home-main">
        <WeekStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

        <CalorieHero current={totals.calories} goal={effectiveCalories(profile)} />

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
