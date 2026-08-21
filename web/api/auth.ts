import type { VercelRequest, VercelResponse } from '@vercel/node'
import changePassword from './_auth/change-password.js'
import forgotPassword from './_auth/forgot-password.js'
import google from './_auth/google.js'
import login from './_auth/login.js'
import logout from './_auth/logout.js'
import logoutAll from './_auth/logout-all.js'
import refresh from './_auth/refresh.js'
import register from './_auth/register.js'
import resetPassword from './_auth/reset-password.js'
import { json, serverError } from './_lib/http.js'

const AUTH_ACTIONS = {
  'change-password': changePassword,
  'forgot-password': forgotPassword,
  google,
  login,
  logout,
  'logout-all': logoutAll,
  refresh,
  register,
  'reset-password': resetPassword,
} as const

type AuthAction = keyof typeof AUTH_ACTIONS

function headerPath(req: VercelRequest, name: string): string {
  const value = req.headers[name]
  return typeof value === 'string' ? value : ''
}

function readAction(req: VercelRequest): string {
  const raw = req.query.action
  if (typeof raw === 'string' && raw) return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0]) return raw[0]
  const candidates = [
    req.url ?? '',
    headerPath(req, 'x-invoke-path'),
    headerPath(req, 'x-matched-path'),
  ]
  for (const candidate of candidates) {
    const path = candidate.split('?')[0] ?? ''
    const match = path.match(/^\/api\/auth\/([^/]+)$/)
    if (match?.[1]) return match[1]
  }
  return ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = readAction(req)
  if (!(action in AUTH_ACTIONS)) {
    json(res, 404, { error: 'Not found' })
    return
  }
  try {
    await AUTH_ACTIONS[action as AuthAction](req, res)
  } catch (error) {
    serverError(res, error)
  }
}
