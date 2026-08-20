import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildReleaseBundle,
  buildReleaseNotes,
  collectHashes,
  inspectReleaseSymbols,
  writeReleaseBundle,
} from './release-bundle-lib.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const evidence = JSON.parse(readFileSync(join(root, 'docs/release/evidence.json'), 'utf8'))
const outputDir = (process.env.RELEASE_BUNDLE_DIR || 'release-artifacts').trim() || 'release-artifacts'
const distDir = join(root, 'web/app/dist')

try {
  const hashes = collectHashes(root)
  const sourcemaps = inspectReleaseSymbols(distDir)
  const bundle = buildReleaseBundle({
    evidence,
    hashes,
    sourcemaps,
    env: process.env,
    builtAt: new Date().toISOString(),
  })
  const notes = buildReleaseNotes(evidence, hashes)
  const written = writeReleaseBundle(join(root, outputDir), bundle, notes)

  for (const reason of bundle.reasons) {
    console.log(`RELEASE NOT CERTIFIED: ${reason}`)
  }
  console.log(`wrote ${written.bundlePath.replace(`${root}/`, '').replace(`${root}\\`, '')}`)
} catch {
  console.error('Release bundle failed.')
  process.exitCode = 2
}
