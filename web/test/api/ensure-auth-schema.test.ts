import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ensureAuthSchema,
  isUndefinedRelationError,
  prepareAuth,
  resetAuthSchemaEnsure,
} from '../../api/_lib/ensureAuthSchema.js'
import { response } from './helpers.js'

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../api/_lib/ensureAuthSchema.ts'),
  'utf8',
)

describe('auth schema ensure', () => {
  afterEach(() => {
    resetAuthSchemaEnsure()
    vi.unstubAllEnvs()
  })

  it('only applies idempotent session and limiter objects', () => {
    expect(source).toContain('CREATE TABLE IF NOT EXISTS rate_limit_buckets')
    expect(source).toContain('CREATE TABLE IF NOT EXISTS auth_sessions')
    expect(source).toContain('ADD COLUMN IF NOT EXISTS family_id')
    expect(source).toContain('ADD COLUMN IF NOT EXISTS refresh_token_hash')
    expect(source).not.toContain('SELECT email')
    expect(source).not.toContain('SELECT state')
    expect(source).not.toContain('aiSettings')
  })

  it('runs the create statements once', async () => {
    const statements: string[] = []
    const sql = async (strings: TemplateStringsArray) => {
      statements.push(strings.join(''))
    }
    await ensureAuthSchema(sql as never)
    await ensureAuthSchema(sql as never)
    expect(statements.filter(statement => statement.includes('rate_limit_buckets'))).toHaveLength(1)
  })

  it('maps missing-relation driver codes without echoing SQL', () => {
    expect(isUndefinedRelationError({ code: '42P01' })).toBe(true)
    expect(isUndefinedRelationError({ code: '42703' })).toBe(true)
    expect(isUndefinedRelationError({ code: '23505' })).toBe(false)
  })

  it('stays fail-closed when the auth secret is too short', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://configured.example/test')
    vi.stubEnv('JWT_SECRET', 'too-short')
    const res = response()
    expect(await prepareAuth(res as never)).toBe(false)
    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual({ error: 'Authentication is not configured' })
  })
})
