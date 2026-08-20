import { DOMAIN_PACKAGE_ID } from '@fud-ai/domain'

/** Cloud sync via Vercel API + Neon. Must be set explicitly to `local` or `neon`. */
export type DataBackend = 'local' | 'neon'

export class DataBackendConfigError extends Error {
  constructor(message = 'This build is missing a data backend. Rebuild it with an explicit local or Neon mode.') {
    super(message)
    this.name = 'DataBackendConfigError'
  }
}

export function dataBackend(): DataBackend {
  const mode = (import.meta.env.VITE_DATA_BACKEND ?? '').trim().toLowerCase()
  if (mode === 'neon' || mode === 'local') return mode
  throw new DataBackendConfigError()
}

export function isCloudBackend(): boolean {
  return dataBackend() === 'neon'
}

export function apiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_URL ?? '').trim()
  if (configured) return configured.replace(/\/$/, '')
  return ''
}

/** Baked into the client bundle so a cloud build can be grepped for Neon + the domain package. */
export const DATA_BACKEND_BUILD_ID = `__FUD_BACKEND_${import.meta.env.VITE_DATA_BACKEND}__`
export const DOMAIN_BUILD_ID = DOMAIN_PACKAGE_ID
export const RELEASE_BUILD_ID = (import.meta.env.VITE_RELEASE_ID ?? '').trim() || 'unassigned'
