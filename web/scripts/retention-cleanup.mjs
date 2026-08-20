import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Retention cleanup failed: DATABASE_URL is not configured.')
  process.exitCode = 2
} else {
  try {
    const sql = neon(url)
    const rows = await sql`
      WITH removed_sessions AS (
        DELETE FROM auth_sessions
        WHERE expires_at < NOW() - INTERVAL '30 days'
           OR revoked_at < NOW() - INTERVAL '30 days'
        RETURNING 1
      ), removed_mutations AS (
        DELETE FROM state_mutations
        WHERE created_at < NOW() - INTERVAL '90 days'
        RETURNING 1
      ), removed_resets AS (
        DELETE FROM password_reset_tokens
        WHERE expires_at < NOW() - INTERVAL '7 days'
           OR consumed_at < NOW() - INTERVAL '7 days'
        RETURNING 1
      ), removed_rate_buckets AS (
        DELETE FROM rate_limit_buckets
        WHERE updated_at < NOW() - INTERVAL '24 hours'
        RETURNING 1
      )
      SELECT
        (SELECT COUNT(*)::bigint FROM removed_sessions) AS sessions,
        (SELECT COUNT(*)::bigint FROM removed_mutations) AS mutations,
        (SELECT COUNT(*)::bigint FROM removed_resets) AS reset_tokens,
        (SELECT COUNT(*)::bigint FROM removed_rate_buckets) AS rate_buckets
    `
    const counts = rows[0]
    const values = ['sessions', 'mutations', 'reset_tokens', 'rate_buckets']
      .map(field => Number(counts?.[field]))
    if (!values.every(Number.isSafeInteger)) throw new Error('Invalid cleanup count')
    console.log(
      `Retention cleanup counts: sessions=${values[0]} mutations=${values[1]} reset_tokens=${values[2]} rate_buckets=${values[3]}`,
    )
  } catch {
    // Provider errors may contain connection material. Keep operator output
    // stable and free of URLs, identifiers, and state values.
    console.error('Retention cleanup failed.')
    process.exitCode = 2
  }
}
