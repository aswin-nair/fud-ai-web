export type MotivationZone = 'empty' | 'start' | 'pace' | 'close' | 'goal' | 'over'

export interface MotivationState {
  zone: MotivationZone
  status: string
  emoji: string
  /** CSS class to apply to the ring for zone-based accent */
  ringClass: string
}

export function getMotivation(current: number, goal: number): MotivationState {
  if (goal <= 0) {
    return { zone: 'empty', status: "Let's fuel up", emoji: '🍽️', ringClass: '' }
  }
  const ratio = current / goal
  if (ratio === 0) {
    return { zone: 'empty', status: "Let's fuel up", emoji: '🍽️', ringClass: '' }
  }
  if (ratio < 0.5) {
    return { zone: 'start', status: 'Good start', emoji: '💪', ringClass: '' }
  }
  if (ratio < 0.85) {
    return { zone: 'pace', status: 'Nice pace', emoji: '🚀', ringClass: '' }
  }
  if (ratio < 1) {
    return { zone: 'close', status: 'Almost there!', emoji: '⚡', ringClass: 'ring-near-goal' }
  }
  if (ratio <= 1.08) {
    return { zone: 'goal', status: 'Goal smashed!', emoji: '🎉', ringClass: 'ring-at-goal' }
  }
  return { zone: 'over', status: 'Over budget', emoji: '⚠️', ringClass: 'ring-over' }
}
