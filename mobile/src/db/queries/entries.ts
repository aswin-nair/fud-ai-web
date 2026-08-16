import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  foods,
  mealEntries,
  type MealEntry,
  type MealSlot,
  type NewMealEntry,
} from '@/db/schema';
import { toLocalDate, type LocalDate } from '@/logic/dates';

export type LogEntryInput = {
  foodId?: number | null;
  customName?: string | null;
  servings: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  mealSlot: MealSlot;
  /** The profile's timezone, never the device's. */
  timezone: string;
  loggedAt?: Date;
};

/**
 * `local_date` is resolved here, at write time, from the profile timezone.
 * Deriving it on read would reassign past entries to different days the moment
 * the user travels, which would silently rewrite their streak.
 */
export async function logEntry(input: LogEntryInput): Promise<MealEntry> {
  const loggedAt = input.loggedAt ?? new Date();

  const values: NewMealEntry = {
    foodId: input.foodId ?? null,
    customName: input.customName ?? null,
    servings: input.servings,
    kcal: input.kcal,
    proteinG: input.proteinG,
    carbsG: input.carbsG,
    fatG: input.fatG,
    mealSlot: input.mealSlot,
    loggedAtUtc: loggedAt.toISOString(),
    localDate: toLocalDate(loggedAt, input.timezone),
  };

  const [row] = await db.insert(mealEntries).values(values).returning();

  if (input.foodId != null) {
    await db
      .update(foods)
      .set({ lastUsedAt: values.loggedAtUtc })
      .where(eq(foods.id, input.foodId));
  }

  return row as MealEntry;
}

export type EntryWithFood = MealEntry & { foodName: string | null };

export async function getEntriesForDate(date: LocalDate): Promise<EntryWithFood[]> {
  const rows = await db
    .select({
      entry: mealEntries,
      foodName: foods.name,
    })
    .from(mealEntries)
    .leftJoin(foods, eq(mealEntries.foodId, foods.id))
    .where(eq(mealEntries.localDate, date))
    .orderBy(desc(mealEntries.loggedAtUtc));

  return rows.map((row) => ({ ...row.entry, foodName: row.foodName }));
}

export async function getEntry(id: number): Promise<MealEntry | null> {
  const rows = await db.select().from(mealEntries).where(eq(mealEntries.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateEntry(
  id: number,
  values: Partial<NewMealEntry>,
): Promise<MealEntry> {
  const [row] = await db
    .update(mealEntries)
    .set(values)
    .where(eq(mealEntries.id, id))
    .returning();

  return row as MealEntry;
}

export async function deleteEntry(id: number): Promise<void> {
  await db.delete(mealEntries).where(eq(mealEntries.id, id));
}

export type DayTotals = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  entryCount: number;
};

const ZERO: DayTotals = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, entryCount: 0 };

export async function getTotalsForDate(date: LocalDate): Promise<DayTotals> {
  const [row] = await db
    .select({
      kcal: sql<number>`coalesce(sum(${mealEntries.kcal}), 0)`,
      proteinG: sql<number>`coalesce(sum(${mealEntries.proteinG}), 0)`,
      carbsG: sql<number>`coalesce(sum(${mealEntries.carbsG}), 0)`,
      fatG: sql<number>`coalesce(sum(${mealEntries.fatG}), 0)`,
      entryCount: sql<number>`count(*)`,
    })
    .from(mealEntries)
    .where(eq(mealEntries.localDate, date));

  return row ?? ZERO;
}

/** Distinct days with at least one entry, newest first. Feeds deriveStreak. */
export async function getLoggedDates(): Promise<LocalDate[]> {
  const rows = await db
    .selectDistinct({ localDate: mealEntries.localDate })
    .from(mealEntries)
    .orderBy(desc(mealEntries.localDate));

  return rows.map((row) => row.localDate);
}

export type DailyTotal = { localDate: LocalDate; kcal: number; entryCount: number };

/** Per-day totals across an inclusive range, for the History screen. */
export async function getTotalsInRange(
  from: LocalDate,
  to: LocalDate,
): Promise<DailyTotal[]> {
  return db
    .select({
      localDate: mealEntries.localDate,
      kcal: sql<number>`coalesce(sum(${mealEntries.kcal}), 0)`,
      entryCount: sql<number>`count(*)`,
    })
    .from(mealEntries)
    .where(and(gte(mealEntries.localDate, from), lte(mealEntries.localDate, to)))
    .groupBy(mealEntries.localDate)
    .orderBy(mealEntries.localDate);
}
