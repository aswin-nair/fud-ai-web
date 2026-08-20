export const EVIDENCE_STATUSES = new Set(['pending', 'pass', 'fail', 'waived'])
export const EVIDENCE_KINDS = new Set([
  'ci-url',
  'report',
  'review',
  'dashboard',
  'rehearsal',
  'matrix',
  'hash',
  'notes',
])

const FORBIDDEN_LOCATOR = [
  /postgres(ql)?:\/\//i,
  /DATABASE_URL/i,
  /Bearer\s+[A-Za-z0-9._-]+/i,
  /\bsk-[A-Za-z0-9]/,
]

export function locatorIsForbidden(value) {
  return FORBIDDEN_LOCATOR.some(pattern => pattern.test(value))
}

function validateEvidenceItem(item, prefix) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return `${prefix} must be an object`
  }
  if (!EVIDENCE_KINDS.has(item.kind)) return `${prefix}.kind is invalid`
  const locator = item.uri ?? item.path
  if (typeof locator !== 'string' || !locator.trim()) {
    return `${prefix} needs uri or path`
  }
  if (locatorIsForbidden(locator)) return `${prefix} contains a forbidden locator`
  return null
}

export function validateEvidenceStructure(document) {
  const errors = []
  if (document?.schemaVersion !== 1) errors.push('schemaVersion must be 1')
  if (!document?.candidate || typeof document.candidate !== 'object') {
    errors.push('candidate is required')
  }
  if (!Array.isArray(document?.gates) || document.gates.length === 0) {
    errors.push('at least one release gate is required')
  }

  const ids = new Set()
  for (const [index, gate] of (document?.gates ?? []).entries()) {
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
    if (!EVIDENCE_STATUSES.has(gate.status)) errors.push(`${prefix}.status is invalid`)
    if (!Array.isArray(gate.evidence)) {
      errors.push(`${prefix}.evidence must be an array`)
    } else {
      for (const [evidenceIndex, item] of gate.evidence.entries()) {
        const itemError = validateEvidenceItem(item, `${prefix}.evidence[${evidenceIndex}]`)
        if (itemError) errors.push(itemError)
      }
    }
    if ((gate.status === 'pass' || gate.status === 'waived') && gate.evidence?.length === 0) {
      errors.push(`${prefix}.evidence is required for ${gate.status}`)
    }
    if (gate.status === 'waived' && (typeof gate.rationale !== 'string' || !gate.rationale)) {
      errors.push(`${prefix}.rationale is required for a waiver`)
    }
  }
  return errors
}

export function evaluateReleaseReadiness(document, env = {}) {
  const structureErrors = validateEvidenceStructure(document)
  if (structureErrors.length > 0) {
    return {
      ok: false,
      structureErrors,
      blocking: [],
      lines: [],
    }
  }

  const blocking = []
  const expectedVersion = env.RELEASE_CANDIDATE?.trim()
  const expectedCommit = env.RELEASE_COMMIT?.trim()
  if (expectedVersion && document.candidate.version !== expectedVersion) {
    blocking.push(
      `Evidence version ${document.candidate.version} does not match requested candidate ${expectedVersion}.`,
    )
  }
  if (expectedCommit && document.candidate.commit !== expectedCommit) {
    blocking.push(
      `Evidence commit ${document.candidate.commit} does not match workflow commit ${expectedCommit}.`,
    )
  }

  const unresolved = document.gates.filter(gate => gate.status !== 'pass')
  const waived = document.gates.filter(gate => gate.status === 'waived')
  const failed = document.gates.filter(gate => gate.status === 'fail')
  const pending = document.gates.filter(gate => gate.status === 'pending')
  const missingEvidence = document.gates.filter(gate => (
    (gate.status === 'pass' || gate.status === 'waived') && gate.evidence.length === 0
  ))

  if (
    !document.candidate.version
    || document.candidate.version === 'unassigned'
    || !document.candidate.commit
    || document.candidate.commit === 'unassigned'
  ) {
    blocking.push('Release candidate version and commit must be assigned.')
  }
  if (waived.length > 0) {
    blocking.push(`waived gates do not pass this check: ${waived.map(gate => gate.id).join(', ')}`)
  }
  if (failed.length > 0) {
    blocking.push(`failed gates do not pass this check: ${failed.map(gate => gate.id).join(', ')}`)
  }
  if (pending.length > 0) {
    blocking.push(`${pending.length} release gate(s) are pending.`)
  }
  if (missingEvidence.length > 0) {
    blocking.push(`missing evidence: ${missingEvidence.map(gate => gate.id).join(', ')}`)
  }
  if (unresolved.length > 0) {
    blocking.push(`${unresolved.length} release gate(s) are not passed.`)
  }

  const lines = document.gates.map(gate => (
    `${gate.status === 'pass' ? 'PASS' : gate.status.toUpperCase()} ${gate.id} — ${gate.description}`
  ))

  return {
    ok: blocking.length === 0,
    structureErrors,
    blocking,
    lines,
    gateCount: document.gates.length,
  }
}
