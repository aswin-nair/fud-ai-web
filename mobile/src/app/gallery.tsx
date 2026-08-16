import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalorieRing } from '@/components/domain/CalorieRing';
import { MacroGroup } from '@/components/domain/MacroGroup';
import { Mascot, type MascotState } from '@/components/domain/Mascot';
import { MealRow } from '@/components/domain/MealRow';
import { QuestCard } from '@/components/domain/QuestCard';
import { StreakBadge } from '@/components/domain/StreakBadge';
import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { ProgressBar } from '@/components/primitives/ProgressBar';
import { Sheet } from '@/components/primitives/Sheet';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/useTheme';

const MASCOT_STATES: MascotState[] = [
  'idle',
  'happy',
  'celebrating',
  'sleeping',
  'thinking',
  'waving',
];

/**
 * Phase 2 and 3 scratch screen, not product UI. It exists to exercise every
 * primitive, domain component and variant on a device. Phase 5 replaces this
 * route with Home.
 *
 * The one-primary-button-per-screen rule is a product rule; a gallery has to
 * show all three variants side by side.
 */
export default function Gallery() {
  const theme = useTheme();
  const [progress, setProgress] = useState(40);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [consumed, setConsumed] = useState(1250);
  const [questStep, setQuestStep] = useState(1);

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.background, flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          padding: theme.space.lg,
          paddingBottom: theme.space.xxl,
        }}
      >
        <Section title="Type scale">
          <Text variant="hero">Hero 44</Text>
          <Text variant="display">Display 32</Text>
          <Text variant="title">Title 20</Text>
          <Text variant="subtitle">Subtitle 17</Text>
          <Text variant="body">Body 15 carries reading text.</Text>
          <Text variant="label" color="textSecondary">
            Label 13
          </Text>
          <Text variant="caption" color="textMuted">
            Caption 11
          </Text>
        </Section>

        <Section title="Buttons">
          <PressableButton label="Log a meal" onPress={() => setReason(null)} />
          <PressableButton
            variant="secondary"
            label="Add food"
            onPress={() => setReason(null)}
          />
          <PressableButton
            variant="destructive"
            label="Delete entry"
            onPress={() => setReason(null)}
          />
          <PressableButton label="Saving" loading />
          <PressableButton label="Log it" fullWidth />

          <PressableButton
            variant="secondary"
            label="Save changes"
            onPress={() => setReason('Enter a serving size between 0 and 20 first.')}
          />
          {reason ? (
            <Text variant="label" color="textSecondary">
              {reason}
            </Text>
          ) : null}

          <Text variant="caption" color="textMuted">
            Disabled is shown for completeness. Prefer the inline reason above.
          </Text>
          <PressableButton variant="secondary" label="Unavailable" disabled />
        </Section>

        <Section title="Cards">
          <Card>
            <Text variant="subtitle">Surface</Text>
            <Text variant="body" color="textSecondary">
              Hairline border, no drop shadow.
            </Text>
          </Card>
          <Card tint="streak">
            <Text variant="subtitle">Streak tint</Text>
          </Card>
          <Card tint="onTrack">
            <Text variant="subtitle">On-track tint</Text>
          </Card>
        </Section>

        <Section title="Progress">
          <Text variant="label" color="textSecondary">
            {progress} of 100
          </Text>
          <ProgressBar value={progress} max={100} color="onTrack" />
          <PressableButton
            variant="secondary"
            label={progress === 40 ? 'Animate to 70' : 'Animate to 40'}
            onPress={() => setProgress((n) => (n === 40 ? 70 : 40))}
          />

          <Text variant="label" color="textSecondary">
            120 of 100, overflow segment
          </Text>
          <ProgressBar value={120} max={100} color="onTrack" overflowColor="onTrackSoft" />

          <Text variant="label" color="textSecondary">
            Macro colours
          </Text>
          <ProgressBar value={82} max={140} color="protein" />
          <ProgressBar value={210} max={260} color="carbs" />
          <ProgressBar value={48} max={70} color="fat" />
        </Section>

        <Section title="Sheet">
          <PressableButton
            variant="secondary"
            label="Open the sheet"
            onPress={() => setSheetOpen(true)}
          />
        </Section>

        <Section title="Calorie ring">
          <View style={{ alignItems: 'center' }}>
            <CalorieRing consumed={consumed} target={2000} />
          </View>
          <PressableButton
            variant="secondary"
            label={`Consumed ${consumed} — cycle`}
            onPress={() =>
              setConsumed((n) => (n === 1250 ? 1900 : n === 1900 ? 2350 : 1250))
            }
          />
          <Text variant="caption" color="textMuted">
            Past 2000 a second arc appears in onTrackSoft and the label reads
            &ldquo;kcal over&rdquo;. No warning colour, no icon.
          </Text>
        </Section>

        <Section title="Macros">
          <Card>
            <MacroGroup
              consumed={{ protein: 82, carbs: 210, fat: 48 }}
              target={{ protein: 140, carbs: 260, fat: 70 }}
            />
          </Card>
        </Section>

        <Section title="Streak badge">
          <View style={{ alignItems: 'flex-start', gap: theme.space.md }}>
            <StreakBadge atRisk={false} count={12} />
            <Text variant="caption" color="textMuted">
              At-risk pulse, forced to 20:00 with nothing logged:
            </Text>
            <StreakBadge atRisk count={12} />
            <Text variant="caption" color="textMuted">
              Same state at 09:00 stays calm — never nags in the morning:
            </Text>
            <StreakBadge atRisk={false} count={12} />
          </View>
        </Section>

        <Section title="Quests">
          <QuestCard
            current={questStep}
            goal={3}
            icon="plus"
            title="Log three meals"
          />
          <PressableButton
            variant="secondary"
            label="Advance quest"
            onPress={() => setQuestStep((n) => (n >= 3 ? 0 : n + 1))}
          />
        </Section>

        <Section title="Meal rows">
          <Card style={{ overflow: 'hidden', padding: 0 }}>
            <MealRow
              calories={320}
              macros={{ protein: 12, carbs: 54, fat: 6 }}
              name="Oatmeal with berries"
              portion="1 bowl"
            />
            <MealRow
              calories={615}
              macros={{ protein: 44, carbs: 38, fat: 28 }}
              name="Chicken burrito"
              portion="1 large"
            />
          </Card>
          <Text variant="caption" color="textMuted">
            Swipe a row left for edit and delete. Delete asks first.
          </Text>
        </Section>

        <Section title="Mascot">
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.space.lg,
            }}
          >
            {MASCOT_STATES.map((state) => (
              <View key={state} style={{ alignItems: 'center', gap: theme.space.xs }}>
                <Mascot state={state} />
                <Text variant="caption" color="textMuted">
                  {state}
                </Text>
              </View>
            ))}
          </View>
        </Section>
      </ScrollView>

      <Sheet visible={sheetOpen} onDismiss={() => setSheetOpen(false)}>
        <Text variant="title">Pick a portion</Text>
        <Text variant="body" color="textSecondary">
          Swipe down or tap the backdrop to dismiss.
        </Text>
        <PressableButton label="Log it" fullWidth onPress={() => setSheetOpen(false)} />
      </Sheet>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.md }}>
      <Text variant="title" color="textPrimary">
        {title}
      </Text>
      {children}
    </View>
  );
}
