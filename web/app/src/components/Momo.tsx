import { useId } from 'react'

import type { Mood } from '../mascot/behaviors'
import { momoExpression } from '../mascot/expressions'

/**
 * Momo is a hand-drawn dumpling with a recognisable pleated silhouette. Her
 * face and limbs are separate animation targets so a behaviour changes the
 * performance, not merely the position of an otherwise static sticker.
 */
export function Momo({
  mood = 'neutral',
  pose = 'idle_breathe',
  cosmeticId = null,
  thinking = false,
}: { mood?: Mood; pose?: string; cosmeticId?: string | null; thinking?: boolean }) {
  const rawId = useId().replace(/:/g, '')
  const doughId = `momo-dough-${rawId}`
  const cheekId = `momo-cheek-${rawId}`
  const expression = momoExpression(mood, pose, thinking)
  const blush = expression === 'happy' || expression === 'wink' || mood === 'cozy'
  const blinking = expression === 'blink'
  const celebrating = expression === 'happy'
  const startled = expression === 'surprised'
  const sleepy = expression === 'sleepy'
  const winking = expression === 'wink'
  const thoughtful = expression === 'thinking'
  const waving = pose === 'wave_at_user'
  const lookingAround = pose === 'look_around'
  const stretching = pose === 'stretch'
  const wandering = pose === 'wander'
  const dancing = pose === 'tiny_dance'
  const hopping = pose === 'happy_hop'
  const pondering = pose === 'ponder'
  const bowing = pose === 'bow'
  const pointing = pose === 'point_at_target' || pose === 'glance_at_log'

  return (
    <svg
      viewBox="0 0 100 108"
      width="100%"
      height="100%"
      className={`momo-art expression-momo mood-${mood} pose-${pose}${thinking ? ' is-thinking' : ''}`}
      data-expression={expression}
      aria-hidden
    >
      <defs>
        <radialGradient id={doughId} cx="32%" cy="24%" r="78%">
          <stop offset="0%" stopColor="#FFFDF6" />
          <stop offset="58%" stopColor="#F8E7C9" />
          <stop offset="100%" stopColor="#DDB47D" />
        </radialGradient>
        <radialGradient id={cheekId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF8066" stopOpacity="0.58" />
          <stop offset="100%" stopColor="#FF8066" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Reuse the editable character beneath the old bitmap preview so the
          eyes, mouth, eyebrows and arms can genuinely change with reactions. */}
      {waving && (
        <g className="momo-raster-gesture-cues momo-raster-wave-cues">
          <path d="M11 61Q5 57 4 50M16 57Q14 50 17 45" />
        </g>
      )}
      {lookingAround && (
        <g className="momo-raster-gesture-cues momo-raster-look-cues">
          <path d="M8 54H2M5 51l-3 3 3 3M92 54h6M95 51l3 3-3 3" />
        </g>
      )}
      {stretching && (
        <g className="momo-raster-gesture-cues momo-raster-stretch-cues">
          <path d="M12 72Q5 67 5 59M5 59l-3 5M5 59l5 2M88 72q7-5 7-13M95 59l-4 5M95 59l3 5" />
        </g>
      )}
      {wandering && (
        <g className="momo-raster-gesture-cues momo-raster-wander-cues">
          <path d="M13 94q4-4 8 0M4 101q4-4 8 0M84 97q4-4 8 0" />
        </g>
      )}
      {dancing && (
        <g className="momo-raster-gesture-cues momo-raster-dance-cues">
          <path d="M11 51V37l9-3v14M11 39l9-3M78 42V28l9 3v14" />
          <circle cx="8" cy="53" r="3" />
          <circle cx="18" cy="50" r="3" />
          <circle cx="76" cy="44" r="3" />
          <circle cx="86" cy="47" r="3" />
        </g>
      )}
      {hopping && (
        <g className="momo-raster-gesture-cues momo-raster-hop-cues">
          <path d="M18 94l-8 5M24 97l-3 8M82 94l8 5M76 97l3 8" />
        </g>
      )}
      {pondering && (
        <g className="momo-raster-gesture-cues momo-raster-ponder-cues">
          <path d="M82 28c0-7 11-7 11 0 0 6-6 5-6 11" />
          <circle cx="87" cy="45" r="1.8" />
        </g>
      )}
      {bowing && (
        <g className="momo-raster-gesture-cues momo-raster-bow-cues">
          <path d="M8 58q7 7 15 5M92 58q-7 7-15 5" />
        </g>
      )}

      <ellipse className="momo-ground-shadow momo-original-art" cx="50" cy="99" rx="27" ry="5" />

      <g className="momo-arms">
        <path
          className="momo-arm momo-arm-left momo-original-art"
          d={waving ? 'M24 67Q8 56 14 42' : celebrating ? 'M24 66Q10 55 15 42' : 'M23 69Q12 77 19 84'}
        />
        <path
          className="momo-arm momo-arm-right momo-original-art"
          d={pointing ? 'M77 67Q91 63 94 52' : celebrating ? 'M76 66Q90 53 84 40' : 'M77 69Q88 77 81 84'}
        />
        {waving && <path className="momo-wave-lines momo-original-art" d="M8 35q-5 4-2 9M16 31q-4-2-7 0" />}
      </g>

      <g className="momo-body-group momo-original-art">
        <path
          className="momo-body"
          d="M16 66C14 49 20 37 31 31c6-3 10-9 19-9s13 6 19 9c11 6 17 18 15 35-2 18-13 28-34 28S18 84 16 66Z"
          fill={`url(#${doughId})`}
        />
        <path className="momo-outline" d="M16 66C14 49 20 37 31 31c6-3 10-9 19-9s13 6 19 9c11 6 17 18 15 35-2 18-13 28-34 28S18 84 16 66Z" />
        <path className="momo-pleats" d="M20 48Q27 33 34 45Q42 27 50 43Q58 27 66 45Q73 33 80 48" />
        <path className="momo-pleat-detail" d="M34 45l-3-10M50 43V28M66 45l3-10" />
        <path className="momo-highlight" d="M27 49c4-11 12-17 21-18" />

        <g className="momo-blossom">
          <circle cx="69" cy="28" r="3.4" />
          <circle cx="75" cy="29" r="3.4" />
          <circle cx="72" cy="23.5" r="3.4" />
          <circle cx="72" cy="27" r="2.1" className="momo-blossom-core" />
        </g>

        <g className="momo-face">
          {sleepy ? (
            <g className="momo-sleepy-eyes">
              <path d="M32 60q6 6 12 0" />
              <path d="M56 60q6 6 12 0" />
            </g>
          ) : blinking ? (
            <g className="momo-blink-eyes"><path d="M32 61h12M56 61h12" /></g>
          ) : celebrating ? (
            <g className="momo-happy-eyes"><path d="M32 62q6-8 12 0M56 62q6-8 12 0" /></g>
          ) : (
            <g className="momo-open-eyes">
              <ellipse cx="38" cy="60" rx={startled ? 6 : 5.4} ry={startled ? 7 : 6.2} />
              {!winking && <ellipse cx="62" cy="60" rx={startled ? 6 : 5.4} ry={startled ? 7 : 6.2} />}
              <g className="momo-pupils">
                <circle cx="38" cy="61" r="3.1" />
                {!winking && <circle cx="62" cy="61" r="3.1" />}
                <circle cx="36.8" cy="59.4" r="1.25" className="momo-eye-glint" />
                {!winking && <circle cx="60.8" cy="59.4" r="1.25" className="momo-eye-glint" />}
              </g>
              <path className="momo-lash" d={winking ? 'M32 55l-2-2' : 'M32 55l-2-2M68 55l2-2'} />
              {winking && <path className="momo-wink-eye" d="M56 60q6 6 12 0" />}
            </g>
          )}

          <path className="momo-brow momo-brow-left" d={startled || thoughtful ? 'M32 49q6-3 12 0' : 'M32 51q6-2 12 0'} />
          <path className="momo-brow momo-brow-right" d={startled ? 'M56 49q6-3 12 0' : 'M56 51q6-2 12 0'} />
          {blush && <ellipse cx="28" cy="71" rx="8" ry="5" fill={`url(#${cheekId})`} />}
          {blush && <ellipse cx="72" cy="71" rx="8" ry="5" fill={`url(#${cheekId})`} />}

          {startled ? (
            <ellipse className="momo-mouth-fill" cx="50" cy="74" rx="4.2" ry="5.2" />
          ) : celebrating ? (
            <path className="momo-happy-mouth" d="M41 72q9 12 18 0Z" />
          ) : (
            <path
              className="momo-mouth"
              d={sleepy
                ? 'M45 74q5 3 10 0'
                : winking
                  ? 'M43 74q10 5 16-4'
                  : thoughtful
                    ? 'M44 74q6 4 12 0'
                    : 'M43 72q7 8 14 0'}
            />
          )}
        </g>
      </g>

      <g className="momo-feet momo-original-art">
        <ellipse cx="34" cy="92" rx="9" ry="5" />
        <ellipse cx="66" cy="92" rx="9" ry="5" />
      </g>

      {celebrating && (
        <g className="momo-celebration-sparks">
          <path d="M12 25v8M8 29h8M87 21v8M83 25h8" />
          <circle cx="17" cy="16" r="2" />
          <circle cx="84" cy="37" r="1.8" />
        </g>
      )}

      {thinking && (
        <g className="momo-thought-orbit">
          <circle cx="80" cy="18" r="2.2" />
          <circle cx="87" cy="12" r="3" />
          <circle cx="95" cy="5" r="4" />
        </g>
      )}

      {cosmeticId === 'chef-hat' && (
        <g className="momo-cosmetic momo-chef-hat">
          <circle cx="38" cy="25" r="12" fill="#FFFDF8" stroke="#D9C7AF" strokeWidth="2" />
          <circle cx="52" cy="20" r="15" fill="#FFFDF8" stroke="#D9C7AF" strokeWidth="2" />
          <circle cx="66" cy="26" r="11" fill="#FFFDF8" stroke="#D9C7AF" strokeWidth="2" />
          <path d="M31 32h40l-3 13H34z" fill="#FFFDF8" stroke="#D9C7AF" strokeWidth="2" />
        </g>
      )}
      {cosmeticId === 'apron' && (
        <path className="momo-cosmetic" d="M35 73q15 7 30 0l4 19H31z" fill="#6B9FFF" stroke="#416EC3" strokeWidth="2" />
      )}
      {cosmeticId === 'scarf' && (
        <g className="momo-cosmetic" fill="#FF7A50" stroke="#D95A36" strokeWidth="1.8">
          <path d="M28 73q22 9 44 0l-3 9q-19 7-38 0z" />
          <path d="M61 79l12 10-9 3-7-12z" />
        </g>
      )}
      {cosmeticId === 'bow' && (
        <g className="momo-cosmetic" fill="#FF6B9D" stroke="#C84975" strokeWidth="1.8">
          <path d="M50 78q-10-10-16-3t10 10z" />
          <path d="M50 78q10-10 16-3t-10 10z" />
          <circle cx="50" cy="79" r="4" />
        </g>
      )}
      {cosmeticId === 'specs' && (
        <g className="momo-cosmetic" fill="none" stroke="#3A2A22" strokeWidth="2.5">
          <circle cx="39" cy="59" r="9" />
          <circle cx="61" cy="59" r="9" />
          <path d="M48 59h4M30 57l-7-3M70 57l7-3" />
        </g>
      )}
      {cosmeticId === 'medal' && (
        <g className="momo-cosmetic">
          <path d="M44 74l6 10 6-10" fill="none" stroke="#6B9FFF" strokeWidth="4" />
          <circle cx="50" cy="86" r="7" fill="#FFB347" stroke="#C67A17" strokeWidth="2" />
          <path d="M50 82l1.3 2.5 2.7.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.7-.4z" fill="#FFF6E4" />
        </g>
      )}
    </svg>
  )
}
