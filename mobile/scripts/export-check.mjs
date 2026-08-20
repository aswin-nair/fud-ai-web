import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const mobileRoot = dirname(dirname(fileURLToPath(import.meta.url)))

if (process.env.EXPO_EXPORT !== 'true') {
  console.log('EXPO EXPORT NOT CERTIFIED: EXPO_EXPORT is not set')
  process.exit(0)
}

const cli = join(mobileRoot, 'node_modules', 'expo', 'bin', 'cli')
const result = spawnSync(
  process.execPath,
  [cli, 'export', '--dump-sourcemap', '--output-dir', 'dist-export'],
  { cwd: mobileRoot, stdio: 'inherit', env: process.env },
)

if (result.error || result.status !== 0) {
  console.error('Expo export failed.')
  process.exit(result.status ?? 2)
}
