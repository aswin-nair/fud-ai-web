import { AccessibilityInfo } from 'react-native';

/**
 * The motion half of the feel layer: the reduced-motion flag as a plain value,
 * and the timings for the log confirmation in §11.1.
 *
 * Components read reduced motion through Reanimated's `useReducedMotion` hook.
 * This module exists for the code that runs *outside* a component — the
 * confirmation sequence starts in an event handler on a screen that is about to
 * unmount, so it cannot depend on a hook.
 */
let reduced = false;

/** Whether the OS asks for reduced motion. Safe to call from anywhere. */
export function motionReduced(): boolean {
  return reduced;
}

/**
 * Reads the current setting and subscribes to changes. Called once at startup;
 * returns an unsubscribe so the root layout can clean up.
 *
 * Until the first read resolves the flag is `false`, which fails towards
 * animating. A missed frame of motion is a smaller error than an interaction
 * that silently does nothing on a device that never animates.
 */
export function initMotion(): () => void {
  void AccessibilityInfo.isReduceMotionEnabled()
    .then((value) => {
      reduced = value;
    })
    .catch(() => undefined);

  const subscription = AccessibilityInfo.addEventListener(
    'reduceMotionChanged',
    (value) => {
      reduced = value;
    },
  );

  return () => subscription.remove();
}

/**
 * Offsets in ms from the moment `Log it` is pressed, per §11.1. The beats are
 * sequenced rather than simultaneous — everything landing at once reads as a
 * flicker, and this is the one moment the app is remembered for.
 */
export const LOG_CONFIRM = {
  /** Sheet starts dismissing. The entry is already written by now. */
  dismiss: 120,
  /** Ring begins animating up, and the confirmation sound plays. */
  ring: 260,
  /** Mascot switches to 'happy'. */
  mascot: 300,
  /** A quest finished by this log pops and fires confetti. */
  quest: 860,
} as const;

/** How long the mascot holds 'happy' before returning to 'idle'. §11.1. */
export const MASCOT_HAPPY_MS = 2000;

/** Gap between macro bars when they fill on screen focus. §11.3. */
export const MACRO_STAGGER_MS = 60;

export type Beat = {
  /** Offset in ms from the start of the sequence. */
  at: number;
  run: () => void;
};

/**
 * Runs beats at their offsets and returns a cancel function.
 *
 * Under reduced motion every beat fires immediately, in order, so the end state
 * is identical and nothing is lost — §11.3 asks for an instant state change,
 * not a skipped one. Sound is unaffected either way; it is not motion.
 */
export function sequence(beats: Beat[]): () => void {
  const ordered = [...beats].sort((a, b) => a.at - b.at);

  if (reduced) {
    for (const beat of ordered) beat.run();
    return () => undefined;
  }

  const timers = ordered.map((beat) => setTimeout(beat.run, beat.at));
  return () => {
    for (const timer of timers) clearTimeout(timer);
  };
}
