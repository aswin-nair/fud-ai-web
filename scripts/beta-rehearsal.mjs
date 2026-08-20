import { betaRehearsalPlan, describeBetaRehearsal } from './beta-rehearsal-lib.mjs'

const plan = betaRehearsalPlan(process.env)
const report = describeBetaRehearsal(plan)
const label = 'BETA NOT CERTIFIED'

try {
  for (const reason of report.reasons) {
    console.log(`${label}: ${reason}`)
  }
  for (const exercise of report.exercises) {
    console.log(`dogfood exercise ${exercise.step}=${exercise.status}`)
  }
} catch {
  console.error('Beta rehearsal failed.')
  process.exitCode = 2
}
