import { AppState } from 'react-native';
import { create } from 'zustand';

import {
  authenticateForAppLock,
  clearAppLockEnabled,
  getAppLockCapability,
  isNativeAppLockPlatform,
  isSecureAppLockStorageAvailable,
  readAppLockEnabled,
  writeAppLockEnabled,
} from './appLockNative';
import { describeAuthenticationFailure } from './appLockPolicy';

export type AppLockMode =
  | 'loading'
  | 'off'
  | 'on'
  | 'unsupported'
  | 'storage-error'
  | 'session-bypass';

type AppLockState = {
  mode: AppLockMode;
  locked: boolean;
  busy: boolean;
  message: string | null;
  recoveryAllowed: boolean;
  profilePresent: boolean;
  initialize: (profilePresent: boolean) => Promise<void>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  unlock: () => Promise<void>;
  lockForBackground: () => void;
  resetAfterAuthenticationBecameUnavailable: () => Promise<void>;
  continueAfterStorageError: () => void;
  retry: () => Promise<void>;
};

let initializationVersion = 0;

export const useAppLockStore = create<AppLockState>((set, get) => ({
  mode: 'loading',
  locked: true,
  busy: false,
  message: null,
  recoveryAllowed: false,
  profilePresent: false,

  initialize: async (profilePresent) => {
    const version = ++initializationVersion;
    set({
      mode: 'loading',
      locked: profilePresent,
      busy: true,
      message: null,
      recoveryAllowed: false,
      profilePresent,
    });

    if (!isNativeAppLockPlatform()) {
      if (version === initializationVersion) {
        set({ mode: 'unsupported', locked: false, busy: false });
      }
      return;
    }

    // No profile means there is no local log to protect. Clearing here also
    // recovers from an iOS keychain flag that survived an app uninstall while
    // the SQLite database did not.
    if (!profilePresent) {
      try {
        if (await isSecureAppLockStorageAvailable()) {
          await clearAppLockEnabled();
        }
      } catch {
        // There is no user data behind the gate, so a cleanup failure must not
        // block onboarding. A later initialization will retry.
      }

      if (version === initializationVersion) {
        set({ mode: 'off', locked: false, busy: false });
      }
      return;
    }

    try {
      const storageAvailable = await isSecureAppLockStorageAvailable();
      if (version !== initializationVersion) return;

      if (!storageAvailable) {
        set({
          mode: 'unsupported',
          locked: false,
          busy: false,
          message: 'App lock is available only in an installed iOS or Android app.',
        });
        return;
      }

      const enabled = await readAppLockEnabled();
      if (version !== initializationVersion) return;

      set({
        mode: enabled ? 'on' : 'off',
        locked: enabled,
        busy: false,
        message: null,
        recoveryAllowed: false,
      });
    } catch {
      if (version !== initializationVersion) return;
      set({
        mode: 'storage-error',
        locked: true,
        busy: false,
        message:
          'The secure app-lock preference could not be read. Retry, or continue for this session with app lock unavailable.',
        recoveryAllowed: false,
      });
    }
  },

  enable: async () => {
    if (get().busy || !isNativeAppLockPlatform()) return;
    set({ busy: true, message: null, recoveryAllowed: false });

    try {
      if (!(await isSecureAppLockStorageAvailable())) {
        set({
          mode: 'unsupported',
          locked: false,
          busy: false,
          message: 'Secure app-lock storage is not available on this device.',
        });
        return;
      }

      const capability = await getAppLockCapability();
      if (!capability.available) {
        const message = {
          'no-hardware': 'This device does not report a supported biometric sensor.',
          'not-enrolled':
            'Set up Face ID, Touch ID, or a fingerprint in device settings before turning on app lock.',
          'not-strong':
            'The enrolled biometric does not meet the strong security level required by app lock.',
        }[capability.reason];

        set({ mode: 'off', locked: false, busy: false, message });
        return;
      }

      const result = await authenticateForAppLock();
      if (!result.success) {
        const failure = describeAuthenticationFailure(result.error);
        set({
          mode: 'off',
          locked: false,
          busy: false,
          message: failure.message,
          recoveryAllowed: false,
        });
        return;
      }

      await writeAppLockEnabled();
      set({
        mode: 'on',
        locked: AppState.currentState !== 'active',
        busy: false,
        message: 'App lock is on.',
        recoveryAllowed: false,
      });
    } catch {
      set({
        mode: 'off',
        locked: false,
        busy: false,
        message: 'App lock could not be turned on. Check device settings and try again.',
        recoveryAllowed: false,
      });
    }
  },

  disable: async () => {
    if (get().busy || get().mode !== 'on') return;
    set({ busy: true, message: null, recoveryAllowed: false });

    try {
      const result = await authenticateForAppLock();
      if (!result.success) {
        const failure = describeAuthenticationFailure(result.error);
        set({ busy: false, message: failure.message, recoveryAllowed: false });
        return;
      }

      await clearAppLockEnabled();
      set({
        mode: 'off',
        locked: false,
        busy: false,
        message: 'App lock is off.',
        recoveryAllowed: false,
      });
    } catch {
      set({
        busy: false,
        message: 'App lock could not be turned off. Try again.',
        recoveryAllowed: false,
      });
    }
  },

  unlock: async () => {
    const current = get();
    if (current.busy || current.mode !== 'on' || !current.locked) return;
    set({ busy: true, message: null, recoveryAllowed: false });

    try {
      const result = await authenticateForAppLock();
      if (!result.success) {
        const failure = describeAuthenticationFailure(result.error);
        set({
          locked: true,
          busy: false,
          message: failure.message,
          recoveryAllowed: failure.recoveryAllowed,
        });
        return;
      }

      set({
        locked: AppState.currentState !== 'active',
        busy: false,
        message: null,
        recoveryAllowed: false,
      });
    } catch {
      set({
        locked: true,
        busy: false,
        message: 'Device authentication could not start. Try again.',
        recoveryAllowed: false,
      });
    }
  },

  lockForBackground: () => {
    const current = get();
    if (current.mode === 'on' && !current.busy) {
      set({ locked: true, message: null, recoveryAllowed: false });
    }
  },

  resetAfterAuthenticationBecameUnavailable: async () => {
    const current = get();
    if (current.busy || current.mode !== 'on' || !current.recoveryAllowed) return;
    set({ busy: true });

    try {
      await clearAppLockEnabled();
      set({
        mode: 'off',
        locked: false,
        busy: false,
        message: 'App lock was turned off on this device.',
        recoveryAllowed: false,
      });
    } catch {
      set({
        mode: 'storage-error',
        locked: true,
        busy: false,
        message: 'The app-lock preference could not be reset. Retry after restarting the app.',
        recoveryAllowed: false,
      });
    }
  },

  continueAfterStorageError: () => {
    if (get().mode !== 'storage-error') return;
    set({
      mode: 'session-bypass',
      locked: false,
      busy: false,
      message:
        'App lock is unavailable for this session. Restart the app to retry secure storage.',
      recoveryAllowed: false,
    });
  },

  retry: async () => {
    await get().initialize(get().profilePresent);
  },
}));

