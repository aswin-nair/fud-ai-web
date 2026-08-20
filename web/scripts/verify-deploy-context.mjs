import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultWebRoot = dirname(dirname(fileURLToPath(import.meta.url)))

export function resolveDomainPackage(webRoot = defaultWebRoot) {
  const candidates = [
    resolve(webRoot, '../packages/domain'),
    resolve(webRoot, '../../packages/domain'),
  ]
  for (const domainRoot of candidates) {
    const pkgPath = resolve(domainRoot, 'package.json')
    if (!existsSync(pkgPath)) continue
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    if (pkg.name !== '@fud-ai/domain') {
      throw new Error(`${pkgPath} does not identify as @fud-ai/domain`)
    }
    return { domainRoot, version: pkg.version }
  }
  throw new Error(
    'packages/domain is not available in this deployment context. '
    + 'Keep the Vercel Root Directory at web and enable '
    + '"Include source files outside of the Root Directory in the Build Step", '
    + 'or move the Vercel project root to the repository root.',
  )
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const resolved = resolveDomainPackage()
    console.log(`Deploy context resolved @fud-ai/domain@${resolved.version} from ${resolved.domainRoot}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
