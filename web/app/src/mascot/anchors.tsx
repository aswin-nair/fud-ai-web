/**
 * Anchor registry — store elements, measure lazily at behavior-start.
 */

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'

export type AnchorId =
  | 'fab'
  | 'macro_meter'
  | 'calorie_ring'
  | 'streak_flame'
  | 'ticket_top'
  | 'last_entry'
  | 'water_row'

export interface AnchorRect {
  x: number
  y: number
  width: number
  height: number
}

interface AnchorRegistry {
  register(id: AnchorId, el: HTMLElement | null): void
  getRect(id: AnchorId): AnchorRect | null
  has(id: AnchorId): boolean
  onInvalidate(cb: () => void): () => void
}

const Ctx = createContext<AnchorRegistry | null>(null)

export function AnchorProvider({ children }: { children: ReactNode }) {
  const elements = useRef(new Map<AnchorId, HTMLElement>())
  const listeners = useRef(new Set<() => void>())

  const register = useCallback((id: AnchorId, el: HTMLElement | null) => {
    if (el) elements.current.set(id, el)
    else elements.current.delete(id)
  }, [])

  const getRect = useCallback((id: AnchorId): AnchorRect | null => {
    const el = elements.current.get(id)
    if (!el || !el.isConnected) return null
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return null
    const vh = window.innerHeight
    const vw = window.innerWidth
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return null
    return {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      width: r.width,
      height: r.height,
    }
  }, [])

  const has = useCallback((id: AnchorId) => {
    const el = elements.current.get(id)
    return !!el && el.isConnected
  }, [])

  const onInvalidate = useCallback((cb: () => void) => {
    listeners.current.add(cb)
    return () => listeners.current.delete(cb)
  }, [])

  useEffect(() => {
    let frame = 0
    const fire = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        listeners.current.forEach(cb => cb())
      })
    }
    window.addEventListener('scroll', fire, { passive: true, capture: true })
    window.addEventListener('resize', fire, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', fire, { capture: true })
      window.removeEventListener('resize', fire)
    }
  }, [])

  const value = useMemo<AnchorRegistry>(
    () => ({ register, getRect, has, onInvalidate }),
    [register, getRect, has, onInvalidate],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAnchorRegistry(): AnchorRegistry | null {
  return useContext(Ctx)
}

export function useAnchor(id: AnchorId) {
  const ctx = useAnchorRegistry()
  return useCallback(
    (el: HTMLElement | null) => ctx?.register(id, el),
    [ctx, id],
  )
}
