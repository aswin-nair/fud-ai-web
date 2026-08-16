import { desc, isNull, like, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { streakFreezes, type StreakFreeze } from '@/db/schema';
import { monthOf, type LocalDate } from '@/logic/dates';

/**
 * One free freeze per calendar month, granted automatically and never sold.
 * §2.8 treats it as an off-ramp, so it must not be gated behind a purchase or
 * an engagement condition.
 */
export async function grantMonthlyFreezeIfDue(today: LocalDate): Promise<StreakFreeze | null> {
  const month = monthOf(today);

  const [existing] = await db
    .select({ n: sql<number>`count(*)` })
    .from(streakFreezes)
    .where(like(streakFreezes.grantedLocalDate, `${month}-%`));

  if ((existing?.n ?? 0) > 0) return null;

  const [row] = await db
    .insert(streakFreezes)
    .values({ grantedLocalDate: today, consumedLocalDate: null })
    .returning();

  return row as StreakFreeze;
}

export async function getAvailableFreeze(): Promise<StreakFreeze | null> {
  const rows = await db
    .select()
    .from(streakFreezes)
    .where(isNull(streakFreezes.consumedLocalDate))
    .limit(1);

  return rows[0] ?? null;
}

export async function countAvailableFreezes(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(streakFreezes)
    .where(isNull(streakFreezes.consumedLocalDate));

  return row?.n ?? 0;
}

/** Dates a freeze was spent on. Fed straight into deriveStreak. */
export async function getConsumedFreezeDates(): Promise<LocalDate[]> {
  const rows = await db
    .select({ date: streakFreezes.consumedLocalDate })
    .from(streakFreezes)
    .where(sql`${streakFreezes.consumedLocalDate} is not null`)
    .orderBy(desc(streakFreezes.consumedLocalDate));

  return rows.map((row) => row.date as LocalDate);
}

export async function consumeFreeze(
  freezeId: number,
  onDate: LocalDate,
): Promise<void> {
  await db
    .update(streakFreezes)
    .set({ consumedLocalDate: onDate })
    .where(sql`${streakFreezes.id} = ${freezeId}`);
}
