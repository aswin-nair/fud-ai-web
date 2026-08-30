/**
 * Guest progress may move onto an account only after a real first log, and
 * never on top of unsynced account work.
 */
export function canStageGuestClaim(input: {
  guestOnboarded: boolean
  guestFoodCount: number
  accountPendingCount: number
}): boolean {
  return input.guestOnboarded
    && input.guestFoodCount > 0
    && input.accountPendingCount === 0
}

export function guestUserIdFromDevice(deviceId: string): string {
  return `guest:${deviceId}`
}

export function isGuestUserId(userId: string): boolean {
  return userId.startsWith('guest:')
}
