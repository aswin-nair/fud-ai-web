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
} from '../lib/aiConfig'
import {
  dailyCalories,
  effectiveProtein,
  effectiveCarbs,
  effectiveFat,
} from '../lib/profile'
import { exportData, importData } from '../lib/storage'
import { userInitials } from '../lib/auth'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="settings-section-label">{children}</p>
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <div className="settings-card">{children}</div>
}

function SettingsRow({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="settings-row">
      <div className="settings-row-labels">
        <span className="settings-row-label">{label}</span>
        {hint && <span className="settings-row-hint">{hint}</span>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const { state, updateProfile, updateAISettings, replaceState, clearAllData } = useApp()
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile>(state.profile)
  const [provider, setProvider] = useState<AIProvider>(state.aiSettings.provider)
  const [apiKey, setApiKey] = useState(state.aiSettings.apiKey)
  const [showKey, setShowKey] = useState(false)
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
    updateAISettings({ provider, apiKey, model, customInstructions: instructions || undefined })
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

        {saved && (
          <div className="settings-saved-banner">Saved ✓</div>
        )}

        {/* Account */}
        <SectionLabel>Account</SectionLabel>
        <SettingsCard>
          {user && (
            <div className="settings-account-row">
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
          <button type="button" className="settings-signout-btn" onClick={signOut}>
            Sign out
          </button>
        </SettingsCard>

        {/* Daily goals summary */}
        <SectionLabel>Daily goals</SectionLabel>
        <div className="settings-goals-grid">
          <div className="settings-goal-card">
            <span className="settings-goal-label">Calories</span>
            <strong className="settings-goal-value">{dailyCalories(profile)}</strong>
          </div>
          <div className="settings-goal-card">
            <span className="settings-goal-label">Protein</span>
            <strong className="settings-goal-value" style={{ color: '#6B9FFF' }}>{effectiveProtein(profile)}g</strong>
          </div>
          <div className="settings-goal-card">
            <span className="settings-goal-label">Carbs</span>
            <strong className="settings-goal-value" style={{ color: '#FFB347' }}>{effectiveCarbs(profile)}g</strong>
          </div>
          <div className="settings-goal-card">
            <span className="settings-goal-label">Fat</span>
            <strong className="settings-goal-value" style={{ color: '#FF6B9D' }}>{effectiveFat(profile)}g</strong>
          </div>
        </div>

        {/* Profile */}
        <SectionLabel>Profile</SectionLabel>
        <SettingsCard>
          <SettingsRow label="Name">
            <input className="settings-input" value={profile.name ?? ''} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
          </SettingsRow>
          <SettingsRow label="Gender">
            <select className="settings-select" value={profile.gender} onChange={e => setProfile(p => ({ ...p, gender: e.target.value as Gender }))}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </SettingsRow>
          <SettingsRow label="Height" hint="cm">
            <input className="settings-input" type="number" value={profile.heightCm} onChange={e => setProfile(p => ({ ...p, heightCm: Number(e.target.value) }))} />
          </SettingsRow>
          <SettingsRow label="Weight" hint="kg">
            <input className="settings-input" type="number" value={profile.weightKg} onChange={e => setProfile(p => ({ ...p, weightKg: Number(e.target.value) }))} />
          </SettingsRow>
          <SettingsRow label="Activity">
            <select className="settings-select" value={profile.activityLevel} onChange={e => setProfile(p => ({ ...p, activityLevel: e.target.value as ActivityLevel }))}>
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map(k => (
                <option key={k} value={k}>{ACTIVITY_LABELS[k]}</option>
              ))}
            </select>
          </SettingsRow>
          <SettingsRow label="Goal">
            <select className="settings-select" value={profile.goal} onChange={e => setProfile(p => ({ ...p, goal: e.target.value as WeightGoal }))}>
              {(Object.keys(GOAL_LABELS) as WeightGoal[]).map(k => (
                <option key={k} value={k}>{GOAL_LABELS[k]}</option>
              ))}
            </select>
          </SettingsRow>
        </SettingsCard>

        {/* AI */}
        <SectionLabel>AI access (BYOK)</SectionLabel>
        <SettingsCard>
          <p className="settings-byok-note">
            Your key stays in this browser only.{' '}
            <a href={apiKeyHelpUrl(provider)} target="_blank" rel="noreferrer">Get a key →</a>
          </p>
          <SettingsRow label="Provider">
            <select className="settings-select" value={provider} onChange={e => handleProviderChange(e.target.value as AIProvider)}>
              <option value="openrouter">OpenRouter</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </SettingsRow>
          <SettingsRow label="API key">
            <div className="settings-key-wrap">
              <input
                className="settings-input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={apiKeyPlaceholder(provider)}
                autoComplete="off"
              />
              <button type="button" className="settings-key-toggle" onClick={() => setShowKey(v => !v)}>
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </SettingsRow>
          <SettingsRow label="Model">
            <input
              className="settings-input"
              list="model-presets"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder={provider === 'openrouter' ? 'openrouter/free' : 'gemini-2.0-flash'}
            />
            <datalist id="model-presets">
              {modelPresets.map(m => <option key={m} value={m} />)}
            </datalist>
          </SettingsRow>
          <div className="settings-field-block">
            <span className="settings-row-label">Custom instructions</span>
            <textarea
              className="settings-textarea"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. I follow a vegetarian diet"
              rows={3}
            />
          </div>
        </SettingsCard>

        <button type="button" className="btn btn-primary btn-block" style={{ marginBottom: 24 }} onClick={saveProfile}>
          Save settings
        </button>

        {/* Data */}
        <SectionLabel>Data</SectionLabel>
        <SettingsCard>
          <button type="button" className="settings-data-btn" onClick={handleExport}>
            Export backup
          </button>
          <div className="settings-divider" />
          <button type="button" className="settings-data-btn" onClick={() => fileRef.current?.click()}>
            Import backup
          </button>
          <div className="settings-divider" />
          <button
            type="button"
            className="settings-data-btn danger"
            onClick={() => { if (confirm('Delete all local data? This cannot be undone.')) clearAllData() }}
          >
            Delete all data
          </button>
          <input ref={fileRef} type="file" accept=".json" hidden onChange={handleImport} />
        </SettingsCard>

        <p className="settings-footer">Fud AI · Local-first · BYOK AI · Privacy-first</p>
      </main>
      <BottomNav />
    </div>
  )
}
