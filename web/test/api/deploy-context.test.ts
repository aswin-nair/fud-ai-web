import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { resolveContractsPackage, resolveDomainPackage } from '../../scripts/verify-deploy-context.mjs'

const webRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

describe('deploy context for shared packages', () => {
  it('resolves the domain package from the web-rooted checkout', () => {
    const resolved = resolveDomainPackage(webRoot)
    expect(resolved.domainRoot.replace(/\\/g, '/')).toMatch(/\/packages\/domain$/)
    expect(resolved.version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('resolves the contracts package from the web-rooted checkout', () => {
    const resolved = resolveContractsPackage(webRoot)
    expect(resolved.contractsRoot.replace(/\\/g, '/')).toMatch(/\/packages\/contracts$/)
    expect(resolved.version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('fails closed when the domain package is outside the deployment context', () => {
    const isolated = mkdtempSync(join(tmpdir(), 'fud-web-root-'))
    expect(() => resolveDomainPackage(isolated)).toThrow(/packages\/domain is not available/)
    expect(() => resolveContractsPackage(isolated)).toThrow(/packages\/contracts is not available/)
  })
})
