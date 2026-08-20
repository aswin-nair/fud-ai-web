import { isDeviceId } from './calendarContext.js'
import type { ContractValidation } from './entities.js'
import { isCanonicalUuid } from './mutations.js'

export const MIGRATION_STAGES = [
  'detected',
  'previewed',
  'uploading',
  'reconciling',
  'complete',
  'confirmed',
  'rolled_back',
  'failed',
] as const

export type MigrationStage = (typeof MIGRATION_STAGES)[number]

export const SOURCE_KINDS = ['web-state-v0', 'mobile-sqlite-0000'] as const
export type MigrationSourceKind = (typeof SOURCE_KINDS)[number]

export interface MigrationCounts {
  discovered: number
  accepted: number
  rejected: number
  reconciled: number
}

export interface MigrationAttempt {
  contractVersion: 1
  migrationId: string
  idempotencyKey: string
  sourceKind: MigrationSourceKind
  sourceVersion: string
  deviceId: string
  stage: MigrationStage
  counts: MigrationCounts
  sourceChecksum: string | null
  acceptedChecksum: string | null
}

const HEX64 = /^[0-9a-f]{64}$/
const SOURCE_VERSION = /^[A-Za-z0-9._:-]{1,64}$/

const STAGE_ORDER: Record<MigrationStage, number> = {
  detected: 0,
  previewed: 1,
  uploading: 2,
  reconciling: 3,
  complete: 4,
  confirmed: 5,
  rolled_back: 6,
  failed: 6,
}

function row(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function nonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function isMigrationStage(value: unknown): value is MigrationStage {
  return typeof value === 'string' && (MIGRATION_STAGES as readonly string[]).includes(value)
}

export function canAdvanceMigration(from: MigrationStage, to: MigrationStage): boolean {
  if (from === to) return true
  if (from === 'confirmed' || from === 'rolled_back') return false
  if (to === 'failed' || to === 'rolled_back') return true
  return STAGE_ORDER[to] === STAGE_ORDER[from] + 1
}

export function validateMigrationAttempt(value: unknown): ContractValidation {
  if (!row(value)) return { ok: false, error: 'Migration attempt must be an object' }
  if (value.contractVersion !== 1) return { ok: false, error: 'Unsupported contract version' }
  if (!isCanonicalUuid(value.migrationId)) return { ok: false, error: 'Migration ID must be a canonical UUID' }
  if (typeof value.idempotencyKey !== 'string' || !SOURCE_VERSION.test(value.idempotencyKey)) {
    return { ok: false, error: 'Invalid migration idempotency key' }
  }
  if (!(SOURCE_KINDS as readonly string[]).includes(String(value.sourceKind))) {
    return { ok: false, error: 'Unknown migration source' }
  }
  if (typeof value.sourceVersion !== 'string' || !SOURCE_VERSION.test(value.sourceVersion)) {
    return { ok: false, error: 'Invalid source version' }
  }
  if (!isDeviceId(value.deviceId)) return { ok: false, error: 'Invalid device id' }
  if (!isMigrationStage(value.stage)) return { ok: false, error: 'Unknown migration stage' }
  if (!row(value.counts)) return { ok: false, error: 'Migration counts are required' }
  for (const key of ['discovered', 'accepted', 'rejected', 'reconciled'] as const) {
    if (!nonNegative(value.counts[key])) return { ok: false, error: 'Migration counts must be non-negative integers' }
  }
  for (const key of ['sourceChecksum', 'acceptedChecksum'] as const) {
    const digest = value[key]
    if (digest !== null && (typeof digest !== 'string' || !HEX64.test(digest))) {
      return { ok: false, error: 'Checksums must be SHA-256 hex or null' }
    }
  }
  return { ok: true }
}
