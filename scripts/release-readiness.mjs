import { readFileSync } from 'node:fs'

const STRUCTURE_ONLY = process.argv.includes('--structure-only')
const evidencePath = new URL('../docs/release/evidence.json', import.meta.url)
const document = JSON.parse(readFileSync(evidencePath, 'utf8'))
const errors = []

if (document.schemaVersion !== 1) errors.push('schemaVersion must be 1')
if (!document.candidate || typeof document.candidate !== 'object') {
  errors.push('candidate is required')
}
if (!Array.isArray(document.gates) || document.gates.length === 0) {
  errors.push('at least one release gate is required')
}

const ids = new Set()
const statuses = new Set(['pending', 'pass', 'fail', 'waived'])
for (const [index, gate] of (document.gates ?? []).entries()) {
  const prefix = `gates[${index}]`
  if (!gate || typeof gate !== 'object') {
    errors.push(`${prefix} must be an object`)
    continue
  }
  if (typeof gate.id !== 'string' || !/^[a-z0-9-]+$/.test(gate.id)) {
    errors.push(`${prefix}.id must be a kebab-case identifier`)
  } else if (ids.has(gate.id)) {
    errors.push(`${prefix}.id is duplicated: ${gate.id}`)
  } else {
    ids.add(gate.id)
  }
  if (typeof gate.category !== 'string' || !gate.category) errors.push(`${prefix}.category is required`)
  if (typeof gate.description !== 'string' || !gate.description) errors.push(`${prefix}.description is required`)
  if (typeof gate.owner !== 'string' || !gate.owner) errors.push(`${prefix}.owner is required`)
  if (!statuses.has(gate.status)) errors.push(`${prefix}.status is invalid`)
  if (!Array.isArray(gate.evidence)) errors.push(`${prefix}.evidence must be an array`)
  if ((gate.status === 'pass' || gate.status === 'waived') && gate.evidence?.length === 0) {
    errors.push(`${prefix}.evidence is required for ${gate.status}`)
  }
  if (gate.status === 'waived' && (typeof gate.rationale !== 'string' || !gate.rationale)) {
    errors.push(`${prefix}.rationale is required for a waiver`)
  }
}

if (errors.length > 0) {
  console.error('Release evidence is invalid:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Release evidence structure is valid (${document.gates.length} gates).`)
if (STRUCTURE_ONLY) process.exit(0)

const expectedVersion = process.env.RELEASE_CANDIDATE?.trim()
const expectedCommit = process.env.RELEASE_COMMIT?.trim()
if (expectedVersion && document.candidate.version !== expectedVersion) {
  console.error(`Evidence version ${document.candidate.version} does not match requested candidate ${expectedVersion}.`)
  process.exitCode = 1
}
if (expectedCommit && document.candidate.commit !== expectedCommit) {
  console.error(`Evidence commit ${document.candidate.commit} does not match workflow commit ${expectedCommit}.`)
  process.exitCode = 1
}

const unresolved = document.gates.filter(gate => gate.status !== 'pass')
for (const gate of document.gates) {
  console.log(`${gate.status === 'pass' ? 'PASS' : gate.status.toUpperCase()} ${gate.id} — ${gate.description}`)
}

if (
  !document.candidate.version
  || document.candidate.version === 'unassigned'
  || !document.candidate.commit
  || document.candidate.commit === 'unassigned'
) {
  console.error('Release candidate version and commit must be assigned.')
  process.exitCode = 1
}
if (unresolved.length > 0) {
  console.error(`${unresolved.length} release gate(s) are not passed.`)
  process.exitCode = 1
}
