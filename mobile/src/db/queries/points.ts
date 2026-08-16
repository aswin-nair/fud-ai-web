import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { pointsLedger, type PointsEntry } from '@/db/schema';
import { type LocalDate } from '@/logic/dates';
import { POINTS, type PointsReason } from '@/logic/points';

/** Append-only: rows are inserted and never updated, so the total is auditable. */
export async function awardPoints(
  reason: PointsReason,
  localDate: LocalDate,
): Promise<PointsEntry> {
  const [row] = await db
    .insert(pointsLedger)
    .values({ delta: POINTS[reason], reason, localDate })
    .returning();

  return row as PointsEntry;
}

export async function getTotalPoints(): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${pointsLedger.delta}), 0)` })
    .from(pointsLedger);

  return row?.total ?? 0;
}

export async function getPointsForDate(localDate: LocalDate): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${pointsLedger.delta}), 0)` })
    .from(pointsLedger)
    .where(eq(pointsLedger.localDate, localDate));

  return row?.total ?? 0;
}

/** Guards once-per-day awards such as first_log_of_day. */
export async function hasAwarded(
  reason: PointsReason,
  localDate: LocalDate,
): Promise<boolean> {
  const rows = await db
    .select({ id: pointsLedger.id })
    .from(pointsLedger)
    .where(and(eq(pointsLedger.reason, reason), eq(pointsLedger.localDate, localDate)))
    .limit(1);

  return rows.length > 0;
}

export async function getRecentAwards(limit = 20): Promise<PointsEntry[]> {
  return db.select().from(pointsLedger).orderBy(desc(pointsLedger.id)).limit(limit);
}
