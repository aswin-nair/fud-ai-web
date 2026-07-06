export function useHaptic() {
  return function vibrate(pattern: number | number[] = 12) {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern)
      }
    } catch {
      // Ignore — vibrate is best-effort
    }
  }
}
