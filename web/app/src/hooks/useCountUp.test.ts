import { describe, expect, it } from 'vitest'
import { prefersReducedMotion } from '../lib/tokens'
import { motion } from '../lib/tokens'

describe('count-up motion tokens', () => {
  it('stays still when the platform has no reduced-motion media query', () => {
    expect(prefersReducedMotion()).toBe(false)
  })

  it('keeps enter slower than press', () => {
    expect(motion.enter).toBeGreaterThan(motion.press)
    expect(motion.stagger).toBeLessThan(motion.enter)
  })
})
