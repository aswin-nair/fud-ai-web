import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { freshState } from '../lib/storage'
import { LoginPage } from './LoginPage'

let state = freshState()
vi.mock('../store/AppContext', () => ({ useApp: () => ({ state }) }))
vi.mock('../store/AuthContext', () => ({ useAuth: () => ({ signInWithGoogle: vi.fn(), signInWithEmail: vi.fn(), signUpWithEmail: vi.fn() }) }))
vi.mock('../lib/auth', () => ({ isGoogleAuthConfigured: () => false }))
vi.mock('../lib/dataBackend', () => ({ isCloudBackend: () => true }))
const render = (url = '/login') => renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [url] }, createElement(LoginPage)))
beforeEach(() => { state = freshState() })

describe('character-led login', () => {
  it('keeps sign-in focused, named, and password-masked initially', () => {
    const html = render()
    expect(html).toContain('<main class="login-page auth-refresh">')
    expect(html).toContain('Welcome back!')
    expect(html).toContain('role="group" aria-label="Account access"')
    expect(html).toContain('<fieldset class="auth-fields">')
    expect(html).toContain('autoComplete="current-password"')
    expect(html).toContain('type="password"')
    expect(html).toContain('aria-pressed="false">Show password')
    expect(html).toContain('href="/forgot-password"')
    expect(html).toContain('aria-busy="false"')
  })

  it('shows signup-specific requirements and retains the claim explanation', () => {
    const html = render('/login?mode=signup&claim=1')
    expect(html).toContain('Meet your food buddy.')
    expect(html).toContain('Continue to save the progress you just made.')
    expect(html).toContain('aria-describedby="auth-password-hint"')
    expect(html).toContain('minLength="8"')
    expect(html).toContain('autoComplete="new-password"')
    expect(html).toContain('for="confirm"')
  })

  it('honours hidden and muted mascot preferences', () => {
    expect(render()).toContain('data-expression="happy"')
    state.profile.mascotMuted = true
    expect(render()).not.toContain('Hey, you! Ready when you are.')
    expect(render()).toContain('data-expression="happy"')
    state.gamification.mascotActivity = 'off'
    expect(render()).not.toContain('auth-momo-greeting')
  })
})
