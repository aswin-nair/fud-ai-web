import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      {/* No gesture and no header: the age gate must have no way back into
          the flow. See §2.2. */}
      <Stack.Screen name="blocked" options={{ gestureEnabled: false }} />
      <Stack.Screen name="activity" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="pace" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
