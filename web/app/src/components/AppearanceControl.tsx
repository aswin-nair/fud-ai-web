import { useId, useSyncExternalStore } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { getAppearancePreference, setAppearancePreference, subscribeAppearance } from '../lib/appearance'

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
] as const

export function AppearanceControl({ compact = false }: { compact?: boolean }) {
  const id = useId()
  const preference = useSyncExternalStore(subscribeAppearance, getAppearancePreference, () => 'system')

  return (
    <fieldset className={`appearance-control${compact ? ' appearance-control-compact' : ''}`}>
      <legend className={compact ? 'sr-only' : 'appearance-legend'}>Appearance</legend>
      <div className="appearance-options">
        {OPTIONS.map(({ value, label, Icon }) => (
          <label key={value} className="appearance-option" title={compact ? `${label} appearance` : undefined}>
            <input
              type="radio"
              name={`appearance-${id}`}
              value={value}
              checked={preference === value}
              onChange={() => setAppearancePreference(value)}
            />
            <span className="appearance-option-face">
              <Icon size={19} aria-hidden="true" />
              <span className={compact ? 'sr-only' : undefined}>{label}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
