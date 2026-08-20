import { describe, expect, it } from 'vitest'

import { sanitizeCrashName } from '@fud-ai/contracts'

describe('crash sanitizer', () => {
  it('keeps a short constructor name', () => {
    expect(sanitizeCrashName('TypeError')).toBe('TypeError')
  })

  it('drops messages, stacks, and user content', () => {
    expect(sanitizeCrashName('Error: chicken biryani at /log')).toBe('Error')
    expect(sanitizeCrashName('TypeError: Cannot read properties of undefined')).toBe('TypeError')
    expect(sanitizeCrashName(undefined)).toBe('Error')
    expect(sanitizeCrashName('postgres://user:secret-token@host/db')).toBe('Error')
  })
})
