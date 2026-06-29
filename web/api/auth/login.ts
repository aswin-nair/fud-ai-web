import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isDbConfigured } from '../_lib/db'
import { badRequest, json, methodNotAllowed, readJson, serverError, unauthorized } from '../_lib/http'
import { signSession } from '../_lib/jwt'
import { validateEmail, validatePasswordInput } from '../_lib/password'
import { loginEmailUser } from '../_lib/users'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })

  try {
    const body = await readJson<{ email?: string; password?: string }>(req)
    const email = body.email ?? ''
    const password = body.password ?? ''

    const emailErr = validateEmail(email)
    if (emailErr) return badRequest(res, emailErr)
    const passErr = validatePasswordInput(password, false)
    if (passErr) return badRequest(res, passErr)

    const user = await loginEmailUser(email, password)
    const token = await signSession(user)
    json(res, 200, { token, user })
  } catch (err) {
    if (err instanceof Error && (err.message.includes('No account') || err.message.includes('Incorrect'))) {
      return unauthorized(res, err.message)
    }
    serverError(res, err)
  }
}
