/** Cloud sync via Vercel API + Neon. Set VITE_DATA_BACKEND=neon in production. */
export type DataBackend = 'local' | 'neon'

export function dataBackend(): DataBackend {
  const mode = (import.meta.env.VITE_DATA_BACKEND ?? 'local').trim().toLowerCase()
  return mode === 'neon' ? 'neon' : 'local'
}

export function isCloudBackend(): boolean {
  return dataBackend() === 'neon'
}

export function apiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_URL ?? '').trim()
  if (configured) return configured.replace(/\/$/, '')
  return ''
}
