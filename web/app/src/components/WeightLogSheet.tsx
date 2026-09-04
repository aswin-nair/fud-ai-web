import { useRef, useState } from 'react'
import { useDialogFocus } from '../hooks/useDialogFocus'
import { PressableButton } from './PressableButton'

export function WeightLogSheet({ initialWeight, onSave, onClose }: {
  initialWeight: number
  onSave: (weight: number) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [weight, setWeight] = useState(String(initialWeight || ''))
  const [error, setError] = useState('')
  useDialogFocus(ref, onClose)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={ref} className="modal-sheet weight-log-sheet" role="dialog" aria-modal="true" aria-labelledby="weight-log-title" onClick={event => event.stopPropagation()}>
        <h2 id="weight-log-title">Log weight</h2>
        <p id="weight-log-hint">Save a weight entry for today. Logging weight is optional.</p>
        <form noValidate onSubmit={event => {
          event.preventDefault()
          const value = Number(weight)
          if (!Number.isFinite(value) || value <= 0) {
            setError('Enter a weight greater than zero.')
            return
          }
          onSave(value)
        }}>
          <div className="field">
            <label htmlFor="log-weight">Weight (kg)</label>
            <input id="log-weight" type="number" inputMode="decimal" min="0.1" step="0.1" required value={weight}
              aria-describedby={error ? 'weight-log-hint weight-log-error' : 'weight-log-hint'} aria-invalid={Boolean(error)}
              onChange={event => { setWeight(event.target.value); setError('') }} />
          </div>
          {error && <p id="weight-log-error" className="error-banner" role="alert">{error}</p>}
          <PressableButton fullWidth label="Save" type="submit" />
          <PressableButton fullWidth variant="ghost" label="Cancel" onClick={onClose} />
        </form>
      </div>
    </div>
  )
}
