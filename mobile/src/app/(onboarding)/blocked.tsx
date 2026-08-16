import { View } from 'react-native';

import { Mascot } from '@/components/domain/Mascot';
import { Card } from '@/components/primitives/Card';
import { Screen } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/useTheme';

/**
 * The age gate. There is deliberately no button on this screen — no continue,
 * no back, no "I entered the wrong date". §2.2 allows no bypass, and any
 * control here would become one.
 */
export default function Blocked() {
  const theme = useTheme();

  return (
    <Screen>
      <View
        style={{
          flex: 1,
          gap: theme.space.xl,
          justifyContent: 'center',
          padding: theme.space.xl,
        }}
      >
        <View style={{ alignItems: 'center', gap: theme.space.lg }}>
          <Mascot size={120} state="thinking" />
          <Text align="center" variant="title">
            This one is built for adults
          </Text>
          <Text align="center" color="textSecondary" variant="body">
            Calorie tracking is not something we are willing to set up for
            someone under 18. Bodies change a lot at that age, and the targets
            this app calculates would not be right for you.
          </Text>
        </View>

        <Card>
          <Text variant="subtitle">A better place to start</Text>
          <Text
            color="textSecondary"
            style={{ marginTop: theme.space.sm }}
            variant="body"
          >
            Talk to a parent, a school nurse, or your doctor. They can look at
            the whole picture, which an app counting numbers on a phone cannot.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
