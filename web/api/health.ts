import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isDbConfigured } from './_lib/db.js'
import { json } from './_lib/http.js'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  json(res, 200, {
    ok: true,
    database: isDbConfigured(),
    timestamp: new Date().toISOString(),
  })
}
