import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultWebRoot = dirname(dirname(fileURLToPath(import.meta.url)))

function resolveWorkspacePackage(webRoot, folder, name) {
  const candidates = [
    resolve(webRoot, `../packages/${folder}`),
    resolve(webRoot, `../../packages/${folder}`),
  ]
  for (const packageRoot of candidates) {
    const pkgPath = resolve(packageRoot, 'package.json')
    if (!existsSync(pkgPath)) continue
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    if (pkg.name !== name) {
      throw new Error(`${pkgPath} does not identify as ${name}`)
    }
    return { packageRoot, version: pkg.version, name }
  }
  throw new Error(
    `packages/${folder} is not available in this deployment context. `
    + 'Keep the Vercel Root Directory at web and enable '
    + '"Include source files outside of the Root Directory in the Build Step", '
    + 'or move the Vercel project root to the repository root.',
  )
}

export function resolveDomainPackage(webRoot = defaultWebRoot) {
  const resolved = resolveWorkspacePackage(webRoot, 'domain', '@fud-ai/domain')
  return { domainRoot: resolved.packageRoot, version: resolved.version }
}

export function resolveContractsPackage(webRoot = defaultWebRoot) {
  const resolved = resolveWorkspacePackage(webRoot, 'contracts', '@fud-ai/contracts')
  return { contractsRoot: resolved.packageRoot, version: resolved.version }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const domain = resolveDomainPackage()
    const contracts = resolveContractsPackage()
    console.log(`Deploy context resolved @fud-ai/domain@${domain.version} from ${domain.domainRoot}`)
    console.log(`Deploy context resolved @fud-ai/contracts@${contracts.version} from ${contracts.contractsRoot}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
