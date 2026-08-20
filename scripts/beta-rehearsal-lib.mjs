export const DOGFOOD_EXERCISES = [
  'export',
  'delete',
  'logout-all',
  'offline-logging',
  'conflict-recovery',
]

export function betaRehearsalPlan(env = process.env) {
  const staging = (env.STAGING_BASE_URL ?? '').trim()
  const runStaging = env.BETA_REHEARSAL === 'true' && Boolean(staging)
  const reasons = [
    'Internal dogfood has not started',
    'Invite-only beta has not started',
    'Managed AI stays unavailable',
    runStaging ? null : 'STAGING_BASE_URL is not set or BETA_REHEARSAL is not true; dogfood exercises are not certified',
  ].filter(Boolean)

  return {
    certified: false,
    dogfoodStarted: false,
    runStaging,
    reasons,
    exercises: DOGFOOD_EXERCISES.map(step => ({
      step,
      status: step === 'logout-all' || step === 'delete' || step === 'export'
        ? (runStaging ? 'pending_staging' : 'uncertified')
        : 'uncertified',
    })),
  }
}

export function describeBetaRehearsal(plan = betaRehearsalPlan()) {
  return {
    certified: false,
    dogfoodStarted: false,
    reasons: plan.reasons,
    exercises: plan.exercises,
  }
}

export function reviewBetaSignals(signals = {}) {
  const halt = []
  if (signals.crossAccountWrite) halt.push('cross-account-write')
  if (signals.lostAcceptedEntry) halt.push('lost-accepted-entry')
  if (signals.secretSync) halt.push('secret-sync')
  if (signals.failedDeletion) halt.push('failed-deletion')
  if (signals.unsafeTargetBypass) halt.push('unsafe-target-bypass')
  if (signals.managedAiInvoked) halt.push('managed-ai-invoked')
  if (signals.crashFreeRate != null && signals.crashFreeRate < 0.998) halt.push('crash-free')
  return {
    certified: false,
    dogfoodStarted: false,
    halt,
    continueEnrollment: halt.length === 0,
  }
}
