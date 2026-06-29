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
      <main className="app-main">
        <h1 className="page-title">Welcome to Fud AI</h1>
        <p className="page-sub">Set up your profile to calculate daily goals.</p>

        <div className="onboarding-steps">
          {STEPS.map((_, i) => (
            <div key={i} className={`step-dot${i <= step ? ' done' : ''}`} />
          ))}
        </div>

        {step === 0 && (
          <>
            <div className="field">
              <label>Name (optional)</label>
              <input
                value={profile.name ?? ''}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
              />
            </div>
            <div className="field">
              <label>Gender</label>
              <div className="chip-row">
                {(['male', 'female', 'other'] as Gender[]).map(g => (
                  <button
                    key={g}
                    type="button"
                    className={`chip${profile.gender === g ? ' active' : ''}`}
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
          </>
        )}

        {step === 1 && (
          <>
            <div className="field">
              <label>Height (cm)</label>
              <input
                type="number"
                value={profile.heightCm}
                onChange={e => setProfile(p => ({ ...p, heightCm: Number(e.target.value) }))}
              />
            </div>
            <div className="field">
              <label>Weight (kg)</label>
              <input
                type="number"
                value={profile.weightKg}
                onChange={e => setProfile(p => ({ ...p, weightKg: Number(e.target.value) }))}
              />
            </div>
            <div className="field">
              <label>Body fat % (optional)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="60"
                placeholder="e.g. 18"
                value={profile.bodyFatPercentage != null ? profile.bodyFatPercentage * 100 : ''}
                onChange={e => {
                  const v = e.target.value
                  setProfile(p => ({
                    ...p,
                    bodyFatPercentage: v ? Number(v) / 100 : undefined,
                  }))
                }}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <div className="field">
            <label>Activity level</label>
            <div className="chip-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map(level => (
                <button
                  key={level}
                  type="button"
                  className={`chip${profile.activityLevel === level ? ' active' : ''}`}
                  style={{ textAlign: 'left' }}
                  onClick={() => setProfile(p => ({ ...p, activityLevel: level }))}
                >
                  {ACTIVITY_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <>
            <div className="field">
              <label>Goal</label>
              <div className="chip-row">
                {(Object.keys(GOAL_LABELS) as WeightGoal[]).map(g => (
                  <button
                    key={g}
                    type="button"
                    className={`chip${profile.goal === g ? ' active' : ''}`}
                    onClick={() => setProfile(p => ({ ...p, goal: g }))}
                  >
                    {GOAL_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>
            {profile.goal !== 'maintain' && (
              <div className="field">
                <label>Weekly change (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1.5"
                  value={profile.weeklyChangeKg ?? 0.5}
                  onChange={e => setProfile(p => ({ ...p, weeklyChangeKg: Number(e.target.value) }))}
                />
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <div className="card">
            <p style={{ color: 'var(--ink-soft)', marginBottom: 16 }}>
              Based on your profile, here are your daily targets:
            </p>
            <div className="goals-summary">
              <div className="goal-item"><span>Calories</span><strong>{dailyCalories(profile)}</strong></div>
              <div className="goal-item"><span>Protein</span><strong>{effectiveProtein(profile)}g</strong></div>
              <div className="goal-item"><span>Carbs</span><strong>{effectiveCarbs(profile)}g</strong></div>
              <div className="goal-item"><span>Fat</span><strong>{effectiveFat(profile)}g</strong></div>
            </div>
          </div>
        )}

        <div className="form-actions">
          {step > 0 && (
            <button type="button" className="btn btn-ghost" onClick={back}>Back</button>
          )}
          <button type="button" className="btn btn-primary" onClick={next}>
            {step === STEPS.length - 1 ? 'Get started' : 'Continue'}
          </button>
        </div>
      </main>
    </div>
  )
}
