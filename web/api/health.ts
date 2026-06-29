import { OAuth2Client } from 'google-auth-library'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isDbConfigured } from '../_lib/db'
import { json } from '../_lib/http'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  json(res, 200, {
    ok: true,
    database: isDbConfigured(),
    timestamp: new Date().toISOString(),
  })
}
