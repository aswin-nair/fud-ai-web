import { sanitizeCrashName } from '@fud-ai/contracts'

import { recordCrash } from './analytics'

export function installCrashReporting(): () => void {
  if (typeof window === 'undefined') return () => undefined

  function onError(event: ErrorEvent) {
    recordCrash(sanitizeCrashName(event.error instanceof Error ? event.error.name : 'Error'), false)
  }

  function onRejection(event: PromiseRejectionEvent) {
    const reason = event.reason
    recordCrash(sanitizeCrashName(reason instanceof Error ? reason.name : 'Error'), false)
  }

  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)
  return () => {
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onRejection)
  }
}
