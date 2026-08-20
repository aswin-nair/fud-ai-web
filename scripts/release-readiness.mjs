import { readFileSync } from 'node:fs'

import { evaluateReleaseReadiness } from './release-readiness-lib.mjs'

const STRUCTURE_ONLY = process.argv.includes('--structure-only')
const evidencePath = new URL('../docs/release/evidence.json', import.meta.url)
const document = JSON.parse(readFileSync(evidencePath, 'utf8'))
const result = evaluateReleaseReadiness(document, process.env)

if (result.structureErrors.length > 0) {
  console.error('Release evidence is invalid:')
  for (const error of result.structureErrors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Release evidence structure is valid (${result.gateCount} gates).`)
if (STRUCTURE_ONLY) process.exit(0)

for (const line of result.lines) console.log(line)
if (!result.ok) {
  for (const error of result.blocking) console.error(error)
  process.exitCode = 1
}
