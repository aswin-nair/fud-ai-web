import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import logo from '@assets/calorie logo transparent.png'
import { apiResetPassword } from '../lib/apiClient'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await apiResetPassword(token, password)
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={logo} alt="Fud AI" className="login-logo" />
        <h1 className="login-title">Choose a new password</h1>
        <p className="login-sub">This link works once and expires in 30 minutes.</p>
        {error && <div className="error-banner" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading || !token}>
            {loading ? 'Please wait…' : 'Update password'}
          </button>
        </form>
        <p className="login-foot">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
