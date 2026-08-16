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
  name: 'mobile',
  slug: 'mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'mobile',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: palette.light.background,
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
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
