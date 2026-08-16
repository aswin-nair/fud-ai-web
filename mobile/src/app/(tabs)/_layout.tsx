import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/icons/Icon';
import { useTheme } from '@/theme/useTheme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.onTrack,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: theme.type.body,
          fontSize: theme.type.size.caption,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', tabBarIcon: icon('home') }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarIcon: icon('history') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'You', tabBarIcon: icon('profile') }}
      />
    </Tabs>
  );
}

function icon(name: IconName) {
  return function TabIcon({ focused }: { focused: boolean }) {
    return <Icon color={focused ? 'onTrack' : 'textMuted'} name={name} size={24} />;
  };
}
