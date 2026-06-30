import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { useApp, isFavorite } from '../store/AppContext'
import { useToast } from '../components/Toast'
import { recentMeals, mealKey } from '../lib/meals'
import { MEAL_LABELS } from '../types'
import type { SavedMeal } from '../types'
import type { FoodEntry } from '../types'

function MealRow({
  emoji, name, calories, protein, carbs, fat, mealType,
  onLog, onStar, starred,
}: {
  emoji?: string; name: string; calories: number
  protein: number; carbs: number; fat: number; mealType: string
  onLog: (servings: number) => void; onStar?: () => void; starred?: boolean
}) {
  const [servings, setServings] = useState(1)

  function changeServings(next: number) {
    setServings(Math.max(0.25, Math.round(next * 4) / 4))
  }

  return (
    <div className="saved-meal-row">
      <span className="saved-meal-emoji">{emoji ?? '🍽️'}</span>
      <div className="saved-meal-info">
        <span className="saved-meal-name">{name}</span>
        <div className="saved-meal-meta">
          <span className="saved-meal-cals">{Math.round(calories * servings)} kcal</span>
          <span className="saved-meal-dot">·</span>
          <span className="saved-meal-macros">
            <span style={{ color: '#6B9FFF' }}>P {Math.round(protein * servings)}g</span>
            {' · '}
            <span style={{ color: '#FFB347' }}>C {Math.round(carbs * servings)}g</span>
            {' · '}
            <span style={{ color: '#FF6B9D' }}>F {Math.round(fat * servings)}g</span>
          </span>
        </div>
        <span className="saved-meal-type">{MEAL_LABELS[mealType as keyof typeof MEAL_LABELS] ?? mealType}</span>
      </div>
      <div className="saved-meal-actions">
        {onStar && (
          <button
            type="button"
            className={`star-btn${starred ? ' active' : ''}`}
            onClick={onStar}
            aria-label={starred ? 'Unfavorite' : 'Favorite'}
          >
            {starred ? '★' : '☆'}
          </button>
        )}
        <div className="serving-stepper-compact">
          <button type="button" className="ssc-btn" onClick={() => changeServings(servings - 0.25)} disabled={servings <= 0.25}>−</button>
          <span className="ssc-val">{servings}×</span>
          <button type="button" className="ssc-btn" onClick={() => changeServings(servings + 0.25)}>+</button>
        </div>
        <button type="button" className="log-pill-btn" onClick={() => onLog(servings)}>Log</button>
      </div>
    </div>
  )
}

export function SavedMealsPage() {
  const { state, logSavedMeal, toggleFavorite } = useApp()
  const { toast } = useToast()
  const recents = recentMeals(state.foodEntries)

  function logEntry(entry: FoodEntry, servings: number) {
    logSavedMeal({
      id: mealKey(entry),
      name: entry.name,
      calories: Math.round(entry.calories * servings),
      protein: Math.round(entry.protein * servings * 10) / 10,
      carbs: Math.round(entry.carbs * servings * 10) / 10,
      fat: Math.round(entry.fat * servings * 10) / 10,
      emoji: entry.emoji,
      mealType: entry.mealType,
      servingSizeGrams: entry.servingSizeGrams,
    })
    toast(`Logged ${entry.name}${servings !== 1 ? ` ×${servings}` : ''}!`)
  }

  function logMeal(meal: SavedMeal, servings: number) {
    logSavedMeal({
      ...meal,
      calories: Math.round(meal.calories * servings),
      protein: Math.round(meal.protein * servings * 10) / 10,
      carbs: Math.round(meal.carbs * servings * 10) / 10,
      fat: Math.round(meal.fat * servings * 10) / 10,
    })
    toast(`Logged ${meal.name}${servings !== 1 ? ` ×${servings}` : ''}!`)
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <Link to="/log" className="back-link">← Back</Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>Saved meals</h1>
        <p className="page-sub">Quick re-log from recents or favorites.</p>

        <div className="saved-section">
          <div className="saved-section-header">
            <span className="saved-section-icon">★</span>
            <span className="saved-section-title">Favorites</span>
          </div>
          {state.favoriteMeals.length === 0 ? (
            <div className="saved-empty">Star a meal from your food log to save it here.</div>
          ) : (
            <div className="saved-card">
              {state.favoriteMeals.map((meal, i) => (
                <div key={meal.id}>
                  <MealRow
                    emoji={meal.emoji}
                    name={meal.name}
                    calories={meal.calories}
                    protein={meal.protein}
                    carbs={meal.carbs}
                    fat={meal.fat}
                    mealType={meal.mealType}
                    onLog={s => logMeal(meal, s)}
                  />
                  {i < state.favoriteMeals.length - 1 && <div className="saved-divider" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="saved-section">
          <div className="saved-section-header">
            <span className="saved-section-icon">🕐</span>
            <span className="saved-section-title">Recents</span>
          </div>
          {recents.length === 0 ? (
            <div className="saved-empty">No meals logged yet.</div>
          ) : (
            <div className="saved-card">
              {recents.map((entry, i) => (
                <div key={entry.id}>
                  <MealRow
                    emoji={entry.emoji}
                    name={entry.name}
                    calories={entry.calories}
                    protein={entry.protein}
                    carbs={entry.carbs}
                    fat={entry.fat}
                    mealType={entry.mealType}
                    onLog={s => logEntry(entry, s)}
                    onStar={() => toggleFavorite(entry)}
                    starred={isFavorite(state, entry)}
                  />
                  {i < recents.length - 1 && <div className="saved-divider" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
