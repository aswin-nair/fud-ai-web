import { useState, type FormEvent } from 'react'
import logo from '@assets/calorie logo transparent.png'
import { GoogleLogin } from '@react-oauth/google'
import { isGoogleAuthConfigured } from '../lib/auth'
import { GoogleOriginHelp } from '../components/GoogleOriginHelp'
import { useAuth } from '../store/AuthContext'

type AuthMode = 'signin' | 'signup'

export function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const googleConfigured = isGoogleAuthConfigured()

  const [mode, setMode] = useState<AuthMode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
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
  }

  return (
    <div className="login-page">
      <div className="login-card login-card-wide">
        <img src={logo} alt="Fud AI" className="login-logo" />
        <h1 className="login-title">Fud AI</h1>
        <p className="login-sub">
          {mode === 'signin'
            ? 'Sign in to your calorie tracker'
            : 'Create your free account'}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab${mode === 'signin' ? ' active' : ''}`}
            onClick={() => switchMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-tab${mode === 'signup' ? ' active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Sign up
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form className="auth-form" onSubmit={handleEmailSubmit}>
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
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={mode === 'signup' ? 8 : undefined}
            />
          </div>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                required
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
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

        {!googleConfigured && (
          <p className="login-hint">
            Google sign-in is optional. Add <code>VITE_GOOGLE_CLIENT_ID</code> to <code>.env.local</code> to enable it.
          </p>
        )}

        <p className="login-foot">
          Local-first · BYOK AI · Privacy-first
        </p>
      </div>
    </div>
  )
}
