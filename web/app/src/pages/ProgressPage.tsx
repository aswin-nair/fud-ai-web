import { useMemo, useState } from 'react'
import { BottomNav } from '../components/BottomNav'
import { ProgressLineChart, ProgressBarChart } from '../components/Charts'
import { useApp } from '../store/AppContext'
import { effectiveCalories } from '../lib/profile'
import { localDayKey } from '../lib/dates'

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

export function ProgressPage() {
  const { state, addWeightEntry, deleteWeightEntry } = useApp()
  const [range, setRange] = useState<RangeId>('1W')
  const [showLog, setShowLog] = useState(false)
  const [weight, setWeight] = useState(String(state.profile.weightKg))
  const [showHistory, setShowHistory] = useState(false)

  const days = RANGES.find(r => r.id === range)!.days
  const sortedWeights = [...state.weightEntries].sort((a, b) => a.date.localeCompare(b.date))
  const filteredWeights = filterByRange(sortedWeights, days)
  const goal = effectiveCalories(state.profile)
  const goalWeight = state.profile.goalWeightKg

  const currentWeight = filteredWeights.at(-1)?.weightKg ?? state.profile.weightKg
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
    setWeight(String(v))
    setShowLog(false)
  }

  return (
    <div className="app-shell progress-shell">
      <main className="app-main progress-main">
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

        <div className="progress-card">
          <div className="progress-card-header">
            <h2 className="progress-card-title">Weight</h2>
            <button type="button" className="progress-action" onClick={() => setShowLog(true)}>
              + Log Weight
            </button>
          </div>

          <div className="stat-badges">
            <div className="stat-badge">
              <strong>{currentWeight.toFixed(1)} kg</strong>
              <span>Current</span>
            </div>
            <div className="stat-badge">
              <strong>{goalWeight != null ? `${goalWeight.toFixed(1)} kg` : '—'}</strong>
              <span>Goal</span>
            </div>
            <div className="stat-badge">
              <strong>{netChange >= 0 ? '+' : ''}{netChange.toFixed(1)} kg</strong>
              <span>Net Change</span>
            </div>
            <div className="stat-badge">
              <strong>{avgWeight.toFixed(1)} kg</strong>
              <span>Average</span>
            </div>
          </div>

          <ProgressLineChart points={weightPoints} goal={goalWeight ?? undefined} unit=" kg" />
        </div>

        {sortedWeights.length > 0 && (
          <button type="button" className="history-link-card" onClick={() => setShowHistory(v => !v)}>
            <span className="history-link-icon">☰</span>
            <div className="history-link-text">
              <strong>Weight History</strong>
              <span>{sortedWeights.length} entries · tap to view or delete</span>
            </div>
            <span className="about-chevron">›</span>
          </button>
        )}

        {showHistory && sortedWeights.length > 0 && (
          <div className="progress-card">
            {[...sortedWeights].reverse().map(w => (
              <div key={w.id} className="history-row">
                <span>{new Date(w.date).toLocaleDateString()}</span>
                <strong>{w.weightKg.toFixed(1)} kg</strong>
                <button type="button" className="btn-copy" onClick={() => deleteWeightEntry(w.id)}>Delete</button>
              </div>
            ))}
          </div>
        )}

        <div className="progress-card">
          <div className="progress-card-header">
            <h2 className="progress-card-title">Calories</h2>
            <span className="progress-avg-badge">Avg: {avgCalories.toLocaleString()} kcal</span>
          </div>
          <ProgressBarChart bars={calorieBars} goal={goal} />
        </div>
      </main>

      {showLog && (
        <div className="modal-backdrop" onClick={() => setShowLog(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h3>Log Weight</h3>
            <div className="field">
              <label htmlFor="log-weight">Weight (kg)</label>
              <input id="log-weight" type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} />
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
