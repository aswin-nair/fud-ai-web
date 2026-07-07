// kcal = MET * weightKg * (durationMinutes / 60)
export const ACTIVITY_PRESETS = [
  { id: 'run',      emoji: '🏃', name: 'Run',      met: 9.8 },
  { id: 'walk',     emoji: '🚶', name: 'Walk',     met: 3.5 },
  { id: 'strength', emoji: '💪', name: 'Strength', met: 5.0 },
  { id: 'cycle',    emoji: '🚴', name: 'Cycle',    met: 7.5 },
  { id: 'yoga',     emoji: '🧘', name: 'Yoga',     met: 3.0 },
  { id: 'swim',     emoji: '🏊', name: 'Swim',     met: 7.0 },
  { id: 'other',    emoji: '⚡', name: 'Other',    met: 5.0 },
] as const

export type ActivityPreset = (typeof ACTIVITY_PRESETS)[number]

export function estimateKcal(met: number, weightKg: number, durationMins: number): number {
  return Math.round(met * weightKg * (durationMins / 60))
}

export const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60] as const
