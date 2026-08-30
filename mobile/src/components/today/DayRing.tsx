import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { DayRingProgress } from '@fud-ai/product';

import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/useTheme';

export function DayRing({ progress }: { progress: DayRingProgress }) {
  const theme = useTheme();
  const size = 132;
  const rings = [
    { arc: progress.arcs[0], color: theme.colors.onTrack, radius: 54 },
    { arc: progress.arcs[1], color: theme.colors.protein, radius: 40 },
    { arc: progress.arcs[2], color: theme.colors.carbs, radius: 26 },
  ];

  return (
    <View style={{ alignItems: 'center', gap: theme.space.sm }}>
      <View style={{ height: size, width: size }}>
        <Svg height={size} width={size}>
          {rings.map(ring => {
            const circ = 2 * Math.PI * ring.radius;
            return (
              <Circle
                key={ring.arc.id}
                cx={size / 2}
                cy={size / 2}
                fill="none"
                r={ring.radius}
                stroke={ring.arc.required ? ring.color : theme.colors.track}
                strokeDasharray={`${circ * ring.arc.value} ${circ}`}
                strokeLinecap="round"
                strokeWidth={8}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
        </Svg>
        <View style={{ alignItems: 'center', inset: 0, justifyContent: 'center', position: 'absolute' }}>
          <Text variant="title">
            {progress.complete ? 'Day made' : `${progress.requiredComplete}/${progress.requiredTotal}`}
          </Text>
        </View>
      </View>
      {progress.arcs.filter(arc => arc.required).map(arc => (
        <Text key={arc.id} color="textSecondary" variant="caption">
          {arc.label}
        </Text>
      ))}
    </View>
  );
}
