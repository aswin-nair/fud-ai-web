import { useCallback, useSyncExternalStore } from 'react'

function mediaList(query: string): MediaQueryList | undefined {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query) : undefined
}

/** Tracks a CSS media query. Reads false wherever matchMedia is unavailable. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((notify: () => void) => {
    const media = mediaList(query)
    media?.addEventListener('change', notify)
    return () => media?.removeEventListener('change', notify)
  }, [query])
  const getSnapshot = useCallback(() => mediaList(query)?.matches ?? false, [query])
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
