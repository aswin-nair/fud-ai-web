import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import welcome1 from '@assets/welcome-1.webp'
import welcome2 from '@assets/welcome-2.webp'
import welcome3 from '@assets/welcome-3.webp'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import type { ActivityLevel, Gender, LoggingCommitment, MealType, UserProfile, WeightGoal } from '../types'
import { ACTIVITY_LABELS, GOAL_LABELS, MEAL_LABELS } from '../types'
import { IconChevronLeft, IconChevronRight } from '../components/icons'
import { PressableButton } from '../components/PressableButton'
import {
  computeTargets,
  effectiveProtein,
  effectiveCarbs,
  effectiveFat,
  defaultProfile,
  goalWeightIssue,
  maxWeeklyChangeKg,
  profileInputIssue,
} from '../lib/profile'
import {
  birthdayEligibility,
  birthdayToIso,
  clearOnboardingDraft,
  loadOnboardingDraft,
  localDateInputValue,
  saveOnboardingDraft,
  type OnboardingDraft,
} from '../lib/onboarding'
import { selectLogMethod, startLogFlow, track } from '../lib/analytics'
import { guestUserId } from '../lib/guestMode'

const STEPS = ['Age', 'About you', 'Body', 'Goal', 'Activity', 'Your pace', 'Review', 'First meal']
const FIRST_MEAL_STEP = STEPS.length - 1

const COMMITMENTS: Array<{ id: LoggingCommitment; icon: string; title: string; description: string }> = [
  { id: 'light', icon: '🌱', title: 'Light', description: 'One honest log makes the day.' },
  { id: 'regular', icon: '🍽️', title: 'Regular', description: 'Aim for breakfast, lunch, and dinner.' },
  { id: 'detailed', icon: '✨', title: 'Detailed', description: 'Main meals plus a photo, note, or correction.' },
]

const WELCOME_SLIDES = [
  {
    image: welcome1,
    title: 'Food tracking, at your pace.',
    sub: 'Track meals, calories, and macros. Start with your profile, then log your first meal.',
  },
  {
    image: welcome2,
    title: 'A calmer view of progress',
    sub: 'See logging consistency, streaks, and milestones without judging what you ate.',
  },
  {
    image: welcome3,
    title: 'Built around your pace',
    sub: 'Your starting estimate adapts to your profile and stays inside clear safety limits.',
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

function positiveNumber(value: string): number | null {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

function nonnegativeNumber(value: string): number {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : 0
}

function birthdayMessage(status: ReturnType<typeof birthdayEligibility>): string {
  if (status === 'missing') return 'Enter your date of birth to continue.'
  if (status === 'invalid') return 'Enter a valid date of birth.'
  return ''
}

export function OnboardingPage() {
  const { state, updateProfile, setOnboarded, addEntry } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.sub ?? guestUserId()
  const finishing = useRef(false)
  const trackedSteps = useRef(new Set<number>())
  const [validationError, setValidationError] = useState<string | null>(null)
  const [draft, setDraft] = useState<OnboardingDraft>(() => {
    const initialProfile = {
      ...defaultProfile(),
      name: state.profile.name ?? user?.name,
      birthday: '',
    }
    const loaded = loadOnboardingDraft(userId, initialProfile)
    if (!loaded.blocked && loaded.step > 0 && birthdayEligibility(loaded.birthdayInput) !== 'eligible') {
      return { ...loaded, step: 0 }
    }
    return loaded
  })

  const { profile, firstMeal, step } = draft
  const showingWelcome = draft.welcomeIndex < WELCOME_SLIDES.length
  const birthdayStatus = birthdayEligibility(draft.birthdayInput)
  const targets = birthdayStatus === 'eligible' ? computeTargets(profile) : null
  const firstMealCalories = positiveNumber(firstMeal.calories)
  const firstMealReady = firstMeal.name.trim().length > 0 && firstMealCalories !== null

  useEffect(() => {
    saveOnboardingDraft(userId, draft)
  }, [draft, userId])

  useEffect(() => {
    if (showingWelcome || draft.blocked || trackedSteps.current.has(step)) return
    trackedSteps.current.add(step)
    track({ name: 'onboarding_step_viewed', step: STEPS[step], step_index: step })

    if (step === 6 && targets) {
      track({ name: 'target_calculated', adjusted: targets.reasons.length > 0 })
      if (targets.reasons.length > 0) {
        track({ name: 'target_adjustment_explained', reasons: targets.reasons })
      }
    }

    if (step === FIRST_MEAL_STEP) {
      startLogFlow('manual', true)
      selectLogMethod('manual')
    }
  }, [draft.blocked, showingWelcome, step, targets])

  function updateDraft(update: (current: OnboardingDraft) => OnboardingDraft) {
    setDraft(update)
    setValidationError(null)
  }

  function updateDraftProfile(update: (current: UserProfile) => UserProfile) {
    updateDraft(current => ({ ...current, profile: update(current.profile) }))
  }

  function nextWelcome() {
    updateDraft(current => ({
      ...current,
      welcomeIndex: Math.min(current.welcomeIndex + 1, WELCOME_SLIDES.length),
    }))
  }

  function skipWelcome() {
    updateDraft(current => ({ ...current, welcomeIndex: WELCOME_SLIDES.length }))
  }

  function next() {
    if (step === 0) {
      const status = birthdayEligibility(draft.birthdayInput)
      if (status === 'underage') {
        track({ name: 'age_gate_blocked' })
        setDraft(current => ({ ...current, blocked: true }))
        return
      }
      if (status !== 'eligible') {
        setValidationError(birthdayMessage(status))
        return
      }
      track({ name: 'age_gate_passed' })
    }

    if (step === 2 || step === 3 || step === 6) {
      const issue = profileInputIssue(profile) ?? goalWeightIssue(profile)
      if (issue) {
        setValidationError(issue)
        return
      }
    }

    if (step < FIRST_MEAL_STEP) {
      updateDraft(current => ({ ...current, step: current.step + 1 }))
    }
  }

  function back() {
    if (step > 0) updateDraft(current => ({ ...current, step: current.step - 1 }))
  }

  function handleBirthdayChange(value: string) {
    const birthday = birthdayToIso(value) ?? ''
    updateDraft(current => ({
      ...current,
      birthdayInput: value,
      profile: { ...current.profile, birthday },
    }))
  }

  function updateFirstMeal(field: keyof OnboardingDraft['firstMeal'], value: string) {
    updateDraft(current => ({
      ...current,
      firstMeal: { ...current.firstMeal, [field]: value },
    }))
  }

  function finishWithFirstMeal() {
    if (finishing.current) return
    if (birthdayEligibility(draft.birthdayInput) !== 'eligible' || !targets) {
      setDraft(current => ({ ...current, step: 0 }))
      setValidationError('Confirm your date of birth before continuing.')
      return
    }
    if (!firstMealReady || firstMealCalories === null) {
      setValidationError('Enter a meal name and calories to log your first meal.')
      return
    }

    finishing.current = true
    const name = firstMeal.name.trim()
    const calories = Math.round(firstMealCalories)
    const entryId = crypto.randomUUID()
    if (targets.clamped) track({ name: 'goal_clamped' })
    updateProfile(profile)
    addEntry({
      id: entryId,
      name,
      calories,
      protein: nonnegativeNumber(firstMeal.protein),
      carbs: nonnegativeNumber(firstMeal.carbs),
      fat: nonnegativeNumber(firstMeal.fat),
      timestamp: new Date().toISOString(),
      emoji: '🍽️',
      source: 'manual',
      mealType: firstMeal.mealType,
    })
    setOnboarded(true)
    track({ name: 'onboarding_completed' })
    clearOnboardingDraft(userId)
    // Switching the route table from onboarding-only to the main app first
    // triggers its wildcard redirect. Navigate with the celebration payload on
    // the next task so that redirect cannot discard the location state.
    window.setTimeout(() => {
      navigate('/', { replace: true, state: { justLogged: { id: entryId, calories, name } } })
    }, 0)
  }

  if (draft.blocked) {
    return (
      <div className="app-shell">
        <main className="app-main onboarding-main">
          <div className="onboarding-step-content">
            <h1 className="onboarding-title">This one is built for adults</h1>
            <p className="onboarding-sub">
              Fud AI is only available to adults. A doctor, dietitian, parent, or guardian is the right place to start.
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (showingWelcome) {
    const slide = WELCOME_SLIDES[draft.welcomeIndex]
    const isLast = draft.welcomeIndex === WELCOME_SLIDES.length - 1

    return (
      <main className="welcome-shell welcome-refresh" aria-label="Welcome to Fud AI">
        <header className="welcome-brand-row">
          <span className="welcome-brand">Fud AI<span aria-hidden="true">.</span></span>
          <span className="welcome-intro-label">Welcome</span>
        </header>
        <div className="welcome-image-frame">
          <img key={draft.welcomeIndex} src={slide.image} alt="" className="welcome-photo" />
        </div>

        <section className="welcome-content" aria-labelledby="welcome-heading">
          <div className="welcome-copy" aria-live="polite" aria-atomic="true">
            <p className="welcome-kicker">{['Your everyday food journal', 'Progress, without pressure', 'A starting point, not a rulebook'][draft.welcomeIndex]}</p>
            <h1 className="welcome-title" id="welcome-heading">{slide.title}</h1>
            <p className="welcome-sub">{slide.sub}</p>
          </div>
          <nav className="welcome-slide-nav" aria-label="Introduction slides">
          <div className="welcome-dots">
            {WELCOME_SLIDES.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`welcome-dot${index === draft.welcomeIndex ? ' active' : ''}`}
                aria-label={`Go to slide ${index + 1}: ${WELCOME_SLIDES[index].title}`}
                aria-current={index === draft.welcomeIndex ? 'step' : undefined}
                onClick={() => updateDraft(current => ({ ...current, welcomeIndex: index }))}
              ><span aria-hidden="true" /></button>
            ))}
          </div>
          <span className="welcome-slide-count" aria-hidden="true">{draft.welcomeIndex + 1} / {WELCOME_SLIDES.length}</span>
          <div className="welcome-slide-arrows">
            <button type="button" aria-label="Previous introduction" disabled={draft.welcomeIndex === 0}
              onClick={() => updateDraft(current => ({ ...current, welcomeIndex: Math.max(0, current.welcomeIndex - 1) }))}>
              <IconChevronLeft size={18} />
            </button>
            <button type="button" aria-label="Next introduction" disabled={isLast} onClick={nextWelcome}>
              <IconChevronRight size={18} />
            </button>
          </div>
          </nav>
          <div className="welcome-actions">
          <PressableButton fullWidth onClick={skipWelcome}>
            Get started
            <IconChevronRight size={16} strokeWidth={2.4} />
          </PressableButton>
          <p className="welcome-setup-note">Set up your profile · Intro slides are optional</p>
          <Link to="/login" className="onboarding-signin-link welcome-signin-link">
            Already have an account? <strong>Sign in</strong>
          </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <main className="app-main onboarding-main">
        <div className="onboarding-header">
          <div
            className="onboarding-progress"
            role="progressbar"
            aria-label="Onboarding progress"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
            aria-valuetext={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
          >
            <span
              className="onboarding-progress-fill"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <span className="onboarding-step-label">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </span>
          {/* The welcome carousel is skippable, so the way back to an existing
              account has to survive here too — otherwise someone on a new
              device rebuilds a profile they already have. */}
          <Link to="/login" className="onboarding-signin-link">
            I already have an account
          </Link>
        </div>

        {validationError && <div className="error-banner" role="alert">{validationError}</div>}

        {step === 0 && (
          <div className="onboarding-step-content">
            <h1 className="onboarding-title">What is your date of birth?</h1>
            <p className="onboarding-sub">We use this to keep goal calculations appropriate for adults.</p>
            <p className="onboarding-clamp-hint">You can edit or delete this profile later from You.</p>
            <div className="field">
              <label htmlFor="onboarding-birthday">Date of birth</label>
              <input
                id="onboarding-birthday"
                type="date"
                value={draft.birthdayInput}
                max={localDateInputValue()}
                onChange={event => handleBirthdayChange(event.target.value)}
                autoFocus
                required
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-step-content">
            <h1 className="onboarding-title">About you</h1>
            <p className="onboarding-sub">A name is optional. Choose the equation that best matches your physiology; this is separate from your identity.</p>
            <div className="field">
              <label htmlFor="onboarding-name">Your name <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>(optional)</span></label>
              <input
                id="onboarding-name"
                value={profile.name ?? ''}
                onChange={event => updateDraftProfile(current => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Alex"
                autoComplete="name"
              />
            </div>
            <div className="field">
              <span className="onboarding-step-label" id="equation-label">Equation used for the estimate</span>
              <div className="onboarding-chip-row" role="group" aria-labelledby="equation-label">
                {(['female', 'male'] as Gender[]).map(gender => (
                  <button
                    key={gender}
                    type="button"
                    className={`onboarding-chip${profile.gender === gender ? ' active' : ''}`}
                    aria-pressed={profile.gender === gender}
                    onClick={() => updateDraftProfile(current => ({ ...current, gender }))}
                  >
                    {gender === 'female' ? 'Female equation' : 'Male equation'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step-content">
            <h1 className="onboarding-title">Your body</h1>
            <p className="onboarding-sub">Used to calculate your starting estimate. The values shown are starting values—change them to match you.</p>
            <div className="field">
              <label htmlFor="onboarding-height">Height (cm)</label>
              <input
                id="onboarding-height"
                type="number"
                min="1"
                value={profile.heightCm}
                onChange={event => updateDraftProfile(current => ({ ...current, heightCm: Number(event.target.value) }))}
              />
            </div>
            <div className="field">
              <label htmlFor="onboarding-weight">Weight (kg)</label>
              <input
                id="onboarding-weight"
                type="number"
                min="1"
                value={profile.weightKg}
                onChange={event => updateDraftProfile(current => ({ ...current, weightKg: Number(event.target.value) }))}
              />
            </div>
            <div className="field">
              <label htmlFor="onboarding-body-fat">Body fat % <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>(optional)</span></label>
              <input
                id="onboarding-body-fat"
                type="number"
                step="0.1"
                min="0"
                max="60"
                placeholder="e.g. 18"
                value={profile.bodyFatPercentage != null ? profile.bodyFatPercentage * 100 : ''}
                onChange={event => {
                  const value = event.target.value
                  updateDraftProfile(current => ({
                    ...current,
                    bodyFatPercentage: value ? Number(value) / 100 : undefined,
                  }))
                }}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="onboarding-step-content">
            <h1 className="onboarding-title">Activity level</h1>
            <p className="onboarding-sub">How active are you on a typical day?</p>
            <div className="activity-option-list">
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map(level => (
                <button
                  key={level}
                  type="button"
                  className={`activity-option${profile.activityLevel === level ? ' active' : ''}`}
                  aria-pressed={profile.activityLevel === level}
                  onClick={() => updateDraftProfile(current => ({ ...current, activityLevel: level }))}
                >
                  <span className="activity-option-icon">{ACTIVITY_ICONS[level]}</span>
                  <span className="activity-option-label">{ACTIVITY_LABELS[level]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="onboarding-step-content">
            <h1 className="onboarding-title">Choose your pace</h1>
            <p className="onboarding-sub">
              This shapes your Day ring. It never changes your nutrition targets, and you can switch it later.
            </p>
            <div className="activity-option-list commitment-option-list">
              {COMMITMENTS.map(commitment => (
                <button
                  key={commitment.id}
                  type="button"
                  className={`activity-option commitment-option${(profile.loggingCommitment ?? 'light') === commitment.id ? ' active' : ''}`}
                  aria-pressed={(profile.loggingCommitment ?? 'light') === commitment.id}
                  onClick={() => updateDraftProfile(current => ({ ...current, loggingCommitment: commitment.id }))}
                >
                  <span className="activity-option-icon">{commitment.icon}</span>
                  <span className="commitment-option-copy">
                    <strong>{commitment.title}</strong>
                    <small>{commitment.description}</small>
                  </span>
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
              {(Object.keys(GOAL_LABELS) as WeightGoal[]).map(goal => (
                <button
                  key={goal}
                  type="button"
                  className={`onboarding-chip goal-chip${profile.goal === goal ? ' active' : ''}`}
                  aria-pressed={profile.goal === goal}
                  onClick={() => updateDraftProfile(current => ({
                    ...current,
                    goal,
                    goalWeightKg: goal === 'maintain' ? undefined : current.goalWeightKg,
                  }))}
                >
                  {GOAL_LABELS[goal]}
                </button>
              ))}
            </div>
            {profile.goal !== 'maintain' && (
              <>
                <div className="field" style={{ marginTop: 16 }}>
                  <label htmlFor="onboarding-rate">Weekly change (kg)</label>
                  <input
                    id="onboarding-rate"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={maxWeeklyChangeKg(profile)}
                    value={profile.weeklyChangeKg ?? 0.5}
                    onChange={event => updateDraftProfile(current => ({
                      ...current,
                      weeklyChangeKg: Number(event.target.value),
                    }))}
                  />
                  <p className="onboarding-clamp-hint">
                    Up to {maxWeeklyChangeKg(profile)} kg a week, which is 1% of your bodyweight.
                  </p>
                </div>
                <div className="field">
                  <label htmlFor="onboarding-goal-weight">
                    Goal weight (kg) <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    id="onboarding-goal-weight"
                    type="number"
                    step="0.1"
                    min="1"
                    value={profile.goalWeightKg ?? ''}
                    onChange={event => updateDraftProfile(current => ({
                      ...current,
                      goalWeightKg: event.target.value ? Number(event.target.value) : undefined,
                    }))}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {step === 6 && targets && (
          <div className="onboarding-step-content">
            <h1 className="onboarding-title">Your daily targets</h1>
            <p className="onboarding-sub">A calm starting estimate based on the profile you entered.</p>
            {targets.clamped && <p className="onboarding-clamp-note">{targets.clamped}</p>}
            <div className="onboarding-goals-grid">
              <div className="onboarding-goal-card" style={{ gridColumn: '1 / -1' }}>
                <span className="onboarding-goal-label">Calories</span>
                <span className="onboarding-goal-value" style={{ color: 'var(--coral-start)' }}>{targets.calories}</span>
                <span className="onboarding-goal-unit">kcal / day</span>
              </div>
              <div className="onboarding-goal-card">
                <span className="onboarding-goal-label">Protein</span>
                <span className="onboarding-goal-value" style={{ color: 'var(--protein)' }}>{effectiveProtein(profile)}g</span>
              </div>
              <div className="onboarding-goal-card">
                <span className="onboarding-goal-label">Carbs</span>
                <span className="onboarding-goal-value" style={{ color: 'var(--carbs)' }}>{effectiveCarbs(profile)}g</span>
              </div>
              <div className="onboarding-goal-card">
                <span className="onboarding-goal-label">Fat</span>
                <span className="onboarding-goal-value" style={{ color: 'var(--fat)' }}>{effectiveFat(profile)}g</span>
              </div>
            </div>
          </div>
        )}

        {step === FIRST_MEAL_STEP && (
          <div className="onboarding-step-content">
            <h1 className="onboarding-title">Log your first meal</h1>
            <p className="onboarding-sub">Use a real meal or snack. You can edit it later from Home.</p>
            <div className="field">
              <label htmlFor="first-meal-name">Meal name</label>
              <input
                id="first-meal-name"
                value={firstMeal.name}
                onChange={event => updateFirstMeal('name', event.target.value)}
                placeholder="e.g. Greek yogurt and berries"
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="first-meal-calories">Calories</label>
              <input
                id="first-meal-calories"
                type="number"
                min="1"
                value={firstMeal.calories}
                onChange={event => updateFirstMeal('calories', event.target.value)}
                placeholder="e.g. 320"
                inputMode="numeric"
              />
            </div>
            <div className="review-grid">
              {([
                ['protein', 'Protein (g)'],
                ['carbs', 'Carbs (g)'],
                ['fat', 'Fat (g)'],
              ] as const).map(([field, label]) => (
                <div className="field" key={field}>
                  <label htmlFor={`first-meal-${field}`}>{label}</label>
                  <input
                    id={`first-meal-${field}`}
                    type="number"
                    min="0"
                    step="0.1"
                    value={firstMeal[field]}
                    onChange={event => updateFirstMeal(field, event.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="field">
              <span className="onboarding-step-label">Meal type</span>
              <div className="chip-row">
                {(Object.keys(MEAL_LABELS) as MealType[]).map(mealType => (
                  <button
                    key={mealType}
                    type="button"
                    className={`chip${firstMeal.mealType === mealType ? ' active' : ''}`}
                    aria-pressed={firstMeal.mealType === mealType}
                    onClick={() => updateFirstMeal('mealType', mealType)}
                  >
                    {MEAL_LABELS[mealType]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="onboarding-actions">
          {step > 0 && (
            <PressableButton variant="ghost" onClick={back}>
              <IconChevronLeft size={15} strokeWidth={2.4} /> Back
            </PressableButton>
          )}
          <PressableButton
            onClick={step === FIRST_MEAL_STEP ? finishWithFirstMeal : next}
            disabled={step === FIRST_MEAL_STEP && !firstMealReady}
            className="is-full"
          >
            {step === FIRST_MEAL_STEP
              ? 'Log first meal'
              : step === 6
                ? <>Continue to first meal <IconChevronRight size={16} strokeWidth={2.4} /></>
                : <>Continue <IconChevronRight size={16} strokeWidth={2.4} /></>}
          </PressableButton>
        </div>
      </main>
    </div>
  )
}
