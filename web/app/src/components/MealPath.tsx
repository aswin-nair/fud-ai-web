import type { MealSlot } from '@fud-ai/domain/meals'
import { Mascot, type MascotState } from './Mascot'
import { PathNode } from './PathNode'
import { mascotSlot, mealPathStates } from '../lib/mealPath'
import type { FoodEntry } from '../types'

/** Artboard path, in a 384×232 viewBox. Positions stay percentage-based. */
const PATH = 'M60 34 C 150 34, 150 92, 240 92 S 330 150, 240 150 S 100 208, 190 208'
const NODE_AT: Record<MealSlot, { left: string; top: string }> = {
  breakfast: { left: '15.6%', top: '14.7%' },
  lunch: { left: '62.5%', top: '39.7%' },
  dinner: { left: '62.5%', top: '64.7%' },
  snack: { left: '49.5%', top: '89.7%' },
}

export function MealPath({
  entries,
  hour,
  paused = false,
  mascotState = 'idle',
  onSelectSlot,
}: {
  entries: readonly FoodEntry[]
  hour?: number
  paused?: boolean
  mascotState?: MascotState
  onSelectSlot?: (slot: MealSlot) => void
}) {
  const nodes = mealPathStates(entries, hour)
  const standOn = mascotSlot(nodes)
  const doneCount = nodes.filter(node => node.status === 'done').length
  const progress = doneCount / nodes.length

  return (
    <div className={`meal-path${paused ? ' is-paused' : ''}`} aria-label="Today's meal path">
      <svg className="meal-path-svg" viewBox="0 0 384 232" aria-hidden>
        <path d={PATH} fill="none" stroke="var(--paper-deep)" strokeWidth="10" strokeLinecap="round" />
        <path
          d={PATH}
          fill="none"
          stroke="var(--coral)"
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
        />
      </svg>
      {nodes.map(node => (
        <div
          key={node.slot}
          className="meal-path-slot"
          style={NODE_AT[node.slot]}
        >
          {standOn === node.slot && (
            <span className="meal-path-mascot">
              <Mascot state={mascotState} size={44} />
            </span>
          )}
          <PathNode
            slot={node.slot}
            status={node.status}
            mascot={standOn === node.slot}
            onSelect={onSelectSlot}
          />
        </div>
      ))}
    </div>
  )
}
