/**
 * Feel layer for the existing web app. Sound is synthesised so the repo
 * carries no opaque audio blob. Haptics go through the Vibration API.
 * Both honour the profile toggles and the device silent / reduced-motion flags.
 */

export type SoundCue = 'log-confirm' | 'quest-complete' | 'streak-milestone'

let soundOn = true
let hapticsOn = true

export function setFeelEnabled(opts: { sound?: boolean; haptics?: boolean }): void {
  if (opts.sound != null) soundOn = opts.sound
  if (opts.haptics != null) hapticsOn = opts.haptics
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function tapLight(): void {
  if (!hapticsOn) return
  try {
    navigator.vibrate?.(12)
  } catch { /* ignore */ }
}

export function confirmHaptic(): void {
  if (!hapticsOn) return
  try {
    navigator.vibrate?.([12, 40, 18])
  } catch { /* ignore */ }
}

const CUES: Record<SoundCue, { freq: number; duration: number; second?: number }[]> = {
  'log-confirm': [{ freq: 880, duration: 0.18, second: 1318 }],
  'quest-complete': [
    { freq: 659, duration: 0.12 },
    { freq: 784, duration: 0.12 },
    { freq: 1046, duration: 0.22 },
  ],
  'streak-milestone': [
    { freq: 784, duration: 0.12 },
    { freq: 988, duration: 0.14 },
    { freq: 1318, duration: 0.28 },
  ],
}

export function playCue(cue: SoundCue): void {
  if (!soundOn || prefersReducedMotion()) return
  if (typeof window === 'undefined') return

  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return

  const ctx = new Ctx()
  const notes = CUES[cue]
  let t = ctx.currentTime

  for (const note of notes) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = note.freq
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.12, t + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + note.duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + note.duration)

    if (note.second) {
      const harm = ctx.createOscillator()
      const hg = ctx.createGain()
      harm.type = 'sine'
      harm.frequency.value = note.second
      hg.gain.setValueAtTime(0, t)
      hg.gain.linearRampToValueAtTime(0.05, t + 0.012)
      hg.gain.exponentialRampToValueAtTime(0.0001, t + note.duration)
      harm.connect(hg)
      hg.connect(ctx.destination)
      harm.start(t)
      harm.stop(t + note.duration)
    }

    t += note.duration * 0.55
  }

  window.setTimeout(() => void ctx.close(), 800)
}

/** The log-confirmation sequence from §11.1, adapted to the existing Home celebration. */
export function playLogConfirm(opts: { questJustCompleted?: boolean; streakMilestone?: boolean }): void {
  confirmHaptic()
  playCue('log-confirm')
  if (opts.questJustCompleted) {
    window.setTimeout(() => playCue('quest-complete'), prefersReducedMotion() ? 0 : 600)
  }
  if (opts.streakMilestone) {
    window.setTimeout(() => playCue('streak-milestone'), prefersReducedMotion() ? 0 : 260)
  }
}
