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
 * NEDA is deliberately absent. The current US entry is the National Alliance
 * for Eating Disorders, whose helpline is staffed by licensed clinicians.
 */
const HELPLINES: Helpline[] = [
  {
    region: 'United States',
    organisation: 'National Alliance for Eating Disorders',
    detail: 'Licensed eating-disorder therapists, weekdays 9am–7pm ET.',
    phone: '1-866-662-1235',
    url: 'https://www.allianceforeatingdisorders.com',
  },
  {
    region: 'England',
    organisation: 'Beat',
    detail:
      'Phone and webchat, weekdays 3pm–8pm. The site lists separate lines for Scotland, Wales and Northern Ireland.',
    phone: '0808 801 0677',
    url: 'https://www.beateatingdisorders.org.uk/get-information-and-support/get-help-for-myself/support-now/',
  },
  {
    region: 'Canada',
    organisation: 'NEDIC',
    detail: 'Phone, chat and email support from trained helpline staff.',
    phone: '1-866-633-4220',
    url: 'https://nedic.ca/hey-there/',
  },
  {
    region: 'Australia',
    organisation: 'Butterfly Foundation',
    detail:
      'Qualified counsellors, seven days a week, 8am–midnight Australian Eastern time.',
    phone: '1800 33 4673',
    url: 'https://butterfly.org.au/get-support/helpline/',
  },
  {
    region: 'Elsewhere',
    organisation: 'Academy for Eating Disorders',
    detail: 'Search its international professional directory by country.',
    url: 'https://community.aedweb.org/expert-directory',
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
          want it to, that is worth talking to someone about. The helplines are
          free and confidential; the directory can help you find local support.
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
