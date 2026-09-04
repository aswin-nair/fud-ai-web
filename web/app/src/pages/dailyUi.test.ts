import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { freshState } from '../lib/storage'
import type { LogDraftEnvelope } from '../lib/logDrafts'
import { LogMenuPage } from './LogMenuPage'
import { ManualEntryPage } from './ManualEntryPage'

let state = freshState()
let drafts: LogDraftEnvelope = { version: 1 }

vi.mock('../store/AppContext', () => ({ useApp: () => ({ state, addEntry: vi.fn() }) }))
vi.mock('../store/AuthContext', () => ({ useAuth: () => ({ user: { sub: 'ui-test' } }) }))
vi.mock('../mascot/MascotOverlay', () => ({ mascotEvent: vi.fn() }))
vi.mock('../lib/logDrafts', () => ({
  loadLogDrafts: () => drafts,
  hydrateLogDrafts: async () => drafts,
  saveManualLogDraft: vi.fn(),
  clearLogDraft: vi.fn(),
}))

beforeEach(() => {
  state = freshState()
  drafts = { version: 1 }
})

describe('daily UI contracts', () => {
  it('offers all entry methods without opening the keyboard on arrival', () => {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(LogMenuPage)))
    for (const route of ['text', 'photo', 'saved', 'manual']) {
      expect(html).toContain(`href="/log/${route}"`)
    }
    expect(html.indexOf('Ways to log a meal')).toBeLessThan(html.indexOf('log-meal-search'))
    expect(html).toContain('for="log-meal-search"')
    expect(html).toContain('aria-describedby="log-search-hint"')
    expect(html.toLowerCase()).not.toContain('autofocus')
    expect(html).toContain('Review an AI estimate')
  })

  it('gives recent and Saved meals a separate, named portion button', () => {
    state.foodEntries = [{ id: 'recent', name: 'Oats', calories: 250, protein: 8, carbs: 40,
      fat: 5, timestamp: new Date().toISOString(), source: 'manual', mealType: 'breakfast' }]
    state.favoriteMeals = [{ id: 'saved', name: 'Rice', calories: 200, protein: 4, carbs: 44, fat: 1, mealType: 'lunch' }]
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(LogMenuPage)))
    expect(html).toContain('aria-label="Adjust portion for Oats">Portion</button>')
    expect(html).toContain('aria-label="Adjust portion for Rice">Portion</button>')
    expect(html).not.toMatch(/<button\b[^>]*>(?:(?!<\/button>)[\s\S])*<button\b/)
    expect(html.indexOf('Ways to log a meal')).toBeLessThan(html.indexOf('Log again'))
  })

  it('shows a serving-scaled review before the native submit action', () => {
    drafts.manual = { name: 'Oats', calories: '250', protein: '8', carbs: '40', fat: '5',
      servings: 1.5, mealType: 'breakfast', updatedAt: new Date().toISOString() }
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ManualEntryPage)))
    expect(html).toContain('<form class="manual-entry-form"')
    expect(html).toContain('aria-label="Meal total"')
    expect(html).toContain('375 kcal')
    expect(html).toContain('1.5 servings · Breakfast')
    expect(html).toContain('Protein 12g · Carbs 60g · Fat 7.5g')
    expect(html).toContain('<button type="submit"')
    expect(html.indexOf('Meal total')).toBeLessThan(html.indexOf('type="submit"'))
    expect(html).toContain('aria-labelledby="manual-meal-type"')
  })

  it('does not show a misleading zero-calorie total for an empty form', () => {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ManualEntryPage)))
    expect(html).not.toContain('aria-label="Meal total"')
    expect(html).toContain('<button type="submit" disabled=""')
  })

  it('makes the recent-meal template explicit and offers a fresh start', () => {
    state.foodEntries = [{ id: 'recent', name: 'Oats', calories: 250, protein: 8, carbs: 40,
      fat: 5, timestamp: new Date().toISOString(), source: 'manual', mealType: 'breakfast' }]
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ManualEntryPage)))
    expect(html).toContain('Started from “Oats”')
    expect(html).toContain('>Start fresh</button>')
    expect(html).toContain('250 kcal')
  })
})
