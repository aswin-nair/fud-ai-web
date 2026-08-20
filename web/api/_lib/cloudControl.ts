export function cloudWritesEnabled(): boolean {
  return process.env.ENABLE_CLOUD_WRITES?.trim().toLowerCase() !== 'false'
}

export function entityProjectionEnabled(): boolean {
  return process.env.ENABLE_ENTITY_PROJECTION?.trim().toLowerCase() === 'true'
}

export function localMigrationEnabled(): boolean {
  return process.env.ENABLE_LOCAL_MIGRATION?.trim().toLowerCase() === 'true'
}

export const CLOUD_WRITES_DISABLED_RESPONSE = {
  error: 'Cloud writes are temporarily unavailable. Your account data remains readable.',
} as const

export const LOCAL_MIGRATION_DISABLED_RESPONSE = {
  error: 'Local data migration is not available.',
} as const
