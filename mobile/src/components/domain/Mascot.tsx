import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Momo, type MomoMood } from '@/components/momo/Momo';
import { useTheme } from '@/theme/useTheme';

/**
 * There is deliberately no sad or disappointed state. Missing a day is not a
 * failure the app is allowed to editorialise about — see §2.3.
 */
export type MascotState =
  | 'idle'
  | 'happy'
  | 'celebrating'
  | 'sleeping'
  | 'thinking'
  | 'waving';

export type MascotProps = {
  state?: MascotState;
  size?: number;
};

const DEFAULT_SIZE = 96;

const MOOD_BY_STATE: Record<MascotState, MomoMood> = {
  celebrating: 'excited',
  happy: 'cozy',
  idle: 'neutral',
  sleeping: 'sleepy',
  thinking: 'curious',
  waving: 'proud',
};

export function Mascot({ state = 'idle', size = DEFAULT_SIZE }: MascotProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();

  const bob = useSharedValue(0);
  const tilt = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      bob.value = 0;
      tilt.value = 0;
      return;
    }

    switch (state) {
      case 'celebrating':
        bob.value = withRepeat(withTiming(-1, { duration: theme.motion.pulseAtRisk / 2 }), -1, true);
        tilt.value = 0;
        break;
      case 'waving':
        bob.value = 0;
        tilt.value = withRepeat(withTiming(1, { duration: theme.motion.pulseAtRisk / 2 }), -1, true);
        break;
      case 'happy':
        bob.value = withRepeat(withTiming(-1, { duration: theme.motion.pulseAtRisk }), -1, true);
        tilt.value = 0;
        break;
      case 'sleeping':
        bob.value = withRepeat(withTiming(-1, { duration: theme.motion.pulse * 1.5 }), -1, true);
        tilt.value = 0;
        break;
      default:
        bob.value = withRepeat(withTiming(-1, { duration: theme.motion.pulse }), -1, true);
        tilt.value = 0;
    }

    return () => {
      cancelAnimation(bob);
      cancelAnimation(tilt);
    };
  }, [bob, reducedMotion, state, theme.motion.pulse, theme.motion.pulseAtRisk, tilt]);

  const amplitude = state === 'celebrating' ? 6 : 3;

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value * amplitude },
      { rotate: `${tilt.value * 8 + (state === 'thinking' ? -6 : 0)}deg` },
    ],
  }));

  return (
    <Animated.View style={[{ height: size, width: size }, animated]}>
      <Momo mood={MOOD_BY_STATE[state]} size={size} />
    </Animated.View>
  );
}
