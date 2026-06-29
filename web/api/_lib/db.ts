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
