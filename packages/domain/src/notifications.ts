export const MAX_NOTIFICATIONS_PER_DAY = 2

export const NOTIFICATION_KINDS = ['routine', 'save', 'freeze'] as const
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number]

export interface NotificationEligibilityInput {
  loggedToday: boolean
  streak: number
  freezeAvailable: number
  firstLogHours: readonly number[]
  localHour: number
  trackingPaused?: boolean
  freezeJustApplied?: boolean
  sentKinds: readonly NotificationKind[]
}

/** Copy must never mention calories, weight, or moral food language. */
export function bannedNotificationCopy(text: string): boolean {
  return /\b(calorie|kcal|weight|over|under|deficit|disappointed|broken your promise)\b/i.test(text)
}

export function routineHour(firstLogHours: readonly number[]): number {
  if (firstLogHours.length < 5) return 19
  const sorted = [...firstLogHours].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!
  return Math.min(22, Math.max(8, Math.round(median + 0.5)))
}

export function canSendNotification(
  kind: NotificationKind,
  sentKinds: readonly NotificationKind[],
): boolean {
  if (sentKinds.length >= MAX_NOTIFICATIONS_PER_DAY) return false
  return !sentKinds.includes(kind)
}

/**
 * Decide which of the two allowed nudges may fire. Delivery stays in the
 * platform adapter.
 */
export function eligibleNotificationKinds(
  input: NotificationEligibilityInput,
): NotificationKind[] {
  if (input.trackingPaused) return []

  const eligible: NotificationKind[] = []
  const sent = [...input.sentKinds]

  const consider = (kind: NotificationKind) => {
    if (!canSendNotification(kind, sent)) return
    eligible.push(kind)
    sent.push(kind)
  }

  if (input.freezeJustApplied) consider('freeze')

  if (!input.loggedToday && input.localHour >= routineHour(input.firstLogHours)) {
    consider('routine')
  }

  if (
    !input.loggedToday
    && input.streak > 0
    && input.freezeAvailable < 1
    && input.localHour >= 20
    && input.localHour < 21
  ) {
    consider('save')
  }

  return eligible
}
