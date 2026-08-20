export interface RetentionCleanupCounts {
  sessions: number
  mutations: number
  reset_tokens: number
  rate_buckets: number
  entity_mutations: number
  migrations: number
}

export interface DeletionOrphanCounts {
  orphan_states: number
  orphan_sessions: number
  orphan_mutations: number
  orphan_reset_tokens: number
  orphan_entities: number
  orphan_tombstones: number
  orphan_cursors: number
  orphan_entity_mutations: number
  orphan_migrations: number
}

const CLEANUP_FIELDS = [
  'sessions',
  'mutations',
  'reset_tokens',
  'rate_buckets',
  'entity_mutations',
  'migrations',
] as const

const ORPHAN_FIELDS = [
  'orphan_states',
  'orphan_sessions',
  'orphan_mutations',
  'orphan_reset_tokens',
  'orphan_entities',
  'orphan_tombstones',
  'orphan_cursors',
  'orphan_entity_mutations',
  'orphan_migrations',
] as const

export function formatRetentionCleanup(counts: RetentionCleanupCounts): string {
  return CLEANUP_FIELDS.map(field => `${field}=${counts[field]}`).join(' ')
}

export function formatDeletionOrphans(counts: DeletionOrphanCounts): string {
  return ORPHAN_FIELDS.map(field => `${field}=${counts[field]}`).join(' ')
}
