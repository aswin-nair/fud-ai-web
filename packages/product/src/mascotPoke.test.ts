import { describe, expect, it } from 'vitest'
import { pokeAct, pokeLines } from './mascotPoke'

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

  it('keeps every poke line inside the copy rules', () => {
    const banned = /\b(bad|cheat|guilty|earned|naughty|sinful|damage)\b/i
    const aboutFood = /\b(calorie|kcal|weight|fat|diet|deficit|too much|too little)\b/i
    for (const line of pokeLines()) {
      expect(line).not.toMatch(banned)
      expect(line).not.toMatch(aboutFood)
    }
  })
})
