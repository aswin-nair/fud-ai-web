import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import type { FoodAnalysis, MealType } from '../types'
import { MEAL_LABELS } from '../types'

function inferMealType(): MealType {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 20) return 'dinner'
  return 'snack'
}

export function ReviewFoodPage() {
  const { pendingAnalysis, setPendingAnalysis, addEntry, pendingSource } = useApp()
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
    navigate('/')
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <Link to="/log" style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>← Back</Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>
          {analysis.emoji} Review
        </h1>
        <p className="page-sub">Adjust values before logging.</p>

        <div className="field">
          <label>Name</label>
          <input value={analysis.name} onChange={e => update('name', e.target.value)} />
        </div>

        <div className="review-grid">
          <div className="stat-box">
            <label>Calories</label>
            <input type="number" value={analysis.calories} onChange={e => update('calories', Number(e.target.value))} />
          </div>
          <div className="stat-box">
            <label>Protein (g)</label>
            <input type="number" step="0.1" value={analysis.protein} onChange={e => update('protein', Number(e.target.value))} />
          </div>
          <div className="stat-box">
            <label>Carbs (g)</label>
            <input type="number" step="0.1" value={analysis.carbs} onChange={e => update('carbs', Number(e.target.value))} />
          </div>
          <div className="stat-box">
            <label>Fat (g)</label>
            <input type="number" step="0.1" value={analysis.fat} onChange={e => update('fat', Number(e.target.value))} />
          </div>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label>Meal type</label>
          <div className="chip-row">
            {(Object.keys(MEAL_LABELS) as MealType[]).map(m => (
              <button
                key={m}
                type="button"
                className={`chip${mealType === m ? ' active' : ''}`}
                onClick={() => setMealType(m)}
              >
                {MEAL_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="btn btn-primary btn-block" onClick={save}>
          Log meal
        </button>
      </main>
    </div>
  )
}
