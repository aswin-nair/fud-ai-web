import type { ExpoConfig } from 'expo/config';

// Explicit extension: the Expo config loader requires this import untranspiled,
// so it resolves through Node's native TypeScript support.
import { palette } from './src/theme/tokens.ts';

/**
 * TypeScript config rather than app.json so the splash and adaptive-icon
 * colours read from the same tokens as the app, keeping tokens.ts the only
 * place a hex value is written.
 */
const config: ExpoConfig = {
  name: 'Fud AI',
  slug: 'fud-ai',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'fudai',
  userInterfaceStyle: 'automatic',
  ios: {
    buildNumber: '1',
    bundleIdentifier: 'com.fudai.mobile',
    infoPlist: {
      // There is no approved iCloud restore path for the nutrition database.
      // Runtime code also marks Documents/SQLite excluded from backup.
      UIFileSharingEnabled: false,
    },
    config: {
      // SecureStore uses the operating-system keychain/keystore. Fud AI does
      // not ship a custom, non-exempt encryption implementation.
      usesNonExemptEncryption: false,
    },
    icon: './assets/expo.icon',
  },
  android: {
    // The local SQLite log can contain health-adjacent data. Keep it out of
    // Android/Google Drive Auto Backup; export/sync must be an explicit flow.
    allowBackup: false,
    adaptiveIcon: {
      backgroundColor: palette.light.background,
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    package: 'com.fudai.mobile',
    predictiveBackGestureEnabled: false,
    versionCode: 1,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    'expo-audio',
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Allow Fud AI to use Face ID to unlock the app.',
      },
    ],
    [
      'expo-secure-store',
      {
        configureAndroidBackup: true,
        faceIDPermission: 'Allow Fud AI to use Face ID to unlock the app.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: palette.light.background,
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
        dark: {
          backgroundColor: palette.dark.background,
          image: './assets/images/splash-icon.png',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
