import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { useToast } from '../components/Toast'
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
  const { toast } = useToast()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [mealType, setMealType] = useState<MealType>(inferMealType)
  const [servings, setServings] = useState(1)

  function changeServings(next: number) {
    setServings(Math.max(0.25, Math.round(next * 4) / 4))
  }

  const scaledCalories = calories ? Math.round(Number(calories) * servings) : 0
  const scaledProtein  = protein  ? Math.round(Number(protein)  * servings * 10) / 10 : 0
  const scaledCarbs    = carbs    ? Math.round(Number(carbs)    * servings * 10) / 10 : 0
  const scaledFat      = fat      ? Math.round(Number(fat)      * servings * 10) / 10 : 0

  function save() {
    if (!name.trim() || !calories) return
    addEntry({
      id: crypto.randomUUID(),
      name: name.trim(),
      calories: scaledCalories,
      protein: scaledProtein,
      carbs: scaledCarbs,
      fat: scaledFat,
      timestamp: new Date().toISOString(),
      emoji: '🍽️',
      source: 'manual',
      mealType,
    })
    toast(`Logged ${name.trim()}!`)
    navigate('/')
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <Link to="/log" className="back-link">← Back</Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>Manual entry</h1>
        <p className="page-sub">Log known calories and macros.</p>

        <div className="field">
          <label htmlFor="manual-name">Food name</label>
          <input
            id="manual-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Protein shake"
          />
        </div>

        <div className="field">
          <label htmlFor="manual-calories">Calories <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>per serving</span></label>
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

        {/* Serving size stepper */}
        <div className="serving-row">
          <span className="serving-label">Servings</span>
          <div className="serving-stepper">
            <button type="button" className="serving-btn" onClick={() => changeServings(servings - 0.25)} disabled={servings <= 0.25}>−</button>
            <input
              className="serving-input"
              type="number"
              min="0.25"
              step="0.25"
              value={servings}
              onChange={e => changeServings(Number(e.target.value))}
            />
            <button type="button" className="serving-btn" onClick={() => changeServings(servings + 0.25)}>+</button>
          </div>
          <span className="serving-hint">{servings === 1 ? '1 serving' : `${servings} servings`}</span>
        </div>

        {servings !== 1 && calories && (
          <div className="serving-total-preview">
            <span>Total: </span>
            <strong>{scaledCalories} kcal</strong>
            {protein && <span> · P {scaledProtein}g</span>}
            {carbs && <span> · C {scaledCarbs}g</span>}
            {fat && <span> · F {scaledFat}g</span>}
          </div>
        )}

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

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={save}
          disabled={!name.trim() || !calories}
        >
          Log meal
        </button>
      </main>
    </div>
  )
}
