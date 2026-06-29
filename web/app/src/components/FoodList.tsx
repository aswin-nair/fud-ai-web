import { Link } from 'react-router-dom'
import type { FoodEntry, MealType } from '../types'
import { MEAL_LABELS } from '../types'
import { sameDay } from '../lib/dates'

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'other']

interface FoodListProps {
  entries: FoodEntry[]
  selectedDate: Date
}

export function FoodList({ entries, selectedDate }: FoodListProps) {
  const isToday = sameDay(selectedDate, new Date())
  const emptyTitle = isToday ? "Today's Food" : 'Food Log'

  if (entries.length === 0) {
    return (
      <section className="food-log-section">
        <h2 className="food-section-title muted">{emptyTitle}</h2>
        <div className="food-section-card inset">
          <p className="food-empty-text">No foods logged</p>
        </div>
      </section>
    )
  }

  const grouped = MEAL_ORDER.map(meal => ({
    meal,
    items: entries.filter(e => e.mealType === meal),
  })).filter(g => g.items.length > 0)

  return (
    <>
      {grouped.map(({ meal, items }) => (
        <section className="food-log-section" key={meal}>
          <h2 className="food-section-title">{MEAL_LABELS[meal]}</h2>
          <div className="food-section-card">
            {items.map((entry, i) => (
              <Link
                key={entry.id}
                to={`/edit/${entry.id}`}
                className={`food-card-row${i < items.length - 1 ? ' bordered' : ''}`}
              >
                <span className="food-card-emoji">{entry.emoji ?? '🍽️'}</span>
                <div className="food-card-info">
                  <div className="food-card-top">
                    <span className="food-card-name">{entry.name}</span>
                  </div>
                  <div className="food-card-meta">
                    <span className="food-card-cals">{entry.calories} kcal</span>
                    <span className="food-card-dot">·</span>
                    <span>
                      P {Math.round(entry.protein)}g · C {Math.round(entry.carbs)}g · F {Math.round(entry.fat)}g
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
