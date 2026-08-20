import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { inspectCloudBuild } from './verify-cloud-build.mjs'

const args = process.argv.slice(2).filter(arg => arg !== '--release')
const isRelease = process.argv.includes('--release')
const backend = args[0] ?? process.env.VITE_DATA_BACKEND
if (backend !== 'local' && backend !== 'neon') {
  console.error('Choose an explicit build backend: npm run build:local, npm run build:cloud, or npm run build:release')
  process.exit(1)
}

if (isRelease && backend !== 'neon') {
  console.error('A release-candidate build must use the Neon backend')
  process.exit(1)
}

const release = (
  process.env.VITE_RELEASE_ID
  || process.env.RELEASE_ID
  || process.env.VERCEL_GIT_COMMIT_SHA
  || ''
).trim()

if (isRelease && !release) {
  console.error('A release-candidate build requires RELEASE_ID, VITE_RELEASE_ID, or VERCEL_GIT_COMMIT_SHA')
  process.exit(1)
}

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const env = {
  ...process.env,
  VITE_DATA_BACKEND: backend,
  VITE_RELEASE_ID: release || 'unassigned',
  VITE_SOURCEMAP: isRelease ? 'true' : (process.env.VITE_SOURCEMAP ?? ''),
}

function run(modulePath, commandArgs) {
  const result = spawnSync(process.execPath, [modulePath, ...commandArgs], {
    cwd: appRoot,
    env,
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(join(appRoot, 'node_modules/typescript/bin/tsc'), ['-b'])
run(join(appRoot, 'node_modules/vite/bin/vite.js'), ['build'])

const info = {
  backend,
  release: release || 'unassigned',
  domainPackage: '@fud-ai/domain',
}
writeFileSync(join(appRoot, 'dist/release-info.json'), `${JSON.stringify(info, null, 2)}\n`)

if (backend === 'neon') {
  inspectCloudBuild(join(appRoot, 'dist'))
  console.log(`Cloud build recorded: backend=${info.backend} release=${info.release}`)
}
