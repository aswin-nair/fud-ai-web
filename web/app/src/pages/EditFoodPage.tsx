import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp, isFavorite } from '../store/AppContext'
import { useToast } from '../components/Toast'
import { BackLink } from '../components/BackLink'
import { IconChevronLeft, IconStar } from '../components/icons'
import type { MealType } from '../types'
import { MEAL_LABELS } from '../types'
import { PressableButton } from '../components/PressableButton'

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎', other: '🍽️',
}

const MACROS = [
  { key: 'protein', label: 'Protein', color: '#6B9FFF', bg: 'rgba(107,159,255,0.12)' },
  { key: 'carbs',   label: 'Carbs',   color: '#FFB347', bg: 'rgba(255,179,71,0.12)'  },
  { key: 'fat',     label: 'Fat',     color: '#FF6B9D', bg: 'rgba(255,107,157,0.12)' },
] as const

export function EditFoodPage() {
  const { id } = useParams<{ id: string }>()
  const { state, updateEntry, deleteEntry, toggleFavorite } = useApp()
  const { toast } = useToast()
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
          <PressableButton variant="ghost" onClick={() => navigate('/')}>
            <IconChevronLeft size={16} strokeWidth={2.4} /> Home
          </PressableButton>
        </main>
      </div>
    )
  }

  const fav = isFavorite(state, entry)

  const macroValues: Record<(typeof MACROS)[number]['key'], string> = { protein, carbs, fat }
  const macroSetters: Record<(typeof MACROS)[number]['key'], (v: string) => void> = {
    protein: setProtein, carbs: setCarbs, fat: setFat,
  }

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
      // A manual full edit supersedes the AI's estimate — drop the now-stale breakdown
      // so FoodList doesn't show ingredient numbers that no longer add up.
      ingredients: undefined,
    })
    toast('Changes saved')
    navigate('/')
  }

  function remove() {
    if (!entry) return
    if (!confirm('Delete this entry?')) return
    deleteEntry(entry.id)
    toast(`Deleted ${entry.name}`, { type: 'info' })
    navigate('/')
  }

  return (
    <div className="app-shell">
      <main className="app-main review-page motion-stagger">
        <div className="edit-topbar">
          <BackLink onClick={() => navigate('/')} />
          <button
            type="button"
            className={`fav-btn${fav ? ' active' : ''}`}
            onClick={() => toggleFavorite(entry)}
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <IconStar active={fav} size={19} />
          </button>
        </div>

        {/* Food identity row */}
        <div className="review-hero">
          <div className="review-hero-emoji">{entry.emoji ?? '🍽️'}</div>
          <div className="review-hero-info">
            <input
              className="review-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              aria-label="Food name"
            />
            <span className="review-hero-hint">Tap to edit name</span>
          </div>
        </div>

        {/* Calorie hero */}
        <div className="review-section-label" style={{ marginTop: 20 }}>Calories</div>
        <div className="review-cal-hero">
          <input
            className="review-cal-hero-input"
            type="number"
            value={calories}
            onChange={e => setCalories(e.target.value)}
            aria-label="Calories"
          />
          <span className="review-cal-hero-unit">kcal</span>
        </div>

        {/* Macros */}
        <div className="review-section-label" style={{ marginTop: 20 }}>Macronutrients</div>
        <div className="review-macro-row">
          {MACROS.map(m => (
            <label
              key={m.key}
              className="review-macro-card"
              style={{ '--mc': m.color, '--mc-bg': m.bg } as React.CSSProperties}
            >
              <span className="review-macro-label">{m.label}</span>
              <div className="review-macro-input-wrap">
                <input
                  className="review-macro-input"
                  type="number"
                  step="0.1"
                  value={macroValues[m.key]}
                  onChange={e => macroSetters[m.key](e.target.value)}
                  aria-label={m.label}
                />
                <span className="review-macro-unit">g</span>
              </div>
            </label>
          ))}
        </div>

        {/* Meal type */}
        <div className="review-section-label" style={{ marginTop: 20 }}>Meal</div>
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

        <PressableButton fullWidth label="Save changes" onClick={save} />
        <PressableButton fullWidth variant="destructive" label="Delete entry" onClick={remove} />
      </main>
    </div>
  )
}
