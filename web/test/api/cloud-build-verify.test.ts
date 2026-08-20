import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { inspectCloudBuild } from '../../app/scripts/verify-cloud-build.mjs'

function fakeDist(backend: string, js: string) {
  const distDir = mkdtempSync(join(tmpdir(), 'fud-dist-'))
  mkdirSync(join(distDir, 'assets'))
  writeFileSync(join(distDir, 'release-info.json'), JSON.stringify({
    backend,
    release: 'test',
    domainPackage: '@fud-ai/domain',
  }))
  writeFileSync(join(distDir, 'assets', 'index.js'), js)
  return distDir
}

describe('cloud build verification', () => {
  it('accepts a Neon bundle that includes the domain package', () => {
    const distDir = fakeDist('neon', 'const x = "__FUD_BACKEND_neon__"; const y = "@fud-ai/domain";')
    expect(inspectCloudBuild(distDir)).toMatchObject({ backend: 'neon' })
  })

  it('rejects a local-only candidate', () => {
    const distDir = fakeDist('local', 'const x = "__FUD_BACKEND_local__"; const y = "@fud-ai/domain";')
    expect(() => inspectCloudBuild(distDir)).toThrow(/expected neon/)
  })

  it('rejects a Neon label that did not bake the domain package', () => {
    const distDir = fakeDist('neon', 'const x = "__FUD_BACKEND_neon__";')
    expect(() => inspectCloudBuild(distDir)).toThrow(/@fud-ai\/domain/)
  })
})
