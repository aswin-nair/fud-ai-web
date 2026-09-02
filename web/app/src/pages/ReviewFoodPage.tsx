import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { BackLink } from '../components/BackLink'
import { IconMinus, IconPlus } from '../components/icons'
import type { FoodAnalysis, FoodSource, MealType } from '../types'
import { MEAL_LABELS } from '../types'
import { clearLogDraft, hydrateLogDrafts, loadLogDrafts, saveReviewLogDraft, type ReviewNumericField } from '../lib/logDrafts'
import { reviewFoodIssue } from '../lib/foodEntryValidation'
import { useAuth } from '../store/AuthContext'
import { sourceToMethod, track } from '../lib/analytics'
import { PressableButton } from '../components/PressableButton'

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
  const {
    pendingAnalysis,
    setPendingAnalysis,
    pendingImagePreview,
    setPendingImagePreview,
    addEntry,
    pendingSource,
  } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.sub ?? ''
  const saved = loadLogDrafts(userId).review
  const initialAnalysis = pendingAnalysis ?? saved?.analysis ?? null
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(initialAnalysis)
  const [mealType, setMealType] = useState<MealType>(pendingAnalysis ? inferMealType() : (saved?.mealType ?? inferMealType()))
  const [servings, setServings] = useState(pendingAnalysis ? 1 : (saved?.servings ?? 1))
  const [source] = useState<FoodSource>(pendingAnalysis ? pendingSource : (saved?.source ?? pendingSource))
  const [emptyNumericFields, setEmptyNumericFields] = useState<Set<ReviewNumericField>>(
    () => new Set(pendingAnalysis ? [] : (saved?.emptyNumericFields ?? [])),
  )
  const [error, setError] = useState<string | null>(null)
  const baseRef = useRef<FoodAnalysis | null>(pendingAnalysis ?? saved?.baseAnalysis ?? null)
  const reviewTracked = useRef(false)
  const correctionTracked = useRef(false)

  useEffect(() => {
    if (pendingAnalysis) return
    let cancelled = false
    void hydrateLogDrafts(userId).then(drafts => {
      const review = drafts.review
      if (cancelled || !review) return
      setAnalysis(current => {
        if (current) return current
        setMealType(review.mealType)
        setServings(review.servings)
        setEmptyNumericFields(new Set(review.emptyNumericFields))
        if (!baseRef.current) baseRef.current = review.baseAnalysis
        return review.analysis
      })
    })
    return () => {
      cancelled = true
    }
  }, [pendingAnalysis, userId])

  useEffect(() => {
    if (!analysis) navigate('/log', { replace: true })
  }, [analysis, navigate])

  useEffect(() => {
    if (!analysis || !baseRef.current) return
    saveReviewLogDraft(userId, {
      analysis,
      baseAnalysis: baseRef.current,
      mealType,
      servings,
      source,
      emptyNumericFields: [...emptyNumericFields],
    })
  }, [analysis, emptyNumericFields, mealType, servings, source, userId])

  useEffect(() => {
    if (!analysis || reviewTracked.current) return
    reviewTracked.current = true
    track({ name: 'entry_reviewed', method: sourceToMethod(source) })
  }, [analysis, source])

  if (!analysis) return null

  function markCorrected() {
    if (correctionTracked.current) return
    correctionTracked.current = true
    track({ name: 'entry_corrected', method: sourceToMethod(source) })
  }

  function update(field: keyof FoodAnalysis, value: string | number) {
    markCorrected()
    setError(null)
    setAnalysis(a => a ? { ...a, [field]: value } : a)
    if (baseRef.current) {
      baseRef.current = { ...baseRef.current, [field]: value }
    }
  }

  function updateNumeric(field: ReviewNumericField, raw: string) {
    markCorrected()
    setError(null)
    const empty = raw.trim() === ''
    setEmptyNumericFields(current => {
      const next = new Set(current)
      if (empty) next.add(field)
      else next.delete(field)
      return next
    })
    const value = empty ? 0 : Number(raw)
    if (!Number.isFinite(value)) return
    setAnalysis(current => current ? { ...current, [field]: value } : current)
    if (baseRef.current) baseRef.current = { ...baseRef.current, [field]: value / servings }
  }

  function changeServings(next: number) {
    if (!Number.isFinite(next)) return
    markCorrected()
    setError(null)
    const s = Math.min(1_000, Math.max(0.25, Math.round(next * 4) / 4))
    setServings(s)
    if (!baseRef.current) return
    const b = baseRef.current
    setAnalysis(a => a ? {
      ...a,
      calories: Math.round(Number(b.calories) * s),
      protein:  Math.round(Number(b.protein)  * s * 10) / 10,
      carbs:    Math.round(Number(b.carbs)    * s * 10) / 10,
      fat:      Math.round(Number(b.fat)      * s * 10) / 10,
      servingSizeGrams: b.servingSizeGrams != null ? Math.round(Number(b.servingSizeGrams) * s) : b.servingSizeGrams,
      ingredients: b.ingredients?.map(ing => ({
        ...ing,
        grams:    Math.round(ing.grams * s),
        calories: Math.round(ing.calories * s),
        protein:  Math.round(ing.protein * s * 10) / 10,
        carbs:    Math.round(ing.carbs   * s * 10) / 10,
        fat:      Math.round(ing.fat     * s * 10) / 10,
      })),
    } : a)
  }

  function save() {
    if (!analysis) return
    const issue = reviewFoodIssue(analysis, emptyNumericFields)
    if (issue) {
      setError(issue)
      return
    }
    const cals = Math.round(Number(analysis.calories))
    const entry = {
      id: crypto.randomUUID(),
      name: analysis.name,
      calories: cals,
      protein: Number(analysis.protein),
      carbs: Number(analysis.carbs),
      fat: Number(analysis.fat),
      timestamp: new Date().toISOString(),
      emoji: analysis.emoji,
      source,
      mealType,
      servingSizeGrams: analysis.servingSizeGrams,
      ingredients: analysis.ingredients,
      detailAdded: source === 'snapFood' || correctionTracked.current,
    } as const
    addEntry(entry)
    setPendingAnalysis(null)
    setPendingImagePreview(null)
    clearLogDraft(userId, 'review')
    navigate('/', { state: { justLogged: { id: entry.id, calories: cals, name: analysis.name } } })
  }

  function discard() {
    setPendingAnalysis(null)
    setPendingImagePreview(null)
    clearLogDraft(userId, 'review')
    navigate('/log')
  }

  return (
    <div className="app-shell">
      <main className="app-main review-page motion-stagger">
        <BackLink onClick={discard} />

        {error && <div className="error-banner" role="alert">{error}</div>}

        {source === 'snapFood' && pendingImagePreview && (
          <figure className="review-photo-evidence">
            <img src={pendingImagePreview} alt="Meal photo being reviewed" />
            <figcaption>Original photo · kept only for this review</figcaption>
          </figure>
        )}

        {/* Food identity row */}
        <div className="review-hero">
          <div className="review-hero-emoji">{analysis.emoji ?? '🍽️'}</div>
          <div className="review-hero-info">
            <input
              className="review-name-input"
              value={analysis.name}
              onChange={e => update('name', e.target.value)}
              aria-label="Food name"
              maxLength={500}
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
          ><IconMinus size={18} strokeWidth={2.4} /></button>
          <div className="review-serving-center">
            <input
              className="review-serving-input"
              type="number"
              min="0.25"
              max="1000"
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
          ><IconPlus size={18} strokeWidth={2.4} /></button>
        </div>
        {analysis.servingSizeGrams > 0 && (
          <p className="review-portion-estimate">
            Estimated portion: <strong>{Math.round(analysis.servingSizeGrams)} g</strong>
          </p>
        )}

        {/* Calorie hero */}
        <div className="review-section-label" style={{ marginTop: 20 }}>Calories</div>
        <div className="review-cal-hero">
          <input
            className="review-cal-hero-input"
            type="number"
            min="0"
            max="100000"
            value={emptyNumericFields.has('calories') ? '' : analysis.calories}
            onChange={e => updateNumeric('calories', e.target.value)}
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
                  min="0"
                  max="10000"
                  step="0.1"
                  value={emptyNumericFields.has(m.key) ? '' : analysis[m.key]}
                  onChange={e => updateNumeric(m.key, e.target.value)}
                  aria-label={m.label}
                />
                <span className="review-macro-unit">{m.unit}</span>
              </div>
            </label>
          ))}
        </div>

        {/* Ingredient breakdown, when the AI provided one */}
        {analysis.ingredients && analysis.ingredients.length > 0 && (
          <>
            <div className="review-section-label" style={{ marginTop: 20 }}>How we estimated this</div>
            <div className="review-ingredients">
              {analysis.ingredients.map((ing, i) => (
                <div className="review-ingredient-row" key={i}>
                  <div className="review-ingredient-info">
                    <span className="review-ingredient-name">{ing.item}</span>
                    <span className="review-ingredient-grams">{Math.round(ing.grams)}g</span>
                  </div>
                  <span className="review-ingredient-cals">{Math.round(ing.calories)} kcal</span>
                </div>
              ))}
            </div>
            <p className="review-ingredients-hint">
              Looks off? Adjust the calories or macros above — this breakdown is just our estimate.
            </p>
          </>
        )}

        {/* Meal type */}
        <div className="review-section-label" style={{ marginTop: 20 }}>Meal</div>
        <div className="meal-type-row">
          {(Object.keys(MEAL_LABELS) as MealType[]).map(m => (
            <button
              key={m}
              type="button"
              className={`meal-type-btn${mealType === m ? ' active' : ''}`}
              onClick={() => { markCorrected(); setMealType(m) }}
              aria-pressed={mealType === m}
            >
              <span className="meal-type-icon">{MEAL_ICONS[m]}</span>
              <span className="meal-type-label">{MEAL_LABELS[m]}</span>
            </button>
          ))}
        </div>

        <PressableButton fullWidth label="Log meal" onClick={save} />
      </main>
    </div>
  )
}
