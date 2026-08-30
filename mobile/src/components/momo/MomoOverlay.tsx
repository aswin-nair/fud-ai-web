import { pokeAct } from '@fud-ai/product';
import { usePathname } from 'expo-router';
import { useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';

import { Text } from '@/components/primitives/Text';
import { useApp } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';
import { Momo } from './Momo';

export function MomoOverlay() {
  const theme = useTheme();
  const { state } = useApp();
  const path = usePathname();
  const [line, setLine] = useState<string | null>(null);
  const pokes = useRef(0)
  const [reduced, setReduced] = useState(false)

  AccessibilityInfo.isReduceMotionEnabled().then(setReduced)

  if (state.gamification.mascotActivity === 'off') return null
  if (path.includes('insights')) return null

  const mood = state.profile.trackingPaused
    ? 'neutral'
    : state.foodEntries.length === 0
      ? 'sleepy'
      : 'curious'

  return (
    <View pointerEvents="box-none" style={{ bottom: 96, position: 'absolute', right: 16, zIndex: 20 }}>
      {line ? (
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            bottom: 96,
            maxWidth: 200,
            padding: 10,
            position: 'absolute',
            right: 0,
          }}
        >
          <Text variant="caption">{line}</Text>
        </View>
      ) : null}
      <Pressable
        accessibilityLabel="Momo"
        onPress={() => {
          pokes.current += 1
          const act = pokeAct(pokes.current)
          setLine(act.line)
          setTimeout(() => setLine(null), reduced ? 0 : 3200)
        }}
      >
        <Momo mood={mood} size={88} />
      </Pressable>
    </View>
  )
}
