import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { locatorIsForbidden } from './release-readiness-lib.mjs'

export const HASHED_ARTIFACTS = [
  'web/app/package-lock.json',
  'web/package-lock.json',
  'mobile/package-lock.json',
  'packages/domain/package.json',
  'packages/contracts/package.json',
  'web/db/schema.sql',
  'web/db/migrations/20260820_account_security.sql',
  'web/db/migrations/20260820_refresh_sessions.sql',
  'web/db/migrations/20260820_entity_contracts.sql',
]

export function sha256File(filePath) {
  const bytes = readFileSync(filePath)
  return createHash('sha256').update(bytes).digest('hex')
}

export function collectHashes(root, files = HASHED_ARTIFACTS) {
  return Object.fromEntries(files.map(relative => {
    const absolute = join(root, relative)
    if (!existsSync(absolute)) throw new Error(`Missing hashed artifact: ${relative}`)
    return [relative, sha256File(absolute)]
  }))
}

export function inspectReleaseSymbols(distDir) {
  const assetsDir = join(distDir, 'assets')
  if (!existsSync(assetsDir)) {
    return { available: false, confirmed: false, jsCount: 0, mapCount: 0 }
  }
  const names = readdirSync(assetsDir)
  const jsCount = names.filter(name => name.endsWith('.js')).length
  const mapCount = names.filter(name => name.endsWith('.map')).length
  return {
    available: true,
    confirmed: jsCount > 0 && mapCount >= jsCount,
    jsCount,
    mapCount,
  }
}

export function suiteStatus(env = process.env) {
  const recorded = env.GITHUB_ACTIONS === 'true' ? 'recorded-by-workflow' : 'not-run'
  return {
    cloudBuild: recorded,
    localBrowser: recorded,
    hostedCloud: env.STAGING_BASE_URL?.trim() ? 'scheduled' : 'uncertified',
    api: recorded,
    mobile: recorded,
    mobileLint: recorded,
    expoExport: env.EXPO_EXPORT === 'true' ? 'scheduled' : 'uncertified',
    securityScan: recorded,
    dependencyReview: recorded,
  }
}

export function buildReleaseNotes(evidence, hashes) {
  const pending = evidence.gates.filter(gate => gate.status !== 'pass').length
  return [
    '# Uncertified release notes',
    '',
    'This bundle is not a release approval and does not assign',
    '`docs/release/evidence.json`.',
    '',
    `Candidate version: ${evidence.candidate.version}`,
    `Candidate commit: ${evidence.candidate.commit}`,
    `Gates not passed: ${pending}`,
    `Hashed artifacts: ${Object.keys(hashes).length}`,
    '',
    'Repo-side phases 0–9 are recorded under `docs/release/phase-*.md`.',
    'Hosted certification, device-matrix, and owner-signed gate evidence remain pending.',
    '',
  ].join('\n')
}

export function buildReleaseBundle({
  evidence,
  hashes,
  sourcemaps,
  env = process.env,
  builtAt = null,
}) {
  const pending = evidence.gates.filter(gate => gate.status !== 'pass')
  const reasons = [
    evidence.candidate.commit === 'unassigned' || evidence.candidate.version === 'unassigned'
      ? 'evidence.json stays unassigned'
      : null,
    pending.length > 0 ? `${pending.length} release gate(s) are not passed` : null,
    sourcemaps.confirmed ? null : 'release sourcemaps are not confirmed',
    env.STAGING_BASE_URL?.trim() ? null : 'hosted cloud integration is not certified',
    env.EXPO_EXPORT === 'true' ? null : 'Expo export is not certified',
  ].filter(Boolean)

  const bundle = {
    schemaVersion: 1,
    certified: false,
    label: 'RELEASE NOT CERTIFIED',
    candidate: {
      version: evidence.candidate.version,
      commit: evidence.candidate.commit,
      builtAt: evidence.candidate.builtAt,
    },
    workflow: {
      commit: (env.RELEASE_COMMIT || env.GITHUB_SHA || 'unassigned').trim() || 'unassigned',
      candidateInput: (env.RELEASE_CANDIDATE || 'unassigned').trim() || 'unassigned',
      builtAt,
    },
    hashes,
    sourcemaps: {
      available: sourcemaps.available,
      confirmed: sourcemaps.confirmed,
      jsCount: sourcemaps.jsCount,
      mapCount: sourcemaps.mapCount,
    },
    suites: suiteStatus(env),
    gates: evidence.gates.map(gate => ({
      id: gate.id,
      status: gate.status,
      evidenceCount: gate.evidence.length,
    })),
    reasons,
  }

  const serialized = JSON.stringify(bundle)
  if (locatorIsForbidden(serialized)) {
    throw new Error('Release bundle contained a forbidden locator')
  }
  return bundle
}

export function writeReleaseBundle(outputDir, bundle, notes) {
  mkdirSync(outputDir, { recursive: true })
  const bundlePath = join(outputDir, 'bundle.json')
  const notesPath = join(outputDir, 'notes.md')
  const hashesPath = join(outputDir, 'hashes.json')
  writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`)
  writeFileSync(notesPath, notes.endsWith('\n') ? notes : `${notes}\n`)
  writeFileSync(hashesPath, `${JSON.stringify(bundle.hashes, null, 2)}\n`)
  return {
    bundlePath,
    notesPath,
    hashesPath,
    directory: dirname(bundlePath),
  }
}
