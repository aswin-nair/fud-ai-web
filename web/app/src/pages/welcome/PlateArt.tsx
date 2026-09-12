import type { ReactElement, SVGProps } from 'react'
import type { MealId } from './meals'

/*
 * Top-down meal drawings for the welcome page: flat fills, ink outlines, no faces.
 * Everything is placed on a 400 × 400 plate so scan markers can share coordinates.
 * Scattered details (rice, toppings, granola) come from a seeded generator, so every
 * render draws the same plate.
 */

const INK = '#161614'
const PAPER = '#fffdf6'

function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

function polar(cx: number, cy: number, radius: number, degrees: number): [number, number] {
  const angle = (degrees * Math.PI) / 180
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
}

function wedge(cx: number, cy: number, radius: number, from: number, to: number): string {
  const [x0, y0] = polar(cx, cy, radius, from)
  const [x1, y1] = polar(cx, cy, radius, to)
  return `M${cx} ${cy}L${x0.toFixed(1)} ${y0.toFixed(1)}A${radius} ${radius} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z`
}

const RICE = (() => {
  const random = seeded(11)
  const grains: { x: number; y: number; turn: number }[] = []
  while (grains.length < 34) {
    const distance = Math.sqrt(random()) * 128
    const [x, y] = polar(200, 200, distance, random() * 360)
    if (x < 206) grains.push({ x, y, turn: random() * 180 })
  }
  return grains
})()

const CHICKEN = [[244, 118, 32], [284, 150, 52], [300, 198, 82], [262, 176, 58], [226, 158, 24]] as const
const LEAVES = [[250, 262, -30], [292, 248, 20], [272, 302, 60], [232, 300, -60], [306, 290, 10]] as const

const SLICES = [
  { cx: 186, cy: 214, from: 150, to: 222 },
  { cx: 214, cy: 186, from: 258, to: 330 },
] as const

const TOPPINGS = SLICES.map((slice, index) => {
  const random = seeded(31 + index)
  const spot = (min: number, max: number) => polar(slice.cx, slice.cy, min + random() * (max - min), slice.from + 8 + random() * (slice.to - slice.from - 16))
  return {
    cheese: Array.from({ length: 7 }, () => { const [x, y] = spot(30, 116); return { x, y, r: 10 + random() * 8 } }),
    olives: Array.from({ length: 3 }, () => { const [x, y] = spot(40, 112); return { x, y } }),
  }
})

const PEPPERS = [[84, 226, 20], [110, 250, -30], [132, 196, 70], [246, 124, -15], [282, 112, 40]] as const

const GRANOLA = (() => {
  const random = seeded(53)
  return Array.from({ length: 16 }, () => ({ x: 122 + random() * 112, y: 158 + random() * 90, r: 7 + random() * 7 }))
})()

const BLUEBERRIES = [[262, 130], [292, 162], [250, 170], [284, 204]] as const
const RASPBERRIES = [[300, 252], [262, 282], [226, 304]] as const

function Plate() {
  return (
    <g>
      <circle cx="200" cy="200" r="186" fill={PAPER} stroke={INK} strokeWidth="6" />
      <circle cx="200" cy="200" r="158" fill="none" stroke="#e8dec8" strokeWidth="10" />
    </g>
  )
}

function Bowl({ food }: { food: string }) {
  return (
    <g>
      <circle cx="200" cy="200" r="186" fill={INK} />
      <circle cx="200" cy="200" r="152" fill={food} />
    </g>
  )
}

function Toast() {
  return (
    <g>
      <Plate />
      <rect x="92" y="100" width="216" height="200" rx="36" fill="#d9a55b" stroke={INK} strokeWidth="6" />
      <rect x="114" y="122" width="172" height="156" rx="24" fill="#f0c27b" />
      {[0, 1, 2, 3, 4].map(slice => {
        const cx = 150 + slice * 24
        return (
          <g key={slice} transform={`rotate(${-28 + slice * 14} ${cx} 178)`}>
            <ellipse cx={cx} cy="178" rx="19" ry="44" fill="#9cc052" stroke={INK} strokeWidth="4" />
            <ellipse cx={cx} cy="182" rx="9" ry="30" fill="#c8de84" />
          </g>
        )
      })}
      {/* Two overlapping circles read as one egg: ink underlay for the outline, paper on top. */}
      <circle cx="228" cy="236" r="26" fill={INK} stroke={INK} strokeWidth="10" />
      <circle cx="254" cy="258" r="42" fill={INK} stroke={INK} strokeWidth="10" />
      <circle cx="228" cy="236" r="26" fill={PAPER} />
      <circle cx="254" cy="258" r="42" fill={PAPER} />
      <circle cx="252" cy="256" r="18" fill="#f6b233" stroke={INK} strokeWidth="4" />
      {[[176, 150], [206, 204], [150, 196], [226, 150]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill={INK} />)}
    </g>
  )
}

function RiceBowl() {
  return (
    <g>
      <Bowl food="#f4efe2" />
      {RICE.map((grain, index) => (
        <ellipse key={index} cx={grain.x.toFixed(1)} cy={grain.y.toFixed(1)} rx="6.5" ry="2.8" transform={`rotate(${grain.turn.toFixed(0)} ${grain.x.toFixed(1)} ${grain.y.toFixed(1)})`} fill={PAPER} stroke="#cfc4aa" strokeWidth="1.4" />
      ))}
      {CHICKEN.map(([x, y, turn]) => (
        <g key={`${x}-${y}`} transform={`rotate(${turn} ${x} ${y})`}>
          <rect x={x - 15} y={y - 28} width="30" height="56" rx="9" fill="#cf8a4b" stroke={INK} strokeWidth="4" />
          <line x1={x - 5} y1={y - 16} x2={x - 5} y2={y + 16} stroke="#9d6130" strokeWidth="4" strokeLinecap="round" />
          <line x1={x + 6} y1={y - 16} x2={x + 6} y2={y + 16} stroke="#9d6130" strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
      {LEAVES.map(([x, y, turn]) => (
        <g key={`${x}-${y}`} transform={`rotate(${turn} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx="16" ry="30" fill="#5f9a3f" stroke={INK} strokeWidth="4" />
          <line x1={x} y1={y - 22} x2={x} y2={y + 22} stroke="#8fc15e" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ))}
      <polyline points="118,150 150,128 176,162 206,138 232,172" fill="none" stroke="#ff5c28" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

function Pizza() {
  return (
    <g>
      <Plate />
      {SLICES.map((slice, index) => (
        <g key={index}>
          <path d={wedge(slice.cx, slice.cy, 150, slice.from, slice.to)} fill="#e0a458" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
          <path d={wedge(slice.cx, slice.cy, 128, slice.from + 3, slice.to - 3)} fill="#e2552d" />
          {TOPPINGS[index].cheese.map((cheese, i) => <circle key={i} cx={cheese.x.toFixed(1)} cy={cheese.y.toFixed(1)} r={cheese.r.toFixed(1)} fill="#f7d774" />)}
          {TOPPINGS[index].olives.map((olive, i) => (
            <g key={i}>
              <circle cx={olive.x.toFixed(1)} cy={olive.y.toFixed(1)} r="7" fill={INK} />
              <circle cx={olive.x.toFixed(1)} cy={olive.y.toFixed(1)} r="2.6" fill="#e2552d" />
            </g>
          ))}
        </g>
      ))}
      {PEPPERS.map(([x, y, turn]) => (
        <rect key={`${x}-${y}`} x={x - 9} y={y - 4} width="18" height="8" rx="3" transform={`rotate(${turn} ${x} ${y})`} fill="#5f9a3f" stroke={INK} strokeWidth="2" />
      ))}
    </g>
  )
}

function Yogurt() {
  return (
    <g>
      <Bowl food={PAPER} />
      <circle cx="200" cy="200" r="108" fill="none" stroke="#ece4d2" strokeWidth="6" />
      <circle cx="200" cy="200" r="60" fill="none" stroke="#ece4d2" strokeWidth="6" />
      {GRANOLA.map((piece, index) => <circle key={index} cx={piece.x.toFixed(1)} cy={piece.y.toFixed(1)} r={piece.r.toFixed(1)} fill="#c98a4a" stroke={INK} strokeWidth="2.5" />)}
      {BLUEBERRIES.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="14" fill="#4b4a8f" stroke={INK} strokeWidth="3" />
          <circle cx={x - 4} cy={y - 4} r="3" fill="#8f8ed0" />
        </g>
      ))}
      {RASPBERRIES.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="16" fill="#e3344b" stroke={INK} strokeWidth="3" />
          {[[-5, -5], [5, -4], [-4, 5], [5, 5]].map(([dx, dy]) => <circle key={`${dx}${dy}`} cx={x + dx} cy={y + dy} r="2.4" fill="#b01f36" />)}
        </g>
      ))}
      <ellipse cx="156" cy="292" rx="12" ry="22" transform="rotate(-35 156 292)" fill="#5f9a3f" stroke={INK} strokeWidth="3" />
      <ellipse cx="178" cy="304" rx="12" ry="22" transform="rotate(25 178 304)" fill="#5f9a3f" stroke={INK} strokeWidth="3" />
    </g>
  )
}

const ART: Record<MealId, () => ReactElement> = { toast: Toast, bowl: RiceBowl, pizza: Pizza, yogurt: Yogurt }

export function PlateArt({ meal, ...props }: { meal: MealId } & Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'children'>) {
  const Art = ART[meal]
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" focusable="false" {...props}>
      <Art />
    </svg>
  )
}
