import { describe, expect, it } from 'vitest'
import { entryDayKey, isLocalDate, stampLocalDate } from './localDate'

describe('entryDayKey', () => {
  it('prefers the stamped calendar day over deriving from the timestamp', () => {
    expect(entryDayKey({
      timestamp: '2026-08-30T22:30:00.000Z',
      localDate: '2026-08-31',
    })).toBe('2026-08-31')
  })

  it('falls back to the device-local day when the stamp is missing', () => {
    const stamped = stampLocalDate('2026-08-30T12:00:00')
    expect(isLocalDate(stamped)).toBe(true)
    expect(entryDayKey({ timestamp: '2026-08-30T12:00:00' })).toBe(stamped)
  })

  it('rejects impossible calendar labels', () => {
    expect(isLocalDate('2026-02-30')).toBe(false)
    expect(isLocalDate('2026-08-30T12:00:00')).toBe(false)
  })
})
