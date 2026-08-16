import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * Three cues, no more. §11.2 is explicit that sound is reserved for the moments
 * worth marking — everything else stays silent.
 *
 * Enablement is pushed in rather than read from the store, so this module stays
 * free of React and can be called from a sequence that outlives its screen.
 * Mirrors the shape of `feel/haptics.ts` deliberately.
 */
export type Cue = 'logConfirm' | 'questComplete' | 'streakMilestone';

// Relative rather than aliased: these resolve through Metro's asset pipeline,
// which does not read the tsconfig path mapping.
const SOURCES: Record<Cue, number> = {
  logConfirm: require('../../assets/sounds/log-confirm.wav'),
  questComplete: require('../../assets/sounds/quest-complete.wav'),
  streakMilestone: require('../../assets/sounds/streak-milestone.wav'),
};

let enabled = true;

/** Players are built on first use and kept — recreating one per cue stutters. */
const players = new Map<Cue, AudioPlayer>();

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

export function soundEnabled(): boolean {
  return enabled;
}

/**
 * Configures the session so the hardware mute switch silences the app.
 * `playsInSilentMode: false` is the whole point — a calorie app that chirps in
 * a meeting because someone logged lunch is a reason to uninstall it.
 */
export async function initSound(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });
  } catch {
    // An unconfigurable audio session is not worth blocking startup over.
  }
}

/** Fire and forget. A cue that fails must never interrupt an interaction. */
export function play(cue: Cue): void {
  if (!enabled) return;
  void playAsync(cue).catch(() => undefined);
}

async function playAsync(cue: Cue): Promise<void> {
  let player = players.get(cue);

  if (!player) {
    player = createAudioPlayer(SOURCES[cue]);
    players.set(cue, player);
  }

  // Rewind first: the same player is reused, and a finished one sits at its end.
  await player.seekTo(0);
  player.play();
}

/** Releases every player. The root layout calls this on teardown. */
export function releaseSound(): void {
  for (const player of players.values()) {
    try {
      player.remove();
    } catch {
      // Already gone.
    }
  }
  players.clear();
}
