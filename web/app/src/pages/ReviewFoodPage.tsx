import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { useToast } from '../components/Toast'
import type { FoodAnalysis, MealType } from '../types'
import { MEAL_LABELS } from '../types'

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
  other: '🍽️',
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
  const { toast } = useToast()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(pendingAnalysis)
  const [mealType, setMealType] = useState<MealType>(inferMealType)

  useEffect(() => {
    if (!pendingAnalysis) navigate('/log', { replace: true })
  }, [pendingAnalysis, navigate])

  if (!analysis) return null

  function update(field: keyof FoodAnalysis, value: string | number) {
    setAnalysis(a => a ? { ...a, [field]: value } : a)
  }

  function save() {
    if (!analysis) return
    addEntry({
      id: crypto.randomUUID(),
      name: analysis.name,
      calories: Math.round(Number(analysis.calories)),
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
    toast(`Logged ${analysis.name}!`)
    navigate('/')
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <button type="button" className="back-link" onClick={() => navigate('/log')}>← Back</button>

        {/* Hero card */}
        <div className="review-hero">
          <div className="review-hero-emoji">{analysis.emoji ?? '🍽️'}</div>
          <div className="review-hero-info">
            <input
              className="review-name-input"
              value={analysis.name}
              onChange={e => update('name', e.target.value)}
              aria-label="Food name"
            />
            <span className="review-hero-hint">Tap name to edit</span>
          </div>
        </div>

        {/* Calories */}
        <div className="review-calorie-card">
          <span className="review-calorie-label">Calories</span>
          <input
            className="review-calorie-input"
            type="number"
            value={analysis.calories}
            onChange={e => update('calories', Number(e.target.value))}
            aria-label="Calories"
          />
          <span className="review-calorie-unit">kcal</span>
        </div>

        {/* Macros */}
        <div className="review-macro-row">
          {MACROS.map(m => (
            <div key={m.key} className="review-macro-card" style={{ borderColor: m.color + '33' }}>
              <span className="review-macro-label" style={{ color: m.color }}>{m.label}</span>
              <input
                className="review-macro-input"
                type="number"
                step="0.1"
                value={analysis[m.key]}
                onChange={e => update(m.key, Number(e.target.value))}
                aria-label={m.label}
                style={{ color: m.color }}
              />
              <span className="review-macro-unit">{m.unit}</span>
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

        <button type="button" className="btn btn-log btn-block" onClick={save}>
          Log meal
        </button>
      </main>
    </div>
  )
}
