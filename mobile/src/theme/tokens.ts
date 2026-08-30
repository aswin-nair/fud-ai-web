/**
 * The single source of truth for every visual constant in the app.
 *
 * Tokens are named by role, not by colour, so a rebrand touches this file only.
 * No other file may contain a hex value, a font size, or a border radius.
 */

export const palette = {
  light: {
    // Nutrition semantics — one job each, never reused
    onTrack: '#FF6B4A',
    onTrackDeep: '#DE4526',
    onTrackSoft: '#FFC0A8',
    streak: '#FF6B4A',
    protein: '#4A86FF',
    carbs: '#FFB43D',
    fat: '#57D9A3',
    xp: '#4A86FF',
    herb: '#57D9A3',
    enamel: '#FFF6EC',
    dough: '#FFE9C9',

    // Destructive only. Never a nutrition state. See §2.4
    danger: '#E5484D',
    dangerDeep: '#C13438',

    background: '#FFEFE0',
    surface: '#FFFFFF',
    track: '#F6E3D0',
    border: '#E8D4C2',

    textPrimary: '#241A2E',
    textSecondary: '#6D5C66',
    textMuted: '#A2919A',
    textOnFill: '#FFFFFF',

    tintStreak: '#FFF1E8',
    tintOnTrack: '#FFE8E0',
  },
  dark: {
    onTrack: '#FF9070',
    onTrackDeep: '#DE4526',
    onTrackSoft: '#C47A68',
    streak: '#FF9070',
    protein: '#6BAFFF',
    carbs: '#FFC24D',
    fat: '#57D9A3',
    xp: '#6BAFFF',
    herb: '#57D9A3',
    enamel: '#2A1F24',
    dough: '#3A2A22',
    danger: '#FF7070',
    dangerDeep: '#C93B3B',
    background: '#1A1416',
    surface: '#2A2226',
    track: '#3A3034',
    border: '#4A3E42',
    textPrimary: '#FFF6EC',
    textSecondary: '#D4C4BA',
    textMuted: '#A2919A',
    textOnFill: '#FFFFFF',
    tintStreak: '#3A2116',
    tintOnTrack: '#3A1E18',
  },
} as const;

export const type = {
  display: 'Fredoka_600SemiBold', // numbers, headlines
  title: 'Fredoka_500Medium',
  body: 'NunitoSans_400Regular',
  bodyBold: 'NunitoSans_600SemiBold',
  size: {
    hero: 44,
    display: 32,
    title: 20,
    subtitle: 17,
    body: 15,
    label: 13,
    caption: 11,
  },
  /** Letter-spacing, kept here so no component carries a bare number. */
  tracking: {
    button: 0.4,
  },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** radius.sm is the minimum on any surface. Square corners are off-brand. */
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const motion = {
  press: 100, // button depress
  fill: 600, // ring and macro bar fills
  sheet: 260, // bottom sheet
  celebrate: 900, // confetti, badge pop
  pulse: 2000, // streak badge idle breath
  pulseAtRisk: 700, // streak badge after 18:00 with nothing logged
} as const;

export type ColorScheme = keyof typeof palette;
export type Colors = (typeof palette)[ColorScheme];
export type ColorToken = keyof Colors;
export type FontFamilyToken = Exclude<keyof typeof type, 'size' | 'tracking'>;
export type SizeToken = keyof (typeof type)['size'];
export type TrackingToken = keyof (typeof type)['tracking'];
export type SpaceToken = keyof typeof space;
export type RadiusToken = keyof typeof radius;
export type MotionToken = keyof typeof motion;

/**
 * The four families loaded at startup. Keys match the family names referenced
 * by `type`, so a missing entry here surfaces as a type error rather than a
 * silent fallback to the system font.
 */
export const fontFamilies = [
  type.display,
  type.title,
  type.body,
  type.bodyBold,
] as const;
