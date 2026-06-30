import { useEffect, useRef } from 'react'

const COLORS = ['#FF375F', '#FF6B9D', '#6B9FFF', '#FFB347', '#4CD964', '#FFFACD', '#fff']

interface Particle {
  x: number; y: number
  vx: number; vy: number
  color: string
  w: number; h: number
  rot: number; rotV: number
  alpha: number
}

export function Confetti({ onDone }: { onDone?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = Array.from({ length: 90 }, () => ({
      x: canvas.width * 0.5 + (Math.random() - 0.5) * 180,
      y: canvas.height * 0.42,
      vx: (Math.random() - 0.5) * 15,
      vy: Math.random() * -13 - 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: Math.random() * 9 + 4,
      h: Math.random() * 5 + 3,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 10,
      alpha: 1,
    }))

    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      for (const p of particles) {
        p.vy += 0.42
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.rot += p.rotV
        p.alpha = Math.max(0, p.alpha - (p.y > canvas.height * 0.75 ? 0.035 : 0.008))
        if (p.alpha > 0 && p.y < canvas.height + 20) alive = true
        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
      if (alive) raf = requestAnimationFrame(draw)
      else onDone?.()
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [onDone])

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}
    />
  )
}
