import { useEffect, useRef, useState } from 'react'
import type { MealSlot } from '@fud-ai/domain/meals'
import { MEAL_LABELS } from '../types'
import type { PathStatus } from '../lib/mealPath'
import { useHaptic } from '../hooks/useHaptic'
import { motion } from '../lib/tokens'

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
  const vibrate = useHaptic()
  const prevStatus = useRef(status)
  const [popping, setPopping] = useState(false)

  useEffect(() => {
    if (prevStatus.current !== 'done' && status === 'done') {
      setPopping(true)
      const timer = window.setTimeout(() => setPopping(false), motion.celebrate / 2)
      prevStatus.current = status
      return () => window.clearTimeout(timer)
    }
    prevStatus.current = status
  }, [status])

  return (
    <button
      type="button"
      className={`path-node clay-node is-${status}${mascot ? ' has-mascot' : ''}${popping ? ' is-popping' : ''}`}
      aria-current={status === 'current' ? 'step' : undefined}
      aria-label={`${MEAL_LABELS[slot]}, ${status}`}
      onPointerDown={() => vibrate(10)}
      onClick={() => onSelect?.(slot)}
    >
      <span className="path-node-face" aria-hidden>
        {status === 'done' ? '✓' : SLOT_ICON[slot]}
      </span>
      <span className="path-node-label">{MEAL_LABELS[slot]}</span>
    </button>
  )
}
