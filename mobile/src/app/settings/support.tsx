import { Linking, ScrollView, View } from 'react-native';

import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/useTheme';

type Helpline = {
  region: string;
  organisation: string;
  detail: string;
  phone?: string;
  url: string;
};

/**
 * NEDA is deliberately absent. Its helpline was retired and the number is no
 * longer answered, so linking it would send someone in difficulty to a dead
 * line. §2.8 names the National Alliance for Eating Disorders for the US.
 */
const HELPLINES: Helpline[] = [
  {
    region: 'United States',
    organisation: 'National Alliance for Eating Disorders',
    detail: 'Staffed by licensed therapists, weekdays.',
    phone: '1-866-662-1235',
    url: 'https://www.allianceforeatingdisorders.com',
  },
  {
    region: 'United Kingdom',
    organisation: 'Beat',
    detail: 'Helpline open every day of the year.',
    phone: '0808 801 0677',
    url: 'https://www.beateatingdisorders.org.uk',
  },
  {
    region: 'Canada',
    organisation: 'NEDIC',
    detail: 'National Eating Disorder Information Centre.',
    phone: '1-866-633-4220',
    url: 'https://nedic.ca',
  },
  {
    region: 'Australia',
    organisation: 'Butterfly Foundation',
    detail: 'Support for eating disorders and body image.',
    phone: '1800 33 4673',
    url: 'https://butterfly.org.au',
  },
  {
    region: 'Elsewhere',
    organisation: 'Academy for Eating Disorders',
    detail: 'A directory of services by country.',
    url: 'https://www.aedweb.org',
  },
];

export default function Support() {
  const theme = useTheme();

  return (
    <Screen>
      <ScreenHeader title="Support" />

      <ScrollView
        contentContainerStyle={{
          gap: theme.space.lg,
          padding: theme.space.lg,
          paddingBottom: theme.space.xxl,
        }}
      >
        <Text color="textSecondary" variant="body">
          If counting is starting to take up more room in your head than you
          want it to, that is worth talking to someone about. These are free and
          confidential.
        </Text>

        {HELPLINES.map((line) => (
          <Card key={line.region} style={{ gap: theme.space.sm }}>
            <Text color="textMuted" variant="caption">
              {line.region}
            </Text>
            <Text variant="subtitle">{line.organisation}</Text>
            <Text color="textSecondary" variant="body">
              {line.detail}
            </Text>

            <View style={{ gap: theme.space.sm, marginTop: theme.space.sm }}>
              {line.phone ? (
                <PressableButton
                  fullWidth
                  label={`Call ${line.phone}`}
                  onPress={() => {
                    void Linking.openURL(`tel:${line.phone?.replace(/\s/g, '')}`);
                  }}
                  variant="secondary"
                />
              ) : null}
              <PressableButton
                fullWidth
                label="Open website"
                onPress={() => {
                  void Linking.openURL(line.url);
                }}
                variant="secondary"
              />
            </View>
          </Card>
        ))}

        <Text color="textMuted" variant="caption">
          This app is a habit tracker, not a clinical tool, and it cannot tell
          how you are doing. A person can.
        </Text>
      </ScrollView>
    </Screen>
  );
}
