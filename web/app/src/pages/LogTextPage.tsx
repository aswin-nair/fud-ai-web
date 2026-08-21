import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { analyzeTextFood } from '../lib/foodAI'
import { providerLabel } from '../lib/aiConfig'
import { BackLink } from '../components/BackLink'
import { track } from '../lib/analytics'
import { clearLogDraft, hydrateLogDrafts, loadLogDrafts, saveTextLogDraft } from '../lib/logDrafts'
import { useAuth } from '../store/AuthContext'
import { PressableButton } from '../components/PressableButton'

const EXAMPLES = [
  '2 scrambled eggs, toast with butter',
  'Chicken rice bowl with veggies',
  'Large latte with oat milk',
  '100g Greek yogurt with berries',
]

export function LogTextPage() {
  const { state, setPendingAnalysis, setPendingSource } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.sub ?? ''
  const [text, setText] = useState(() => loadLogDrafts(userId).text?.text ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    void hydrateLogDrafts(userId).then(drafts => {
      if (!cancelled && drafts.text?.text) setText(current => current || drafts.text!.text)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    saveTextLogDraft(userId, text)
  }, [text, userId])

  useEffect(() => () => requestRef.current?.abort(), [])

  async function handleAnalyze() {
    const trimmed = text.trim()
    if (!trimmed) return
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setLoading(true)
    setError(null)
    track({ name: 'ai_analysis_started', method: 'text_ai' })
    try {
      const analysis = await analyzeTextFood(trimmed, state.aiSettings, controller.signal)
      track({ name: 'ai_analysis_completed', method: 'text_ai' })
      setPendingSource('textInput')
      setPendingAnalysis(analysis)
      clearLogDraft(userId, 'text')
      navigate('/review')
    } catch (e) {
      track({ name: 'ai_analysis_failed', method: 'text_ai' })
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      if (requestRef.current === controller) requestRef.current = null
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
          <PressableButton variant="secondary" label="Cancel analysis" onClick={() => requestRef.current?.abort()} />
        </main>
      </div>
    )
  }

  const hasKey = !!state.aiSettings.apiKey

  return (
    <div className="app-shell">
      <main className="app-main">
        <BackLink to="/log" />
        <h1 className="page-title" style={{ marginTop: 12 }}>Describe your meal</h1>
        <p className="page-sub">Type what you ate — AI estimates the macros.</p>

        {error && <div className="error-banner" role="alert">{error}</div>}

        {!hasKey && (
          <div className="no-key-banner">
            Add your <Link to="/settings">{providerLabel(state.aiSettings.provider)}</Link> API key in Settings to use AI logging,
            or <Link to="/log/manual">log manually</Link> without AI.
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

        <PressableButton
          fullWidth
          disabled={!text.trim() || !hasKey}
          onClick={handleAnalyze}
        >
          Analyze with AI
        </PressableButton>
      </main>
    </div>
  )
}
