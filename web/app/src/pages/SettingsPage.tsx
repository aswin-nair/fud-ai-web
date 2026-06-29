import { useRef, useState } from 'react'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import { BottomNav } from '../components/BottomNav'
import type { ActivityLevel, AIProvider, Gender, UserProfile, WeightGoal } from '../types'
import { ACTIVITY_LABELS, GOAL_LABELS } from '../types'
import {
  OPENROUTER_MODELS,
  GEMINI_MODELS,
  apiKeyHelpUrl,
  apiKeyPlaceholder,
  providerLabel,
} from '../lib/aiConfig'
import {
  dailyCalories,
  effectiveProtein,
  effectiveCarbs,
  effectiveFat,
} from '../lib/profile'
import { exportData, importData } from '../lib/storage'
import { userInitials } from '../lib/auth'

export function SettingsPage() {
  const { state, updateProfile, updateAISettings, replaceState, clearAllData } = useApp()
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile>(state.profile)
  const [provider, setProvider] = useState<AIProvider>(state.aiSettings.provider)
  const [apiKey, setApiKey] = useState(state.aiSettings.apiKey)
  const [model, setModel] = useState(state.aiSettings.model)
  const [instructions, setInstructions] = useState(state.aiSettings.customInstructions ?? '')
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const modelPresets = provider === 'openrouter' ? OPENROUTER_MODELS : GEMINI_MODELS

  function handleProviderChange(next: AIProvider) {
    setProvider(next)
    setModel(next === 'openrouter' ? 'openrouter/free' : 'gemini-2.0-flash')
  }

  function saveProfile() {
    updateProfile(profile)
    updateAISettings({
      provider,
      apiKey,
      model,
      customInstructions: instructions || undefined,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleExport() {
    const blob = new Blob([exportData(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fud-ai-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const next = importData(String(reader.result))
        replaceState(next)
        setProfile(next.profile)
        setProvider(next.aiSettings.provider)
        setApiKey(next.aiSettings.apiKey)
        setModel(next.aiSettings.model)
        setInstructions(next.aiSettings.customInstructions ?? '')
      } catch {
        alert('Invalid backup file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Profile, goals, and AI access.</p>

        {saved && (
          <div className="card" style={{ marginBottom: 16, borderColor: 'var(--coral)' }}>
            <p style={{ color: 'var(--coral)', fontSize: '0.9rem' }}>Settings saved.</p>
          </div>
        )}

        <div className="settings-section">
          <h3>Account</h3>
          {user && (
            <div className="account-card">
              {user.picture ? (
                <img src={user.picture} alt="" className="account-avatar" referrerPolicy="no-referrer" />
              ) : (
                <div className="account-avatar account-avatar-fallback">{userInitials(user.name)}</div>
              )}
              <div className="account-info">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                <span className="account-provider">
                  {user.provider === 'email' ? 'Email account' : 'Google account'}
                </span>
              </div>
            </div>
          )}
          <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={signOut}>
            Sign out
          </button>
        </div>

        <div className="settings-section">
          <h3>Daily goals</h3>
          <div className="goals-summary">
            <div className="goal-item"><span>Calories</span><strong>{dailyCalories(profile)}</strong></div>
            <div className="goal-item"><span>Protein</span><strong>{effectiveProtein(profile)}g</strong></div>
            <div className="goal-item"><span>Carbs</span><strong>{effectiveCarbs(profile)}g</strong></div>
            <div className="goal-item"><span>Fat</span><strong>{effectiveFat(profile)}g</strong></div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Profile</h3>
          <div className="field">
            <label>Name</label>
            <input value={profile.name ?? ''} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="field">
            <label>Gender</label>
            <select value={profile.gender} onChange={e => setProfile(p => ({ ...p, gender: e.target.value as Gender }))}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="field">
            <label>Height (cm)</label>
            <input type="number" value={profile.heightCm} onChange={e => setProfile(p => ({ ...p, heightCm: Number(e.target.value) }))} />
          </div>
          <div className="field">
            <label>Weight (kg)</label>
            <input type="number" value={profile.weightKg} onChange={e => setProfile(p => ({ ...p, weightKg: Number(e.target.value) }))} />
          </div>
          <div className="field">
            <label>Activity</label>
            <select value={profile.activityLevel} onChange={e => setProfile(p => ({ ...p, activityLevel: e.target.value as ActivityLevel }))}>
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map(k => (
                <option key={k} value={k}>{ACTIVITY_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Goal</label>
            <select value={profile.goal} onChange={e => setProfile(p => ({ ...p, goal: e.target.value as WeightGoal }))}>
              {(Object.keys(GOAL_LABELS) as WeightGoal[]).map(k => (
                <option key={k} value={k}>{GOAL_LABELS[k]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>AI access (BYOK)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: 12 }}>
            Your API key stays in this browser only. Get a key at{' '}
            <a href={apiKeyHelpUrl(provider)} target="_blank" rel="noreferrer">
              {providerLabel(provider)}
            </a>.
          </p>
          <div className="field">
            <label>Provider</label>
            <select value={provider} onChange={e => handleProviderChange(e.target.value as AIProvider)}>
              <option value="openrouter">OpenRouter</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
          <div className="field">
            <label>{providerLabel(provider)} API key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={apiKeyPlaceholder(provider)}
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label>Model</label>
            <input
              list="model-presets"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder={provider === 'openrouter' ? 'openrouter/free' : 'gemini-2.0-flash'}
            />
            <datalist id="model-presets">
              {modelPresets.map(m => <option key={m} value={m} />)}
            </datalist>
            {provider === 'openrouter' && (
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-mute)', marginTop: 6 }}>
                Pick a preset or paste any model ID from{' '}
                <a href="https://openrouter.ai/models" target="_blank" rel="noreferrer">openrouter.ai/models</a>.
                Try <code>openrouter/free</code> to start without credits.
              </p>
            )}
          </div>
          <div className="field">
            <label>Custom instructions (optional)</label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. I follow a vegetarian diet"
            />
          </div>
        </div>

        <button type="button" className="btn btn-primary btn-block" onClick={saveProfile}>Save settings</button>

        <div className="settings-section" style={{ marginTop: 32 }}>
          <h3>Data</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button type="button" className="btn btn-secondary btn-block" onClick={handleExport}>
              Export backup
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => fileRef.current?.click()}>
              Import backup
            </button>
            <input ref={fileRef} type="file" accept=".json" hidden onChange={handleImport} />
            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ color: 'var(--coral-deep)' }}
              onClick={() => {
                if (confirm('Delete all local data? This cannot be undone.')) clearAllData()
              }}
            >
              Delete all data
            </button>
          </div>
        </div>

        <p style={{ marginTop: 24, fontSize: '0.8rem', color: 'var(--ink-mute)', textAlign: 'center' }}>
          Fud AI Web · Local-first · No accounts
        </p>
      </main>
      <BottomNav />
    </div>
  )
}
