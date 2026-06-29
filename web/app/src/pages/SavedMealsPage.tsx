import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { useApp, isFavorite } from '../store/AppContext'
import { recentMeals, mealKey } from '../lib/meals'
import { MEAL_LABELS } from '../types'

export function SavedMealsPage() {
  const { state, logSavedMeal, toggleFavorite } = useApp()
  const recents = recentMeals(state.foodEntries)

  return (
    <div className="app-shell">
      <main className="app-main">
        <Link to="/log" style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>← Back</Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>Saved meals</h1>
        <p className="page-sub">Quick re-log from recents or favorites.</p>

        <div className="meal-section">
          <div className="meal-header">Favorites</div>
          {state.favoriteMeals.length === 0 ? (
            <p className="empty-inline">Star a meal from your food log to save it here.</p>
          ) : (
            state.favoriteMeals.map(meal => (
              <div key={meal.id} className="saved-row">
                <span className="food-emoji">{meal.emoji ?? '🍽️'}</span>
                <div className="food-info">
                  <div className="food-name">{meal.name}</div>
                  <div className="food-meta">{meal.calories} kcal · {MEAL_LABELS[meal.mealType]}</div>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => logSavedMeal(meal)}>Log</button>
              </div>
            ))
          )}
        </div>

        <div className="meal-section">
          <div className="meal-header">Recents</div>
          {recents.length === 0 ? (
            <p className="empty-inline">No meals logged yet.</p>
          ) : (
            recents.map(entry => (
              <div key={entry.id} className="saved-row">
                <span className="food-emoji">{entry.emoji ?? '🍽️'}</span>
                <div className="food-info">
                  <div className="food-name">{entry.name}</div>
                  <div className="food-meta">{entry.calories} kcal</div>
                </div>
                <button
                  type="button"
                  className={`btn-star${isFavorite(state, entry) ? ' active' : ''}`}
                  onClick={() => toggleFavorite(entry)}
                  aria-label="Favorite"
                >
                  {isFavorite(state, entry) ? '★' : '☆'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => logSavedMeal({
                    id: mealKey(entry),
                    name: entry.name,
                    calories: entry.calories,
                    protein: entry.protein,
                    carbs: entry.carbs,
                    fat: entry.fat,
                    emoji: entry.emoji,
                    mealType: entry.mealType,
                    servingSizeGrams: entry.servingSizeGrams,
                  })}
                >
                  Log
                </button>
              </div>
            ))
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
