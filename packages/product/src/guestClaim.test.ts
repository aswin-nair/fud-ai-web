import { describe, expect, it } from 'vitest'
import { canStageGuestClaim, guestUserIdFromDevice, isGuestUserId } from './guestClaim'

describe('canStageGuestClaim', () => {
  it('requires an onboarded guest with at least one log and a quiet account', () => {
    expect(canStageGuestClaim({ guestOnboarded: true, guestFoodCount: 1, accountPendingCount: 0 })).toBe(true)
    expect(canStageGuestClaim({ guestOnboarded: false, guestFoodCount: 1, accountPendingCount: 0 })).toBe(false)
    expect(canStageGuestClaim({ guestOnboarded: true, guestFoodCount: 0, accountPendingCount: 0 })).toBe(false)
    expect(canStageGuestClaim({ guestOnboarded: true, guestFoodCount: 1, accountPendingCount: 2 })).toBe(false)
  })

  it('names guest keys from a device id', () => {
    expect(guestUserIdFromDevice('abc')).toBe('guest:abc')
    expect(isGuestUserId('guest:abc')).toBe(true)
    expect(isGuestUserId('user-1')).toBe(false)
  })
})
