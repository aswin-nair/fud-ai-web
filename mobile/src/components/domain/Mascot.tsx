import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

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
const VIEW_BOX = 100;

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

  const c = theme.colors;

  return (
    <Animated.View style={[{ height: size, width: size }, animated]}>
      <Svg height={size} viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`} width={size}>
        {/* Limbs sit behind the body so every join stays soft. */}
        <Arms state={state} stroke={c.onTrackDeep} />
        <Feet stroke={c.onTrackDeep} />

        <Rect fill={c.onTrack} height={58} rx={24} ry={24} width={56} x={22} y={22} />
        <Ellipse cx={50} cy={54} fill={c.tintOnTrack} rx={21} ry={19} />

        <Eyes state={state} tint={c.textPrimary} />

        <Circle cx={35} cy={60} fill={c.streak} fillOpacity={0.35} r={4} />
        <Circle cx={65} cy={60} fill={c.streak} fillOpacity={0.35} r={4} />

        <Mouth state={state} tint={c.textPrimary} />

        {state === 'sleeping' ? <Zzz tint={c.textMuted} /> : null}
        {state === 'thinking' ? <Thought tint={c.textMuted} /> : null}
        {state === 'celebrating' ? <Sparkles tint={c.carbs} /> : null}
      </Svg>
    </Animated.View>
  );
}

function Arms({ state, stroke }: { state: MascotState; stroke: string }) {
  const common = {
    stroke,
    strokeWidth: 9,
    strokeLinecap: 'round' as const,
    fill: 'none',
  };

  if (state === 'celebrating') {
    return (
      <G>
        <Path d="M28 46 13 32" {...common} />
        <Path d="M72 46 87 32" {...common} />
      </G>
    );
  }

  if (state === 'waving') {
    return (
      <G>
        <Path d="M28 58 14 66" {...common} />
        <Path d="M72 46 88 33" {...common} />
      </G>
    );
  }

  if (state === 'thinking') {
    return (
      <G>
        <Path d="M28 58 14 66" {...common} />
        <Path d="M72 56 82 44" {...common} />
      </G>
    );
  }

  return (
    <G>
      <Path d="M28 56 13 65" {...common} />
      <Path d="M72 56 87 65" {...common} />
    </G>
  );
}

function Feet({ stroke }: { stroke: string }) {
  return (
    <G>
      <Ellipse cx={37} cy={85} fill={stroke} rx={10} ry={6.5} />
      <Ellipse cx={63} cy={85} fill={stroke} rx={10} ry={6.5} />
    </G>
  );
}

function Eyes({ state, tint }: { state: MascotState; tint: string }) {
  const arc = {
    stroke: tint,
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
    fill: 'none',
  };

  if (state === 'sleeping') {
    return (
      <G>
        <Path d="M34 47a6 6 0 0 0 12 0" {...arc} />
        <Path d="M54 47a6 6 0 0 0 12 0" {...arc} />
      </G>
    );
  }

  if (state === 'happy' || state === 'celebrating') {
    return (
      <G>
        <Path d="M34 49a6 6 0 0 1 12 0" {...arc} />
        <Path d="M54 49a6 6 0 0 1 12 0" {...arc} />
      </G>
    );
  }

  if (state === 'thinking') {
    return (
      <G>
        <Circle cx={40} cy={47} fill={tint} r={4.2} />
        <Path d="M54 47a6 6 0 0 1 12 0" {...arc} />
      </G>
    );
  }

  return (
    <G>
      <Circle cx={40} cy={47} fill={tint} r={4.2} />
      <Circle cx={60} cy={47} fill={tint} r={4.2} />
    </G>
  );
}

function Mouth({ state, tint }: { state: MascotState; tint: string }) {
  const line = {
    stroke: tint,
    strokeWidth: 3.5,
    strokeLinecap: 'round' as const,
    fill: 'none',
  };

  if (state === 'celebrating') {
    return <Ellipse cx={50} cy={62} fill={tint} rx={6.5} ry={8} />;
  }

  if (state === 'sleeping') {
    return <Path d="M45 64a5 5 0 0 0 10 0" {...line} />;
  }

  if (state === 'thinking') {
    return <Path d="M45 65h10" {...line} />;
  }

  const width = state === 'happy' ? 9 : 6;
  return <Path d={`M${50 - width} 63a${width} ${width} 0 0 0 ${width * 2} 0`} {...line} />;
}

function Zzz({ tint }: { tint: string }) {
  const line = {
    stroke: tint,
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <G>
      <Path d="M74 22h9l-9 10h9" {...line} />
      <Path d="M87 8h6l-6 7h6" {...line} />
    </G>
  );
}

function Thought({ tint }: { tint: string }) {
  return (
    <G>
      <Circle cx={78} cy={26} fill={tint} fillOpacity={0.35} r={4} />
      <Circle cx={86} cy={16} fill={tint} fillOpacity={0.25} r={6} />
    </G>
  );
}

function Sparkles({ tint }: { tint: string }) {
  const line = {
    stroke: tint,
    strokeWidth: 3.5,
    strokeLinecap: 'round' as const,
    fill: 'none',
  };

  return (
    <G>
      <Path d="M50 12v8M44 16h12" {...line} />
      <Path d="M20 18v6M17 21h6" {...line} />
      <Path d="M82 16v6M79 19h6" {...line} />
    </G>
  );
}
