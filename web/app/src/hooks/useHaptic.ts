import { feel, haptic, type HapticShape, type SoundCue } from '../lib/feel'

/**
 * Paired sound + haptic for a UI event.
 *
 * Prefer this over calling the Vibration API directly: everything routed
 * through the feel layer respects the Settings toggles, and a cue carries its
 * own haptic, so a control cannot end up buzzing silently.
 */
export function useFeel() {
  return feel
}

/**
 * Haptic only, for the rare event that should be felt but not heard.
 *
 * This used to call navigator.vibrate directly, which meant the Settings >
 * Haptics toggle silently did nothing at fifteen of the app's sixteen call
 * sites. It now goes through the feel layer like everything else.
 */
export function useHaptic() {
  return function vibrate(shape: HapticShape = 'medium') {
    haptic(shape)
  }
}

export type { HapticShape, SoundCue }
