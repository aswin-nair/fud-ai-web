import { describe, expect, it } from 'vitest'
import { GENERAL_ROASTS, POKE_ROASTS, SCREEN_ROASTS, pickRoast } from './mascotRoasts'
import { safeMascotLine } from './mascotAI'
import { TAUNT_POSES } from './mascotVoice'

describe('reviewed roast repertoire', () => {
  it('contains 42 unique, safe, bubble-sized lines', () => {
    const lines = [...GENERAL_ROASTS, ...POKE_ROASTS, ...Object.values(SCREEN_ROASTS).flat()]
    expect(lines).toHaveLength(42)
    expect(new Set(lines).size).toBe(42)
    for (const line of lines) {
      expect(safeMascotLine(line), line).toBe(line)
      expect(line.length).toBeLessThanOrEqual(110)
    }
  })
  it.each(['today', 'log', 'insights', 'you'] as const)('varies wording and uses supported gestures on %s', screen => {
    const lines = new Set<string>()
    for (let seed = 0; seed < 30; seed++) {
      const act = pickRoast(screen, seed)
      expect(TAUNT_POSES).toContain(act.pose)
      expect([...GENERAL_ROASTS, ...SCREEN_ROASTS[screen]]).toContain(act.line)
      lines.add(act.line)
    }
    expect(lines.size).toBeGreaterThanOrEqual(18)
  })
  it('does not repeat recent lines, including when storage is unavailable', () => {
    const memory: string[] = []
    for (let i = 0; i < 40; i++) {
      const act = pickRoast('today', 0, memory, 'poke')
      expect(memory).not.toContain(act.line)
      memory.unshift(act.line)
      memory.splice(16)
    }
  })
  it('avoids the immediately previous line even after exhausting a pool', () => {
    const pool = [...GENERAL_ROASTS, ...SCREEN_ROASTS.you]
    expect(pickRoast('you', 0, pool).line).not.toBe(pool[0])
  })
  it('handles unusual seeds deterministically', () => {
    for (const seed of [NaN, Infinity, -7.9, 0]) {
      expect(pickRoast('log', seed)).toEqual(pickRoast('log', seed))
    }
  })
})
