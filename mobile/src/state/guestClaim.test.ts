import { canStageGuestClaim } from '@fud-ai/product'
import { describe, expect, it } from 'vitest'

describe('mobile guest claim predicates', () => {
  it('matches the shared kernel', () => {
    expect(canStageGuestClaim({
      guestOnboarded: true,
      guestFoodCount: 1,
      accountPendingCount: 0,
    })).toBe(true)
  })
})
