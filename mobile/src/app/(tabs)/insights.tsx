import { localDayKey } from '@fud-ai/product'
import { ScrollView, View } from 'react-native';

import { Card } from '@/components/primitives/Card';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { useApp } from '@/state/AppProvider';
import { loggingStreak } from '@/state/journey';
import { useTheme } from '@/theme/useTheme';

export default function Insights() {
  const theme = useTheme();
  const { state } = useApp();
  const streak = loggingStreak(state.foodEntries, state.gamification);
  const days = [...new Set(state.foodEntries.map(entry => entry.localDate ?? localDayKey(entry.timestamp)))].sort().reverse();
  const counts = new Map<string, number>();
  for (const entry of state.foodEntries) {
    counts.set(entry.name, (counts.get(entry.name) ?? 0) + 1);
  }
  const mostLogged = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <Screen>
      <ScreenHeader showBack={false} title="Insights" />
      <ScrollView contentContainerStyle={{ gap: theme.space.lg, padding: theme.space.lg }}>
        {state.profile.trackingPaused ? (
          <Card>
            <Text variant="subtitle">Tracking is paused</Text>
            <Text color="textSecondary">Open You to turn numbers back on.</Text>
          </Card>
        ) : (
          <>
            <Card>
              <Text variant="subtitle">Consistency</Text>
              <Text>{days.length} days logged · streak {streak}</Text>
            </Card>
            <Card>
              <Text variant="subtitle">Most logged</Text>
              {mostLogged.length === 0 ? (
                <Text color="textSecondary">Log a few meals and this fills in.</Text>
              ) : mostLogged.map(([name, count]) => (
                <Text key={name}>{name} · {count}</Text>
              ))}
            </Card>
            <Card>
              <Text variant="subtitle">Ticket archive</Text>
              {days.slice(0, 8).map(day => (
                <Text key={day} color="textSecondary">{day}</Text>
              ))}
            </Card>
          </>
        )}
        <View />
      </ScrollView>
    </Screen>
  );
}
