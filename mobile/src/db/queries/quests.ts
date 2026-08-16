import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { quests, type Quest } from '@/db/schema';
import { type LocalDate } from '@/logic/dates';
import { questForDate, questSpecFromStored, type QuestSpec } from '@/logic/quests';

/**
 * The row for a day, creating it on first open. `questForDate` is deterministic
 * in the date, so a row that already exists is returned untouched rather than
 * regenerated — that is what keeps the quest stable across relaunches.
 */
export async function getOrCreateQuest(date: LocalDate): Promise<Quest> {
  const existing = await db.select().from(quests).where(eq(quests.localDate, date)).limit(1);
  if (existing[0]) return existing[0];

  const spec = questForDate(date);

  const [row] = await db
    .insert(quests)
    .values({ localDate: date, type: spec.type, target: spec.target, progress: 0 })
    .returning();

  return row as Quest;
}

/**
 * `beforeHour` is re-derived rather than stored. The stored type remains a
 * plain string for upgrade compatibility; legacy `hit_protein` rows are
 * translated into a safe logging quest by the pure domain helper.
 */
export function specOf(row: Quest): QuestSpec {
  return questSpecFromStored(row.localDate, row.type, row.target);
}

/**
 * Returns whether this call is the one that completed the quest, so the caller
 * can award the points and fire the confetti exactly once.
 */
export async function setQuestProgress(
  id: number,
  progress: number,
  completed: boolean,
  commitCompletion: boolean,
): Promise<{ newlyCompleted: boolean }> {
  const rows = await db.select().from(quests).where(eq(quests.id, id)).limit(1);
  const row = rows[0];
  if (!row) return { newlyCompleted: false };

  const wasComplete = row.completedAt !== null;
  const newlyCompleted = !wasComplete && completed && commitCompletion;

  await db
    .update(quests)
    .set({
      progress,
      // Once completed, the timestamp stays put. Deleting an entry may walk the
      // progress bar back, but it does not claw back a finished quest. A
      // progress-only sync cannot stamp a new completion before a real log.
      completedAt: row.completedAt ?? (newlyCompleted ? new Date().toISOString() : null),
    })
    .where(eq(quests.id, id));

  return { newlyCompleted };
}
