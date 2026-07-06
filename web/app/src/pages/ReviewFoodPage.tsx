import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import type { FoodAnalysis, MealType } from '../types'
import { MEAL_LABELS } from '../types'

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎', other: '🍽️',
}

function inferMealType(): MealType {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 20) return 'dinner'
  return 'snack'
}

const MACROS = [
  { key: 'protein', label: 'Protein', unit: 'g', color: '#6B9FFF', bg: 'rgba(107,159,255,0.12)' },
  { key: 'carbs',   label: 'Carbs',   unit: 'g', color: '#FFB347', bg: 'rgba(255,179,71,0.12)'  },
  { key: 'fat',     label: 'Fat',     unit: 'g', color: '#FF6B9D', bg: 'rgba(255,107,157,0.12)' },
] as const

export function ReviewFoodPage() {
  const { pendingAnalysis, setPendingAnalysis, addEntry, pendingSource } = useApp()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(pendingAnalysis)
  const [mealType, setMealType] = useState<MealType>(inferMealType)
  const [servings, setServings] = useState(1)
  const baseRef = useRef<FoodAnalysis | null>(pendingAnalysis)

  useEffect(() => {
    if (!pendingAnalysis) navigate('/log', { replace: true })
  }, [pendingAnalysis, navigate])

  if (!analysis) return null

  function update(field: keyof FoodAnalysis, value: string | number) {
    setAnalysis(a => a ? { ...a, [field]: value } : a)
    if (baseRef.current) {
      baseRef.current = { ...baseRef.current, [field]: value }
    }
  }

  function changeServings(next: number) {
    const s = Math.max(0.25, Math.round(next * 4) / 4)
    setServings(s)
    if (!baseRef.current) return
    const b = baseRef.current
    setAnalysis(a => a ? {
      ...a,
      calories: Math.round(Number(b.calories) * s),
      protein:  Math.round(Number(b.protein)  * s * 10) / 10,
      carbs:    Math.round(Number(b.carbs)    * s * 10) / 10,
      fat:      Math.round(Number(b.fat)      * s * 10) / 10,
    } : a)
  }

  function save() {
    if (!analysis) return
    const cals = Math.round(Number(analysis.calories))
    addEntry({
      id: crypto.randomUUID(),
      name: analysis.name,
      calories: cals,
      protein: Number(analysis.protein),
      carbs: Number(analysis.carbs),
      fat: Number(analysis.fat),
      timestamp: new Date().toISOString(),
      emoji: analysis.emoji,
      source: pendingSource,
      mealType,
      servingSizeGrams: analysis.servingSizeGrams,
    })
    setPendingAnalysis(null)
    navigate('/', { state: { justLogged: { calories: cals, name: analysis.name } } })
  }

  return (
    <div className="app-shell">
      <main className="app-main review-page">
        <button type="button" className="back-link" onClick={() => navigate('/log')}>← Back</button>

        {/* Food identity row */}
        <div className="review-hero">
          <div className="review-hero-emoji">{analysis.emoji ?? '🍽️'}</div>
          <div className="review-hero-info">
            <input
              className="review-name-input"
              value={analysis.name}
              onChange={e => update('name', e.target.value)}
              aria-label="Food name"
            />
            <span className="review-hero-hint">Tap to edit name</span>
          </div>
        </div>

        {/* Serving stepper */}
        <div className="review-section-label">Servings</div>
        <div className="review-serving-row">
          <button
            type="button"
            className="review-serving-btn"
            onClick={() => changeServings(servings - 0.25)}
            disabled={servings <= 0.25}
            aria-label="Decrease servings"
          >−</button>
          <div className="review-serving-center">
            <input
              className="review-serving-input"
              type="number"
              min="0.25"
              step="0.25"
              value={servings}
              onChange={e => changeServings(Number(e.target.value))}
              aria-label="Servings"
            />
            <span className="review-serving-unit">
              {servings === 1 ? 'serving' : 'servings'}
            </span>
          </div>
          <button
            type="button"
            className="review-serving-btn"
            onClick={() => changeServings(servings + 0.25)}
            aria-label="Increase servings"
          >+</button>
        </div>

        {/* Calorie hero */}
        <div className="review-section-label" style={{ marginTop: 20 }}>Calories</div>
        <div className="review-cal-hero">
          <input
            className="review-cal-hero-input"
            type="number"
            value={analysis.calories}
            onChange={e => update('calories', Number(e.target.value))}
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
                  value={analysis[m.key]}
                  onChange={e => update(m.key, Number(e.target.value))}
                  aria-label={m.label}
                />
                <span className="review-macro-unit">{m.unit}</span>
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

        <button type="button" className="btn btn-log btn-block" onClick={save}>
          Log meal
        </button>
      </main>
    </div>
  )
}
