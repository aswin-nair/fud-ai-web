import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { BottomNav } from '../components/BottomNav'
import { BackLink } from '../components/BackLink'
import { IconCamera, IconClipboard, IconEdit, IconPlus, IconStar } from '../components/icons'
import { useApp } from '../store/AppContext'
import { recordFoodSearch, selectLogMethod, startLogFlow, type LogMethod } from '../lib/analytics'
import {
  mealKey,
  parseQuickAdd,
  quickAddEntry,
  recentMeals,
  savedToEntry,
} from '../lib/meals'
import type { FoodEntry, SavedMeal } from '../types'

const OTHER_WAYS = [
  {
    to: '/log/text',
    Icon: IconEdit,
    accent: 'neutral',
    title: 'Describe your meal',
    desc: 'Type anything — AI estimates your macros',
    method: 'text_ai',
  },
  {
    to: '/log/photo',
    Icon: IconCamera,
    accent: 'neutral',
    title: 'Snap a photo',
    desc: 'AI reads the nutrition',
    method: 'photo_ai',
  },
  {
    to: '/log/saved',
    Icon: IconStar,
    accent: 'neutral',
    title: 'Saved meals',
    desc: 'Everything you have kept',
    method: 'saved',
  },
  {
    to: '/log/manual',
    Icon: IconClipboard,
    accent: 'neutral',
    title: 'Manual entry',
    desc: 'Enter known macros',
    method: 'manual',
  },
] as const

/** How many recents to offer before the list stops being scannable. */
const RECENT_LIMIT = 12

/**
 * Step one of the log flow, per §9.1: search focused on mount, recents above
 * the results, and never a blank screen. Most people eat the same twenty
 * things, so the fast path is picking one of them rather than searching.
 *
 * Typing a bare number turns the same field into Quick add.
 */
export function LogMenuPage() {
  const { state, addEntry } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

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

  function logAgain(item: FoodEntry | SavedMeal, source: LogMethod) {
    const saved: SavedMeal = 'timestamp' in item
      ? { ...item, id: crypto.randomUUID() }
      : item
    commit(savedToEntry(saved, 'recent'), source)
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <BackLink to="/" />
        <h1 className="page-title" style={{ marginTop: 12 }}>Log a meal</h1>

        <div className="log-search-wrap">
          <input
            className="log-search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search your foods, or type calories"
            aria-label="Search your foods, or type calories"
            inputMode="text"
            autoFocus
          />
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
                <p className="eyebrow">Recent</p>
                <div className="log-pick-list">
                  {recents.map(entry => (
                    <PickRow
                      key={entry.id}
                      name={entry.name}
                      emoji={entry.emoji}
                      calories={entry.calories}
                      onPick={() => logAgain(entry, 'recent')}
                    />
                  ))}
                </div>
              </>
            )}

            {favourites.length > 0 && (
              <>
                <p className="eyebrow">Favourites</p>
                <div className="log-pick-list">
                  {favourites.map(meal => (
                    <PickRow
                      key={meal.id}
                      name={meal.name}
                      emoji={meal.emoji}
                      calories={meal.calories}
                      onPick={() => logAgain(meal, 'favourite')}
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
              <div className="log-pick-list">
                {matches.map(item => (
                  <PickRow
                    key={item.id}
                    name={item.name}
                    emoji={item.emoji}
                    calories={item.calories}
                    onPick={() => logAgain(item, 'search')}
                  />
                ))}
              </div>
            ) : (
              <div className="log-empty">
                <p className="log-empty-sub">
                  Nothing saved by that name yet. Describe it below and AI will
                  work out the macros.
                </p>
              </div>
            )}
          </>
        )}

        <p className="eyebrow" style={{ marginTop: 24 }}>Other ways to log</p>
        <div>
          {OTHER_WAYS.map(opt => (
            <Link
              key={opt.to}
              to={opt.to}
              className="log-way-row"
              onClick={() => selectLogMethod(opt.method)}
            >
              <span className={`icon-tile icon-tile-sm icon-tile-${opt.accent}`}>
                <opt.Icon size={18} />
              </span>
              <span>
                <strong>{opt.title}</strong>
                <span className="page-sub" style={{ margin: 0 }}>{opt.desc}</span>
              </span>
            </Link>
          ))}
        </div>
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
}: {
  name: string
  emoji?: string
  calories: number
  onPick: () => void
}) {
  return (
    <button type="button" className="log-pick-row press-spring" onClick={onPick}>
      <span className="log-pick-emoji">{emoji ?? '🍽️'}</span>
      <span className="log-pick-name">{name}</span>
      <span className="log-pick-kcal">{Math.round(calories)} kcal</span>
    </button>
  )
}
