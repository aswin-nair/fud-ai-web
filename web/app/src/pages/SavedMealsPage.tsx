import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { BackLink } from '../components/BackLink'
import { IconMinus, IconPlus, IconSearch, IconStar } from '../components/icons'
import { useApp, isFavorite } from '../store/AppContext'
import { recentMeals, mealKey } from '../lib/meals'
import { MEAL_LABELS } from '../types'
import type { SavedMeal } from '../types'
import type { FoodEntry } from '../types'

const FILTERS = ['all', ...Object.keys(MEAL_LABELS)] as const
type Filter = (typeof FILTERS)[number]

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  ...MEAL_LABELS,
}

function macroRatio(protein: number, carbs: number, fat: number) {
  const cals = Math.max(protein * 4 + carbs * 4 + fat * 9, 0.001)
  return {
    p: Math.max(0, (protein * 4) / cals) * 100,
    c: Math.max(0, (carbs * 4) / cals) * 100,
    f: Math.max(0, (fat * 9) / cals) * 100,
  }
}

function DiscoverCard({
  emoji, name, calories, protein, carbs, fat, onLog, onStar, starred,
}: {
  emoji?: string; name: string; calories: number
  protein: number; carbs: number; fat: number
  onLog: (servings: number) => void; onStar: () => void; starred: boolean
}) {
  const [servings, setServings] = useState(1)
  const ratio = macroRatio(protein, carbs, fat)

  function changeServings(next: number) {
    setServings(Math.max(0.25, Math.round(next * 4) / 4))
  }

  return (
    <div className="discover-card">
      <div className="discover-card-top">
        <span className="discover-card-emoji">{emoji ?? '🍽️'}</span>
        <button
          type="button"
          className={`star-btn${starred ? ' active' : ''}`}
          onClick={onStar}
          aria-label={starred ? 'Unfavorite' : 'Favorite'}
        >
          <IconStar active={starred} size={17} />
        </button>
      </div>

      <strong className="discover-card-name">{name}</strong>
      <span className="discover-card-cals">{Math.round(calories * servings)} kcal</span>

      <div className="discover-macro-bar" aria-hidden>
        <span style={{ width: `${ratio.p}%`, background: '#6B9FFF' }} />
        <span style={{ width: `${ratio.c}%`, background: '#FFB347' }} />
        <span style={{ width: `${ratio.f}%`, background: '#FF6B9D' }} />
      </div>

      <div className="discover-card-footer">
        <div className="serving-stepper-compact">
          <button type="button" className="ssc-btn" onClick={() => changeServings(servings - 0.25)} disabled={servings <= 0.25} aria-label="Decrease servings"><IconMinus size={12} strokeWidth={2.6} /></button>
          <span className="ssc-val">{servings}×</span>
          <button type="button" className="ssc-btn" onClick={() => changeServings(servings + 0.25)} aria-label="Increase servings"><IconPlus size={12} strokeWidth={2.6} /></button>
        </div>
        <button type="button" className="log-pill-btn" onClick={() => onLog(servings)}>Log</button>
      </div>
    </div>
  )
}

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
            <IconStar active={starred} size={17} />
          </button>
        )}
        <div className="serving-stepper-compact">
          <button type="button" className="ssc-btn" onClick={() => changeServings(servings - 0.25)} disabled={servings <= 0.25} aria-label="Decrease servings"><IconMinus size={13} strokeWidth={2.6} /></button>
          <span className="ssc-val">{servings}×</span>
          <button type="button" className="ssc-btn" onClick={() => changeServings(servings + 0.25)} aria-label="Increase servings"><IconPlus size={13} strokeWidth={2.6} /></button>
        </div>
        <button type="button" className="log-pill-btn" onClick={() => onLog(servings)}>Log</button>
      </div>
    </div>
  )
}

export function SavedMealsPage() {
  const { state, logSavedMeal, toggleFavorite } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const recents = recentMeals(state.foodEntries)

  // Reached both as the "Discover" tab and as a shortcut from the Log menu — only
  // the latter is a sub-page that needs a way back.
  const isSubRoute = location.pathname === '/log/saved'

  const filteredFavorites = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.favoriteMeals.filter(meal => {
      const matchesQuery = !q || meal.name.toLowerCase().includes(q)
      const matchesFilter = filter === 'all' || meal.mealType === filter
      return matchesQuery && matchesFilter
    })
  }, [state.favoriteMeals, query, filter])

  function logEntry(entry: FoodEntry, servings: number) {
    const cals = Math.round(entry.calories * servings)
    const logged = logSavedMeal({
      id: mealKey(entry),
      name: entry.name,
      calories: cals,
      protein: Math.round(entry.protein * servings * 10) / 10,
      carbs: Math.round(entry.carbs * servings * 10) / 10,
      fat: Math.round(entry.fat * servings * 10) / 10,
      emoji: entry.emoji,
      mealType: entry.mealType,
      servingSizeGrams: entry.servingSizeGrams,
    })
    navigate('/', { state: { justLogged: { id: logged.id, calories: cals, name: entry.name } } })
  }

  function logMeal(meal: SavedMeal, servings: number) {
    const cals = Math.round(meal.calories * servings)
    const logged = logSavedMeal({
      ...meal,
      calories: cals,
      protein: Math.round(meal.protein * servings * 10) / 10,
      carbs: Math.round(meal.carbs * servings * 10) / 10,
      fat: Math.round(meal.fat * servings * 10) / 10,
    })
    navigate('/', { state: { justLogged: { id: logged.id, calories: cals, name: meal.name } } })
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        {isSubRoute && <BackLink to="/log" />}
        <h1 className="page-title discover-title" style={isSubRoute ? { marginTop: 12 } : undefined}>Discover</h1>
        <p className="page-sub">Your saved meals, ready to re-log in a tap.</p>

        <div className="discover-search">
          <IconSearch size={16} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search your saved meals"
            aria-label="Search saved meals"
          />
        </div>

        <div className="discover-chip-row">
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              className={`discover-chip${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        <div className="discover-section-header">
          <span className="discover-section-title">Your saved meals</span>
          <span className="discover-count-badge">{filteredFavorites.length}</span>
        </div>

        {state.favoriteMeals.length === 0 ? (
          <div className="saved-empty">Star a meal from your food log to save it here.</div>
        ) : filteredFavorites.length === 0 ? (
          <div className="saved-empty">No saved meals match "{query || FILTER_LABELS[filter]}".</div>
        ) : (
          <div className="discover-grid">
            {filteredFavorites.map(meal => (
              <DiscoverCard
                key={meal.id}
                emoji={meal.emoji}
                name={meal.name}
                calories={meal.calories}
                protein={meal.protein}
                carbs={meal.carbs}
                fat={meal.fat}
                onLog={s => logMeal(meal, s)}
                onStar={() => toggleFavorite(meal)}
                starred
              />
            ))}
          </div>
        )}

        <div className="saved-section" style={{ marginTop: 24 }}>
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
