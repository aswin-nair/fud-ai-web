import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';

import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/useTheme';
import { calorieProgress } from '@fud-ai/domain/nutrition';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type CalorieRingProps = {
  consumed: number;
  target: number;
  size?: number;
};

const DEFAULT_SIZE = 140;
const STROKE_RATIO = 0.1;

/**
 * Going over target draws a second arc in onTrackSoft on top of the first.
 * It is a lighter tint of the same green, never a warning colour — see §2.4.
 */
export function CalorieRing({ consumed, target, size = DEFAULT_SIZE }: CalorieRingProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();

  const strokeWidth = size * STROKE_RATIO;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const centre = size / 2;

  const { progress, overflow, isOver, remaining, overBy } = calorieProgress(consumed, target);
  const valueText = isOver
    ? `${Math.round(consumed)} of ${Math.round(target)} kilocalories, ${overBy} over`
    : `${Math.round(consumed)} of ${Math.round(target)} kilocalories, ${remaining} left`;

  const fill = useSharedValue(progress);
  const over = useSharedValue(overflow);

  useEffect(() => {
    if (reducedMotion) {
      fill.value = progress;
      over.value = overflow;
      return;
    }
    fill.value = withTiming(progress, { duration: theme.motion.fill });
    over.value = withTiming(overflow, { duration: theme.motion.fill });
  }, [fill, over, progress, overflow, reducedMotion, theme.motion.fill]);

  const fillProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - fill.value),
  }));

  const overProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - over.value),
  }));

  return (
    <View
      accessible
      accessibilityLabel="Calories consumed"
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: Math.round(target),
        now: Math.min(Math.round(consumed), Math.round(target)),
        text: valueText,
      }}
      style={{ height: size, width: size }}
    >
      <Svg height={size} width={size}>
        {/* Rotated so the arc starts at 12 o'clock rather than 3. */}
        <G transform={`rotate(-90 ${centre} ${centre})`}>
          <Circle
            cx={centre}
            cy={centre}
            fill="none"
            r={radius}
            stroke={theme.colors.track}
            strokeWidth={strokeWidth}
          />
          <AnimatedCircle
            animatedProps={fillProps}
            cx={centre}
            cy={centre}
            fill="none"
            r={radius}
            stroke={theme.colors.onTrack}
            strokeDasharray={circumference}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
          {isOver ? (
            <AnimatedCircle
              animatedProps={overProps}
              cx={centre}
              cy={centre}
              fill="none"
              r={radius}
              stroke={theme.colors.onTrackSoft}
              strokeDasharray={circumference}
              strokeLinecap="round"
              strokeWidth={strokeWidth}
            />
          ) : null}
        </G>
      </Svg>

      <View
        pointerEvents="none"
        style={{
          alignItems: 'center',
          bottom: 0,
          justifyContent: 'center',
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      >
        <Text variant="display" color={isOver ? 'textSecondary' : 'textPrimary'}>
          {isOver ? overBy : remaining}
        </Text>
        <Text variant="label" color={isOver ? 'textSecondary' : 'textMuted'}>
          {isOver ? 'kcal over' : 'kcal left'}
        </Text>
      </View>
    </View>
  );
}
