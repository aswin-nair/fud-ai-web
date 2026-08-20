import {
  canAdvanceMigration,
  validateMigrationAttempt,
  type MigrationAttempt,
  type MigrationStage,
} from '@fud-ai/contracts'
import { asRows, getDb } from './db.js'
import { isCanonicalUuid } from './identifiers.js'

export class MigrationConflictError extends Error {
  constructor() {
    super('Migration attempt conflicts with an existing ledger row')
    this.name = 'MigrationConflictError'
  }
}

export async function recordMigrationAttempt(
  userId: string,
  attempt: MigrationAttempt,
): Promise<MigrationAttempt> {
  if (!isCanonicalUuid(userId)) throw new Error('User ID must be a canonical UUID')
  const valid = validateMigrationAttempt(attempt)
  if (!valid.ok) throw new Error(valid.error)
  const sql = getDb()
  const existing = asRows<{
    id: string
    stage: MigrationStage
    idempotency_key: string
  }>(await sql`
    SELECT id, stage, idempotency_key
    FROM migration_attempts
    WHERE user_id = ${userId}::uuid
      AND (id = ${attempt.migrationId}::uuid OR idempotency_key = ${attempt.idempotencyKey})
    LIMIT 1
  `)
  const row = existing[0]
  if (row) {
    if (row.id !== attempt.migrationId || row.idempotency_key !== attempt.idempotencyKey) {
      throw new MigrationConflictError()
    }
    if (!canAdvanceMigration(row.stage, attempt.stage)) throw new MigrationConflictError()
    await sql`
      UPDATE migration_attempts
      SET stage = ${attempt.stage},
          discovered_count = ${attempt.counts.discovered},
          accepted_count = ${attempt.counts.accepted},
          rejected_count = ${attempt.counts.rejected},
          reconciled_count = ${attempt.counts.reconciled},
          source_checksum = ${attempt.sourceChecksum},
          accepted_checksum = ${attempt.acceptedChecksum},
          last_attempt_at = NOW(),
          completed_at = CASE
            WHEN ${attempt.stage} IN ('complete', 'confirmed', 'rolled_back', 'failed')
            THEN COALESCE(completed_at, NOW())
            ELSE completed_at
          END,
          confirmed_at = CASE
            WHEN ${attempt.stage} = 'confirmed' THEN COALESCE(confirmed_at, NOW())
            ELSE confirmed_at
          END
      WHERE user_id = ${userId}::uuid AND id = ${attempt.migrationId}::uuid
    `
    return attempt
  }

  await sql`
    INSERT INTO migration_attempts (
      id, user_id, idempotency_key, source_kind, source_version, device_id, stage,
      discovered_count, accepted_count, rejected_count, reconciled_count,
      source_checksum, accepted_checksum
    ) VALUES (
      ${attempt.migrationId}::uuid,
      ${userId}::uuid,
      ${attempt.idempotencyKey},
      ${attempt.sourceKind},
      ${attempt.sourceVersion},
      ${attempt.deviceId},
      ${attempt.stage},
      ${attempt.counts.discovered},
      ${attempt.counts.accepted},
      ${attempt.counts.rejected},
      ${attempt.counts.reconciled},
      ${attempt.sourceChecksum},
      ${attempt.acceptedChecksum}
    )
  `
  return attempt
}
