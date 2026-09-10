import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function browserFixture(saved: string | null = null, dark = false) {
  const storage = new Map<string, string>()
  if (saved !== null) storage.set('fud-appearance-v1', saved)
  const windowEvents = new EventTarget()
  const mediaEvents = new EventTarget()
  const media = {
    matches: dark,
    addEventListener: vi.fn(mediaEvents.addEventListener.bind(mediaEvents)),
  }
  const root = { dataset: {} as Record<string, string>, style: { colorScheme: '' } }
  const meta = { setAttribute: vi.fn() }
  const localStorage = {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { storage.set(key, value) }),
  }
  const browser = {
    localStorage,
    matchMedia: vi.fn(() => media),
    addEventListener: vi.fn(windowEvents.addEventListener.bind(windowEvents)),
  }
  vi.stubGlobal('window', browser)
  vi.stubGlobal('document', { documentElement: root, querySelector: () => meta })
  return {
    root,
    meta,
    browser,
    localStorage,
    systemChanges(next: boolean) {
      media.matches = next
      mediaEvents.dispatchEvent(new Event('change'))
    },
    otherTabChanges(value: string | null, key: string | null = 'fud-appearance-v1', area = localStorage) {
      const event = new Event('storage')
      Object.assign(event, { key, newValue: value, storageArea: area })
      windowEvents.dispatchEvent(event)
    },
  }
}

beforeEach(() => { vi.resetModules() })
afterEach(() => { vi.unstubAllGlobals() })

describe('device appearance preference', () => {
  it('defaults to the system appearance and follows live OS changes', async () => {
    const fixture = browserFixture(null, true)
    const appearance = await import('./appearance')
    appearance.initializeAppearance()
    expect(appearance.getAppearancePreference()).toBe('system')
    expect(fixture.root.dataset.theme).toBe('dark')
    expect(fixture.root.style.colorScheme).toBe('dark')
    expect(fixture.meta.setAttribute).toHaveBeenLastCalledWith('content', '#121416')

    fixture.systemChanges(false)
    expect(fixture.root.dataset.theme).toBe('light')
    expect(fixture.meta.setAttribute).toHaveBeenLastCalledWith('content', '#F5F9FC')
    expect(fixture.localStorage.setItem).not.toHaveBeenCalled()
  })

  it('restores an explicit choice and ignores OS changes until System is selected', async () => {
    const fixture = browserFixture('light', true)
    const appearance = await import('./appearance')
    appearance.initializeAppearance()
    expect(appearance.getAppearancePreference()).toBe('light')
    expect(fixture.root.dataset.theme).toBe('light')
    fixture.systemChanges(false)
    fixture.systemChanges(true)
    expect(fixture.root.dataset.theme).toBe('light')

    appearance.setAppearancePreference('system')
    expect(fixture.root.dataset.theme).toBe('dark')
    expect(fixture.localStorage.setItem).toHaveBeenLastCalledWith('fud-appearance-v1', 'system')
  })

  it('updates subscribers and other tabs, including when the preference is cleared', async () => {
    const fixture = browserFixture('light', false)
    const appearance = await import('./appearance')
    const listener = vi.fn()
    const unsubscribe = appearance.subscribeAppearance(listener)
    fixture.otherTabChanges('dark')
    expect(appearance.getAppearancePreference()).toBe('dark')
    expect(fixture.root.dataset.theme).toBe('dark')
    expect(listener).toHaveBeenCalledTimes(1)

    fixture.otherTabChanges(null, null)
    expect(appearance.getAppearancePreference()).toBe('system')
    expect(fixture.root.dataset.theme).toBe('light')
    unsubscribe()
    appearance.setAppearancePreference('dark')
    expect(listener).toHaveBeenCalledTimes(2)
    expect(fixture.localStorage.setItem).toHaveBeenLastCalledWith('fud-appearance-v1', 'dark')
  })

  it('ignores unrelated and session storage events', async () => {
    const fixture = browserFixture('light', false)
    const appearance = await import('./appearance')
    appearance.initializeAppearance()
    fixture.otherTabChanges('dark', 'other-key')
    fixture.otherTabChanges('dark', 'fud-appearance-v1', { getItem: vi.fn(), setItem: vi.fn() })
    expect(appearance.getAppearancePreference()).toBe('light')
    expect(fixture.root.dataset.theme).toBe('light')
  })

  it('falls back to system for an invalid preference and initializes only once', async () => {
    const fixture = browserFixture('invalid', true)
    const appearance = await import('./appearance')
    appearance.initializeAppearance()
    appearance.initializeAppearance()
    expect(appearance.getAppearancePreference()).toBe('system')
    expect(fixture.root.dataset.theme).toBe('dark')
    expect(fixture.browser.addEventListener).toHaveBeenCalledTimes(1)
  })

  it('remains usable when storage cannot be read or written', async () => {
    const fixture = browserFixture(null, false)
    Object.defineProperty(fixture.browser, 'localStorage', { get() { throw new Error('Storage blocked') } })
    const appearance = await import('./appearance')
    expect(() => appearance.initializeAppearance()).not.toThrow()
    expect(fixture.root.dataset.theme).toBe('light')
    expect(() => appearance.setAppearancePreference('dark')).not.toThrow()
    expect(fixture.root.dataset.theme).toBe('dark')
    expect(appearance.getAppearancePreference()).toBe('dark')
  })
})
