import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { useApp, isFavorite } from '../store/AppContext'
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
  onLog: () => void; onStar?: () => void; starred?: boolean
}) {
  return (
    <div className="saved-meal-row">
      <span className="saved-meal-emoji">{emoji ?? '🍽️'}</span>
      <div className="saved-meal-info">
        <span className="saved-meal-name">{name}</span>
        <div className="saved-meal-meta">
          <span className="saved-meal-cals">{calories} kcal</span>
          <span className="saved-meal-dot">·</span>
          <span className="saved-meal-macros">
            <span style={{ color: '#6B9FFF' }}>P {Math.round(protein)}g</span>
            {' · '}
            <span style={{ color: '#FFB347' }}>C {Math.round(carbs)}g</span>
            {' · '}
            <span style={{ color: '#FF6B9D' }}>F {Math.round(fat)}g</span>
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
        <button type="button" className="log-pill-btn" onClick={onLog}>Log</button>
      </div>
    </div>
  )
}

export function SavedMealsPage() {
  const { state, logSavedMeal, toggleFavorite } = useApp()
  const recents = recentMeals(state.foodEntries)

  function logEntry(entry: FoodEntry) {
    logSavedMeal({
      id: mealKey(entry),
      name: entry.name,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      emoji: entry.emoji,
      mealType: entry.mealType,
      servingSizeGrams: entry.servingSizeGrams,
    })
  }

  function logMeal(meal: SavedMeal) {
    logSavedMeal(meal)
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
                    onLog={() => logMeal(meal)}
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
                    onLog={() => logEntry(entry)}
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
