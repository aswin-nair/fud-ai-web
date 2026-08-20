import { and, asc, eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { mealEntries, profile, syncOutbox, syncState } from '@/db/schema'
import type { EntityMutation } from '@fud-ai/contracts'
import { nextAttemptAt, type OutboxRow, type OutboxStatus } from '@/sync/outboxPolicy'

export async function hasLocalProductData(): Promise<boolean> {
  const [profileRows, mealRows] = await Promise.all([
    db.select({ id: profile.id }).from(profile).limit(1),
    db.select({ id: mealEntries.id }).from(mealEntries).limit(1),
  ])
  return Boolean(profileRows[0] || mealRows[0])
}

export async function readSyncCursor(userId: string): Promise<number> {
  const rows = await db.select().from(syncState).where(eq(syncState.userId, userId)).limit(1)
  return rows[0]?.cursor ?? 0
}

export async function enqueueMutation(mutation: EntityMutation, userId: string): Promise<void> {
  const now = new Date().toISOString()
  await db
    .insert(syncOutbox)
    .values({
      mutationId: mutation.mutationId,
      userId,
      deviceId: mutation.deviceId,
      kind: mutation.kind,
      entityJson: JSON.stringify(mutation.entity),
      baseCursor: mutation.baseCursor,
      queuedAt: now,
      attemptCount: 0,
      nextAttemptAt: now,
      lastError: null,
      ackedCursor: null,
      status: 'pending',
    })
    .onConflictDoNothing({ target: syncOutbox.mutationId })
}

export async function listOutbox(userId: string): Promise<OutboxRow[]> {
  const rows = await db
    .select()
    .from(syncOutbox)
    .where(eq(syncOutbox.userId, userId))
    .orderBy(asc(syncOutbox.queuedAt), asc(syncOutbox.id))

  return rows.map((row) => ({
    mutationId: row.mutationId,
    userId: row.userId,
    status: row.status,
    entityJson: row.entityJson,
    nextAttemptAt: row.nextAttemptAt,
    attemptCount: row.attemptCount,
  }))
}

export async function markOutboxStatus(
  mutationId: string,
  status: OutboxStatus,
  extra: { lastError?: string | null; ackedCursor?: number | null } = {},
): Promise<void> {
  const now = new Date()
  await db
    .update(syncOutbox)
    .set({
      status,
      lastError: extra.lastError ?? null,
      ackedCursor: extra.ackedCursor ?? null,
      nextAttemptAt: status === 'pending' ? nextAttemptAt(now, 1) : now.toISOString(),
    })
    .where(eq(syncOutbox.mutationId, mutationId))
}

export async function markOutboxRetry(mutationId: string, attemptCount: number, error: string): Promise<void> {
  const now = new Date()
  await db
    .update(syncOutbox)
    .set({
      status: 'pending',
      attemptCount,
      lastError: error,
      nextAttemptAt: nextAttemptAt(now, attemptCount),
    })
    .where(eq(syncOutbox.mutationId, mutationId))
}

export async function markOutboxAcked(userId: string, mutationId: string, cursor: number): Promise<void> {
  const now = new Date().toISOString()
  await db
    .update(syncOutbox)
    .set({
      status: 'acked',
      ackedCursor: cursor,
      lastError: null,
    })
    .where(and(eq(syncOutbox.mutationId, mutationId), eq(syncOutbox.userId, userId)))

  const existing = await db.select().from(syncState).where(eq(syncState.userId, userId)).limit(1)
  if (existing[0]) {
    await db
      .update(syncState)
      .set({ cursor: Math.max(existing[0].cursor, cursor), lastAckAt: now, lastError: null })
      .where(eq(syncState.userId, userId))
    return
  }
  const device = await db.select().from(syncOutbox).where(eq(syncOutbox.userId, userId)).limit(1)
  await db.insert(syncState).values({
    userId,
    deviceId: device[0]?.deviceId ?? 'unknown-device',
    cursor,
    lastAckAt: now,
    lastError: null,
  })
}

export async function deleteSyncOutbox(): Promise<void> {
  await db.delete(syncOutbox)
}

export async function deleteSyncState(): Promise<void> {
  await db.delete(syncState)
}
