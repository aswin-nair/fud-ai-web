import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withApiTelemetry } from './_lib/telemetry.js'
import { applyIdentityHeaders, json, releaseId, requestIdFrom } from './_lib/http.js'

/** Liveness only. A 200 means the function ran, not that Neon is reachable. */
async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = requestIdFrom(req)
  applyIdentityHeaders(res, requestId)
  json(res, 200, {
    live: true,
    requestId,
    release: releaseId(),
  })
}
export default withApiTelemetry('/api/health', handler)
