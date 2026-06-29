import { getDb, asRows } from './db.js'
import { hashPassword, verifyPassword } from './password.js'
import type { SessionClaims } from './jwt.js'

interface DbUser {
  id: string
  external_sub: string
  email: string
  name: string
  picture: string | null
  provider: 'email' | 'google'
  password_hash: string | null
  password_salt: string | null
}

function toSession(user: DbUser): SessionClaims {
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture ?? undefined,
    provider: user.provider,
  }
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const sql = getDb()
  const rows = asRows<DbUser>(
    await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`,
  )
  return rows[0] ?? null
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const sql = getDb()
  const rows = asRows<DbUser>(await sql`SELECT * FROM users WHERE id = ${id}::uuid LIMIT 1`)
  return rows[0] ?? null
}

export async function findUserByExternalSub(externalSub: string): Promise<DbUser | null> {
  const sql = getDb()
  const rows = asRows<DbUser>(
    await sql`SELECT * FROM users WHERE external_sub = ${externalSub} LIMIT 1`,
  )
  return rows[0] ?? null
}

export async function registerEmailUser(
  name: string,
  email: string,
  password: string,
): Promise<SessionClaims> {
  const normalized = email.trim().toLowerCase()
  const externalSub = `email:${normalized}`
  const existing = await findUserByEmail(normalized)
  if (existing) throw new Error('An account with this email already exists')

  const { hash, salt } = hashPassword(password)
  const sql = getDb()
  const rows = asRows<DbUser>(
    await sql`
    INSERT INTO users (external_sub, email, name, provider, password_hash, password_salt)
    VALUES (${externalSub}, ${normalized}, ${name.trim()}, 'email', ${hash}, ${salt})
    RETURNING *
  `,
  )
  const user = rows[0]
  if (!user) throw new Error('Failed to create user')
  await sql`
    INSERT INTO user_states (user_id, state)
    VALUES (${user.id}::uuid, ${JSON.stringify({})}::jsonb)
    ON CONFLICT (user_id) DO NOTHING
  `
  return toSession(user)
}

export async function loginEmailUser(email: string, password: string): Promise<SessionClaims> {
  const user = await findUserByEmail(email)
  if (!user || user.provider !== 'email' || !user.password_hash || !user.password_salt) {
    throw new Error('No account found with this email')
  }
  if (!verifyPassword(password, user.password_hash, user.password_salt)) {
    throw new Error('Incorrect password')
  }
  return toSession(user)
}

export async function upsertGoogleUser(input: {
  googleSub: string
  email: string
  name: string
  picture?: string
}): Promise<SessionClaims> {
  const sql = getDb()
  const existing = await findUserByExternalSub(input.googleSub)
  if (existing) {
    const rows = asRows<DbUser>(
      await sql`
      UPDATE users
      SET name = ${input.name}, picture = ${input.picture ?? null}, email = ${input.email.toLowerCase()}
      WHERE id = ${existing.id}::uuid
      RETURNING *
    `,
    )
    const user = rows[0]
    if (!user) throw new Error('Failed to update user')
    return toSession(user)
  }

  const rows = asRows<DbUser>(
    await sql`
    INSERT INTO users (external_sub, email, name, picture, provider)
    VALUES (${input.googleSub}, ${input.email.toLowerCase()}, ${input.name}, ${input.picture ?? null}, 'google')
    RETURNING *
  `,
  )
  const user = rows[0]
  if (!user) throw new Error('Failed to create user')
  await sql`
    INSERT INTO user_states (user_id, state)
    VALUES (${user.id}::uuid, ${JSON.stringify({})}::jsonb)
    ON CONFLICT (user_id) DO NOTHING
  `
  return toSession(user)
}
