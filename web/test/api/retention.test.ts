import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  formatDeletionOrphans,
  formatRetentionCleanup,
  runDeletionReconciliation,
  runRetentionCleanup,
  runRetentionJobs,
} from '../../scripts/retention-jobs.mjs'
import {
  describeRetentionRehearsal,
  retentionRehearsalPlan,
  runRetentionRehearsal,
} from '../../scripts/retention-rehearsal-lib.mjs'
import { request, response } from './helpers.js'

const jobs = readFileSync(new URL('../../scripts/retention-jobs.mjs', import.meta.url), 'utf8')
const cleanup = readFileSync(new URL('../../scripts/retention-cleanup.mjs', import.meta.url), 'utf8')
const rehearsal = readFileSync(new URL('../../scripts/retention-rehearsal.mjs', import.meta.url), 'utf8')

describe('retention jobs', () => {
  it('keeps cleanup and reconciliation count-only and redacted', () => {
    expect(jobs).toContain("INTERVAL '30 days'")
    expect(jobs).toContain("INTERVAL '90 days'")
    expect(jobs).toContain("INTERVAL '7 days'")
    expect(jobs).toContain("INTERVAL '24 hours'")
    expect(jobs).toContain('orphan_states')
    expect(jobs).toContain('NOT EXISTS (SELECT 1 FROM users')
    expect(jobs).not.toContain('SELECT state')
    expect(jobs).not.toContain('SELECT email')
    expect(cleanup).toContain('Retention cleanup failed.')
    expect(cleanup).not.toContain('console.log(url)')
    expect(cleanup).not.toContain('console.error(error')
    expect(rehearsal).toContain('RETENTION NOT CERTIFIED')
    expect(rehearsal).not.toContain('console.log(url)')
  })

  it('normalizes tagged-template counts without leaking row values', async () => {
    const sql = async () => [{
      sessions: 2,
      mutations: 0,
      reset_tokens: 1,
      rate_buckets: 3,
      entity_mutations: 0,
      migrations: 4,
      orphan_states: 0,
      orphan_sessions: 0,
      orphan_mutations: 0,
      orphan_reset_tokens: 0,
      orphan_entities: 0,
      orphan_tombstones: 0,
      orphan_cursors: 0,
      orphan_entity_mutations: 0,
      orphan_migrations: 0,
    }]

    const cleanupCounts = await runRetentionCleanup(sql)
    const orphans = await runDeletionReconciliation(sql)
    expect(formatRetentionCleanup(cleanupCounts)).toBe(
      'sessions=2 mutations=0 reset_tokens=1 rate_buckets=3 entity_mutations=0 migrations=4',
    )
    expect(formatDeletionOrphans(orphans)).toBe(
      'orphan_states=0 orphan_sessions=0 orphan_mutations=0 orphan_reset_tokens=0 orphan_entities=0 orphan_tombstones=0 orphan_cursors=0 orphan_entity_mutations=0 orphan_migrations=0',
    )
  })

  it('rejects a non-integer cleanup count', async () => {
    await expect(runRetentionCleanup(async () => [{ sessions: '1.5' }])).rejects.toThrow('Invalid cleanup count')
  })
})

describe('retention rehearsal', () => {
  it('does not certify backup or restore when the database is unset', () => {
    const plan = retentionRehearsalPlan({})
    const report = describeRetentionRehearsal(plan)
    expect(plan.certified).toBe(false)
    expect(plan.runCleanup).toBe(false)
    expect(plan.runBackup).toBe(false)
    expect(report.steps.every(step => step.status !== 'certified')).toBe(true)
    expect(report.reasons.some(reason => reason.includes('Neon backup'))).toBe(true)
  })

  it('can run count-only cleanup without claiming backup certification', async () => {
    const sql = async () => [{
      sessions: 1,
      mutations: 0,
      reset_tokens: 0,
      rate_buckets: 0,
      entity_mutations: 0,
      migrations: 0,
      orphan_states: 0,
      orphan_sessions: 0,
      orphan_mutations: 0,
      orphan_reset_tokens: 0,
      orphan_entities: 0,
      orphan_tombstones: 0,
      orphan_cursors: 0,
      orphan_entity_mutations: 0,
      orphan_migrations: 0,
    }]

    const report = await runRetentionRehearsal(sql, { DATABASE_URL: 'postgres://example' })
    expect(report.certified).toBe(false)
    expect(report.steps.find(step => step.step === 'backup')?.status).toBe('uncertified')
    expect(report.steps.find(step => step.step === 'restore_after_deletion')?.status).toBe('uncertified')
    expect(report.steps.find(step => step.step === 'session_cleanup')?.status).toBe('ran_count_only')
    expect(report.summary?.cleanup).toContain('sessions=1')
  })
})

describe('retention cron route', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    vi.doUnmock('../../scripts/retention-jobs.mjs')
    vi.doUnmock('../../api/_lib/db.js')
  })

  it('stays fail-closed when the cron secret is unset', async () => {
    vi.stubEnv('CRON_SECRET', '')
    vi.stubEnv('DATABASE_URL', 'postgres://example')
    const { default: handler } = await import('../../api/cron/retention.js')
    const res = response()
    await handler(request() as never, res as never)
    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual({ error: 'Retention cron is not configured' })
  })

  it('rejects a request without the configured bearer', async () => {
    vi.stubEnv('CRON_SECRET', 'retention-cron-secret-1')
    vi.stubEnv('DATABASE_URL', 'postgres://example')
    const { default: handler } = await import('../../api/cron/retention.js')
    const res = response()
    await handler(request({
      headers: { authorization: 'Bearer wrong-secret-value' },
    }) as never, res as never)
    expect(res.statusCode).toBe(401)
  })

  it('returns aggregate counts only after a valid cron bearer', async () => {
    vi.resetModules()
    vi.stubEnv('CRON_SECRET', 'retention-cron-secret-1')
    vi.stubEnv('DATABASE_URL', 'postgres://example')
    vi.doMock('../../scripts/retention-jobs.mjs', () => ({
      formatRetentionCleanup: () => 'sessions=0',
      formatDeletionOrphans: () => 'orphan_states=0',
      runRetentionJobs: async () => ({
        cleanup: {
          sessions: 0,
          mutations: 0,
          reset_tokens: 0,
          rate_buckets: 0,
          entity_mutations: 0,
          migrations: 0,
        },
        orphans: {
          orphan_states: 0,
          orphan_sessions: 0,
          orphan_mutations: 0,
          orphan_reset_tokens: 0,
          orphan_entities: 0,
          orphan_tombstones: 0,
          orphan_cursors: 0,
          orphan_entity_mutations: 0,
          orphan_migrations: 0,
        },
      }),
    }))
    vi.doMock('../../api/_lib/db.js', () => ({
      getDb: () => (async () => []),
      isDbConfigured: () => true,
    }))

    const { default: handler } = await import('../../api/cron/retention.js')
    const res = response()
    await handler(request({
      headers: { authorization: 'Bearer retention-cron-secret-1' },
    }) as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      ok: true,
      cleanup: {
        sessions: 0,
        mutations: 0,
        reset_tokens: 0,
        rate_buckets: 0,
        entity_mutations: 0,
        migrations: 0,
      },
      orphans: {
        orphan_states: 0,
        orphan_sessions: 0,
        orphan_mutations: 0,
        orphan_reset_tokens: 0,
        orphan_entities: 0,
        orphan_tombstones: 0,
        orphan_cursors: 0,
        orphan_entity_mutations: 0,
        orphan_migrations: 0,
      },
    })
    expect(JSON.stringify(res.body)).not.toContain('postgres://')
    expect(JSON.stringify(res.body)).not.toContain('email')
  })
})
