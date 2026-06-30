import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 650): number {
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)
  const rafRef = useRef(0)

  useEffect(() => {
    const from = prevRef.current
    prevRef.current = target
    if (from === target) return

    cancelAnimationFrame(rafRef.current)
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - (1 - t) ** 3
      setDisplay(Math.round(from + (target - from) * ease))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return display
}
