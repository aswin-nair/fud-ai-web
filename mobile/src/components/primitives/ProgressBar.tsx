import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { type ColorToken } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export type ProgressBarProps = {
  accessibilityLabel: string;
  value: number;
  max: number;
  color: ColorToken;
  height?: number;
  /** Set to render the amount past `max` as a second segment instead of clamping. */
  overflowColor?: ColorToken;
  /** Held before the fill starts, so a group of bars can stagger. §11.3. */
  delay?: number;
  style?: ViewStyle;
};

/**
 * Splits the bar into a filled portion and an optional overflow portion.
 * Past `max` the two share the full width proportionally, so going over is
 * visible rather than silently clamped.
 */
function fractions(value: number, max: number) {
  if (max <= 0 || value <= 0) return { base: 0, over: 0 };

  const filled = Math.min(value, max);
  const over = Math.max(value - max, 0);
  const denominator = Math.max(value, max);

  return { base: filled / denominator, over: over / denominator };
}

export function ProgressBar({
  accessibilityLabel,
  value,
  max,
  color,
  height = 10,
  overflowColor,
  delay = 0,
  style,
}: ProgressBarProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const target = fractions(value, max);

  // Seeded with the current value so a freshly mounted bar renders at its
  // real position instead of animating up from empty.
  const base = useSharedValue(target.base);
  const over = useSharedValue(target.over);

  useEffect(() => {
    if (reducedMotion) {
      base.value = target.base;
      over.value = target.over;
      return;
    }
    base.value = withDelay(delay, withTiming(target.base, { duration: theme.motion.fill }));
    over.value = withDelay(delay, withTiming(target.over, { duration: theme.motion.fill }));
  }, [base, over, target.base, target.over, delay, reducedMotion, theme.motion.fill]);

  const baseStyle = useAnimatedStyle(() => ({ width: `${base.value * 100}%` }));
  const overStyle = useAnimatedStyle(() => ({ width: `${over.value * 100}%` }));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max,
        now: Math.min(max, Math.max(0, value)),
        text: `${value} of ${max}`,
      }}
      style={[
        {
          backgroundColor: theme.colors.track,
          borderRadius: theme.radius.pill,
          flexDirection: 'row',
          height,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[{ backgroundColor: theme.colors[color] }, baseStyle]} />
      {overflowColor ? (
        <Animated.View
          style={[{ backgroundColor: theme.colors[overflowColor] }, overStyle]}
        />
      ) : null}
    </View>
  );
}
