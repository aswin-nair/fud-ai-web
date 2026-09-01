/**
 * Momo's voice lives in @fud-ai/product so web and mobile speak with one
 * mouth — it used to be copied into both, and the copies had already started
 * to drift.
 *
 * The copy-safety contract (§3.4 / §3.5: never a banned word, never food, a
 * body or a number, never cruel) is asserted against the real implementation
 * in packages/product/src/mascotVoice.test.ts, which the root `npm test` runs.
 */
export {
  allLines,
  ambientLine,
  daysSincePreviousLog,
  momoLine,
  occasionFor,
  pokeAct,
  pokeLine,
  pokeLines,
  POKE_POSES,
  tauntAct,
  tauntLines,
  TAUNT_POSES,
  type MascotState,
  type PokeAct,
  type PokePose,
  type TauntAct,
  type TauntPose,
  type VoiceContext,
  type VoiceOccasion,
} from '@fud-ai/product/mascotVoice'
