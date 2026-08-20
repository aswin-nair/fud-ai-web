import { runStagingLifecycle, stagingLifecyclePlan } from './staging-lifecycle-lib.mjs'

const plan = stagingLifecyclePlan(process.env)
if (!plan.run) {
  console.log(`STAGING NOT CERTIFIED: ${plan.reason}`)
  process.exit(process.env.STAGING_REQUIRED ? 1 : 0)
}

try {
  const result = await runStagingLifecycle(plan.baseUrl)
  console.log(`Staging cloud lifecycle certified (${result.steps.length} steps).`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
