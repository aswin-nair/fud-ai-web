import { getDb, asRows } from './db.js'
import { hashPassword, verifyPassword } from './password.js'
import type { SessionUser } from './jwt.js'

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

const DUMMY_CREDENTIAL = hashPassword('not-a-real-account-password')

export class DuplicateAccountError extends Error {
  constructor() {
    super('Duplicate account')
    this.name = 'DuplicateAccountError'
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials')
    this.name = 'InvalidCredentialsError'
  }
}

export class AccountProviderConflictError extends Error {
  constructor() {
    super('Account provider conflict')
    this.name = 'AccountProviderConflictError'
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
}

function toSession(user: DbUser): SessionUser {
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
): Promise<SessionUser> {
  const normalized = email.trim().toLowerCase()
  const externalSub = `email:${normalized}`
  const existing = await findUserByEmail(normalized)
  const { hash, salt } = hashPassword(password)
  if (existing) throw new DuplicateAccountError()

  const sql = getDb()
  let rows: DbUser[]
  try {
    rows = asRows<DbUser>(await sql`
      INSERT INTO users (external_sub, email, name, provider, password_hash, password_salt)
      VALUES (${externalSub}, ${normalized}, ${name.trim()}, 'email', ${hash}, ${salt})
      RETURNING *
    `)
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateAccountError()
    throw error
  }
  const user = rows[0]
  if (!user) throw new Error('Failed to create user')
  await sql`
    INSERT INTO user_states (user_id, state)
    VALUES (${user.id}::uuid, ${JSON.stringify({})}::jsonb)
    ON CONFLICT (user_id) DO NOTHING
  `
  return toSession(user)
}

export async function loginEmailUser(email: string, password: string): Promise<SessionUser> {
  const user = await findUserByEmail(email)
  if (!user || user.provider !== 'email' || !user.password_hash || !user.password_salt) {
    // Spend the same password-verification work for unknown, Google-only, and
    // email accounts so response timing does not become an account oracle.
    verifyPassword(password, DUMMY_CREDENTIAL.hash, DUMMY_CREDENTIAL.salt)
    throw new InvalidCredentialsError()
  }
  if (!verifyPassword(password, user.password_hash, user.password_salt)) {
    throw new InvalidCredentialsError()
  }
  return toSession(user)
}

export async function upsertGoogleUser(input: {
  googleSub: string
  email: string
  name: string
  picture?: string
}): Promise<SessionUser> {
  const sql = getDb()
  const existing = await findUserByExternalSub(input.googleSub)
  const emailOwner = await findUserByEmail(input.email)
  if (emailOwner && emailOwner.external_sub !== input.googleSub) {
    // A verified Google address proves control of that Google identity, not
    // authority to merge it with an existing password-based account.
    throw new AccountProviderConflictError()
  }
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

  let rows: DbUser[]
  try {
    rows = asRows<DbUser>(await sql`
      INSERT INTO users (external_sub, email, name, picture, provider)
      VALUES (${input.googleSub}, ${input.email.toLowerCase()}, ${input.name}, ${input.picture ?? null}, 'google')
      RETURNING *
    `)
  } catch (error) {
    if (isUniqueViolation(error)) throw new AccountProviderConflictError()
    throw error
  }
  const user = rows[0]
  if (!user) throw new Error('Failed to create user')
  await sql`
    INSERT INTO user_states (user_id, state)
    VALUES (${user.id}::uuid, ${JSON.stringify({})}::jsonb)
    ON CONFLICT (user_id) DO NOTHING
  `
  return toSession(user)
}
