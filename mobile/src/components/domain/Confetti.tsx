import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { type ColorToken } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export type ConfettiProps = {
  /** Flip to true to fire. Flip back to false to re-arm. */
  fire: boolean;
  pieces?: number;
};

const DEFAULT_PIECES = 14;
const PIECE_SIZE = 8;
const SPREAD = 120;
const GRAVITY = 160;

const CONFETTI_COLORS: readonly ColorToken[] = [
  'onTrack',
  'streak',
  'protein',
  'carbs',
  'fat',
  'xp',
];

type Seed = {
  angle: number;
  distance: number;
  spin: number;
  color: ColorToken;
  delay: number;
};

function seededUnit(value: number): number {
  const wave = Math.sin(value * 12.9898) * 43758.5453;
  return wave - Math.floor(wave);
}

/**
 * A burst of tokenised specks. Deliberately not a dependency: the celebration
 * has to obey reduced-motion and the palette, and a stock cannon does neither.
 */
export function Confetti({ fire, pieces = DEFAULT_PIECES }: ConfettiProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  const seeds = useMemo<Seed[]>(
    () =>
      Array.from({ length: pieces }, (_, i) => {
        // Fan upward across a half-circle, biased away from straight down.
        const angle = Math.PI + (Math.PI * (i + 0.5)) / pieces;
        return {
          angle,
          distance: SPREAD * (0.55 + seededUnit(i * 3 + pieces) * 0.45),
          spin: (seededUnit(i * 3 + pieces + 1) - 0.5) * 4,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] as ColorToken,
          delay: seededUnit(i * 3 + pieces + 2) * 0.15,
        };
      }),
    [pieces],
  );

  useEffect(() => {
    if (reducedMotion) return;

    if (fire) {
      progress.value = 0;
      progress.value = withTiming(1, { duration: theme.motion.celebrate });
    } else {
      progress.value = 0;
    }
  }, [fire, progress, reducedMotion, theme.motion.celebrate]);

  if (reducedMotion || !fire) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.centre]}>
      {seeds.map((seed, i) => (
        <Piece key={i} progress={progress} seed={seed} />
      ))}
    </View>
  );
}

function Piece({ seed, progress }: { seed: Seed; progress: SharedValue<number> }) {
  const theme = useTheme();

  const style = useAnimatedStyle(() => {
    const p = Math.max(0, Math.min((progress.value - seed.delay) / (1 - seed.delay), 1));
    const eased = 1 - (1 - p) * (1 - p);

    return {
      opacity: 1 - p * p,
      transform: [
        { translateX: Math.cos(seed.angle) * seed.distance * eased },
        { translateY: Math.sin(seed.angle) * seed.distance * eased + GRAVITY * p * p },
        { rotate: `${seed.spin * p * 360}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors[seed.color],
          borderRadius: theme.radius.sm,
          height: PIECE_SIZE,
          position: 'absolute',
          width: PIECE_SIZE,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center', justifyContent: 'center' },
});
