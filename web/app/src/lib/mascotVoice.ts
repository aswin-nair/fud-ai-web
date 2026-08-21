import type { MascotState } from '../components/Mascot'

/**
 * Everything the mascot says.
 *
 * The character is allowed to be cheeky about being POKED. It is never cheeky
 * about food, eating, weight or a body — §2.4 bans moralising about food and
 * §2.5 keeps the mascot blind to every number. So the banter below is about
 * the poking, the waiting and its own dignity, and about nothing else.
 *
 * A test asserts that: see mascotVoice.test.ts.
 */

/** Contextual lines, keyed to the logging-driven states. */
const AMBIENT: Record<MascotState, string[]> = {
  sleepy: [
    'Nothing logged yet. One meal is enough to keep the day.',
    'Whenever you are ready — anything counts.',
    'Still here. No rush.',
    'A quick add counts just as much as a proper one.',
  ],
  idle: [
    'Today is on the board.',
    'Logged and counted. Nice.',
    'That is the hard part done.',
    'I will keep the tally. You get on with things.',
  ],
  happy: [
    'That one is in.',
    'Got it — day secured.',
    'Noted and filed.',
  ],
  celebrating: [
    'Quest done!',
    'That finishes it!',
  ],
  proud: [
    'Look at that streak.',
    'You have kept this going a while now.',
    'This is starting to look like a habit.',
  ],
  neutral: [
    'Tracking is paused. Your streak is held.',
    'Numbers are off. Nothing is slipping.',
  ],
}

/**
 * Poke banter, escalating. The joke is that it is trying to do its job and you
 * keep interrupting — it wears down rather than getting nicer, which is the
 * only reason repeated poking stays funny.
 */
const POKES = [
  'Oh — hello.',
  'Yes? I am right here.',
  'You are still poking.',
  'This is my one job and you are interrupting it.',
  'I do have a tally to keep.',
  'Fine. Poke away. I will wait.',
  'We are really doing this.',
  'I have counted every one of these, you know. Counting is my thing.',
]

/** What it says on the poke that wakes it up. */
const WOKEN = [
  'Hm? Oh. You are back.',
  'I was resting my eyes.',
  'Right. Awake. Present.',
]

export function ambientLine(state: MascotState, seed = 0): string {
  const options = AMBIENT[state]
  return options[Math.abs(Math.trunc(seed)) % options.length]!
}

/**
 * `count` is the poke number within this session, starting at 1. A sleepy
 * mascot gets woken first, which is worth its own line — after that it joins
 * the escalation like everyone else.
 */
export function pokeLine(state: MascotState, count: number): string {
  const n = Math.max(1, Math.trunc(count))

  if (state === 'sleepy' && n <= WOKEN.length) {
    return WOKEN[n - 1]!
  }

  // Past the end of the ladder it stays on the last, most worn-down line
  // rather than looping back to being pleased to see you.
  return POKES[Math.min(n - 1, POKES.length - 1)]!
}

/** Every line the character can utter, for the copy-safety test. */
export function allLines(): string[] {
  return [...Object.values(AMBIENT).flat(), ...POKES, ...WOKEN]
}
