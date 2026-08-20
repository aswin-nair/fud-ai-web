import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { ProgressLineChart, ProgressBarChart } from '../components/Charts'
import { useApp } from '../store/AppContext'
import { effectiveCalories } from '../lib/profile'
import { localDayKey } from '../lib/dates'
import { getStreakWithFreezes, getAllBadges, getMonthConsistency } from '../lib/journey'
import { IconChevronRight, IconMenuLines } from '../components/icons'

const RANGES = [
  { id: '1W', days: 7 },
  { id: '1M', days: 30 },
  { id: '3M', days: 90 },
  { id: '6M', days: 180 },
  { id: '1Y', days: 365 },
  { id: 'All', days: 3650 },
] as const

type RangeId = (typeof RANGES)[number]['id']

function filterByRange<T extends { date: string }>(items: T[], days: number): T[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days + 1)
  cutoff.setHours(0, 0, 0, 0)
  return items.filter(i => new Date(i.date) >= cutoff)
}

interface StatCardProps {
  label: string
  value: string
  sub?: string
  accent?: boolean
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  const valueColor = accent ? 'var(--coral-start)' : undefined

  return (
    <div className="progress-stat-card">
      <span className="progress-stat-label">{label}</span>
      <span className="progress-stat-value" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
      {sub && <span className="progress-stat-sub">{sub}</span>}
    </div>
  )
}

export function ProgressPage() {
  const { state, addWeightEntry, deleteWeightEntry } = useApp()
  const [range, setRange] = useState<RangeId>('1W')
  const streak = getStreakWithFreezes(
    state.foodEntries,
    state.gamification.freezeUsedDates,
    state.gamification.pauseProtectedDates,
  )
  const badges = getAllBadges(state.foodEntries, streak)
  const consistency = getMonthConsistency(state.foodEntries)
  const [showLog, setShowLog] = useState(false)
  const [weight, setWeight] = useState(String(state.profile.weightKg ?? ''))
  const [showHistory, setShowHistory] = useState(false)

  const days = RANGES.find(r => r.id === range)!.days
  const sortedWeights = [...state.weightEntries].sort((a, b) => a.date.localeCompare(b.date))
  const filteredWeights = filterByRange(sortedWeights, days)
  const goal = effectiveCalories(state.profile)
  const goalWeight = state.profile.goalWeightKg

  const currentWeight = filteredWeights.at(-1)?.weightKg ?? state.profile.weightKg ?? 0
  const startWeight = filteredWeights[0]?.weightKg ?? currentWeight
  const avgWeight = filteredWeights.length
    ? filteredWeights.reduce((s, w) => s + w.weightKg, 0) / filteredWeights.length
    : currentWeight
  const netChange = currentWeight - startWeight

  const calorieBars = useMemo(() => {
    const result: { label: string; value: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = localDayKey(d)
      const cals = state.foodEntries
        .filter(e => localDayKey(e.timestamp) === key)
        .reduce((s, e) => s + e.calories, 0)
      if (cals > 0 || range === '1W') {
        result.push({
          label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
          value: cals,
        })
      }
    }
    return result
  }, [state.foodEntries, days, range])

  const calorieDays = calorieBars.filter(b => b.value > 0)
  const avgCalories = calorieDays.length
    ? Math.round(calorieDays.reduce((s, b) => s + b.value, 0) / calorieDays.length)
    : 0

  const weightPoints = filteredWeights.map(w => ({
    label: new Date(w.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    value: w.weightKg,
  }))

  function logWeight() {
    const v = Number(weight)
    if (!v || v <= 0) return
    addWeightEntry(v)
    setShowLog(false)
  }

  if (state.profile.trackingPaused) {
    return (
      <div className="app-shell progress-shell">
        <main className="app-main progress-main">
          <div className="progress-page-header">
            <h1 className="screen-title" style={{ marginBottom: 0 }}>Progress</h1>
          </div>
          <div className="progress-card" style={{ textAlign: 'center' }}>
            <h2 className="progress-card-title">Tracking is paused</h2>
            <p className="page-sub" style={{ marginTop: 8 }}>
              Your progress numbers are hidden and your streak is being held.
            </p>
            <Link to="/settings" className="btn btn-primary" style={{ marginTop: 18 }}>
              Manage pause
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-shell progress-shell">
      <main className="app-main progress-main">

        <div className="progress-page-header">
          <h1 className="screen-title" style={{ marginBottom: 0 }}>Progress</h1>
        </div>

        <div className="range-chips">
          {RANGES.map(r => (
            <button
              key={r.id}
              type="button"
              className={`range-chip${range === r.id ? ' active' : ''}`}
              onClick={() => setRange(r.id)}
            >
              {r.id}
            </button>
          ))}
        </div>

        {/* §9.3: consistency leads. Calories and weight are downstream of the
            habit, so the habit is what the page opens with. */}
        <div className="progress-card">
          <div className="progress-card-header">
            <h2 className="progress-card-title">Consistency</h2>
            <span className="consistency-streak">{streak}-day streak</span>
          </div>

          <div className="consistency-headline">
            <strong className="consistency-number">{consistency.logged}</strong>
            <span className="consistency-unit">
              {consistency.logged === 1 ? 'day logged' : 'days logged'}
            </span>
          </div>
          <p className="consistency-sub">
            of {consistency.elapsed} {consistency.elapsed === 1 ? 'day' : 'days'} so far this month
          </p>

          <div className="consistency-grid" aria-hidden>
            {consistency.days.map((logged, i) => (
              <span
                key={i}
                className={
                  'consistency-dot'
                  + (logged ? ' is-logged' : '')
                  + (i >= consistency.elapsed ? ' is-future' : '')
                }
              />
            ))}
          </div>
        </div>

        {/* Weight card */}
        <div className="progress-card">
          <div className="progress-card-header">
            <h2 className="progress-card-title">Weight</h2>
            <button type="button" className="progress-log-btn" onClick={() => setShowLog(true)}>
              + Log weight
            </button>
          </div>

          <div className="progress-stat-grid">
            <StatCard label="Current" value={`${currentWeight.toFixed(1)} kg`} accent />
            <StatCard
              label="Goal"
              value={goalWeight != null ? `${goalWeight.toFixed(1)} kg` : '—'}
            />
            <StatCard
              label="Net change"
              value={`${netChange >= 0 ? '+' : ''}${netChange.toFixed(1)} kg`}
            />
            <StatCard label="Average" value={`${avgWeight.toFixed(1)} kg`} />
          </div>

          <ProgressLineChart points={weightPoints} goal={goalWeight ?? undefined} unit=" kg" />
        </div>

        {sortedWeights.length > 0 && (
          <button type="button" className="history-link-card" onClick={() => setShowHistory(v => !v)}>
            <span className="history-link-icon"><IconMenuLines size={17} /></span>
            <div className="history-link-text">
              <strong>Weight history</strong>
              <span>{sortedWeights.length} {sortedWeights.length === 1 ? 'entry' : 'entries'} · tap to {showHistory ? 'hide' : 'view or delete'}</span>
            </div>
            <span className="about-chevron" style={{ display: 'inline-flex', transform: showHistory ? 'rotate(90deg)' : undefined, transition: 'transform 0.2s' }}><IconChevronRight size={16} /></span>
          </button>
        )}

        {showHistory && (
          <div className="progress-card" style={{ marginBottom: 12 }}>
            {[...sortedWeights].reverse().map(w => (
              <div key={w.id} className="history-row">
                <span className="history-date">{new Date(w.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <strong className="history-weight">{w.weightKg.toFixed(1)} kg</strong>
                <button type="button" className="btn-delete" onClick={() => deleteWeightEntry(w.id)}>Delete</button>
              </div>
            ))}
          </div>
        )}

        {/* Calories card */}
        <div className="progress-card">
          <div className="progress-card-header">
            <h2 className="progress-card-title">Calories</h2>
            <div className="progress-avg-pill">
              Avg {avgCalories.toLocaleString()} kcal
            </div>
          </div>

          <div className="progress-stat-grid" style={{ marginBottom: 12 }}>
            <StatCard label="Goal" value={`${goal.toLocaleString()} kcal`} />
            <StatCard
              label="Days tracked"
              value={String(calorieDays.length)}
              sub={`of ${days} days`}
            />
          </div>

          <ProgressBarChart bars={calorieBars} goal={goal} />
        </div>

        {/* Badges */}
        <div className="progress-card">
          <div className="progress-card-header">
            <h2 className="progress-card-title">Achievements</h2>
            <span className="badge-count-pill">
              {badges.filter(b => b.unlocked).length}/{badges.length}
            </span>
          </div>
          {streak > 0 && (
            <div className="streak-banner">
              <span className="streak-banner-fire">🔥</span>
              <div>
                <span className="streak-banner-num">{streak}-day streak</span>
                <span className="streak-banner-sub"> — keep it going!</span>
              </div>
            </div>
          )}
          <div className="badge-grid">
            {badges.map(b => (
              <div key={b.id} className={`badge-card${b.unlocked ? ' unlocked' : ' locked'}`}>
                <span className="badge-emoji">{b.emoji}</span>
                <span className="badge-name">{b.name}</span>
                <span className="badge-desc">{b.desc}</span>
              </div>
            ))}
          </div>
        </div>

      </main>

      {showLog && (
        <div className="modal-backdrop" onClick={() => setShowLog(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h3>Log weight</h3>
            <div className="field">
              <label htmlFor="log-weight">Weight (kg)</label>
              <input
                id="log-weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                autoFocus
              />
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={logWeight}>Save</button>
            <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => setShowLog(false)}>Cancel</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
