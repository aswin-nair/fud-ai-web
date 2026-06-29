import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp, isFavorite } from '../store/AppContext'
import type { MealType } from '../types'
import { MEAL_LABELS } from '../types'

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
          <p>Entry not found.</p>
          <Link to="/">Back to home</Link>
        </main>
      </div>
    )
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
    })
    navigate('/')
  }

  function remove() {
    if (!entry) return
    deleteEntry(entry.id)
    navigate('/')
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <Link to="/" style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>← Back</Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>Edit entry</h1>

        <div className="field">
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Calories</label>
          <input type="number" value={calories} onChange={e => setCalories(e.target.value)} />
        </div>
        <div className="review-grid">
          <div className="field">
            <label>Protein (g)</label>
            <input type="number" value={protein} onChange={e => setProtein(e.target.value)} />
          </div>
          <div className="field">
            <label>Carbs (g)</label>
            <input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} />
          </div>
          <div className="field">
            <label>Fat (g)</label>
            <input type="number" value={fat} onChange={e => setFat(e.target.value)} />
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

        <button type="button" className="btn btn-primary btn-block" onClick={save}>Save changes</button>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          style={{ marginTop: 10 }}
          onClick={() => toggleFavorite(entry)}
        >
          {isFavorite(state, entry) ? '★ Remove from favorites' : '☆ Add to favorites'}
        </button>
        <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={remove}>
          Delete entry
        </button>
      </main>
    </div>
  )
}
