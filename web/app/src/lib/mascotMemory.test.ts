import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  recentLines,
  rememberLine,
  sessionVariant,
  speechCooldownReady,
} from './mascotMemory'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial))
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: key => { values.delete(key) },
    setItem: (key, value) => { values.set(key, value) },
  }
}

describe('mascot session memory', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', memoryStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps newest-first global history without duplicate lines', () => {
    rememberLine('First line.', 'ambient|today', 1_000)
    rememberLine('Second line.', 'ambient|today', 2_000)
    rememberLine('First line.', 'ambient|today', 3_000)

    expect(recentLines()).toEqual(['First line.', 'Second line.'])
    expect(recentLines('ambient|today')).toEqual(['First line.', 'Second line.'])
  })

  it('keeps categorical contexts separate while retaining global no-repeat memory', () => {
    rememberLine('A return line.', 'comeback|today', 1_000)
    rememberLine('A milestone line.', 'milestone|today', 1_100)

    expect(recentLines('comeback|today')).toEqual(['A return line.'])
    expect(recentLines('milestone|today')).toEqual(['A milestone line.'])
    expect(recentLines()).toEqual(['A milestone line.', 'A return line.'])
  })

  it('supports deterministic cooldown checks and treats Infinity as muted', () => {
    rememberLine('A line.', 'ambient|today', 10_000)

    expect(speechCooldownReady(30_000, 'ambient|today', 39_999)).toBe(false)
    expect(speechCooldownReady(30_000, 'ambient|today', 40_000)).toBe(true)
    expect(speechCooldownReady(Infinity, 'ambient|today', Number.MAX_SAFE_INTEGER)).toBe(false)
    expect(speechCooldownReady(30_000, 'unheard|today', 10_001)).toBe(true)
  })

  it('migrates the legacy array history used by existing sessions', () => {
    vi.stubGlobal('sessionStorage', memoryStorage({
      'fud-ai-momo-recent': JSON.stringify(['Latest.', 'Earlier.', 'Latest.']),
    }))

    expect(recentLines()).toEqual(['Latest.', 'Earlier.'])
    rememberLine('Now.', 'ambient|today', 5_000)
    expect(recentLines()).toEqual(['Now.', 'Latest.', 'Earlier.'])
  })

  it('makes session variants reproducible without stubbing global randomness', () => {
    expect(sessionVariant(() => 0.321)).toBe(321)
    expect(sessionVariant(() => 0.999)).toBe(321)
  })

  it('fails open when session storage is unavailable', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
    })

    expect(recentLines()).toEqual([])
    expect(() => rememberLine('Still safe.')).not.toThrow()
    expect(sessionVariant(() => 0.5)).toBe(0)
    expect(speechCooldownReady(30_000, 'ambient', 50_000)).toBe(true)
  })
})
