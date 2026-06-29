import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isDbConfigured } from '../_lib/db'
import { badRequest, json, methodNotAllowed, readJson, serverError } from '../_lib/http'
import { signSession } from '../_lib/jwt'
import { validateEmail, validatePasswordInput } from '../_lib/password'
import { registerEmailUser } from '../_lib/users'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })

  try {
    const body = await readJson<{ name?: string; email?: string; password?: string }>(req)
    const name = body.name?.trim() ?? ''
    const email = body.email ?? ''
    const password = body.password ?? ''

    if (!name) return badRequest(res, 'Name is required')
    const emailErr = validateEmail(email)
    if (emailErr) return badRequest(res, emailErr)
    const passErr = validatePasswordInput(password, true)
    if (passErr) return badRequest(res, passErr)

    const user = await registerEmailUser(name, email, password)
    const token = await signSession(user)
    json(res, 201, { token, user })
  } catch (err) {
    if (err instanceof Error && err.message.includes('already exists')) {
      return badRequest(res, err.message)
    }
    serverError(res, err)
  }
}
