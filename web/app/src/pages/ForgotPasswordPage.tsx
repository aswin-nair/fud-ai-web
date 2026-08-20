import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import logo from '@assets/calorie logo transparent.png'
import { apiForgotPassword } from '../lib/apiClient'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await apiForgotPassword(email)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={logo} alt="Fud AI" className="login-logo" />
        <h1 className="login-title">Forgot password</h1>
        <p className="login-sub">
          {submitted
            ? 'If an account exists for that address, reset instructions are on the way.'
            : 'Enter the email you use to sign in. We will send a reset link if an account exists.'}
        </p>
        {error && <div className="error-banner">{error}</div>}
        {!submitted && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Please wait…' : 'Send reset link'}
            </button>
          </form>
        )}
        <p className="login-foot">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
