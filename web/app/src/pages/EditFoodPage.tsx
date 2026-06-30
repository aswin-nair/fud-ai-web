import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp, isFavorite } from '../store/AppContext'
import type { MealType } from '../types'
import { MEAL_LABELS } from '../types'

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎', other: '🍽️',
}

const MACROS = [
  { key: 'protein', label: 'Protein', color: '#6B9FFF' },
  { key: 'carbs',   label: 'Carbs',   color: '#FFB347' },
  { key: 'fat',     label: 'Fat',     color: '#FF6B9D' },
] as const

export function EditFoodPage() {
  const { id } = useParams<{ id: string }>()
  const { state, updateEntry, deleteEntry, toggleFavorite } = useApp()
  const navigate = useNavigate()
  const entry = state.foodEntries.find(e => e.id === id)

  const [name, setName] = useState(entry?.name ?? '')
  const [calories, setCalories] = useState(String(entry?.calories ?? ''))
  const [protein, setProtein] = useState(String(entry?.protein ?? ''))
  const [carbs, setCarbs] = useState(String(entry?.carbs ?? ''))
  const [fat, setFat] = useState(String(entry?.fat ?? ''))
  const [mealType, setMealType] = useState<MealType>(entry?.mealType ?? 'other')

  if (!entry) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <p style={{ color: 'var(--ink-soft)' }}>Entry not found.</p>
          <button type="button" className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => navigate('/')}>← Home</button>
        </main>
      </div>
    )
  }

  const fav = isFavorite(state, entry)

  function save() {
    if (!entry) return
    updateEntry({
      ...entry,
      name: name.trim(),
      calories: Math.round(Number(calories)),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      mealType,
    })
    navigate('/')
  }

  function remove() {
    if (!entry) return
    if (!confirm('Delete this entry?')) return
    deleteEntry(entry.id)
    navigate('/')
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <div className="edit-topbar">
          <button type="button" className="back-link" onClick={() => navigate('/')}>← Back</button>
          <button
            type="button"
            className={`fav-btn${fav ? ' active' : ''}`}
            onClick={() => toggleFavorite(entry)}
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
          >
            {fav ? '★' : '☆'}
          </button>
        </div>

        {/* Name + emoji hero */}
        <div className="edit-hero">
          <span className="edit-hero-emoji">{entry.emoji ?? '🍽️'}</span>
          <input
            className="edit-name-input"
            value={name}
            onChange={e => setName(e.target.value)}
            aria-label="Food name"
          />
        </div>

        {/* Calorie card */}
        <div className="review-calorie-card">
          <span className="review-calorie-label">Calories</span>
          <input
            className="review-calorie-input"
            type="number"
            value={calories}
            onChange={e => setCalories(e.target.value)}
            aria-label="Calories"
          />
          <span className="review-calorie-unit">kcal</span>
        </div>

        {/* Macro cards */}
        <div className="review-macro-row">
          {MACROS.map(m => (
            <div key={m.key} className="review-macro-card" style={{ borderColor: m.color + '33' }}>
              <span className="review-macro-label" style={{ color: m.color }}>{m.label}</span>
              <input
                className="review-macro-input"
                type="number"
                step="0.1"
                value={m.key === 'protein' ? protein : m.key === 'carbs' ? carbs : fat}
                onChange={e => {
                  if (m.key === 'protein') setProtein(e.target.value)
                  else if (m.key === 'carbs') setCarbs(e.target.value)
                  else setFat(e.target.value)
                }}
                aria-label={m.label}
                style={{ color: m.color }}
              />
              <span className="review-macro-unit">g</span>
            </div>
          ))}
        </div>

        {/* Meal type */}
        <div className="review-section-label">Meal</div>
        <div className="meal-type-row">
          {(Object.keys(MEAL_LABELS) as MealType[]).map(m => (
            <button
              key={m}
              type="button"
              className={`meal-type-btn${mealType === m ? ' active' : ''}`}
              onClick={() => setMealType(m)}
            >
              <span className="meal-type-icon">{MEAL_ICONS[m]}</span>
              <span className="meal-type-label">{MEAL_LABELS[m]}</span>
            </button>
          ))}
        </div>

        <button type="button" className="btn btn-log btn-block" onClick={save}>Save changes</button>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          style={{ marginTop: 10, color: 'var(--coral-deep)' }}
          onClick={remove}
        >
          Delete entry
        </button>
      </main>
    </div>
  )
}
