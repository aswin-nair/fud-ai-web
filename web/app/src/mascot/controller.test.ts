import { describe, expect, it } from 'vitest'
import { restPosition, shouldVolunteerTaunt, targetFromRect } from './controller'

const SIZE = 88
const VIEW = { width: 420, height: 900 }

/** Anchors report their centre point, which is what the app's registry returns. */
function anchor(cx: number, cy: number, height = 40) {
  return { x: cx, y: cy, height }
}

describe('where Momo stands to look at something', () => {
  /* He used to be placed `size` above the anchor's *centre*, so he covered the
     top half of whatever he had walked over to read. */
  it('stands clear of the thing it is looking at', () => {
    const spot = targetFromRect(anchor(210, 500, 40), SIZE, VIEW)
    const anchorTop = 500 - 20

    expect(spot.y + SIZE).toBeLessThanOrEqual(anchorTop)
  })

  /* A top-of-screen anchor like the streak chip has no room above it, so the
     old clamp pinned him into the header, sitting on top of it. */
  it('drops below an anchor that is too near the top', () => {
    const spot = targetFromRect(anchor(140, 38, 44), SIZE, VIEW)

    expect(spot.y).toBeGreaterThanOrEqual(38 + 22)
  })

  it('never leaves the viewport', () => {
    for (const [cx, cy] of [[0, 0], [420, 900], [-50, -50], [999, 999], [210, 20]]) {
      const spot = targetFromRect(anchor(cx, cy), SIZE, VIEW)

      expect(spot.x).toBeGreaterThanOrEqual(0)
      expect(spot.y).toBeGreaterThanOrEqual(0)
      expect(spot.x + SIZE).toBeLessThanOrEqual(VIEW.width)
      expect(spot.y + SIZE).toBeLessThanOrEqual(VIEW.height)
    }
  })

  it('centres him horizontally on the anchor when there is room', () => {
    expect(targetFromRect(anchor(210, 500), SIZE, VIEW).x).toBe(210 - SIZE / 2)
  })
})

describe('resting place', () => {
  it('is the bottom corner, above the nav', () => {
    const rest = restPosition(SIZE, VIEW)

    expect(rest.x).toBe(VIEW.width - SIZE - 16)
    expect(rest.y).toBe(VIEW.height - SIZE - 108)
    expect(rest.y + SIZE).toBeLessThan(VIEW.height)
  })

  /* Where he actually sat, because the effect that placed him ran while the
     overlay was unmounted on a quiet screen and never ran again. */
  it('is never the top-left corner, which is where the header lives', () => {
    const rest = restPosition(SIZE, VIEW)

    expect(rest.x === 0 && rest.y === 0).toBe(false)
  })
})

describe('volunteered taunts', () => {
  const eligible = {
    activity: 'lively' as const,
    idleSeconds: 30,
    elapsedSinceSpeechMs: 60_000,
    speechCooldownMs: 45_000,
    reducedMotion: false,
    paused: false,
    quietScreen: false,
  }

  it('can fire after meaningful idle time and the speech cooldown', () => {
    expect(shouldVolunteerTaunt(eligible, () => 0.1)).toBe(true)
  })

  it('stays a lottery even when all hard gates pass', () => {
    expect(shouldVolunteerTaunt(eligible, () => 0.9)).toBe(false)
  })

  it('does not interrupt active use or recent speech', () => {
    expect(shouldVolunteerTaunt({ ...eligible, idleSeconds: 17 }, () => 0)).toBe(false)
    expect(shouldVolunteerTaunt({ ...eligible, elapsedSinceSpeechMs: 44_999 }, () => 0)).toBe(false)
  })

  it('requires more quiet time and uses a smaller chance in calm mode', () => {
    const calm = { ...eligible, activity: 'calm' as const, idleSeconds: 35 }
    expect(shouldVolunteerTaunt(calm, () => 0)).toBe(false)
    expect(shouldVolunteerTaunt({ ...calm, idleSeconds: 36 }, () => 0.15)).toBe(true)
    expect(shouldVolunteerTaunt({ ...calm, idleSeconds: 36 }, () => 0.2)).toBe(false)
  })

  it.each([
    { reducedMotion: true },
    { paused: true },
    { quietScreen: true },
    { activity: 'off' as const },
  ])('is disabled by %o', (override) => {
    expect(shouldVolunteerTaunt({ ...eligible, ...override }, () => 0)).toBe(false)
  })
})
