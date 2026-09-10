/** Shared Motion recipes for the food-quest UI. Keep the rhythm consistent. */
export const motionSpring = {
  type: 'spring',
  stiffness: 360,
  damping: 25,
  mass: 0.8,
} as const

export const motionSoftSpring = {
  type: 'spring',
  stiffness: 220,
  damping: 24,
  mass: 0.9,
} as const

export const motionFade = {
  type: 'tween',
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1],
} as const

/** Full props for an opacity-only entrance; motionFade is a transition, not props. */
export const motionOpacity = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: motionFade,
} as const

/** Keyframe loops need a tween; physics springs only support two keyframes. */
export const motionIdle = {
  type: 'tween',
  duration: 2.8,
  ease: 'easeInOut',
  repeat: Infinity,
  repeatDelay: 2.4,
} as const

export const motionStagger = {
  ...motionSpring,
  delayChildren: 0.08,
  staggerChildren: 0.055,
} as const

export const motionStep = {
  initial: { opacity: 0, x: 22, rotate: 1.5 },
  animate: { opacity: 1, x: 0, rotate: 0 },
  exit: { opacity: 0, x: -18, rotate: -1 },
  transition: motionSpring,
} as const

export const motionPop = {
  initial: { opacity: 0, scale: 0.84, y: 14 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: -8 },
  transition: motionSoftSpring,
} as const
