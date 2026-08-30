import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PressableButton } from '../components/PressableButton'
import { useApp } from '../store/AppContext'
import type { MealType } from '../types'
import { MEAL_LABELS } from '../types'
import { BackLink } from '../components/BackLink'
import { clearLogDraft, hydrateLogDrafts, loadLogDrafts, saveManualLogDraft } from '../lib/logDrafts'
import { validateManualFood } from '../lib/foodEntryValidation'
import { useAuth } from '../store/AuthContext'
import { recentMeals } from '../lib/meals'

function inferMealType(): MealType {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 20) return 'dinner'
  return 'snack'
}

export function ManualEntryPage() {
  const { state, addEntry } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()
  const requestedSlot = (useLocation().state as { mealType?: MealType } | null)?.mealType
  const userId = user?.sub ?? ''
  const saved = loadLogDrafts(userId).manual
  const initialMealType = requestedSlot ?? saved?.mealType ?? inferMealType()
  const recentDefault = saved
    ? undefined
    : recentMeals(state.foodEntries).find(entry => entry.mealType === initialMealType)
      ?? recentMeals(state.foodEntries)[0]
  const [templateName] = useState(recentDefault?.name ?? null)
  const [name, setName] = useState(saved?.name ?? recentDefault?.name ?? '')
  const [calories, setCalories] = useState(saved?.calories ?? (recentDefault ? String(recentDefault.calories) : ''))
  const [protein, setProtein] = useState(saved?.protein ?? (recentDefault ? String(recentDefault.protein) : ''))
  const [carbs, setCarbs] = useState(saved?.carbs ?? (recentDefault ? String(recentDefault.carbs) : ''))
  const [fat, setFat] = useState(saved?.fat ?? (recentDefault ? String(recentDefault.fat) : ''))
  const [mealType, setMealType] = useState<MealType>(initialMealType)
  const [servings, setServings] = useState(saved?.servings ?? 1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void hydrateLogDrafts(userId).then(drafts => {
      const manual = drafts.manual
      if (cancelled || !manual) return
      setName(current => current || manual.name)
      setCalories(current => current || manual.calories)
      setProtein(current => current || manual.protein)
      setCarbs(current => current || manual.carbs)
      setFat(current => current || manual.fat)
      setMealType(current => current === inferMealType() ? manual.mealType : current)
      setServings(current => current === 1 ? manual.servings : current)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    saveManualLogDraft(userId, { name, calories, protein, carbs, fat, mealType, servings })
  }, [userId, name, calories, protein, carbs, fat, mealType, servings])

  function changeServings(next: number) {
    if (!Number.isFinite(next)) return
    setServings(Math.min(1_000, Math.max(0.25, Math.round(next * 4) / 4)))
  }

  const validated = validateManualFood({ name, calories, protein, carbs, fat, servings })
  const scaledCalories = validated.ok ? validated.value.calories : 0
  const scaledProtein = validated.ok ? validated.value.protein : 0
  const scaledCarbs = validated.ok ? validated.value.carbs : 0
  const scaledFat = validated.ok ? validated.value.fat : 0

  function save() {
    const result = validateManualFood({ name, calories, protein, carbs, fat, servings })
    if (!result.ok) {
      setError(result.error)
      return
    }
    const entry = {
      id: crypto.randomUUID(),
      name: result.value.name,
      calories: result.value.calories,
      protein: result.value.protein,
      carbs: result.value.carbs,
      fat: result.value.fat,
      timestamp: new Date().toISOString(),
      emoji: '🍽️',
      source: 'manual',
      mealType,
    } as const
    addEntry(entry)
    clearLogDraft(userId, 'manual')
    navigate('/', { state: { justLogged: { id: entry.id, calories: entry.calories, name: entry.name } } })
  }

  return (
    <div className="app-shell">
      <main className="app-main motion-stagger">
        <BackLink to="/log" />
        <h1 className="page-title" style={{ marginTop: 12 }}>Manual entry</h1>
        <p className="page-sub">Log known calories and macros.</p>

        {templateName && (
          <p className="manual-default-note" role="status">
            Started from your recent “{templateName}”. Adjust anything before logging.
          </p>
        )}

        {error && <div className="error-banner" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="manual-name">Food name</label>
          <input
            id="manual-name"
            value={name}
            onChange={e => { setName(e.target.value); setError(null) }}
            maxLength={500}
            placeholder="e.g. Protein shake"
          />
        </div>

        <div className="field">
          <label htmlFor="manual-calories">Calories <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>per serving</span></label>
          <input id="manual-calories" type="number" min="0" max="100000" value={calories} onChange={e => { setCalories(e.target.value); setError(null) }} />
        </div>

        <div className="review-grid">
          <div className="field">
            <label htmlFor="manual-protein">Protein (g)</label>
            <input id="manual-protein" type="number" min="0" max="10000" value={protein} onChange={e => { setProtein(e.target.value); setError(null) }} />
          </div>
          <div className="field">
            <label htmlFor="manual-carbs">Carbs (g)</label>
            <input id="manual-carbs" type="number" min="0" max="10000" value={carbs} onChange={e => { setCarbs(e.target.value); setError(null) }} />
          </div>
          <div className="field">
            <label htmlFor="manual-fat">Fat (g)</label>
            <input id="manual-fat" type="number" min="0" max="10000" value={fat} onChange={e => { setFat(e.target.value); setError(null) }} />
          </div>
        </div>

        {/* Serving size stepper */}
        <div className="serving-row">
          <span className="serving-label">Servings</span>
          <div className="serving-stepper">
            <button type="button" className="serving-btn" onClick={() => changeServings(servings - 0.25)} disabled={servings <= 0.25} aria-label="Decrease servings">−</button>
            <input
              className="serving-input"
              type="number"
              min="0.25"
              max="1000"
              step="0.25"
              value={servings}
              onChange={e => changeServings(Number(e.target.value))}
              aria-label="Servings"
            />
            <button type="button" className="serving-btn" onClick={() => changeServings(servings + 0.25)} aria-label="Increase servings">+</button>
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
                aria-pressed={mealType === m}
              >
                {MEAL_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        <PressableButton
          fullWidth
          label="Log meal"
          onClick={save}
          disabled={!name.trim() || !calories}
        />
      </main>
    </div>
  )
}
