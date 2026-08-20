import {
  formatDeletionOrphans,
  formatRetentionCleanup,
  runRetentionJobs,
} from './retention-jobs.mjs'

export const RETENTION_REHEARSAL_STEPS = [
  'backup',
  'restore_clean_env',
  'export',
  'account_deletion',
  'backup_expiry',
  'restore_after_deletion',
  'partial_failure_recovery',
  'session_cleanup',
  'mutation_ledger_cleanup',
  'reset_token_cleanup',
  'rate_limit_cleanup',
  'migration_artifact_cleanup',
  'draft_expiry',
  'deletion_reconciliation',
]

const CLEANUP_STEPS = new Set([
  'session_cleanup',
  'mutation_ledger_cleanup',
  'reset_token_cleanup',
  'rate_limit_cleanup',
  'migration_artifact_cleanup',
  'deletion_reconciliation',
])

export function retentionRehearsalPlan(env = process.env) {
  const hasDatabase = Boolean(env.DATABASE_URL?.trim())
  const backupFlag = env.NEON_BACKUP_REHEARSAL === 'true'
  const reasons = [
    hasDatabase ? null : 'DATABASE_URL is not configured; cleanup is not certified',
    'Neon backup, restore, and backup-expiry are not certified',
    'Deleted-account restore-after-deletion is not certified',
    'Browser draft expiry is client-side and is not a hosted job',
    backupFlag
      ? 'NEON_BACKUP_REHEARSAL is set but this repo cannot invoke provider backups'
      : null,
  ].filter(Boolean)

  return {
    certified: false,
    runCleanup: hasDatabase,
    runBackup: false,
    reasons,
  }
}

function statusFor(step, plan) {
  if (step === 'draft_expiry') return 'client_only'
  if (CLEANUP_STEPS.has(step)) return plan.runCleanup ? 'pending_count_only' : 'uncertified'
  return 'uncertified'
}

export function describeRetentionRehearsal(plan = retentionRehearsalPlan()) {
  return {
    certified: false,
    steps: RETENTION_REHEARSAL_STEPS.map(step => ({
      step,
      status: statusFor(step, plan),
    })),
    reasons: plan.reasons,
  }
}

export async function runRetentionRehearsal(sql, env = process.env) {
  const plan = retentionRehearsalPlan(env)
  const report = describeRetentionRehearsal(plan)
  if (!plan.runCleanup || !sql) return report

  const result = await runRetentionJobs(sql)
  return {
    ...report,
    cleanup: result.cleanup,
    orphans: result.orphans,
    steps: report.steps.map(step => (
      CLEANUP_STEPS.has(step.step)
        ? { ...step, status: 'ran_count_only' }
        : step
    )),
    summary: {
      cleanup: formatRetentionCleanup(result.cleanup),
      orphans: formatDeletionOrphans(result.orphans),
    },
  }
}
