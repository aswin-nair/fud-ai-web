import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('BYOK audit failed: DATABASE_URL is not configured.')
  process.exitCode = 2
} else {
  try {
    const sql = neon(url)
    const rows = await sql`
      SELECT
        COUNT(*) FILTER (
          WHERE state #> '{aiSettings,apiKey}'::text[] IS NOT NULL
        )::bigint AS known_path_rows,
        COUNT(*) FILTER (
          WHERE jsonb_path_exists(state, '$.**.apiKey')
        )::bigint AS any_api_key_rows
      FROM user_states
    `
    const knownPathRows = Number(rows[0]?.known_path_rows ?? -1)
    const anyApiKeyRows = Number(rows[0]?.any_api_key_rows ?? -1)
    if (!Number.isSafeInteger(knownPathRows) || !Number.isSafeInteger(anyApiKeyRows)) {
      throw new Error('Invalid count result')
    }
    console.log(`BYOK audit counts: known_path_rows=${knownPathRows} any_api_key_rows=${anyApiKeyRows}`)
    if (knownPathRows > 0 || anyApiKeyRows > 0) process.exitCode = 1
  } catch {
    // Database/provider errors can contain connection details. Keep evidence
    // output stable and free of URLs, state values, emails, and user IDs.
    console.error('BYOK audit failed.')
    process.exitCode = 2
  }
}
