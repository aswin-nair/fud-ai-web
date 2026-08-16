import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Every haptic in the app goes through here, so `profile.haptics_enabled` is
 * honoured in one place rather than checked at each call site — a missed check
 * is exactly the kind of thing that makes a setting feel broken.
 *
 * Enablement is pushed in rather than read from the store, so this module stays
 * free of React and can be called from anywhere, including a worklet callback.
 */
let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

export function hapticsEnabled(): boolean {
  return enabled;
}

/** Web has no haptics API worth calling; the vibration API is a blunt buzz. */
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

function guard(run: () => Promise<void>): void {
  if (!enabled || !supported) return;

  // Haptics failing is never worth interrupting an interaction over.
  void run().catch(() => undefined);
}

/** Button press. The lightest tap available — this fires many times a day. */
export function tapLight(): void {
  guard(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Stepper increments and chip selection. */
export function tapSelection(): void {
  guard(() => Haptics.selectionAsync());
}

/** An entry landed. Slightly weightier than a press, still not a jolt. */
export function confirm(): void {
  guard(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/**
 * Quest completion and streak milestones. Deliberately the same success cue as
 * `confirm` — §2.4 rules out anything that reads as a warning, and there is no
 * error haptic anywhere in the app.
 */
export function celebrate(): void {
  guard(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}
