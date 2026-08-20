import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)))

export function inspectCloudBuild(distDir = join(appRoot, 'dist')) {
  const releasePath = join(distDir, 'release-info.json')
  if (!existsSync(releasePath)) {
    throw new Error('Cloud build is missing dist/release-info.json')
  }
  const info = JSON.parse(readFileSync(releasePath, 'utf8'))
  if (info.backend !== 'neon') {
    throw new Error(`Cloud build backend is ${JSON.stringify(info.backend)}; expected neon`)
  }
  if (info.domainPackage !== '@fud-ai/domain') {
    throw new Error('Cloud build did not record @fud-ai/domain')
  }

  const assetsDir = join(distDir, 'assets')
  const files = existsSync(assetsDir)
    ? readdirSync(assetsDir).filter(name => name.endsWith('.js'))
    : []
  const bundle = files.map(name => readFileSync(join(assetsDir, name), 'utf8')).join('\n')
  if (!bundle.includes('__FUD_BACKEND_neon__')) {
    throw new Error('Built JavaScript does not contain the Neon backend marker')
  }
  if (bundle.includes('__FUD_BACKEND_local__')) {
    throw new Error('Built JavaScript still contains the local backend marker')
  }
  if (!bundle.includes('@fud-ai/domain')) {
    throw new Error('Built JavaScript does not contain @fud-ai/domain')
  }
  return info
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const info = inspectCloudBuild()
    console.log(`Cloud build verified: backend=${info.backend} release=${info.release}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
