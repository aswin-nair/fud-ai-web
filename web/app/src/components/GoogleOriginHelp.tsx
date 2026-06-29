import { useMemo, useState } from 'react'
import { googleClientId } from '../lib/auth'

export function GoogleOriginHelp() {
  const [copied, setCopied] = useState(false)

  const origins = useMemo(() => {
    const current = window.location.origin
    const list = new Set([current, 'http://localhost:5173', 'http://127.0.0.1:5173'])
    return [...list]
  }, [])

  const clientSuffix = googleClientId.slice(-20)

  async function copyOrigin(origin: string) {
    await navigator.clipboard.writeText(origin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <details className="google-origin-help">
      <summary>Google sign-in blocked? Fix in Google Cloud Console</summary>
      <div className="google-origin-body">
        <p>
          Error <strong>401 invalid_client / no registered origin</strong> means your OAuth
          client doesn&apos;t allow this URL yet.
        </p>
        <ol>
          <li>
            Open{' '}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
            >
              Google Cloud → Credentials
            </a>
          </li>
          <li>
            Edit your <strong>Web application</strong> OAuth client
            {clientSuffix && <> (…{clientSuffix})</>}
          </li>
          <li>
            Under <strong>Authorized JavaScript origins</strong>, add each origin below (no trailing slash):
          </li>
        </ol>
        <ul className="origin-list">
          {origins.map(origin => (
            <li key={origin}>
              <code>{origin}</code>
              <button type="button" className="btn-copy" onClick={() => copyOrigin(origin)}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </li>
          ))}
        </ul>
        <p className="google-origin-note">
          Save, wait 1–2 minutes, then hard-refresh this page (Ctrl+Shift+R).
          Use <strong>http</strong> not https for localhost.
        </p>
      </div>
    </details>
  )
}
