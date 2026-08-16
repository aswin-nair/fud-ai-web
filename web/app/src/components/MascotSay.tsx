import type { MascotState } from './Mascot'

/**
 * What the mascot says, keyed to the same logging-driven states it already
 * reacts to (§2.5). There is deliberately no line about eating too much, too
 * little, or a particular food — the mascot has no opinion about any of that.
 *
 * No exclamation marks outside a genuine milestone, per Appendix A.
 */
const LINES: Record<MascotState, string[]> = {
  sleepy: [
    'Nothing logged yet. One meal is enough to keep the day.',
    'Whenever you are ready — anything counts.',
  ],
  idle: [
    'Today is on the board.',
    'Logged and counted. Nice.',
  ],
  happy: [
    'That one is in.',
    'Got it — day secured.',
  ],
  celebrating: [
    'Quest done!',
    'That finishes it!',
  ],
  proud: [
    'Look at that streak.',
    'You have kept this going a while now.',
  ],
  neutral: [
    'Tracking is paused. Your streak is held.',
    'Numbers are off. Nothing is slipping.',
  ],
}

export interface MascotSayProps {
  state: MascotState
  /** Stable within a render pass so the line does not flicker. */
  seed?: number
}

export function MascotSay({ state, seed = 0 }: MascotSayProps) {
  const options = LINES[state]
  const line = options[Math.abs(seed) % options.length]

  return <p className="mascot-say">{line}</p>
}
