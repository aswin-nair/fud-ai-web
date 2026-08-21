import type { MealSlot } from '@fud-ai/domain/meals'
import { MEAL_LABELS } from '../types'
import type { PathStatus } from '../lib/mealPath'

const SLOT_ICON: Record<MealSlot, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🍲',
  snack: '🍎',
}

export function PathNode({
  slot,
  status,
  mascot,
  onSelect,
}: {
  slot: MealSlot
  status: PathStatus
  mascot?: boolean
  onSelect?: (slot: MealSlot) => void
}) {
  return (
    <button
      type="button"
      className={`path-node is-${status}${mascot ? ' has-mascot' : ''}`}
      aria-current={status === 'current' ? 'step' : undefined}
      aria-label={`${MEAL_LABELS[slot]}, ${status}`}
      onClick={() => onSelect?.(slot)}
    >
      <span className="path-node-face" aria-hidden>
        {status === 'done' ? '✓' : SLOT_ICON[slot]}
      </span>
      <span className="path-node-label">{MEAL_LABELS[slot]}</span>
    </button>
  )
}
