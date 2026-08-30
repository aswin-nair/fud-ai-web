import type { Mood } from '../mascot/behaviors'

/**
 * Momo.
 *
 * A dumpling rather than a blob: the pleated crown gives a silhouette you can
 * recognise at 20px, and dough is the one material where squash-and-stretch is
 * literally true, so the poke animations read as the character rather than as
 * an effect applied to it.
 */
export function Momo({
  mood = 'neutral',
  pose = 'idle_breathe',
  cosmeticId = null,
}: { mood?: Mood; pose?: string; cosmeticId?: string | null }) {
  const blush = mood === 'excited' || mood === 'proud' || mood === 'cozy'
  const blinking = pose === 'idle_blink'
  const eyeR = blinking ? 1.1 : 5

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id="momo-dough" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#FFF6E4" />
          <stop offset="100%" stopColor="#E9C89A" />
        </linearGradient>
      </defs>

      <ellipse cx="50" cy="93" rx="26" ry="4.5" fill="#3A2A22" opacity="0.13" />

      {/* Stub arms, behind the body so every join stays soft. */}
      <path d="M22 76 Q14 84 22 88" stroke="#E4BE8C" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M78 76 Q86 84 78 88" stroke="#E4BE8C" strokeWidth="7" fill="none" strokeLinecap="round" />

      <ellipse cx="50" cy="60" rx="35" ry="30" fill="url(#momo-dough)" />
      {/* The light sits top-left, matching every other surface in the app. */}
      <ellipse cx="42" cy="45" rx="17" ry="8" fill="#FFFFFF" opacity="0.55" />

      {/* Real pleats — the one detail that makes it a dumpling and not a bun. */}
      <path
        d="M16 48q8.5-14 17 0 8.5-14 17 0 8.5-14 17 0 8.5-14 17 0"
        fill="none"
        stroke="#E4BE8C"
        strokeWidth="4.6"
        strokeLinecap="round"
      />

      <circle cx="39" cy="59" r={eyeR} fill="#3A2A22" />
      <circle cx="61" cy="59" r={eyeR} fill="#3A2A22" />
      {!blinking && <circle cx="40.8" cy="57.2" r="1.7" fill="#FFFFFF" />}
      {!blinking && <circle cx="62.8" cy="57.2" r="1.7" fill="#FFFFFF" />}

      {blush && <ellipse cx="30" cy="68" rx="5" ry="3.4" fill="#FF9070" opacity="0.42" />}
      {blush && <ellipse cx="70" cy="68" rx="5" ry="3.4" fill="#FF9070" opacity="0.42" />}

      <path
        d={mood === 'sleepy' ? 'M44 70h12' : 'M44 70a6.5 6.5 0 0 0 12 0'}
        fill="none"
        stroke="#3A2A22"
        strokeWidth="3.3"
        strokeLinecap="round"
      />

      {cosmeticId === 'chef-hat' && (
        <g>
          <circle cx="38" cy="25" r="12" fill="#FFFDF8" stroke="#D9C7AF" strokeWidth="2" />
          <circle cx="52" cy="20" r="15" fill="#FFFDF8" stroke="#D9C7AF" strokeWidth="2" />
          <circle cx="66" cy="26" r="11" fill="#FFFDF8" stroke="#D9C7AF" strokeWidth="2" />
          <path d="M31 32h40l-3 13H34z" fill="#FFFDF8" stroke="#D9C7AF" strokeWidth="2" />
        </g>
      )}
      {cosmeticId === 'apron' && (
        <path d="M35 73q15 7 30 0l4 19H31z" fill="#6B9FFF" stroke="#416EC3" strokeWidth="2" />
      )}
      {cosmeticId === 'scarf' && (
        <g fill="#FF7A50" stroke="#D95A36" strokeWidth="1.8">
          <path d="M28 73q22 9 44 0l-3 9q-19 7-38 0z" />
          <path d="M61 79l12 10-9 3-7-12z" />
        </g>
      )}
      {cosmeticId === 'bow' && (
        <g fill="#FF6B9D" stroke="#C84975" strokeWidth="1.8">
          <path d="M50 78q-10-10-16-3t10 10z" />
          <path d="M50 78q10-10 16-3t-10 10z" />
          <circle cx="50" cy="79" r="4" />
        </g>
      )}
      {cosmeticId === 'specs' && (
        <g fill="none" stroke="#3A2A22" strokeWidth="2.5">
          <circle cx="39" cy="59" r="9" />
          <circle cx="61" cy="59" r="9" />
          <path d="M48 59h4M30 57l-7-3M70 57l7-3" />
        </g>
      )}
      {cosmeticId === 'medal' && (
        <g>
          <path d="M44 74l6 10 6-10" fill="none" stroke="#6B9FFF" strokeWidth="4" />
          <circle cx="50" cy="86" r="7" fill="#FFB347" stroke="#C67A17" strokeWidth="2" />
          <path d="M50 82l1.3 2.5 2.7.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.7-.4z" fill="#FFF6E4" />
        </g>
      )}
    </svg>
  )
}
