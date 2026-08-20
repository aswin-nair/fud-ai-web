import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { betaRehearsalPlan, describeBetaRehearsal, reviewBetaSignals } from './beta-rehearsal-lib.mjs'

const cli = readFileSync(new URL('./beta-rehearsal.mjs', import.meta.url), 'utf8')

test('the default rehearsal never starts dogfood', () => {
  const plan = betaRehearsalPlan({})
  const report = describeBetaRehearsal(plan)
  assert.equal(plan.certified, false)
  assert.equal(plan.dogfoodStarted, false)
  assert.equal(plan.runStaging, false)
  assert.ok(report.exercises.every(item => item.status === 'uncertified'))
  assert.ok(report.reasons.some(reason => reason.includes('dogfood has not started')))
  assert.match(cli, /BETA NOT CERTIFIED/)
  assert.doesNotMatch(cli, /console\.log\(url\)/)
})

test('count-only halt review stays uncertified', () => {
  const review = reviewBetaSignals({ crossAccountWrite: true, crashFreeRate: 0.99 })
  assert.equal(review.certified, false)
  assert.equal(review.continueEnrollment, false)
  assert.ok(review.halt.includes('cross-account-write'))
  assert.ok(review.halt.includes('crash-free'))
})
