import { useState } from 'react'

import type { MascotState } from '@fud-ai/product/mascotVoice'
import { useFeel } from '../hooks/useHaptic'
import { useMascotLife } from '../hooks/useMascotLife'

/**
 * §7.6. One component, six states, driven only by logging behaviour.
 *
 * There is deliberately no sad, disappointed or crying state, and the mascot
 * never reacts to a calorie total, a macro split, or a particular food — §2.5.
 * Going over target renders as `neutral`, exactly like any other ordinary
 * moment, because it is one.
 *
 * Shape language: rounded rectangles, circles and rounded triangles only, with
 * the sizes deliberately uneven — a body far larger than the head-top sprout,
 * small feet against wide arms. Repeating one radius at one size is what makes
 * flat vector art look generic.
 */
/* One definition, shared with the voice and with mobile. Re-exported here
   because most of the app reaches for it through the component. */
export type { MascotState } from '@fud-ai/product/mascotVoice'

export interface MascotProps {
  state?: MascotState
  size?: number
  /**
   * Makes the mascot pokeable. Given a handler it becomes a real button that
   * squashes and springs back, so the character answers a finger rather than
   * only reacting to events elsewhere in the app.
   *
   * A poke is an interaction, not a judgement: it never inspects a number, and
   * the lines it triggers say nothing about what was eaten. §2.5 holds.
   */
  onPoke?: () => void
}

export function Mascot({ state = 'idle', size = 96, onPoke }: MascotProps) {
  const feel = useFeel()
  const [poked, setPoked] = useState(false)
  const life = useMascotLife<HTMLDivElement & HTMLButtonElement>()

  function poke() {
    feel('poke')
    // Restart the squash even on a rapid second poke.
    setPoked(false)
    requestAnimationFrame(() => setPoked(true))
    onPoke?.()
  }

  const art = (
      <svg viewBox="0 0 100 100" width={size} height={size} className="mascot-svg">
        <g className="mascot-bob">
          <g className="mascot-lean">
          <Arms state={state} />

          {/* Feet: small against the body, and set wide. */}
          <rect x={30} y={80} width={16} height={11} rx={5.5} className="mascot-limb" />
          <rect x={54} y={80} width={16} height={11} rx={5.5} className="mascot-limb" />

          {/* A rounded triangle sprout — the one pointed form, still soft. */}
          <path d="M50 9 L57 21 Q50 18 43 21 Z" className="mascot-sprout" />

          {/* Body: the dominant mass. */}
          <rect x={21} y={20} width={58} height={62} rx={26} className="mascot-body" />

          {/* Face plate, offset low so the head reads as a head. */}
          <ellipse cx={50} cy={53} rx={22} ry={19} className="mascot-face" />

          <g className={state === 'sleepy' ? undefined : 'mascot-gaze'}>
            <Eyes state={state} />
          </g>
          <circle cx={34} cy={60} r={4.5} className="mascot-blush" />
          <circle cx={66} cy={60} r={4.5} className="mascot-blush" />
          <Mouth state={state} />

          {state === 'sleepy' && <Zzz />}
          {state === 'celebrating' && <Sparkles />}
          {state === 'proud' && <Star />}
          </g>
        </g>
      </svg>
  )

  if (!onPoke) {
    return (
      <div
        ref={life}
        className={`mascot mascot-${state}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label={LABELS[state]}
      >
        {art}
      </div>
    )
  }

  return (
    <button
      ref={life}
      type="button"
      className={`mascot mascot-${state} is-pokeable${poked ? ' is-poked' : ''}`}
      style={{ width: size, height: size }}
      onClick={poke}
      onAnimationEnd={() => setPoked(false)}
      aria-label={`${LABELS[state]}. Tap to say hello.`}
    >
      {art}
    </button>
  )
}

const LABELS: Record<MascotState, string> = {
  idle: 'Mascot resting',
  happy: 'Mascot pleased',
  celebrating: 'Mascot celebrating',
  sleepy: 'Mascot dozing',
  proud: 'Mascot proud',
  neutral: 'Mascot',
}

function Arms({ state }: { state: MascotState }) {
  // Arms up only when there is something to throw them up about.
  if (state === 'celebrating' || state === 'proud') {
    return (
      <g className="mascot-limb-stroke">
        <path d="M26 44 L13 30" />
        <path d="M74 44 L87 30" />
      </g>
    )
  }

  return (
    <g className="mascot-limb-stroke">
      <path d="M26 56 L12 65" />
      <path d="M74 56 L88 65" />
    </g>
  )
}

function Eyes({ state }: { state: MascotState }) {
  if (state === 'sleepy') {
    return (
      <g className="mascot-line">
        <path d="M34 46 a6 6 0 0 0 12 0" />
        <path d="M54 46 a6 6 0 0 0 12 0" />
      </g>
    )
  }

  if (state === 'happy' || state === 'celebrating' || state === 'proud') {
    return (
      <g className="mascot-line">
        <path d="M34 48 a6 6 0 0 1 12 0" />
        <path d="M54 48 a6 6 0 0 1 12 0" />
      </g>
    )
  }

  return (
    <g className="mascot-ink">
      <circle cx={40} cy={46} r={4.4} />
      <circle cx={60} cy={46} r={4.4} />
    </g>
  )
}

function Mouth({ state }: { state: MascotState }) {
  if (state === 'celebrating') {
    return <ellipse cx={50} cy={62} rx={6.5} ry={8} className="mascot-ink" />
  }

  if (state === 'sleepy') {
    return <path d="M45 63 a5 5 0 0 0 10 0" className="mascot-line" />
  }

  if (state === 'neutral') {
    return <path d="M45 64 h10" className="mascot-line" />
  }

  const width = state === 'happy' || state === 'proud' ? 9 : 6
  return (
    <path
      d={`M${50 - width} 62 a${width} ${width} 0 0 0 ${width * 2} 0`}
      className="mascot-line"
    />
  )
}

function Zzz() {
  return (
    <g className="mascot-line mascot-zzz">
      <path d="M74 20 h9 l-9 10 h9" />
      <path d="M86 7 h6 l-6 7 h6" />
    </g>
  )
}

function Sparkles() {
  return (
    <g className="mascot-line mascot-sparkle">
      <path d="M50 4 v7 M46.5 7.5 h7" />
      <path d="M18 16 v5 M15.5 18.5 h5" />
      <path d="M82 14 v5 M79.5 16.5 h5" />
    </g>
  )
}

function Star() {
  return (
    <circle cx={50} cy={12} r={5} className="mascot-star" />
  )
}
