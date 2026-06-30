import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { analyzeImageFood, fileToBase64 } from '../lib/foodAI'
import { providerLabel } from '../lib/aiConfig'

export function PhotoLogPage() {
  const { state, setPendingAnalysis, setPendingSource } = useApp()
  const navigate = useNavigate()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
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
      setLoading(false)
    }
  }

  const hasKey = !!state.aiSettings.apiKey

  if (loading) {
    return (
      <div className="app-shell">
        <main className="app-main">
          {preview && (
            <img src={preview} alt="Food preview" className="photo-preview analyzing-photo" />
          )}
          <div className="analyzing-overlay">
            <div className="loading-spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
            <p className="analyzing-title">Reading your photo…</p>
            <p className="analyzing-sub">AI is identifying the food</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <Link to="/log" className="back-link">← Back</Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>Photo log</h1>
        <p className="page-sub">AI reads the food and estimates your macros.</p>

        {error && <div className="error-banner">{error}</div>}

        {!hasKey && (
          <div className="no-key-banner">
            Add your <Link to="/settings">{providerLabel(state.aiSettings.provider)}</Link> API key in Settings.
            Use a vision-capable model (e.g. <code>gemini-2.0-flash</code>).
          </div>
        )}

        {preview ? (
          <div className="photo-preview-wrap">
            <img src={preview} alt="Food preview" className="photo-preview" />
            <button
              type="button"
              className="photo-retake-btn"
              onClick={() => { setPreview(null); setError(null) }}
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <div className="photo-upload-zone" onClick={() => galleryRef.current?.click()}>
            <span className="photo-upload-icon" aria-hidden>📷</span>
            <p className="photo-upload-title">Tap to choose a photo</p>
            <p className="photo-upload-sub">JPG, PNG, HEIC — any food image</p>
          </div>
        )}

        <div className="photo-btn-row">
          <button
            type="button"
            className="photo-source-btn"
            disabled={!hasKey}
            onClick={() => cameraRef.current?.click()}
          >
            <span aria-hidden>📸</span> Camera
          </button>
          <button
            type="button"
            className="photo-source-btn"
            disabled={!hasKey}
            onClick={() => galleryRef.current?.click()}
          >
            <span aria-hidden>🖼️</span> Gallery
          </button>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </main>
    </div>
  )
}
