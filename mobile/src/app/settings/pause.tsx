import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Mascot } from '@/components/domain/Mascot';
import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { useProfileStore } from '@/stores/profileStore';
import { useTheme } from '@/theme/useTheme';

/**
 * An off-ramp, per §2.8. Pausing is offered plainly and costs nothing: the
 * streak is held rather than lost, so stepping away is not punished.
 */
export default function Pause() {
  const theme = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const update = useProfileStore((s) => s.update);

  if (!profile) return null;

  const paused = profile.trackingPaused;

  async function toggle() {
    await update({ trackingPaused: !paused });
    router.back();
  }

  return (
    <Screen>
      <ScreenHeader title="Pause tracking" />

      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          padding: theme.space.lg,
          paddingBottom: theme.space.xxl,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Mascot size={120} state={paused ? 'sleeping' : 'idle'} />
        </View>

        <Text align="center" variant="title">
          {paused ? 'Tracking is paused' : 'Take as long as you need'}
        </Text>

        <Card style={{ gap: theme.space.md }}>
          <Text variant="subtitle">While paused</Text>
          <Bullet text="Calorie, macro, and weight numbers are hidden." />
          <Bullet text="Your streak is held exactly where it is, indefinitely." />
          <Bullet text="No notifications, of any kind." />
          <Bullet text="Nothing is deleted. It is all here when you come back." />
        </Card>

        <PressableButton
          fullWidth
          label={paused ? 'Turn tracking back on' : 'Pause tracking'}
          onPress={() => void toggle()}
          variant={paused ? 'primary' : 'secondary'}
        />

        <Text align="center" color="textMuted" variant="caption">
          There is no limit on this and no streak penalty for using it.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Bullet({ text }: { text: string }) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
      <Text color="textMuted" variant="body">
        ·
      </Text>
      <Text color="textSecondary" style={{ flex: 1 }} variant="body">
        {text}
      </Text>
    </View>
  );
}
