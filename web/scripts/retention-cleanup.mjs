import { neon } from '@neondatabase/serverless'

import {
  formatDeletionOrphans,
  formatRetentionCleanup,
  runRetentionJobs,
} from './retention-jobs.mjs'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Retention cleanup failed: DATABASE_URL is not configured.')
  process.exitCode = 2
} else {
  try {
    const result = await runRetentionJobs(neon(url))
    console.log(`Retention cleanup counts: ${formatRetentionCleanup(result.cleanup)}`)
    console.log(`Deletion reconciliation orphans: ${formatDeletionOrphans(result.orphans)}`)
  } catch {
    // Provider errors may contain connection material. Keep operator output
    // stable and free of URLs, identifiers, and state values.
    console.error('Retention cleanup failed.')
    process.exitCode = 2
  }
}
