import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FoodEntry, MealType } from '../types'
import { MEAL_LABELS } from '../types'
import { sameDay } from '../lib/dates'
import { useApp } from '../store/AppContext'
import { useToast } from './Toast'

const TIPS = [
  'Snap a photo to log in seconds 📷',
  'Type what you ate — AI does the rest ✨',
  'Re-log saved meals with one tap ⭐',
  'Track macros alongside calories 💪',
  'Your streak grows every day you log 🔥',
]

function EmptyState({ isToday }: { isToday: boolean }) {
  const navigate = useNavigate()
  const [tipIdx, setTipIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="food-log-section">
      <h2 className="food-section-title muted">{isToday ? "Today's Food" : 'Food Log'}</h2>
      <div className="food-empty-state">
        <div className="food-empty-plate" aria-hidden>🍽️</div>
        <p className="food-empty-tip" key={tipIdx}>{TIPS[tipIdx]}</p>
        <button
          type="button"
          className="btn btn-primary food-empty-cta press-spring"
          onClick={() => navigate('/log')}
        >
          + Add meal
        </button>
      </div>
    </section>
  )
}

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'other']

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
  other: '🍽️',
}

const SNAP_PX = 80

function SwipeCard({ entry, bordered }: { entry: FoodEntry; bordered: boolean }) {
  const { deleteEntry, updateEntry, addEntry } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [editCals, setEditCals] = useState(String(entry.calories))

  const touch = useRef({ startX: 0, startY: 0, offset: 0, swiped: false })

  useEffect(() => {
    setEditCals(String(entry.calories))
  }, [entry.calories])

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const t = touch.current

    function snapTo(px: number) {
      t.offset = px
      el!.style.transform = `translateX(${px}px)`
      el!.style.transition = 'transform 0.22s ease'
    }

    function onStart(e: TouchEvent) {
      t.startX = e.touches[0].clientX
      t.startY = e.touches[0].clientY
      t.swiped = false
      el!.style.transition = 'none'
    }

    function onMove(e: TouchEvent) {
      const dx = e.touches[0].clientX - t.startX
      const dy = e.touches[0].clientY - t.startY
      if (Math.abs(dy) > Math.abs(dx) + 4) return
      e.preventDefault()
      if (Math.abs(dx) > 8) t.swiped = true
      const next = Math.max(-SNAP_PX, Math.min(0, t.offset + dx))
      el!.style.transform = `translateX(${next}px)`
    }

    function onEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - t.startX
      const effective = t.offset + dx
      snapTo(effective < -SNAP_PX / 2 ? -SNAP_PX : 0)
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [])

  function handleDelete() {
    const saved = { ...entry }
    deleteEntry(entry.id)
    toast(`Deleted ${entry.name}`, {
      type: 'info',
      action: { label: 'Undo', fn: () => addEntry(saved) },
    })
  }

  function handleCardClick() {
    if (touch.current.swiped) {
      touch.current.swiped = false
      return
    }
    if (touch.current.offset !== 0) {
      const el = cardRef.current
      if (el) {
        touch.current.offset = 0
        el.style.transform = 'translateX(0)'
        el.style.transition = 'transform 0.22s ease'
      }
      return
    }
    setExpanded(e => !e)
  }

  function handleUpdate() {
    updateEntry({ ...entry, calories: Math.round(Number(editCals) || 0) })
    setExpanded(false)
    toast('Updated!')
  }

  return (
    <div className="food-card-outer">
      <div className="swipe-row-wrap">
        <button
          type="button"
          className="swipe-delete-btn"
          onClick={handleDelete}
          aria-label="Delete"
        >
          <span aria-hidden>🗑️</span>
          <span>Delete</span>
        </button>

        <div
          ref={cardRef}
          className={`food-card-row swipeable${bordered ? ' bordered' : ''}${expanded ? ' row-expanded' : ''}`}
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && handleCardClick()}
        >
          <span className="food-card-emoji">{entry.emoji ?? '🍽️'}</span>
          <div className="food-card-info">
            <div className="food-card-top">
              <span className="food-card-name">{entry.name}</span>
            </div>
            <div className="food-card-meta">
              <span className="food-card-cals">{entry.calories} kcal</span>
              <span className="food-card-dot">·</span>
              <span>P {Math.round(entry.protein)}g · C {Math.round(entry.carbs)}g · F {Math.round(entry.fat)}g</span>
            </div>
          </div>
          <span className="food-card-chevron" aria-hidden style={{
            transform: expanded ? 'rotate(90deg)' : undefined,
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}>›</span>
        </div>
      </div>

      {expanded && (
        <div className="food-quick-edit">
          {/* Macro chips */}
          <div className="fqe-chips">
            <div className="fqe-chip" style={{ '--chip-c': '#6B9FFF', '--chip-bg': 'rgba(107,159,255,0.12)' } as React.CSSProperties}>
              <span className="fqe-chip-val">{Math.round(entry.protein)}g</span>
              <span className="fqe-chip-lbl">Protein</span>
            </div>
            <div className="fqe-chip" style={{ '--chip-c': '#FFB347', '--chip-bg': 'rgba(255,179,71,0.12)' } as React.CSSProperties}>
              <span className="fqe-chip-val">{Math.round(entry.carbs)}g</span>
              <span className="fqe-chip-lbl">Carbs</span>
            </div>
            <div className="fqe-chip" style={{ '--chip-c': '#FF6B9D', '--chip-bg': 'rgba(255,107,157,0.12)' } as React.CSSProperties}>
              <span className="fqe-chip-val">{Math.round(entry.fat)}g</span>
              <span className="fqe-chip-lbl">Fat</span>
            </div>
            {entry.servingSizeGrams && (
              <div className="fqe-chip" style={{ '--chip-c': 'var(--ink-soft)', '--chip-bg': 'rgba(255,255,255,0.06)' } as React.CSSProperties}>
                <span className="fqe-chip-val">{Math.round(entry.servingSizeGrams)}g</span>
                <span className="fqe-chip-lbl">Serving</span>
              </div>
            )}
          </div>

          {/* Calorie edit */}
          <div className="fqe-cal-wrap">
            <span className="fqe-cal-label">Calories</span>
            <div className="fqe-cal-input-row">
              <input
                className="fqe-cal-input"
                type="number"
                value={editCals}
                onChange={e => setEditCals(e.target.value)}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.key === 'Enter' && handleUpdate()}
                autoFocus
              />
              <span className="fqe-cal-unit">kcal</span>
            </div>
          </div>

          {/* Actions */}
          <div className="fqe-actions">
            <button type="button" className="fqe-btn fqe-btn-save" onClick={e => { e.stopPropagation(); handleUpdate() }}>
              Save
            </button>
            <button type="button" className="fqe-btn fqe-btn-delete" onClick={e => { e.stopPropagation(); handleDelete() }}>
              Delete
            </button>
            <button type="button" className="fqe-btn fqe-btn-edit" onClick={e => { e.stopPropagation(); navigate(`/edit/${entry.id}`) }}>
              Edit all →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface FoodListProps {
  entries: FoodEntry[]
  selectedDate: Date
}

export function FoodList({ entries, selectedDate }: FoodListProps) {
  const isToday = sameDay(selectedDate, new Date())
  const [collapsed, setCollapsed] = useState<Set<MealType>>(new Set())

  function toggleSection(meal: MealType) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(meal)) { next.delete(meal) } else { next.add(meal) }
      return next
    })
  }

  if (entries.length === 0) {
    return <EmptyState isToday={isToday} />
  }

  const grouped = MEAL_ORDER.map(meal => ({
    meal,
    items: entries.filter(e => e.mealType === meal),
  })).filter(g => g.items.length > 0)

  return (
    <>
      {grouped.map(({ meal, items }) => {
        const mealCals = items.reduce((s, e) => s + e.calories, 0)
        const isCollapsed = collapsed.has(meal)

        return (
          <section className="food-log-section" key={meal}>
            <button
              type="button"
              className="food-section-header"
              onClick={() => toggleSection(meal)}
              aria-expanded={!isCollapsed}
            >
              <span className="food-section-icon">{MEAL_ICONS[meal]}</span>
              <h2 className="food-section-title">{MEAL_LABELS[meal]}</h2>
              <span className="food-section-total">{Math.round(mealCals)} kcal</span>
              <span
                className="food-section-arrow"
                aria-hidden
                style={{
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.22s ease',
                  display: 'inline-block',
                }}
              >
                ⌄
              </span>
            </button>

            <div className={`food-section-items${isCollapsed ? ' collapsed' : ''}`}>
              <div>
                <div className="food-section-card">
                  {items.map((entry, i) => (
                    <SwipeCard
                      key={entry.id}
                      entry={entry}
                      bordered={i < items.length - 1}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}
