import { createHash } from 'node:crypto'
import { evaluateEnrollment } from './contracts.js'
import {
  ACCOUNT_CREATION_DISABLED_RESPONSE,
  ENROLLMENT_CLOSED_RESPONSE,
  ENROLLMENT_UNAVAILABLE_RESPONSE,
  accountCreationEnabled,
} from './cloudControl.js'
import { countUsers } from './users.js'

export class EnrollmentDeniedError extends Error {
  readonly status: number
  readonly body: { error: string }

  constructor(status: number, body: { error: string }) {
    super(body.error)
    this.name = 'EnrollmentDeniedError'
    this.status = status
    this.body = body
  }
}

export function hashInviteEmail(email: string, pepper = process.env.BETA_INVITE_PEPPER ?? ''): string {
  return createHash('sha256').update(`${pepper}\n${email.trim().toLowerCase()}`).digest('hex')
}

export function inviteHashesFromEnv(env = process.env): Set<string> {
  const raw = env.BETA_INVITE_HASHES?.trim() ?? ''
  if (!raw) return new Set()
  return new Set(raw.split(/[\s,]+/).filter(value => /^[a-f0-9]{64}$/i.test(value)).map(value => value.toLowerCase()))
}

export function cohortCapFromEnv(env = process.env): number | undefined {
  const raw = env.BETA_COHORT_CAP?.trim() ?? ''
  if (!raw) return undefined
  const cap = Number(raw)
  return Number.isSafeInteger(cap) && cap >= 0 ? cap : undefined
}

export async function assertNewAccountEnrollment(
  email: string,
  env = process.env,
): Promise<void> {
  if (!accountCreationEnabled()) {
    throw new EnrollmentDeniedError(503, ACCOUNT_CREATION_DISABLED_RESPONSE)
  }

  const hashes = inviteHashesFromEnv(env)
  const decision = evaluateEnrollment({
    cohort: env.BETA_COHORT,
    inviteConfigured: hashes.size > 0,
    invited: hashes.has(hashInviteEmail(email, env.BETA_INVITE_PEPPER ?? '')),
    accountCount: await countUsers(),
    capOverride: cohortCapFromEnv(env),
  })
  if (decision.ok) return
  if (decision.reason === 'invite_not_configured' || decision.reason === 'unknown_cohort') {
    throw new EnrollmentDeniedError(503, ENROLLMENT_UNAVAILABLE_RESPONSE)
  }
  throw new EnrollmentDeniedError(403, ENROLLMENT_CLOSED_RESPONSE)
}
