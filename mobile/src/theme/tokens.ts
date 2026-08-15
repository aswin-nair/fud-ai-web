/**
 * The single source of truth for every visual constant in the app.
 *
 * Tokens are named by role, not by colour, so a rebrand touches this file only.
 * No other file may contain a hex value, a font size, or a border radius.
 */

export const palette = {
  light: {
    // Nutrition semantics — one job each, never reused
    onTrack: '#16C47F', // primary CTA, ring fill, success
    onTrackDeep: '#0E9A5F', // the 4px button shadow face
    onTrackSoft: '#7FE0B5', // over-budget overflow arc — NOT a warning
    streak: '#FF6B35', // flame, streak card only
    protein: '#4A9DFF',
    carbs: '#FFB020',
    fat: '#C77DFF',
    xp: '#4A9DFF', // aliases protein deliberately; XP is informational

    // Destructive only. Never a nutrition state. See §2.4
    danger: '#FF5A5A',
    dangerDeep: '#D63E3E',

    // Surfaces
    background: '#F7F8FA',
    surface: '#FFFFFF',
    track: '#F0F1F5', // empty progress track
    border: '#E6E8EE',

    // Text
    textPrimary: '#26262B',
    textSecondary: '#5F5F68',
    textMuted: '#8A8A94',
    textOnFill: '#FFFFFF',

    // Tinted card backgrounds
    tintStreak: '#FFF4EE',
    tintOnTrack: '#E9FAF3',
  },
  dark: {
    onTrack: '#1FD98C',
    onTrackDeep: '#12A86B',
    onTrackSoft: '#4FA982',
    streak: '#FF7F4F',
    protein: '#6BAFFF',
    carbs: '#FFC24D',
    fat: '#D49BFF',
    xp: '#6BAFFF',
    danger: '#FF7070',
    dangerDeep: '#C93B3B',
    background: '#121316',
    surface: '#1C1E22',
    track: '#2A2D33',
    border: '#2F323A',
    textPrimary: '#F2F3F5',
    textSecondary: '#B0B3BB',
    textMuted: '#7E828C',
    textOnFill: '#FFFFFF',
    tintStreak: '#3A211605',
    tintOnTrack: '#12251D',
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
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** radius.sm is the minimum on any surface. Square corners are off-brand. */
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const motion = {
  press: 100, // button depress
  fill: 600, // ring and macro bar fills
  sheet: 260, // bottom sheet
  celebrate: 900, // confetti, badge pop
} as const;

export type ColorScheme = keyof typeof palette;
export type Colors = (typeof palette)[ColorScheme];
export type ColorToken = keyof Colors;
export type TypeVariant = Exclude<keyof typeof type, 'size'>;
export type SizeToken = keyof (typeof type)['size'];
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
