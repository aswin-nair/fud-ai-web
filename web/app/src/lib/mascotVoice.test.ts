import { describe, expect, it } from 'vitest'

import { allLines, ambientLine, pokeAct, pokeLine, pokeLines } from './mascotVoice'

/**
 * The mascot is allowed to tease the user about poking it. It is not allowed
 * to say anything at all about food, eating, weight or a body — that is the
 * §2.4 / §2.5 line, and it is the difference between a companion and a nag.
 */
describe('what the mascot may never say', () => {
  it('never uses a banned word', () => {
    const banned = /\b(bad|cheat|guilty|earned|naughty|sinful|damage|burn it off)\b/i

    for (const line of allLines()) expect(line).not.toMatch(banned)
  })

  it('never mentions food, a body or a number to judge', () => {
    // The banter is about poking, not about the user's eating.
    const forbidden = /\b(calorie|kcal|weight|fat|fatty|skinny|lazy|greedy|diet|deficit|over|under|too much|too little)\b/i

    for (const line of allLines()) expect(line).not.toMatch(forbidden)
  })

  it('is never cruel, only put-upon', () => {
    const cruel = /\b(stupid|idiot|useless|pathetic|failure|loser|shame|disgusting)\b/i

    for (const line of allLines()) expect(line).not.toMatch(cruel)
  })
})

describe('poke banter', () => {
  it('escalates rather than repeating one line', () => {
    const said = [1, 2, 3, 4].map(n => pokeLine('idle', n))

    expect(new Set(said).size).toBe(4)
  })

  it('wakes a sleepy mascot before it starts complaining', () => {
    expect(pokeLine('sleepy', 1)).toMatch(/hm\?|awake|back/i)
  })

  it('settles on the last line instead of looping back to pleased', () => {
    const late = pokeLine('idle', 99)

    expect(late).toBe(pokeLine('idle', 100))
    expect(late).not.toBe(pokeLine('idle', 1))
  })

  it('never returns nothing, however odd the count', () => {
    for (const n of [0, -5, 1.7, 1000]) {
      expect(pokeLine('idle', n)).toBeTruthy()
    }
  })
})

describe('ambient lines', () => {
  it('gives every state something to say', () => {
    for (const state of ['idle', 'happy', 'celebrating', 'sleepy', 'proud', 'neutral'] as const) {
      expect(ambientLine(state, 0)).toBeTruthy()
    }
  })

  it('is stable for a given seed and varies across seeds', () => {
    expect(ambientLine('idle', 2)).toBe(ambientLine('idle', 2))
    expect(new Set([0, 1, 2, 3].map(s => ambientLine('idle', s))).size).toBeGreaterThan(1)
  })

  it('survives a negative or fractional seed', () => {
    expect(ambientLine('idle', -3)).toBeTruthy()
    expect(ambientLine('idle', 1.6)).toBeTruthy()
  })
})

describe('the poke repertoire', () => {
  it('pairs a distinct action with each escalating beat', () => {
    const acts = [1, 2, 3, 4, 5, 6, 7, 8].map(pokeAct)

    expect(new Set(acts.map(a => a.pose)).size).toBe(8)
    expect(new Set(acts.map(a => a.line)).size).toBe(8)
  })

  it('opens politely and ends put-upon', () => {
    expect(pokeAct(1).line).toMatch(/hello/i)
    expect(pokeAct(9).line).toMatch(/counted/i)
  })

  it('settles on the last beat rather than looping back', () => {
    expect(pokeAct(99)).toEqual(pokeAct(9))
    expect(pokeAct(99).line).not.toBe(pokeAct(1).line)
  })

  it('returns a usable act for any count', () => {
    for (const n of [0, -4, 1.6, 500]) {
      expect(pokeAct(n).pose).toBeTruthy()
      expect(pokeAct(n).line).toBeTruthy()
    }
  })

  it('keeps every poke line inside the copy rules', () => {
    const banned = /\b(bad|cheat|guilty|earned|naughty|sinful|damage)\b/i
    const aboutFood = /\b(calorie|kcal|weight|fat|diet|deficit|too much|too little)\b/i

    for (const line of pokeLines()) {
      expect(line).not.toMatch(banned)
      expect(line).not.toMatch(aboutFood)
    }
  })
})
