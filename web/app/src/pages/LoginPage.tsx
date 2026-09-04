import { useEffect, useRef, useState, type FormEvent } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { isGoogleAuthConfigured } from '../lib/auth'
import { GoogleOriginHelp } from '../components/GoogleOriginHelp'
import { Link, useSearchParams } from 'react-router-dom'
import { isCloudBackend } from '../lib/dataBackend'
import { useAuth } from '../store/AuthContext'
import { track } from '../lib/analytics'
import { PressableButton } from '../components/PressableButton'
import { MomoSticker } from '../components/MomoSticker'
import { useApp } from '../store/AppContext'

type AuthMode = 'signin' | 'signup'

export function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const { state } = useApp()
  const googleConfigured = isGoogleAuthConfigured()
  const [searchParams] = useSearchParams()
  const claiming = searchParams.get('claim') === '1'

  const [mode, setMode] = useState<AuthMode>(() => searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [privateFocus, setPrivateFocus] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const momoVisible = state.gamification.mascotActivity !== 'off'

  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  useEffect(() => track({ name: 'welcome_viewed' }), [])

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setError(null)

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    track({ name: 'auth_method_selected', method: 'email', mode })
    try {
      if (mode === 'signup') {
        await signUpWithEmail(name, email, password)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next: AuthMode) {
    setMode(next)
    setError(null)
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setPrivateFocus(false)
  }

  return (
    <main className="login-page auth-refresh">
      <div className="login-card login-card-wide">
        <div className="auth-brand-row">
          <Link to="/onboarding" className="welcome-brand" aria-label="Fud AI welcome">Fud AI<span aria-hidden="true">.</span></Link>
          <span className="auth-brand-note">Your food buddy</span>
        </div>
        {momoVisible && <div className="auth-momo-greeting">
          <MomoSticker mood={privateFocus ? 'sleepy' : loading || error ? 'curious' : 'excited'} pose={loading ? 'ponder' : 'still'} />
          {!state.profile.mascotMuted && <p>{privateFocus
            ? 'Eyes closed. Your password is your business.'
            : loading ? 'One moment. Getting your journal…'
              : error ? 'Let’s give that another try.'
                : mode === 'signin' ? 'Hey, you! Ready when you are.' : 'Hi! I’m Momo. Let’s get to know you.'}</p>}
        </div>}
        <h1 className="login-title">{mode === 'signin' ? 'Welcome back!' : 'Meet your food buddy.'}</h1>
        <p className="login-sub">
          {mode === 'signin'
            ? claiming ? 'Sign in to connect the progress on this device.' : 'Your journal is right where you left it.'
            : claiming ? 'Continue to save the progress you just made.' : 'Create your account to keep your food journal.'}
        </p>

        <div className="auth-tabs" role="group" aria-label="Account access">
          <button
            type="button"
            className={`auth-tab${mode === 'signin' ? ' active' : ''}`}
            aria-pressed={mode === 'signin'}
            disabled={loading}
            onClick={() => switchMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-tab${mode === 'signup' ? ' active' : ''}`}
            aria-pressed={mode === 'signup'}
            disabled={loading}
            onClick={() => switchMode('signup')}
          >
            Sign up
          </button>
        </div>

        {error && <div className="error-banner" role="alert" ref={errorRef} tabIndex={-1}>{error}</div>}

        <form className="auth-form" onSubmit={handleEmailSubmit} aria-busy={loading}
          onFocusCapture={event => setPrivateFocus(event.target instanceof HTMLInputElement && ['password', 'confirm'].includes(event.target.id))}
          onBlurCapture={() => setPrivateFocus(false)}>
          <fieldset disabled={loading} className="auth-fields">
            <legend className="sr-only">{mode === 'signin' ? 'Sign in with email' : 'Create an email account'}</legend>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={mode === 'signup' ? 8 : undefined}
              aria-describedby={mode === 'signup' ? 'auth-password-hint' : undefined}
            />
            <div className="auth-password-tools">
              {mode === 'signup' && <span id="auth-password-hint">At least 8 characters</span>}
              <button type="button" className="auth-show-password" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
            </div>
          </div>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                required
              />
            </div>
          )}
          <PressableButton type="submit" fullWidth disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : claiming ? 'Continue' : 'Create account'}
          </PressableButton>
          </fieldset>
          {mode === 'signin' && isCloudBackend() && (
            <p className="login-hint">
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
          )}
        </form>

        {googleConfigured && (
          <>
            <div className="auth-divider">
              <span>or</span>
            </div>
            <div className="login-google">
              <GoogleLogin
                onSuccess={async cred => {
                  try {
                    track({ name: 'auth_method_selected', method: 'google', mode })
                    await signInWithGoogle(cred)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Google sign-in failed')
                  }
                }}
                onError={() => setError(
                  `Google blocked this origin (${window.location.origin}). Expand "Google sign-in blocked?" below and add it in Google Cloud Console.`,
                )}
                theme="outline"
                size="large"
                shape="rectangular"
                text={mode === 'signup' ? 'signup_with' : 'signin_with'}
              />
            </div>
            <GoogleOriginHelp />
          </>
        )}

        {!googleConfigured && import.meta.env.DEV && (
          <p className="login-hint">
            Google sign-in is optional. Add <code>VITE_GOOGLE_CLIENT_ID</code> to <code>.env.local</code> to enable it.
          </p>
        )}

        <p className="login-foot">
          Your journal. Your pace. No food guilt.
        </p>
        {!claiming && (
          <p className="login-hint">
            <Link to="/onboarding">Try Fud AI first</Link>
          </p>
        )}
      </div>
    </main>
  )
}
