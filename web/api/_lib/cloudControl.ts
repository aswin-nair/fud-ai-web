export function cloudWritesEnabled(): boolean {
  return process.env.ENABLE_CLOUD_WRITES?.trim().toLowerCase() !== 'false'
}

export const CLOUD_WRITES_DISABLED_RESPONSE = {
  error: 'Cloud writes are temporarily unavailable. Your account data remains readable.',
} as const
