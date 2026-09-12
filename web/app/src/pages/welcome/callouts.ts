import type { MealItem } from './meals'

/**
 * The hero drawing: the 400 × 400 plate sits in a 760 × 520 stage with a label gutter on each side.
 * Foods on the left half of the plate are labelled on the left, the rest on the right.
 */
export const STAGE = { width: 760, height: 520, plateX: 180, plateY: 60, plateSize: 400 } as const

const LABEL_X = { left: 164, right: 596 } as const
/** Leaders bend just outside the plate rim, then run level into their label. */
const ELBOW_OFFSET = 22
export const CALLOUT_GAP = 66
export const CALLOUT_EDGE = 36

export type CalloutSide = keyof typeof LABEL_X

export interface Callout {
  item: MealItem
  index: number
  side: CalloutSide
  marker: { x: number; y: number }
  anchor: { x: number; y: number }
}

export function layoutCallouts(items: readonly MealItem[]): Callout[] {
  const callouts: Callout[] = items.map((item, index) => {
    const side: CalloutSide = item.x < STAGE.plateSize / 2 ? 'left' : 'right'
    const marker = { x: STAGE.plateX + item.x, y: STAGE.plateY + item.y }
    return { item, index, side, marker, anchor: { x: LABEL_X[side], y: marker.y } }
  })
  for (const side of ['left', 'right'] as const) {
    const column = callouts.filter(callout => callout.side === side).sort((a, b) => a.marker.y - b.marker.y)
    let previous = -Infinity
    for (const callout of column) {
      callout.anchor.y = Math.max(callout.marker.y, previous + CALLOUT_GAP, CALLOUT_EDGE)
      previous = callout.anchor.y
    }
    // A column pushed past the bottom edge moves back up as one block.
    const overflow = previous - (STAGE.height - CALLOUT_EDGE)
    if (overflow > 0) for (const callout of column) callout.anchor.y -= overflow
  }
  return callouts
}

export function leaderPath({ side, marker, anchor }: Callout): string {
  const elbow = side === 'left' ? anchor.x + ELBOW_OFFSET : anchor.x - ELBOW_OFFSET
  return `M${marker.x} ${marker.y}L${elbow} ${anchor.y}L${anchor.x} ${anchor.y}`
}
