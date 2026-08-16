import { describe, expect, it } from 'vitest'

import { birthdayEligibility, birthdayToIso, localDateInputValue } from './onboarding'

function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 12)
}

describe('birthday eligibility', () => {
  const today = localDate(2026, 8, 17)

  it('requires an explicit birthday', () => {
    expect(birthdayEligibility('', today)).toBe('missing')
  })

  it('rejects malformed, impossible, and future dates', () => {
    expect(birthdayEligibility('not-a-date', today)).toBe('invalid')
    expect(birthdayEligibility('0000-01-01', today)).toBe('invalid')
    expect(birthdayEligibility('2008-02-30', today)).toBe('invalid')
    expect(birthdayEligibility('2027-01-01', today)).toBe('invalid')
  })

  it('accepts someone on their exact eighteenth birthday', () => {
    expect(birthdayEligibility('2008-08-17', today)).toBe('eligible')
  })

  it('blocks someone until their eighteenth birthday', () => {
    expect(birthdayEligibility('2008-08-18', today)).toBe('underage')
    expect(birthdayEligibility('2008-08-16', today)).toBe('eligible')
  })

  it('handles leap-day birthdays conservatively in a non-leap year', () => {
    expect(birthdayEligibility('2008-02-29', localDate(2026, 2, 28))).toBe('underage')
    expect(birthdayEligibility('2008-02-29', localDate(2026, 3, 1))).toBe('eligible')
  })
})

describe('date-only conversion', () => {
  it('preserves the selected local calendar date in the stored ISO value', () => {
    const stored = birthdayToIso('2001-04-09')
    expect(stored).not.toBeNull()
    const restored = new Date(stored!)
    expect(localDateInputValue(restored)).toBe('2001-04-09')
  })

  it('formats the local date for date-input bounds', () => {
    expect(localDateInputValue(localDate(2026, 8, 7))).toBe('2026-08-07')
  })
})
