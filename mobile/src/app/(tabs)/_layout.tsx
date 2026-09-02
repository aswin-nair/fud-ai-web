import { router, Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { Text } from '@/components/primitives/Text';
import { useApp } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';

export default function TabsLayout() {
  const theme = useTheme();
  const { guest } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.onTrack,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: guest
          ? { display: 'none' }
          : {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              height: 72 + insets.bottom,
              paddingBottom: insets.bottom,
            },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: icon('insights') }} />
      <Tabs.Screen
        name="log-fab"
        options={{
          title: 'Log',
          tabBarButton: () => (
            <Pressable
              accessibilityLabel="Log a meal"
              accessibilityHint="Opens all meal logging options"
              accessibilityRole="button"
              onPress={() => router.push('/log' as never)}
              style={{ alignItems: 'center', justifyContent: 'center', marginTop: -16 }}
            >
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor: theme.colors.onTrack,
                  borderRadius: 28,
                  height: 56,
                  justifyContent: 'center',
                  width: 56,
                }}
              >
                <Icon color="textOnPrimary" name="plus" size={26} />
              </View>
              <Text color="onTrack" variant="caption">Log</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="discover" options={{ title: 'Saved', tabBarIcon: icon('discover') }} />
      <Tabs.Screen name="you" options={{ title: 'You', tabBarIcon: icon('profile') }} />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

function icon(name: IconName) {
  return function TabIcon({ focused }: { focused: boolean }) {
    return <Icon color={focused ? 'onTrack' : 'textMuted'} name={name} size={24} />;
  };
}
