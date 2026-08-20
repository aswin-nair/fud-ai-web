import { neon } from '@neondatabase/serverless'

import {
  describeRetentionRehearsal,
  retentionRehearsalPlan,
  runRetentionRehearsal,
} from './retention-rehearsal-lib.mjs'

const plan = retentionRehearsalPlan(process.env)
const label = 'RETENTION NOT CERTIFIED'

try {
  const report = plan.runCleanup
    ? await runRetentionRehearsal(neon(process.env.DATABASE_URL), process.env)
    : describeRetentionRehearsal(plan)

  for (const reason of report.reasons) {
    console.log(`${label}: ${reason}`)
  }
  for (const step of report.steps) {
    console.log(`retention step ${step.step}=${step.status}`)
  }
  if (report.summary) {
    console.log(`Retention cleanup counts: ${report.summary.cleanup}`)
    console.log(`Deletion reconciliation orphans: ${report.summary.orphans}`)
  }
} catch {
  console.error('Retention rehearsal failed.')
  process.exitCode = 2
}
