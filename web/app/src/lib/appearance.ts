export type AppearancePreference = 'light' | 'dark' | 'system'
export type ResolvedAppearance = Exclude<AppearancePreference, 'system'>

export const APPEARANCE_STORAGE_KEY = 'fud-appearance-v1'
const SYSTEM_QUERY = '(prefers-color-scheme: dark)'
const THEME_COLORS = { light: '#F5F9FC', dark: '#111C25' }

let preference: AppearancePreference = 'system'
let mediaQuery: MediaQueryList | undefined
let initialized = false
const subscribers = new Set<() => void>()

function parsePreference(value: string | null): AppearancePreference {
  return value === 'light' || value === 'dark' ? value : 'system'
}

function applyAppearance() {
  if (typeof document === 'undefined') return
  const theme: ResolvedAppearance = preference === 'system'
    ? mediaQuery?.matches ? 'dark' : 'light'
    : preference
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
}

function publish() {
  applyAppearance()
  subscribers.forEach(subscriber => subscriber())
}

/** Device-only preference: it never enters the profile, backups, or cloud sync. */
export function initializeAppearance() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  try {
    preference = parsePreference(window.localStorage.getItem(APPEARANCE_STORAGE_KEY))
  } catch {
    // Private browsing may block storage; the current tab still supports themes.
    preference = 'system'
  }
  mediaQuery = typeof window.matchMedia === 'function' ? window.matchMedia(SYSTEM_QUERY) : undefined
  const onSystemChange = () => {
    if (preference === 'system') applyAppearance()
  }
  if (mediaQuery?.addEventListener) mediaQuery.addEventListener('change', onSystemChange)
  else mediaQuery?.addListener(onSystemChange)

  window.addEventListener('storage', event => {
    if (event.key !== APPEARANCE_STORAGE_KEY && event.key !== null) return
    // Storage events can also originate from sessionStorage in an iframe.
    try {
      if (event.storageArea && event.storageArea !== window.localStorage) return
    } catch { /* A blocked storage getter must not prevent a theme update. */ }
    preference = parsePreference(event.newValue)
    publish()
  })
  applyAppearance()
}

export function getAppearancePreference(): AppearancePreference {
  return preference
}

export function setAppearancePreference(next: AppearancePreference) {
  initializeAppearance()
  preference = next
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, next)
  } catch { /* Keep the selection for this tab when storage is unavailable. */ }
  publish()
}

export function subscribeAppearance(subscriber: () => void) {
  initializeAppearance()
  subscribers.add(subscriber)
  return () => { subscribers.delete(subscriber) }
}
