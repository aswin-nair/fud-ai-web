import { describe, expect, it } from 'vitest'
import { CALLOUT_EDGE, CALLOUT_GAP, layoutCallouts, STAGE } from './callouts'
import { SAMPLE_MEALS } from './meals'

describe('hero callouts', () => {
  it('keep labels on the same side apart and inside the stage for every sample plate', () => {
    for (const meal of SAMPLE_MEALS) {
      const callouts = layoutCallouts(meal.items)
      for (const side of ['left', 'right'] as const) {
        const ys = callouts.filter(callout => callout.side === side).map(callout => callout.anchor.y).sort((a, b) => a - b)
        ys.forEach((y, i) => {
          expect(y, meal.name).toBeGreaterThanOrEqual(CALLOUT_EDGE)
          expect(y, meal.name).toBeLessThanOrEqual(STAGE.height - CALLOUT_EDGE)
          if (i > 0) expect(y - ys[i - 1], meal.name).toBeGreaterThanOrEqual(CALLOUT_GAP)
        })
      }
    }
  })
})
