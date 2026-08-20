/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_DATA_BACKEND: string
  readonly VITE_API_URL: string
  readonly VITE_RELEASE_ID: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_ENABLE_REMOTE_TELEMETRY?: string
}
