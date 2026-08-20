import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { analyzeImageFood, fileToBase64 } from '../lib/foodAI'
import { providerLabel } from '../lib/aiConfig'
import { BackLink } from '../components/BackLink'
import { IconClose } from '../components/icons'
import { track } from '../lib/analytics'

export function PhotoLogPage() {
  const { state, setPendingAnalysis, setPendingSource } = useApp()
  const navigate = useNavigate()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const selectedFileRef = useRef<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => requestRef.current?.abort(), [])

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file, or log the meal manually.')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('That image is larger than 15 MB. Choose a smaller image or log manually.')
      return
    }
    selectedFileRef.current = file
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setPreview(current => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
    setError(null)
    setLoading(true)
    track({ name: 'ai_analysis_started', method: 'photo_ai' })
    try {
      const { base64, mimeType } = await fileToBase64(file)
      if (controller.signal.aborted) throw new Error('Analysis cancelled. Your selected photo is still here.')
      const analysis = await analyzeImageFood(base64, state.aiSettings, mimeType, controller.signal)
      track({ name: 'ai_analysis_completed', method: 'photo_ai' })
      setPendingSource('snapFood')
      setPendingAnalysis(analysis)
      navigate('/review')
    } catch (e) {
      track({ name: 'ai_analysis_failed', method: 'photo_ai' })
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      if (requestRef.current === controller) requestRef.current = null
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
          <div className="analyzing-overlay" role="status" aria-live="polite">
            <div className="loading-spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
            <p className="analyzing-title">Reading your photo…</p>
            <p className="analyzing-sub">AI is identifying the food</p>
            <button type="button" className="btn btn-secondary" onClick={() => requestRef.current?.abort()}>
              Cancel analysis
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <BackLink to="/log" />
        <h1 className="page-title" style={{ marginTop: 12 }}>Photo log</h1>
        <p className="page-sub">AI reads the food and estimates your macros.</p>

        <div className="no-key-banner" role="note">
          When you analyze, the selected image is sent directly to {providerLabel(state.aiSettings.provider)}
          {' '}to estimate nutrition. Fud AI does not store the image; that provider controls any retention
          under its policy. <Link to="/log/manual">Log manually instead</Link> without uploading a photo.
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}

        {!hasKey && (
          <div className="no-key-banner">
            Add your <Link to="/settings">{providerLabel(state.aiSettings.provider)}</Link> API key in Settings.
            Use a vision-capable model (e.g. <code>gemini-2.0-flash</code>), or{' '}
            <Link to="/log/manual">log manually</Link>.
          </div>
        )}

        {preview ? (
          <div className="photo-preview-wrap">
            <img src={preview} alt="Food preview" className="photo-preview" />
            <button
              type="button"
              className="photo-retake-btn"
              onClick={() => {
                selectedFileRef.current = null
                if (cameraRef.current) cameraRef.current.value = ''
                if (galleryRef.current) galleryRef.current.value = ''
                setPreview(null)
                setError(null)
              }}
            >
              <IconClose size={14} strokeWidth={2.4} /> Remove
            </button>
          </div>
        ) : (
          <button type="button" className="photo-upload-zone" onClick={() => galleryRef.current?.click()}>
            <span className="photo-upload-icon" aria-hidden>📷</span>
            <p className="photo-upload-title">Tap to choose a photo</p>
            <p className="photo-upload-sub">JPG, PNG, HEIC — any food image</p>
          </button>
        )}

        {preview && error && selectedFileRef.current && (
          <button
            type="button"
            className="btn btn-secondary btn-block"
            disabled={!hasKey}
            onClick={() => selectedFileRef.current && handleFile(selectedFileRef.current)}
          >
            Analyze this photo again
          </button>
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
          aria-label="Take a photo"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          hidden
          aria-label="Choose a photo from gallery"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </main>
    </div>
  )
}
