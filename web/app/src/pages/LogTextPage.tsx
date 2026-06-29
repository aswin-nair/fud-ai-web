import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { analyzeTextFood } from '../lib/foodAI'
import { providerLabel } from '../lib/aiConfig'

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
          <div className="loading-spinner" />
          <p>AI is estimating nutrition…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <Link to="/log" style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>← Back</Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>Text log</h1>
        <p className="page-sub">Describe what you ate.</p>
        {error && <div className="error-banner">{error}</div>}
        {!state.aiSettings.apiKey && (
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
              Add your {providerLabel(state.aiSettings.provider)} key in <Link to="/settings">Settings</Link>.
            </p>
          </div>
        )}
        <div className="field">
          <label>Food description</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="e.g. 2 eggs, toast with butter, black coffee"
            autoFocus
          />
        </div>
        <button type="button" className="btn btn-primary btn-block" disabled={!text.trim() || !state.aiSettings.apiKey} onClick={handleAnalyze}>
          Analyze with AI
        </button>
      </main>
    </div>
  )
}
