export function cloudWritesEnabled(): boolean {
  return process.env.ENABLE_CLOUD_WRITES?.trim().toLowerCase() !== 'false'
}

export function entityProjectionEnabled(): boolean {
  return process.env.ENABLE_ENTITY_PROJECTION?.trim().toLowerCase() === 'true'
}

export function localMigrationEnabled(): boolean {
  return process.env.ENABLE_LOCAL_MIGRATION?.trim().toLowerCase() === 'true'
}

export function mobileAuthEnabled(): boolean {
  return process.env.ENABLE_MOBILE_AUTH?.trim().toLowerCase() === 'true'
}

export function accountCreationEnabled(): boolean {
  return process.env.ENABLE_ACCOUNT_CREATION?.trim().toLowerCase() !== 'false'
}

export const CLOUD_WRITES_DISABLED_RESPONSE = {
  error: 'Cloud writes are temporarily unavailable. Your account data remains readable.',
} as const

export const LOCAL_MIGRATION_DISABLED_RESPONSE = {
  error: 'Local data migration is not available.',
} as const

export const MOBILE_AUTH_DISABLED_RESPONSE = {
  error: 'Mobile accounts are not available.',
} as const

export const ENTITY_PROJECTION_DISABLED_RESPONSE = {
  error: 'Entity sync is not available.',
} as const

export const ACCOUNT_CREATION_DISABLED_RESPONSE = {
  error: 'Account creation is temporarily unavailable.',
} as const

export const ENROLLMENT_CLOSED_RESPONSE = {
  error: 'Enrollment is closed.',
} as const

export const ENROLLMENT_UNAVAILABLE_RESPONSE = {
  error: 'Enrollment is not configured.',
} as const
