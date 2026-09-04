import type { Mood } from './behaviors'

export const MOMO_EXPRESSIONS = ['neutral', 'happy', 'thinking', 'surprised', 'wink', 'sleepy', 'blink'] as const
export type MomoExpression = typeof MOMO_EXPRESSIONS[number]

/** Only interaction state reaches the face; no food, body or nutrition values. */
export function momoExpression(mood: Mood, pose: string, thinking: boolean): MomoExpression {
  if (mood === 'sleepy') return 'sleepy'
  if (pose === 'idle_blink' || pose === 'poke_hide') return 'blink'
  if (thinking || pose === 'ponder') return 'thinking'
  if (['poke_hop', 'poke_squish', 'poke_tip', 'poke_puff'].includes(pose)) return 'surprised'
  if (['wave_at_user', 'bow', 'poke_wobble'].includes(pose)) return 'wink'
  if (['celebrate_small', 'celebrate_big', 'tiny_dance', 'happy_hop'].includes(pose) || mood === 'excited' || mood === 'proud') return 'happy'
  if (mood === 'curious' || pose === 'look_around') return 'thinking'
  return 'neutral'
}
