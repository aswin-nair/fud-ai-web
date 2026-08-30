import { dayRingProgress, pokeAct, pokeLines } from '@fud-ai/product'
import { describe, expect, it } from 'vitest'

describe('shared product kernel on mobile', () => {
  it('makes one log enough for a light day', () => {
    expect(dayRingProgress([{ mealType: 'snack', source: 'manual' }], 0, 'light').complete).toBe(true)
  })

  it('keeps poke copy inside the safety rules', () => {
    const banned = /\b(bad|cheat|guilty|earned|naughty|sinful|damage)\b/i
    expect(pokeAct(1).line).toMatch(/hello/i)
    for (const line of pokeLines()) expect(line).not.toMatch(banned)
  })
})
