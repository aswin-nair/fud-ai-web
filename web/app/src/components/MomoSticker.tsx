import { useApp } from '../store/AppContext'
import { Momo } from './Momo'
import type { Mood } from '../mascot/behaviors'

/** Decorative, stationary artwork. Respects Hide Momo and does not add dialogue. */
export function MomoSticker({ mood = 'cozy', pose = 'still' }: { mood?: Mood; pose?: string }) {
  const { state } = useApp()
  if (state.gamification.mascotActivity === 'off') return null
  return (
    <span className="momo-sticker" aria-hidden="true">
      <Momo mood={mood} pose={pose} cosmeticId={state.gamification.equippedCosmeticId} />
    </span>
  )
}
