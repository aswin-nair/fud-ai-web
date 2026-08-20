import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import {
  DATA_BACKEND_BUILD_ID,
  DOMAIN_BUILD_ID,
  DataBackendConfigError,
  dataBackend,
} from './lib/dataBackend'
import { installCrashReporting } from './lib/crash'

function ConfigurationError({ message }: { message: string }) {
  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Configuration error</h1>
        <p className="login-sub">{message}</p>
      </div>
    </div>
  )
}

function boot() {
  installCrashReporting()
  const root = createRoot(document.getElementById('root')!)
  try {
    dataBackend()
    document.documentElement.dataset.fudBackend = DATA_BACKEND_BUILD_ID
    document.documentElement.dataset.fudDomain = DOMAIN_BUILD_ID
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    const message = error instanceof DataBackendConfigError
      ? error.message
      : 'This build is missing a data backend. Rebuild it with an explicit local or Neon mode.'
    root.render(<ConfigurationError message={message} />)
  }
}

boot()
