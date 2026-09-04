import { ScrollView } from 'react-native';

import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { TextField } from '@/components/primitives/TextField';
import { useApp } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';
import { router } from 'expo-router';
import { useState } from 'react';

export default function Coach() {
  const theme = useTheme();
  const { state, replaceState } = useApp();
  const [draft, setDraft] = useState('');

  function send() {
    const text = draft.trim();
    if (!text) return;
    if (/suicid|kill myself|end my life/i.test(text)) {
      router.push('/settings/support');
      return;
    }
    replaceState({
      ...state,
      chatMessages: [
        ...state.chatMessages,
        { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date().toISOString() },
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'I can talk through logging habits. I will not set a target below the safety floors. Add a BYOK key in You for live answers.',
          timestamp: new Date().toISOString(),
        },
      ],
    });
    setDraft('');
  }

  return (
    <Screen>
      <ScreenHeader title="Coach" />
      <ScrollView contentContainerStyle={{ gap: theme.space.md, padding: theme.space.lg }}>
        {state.chatMessages.map(message => (
          <Card key={message.id}>
            <Text variant="caption">{message.role === 'user' ? 'You' : 'Coach'}</Text>
            <Text>{message.content}</Text>
          </Card>
        ))}
        <TextField label="Ask" onChangeText={setDraft} value={draft} />
        <PressableButton label="Send" onPress={send} />
        <PressableButton label="Support" onPress={() => router.push('/settings/support')} variant="secondary" />
      </ScrollView>
    </Screen>
  );
}
