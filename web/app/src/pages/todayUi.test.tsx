import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { freshState } from '../lib/storage'
import { HomePage } from './HomePage'

let state = freshState()
vi.mock('../store/AppContext', () => ({ useApp: () => ({
  state, ackLevelUp: vi.fn(), patchGamification: vi.fn(), deleteEntry: vi.fn(),
  restoreEntry: vi.fn(), refresh: vi.fn(),
}) }))
vi.mock('../store/AuthContext', () => ({ useAuth: () => ({ user: { sub: 'test' } }) }))
vi.mock('../mascot/MascotOverlay', () => ({ mascotEvent: vi.fn() }))
vi.mock('../mascot/anchors', () => ({ useAnchor: () => () => {} }))

const render = (guest = false) => renderToStaticMarkup(<MemoryRouter><HomePage guest={guest} /></MemoryRouter>)
beforeEach(() => { state = freshState() })

describe('Today dashboard', () => {
  it('only offers the direct roast action after consent', () => {
    expect(render()).not.toContain('Roast me')
    state.profile.mascotRoasts = true
    expect(render()).toContain('Roast me')
    state.profile.trackingPaused = true
    expect(render()).not.toContain('Roast me')
  })
  it('shows the useful surface immediately, without an artificial loading delay', () => {
    const html = render()
    expect(html).toContain('Today’s snapshot')
    expect(html).toContain('kcal logged')
    expect(html).toContain('Your table is ready')
    expect(html).toContain('href="/log/photo"')
    expect(html).toContain('href="/log/saved"')
    expect(html).toContain('aria-label="Choose date"')
    expect(html.indexOf('home-log-cta')).toBeLessThan(html.indexOf('Your meals'))
    expect(html.indexOf('Your meals')).toBeLessThan(html.indexOf('Logging milestones'))
    expect(html).toContain('lucide-flame')
    expect(html).not.toContain('🔥')
  })
  it('renders actual nutrition and neutral meal icons', () => {
    state.foodEntries = [{ id: 'oats', name: 'Oats', calories: 250, protein: 8, carbs: 40,
      fat: 5, timestamp: new Date().toISOString(), source: 'manual', mealType: 'breakfast' }]
    const html = render()
    expect(html).toContain('250 kcal')
    expect(html).toContain('Oats')
    expect(html).toContain('lucide-utensils')
    expect(html).toContain('You showed up.')
    expect(html).toContain('1 logged day')
  })
  it('hides nutrition and milestones during tracking pause', () => {
    state.profile.trackingPaused = true
    const html = render()
    expect(html).toContain('Tracking is paused')
    expect(html).toContain('Manage pause')
    expect(html).not.toContain('kcal logged')
    expect(html).not.toContain('Logging milestones')
  })
  it('respects mute and hide-Momo preferences', () => {
    state.profile.mascotMuted = true
    expect(render()).not.toContain('Momo’s little reminder')
    state.profile.mascotMuted = false
    state.gamification.mascotActivity = 'off'
    expect(render()).not.toContain('Momo’s little reminder')
  })
  it('keeps the guest account-claim path without normal log shortcuts', () => {
    const html = render(true)
    expect(html).toContain('Save your progress')
    expect(html).not.toContain('href="/log/photo"')
    expect(html).not.toContain('aria-label="Main"')
  })
})
