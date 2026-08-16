import { useState, type ReactNode } from 'react'

import { useHaptic } from '../hooks/useHaptic'

/**
 * The signature component, §6.1. The button looks physically raised and
 * depresses when pressed.
 *
 * Built as two stacked layers rather than an animated border: the shadow sits
 * static underneath, and the face slides down onto it. Animating a border
 * width instead would reflow the button on every press.
 *
 * At most one `primary` per screen. `destructive` is only ever for delete.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'destructive'

export interface PressableButtonProps {
  label?: string
  children?: ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  fullWidth?: boolean
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  'aria-label'?: string
}

export function PressableButton({
  label,
  children,
  onClick,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}: PressableButtonProps) {
  const vibrate = useHaptic()
  const [pressed, setPressed] = useState(false)

  function press() {
    if (disabled) return
    setPressed(true)
    // The tick lands on press, not release — that is what makes it feel
    // like the button did something rather than the app reacting later.
    vibrate(10)
  }

  const release = () => setPressed(false)

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      className={[
        'pressable',
        `pressable-${variant}`,
        pressed ? 'is-pressed' : '',
        fullWidth ? 'is-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      <span className="pressable-shadow" aria-hidden />
      <span className="pressable-face">{children ?? label}</span>
    </button>
  )
}
