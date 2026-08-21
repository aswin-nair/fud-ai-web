import { ambientLine } from '../lib/mascotVoice'
import type { MascotState } from './Mascot'

/**
 * The mascot's line. Pass `line` to say something specific (poke banter);
 * otherwise it picks the ambient line for the state.
 *
 * Every string comes from lib/mascotVoice, which is covered by a test
 * asserting the character never comments on food, a body or a number.
 */
export interface MascotSayProps {
  state: MascotState
  /** Stable within a render pass so the line does not flicker. */
  seed?: number
  /** Overrides the ambient line — used for poke banter. */
  line?: string
}

export function MascotSay({ state, seed = 0, line }: MascotSayProps) {
  return (
    <p className="mascot-say" aria-live="polite">
      {line ?? ambientLine(state, seed)}
    </p>
  )
}
