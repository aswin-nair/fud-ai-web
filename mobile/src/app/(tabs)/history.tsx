import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { Card } from '@/components/primitives/Card';
import { Screen } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import {
  getEntriesForDate,
  getTotalsInRange,
  type DailyTotal,
  type EntryWithFood,
} from '@/db/queries/entries';
import {
  addMonths,
  firstWeekdayOfMonth,
  monthDays,
  monthLabel,
  monthOf,
  toLocalDate,
  type LocalDate,
} from '@/logic/dates';
import { useProfileStore } from '@/stores/profileStore';
import { useTheme } from '@/theme/useTheme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const CELL_RATIO = 1 / 7;
const DOT = 6;

export default function History() {
  const theme = useTheme();
  const timezone = useProfileStore((s) => s.timezone)();
  const today = toLocalDate(new Date(), timezone);

  const [month, setMonth] = useState(monthOf(today));
  const [totals, setTotals] = useState<DailyTotal[]>([]);
  const [selected, setSelected] = useState<LocalDate | null>(today);
  const [entries, setEntries] = useState<EntryWithFood[]>([]);

  const days = monthDays(month);
  const first = days[0] as LocalDate;
  const last = days[days.length - 1] as LocalDate;

  const load = useCallback(() => {
    void getTotalsInRange(first, last)
      .then(setTotals)
      .catch(() => undefined);
  }, [first, last]);

  useFocusEffect(load);

  const logged = new Set(totals.filter((row) => row.entryCount > 0).map((row) => row.localDate));

  function choose(date: LocalDate) {
    setSelected(date);
    void getEntriesForDate(date)
      .then(setEntries)
      .catch(() => undefined);
  }

  const leadingBlanks = firstWeekdayOfMonth(month);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          padding: theme.space.lg,
          paddingBottom: theme.space.xxl,
        }}
      >
        {/* Consistency is the headline, not average calories or a weight
            trend. What gets shown is what gets optimised. */}
        <Card tint="onTrack">
          <Text color="textSecondary" variant="label">
            Days logged in {monthLabel(month)}
          </Text>
          <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: theme.space.sm }}>
            <Text variant="hero">{logged.size}</Text>
            <Text color="textMuted" variant="label">
              of {days.length}
            </Text>
          </View>
        </Card>

        <View style={{ gap: theme.space.md }}>
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Pressable
              accessibilityLabel="Previous month"
              accessibilityRole="button"
              hitSlop={theme.space.md}
              onPress={() => setMonth(addMonths(month, -1))}
            >
              <Icon color="textSecondary" name="chevronLeft" />
            </Pressable>

            <Text variant="subtitle">{monthLabel(month)}</Text>

            <Pressable
              accessibilityLabel="Next month"
              accessibilityRole="button"
              hitSlop={theme.space.md}
              onPress={() => setMonth(addMonths(month, 1))}
            >
              <Icon color="textSecondary" name="chevronRight" />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row' }}>
            {WEEKDAYS.map((day, i) => (
              <View key={i} style={{ alignItems: 'center', width: `${CELL_RATIO * 100}%` }}>
                <Text color="textMuted" variant="caption">
                  {day}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <View key={`blank-${i}`} style={{ width: `${CELL_RATIO * 100}%` }} />
            ))}

            {days.map((date) => (
              <DayCell
                date={date}
                isSelected={date === selected}
                isToday={date === today}
                key={date}
                logged={logged.has(date)}
                onPress={() => choose(date)}
              />
            ))}
          </View>
        </View>

        {selected ? (
          <View style={{ gap: theme.space.sm }}>
            <Text color="textSecondary" variant="label">
              {selected}
            </Text>
            {entries.length === 0 ? (
              <Card>
                <Text color="textSecondary" variant="body">
                  Nothing logged on this day.
                </Text>
              </Card>
            ) : (
              <Card style={{ gap: theme.space.md }}>
                {entries.map((entry) => (
                  <View
                    key={entry.id}
                    style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                  >
                    <Text style={{ flex: 1 }} numberOfLines={1} variant="body">
                      {entry.foodName ?? entry.customName ?? 'Entry'}
                    </Text>
                    <Text color="textSecondary" variant="label">
                      {Math.round(entry.kcal)} kcal
                    </Text>
                  </View>
                ))}
              </Card>
            )}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function DayCell({
  date,
  logged,
  isToday,
  isSelected,
  onPress,
}: {
  date: LocalDate;
  logged: boolean;
  isToday: boolean;
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const day = Number(date.slice(8));

  return (
    <Pressable
      accessibilityLabel={date}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={{
        alignItems: 'center',
        gap: theme.space.xs,
        paddingVertical: theme.space.sm,
        width: `${CELL_RATIO * 100}%`,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: isSelected ? theme.colors.onTrack : 'transparent',
          borderColor: isToday ? theme.colors.onTrack : 'transparent',
          borderRadius: theme.radius.pill,
          borderWidth: 1,
          height: 32,
          justifyContent: 'center',
          width: 32,
        }}
      >
        <Text color={isSelected ? 'textOnFill' : 'textPrimary'} variant="caption">
          {day}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: logged ? theme.colors.onTrack : 'transparent',
          borderRadius: theme.radius.pill,
          height: DOT,
          width: DOT,
        }}
      />
    </Pressable>
  );
}
