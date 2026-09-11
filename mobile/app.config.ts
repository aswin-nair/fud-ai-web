import type { ExpoConfig } from 'expo/config';

// Explicit extension: the Expo config loader requires this import untranspiled,
// so it resolves through Node's native TypeScript support.
import { brand, palette } from './src/theme/tokens.ts';

/**
 * TypeScript config rather than app.json so the splash and adaptive-icon
 * colours read from the same tokens as the app, keeping tokens.ts the only
 * place a hex value is written.
 */
const config: ExpoConfig = {
  name: 'Poiem',
  slug: 'fud-ai',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/poiem/icon.png',
  scheme: 'fudai',
  userInterfaceStyle: 'automatic',
  ios: {
    buildNumber: '1',
    bundleIdentifier: 'com.fudai.mobile',
    infoPlist: {
      // There is no approved iCloud restore path for the nutrition database.
      // Runtime code also marks Documents/SQLite excluded from backup.
      UIFileSharingEnabled: false,
      NSCameraUsageDescription: 'Poiem uses the camera so you can log a meal from a photo.',
      NSPhotoLibraryUsageDescription: 'Poiem can use a library photo when you choose to log from one.',
      NSUserNotificationsUsageDescription: 'Optional logging reminders. At most two a day, never about calories.',
    },
    usesAppleSignIn: true,
    config: {
      // SecureStore uses the operating-system keychain/keystore. Poiem does
      // not ship a custom, non-exempt encryption implementation.
      usesNonExemptEncryption: false,
    },
    icon: './assets/poiem/icon.png',
  },
  android: {
    // The local SQLite log can contain health-adjacent data. Keep it out of
    // Android/Google Drive Auto Backup; export/sync must be an explicit flow.
    allowBackup: false,
    adaptiveIcon: {
      backgroundColor: brand.accent,
      foregroundImage: './assets/poiem/adaptive-foreground.png',
      monochromeImage: './assets/poiem/adaptive-monochrome.png',
    },
    package: 'com.fudai.mobile',
    permissions: [
      'android.permission.CAMERA',
      'android.permission.POST_NOTIFICATIONS',
    ],
    predictiveBackGestureEnabled: false,
    versionCode: 1,
  },
  web: {
    output: 'static',
    favicon: './assets/poiem/icon.png',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    'expo-audio',
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Allow Poiem to use Face ID to unlock the app.',
      },
    ],
    [
      'expo-secure-store',
      {
        configureAndroidBackup: true,
        faceIDPermission: 'Allow Poiem to use Face ID to unlock the app.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: palette.light.background,
        image: './assets/poiem/splash.png',
        imageWidth: 76,
        dark: {
          backgroundColor: palette.dark.background,
          image: './assets/poiem/icon.png',
        },
      },
    ],
  ],
  extra: {
    // Leave unset. Mobile account and entity sync stay fail-closed.
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
    eas: {
      projectId: 'fe3317de-ab58-4e1a-a633-3f2f25c65c23',
    },
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
