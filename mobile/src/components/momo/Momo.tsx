import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { MomoArtwork } from './MomoArtwork';

export type MomoMood = 'neutral' | 'sleepy' | 'excited' | 'proud' | 'curious' | 'cozy';

export function Momo({ mood, size = 88 }: { mood: MomoMood; size?: number }) {
  return (
    <View style={{ height: size, width: size }}>
      <MomoArtwork size={size} />
      <Svg
        accessible={false}
        height={size}
        pointerEvents="none"
        style={{ left: 0, position: 'absolute', top: 0 }}
        viewBox="0 0 100 100"
        width={size}
      >
        <MoodCue mood={mood} />
      </Svg>
    </View>
  );
}

function MoodCue({ mood }: { mood: MomoMood }) {
  const plum = '#52203F';
  const coral = '#F47C61';
  const line = {
    fill: 'none',
    stroke: plum,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 3.2,
  };

  switch (mood) {
    case 'sleepy':
      return (
        <G>
          <Path d="M72 23h10l-10 11h10" {...line} />
          <Path d="M84 10h7l-7 8h7" {...line} strokeWidth={2.6} />
        </G>
      );
    case 'excited':
      return (
        <G stroke={coral} strokeLinecap="round" strokeWidth={3.5}>
          <Path d="M16 25v8M12 29h8" />
          <Path d="M82 18v10M77 23h10" />
          <Path d="M87 38v6M84 41h6" />
        </G>
      );
    case 'proud':
      return (
        <Path
          d="m15 28 3.2-6.5 3.2 6.5 7.1 1-5.1 5 1.2 7-6.4-3.4-6.4 3.4 1.2-7-5.1-5z"
          fill={coral}
        />
      );
    case 'curious':
      return (
        <G>
          <Circle cx={78} cy={29} fill={plum} fillOpacity={0.3} r={3.5} />
          <Circle cx={86} cy={18} fill={plum} fillOpacity={0.18} r={6} />
          <Path d="M85 15.5c0-2.5 4-2.5 4 0 0 2-2 2-2 4" {...line} strokeWidth={1.8} />
          <Circle cx={87} cy={22} fill={plum} r={1} />
        </G>
      );
    case 'cozy':
      return (
        <G fill={coral}>
          <Path d="M14 31c-6-5-11 4 0 11 11-7 6-16 0-11z" />
          <Path d="M84 25c-4.5-3.8-8.5 3 0 8.5 8.5-5.5 4.5-12.3 0-8.5z" />
        </G>
      );
    default:
      return null;
  }
}
