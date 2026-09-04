import { COSMETICS, equipCosmetic } from '@fud-ai/product'
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { SettingRow } from '@/components/primitives/SettingRow';
import { Text } from '@/components/primitives/Text';
import { useApp } from '@/state/AppProvider';
import { loggingStreak } from '@/state/journey';
import { useTheme } from '@/theme/useTheme';

export default function You() {
  const theme = useTheme();
  const { state, setMascotActivity, setFeel, setPaused, setProfile, replaceState } = useApp();
  const streak = loggingStreak(state.foodEntries, state.gamification);
  const mascotVisible = state.gamification.mascotActivity !== 'off';

  return (
    <Screen>
      <ScreenHeader showBack={false} title="You" />
      <ScrollView contentContainerStyle={{ gap: theme.space.lg, padding: theme.space.lg, paddingBottom: 120 }}>
        <Card>
          <Text variant="subtitle">{streak} day streak</Text>
          <Text color="textSecondary">{state.gamification.streakFreezes} freezes ready</Text>
        </Card>
        <Card>
          <Text variant="subtitle">Momo</Text>
          <Text color="textSecondary">Never sad, never scoring your food.</Text>
          <SettingRow
            detail="Keep your companion around the app"
            kind="toggle"
            label="Show Momo"
            onValueChange={(value) => setMascotActivity(value ? 'lively' : 'off')}
            value={mascotVisible}
          />
          {mascotVisible ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {(['lively', 'calm'] as const).map(level => (
                <PressableButton
                  key={level}
                  label={level}
                  onPress={() => setMascotActivity(level)}
                  variant={state.gamification.mascotActivity === level ? 'primary' : 'secondary'}
                />
              ))}
            </View>
          ) : null}
          <SettingRow
            detail="Keep the antics, silence the speech bubbles"
            kind="toggle"
            label="Mute Momo"
            onValueChange={(mascotMuted) => setProfile({ mascotMuted })}
            value={state.profile.mascotMuted === true}
          />
          <SettingRow
            detail="Stop roaming and decorative gestures"
            kind="toggle"
            label="Reduce Momo motion"
            onValueChange={(mascotReducedMotion) => setProfile({ mascotReducedMotion })}
            value={state.profile.mascotReducedMotion === true}
          />
        </Card>
        <Card>
          <Text variant="subtitle">Wardrobe</Text>
          {COSMETICS.map(item => (
            <SettingRow
              key={item.id}
              kind="navigate"
              label={item.name}
              onPress={() => {
                const next = equipCosmetic(state.gamification, item.id, streak)
                if (next) replaceState({ ...state, gamification: next })
              }}
            />
          ))}
        </Card>
        <SettingRow
          kind="toggle"
          label="Sound"
          onValueChange={(value) => setFeel(value, state.profile.hapticsEnabled ?? true)}
          value={state.profile.soundEnabled ?? true}
        />
        <SettingRow
          kind="toggle"
          label="Haptics"
          onValueChange={(value) => setFeel(state.profile.soundEnabled ?? true, value)}
          value={state.profile.hapticsEnabled ?? true}
        />
        <SettingRow
          kind="toggle"
          label="Pause tracking"
          onValueChange={setPaused}
          value={Boolean(state.profile.trackingPaused)}
        />
        <PressableButton label="Support" onPress={() => router.push('/settings/support')} variant="secondary" />
        <PressableButton label="Coach" onPress={() => router.push('/coach' as never)} variant="secondary" />
        <PressableButton label="Account" onPress={() => router.push('/login' as never)} variant="secondary" />
        <PressableButton label="App lock" onPress={() => router.push('/settings/app-lock' as never)} variant="secondary" />
      </ScrollView>
    </Screen>
  );
}
