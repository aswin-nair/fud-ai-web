import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { prefersReducedMotion } from '../lib/feel'

/**
 * Navigate inside a view transition, so a shared element morphs across the
 * change instead of cutting.
 *
 * react-router's own `viewTransition` option only applies to data routers;
 * this app uses the `<BrowserRouter>` component API, where it is silently a
 * no-op. Rather than restructure routing for one animation, the transition is
 * driven directly — `flushSync` is required so the route has actually changed
 * by the time the browser takes its "after" snapshot.
 *
 * Falls back to a plain navigation where view transitions are unsupported, and
 * whenever the user asked for reduced motion.
 */
export function useTransitionNavigate(): (to: string) => void {
  const navigate = useNavigate()

  return (to: string) => {
    const start = typeof document !== 'undefined'
      ? document.startViewTransition?.bind(document)
      : undefined

    if (!start || prefersReducedMotion()) {
      navigate(to)
      return
    }

    start(() => {
      flushSync(() => navigate(to))
    })
  }
}
