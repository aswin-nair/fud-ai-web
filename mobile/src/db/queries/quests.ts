import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { quests, type Quest } from '@/db/schema';
import { type LocalDate } from '@/logic/dates';
import { questForDate, type QuestSpec } from '@/logic/quests';

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
 * `beforeHour` is re-derived rather than stored, so a persisted row and a fresh
 * generation always describe the same quest.
 */
export function specOf(row: Quest): QuestSpec {
  const generated = questForDate(row.localDate);

  return {
    type: generated.type,
    target: row.target,
    beforeHour: generated.beforeHour,
  };
}

/**
 * Returns whether this call is the one that completed the quest, so the caller
 * can award the points and fire the confetti exactly once.
 */
export async function setQuestProgress(
  id: number,
  progress: number,
  completed: boolean,
): Promise<{ newlyCompleted: boolean }> {
  const rows = await db.select().from(quests).where(eq(quests.id, id)).limit(1);
  const row = rows[0];
  if (!row) return { newlyCompleted: false };

  const wasComplete = row.completedAt !== null;

  await db
    .update(quests)
    .set({
      progress,
      // Once completed, the timestamp stays put. Deleting an entry may walk the
      // progress bar back, but it does not claw back a finished quest.
      completedAt: row.completedAt ?? (completed ? new Date().toISOString() : null),
    })
    .where(eq(quests.id, id));

  return { newlyCompleted: !wasComplete && completed };
}
