import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import type { ActivityLevel, Gender, UserProfile, WeightGoal } from '../types'
import { ACTIVITY_LABELS, GOAL_LABELS } from '../types'
import {
  dailyCalories,
  effectiveProtein,
  effectiveCarbs,
  effectiveFat,
  defaultProfile,
} from '../lib/profile'

const STEPS = ['About you', 'Body', 'Activity', 'Goal', 'Review']

const ACTIVITY_ICONS: Record<ActivityLevel, string> = {
  sedentary: '🪑',
  light: '🚶',
  moderate: '🏃',
  active: '🏋️',
  veryActive: '⚡',
  extraActive: '🔥',
}

export function OnboardingPage() {
  const { updateProfile, setOnboarded } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile())

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
  }

  function finish() {
    updateProfile(profile)
    setOnboarded(true)
    navigate('/')
  }

  return (
    <div className="app-shell">
      <main className="app-main onboarding-main">
        {/* Step indicator */}
        <div className="onboarding-header">
          <div className="onboarding-steps">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`onboarding-step-dot${i < step ? ' done' : i === step ? ' current' : ''}`}
              />
            ))}
          </div>
          <span className="onboarding-step-label">{STEPS[step]}</span>
        </div>

        {step === 0 && (
          <div className="onboarding-step-content">
            <h1 className="onboarding-title">Welcome to Fud AI 👋</h1>
            <p className="onboarding-sub">Let's set up your profile to calculate your daily targets.</p>
            <div className="field">
              <label>Your name (optional)</label>
              <input
                value={profile.name ?? ''}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Alex"
                autoFocus
              />
            </div>
            <div className="field">
              <label>Gender</label>
              <div className="onboarding-chip-row">
                {(['male', 'female', 'other'] as Gender[]).map(g => (
                  <button
                    key={g}
                    type="button"
                    className={`onboarding-chip${profile.gender === g ? ' active' : ''}`}
                    onClick={() => setProfile(p => ({ ...p, gender: g }))}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Birthday</label>
              <input
                type="date"
                value={profile.birthday.slice(0, 10)}
                onChange={e => setProfile(p => ({ ...p, birthday: new Date(e.target.value).toISOString() }))}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-step-content">
            <h1 className="onboarding-title">Your body</h1>
            <p className="onboarding-sub">Used to calculate your basal metabolic rate.</p>
            <div className="field">
              <label>Height (cm)</label>
              <input type="number" value={profile.heightCm} onChange={e => setProfile(p => ({ ...p, heightCm: Number(e.target.value) }))} />
            </div>
            <div className="field">
              <label>Weight (kg)</label>
              <input type="number" value={profile.weightKg} onChange={e => setProfile(p => ({ ...p, weightKg: Number(e.target.value) }))} />
            </div>
            <div className="field">
              <label>Body fat % <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="number" step="0.1" min="0" max="60"
                placeholder="e.g. 18"
                value={profile.bodyFatPercentage != null ? profile.bodyFatPercentage * 100 : ''}
                onChange={e => {
                  const v = e.target.value
                  setProfile(p => ({ ...p, bodyFatPercentage: v ? Number(v) / 100 : undefined }))
                }}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step-content">
            <h1 className="onboarding-title">Activity level</h1>
            <p className="onboarding-sub">How active are you on a typical day?</p>
            <div className="activity-option-list">
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map(level => (
                <button
                  key={level}
                  type="button"
                  className={`activity-option${profile.activityLevel === level ? ' active' : ''}`}
                  onClick={() => setProfile(p => ({ ...p, activityLevel: level }))}
                >
                  <span className="activity-option-icon">{ACTIVITY_ICONS[level]}</span>
                  <span className="activity-option-label">{ACTIVITY_LABELS[level]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step-content">
            <h1 className="onboarding-title">Your goal</h1>
            <p className="onboarding-sub">This adjusts your calorie target.</p>
            <div className="onboarding-chip-row" style={{ flexDirection: 'column' }}>
              {(Object.keys(GOAL_LABELS) as WeightGoal[]).map(g => (
                <button
                  key={g}
                  type="button"
                  className={`onboarding-chip goal-chip${profile.goal === g ? ' active' : ''}`}
                  onClick={() => setProfile(p => ({ ...p, goal: g }))}
                >
                  {GOAL_LABELS[g]}
                </button>
              ))}
            </div>
            {profile.goal !== 'maintain' && (
              <div className="field" style={{ marginTop: 16 }}>
                <label>Weekly change (kg)</label>
                <input
                  type="number" step="0.1" min="0.1" max="1.5"
                  value={profile.weeklyChangeKg ?? 0.5}
                  onChange={e => setProfile(p => ({ ...p, weeklyChangeKg: Number(e.target.value) }))}
                />
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="onboarding-step-content">
            <h1 className="onboarding-title">Your daily targets</h1>
            <p className="onboarding-sub">Calculated from your profile — you can adjust these in Settings.</p>
            <div className="onboarding-goals-grid">
              <div className="onboarding-goal-card" style={{ gridColumn: '1 / -1' }}>
                <span className="onboarding-goal-label">Calories</span>
                <span className="onboarding-goal-value" style={{ color: 'var(--coral-start)' }}>{dailyCalories(profile)}</span>
                <span className="onboarding-goal-unit">kcal / day</span>
              </div>
              <div className="onboarding-goal-card">
                <span className="onboarding-goal-label">Protein</span>
                <span className="onboarding-goal-value" style={{ color: '#6B9FFF' }}>{effectiveProtein(profile)}g</span>
              </div>
              <div className="onboarding-goal-card">
                <span className="onboarding-goal-label">Carbs</span>
                <span className="onboarding-goal-value" style={{ color: '#FFB347' }}>{effectiveCarbs(profile)}g</span>
              </div>
              <div className="onboarding-goal-card">
                <span className="onboarding-goal-label">Fat</span>
                <span className="onboarding-goal-value" style={{ color: '#FF6B9D' }}>{effectiveFat(profile)}g</span>
              </div>
            </div>
          </div>
        )}

        <div className="onboarding-actions">
          {step > 0 && (
            <button type="button" className="btn btn-ghost" onClick={back}>Back</button>
          )}
          <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={next}>
            {step === STEPS.length - 1 ? '🚀 Get started' : 'Continue →'}
          </button>
        </div>
      </main>
    </div>
  )
}
