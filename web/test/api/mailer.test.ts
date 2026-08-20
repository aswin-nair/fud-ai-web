import { afterEach, describe, expect, it, vi } from 'vitest'

import { applicationOrigin, isMailerConfigured, passwordResetUrl } from '../../api/_lib/mailer.js'

describe('password reset mailer', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('accepts only a fixed HTTPS origin or localhost', () => {
    vi.stubEnv('APP_ORIGIN', 'https://fud.example')
    expect(applicationOrigin()).toBe('https://fud.example')
    vi.stubEnv('APP_ORIGIN', 'http://localhost:5173')
    expect(applicationOrigin()).toBe('http://localhost:5173')
    vi.stubEnv('APP_ORIGIN', 'http://evil.example')
    expect(applicationOrigin()).toBeNull()
  })

  it('stays unconfigured without provider credentials', () => {
    vi.stubEnv('APP_ORIGIN', 'https://fud.example')
    vi.stubEnv('MAIL_FROM', 'Fud AI <reset@fud.example>')
    expect(isMailerConfigured()).toBe(false)
    vi.stubEnv('RESEND_API_KEY', 're_test')
    expect(isMailerConfigured()).toBe(true)
    expect(passwordResetUrl('tok')).toContain('/app/reset-password?token=tok')
  })
})
