import { create } from 'zustand';

import { MASCOT_HAPPY_MS } from '@/feel/motion';

/**
 * The transient reaction Home shows after a log lands.
 *
 * It lives in a store rather than in Home's own state because the log flow
 * starts the sequence from the portion modal, which unmounts before the beats
 * finish. Home is the surface; the modal is the trigger.
 */
type FeedbackState = {
  /** True for MASCOT_HAPPY_MS after a log. Drives the mascot beside the ring. */
  happy: boolean;
  cheer: () => void;
};

let timer: ReturnType<typeof setTimeout> | null = null;

export const useFeedbackStore = create<FeedbackState>((set) => ({
  happy: false,

  cheer: () => {
    if (timer) clearTimeout(timer);
    set({ happy: true });

    timer = setTimeout(() => {
      timer = null;
      set({ happy: false });
    }, MASCOT_HAPPY_MS);
  },
}));

/** Callable from the log sequence, which runs outside React. */
export function cheer(): void {
  useFeedbackStore.getState().cheer();
}
