import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { analyzeTextFood } from '../lib/foodAI'
import { providerLabel } from '../lib/aiConfig'

const EXAMPLES = [
  '2 scrambled eggs, toast with butter',
  'Chicken rice bowl with veggies',
  'Large latte with oat milk',
  '100g Greek yogurt with berries',
]

export function LogTextPage() {
  const { state, setPendingAnalysis, setPendingSource } = useApp()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    const trimmed = text.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const analysis = await analyzeTextFood(trimmed, state.aiSettings)
      setPendingSource('textInput')
      setPendingAnalysis(analysis)
      navigate('/review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="app-shell">
        <main className="app-main analyzing-overlay">
          <div className="analyzing-ring">
            <div className="loading-spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
          </div>
          <p className="analyzing-title">Estimating nutrition…</p>
          <p className="analyzing-sub">AI is reading your description</p>
        </main>
      </div>
    )
  }

  const hasKey = !!state.aiSettings.apiKey

  return (
    <div className="app-shell">
      <main className="app-main">
        <Link to="/log" className="back-link">← Back</Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>Describe your meal</h1>
        <p className="page-sub">Type what you ate — AI estimates the macros.</p>

        {error && <div className="error-banner">{error}</div>}

        {!hasKey && (
          <div className="no-key-banner">
            Add your <Link to="/settings">{providerLabel(state.aiSettings.provider)}</Link> API key in Settings to use AI logging.
          </div>
        )}

        <div className="text-log-area">
          <textarea
            className="text-log-input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="e.g. 2 eggs, toast with butter, black coffee"
            autoFocus
            rows={4}
          />
          {!text && (
            <div className="text-log-examples">
              <p className="text-log-examples-label">Try an example</p>
              <div className="example-chips">
                {EXAMPLES.map(ex => (
                  <button key={ex} type="button" className="example-chip" onClick={() => setText(ex)}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn btn-log btn-block"
          disabled={!text.trim() || !hasKey}
          onClick={handleAnalyze}
        >
          ✨ Analyze with AI
        </button>
      </main>
    </div>
  )
}
