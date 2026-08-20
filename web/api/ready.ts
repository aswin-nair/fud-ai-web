import type { VercelRequest, VercelResponse } from '@vercel/node'
import { probeDatabase } from './_lib/db.js'
import { applyIdentityHeaders, json, releaseId, requestIdFrom } from './_lib/http.js'

/** Readiness. 200 only after a bounded database probe succeeds. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = requestIdFrom(req)
  applyIdentityHeaders(res, requestId)
  const ready = await probeDatabase()
  json(res, ready ? 200 : 503, {
    ready,
    requestId,
    release: releaseId(),
  })
}
