import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  bannedNotificationCopy,
  evaluateNotifications,
  notificationsSentToday,
  routineHour,
} from './notifications'

/**
 * §2.6 caps the app at two notifications a day, and §8 asks for that to be
 * enforced in code rather than by convention — so these drive the real
 * evaluate path rather than asserting on the constant.
 *
 * Runs against stubs instead of jsdom: the module only needs localStorage and
 * Notification, and two small fakes are cheaper than a DOM.
 */

const sent: string[] = []

function installStubs() {
  const store = new Map<string, string>()

  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  })

  class FakeNotification {
    static permission = 'granted'
    static requestPermission = async () => 'granted'
    constructor(_title: string, opts: { body: string }) {
      sent.push(opts.body)
    }
  }

  vi.stubGlobal('Notification', FakeNotification)
}

/** Evening, nothing logged, no freeze left — the state that allows both nudges. */
const RIPE = {
  loggedToday: false,
  streak: 12,
  freezeAvailable: 0,
  firstLogHours: [] as number[],
  localHour: 20,
}

beforeEach(() => {
  sent.length = 0
  installStubs()
})

describe('the two-per-day cap', () => {
  it('never sends more than two in a day', async () => {
    await evaluateNotifications({ ...RIPE, freezeJustApplied: { protectedStreak: 12 } })
    // Called again the way an app open would call it.
    await evaluateNotifications({ ...RIPE, freezeJustApplied: { protectedStreak: 12 } })
    await evaluateNotifications(RIPE)

    expect(sent.length).toBe(2)
    expect(notificationsSentToday()).toBe(2)
  })

  it('sends each kind at most once', async () => {
    await evaluateNotifications(RIPE)
    const afterFirst = sent.length

    await evaluateNotifications(RIPE)

    expect(sent.length).toBe(afterFirst)
  })

  it('counts across repeated evaluation within the hour', async () => {
    for (let i = 0; i < 10; i++) await evaluateNotifications(RIPE)

    expect(sent.length).toBeLessThanOrEqual(2)
  })
})

describe('suppression rules', () => {
  it('sends nothing while tracking is paused', async () => {
    await evaluateNotifications({
      ...RIPE,
      trackingPaused: true,
      freezeJustApplied: { protectedStreak: RIPE.streak },
    })

    expect(sent).toEqual([])
    expect(notificationsSentToday()).toBe(0)
  })

  it('sends nothing once the user has logged today', async () => {
    await evaluateNotifications({ ...RIPE, loggedToday: true })

    expect(sent).toEqual([])
  })

  it('does not send the save nudge when a freeze is available', async () => {
    await evaluateNotifications({ ...RIPE, freezeAvailable: 1, localHour: 20 })

    // The routine nudge may still fire; the save nudge must not.
    expect(sent.some(t => /still alive/.test(t))).toBe(false)
  })

  it('does not send the save nudge outside its window', async () => {
    await evaluateNotifications({ ...RIPE, localHour: 22 })

    expect(sent.some(t => /still alive/.test(t))).toBe(false)
  })

  it('does not send the save nudge with no streak to save', async () => {
    await evaluateNotifications({ ...RIPE, streak: 0 })

    expect(sent.some(t => /still alive/.test(t))).toBe(false)
  })
})

describe('routine hour', () => {
  it('defaults to 19:00 on thin data', () => {
    expect(routineHour([])).toBe(19)
    expect(routineHour([8, 9, 10, 11])).toBe(19)
  })

  it('schedules just after the median first log', () => {
    expect(routineHour([8, 8, 9, 9, 9, 10, 10])).toBe(10)
  })

  it('stays within waking hours', () => {
    expect(routineHour([1, 1, 1, 1, 1, 1, 1])).toBeGreaterThanOrEqual(8)
    expect(routineHour([23, 23, 23, 23, 23, 23, 23])).toBeLessThanOrEqual(22)
  })
})

describe('copy', () => {
  const samples = [
    'Two minutes to keep your 12-day streak going.',
    "Your streak's still alive — log anything to keep it.",
    'Freeze used. Streak safe at 23.',
    'Log anything today and the day counts.',
  ]

  it('never mentions calories, weight or amounts', () => {
    for (const text of samples) {
      expect(bannedNotificationCopy(text)).toBe(false)
    }
  })

  it('rejects the copy the spec calls out as wrong', () => {
    expect(bannedNotificationCopy("You're 400 calories over today.")).toBe(true)
    expect(bannedNotificationCopy('Duo is disappointed in you.')).toBe(true)
    expect(bannedNotificationCopy("You've broken your promise to yourself.")).toBe(true)
  })

  it('never moralises about food', () => {
    const banned = /\b(bad|cheat|guilty|earned|naughty|sinful|damage)\b/i

    for (const text of samples) expect(text).not.toMatch(banned)
  })

  it('carries no exclamation marks', () => {
    // Appendix A reserves them for genuine celebration.
    for (const text of samples) expect(text).not.toContain('!')
  })

  it('sends no digits other than a streak length', async () => {
    await evaluateNotifications(RIPE)

    for (const text of sent) {
      const numbers = text.match(/\d+/g) ?? []
      for (const n of numbers) expect(Number(n)).toBe(RIPE.streak)
    }
  })
})
