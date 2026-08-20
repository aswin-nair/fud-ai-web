import assert from 'node:assert/strict'
import test from 'node:test'

import { isTextCandidate, scanText } from './security-scan-lib.mjs'

test('native source and project configuration files are scanned', () => {
  for (const file of [
    'App.swift', 'Network.kt', 'project.pbxproj', 'Secrets.xcconfig', 'Info.plist',
    'Build.gradle', 'App.entitlements', 'View.storyboard', 'Client.java',
  ]) {
    assert.equal(isTextCandidate(file), true, file)
  }
})

test('canary secrets are detected in Swift, Kotlin, and Xcode project files', () => {
  const google = 'AIza' + 'A'.repeat(35)
  const openAi = 'sk-' + 'B'.repeat(24)
  const database = 'DATABASE_URL=' + 'postgresql://example.invalid/production'

  assert.deepEqual(scanText('Client.swift', `let token = "${google}"`).map(row => row.rule), ['Google API key'])
  assert.deepEqual(scanText('Client.kt', `val token = "${openAi}"`).map(row => row.rule), ['OpenAI-style API key'])
  assert.deepEqual(scanText('project.pbxproj', database).map(row => row.rule), ['assigned production secret'])
})

test('reviewed allow markers suppress only their own line', () => {
  const key = 'AIza' + 'C'.repeat(35)
  const rows = scanText('Example.swift', `let example = "${key}" // secret-scan: allow\nlet leaked = "${key}"`)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].line, 2)
})
