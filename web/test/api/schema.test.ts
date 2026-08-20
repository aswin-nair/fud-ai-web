import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const schema = readFileSync(new URL('../../db/schema.sql', import.meta.url), 'utf8')

describe('account security schema', () => {
  it('cascades all user-owned security and state records on account deletion', () => {
    for (const table of ['user_states', 'auth_sessions', 'state_mutations', 'password_reset_tokens']) {
      const declaration = new RegExp(
        `CREATE TABLE IF NOT EXISTS ${table} \\([\\s\\S]*?REFERENCES users\\(id\\) ON DELETE CASCADE`,
      )
      expect(schema).toMatch(declaration)
    }
  })

  it('installs a per-user idempotent state mutation function and ledger key', () => {
    expect(schema).toContain('PRIMARY KEY (user_id, mutation_id)')
    expect(schema).toContain('CREATE OR REPLACE FUNCTION save_user_state_idempotent')
    expect(schema).toContain('pg_advisory_xact_lock')
    expect(schema).toContain("'mutation_conflict'::TEXT")
  })

  it('records rotating refresh hashes on auth sessions', () => {
    expect(schema).toContain('refresh_token_hash')
    expect(schema).toContain('previous_refresh_token_hash')
    expect(schema).toContain('family_id')
  })
})
