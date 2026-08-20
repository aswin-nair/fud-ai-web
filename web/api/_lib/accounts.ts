import { asRows, getDb } from './db.js'

export async function deleteUserAccount(userId: string): Promise<boolean> {
  const sql = getDb()
  // PostgreSQL executes the statement atomically. ON DELETE CASCADE removes
  // the state, sessions, mutation ledger, and reset tokens in that transaction.
  const rows = asRows<{ id: string }>(await sql`
    DELETE FROM users WHERE id = ${userId}::uuid RETURNING id
  `)
  return Boolean(rows[0])
}
