import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  buildReleaseBundle,
  buildReleaseNotes,
  collectHashes,
  HASHED_ARTIFACTS,
  inspectReleaseSymbols,
  writeReleaseBundle,
} from './release-bundle-lib.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const evidence = JSON.parse(readFileSync(join(root, 'docs/release/evidence.json'), 'utf8'))

test('hashed artifacts are SHA-256 and do not embed file contents', () => {
  const hashes = collectHashes(root)
  assert.deepEqual(Object.keys(hashes), HASHED_ARTIFACTS)
  for (const [relative, digest] of Object.entries(hashes)) {
    assert.match(digest, /^[a-f0-9]{64}$/, relative)
    assert.ok(!digest.includes('postgres://'))
  }
})

test('the bundle stays uncertified and does not assign the ledger', () => {
  const hashes = collectHashes(root)
  const bundle = buildReleaseBundle({
    evidence,
    hashes,
    sourcemaps: { available: false, confirmed: false, jsCount: 0, mapCount: 0 },
    env: {},
    builtAt: '2026-08-20T12:00:00.000Z',
  })
  assert.equal(bundle.certified, false)
  assert.equal(bundle.label, 'RELEASE NOT CERTIFIED')
  assert.equal(bundle.candidate.commit, 'unassigned')
  assert.equal(bundle.candidate.version, 'unassigned')
  assert.ok(bundle.reasons.some(reason => reason.includes('unassigned')))
  assert.ok(bundle.gates.every(gate => gate.status === 'pending'))
  assert.equal(bundle.suites.hostedCloud, 'uncertified')
  assert.equal(bundle.suites.expoExport, 'uncertified')
})

test('sourcemap confirmation counts files and does not read map bodies', () => {
  const distDir = mkdtempSync(join(tmpdir(), 'fud-symbols-'))
  mkdirSync(join(distDir, 'assets'))
  writeFileSync(join(distDir, 'assets', 'index.js'), 'console.log(1)')
  writeFileSync(join(distDir, 'assets', 'index.js.map'), '{"secret":"postgres://example"}')
  const symbols = inspectReleaseSymbols(distDir)
  assert.deepEqual(symbols, {
    available: true,
    confirmed: true,
    jsCount: 1,
    mapCount: 1,
  })
})

test('notes and written artifacts stay redacted', () => {
  const hashes = collectHashes(root)
  const notes = buildReleaseNotes(evidence, hashes)
  assert.match(notes, /Uncertified release notes/)
  assert.doesNotMatch(notes, /postgres(ql)?:\/\//i)
  const outputDir = mkdtempSync(join(tmpdir(), 'fud-bundle-'))
  const bundle = buildReleaseBundle({
    evidence,
    hashes,
    sourcemaps: { available: false, confirmed: false, jsCount: 0, mapCount: 0 },
    env: {},
  })
  writeReleaseBundle(outputDir, bundle, notes)
  const written = readFileSync(join(outputDir, 'bundle.json'), 'utf8')
  assert.match(written, /RELEASE NOT CERTIFIED/)
  assert.doesNotMatch(written, /postgres(ql)?:\/\//i)
  assert.doesNotMatch(written, /DATABASE_URL/)
})
