const encoder = new TextEncoder()

export function canonicalJson(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Cannot canonicalize a non-finite number')
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>
    return `{${Object.keys(object).filter(key => object[key] !== undefined).sort().map(key => (
      `${JSON.stringify(key)}:${canonicalJson(object[key])}`
    )).join(',')}}`
  }
  throw new Error('Cannot canonicalize a non-JSON value')
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function checksumRecords(records: readonly unknown[]): Promise<string> {
  return sha256Hex(canonicalJson(records))
}
