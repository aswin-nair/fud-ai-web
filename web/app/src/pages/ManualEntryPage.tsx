import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import type { MealType } from '../types'
import { MEAL_LABELS } from '../types'

function inferMealType(): MealType {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 20) return 'dinner'
  return 'snack'
}

export function ManualEntryPage() {
  const { addEntry } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [mealType, setMealType] = useState<MealType>(inferMealType)

  function save() {
    if (!name.trim() || !calories) return
    addEntry({
      id: crypto.randomUUID(),
      name: name.trim(),
      calories: Math.round(Number(calories)),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      timestamp: new Date().toISOString(),
      emoji: '🍽️',
      source: 'manual',
      mealType,
    })
    navigate('/')
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <Link to="/log" style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>← Back</Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>Manual entry</h1>
        <p className="page-sub">Log known calories and macros.</p>

        <div className="field">
          <label htmlFor="manual-name">Food name</label>
          <input id="manual-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Protein shake" />
        </div>
        <div className="field">
          <label htmlFor="manual-calories">Calories</label>
          <input id="manual-calories" type="number" value={calories} onChange={e => setCalories(e.target.value)} />
        </div>
        <div className="review-grid">
          <div className="field">
            <label htmlFor="manual-protein">Protein (g)</label>
            <input id="manual-protein" type="number" value={protein} onChange={e => setProtein(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="manual-carbs">Carbs (g)</label>
            <input id="manual-carbs" type="number" value={carbs} onChange={e => setCarbs(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="manual-fat">Fat (g)</label>
            <input id="manual-fat" type="number" value={fat} onChange={e => setFat(e.target.value)} />
          </div>
        </div>

        <div className="field">
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

        <button type="button" className="btn btn-primary btn-block" onClick={save} disabled={!name.trim() || !calories}>
          Log meal
        </button>
      </main>
    </div>
  )
}
