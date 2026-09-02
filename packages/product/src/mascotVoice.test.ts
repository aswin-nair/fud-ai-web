import { describe, expect, it } from 'vitest'
import {
  allLines,
  ambientLine,
  daysSincePreviousLog,
  momoLine,
  occasionFor,
  pokeAct,
  pokeLine,
  pokeLines,
  TAUNT_POSES,
  tauntAct,
  tauntLines,
  type VoiceContext,
} from './mascotVoice'
import { AMBIENT, FIRST_LOG, LATE_NIGHT, REPERTOIRE, RETURNING, RING_COMPLETE, TAUNTS } from './mascotLines'

const BANNED = /\b(bad|cheat|guilty|earned|naughty|sinful|damage|burn it off)\b/i
const ABOUT_FOOD = /\b(calories?|kcals?|macros?|nutrition|food|meals?|eat|eating|exercise|appearance|protein|carbs?|weight|fat|fatty|skinny|lazy|greedy|diet|deficit|body|bodies|over|under|too much|too little)\b/i
const CRUEL = /\b(stupid|idiot|useless|pathetic|failure|loser|shame|disgusting)\b/i

function ctx(over: Partial<VoiceContext> = {}): VoiceContext {
  return { state: 'idle', dayKey: '2026-08-31', hour: 12, entryCount: 2, ...over }
}

/**
 * Momo may tease the user about poking him. He may not say anything at all
 * about food, eating, weight or a body — that is the §3.4 / §3.5 line, and it
 * is the difference between a companion and a nag.
 */
describe('what Momo may never say', () => {
  it('never uses a banned word', () => {
    for (const line of allLines()) expect(line, line).not.toMatch(BANNED)
  })

  it('never mentions food, a body or a number to judge', () => {
    for (const line of allLines()) expect(line, line).not.toMatch(ABOUT_FOOD)
  })

  it('is never cruel, only put-upon', () => {
    for (const line of allLines()) expect(line, line).not.toMatch(CRUEL)
  })

  it('never says a digit', () => {
    for (const line of allLines()) expect(line, line).not.toMatch(/\d/)
  })

  /* The copy rules are only worth anything if allLines() is exhaustive, so
     every pool a picker can reach must be inside it. */
  it('covers every line a picker can actually return', () => {
    const known = new Set(allLines())

    for (const state of ['idle', 'happy', 'celebrating', 'sleepy', 'proud', 'neutral'] as const) {
      for (let hour = 0; hour < 24; hour++) {
        for (const firstLogOfDay of [false, true]) {
          for (const ringComplete of [false, true]) {
            for (const daysAway of [0, 1, 4]) {
              const line = momoLine(ctx({ state, hour, firstLogOfDay, ringComplete, daysAway }))
              expect(known.has(line), line).toBe(true)
            }
          }
        }
      }
      for (let n = 1; n <= 12; n++) {
        for (let v = 0; v < 4; v++) expect(known.has(pokeAct(n, v).line)).toBe(true)
        expect(known.has(pokeLine(state, n))).toBe(true)
      }
    }

    for (const pose of TAUNT_POSES) {
      for (let seed = 0; seed < TAUNTS[pose].length; seed++) {
        expect(known.has(tauntAct(pose, seed).line)).toBe(true)
      }
    }
  })
})

describe('the corpus itself', () => {
  const POOLS: Array<[string, string[]]> = [
    ...Object.entries(AMBIENT).map(([state, lines]) => [`ambient.${state}`, lines] as [string, string[]]),
    ['returning', RETURNING],
    ['ring_complete', RING_COMPLETE],
    ['first_log', FIRST_LOG],
    ['late_night', LATE_NIGHT],
  ]

  /* A pool that shrinks back to three or four lines is how Momo starts sounding
     like a lookup table again, which is the whole thing this corpus fixes. */
  it('keeps every pool deep enough to not sound scripted', () => {
    for (const [name, lines] of POOLS) {
      expect(lines.length, `${name} is too shallow`).toBeGreaterThanOrEqual(12)
    }
  })

  it('never repeats a line inside one pool', () => {
    for (const [name, lines] of POOLS) {
      expect(new Set(lines).size, `${name} has a duplicate`).toBe(lines.length)
    }
    for (const beat of REPERTOIRE) {
      expect(new Set(beat.lines).size, `${beat.pose} has a duplicate`).toBe(beat.lines.length)
    }
    for (const pose of TAUNT_POSES) {
      expect(new Set(TAUNTS[pose]).size, `${pose} has a duplicate`).toBe(TAUNTS[pose].length)
    }
    expect(new Set(tauntLines()).size, 'taunts repeat between gestures').toBe(tauntLines().length)
  })

  /* Momo is terse. A long line reads as a different character, and the bubble
     it renders into is small. */
  it('keeps every line short', () => {
    for (const line of allLines()) expect(line.length, line).toBeLessThanOrEqual(80)
  })

  it('gives every poke beat more than one wording', () => {
    for (const beat of REPERTOIRE) {
      expect(beat.lines.length, beat.pose).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('volunteer taunts', () => {
  it('gives every roaming gesture a deep pool of matching jokes', () => {
    expect(Object.keys(TAUNTS).sort()).toEqual([...TAUNT_POSES].sort())
    for (const pose of TAUNT_POSES) {
      expect(TAUNTS[pose].length, `${pose} is too shallow`).toBeGreaterThanOrEqual(12)
      expect(tauntAct(pose).pose).toBe(pose)
    }
  })

  it('is deterministic for a seed and varies between seeds', () => {
    for (const pose of TAUNT_POSES) {
      expect(tauntAct(pose, 3)).toEqual(tauntAct(pose, 3))
      expect(new Set([0, 1, 2, 3].map(seed => tauntAct(pose, seed).line)).size).toBeGreaterThan(1)
    }
  })

  it('skips a recently heard line without changing the gesture', () => {
    for (const pose of TAUNT_POSES) {
      const first = tauntAct(pose, 0)
      const next = tauntAct(pose, 0, [first.line])

      expect(next.pose).toBe(pose)
      expect(next.line).not.toBe(first.line)
    }
  })

  it('still has something to say when its whole pool is recent', () => {
    for (const pose of TAUNT_POSES) {
      expect(tauntAct(pose, 0, TAUNTS[pose]).line).toBeTruthy()
    }
  })
})

describe('occasions', () => {
  it('ranks a return above every other moment', () => {
    expect(occasionFor(ctx({ daysAway: 4, ringComplete: true, firstLogOfDay: true }))).toBe('returning')
  })

  it('puts a closed arc above a first log', () => {
    expect(occasionFor(ctx({ ringComplete: true, firstLogOfDay: true }))).toBe('ring_complete')
  })

  it('notices the small hours only when nothing better is happening', () => {
    expect(occasionFor(ctx({ hour: 2 }))).toBe('late_night')
    expect(occasionFor(ctx({ hour: 2, firstLogOfDay: true }))).toBe('first_log')
  })

  it('leaves a paused tracker alone', () => {
    // Numbers are hidden while paused, so Momo holds steady instead of
    // celebrating arcs or remarking on a return.
    expect(occasionFor(ctx({ state: 'neutral', daysAway: 9, ringComplete: true }))).toBe('ambient')
  })

  it('treats one missed day as ordinary, not a comeback', () => {
    expect(occasionFor(ctx({ daysAway: 1 }))).toBe('ambient')
    expect(occasionFor(ctx({ daysAway: 2 }))).toBe('returning')
  })
})

describe('the line moves through the day', () => {
  /* The bug this replaces: the seed was today's meal count alone, so the line
     could only change by eating — the same sentence at breakfast and midnight. */
  it('does not repeat itself from morning to night on an unchanged day', () => {
    const said = [8, 13, 18, 22].map(hour => momoLine(ctx({ hour })))

    expect(new Set(said).size).toBeGreaterThan(1)
  })

  it('is stable within the same hour so it cannot flicker on re-render', () => {
    expect(momoLine(ctx({ hour: 9 }))).toBe(momoLine(ctx({ hour: 9 })))
  })

  it('moves on when the day does', () => {
    const monday = momoLine(ctx({ dayKey: '2026-08-31' }))
    const week = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04']
      .map(dayKey => momoLine(ctx({ dayKey })))

    expect(week.some(line => line !== monday)).toBe(true)
  })
})

describe('not repeating itself', () => {
  it('skips what it just said', () => {
    const first = momoLine(ctx())

    expect(momoLine(ctx(), [first])).not.toBe(first)
  })

  it('still speaks when everything is recent', () => {
    // Better a repeat than an empty bubble.
    const everything = allLines()

    expect(momoLine(ctx(), everything)).toBeTruthy()
  })

  it('never returns nothing, whatever the context', () => {
    for (const hour of [0, 5, 23]) {
      for (const state of ['idle', 'sleepy', 'neutral'] as const) {
        expect(momoLine(ctx({ hour, state }))).toBeTruthy()
      }
    }
  })
})

describe('daysSincePreviousLog', () => {
  it('measures the gap from the last day logged before today', () => {
    expect(daysSincePreviousLog(['2026-08-24', '2026-08-28'], '2026-08-31')).toBe(3)
  })

  it('reads yesterday as one day, which is not a comeback', () => {
    expect(daysSincePreviousLog(['2026-08-30'], '2026-08-31')).toBe(1)
  })

  it('ignores today, so logging now does not erase the gap', () => {
    expect(daysSincePreviousLog(['2026-08-25', '2026-08-31'], '2026-08-31')).toBe(6)
  })

  it('treats a first-time user as not returning', () => {
    expect(daysSincePreviousLog([], '2026-08-31')).toBe(0)
    expect(daysSincePreviousLog(['2026-08-31'], '2026-08-31')).toBe(0)
  })

  it('counts across a month boundary', () => {
    expect(daysSincePreviousLog(['2026-07-30'], '2026-08-02')).toBe(3)
  })
})

describe('poke banter', () => {
  it('escalates rather than repeating one line', () => {
    const said = [1, 2, 3, 4].map(n => pokeLine('idle', n))

    expect(new Set(said).size).toBe(4)
  })

  it('wakes a sleepy Momo before he starts complaining', () => {
    expect(pokeLine('sleepy', 1)).toMatch(/hm\?|awake|back/i)
  })

  it('settles on the last line instead of looping back to pleased', () => {
    const late = pokeLine('idle', 99)

    expect(late).toBe(pokeLine('idle', 100))
    expect(late).not.toBe(pokeLine('idle', 1))
  })

  it('never returns nothing, however odd the count', () => {
    for (const n of [0, -5, 1.7, 1000]) expect(pokeLine('idle', n)).toBeTruthy()
  })
})

describe('the poke repertoire', () => {
  it('keeps one distinct action per escalating beat', () => {
    const acts = [1, 2, 3, 4, 5, 6, 7, 8].map(n => pokeAct(n))

    expect(new Set(acts.map(a => a.pose)).size).toBe(8)
    expect(new Set(acts.map(a => a.line)).size).toBe(8)
  })

  it('opens politely and ends put-upon', () => {
    expect(pokeAct(1).line).toMatch(/hello/i)
    expect(pokeAct(9).line).toMatch(/count/i)
  })

  it('keeps the last pose rather than looping back', () => {
    expect(pokeAct(99).pose).toBe(pokeAct(9).pose)
    expect(pokeAct(99).line).not.toBe(pokeAct(1).line)
  })

  it('keeps varying the wording after the escalation is complete', () => {
    const late = [9, 10, 11, 12, 13].map(n => pokeAct(n, 0))

    expect(new Set(late.map(act => act.pose)).size).toBe(1)
    expect(new Set(late.map(act => act.line)).size).toBeGreaterThan(1)
  })

  /* The pose ladder is the joke and must not move; the wording is what varies
     between sessions so the ninth poke is not a recital. */
  it('holds the pose steady while the wording varies by session', () => {
    const poses = [0, 1, 2].map(v => pokeAct(3, v).pose)
    const lines = [0, 1, 2].map(v => pokeAct(3, v).line)

    expect(new Set(poses).size).toBe(1)
    expect(new Set(lines).size).toBeGreaterThan(1)
  })

  it('returns a usable act for any count or variant', () => {
    for (const n of [0, -4, 1.6, 500]) {
      expect(pokeAct(n).pose).toBeTruthy()
      expect(pokeAct(n, -3).line).toBeTruthy()
    }
  })

  it('keeps every poke line inside the copy rules', () => {
    for (const line of pokeLines()) {
      expect(line, line).not.toMatch(BANNED)
      expect(line, line).not.toMatch(ABOUT_FOOD)
    }
  })
})

describe('ambientLine', () => {
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
