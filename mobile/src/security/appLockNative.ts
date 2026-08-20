import { Platform } from 'react-native';

import {
  APP_LOCK_ENABLED_VALUE,
  evaluateAppLockCapability,
  parseAppLockPreference,
  type AppLockCapability,
} from './appLockPolicy';

const APP_LOCK_KEY = 'fud.app-lock.enabled.v1';

type LocalAuthenticationResult =
  | { success: true }
  | { success: false; error: string; warning?: string };

type LocalAuthenticationModule = {
  authenticateAsync: (options: {
    biometricsSecurityLevel: 'strong';
    cancelLabel: string;
    disableDeviceFallback: false;
    fallbackLabel: string;
    promptDescription: string;
    promptMessage: string;
  }) => Promise<LocalAuthenticationResult>;
  getEnrolledLevelAsync: () => Promise<number>;
  hasHardwareAsync: () => Promise<boolean>;
  isEnrolledAsync: () => Promise<boolean>;
};

type SecureStoreModule = {
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: number;
  deleteItemAsync: (key: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  isAvailableAsync: () => Promise<boolean>;
  setItemAsync: (
    key: string,
    value: string,
    options: { keychainAccessible: number },
  ) => Promise<void>;
};

let cachedModules:
  | {
      localAuthentication: LocalAuthenticationModule;
      secureStore: SecureStoreModule;
    }
  | undefined;

function nativeModules() {
  if (!cachedModules) {
    // Static literal requires remain visible to Metro while keeping the pure
    // policy tests independent from native modules.
    cachedModules = {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      localAuthentication: require('expo-local-authentication') as LocalAuthenticationModule,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      secureStore: require('expo-secure-store') as SecureStoreModule,
    };
  }

  return cachedModules;
}

export function isNativeAppLockPlatform(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

export async function isSecureAppLockStorageAvailable(): Promise<boolean> {
  if (!isNativeAppLockPlatform()) return false;
  return nativeModules().secureStore.isAvailableAsync();
}

export async function readAppLockEnabled(): Promise<boolean> {
  const { secureStore } = nativeModules();
  const value = await secureStore.getItemAsync(APP_LOCK_KEY);
  const preference = parseAppLockPreference(value);

  // Unknown data could be a newer lock policy after a downgrade. Failing the
  // read keeps the cover on and lets the user make the recovery decision.
  if (preference === 'invalid') {
    throw new Error('Invalid app-lock preference');
  }

  return preference === 'on';
}

export async function writeAppLockEnabled(): Promise<void> {
  const { secureStore } = nativeModules();
  await secureStore.setItemAsync(APP_LOCK_KEY, APP_LOCK_ENABLED_VALUE, {
    // The preference is local to this installation/device and available only
    // while iOS is unlocked. Android ignores this iOS-specific option.
    keychainAccessible: secureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearAppLockEnabled(): Promise<void> {
  if (!isNativeAppLockPlatform()) return;
  await nativeModules().secureStore.deleteItemAsync(APP_LOCK_KEY);
}

export async function getAppLockCapability(): Promise<AppLockCapability> {
  const { localAuthentication } = nativeModules();
  const [hasHardware, isEnrolled, enrolledSecurityLevel] = await Promise.all([
    localAuthentication.hasHardwareAsync(),
    localAuthentication.isEnrolledAsync(),
    localAuthentication.getEnrolledLevelAsync(),
  ]);

  return evaluateAppLockCapability({ hasHardware, isEnrolled, enrolledSecurityLevel });
}

export async function authenticateForAppLock(): Promise<LocalAuthenticationResult> {
  return nativeModules().localAuthentication.authenticateAsync({
    biometricsSecurityLevel: 'strong',
    cancelLabel: 'Cancel',
    // The operating system can offer the device passcode after biometric
    // failures. Fud AI never receives that passcode.
    disableDeviceFallback: false,
    fallbackLabel: 'Use device passcode',
    promptDescription: 'Confirm it is you to view your local food log.',
    promptMessage: 'Unlock Fud AI',
  });
}
