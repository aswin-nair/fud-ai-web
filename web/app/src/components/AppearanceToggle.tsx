import { useSyncExternalStore } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { getAppearancePreference, setAppearancePreference, subscribeAppearance } from '../lib/appearance'

const ORDER = ['system', 'light', 'dark'] as const
const LABELS = { system: 'System', light: 'Light', dark: 'Dark' } as const
const ICONS = { system: Monitor, light: Sun, dark: Moon } as const

/** One compact button that steps through system, light and dark appearance. */
export function AppearanceToggle({ className = '' }: { className?: string }) {
  const preference = useSyncExternalStore(subscribeAppearance, getAppearancePreference, () => 'system' as const)
  const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length]
  const Icon = ICONS[preference]
  return (
    <button
      type="button"
      className={`appearance-toggle ${className}`.trim()}
      onClick={() => setAppearancePreference(next)}
      aria-label={`Appearance: ${LABELS[preference]}. Switch to ${LABELS[next].toLowerCase()}.`}
      title={`Appearance: ${LABELS[preference]}`}
    >
      <Icon size={19} aria-hidden="true" />
    </button>
  )
}
