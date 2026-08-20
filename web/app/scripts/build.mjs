import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const backend = process.argv[2] ?? process.env.VITE_DATA_BACKEND
if (backend !== 'local' && backend !== 'neon') {
  console.error('Choose an explicit build backend: npm run build:local or npm run build:cloud')
  process.exit(1)
}

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const env = { ...process.env, VITE_DATA_BACKEND: backend }

function run(modulePath, args) {
  // Invoke Node on the package bin files directly. spawnSync('npm.cmd') throws
  // EINVAL on current Windows/Node combinations, and Vite does not export its bin.
  const result = spawnSync(process.execPath, [modulePath, ...args], {
    cwd: appRoot,
    env,
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(join(appRoot, 'node_modules/typescript/bin/tsc'), ['-b'])
run(join(appRoot, 'node_modules/vite/bin/vite.js'), ['build'])
