import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { BottomNav } from '../components/BottomNav'
import { BackLink } from '../components/BackLink'
import { PortionSheet } from '../components/PortionSheet'
import { useLongPress } from '../hooks/useLongPress'
import { IconCamera, IconClipboard, IconEdit, IconPlus, IconStar } from '../components/icons'
import { useApp } from '../store/AppContext'
import { recordFoodSearch, selectLogMethod, startLogFlow, type LogMethod } from '../lib/analytics'
import {
  mealKey,
  parseQuickAdd,
  quickAddEntry,
  recentMeals,
  savedToEntry,
  scaleMeal,
} from '../lib/meals'
import type { FoodEntry, SavedMeal } from '../types'
import { mascotEvent } from '../mascot/MascotOverlay'

const OTHER_WAYS = [
  {
    to: '/log/text',
    Icon: IconEdit,
    accent: 'neutral',
    title: 'Describe your meal',
    desc: 'Estimate from a description',
    method: 'text_ai',
  },
  {
    to: '/log/photo',
    Icon: IconCamera,
    accent: 'neutral',
    title: 'Snap a photo',
    desc: 'Review an AI estimate',
    method: 'photo_ai',
  },
  {
    to: '/log/saved',
    Icon: IconStar,
    accent: 'neutral',
    title: 'Saved meals',
    desc: 'Choose a familiar meal',
    method: 'saved',
  },
  {
    to: '/log/manual',
    Icon: IconClipboard,
    accent: 'neutral',
    title: 'Manual entry',
    desc: 'Use a label or known values',
    method: 'manual',
  },
] as const

/** How many recents to offer before the list stops being scannable. */
const RECENT_LIMIT = 12

/**
 * Show logging methods before recents without opening the mobile keyboard.
 * Familiar meals keep their one-tap path, with a visible portion alternative.
 *
 * Typing a bare number turns the same field into Quick add.
 */
export function LogMenuPage() {
  const { state, addEntry } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [portionFor, setPortionFor] = useState<{ item: FoodEntry | SavedMeal; source: LogMethod } | null>(null)
  const lastEmptyTease = useRef('')

  useEffect(() => {
    startLogFlow('search', state.foodEntries.length === 0)
  }, [state.foodEntries.length])

  const recents = useMemo(
    () => recentMeals(state.foodEntries, RECENT_LIMIT),
    [state.foodEntries],
  )

  const favourites = state.favoriteMeals

  const quickAddCalories = parseQuickAdd(query)

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []

    const pool: Array<FoodEntry | SavedMeal> = [...favourites, ...recents]
    const seen = new Set<string>()

    return pool.filter(item => {
      if (!item.name.toLowerCase().includes(needle)) return false
      const key = mealKey(item)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [query, favourites, recents])

  useEffect(() => {
    const needle = query.trim()
    if (!needle || parseQuickAdd(needle) !== null) return
    const handle = window.setTimeout(() => {
      recordFoodSearch(matches.length)
      if (matches.length === 0 && lastEmptyTease.current !== needle) {
        lastEmptyTease.current = needle
        mascotEvent('empty_search')
      }
    }, 300)
    return () => window.clearTimeout(handle)
  }, [query, matches.length])

  function commit(entry: FoodEntry, source: LogMethod) {
    selectLogMethod(source)
    addEntry(entry)
    navigate('/', { state: { justLogged: { id: entry.id, calories: entry.calories, name: entry.name } } })
  }

  function logQuickAdd(calories: number) {
    commit(quickAddEntry(calories), 'quick_add')
  }

  function logAgain(item: FoodEntry | SavedMeal, source: LogMethod, multiplier = 1) {
    const saved: SavedMeal = 'timestamp' in item
      ? { ...item, id: crypto.randomUUID() }
      : item
    commit(savedToEntry(scaleMeal(saved, multiplier), 'recent'), source)
  }

  return (
    <div className="app-shell log-refresh">
      {portionFor && (
        <PortionSheet
          name={portionFor.item.name}
          calories={portionFor.item.calories}
          onPick={m => {
            const { item, source } = portionFor
            setPortionFor(null)
            logAgain(item, source, m)
          }}
          onClose={() => setPortionFor(null)}
        />
      )}
      <main className="app-main motion-stagger">
        <BackLink to="/" />
        <header className="page-heading log-page-heading">
          <h1 className="page-title">Log a meal</h1>
          <p className="log-intro">Something new, or a familiar favourite?</p>
        </header>

        <nav className="log-method-grid" aria-label="Ways to log a meal">
          {OTHER_WAYS.map(opt => (
            <Link key={opt.to} to={opt.to} className="log-method-card" data-method={opt.method}
              onClick={() => selectLogMethod(opt.method)}>
              <span className={`icon-tile icon-tile-sm icon-tile-${opt.accent}`}><opt.Icon size={22} /></span>
              <strong>{opt.title}</strong>
              <span>{opt.desc}</span>
            </Link>
          ))}
        </nav>

        <div className="log-search-wrap log-hero-target">
          <label className="log-search-label" htmlFor="log-meal-search">Find a previous meal</label>
          <input
            id="log-meal-search"
            className="log-search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search your foods, or type calories"
            aria-label="Search your foods, or type calories"
            inputMode="text"
            aria-describedby="log-search-hint"
          />
          {query && <button type="button" className="log-clear-search" onClick={() => setQuery('')}>Clear search</button>}
          <p id="log-search-hint" className="log-search-hint">Search recent and Saved meals. A number alone adds calories.</p>
        </div>

        {/* A bare number in the search box is a quick add waiting to happen. */}
        {quickAddCalories !== null && (
          <button
            type="button"
            className="log-quick-add"
            onClick={() => logQuickAdd(quickAddCalories)}
          >
            <span className="log-quick-add-icon"><IconPlus size={18} strokeWidth={2.6} /></span>
            <span className="log-quick-add-text">
              <strong>Quick add {quickAddCalories} kcal</strong>
              <span>No food attached — the day still counts.</span>
            </span>
          </button>
        )}

        {query.trim() === '' ? (
          <>
            {recents.length > 0 && (
              <>
                <h2 className="eyebrow">Log again</h2>
                <p className="log-list-hint">Tap a meal to log it, or choose Portion to adjust.</p>
                <div className="log-pick-list motion-list">
                  {recents.map(entry => (
                    <PickRow
                      key={entry.id}
                      name={entry.name}
                      emoji={entry.emoji}
                      calories={entry.calories}
                      onPick={() => logAgain(entry, 'recent')}
                      onHold={() => setPortionFor({ item: entry, source: 'recent' })}
                    />
                  ))}
                </div>
              </>
            )}

            {favourites.length > 0 && (
              <>
                <h2 className="eyebrow">Favourites</h2>
                <div className="log-pick-list motion-list">
                  {favourites.map(meal => (
                    <PickRow
                      key={meal.id}
                      name={meal.name}
                      emoji={meal.emoji}
                      calories={meal.calories}
                      onPick={() => logAgain(meal, 'favourite')}
                      onHold={() => setPortionFor({ item: meal, source: 'favourite' })}
                    />
                  ))}
                </div>
              </>
            )}

            {/* An invitation, not an apology — §Appendix A. */}
            {recents.length === 0 && favourites.length === 0 && (
              <div className="log-empty">
                <p className="log-empty-title">Your shortlist starts here</p>
                <p className="log-empty-sub">
                  Anything you log shows up here, so the second time takes a tap.
                  You can also type a number above to log calories on their own.
                </p>
              </div>
            )}
          </>
        ) : quickAddCalories !== null && matches.length === 0 ? (
          // A bare number is a quick add, not a failed search. Saying "nothing
          // found" underneath the thing that did work reads as an error.
          null
        ) : (
          <>
            <p className="eyebrow">Matches</p>
            {matches.length > 0 ? (
              <div className="log-pick-list motion-list">
                {matches.map(item => (
                  <PickRow
                    key={item.id}
                    name={item.name}
                    emoji={item.emoji}
                    calories={item.calories}
                    onPick={() => logAgain(item, 'search')}
                    onHold={() => setPortionFor({ item, source: 'search' })}
                  />
                ))}
              </div>
            ) : (
              <div className="log-empty">
                <p className="log-empty-sub">
                  No recent or Saved meals match “{query.trim()}”. Choose a logging method above to add something new.
                </p>
              </div>
            )}
          </>
        )}

      </main>
      <BottomNav />
    </div>
  )
}

function PickRow({
  name,
  emoji,
  calories,
  onPick,
  onHold,
}: {
  name: string
  emoji?: string
  calories: number
  onPick: () => void
  onHold?: () => void
}) {
  const hold = useLongPress(() => onHold?.())
  return (
    <div className="log-pick-item">
    <button
      type="button"
      className="log-pick-row press-spring"
      onClick={() => { if (!hold.consumed()) onPick() }}
      {...(onHold ? hold.handlers : {})}
    >
      <span className="log-pick-emoji">{emoji ?? '🍽️'}</span>
      <span className="log-pick-name">{name}</span>
      <span className="log-pick-kcal">{Math.round(calories)} kcal</span>
    </button>
    {onHold && <button type="button" className="log-portion-button" onClick={onHold} aria-label={`Adjust portion for ${name}`}>Portion</button>}
    </div>
  )
}
