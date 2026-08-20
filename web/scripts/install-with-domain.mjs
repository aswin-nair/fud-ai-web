import { spawnSync } from 'node:child_process'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolveDomainPackage } from './verify-deploy-context.mjs'

const webRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const resolved = resolveDomainPackage(webRoot)
console.log(`Including @fud-ai/domain@${resolved.version} from ${resolved.domainRoot}`)

function runNpm(args) {
  const npmCli = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const result = spawnSync(npmCli, args, {
    cwd: webRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

runNpm(['ci'])
runNpm(['ci', '--prefix', 'app'])
