import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { analyzeImageFood, fileToBase64 } from '../lib/foodAI'
import { providerLabel } from '../lib/aiConfig'

export function PhotoLogPage() {
  const { state, setPendingAnalysis, setPendingSource } = useApp()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setPreview(URL.createObjectURL(file))
    setError(null)
    setLoading(true)
    try {
      const { base64, mimeType } = await fileToBase64(file)
      const analysis = await analyzeImageFood(base64, state.aiSettings, mimeType)
      setPendingSource('snapFood')
      setPendingAnalysis(analysis)
      navigate('/review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <Link to="/log" style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>← Back</Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>Photo log</h1>
        <p className="page-sub">Take or upload a food photo for AI analysis.</p>

        {error && <div className="error-banner">{error}</div>}

        {!state.aiSettings.apiKey && (
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
              Add your {providerLabel(state.aiSettings.provider)} key in <Link to="/settings">Settings</Link>.
              Use a vision-capable model (e.g. <code>google/gemini-2.5-flash</code>).
            </p>
          </div>
        )}

        {preview && !loading && (
          <img src={preview} alt="Food preview" className="photo-preview" />
        )}

        {loading ? (
          <div className="analyzing-overlay">
            <div className="loading-spinner" />
            <p>Analyzing photo…</p>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={!state.aiSettings.apiKey}
              onClick={() => inputRef.current?.click()}
            >
              📷 Choose photo
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
          </>
        )}
      </main>
    </div>
  )
}
