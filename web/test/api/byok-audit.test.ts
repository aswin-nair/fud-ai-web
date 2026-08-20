import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('BYOK release audit', () => {
  const script = readFileSync(new URL('../../scripts/audit-byok.mjs', import.meta.url), 'utf8')

  it('reports only aggregate counts and exits nonzero when matches remain', () => {
    expect(script).toContain('COUNT(*) FILTER')
    expect(script).toContain('known_path_rows')
    expect(script).toContain('any_api_key_rows')
    expect(script).toContain('process.exitCode = 1')
    expect(script).not.toContain('SELECT state')
    expect(script).not.toContain('console.log(url)')
  })
})
