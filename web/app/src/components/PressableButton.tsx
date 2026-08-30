import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { useFeel } from '../hooks/useHaptic'

/**
 * The signature component, §6.1. The button looks physically raised and
 * depresses when pressed.
 *
 * At most one `primary` per screen. `destructive` is only ever for delete.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'

export interface PressableButtonProps {
  label?: string
  children?: ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  fullWidth?: boolean
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  to?: string
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
  to,
  ...rest
}: PressableButtonProps) {
  const feel = useFeel()
  const [pressed, setPressed] = useState(false)

  function press() {
    if (disabled) return
    setPressed(true)
    feel('press')
  }

  const release = () => setPressed(false)
  const classNames = [
    'pressable',
    `pressable-${variant}`,
    pressed ? 'is-pressed' : '',
    fullWidth ? 'is-full' : '',
    className,
  ].filter(Boolean).join(' ')
  const face = <><span className="pressable-shadow" aria-hidden /><span className="pressable-face">{children ?? label}</span></>

  if (to) {
    return (
      <Link
        to={disabled ? '#' : to}
        aria-disabled={disabled || undefined}
        onClick={event => {
          if (disabled) event.preventDefault()
          onClick?.()
        }}
        onPointerDown={press}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        className={classNames}
        {...rest}
      >
        {face}
      </Link>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      className={classNames}
      {...rest}
    >
      {face}
    </button>
  )
}
