import { describe, expect, it } from 'vitest';

import {
  APP_LOCK_ENABLED_VALUE,
  describeAuthenticationFailure,
  evaluateAppLockCapability,
  parseAppLockPreference,
  shouldAutomaticallyPrompt,
} from './appLockPolicy';

describe('app lock capability policy', () => {
  it('requires hardware, enrollment and a strong biometric', () => {
    expect(
      evaluateAppLockCapability({
        hasHardware: false,
        isEnrolled: false,
        enrolledSecurityLevel: 0,
      }),
    ).toEqual({ available: false, reason: 'no-hardware' });

    expect(
      evaluateAppLockCapability({
        hasHardware: true,
        isEnrolled: false,
        enrolledSecurityLevel: 0,
      }),
    ).toEqual({ available: false, reason: 'not-enrolled' });

    expect(
      evaluateAppLockCapability({
        hasHardware: true,
        isEnrolled: true,
        enrolledSecurityLevel: 2,
      }),
    ).toEqual({ available: false, reason: 'not-strong' });

    expect(
      evaluateAppLockCapability({
        hasHardware: true,
        isEnrolled: true,
        enrolledSecurityLevel: 3,
      }),
    ).toEqual({ available: true });
  });
});

describe('app lock preference parsing', () => {
  it('defaults off, accepts the exact value, and surfaces unknown data', () => {
    expect(parseAppLockPreference(null)).toBe('off');
    expect(parseAppLockPreference('true')).toBe('invalid');
    expect(parseAppLockPreference('enabled-v0')).toBe('invalid');
    expect(parseAppLockPreference(APP_LOCK_ENABLED_VALUE)).toBe('on');
  });
});

describe('automatic app-lock prompt policy', () => {
  it('prompts once only while an enabled lock is active and covered', () => {
    expect(
      shouldAutomaticallyPrompt({
        enabled: true,
        locked: true,
        busy: false,
        appIsActive: true,
        alreadyAttempted: false,
      }),
    ).toBe(true);
  });

  it('never opens an authentication prompt while the app is backgrounded', () => {
    expect(
      shouldAutomaticallyPrompt({
        enabled: true,
        locked: true,
        busy: false,
        appIsActive: false,
        alreadyAttempted: false,
      }),
    ).toBe(false);
  });

  it('does not create a retry loop after cancellation', () => {
    expect(
      shouldAutomaticallyPrompt({
        enabled: true,
        locked: true,
        busy: false,
        appIsActive: true,
        alreadyAttempted: true,
      }),
    ).toBe(false);
  });
});

describe('app lock authentication failures', () => {
  it.each(['user_cancel', 'authentication_failed', 'timeout', 'lockout', 'unknown'])(
    'does not turn %s into a reset path',
    (error) => {
      expect(describeAuthenticationFailure(error).recoveryAllowed).toBe(false);
    },
  );

  it.each(['not_available', 'not_enrolled', 'passcode_not_set', 'invalid_context'])(
    'allows recovery only when device authentication cannot operate: %s',
    (error) => {
      expect(describeAuthenticationFailure(error).recoveryAllowed).toBe(true);
    },
  );

  it('does not expose native error text in user copy', () => {
    const nativeCode = 'vendor_secret_internal_failure';
    expect(describeAuthenticationFailure(nativeCode).message).not.toContain(nativeCode);
  });
});
