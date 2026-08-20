import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { evaluateReleaseReadiness, validateEvidenceStructure } from './release-readiness-lib.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const ledger = JSON.parse(readFileSync(join(root, 'docs/release/evidence.json'), 'utf8'))

function gate(overrides = {}) {
  return {
    id: 'safety-regression-suite',
    category: 'safety',
    description: 'Policies pass.',
    owner: 'engineering',
    status: 'pending',
    evidence: [],
    ...overrides,
  }
}

test('checked-in ledger stays unassigned with empty pending evidence', () => {
  assert.equal(ledger.candidate.commit, 'unassigned')
  assert.equal(ledger.candidate.version, 'unassigned')
  assert.equal(ledger.gates.length, 16)
  assert.ok(ledger.gates.every(item => item.status === 'pending' && item.evidence.length === 0))
  const result = evaluateReleaseReadiness(ledger, {})
  assert.equal(result.ok, false)
  assert.ok(result.blocking.includes('Release candidate version and commit must be assigned.'))
  assert.ok(result.blocking.some(line => line.includes('are not passed')))
})

test('waived and failed gates never pass the check', () => {
  const document = {
    schemaVersion: 1,
    candidate: { version: '0.0.0-test', commit: 'abc1234', builtAt: '2026-08-20T00:00:00.000Z' },
    gates: [
      gate({
        id: 'browser-matrix',
        status: 'waived',
        rationale: 'temporary',
        evidence: [{ kind: 'report', path: 'docs/release/README.md' }],
      }),
      gate({ id: 'device-matrix', status: 'fail', evidence: [{ kind: 'report', path: 'docs/release/README.md' }] }),
    ],
  }
  const result = evaluateReleaseReadiness(document, {})
  assert.equal(result.ok, false)
  assert.ok(result.blocking.some(line => line.includes('waived gates')))
  assert.ok(result.blocking.some(line => line.includes('failed gates')))
})

test('a matching assigned candidate still fails while a gate is pending', () => {
  const document = {
    schemaVersion: 1,
    candidate: { version: '0.0.0-test', commit: 'abc1234', builtAt: '2026-08-20T00:00:00.000Z' },
    gates: [gate({ status: 'pending' })],
  }
  const result = evaluateReleaseReadiness(document, {
    RELEASE_CANDIDATE: '0.0.0-test',
    RELEASE_COMMIT: 'abc1234',
  })
  assert.equal(result.ok, false)
  assert.ok(result.blocking.some(line => line.includes('pending')))
})

test('forbidden locators are rejected in evidence items', () => {
  const errors = validateEvidenceStructure({
    schemaVersion: 1,
    candidate: { version: 'unassigned', commit: 'unassigned', builtAt: null },
    gates: [gate({
      evidence: [{ kind: 'report', uri: 'postgres://user:secret@host/db' }],
    })],
  })
  assert.ok(errors.some(line => line.includes('forbidden locator')))
})

test('an assigned candidate with evidence can pass the evaluator', () => {
  const document = {
    schemaVersion: 1,
    candidate: { version: '0.0.0-test', commit: 'abc1234', builtAt: '2026-08-20T00:00:00.000Z' },
    gates: [gate({
      status: 'pass',
      evidence: [{ kind: 'report', path: 'docs/release/README.md' }],
    })],
  }
  const result = evaluateReleaseReadiness(document, {
    RELEASE_CANDIDATE: '0.0.0-test',
    RELEASE_COMMIT: 'abc1234',
  })
  assert.equal(result.ok, true)
})
