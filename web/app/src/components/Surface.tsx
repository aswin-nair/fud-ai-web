import type { HTMLAttributes, ReactNode } from 'react'

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
  interactive?: boolean
}

export function Surface({
  children,
  padded = true,
  interactive = false,
  className = '',
  ...rest
}: SurfaceProps) {
  return (
    <div
      className={[
        'surface',
        padded ? 'is-padded' : '',
        interactive ? 'is-interactive' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}
