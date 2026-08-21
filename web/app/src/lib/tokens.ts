/**
 * The JS-visible half of the design tokens. Colours, spacing and radii live in
 * :root in styles/tokens.css; these are the values JavaScript has to know about —
 * animation durations, and the geometry the calorie ring computes from.
 *
 * Kept in step with index.css by hand. There is deliberately no runtime
 * getComputedStyle lookup: reading a CSS variable per frame to drive an
 * animation is the kind of thing that looks clever and janks on a cheap phone.
 */
export const motion = {
  /** Button depress. */
  press: 100,
  /** Ring and macro bar fills. */
  fill: 600,
  /** Bottom sheet. */
  sheet: 260,
  /** Confetti, badge pop. */
  celebrate: 900,
  /** Section and list entrance. */
  enter: 420,
  /** Delay between staggered siblings. */
  stagger: 45,
} as const

/** Height of the raised button's exposed shadow face, and its travel. §6.1 */
export const PRESS_DEPTH = 4

/** Stroke width as a share of ring diameter, per §7.1. */
export const RING_STROKE_RATIO = 0.1

/** Gap between macro bars when they fill. §11.3 */
export const MACRO_STAGGER_MS = 60

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
