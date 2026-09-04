import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { freshState } from '../lib/storage'
import { createOnboardingDraft } from '../lib/onboarding'
import { OnboardingPage } from './OnboardingPage'

vi.mock('@assets/welcome-1.webp', () => ({ default: '/welcome-1.webp' }))
vi.mock('@assets/welcome-2.webp', () => ({ default: '/welcome-2.webp' }))
vi.mock('@assets/welcome-3.webp', () => ({ default: '/welcome-3.webp' }))
vi.mock('../store/AppContext', () => ({
  useApp: () => ({ state, updateProfile: vi.fn(), setOnboarded: vi.fn(), addEntry: vi.fn() }),
}))
vi.mock('../store/AuthContext', () => ({ useAuth: () => ({ user: { sub: 'welcome-test' } }) }))
vi.mock('../lib/onboarding', async importOriginal => ({
  ...await importOriginal<typeof import('../lib/onboarding')>(),
  loadOnboardingDraft: () => draft,
}))

const state = freshState()
let draft = createOnboardingDraft(state.profile)
const render = () => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(OnboardingPage)))

beforeEach(() => { draft = createOnboardingDraft(state.profile) })

describe('welcome page UX', () => {
  it('offers one primary start action and a returning-user route', () => {
    const html = render()
    expect(html).toContain('<main class="welcome-shell welcome-refresh"')
    expect(html).toContain('Food tracking, at your pace.')
    expect(html.match(/>Get started</g)).toHaveLength(1)
    expect(html).toContain('href="/login"')
    expect(html).toContain('<strong>Sign in</strong>')
    expect(html).not.toContain('onboarding-birthday')
  })

  it.each([0, 1, 2])('keeps the intro optional on slide %i', index => {
    draft.welcomeIndex = index
    const html = render()
    expect(html).toContain('>Get started<')
    expect(html).toContain('Intro slides are optional')
    expect(html).toContain(`aria-label="Go to slide ${index + 1}:`)
    expect(html.match(/aria-current="step"/g)).toHaveLength(1)
    expect(html).toContain('aria-live="polite" aria-atomic="true"')
    expect(html).toContain(`aria-label="Previous introduction"${index === 0 ? ' disabled=""' : ''}`)
    expect(html).toContain(`aria-label="Next introduction"${index === 2 ? ' disabled=""' : ''}`)
  })

  it('still requires age confirmation after leaving the introduction', () => {
    draft.welcomeIndex = 3
    const html = render()
    expect(html).toContain('What is your date of birth?')
    expect(html).toContain('id="onboarding-birthday"')
    expect(html).not.toContain('welcome-refresh')
    expect(html).toContain('Step 1 of 8: Age')
  })
})
