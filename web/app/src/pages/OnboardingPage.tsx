import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import welcome1 from '@assets/welcome-1.webp'
import welcome2 from '@assets/welcome-2.webp'
import welcome3 from '@assets/welcome-3.webp'
import { useApp } from '../store/AppContext'
import type { ActivityLevel, Gender, UserProfile, WeightGoal } from '../types'
import { ACTIVITY_LABELS, GOAL_LABELS } from '../types'
import { IconChevronLeft, IconChevronRight } from '../components/icons'
import {
  dailyCalories,
  effectiveProtein,
  effectiveCarbs,
  effectiveFat,
  defaultProfile,
} from '../lib/profile'

const STEPS = ['About you', 'Body', 'Activity', 'Goal', 'Review']

const WELCOME_SLIDES = [
  {
    image: welcome1,
    title: 'Track what you eat, not what you fear',
    sub: 'Snap a photo or type a few words — Fud AI handles the nutrition math instantly.',
  },
  {
    image: welcome2,
    title: 'Progress you can actually see',
    sub: 'Streaks, XP, and a journey map turn everyday consistency into a game worth playing.',
  },
  {
    image: welcome3,
    title: 'Built around your pace',
    sub: 'Cut, bulk, or maintain — your targets adapt to your body and your goals, never the other way round.',
  },
] as const

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
  const [welcomeIndex, setWelcomeIndex] = useState(0)
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile())
  const showingWelcome = welcomeIndex < WELCOME_SLIDES.length

  function nextWelcome() {
    setWelcomeIndex(i => Math.min(i + 1, WELCOME_SLIDES.length))
  }

  function skipWelcome() {
    setWelcomeIndex(WELCOME_SLIDES.length)
  }

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

  if (showingWelcome) {
    const slide = WELCOME_SLIDES[welcomeIndex]
    const isLast = welcomeIndex === WELCOME_SLIDES.length - 1

    return (
      <div className="welcome-shell">
        <img key={welcomeIndex} src={slide.image} alt="" className="welcome-photo" />
        <div className="welcome-scrim" aria-hidden />

        {welcomeIndex < WELCOME_SLIDES.length - 1 && (
          <button type="button" className="welcome-skip" onClick={skipWelcome}>
            Skip
          </button>
        )}

        <div className="welcome-content">
          <div className="welcome-dots">
            {WELCOME_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`welcome-dot${i === welcomeIndex ? ' active' : ''}`}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setWelcomeIndex(i)}
              />
            ))}
          </div>
          <h1 className="welcome-title" key={`t-${welcomeIndex}`}>{slide.title}</h1>
          <p className="welcome-sub" key={`s-${welcomeIndex}`}>{slide.sub}</p>
          <button type="button" className="welcome-cta" onClick={nextWelcome}>
            {isLast ? 'Get started' : 'Continue'}
            <IconChevronRight size={16} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    )
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
            <button type="button" className="btn btn-ghost" onClick={back}><IconChevronLeft size={15} strokeWidth={2.4} /> Back</button>
          )}
          <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={next}>
            {step === STEPS.length - 1 ? <>🚀 Get started</> : <>Continue <IconChevronRight size={16} strokeWidth={2.4} /></>}
          </button>
        </div>
      </main>
    </div>
  )
}
