export const APP_LOCK_ENABLED_VALUE = 'enabled-v1';

// Expo LocalAuthentication's documented numeric security levels. Keeping the
// policy in a native-free module makes the security decisions unit-testable.
export const DEVICE_SECURITY_LEVEL = {
  none: 0,
  secret: 1,
  biometricWeak: 2,
  biometricStrong: 3,
} as const;

export type AppLockCapability =
  | { available: true }
  | {
      available: false;
      reason: 'no-hardware' | 'not-enrolled' | 'not-strong';
    };

export function evaluateAppLockCapability(input: {
  hasHardware: boolean;
  isEnrolled: boolean;
  enrolledSecurityLevel: number;
}): AppLockCapability {
  if (!input.hasHardware) {
    return { available: false, reason: 'no-hardware' };
  }

  if (!input.isEnrolled) {
    return { available: false, reason: 'not-enrolled' };
  }

  if (input.enrolledSecurityLevel < DEVICE_SECURITY_LEVEL.biometricStrong) {
    return { available: false, reason: 'not-strong' };
  }

  return { available: true };
}

export type AppLockPreference = 'off' | 'on' | 'invalid';

export function parseAppLockPreference(value: string | null): AppLockPreference {
  if (value === null) return 'off';
  if (value === APP_LOCK_ENABLED_VALUE) return 'on';
  return 'invalid';
}

export function shouldAutomaticallyPrompt(input: {
  enabled: boolean;
  locked: boolean;
  busy: boolean;
  appIsActive: boolean;
  alreadyAttempted: boolean;
}): boolean {
  return (
    input.enabled &&
    input.locked &&
    !input.busy &&
    input.appIsActive &&
    !input.alreadyAttempted
  );
}

export type AuthenticationFailure = {
  message: string;
  recoveryAllowed: boolean;
};

/**
 * Converts native result codes into deliberate, non-technical copy. Only a
 * device configuration that cannot authenticate permits resetting the lock;
 * cancellation, mismatch, timeout and temporary lockout never become bypasses.
 */
export function describeAuthenticationFailure(error: string): AuthenticationFailure {
  if (error === 'user_cancel' || error === 'app_cancel' || error === 'system_cancel') {
    return {
      message: 'Device authentication was cancelled. Try again when you are ready.',
      recoveryAllowed: false,
    };
  }

  if (error === 'authentication_failed') {
    return {
      message: 'Device authentication did not match. Try again.',
      recoveryAllowed: false,
    };
  }

  if (error === 'lockout') {
    return {
      message:
        'Device authentication is temporarily locked. Use the device passcode if it is offered, or try again later.',
      recoveryAllowed: false,
    };
  }

  if (error === 'timeout') {
    return {
      message: 'The authentication prompt timed out. Try again.',
      recoveryAllowed: false,
    };
  }

  if (
    error === 'not_available' ||
    error === 'not_enrolled' ||
    error === 'passcode_not_set' ||
    error === 'invalid_context'
  ) {
    return {
      message:
        'Device authentication is no longer available. You can retry after checking device settings or turn off this app lock.',
      recoveryAllowed: true,
    };
  }

  return {
    message: 'Device authentication could not finish. Try again.',
    recoveryAllowed: false,
  };
}
