import { neon } from '@neondatabase/serverless'

let sql: ReturnType<typeof neon> | null = null

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not configured')
  if (!sql) sql = neon(url)
  return sql
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

/** Neon tagged-template results are a union; cast before indexing rows. */
export function asRows<T>(result: unknown): T[] {
  return result as T[]
}

const PROBE_TIMEOUT_MS = 2_500

export async function runBoundedProbe(
  sql: ReturnType<typeof neon>,
): Promise<boolean> {
  const result = await Promise.race([
    sql`SELECT 1 AS ok`,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('db_probe_timeout')), PROBE_TIMEOUT_MS)
    }),
  ])
  const rows = asRows<{ ok: number | string }>(result)
  return Number(rows[0]?.ok) === 1
}

/** Bounded readiness probe. Never throws provider or connection-string details. */
export async function probeDatabase(connect: () => ReturnType<typeof neon> = getDb): Promise<boolean> {
  if (!isDbConfigured()) return false
  try {
    return await runBoundedProbe(connect())
  } catch {
    return false
  }
}
