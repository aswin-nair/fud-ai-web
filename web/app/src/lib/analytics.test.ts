import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearAnalytics,
  finishLogFlow,
  recentEvents,
  selectLogMethod,
  startLogFlow,
} from './analytics'

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: key => { values.delete(key) },
    setItem: (key, value) => { values.set(key, value) },
  }
}

describe('analytics funnel', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
    vi.stubGlobal('location', { pathname: '/log/manual' })
    clearAnalytics()
  })

  it('records an entry save exactly once with allowlisted metadata', () => {
    startLogFlow('search', true)
    selectLogMethod('manual')

    const save = {
      entryId: 'entry-1',
      source: 'manual',
      mealSlot: 'lunch',
      firstLog: true,
    }
    finishLogFlow(save)
    finishLogFlow(save)

    const saved = recentEvents().filter(row => row.event.name === 'entry_saved')
    expect(saved).toHaveLength(1)
    expect(saved[0]?.event).toMatchObject({
      name: 'entry_saved',
      method: 'manual',
      meal_slot: 'lunch',
      first_log: true,
    })
    expect(JSON.stringify(saved[0])).not.toMatch(/food|photo|api.?key|birth|weight/i)
  })
})
