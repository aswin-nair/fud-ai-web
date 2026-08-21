import type { HTMLAttributes, ReactNode } from 'react'

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
  interactive?: boolean
  elevation?: 1 | 2 | 3
}

/** Inflated clay card. Elevation is hierarchy, never a nutrition state. */
export function Surface({
  children,
  padded = true,
  interactive = false,
  elevation = 2,
  className = '',
  ...rest
}: SurfaceProps) {
  return (
    <div
      className={[
        'surface',
        `clay-e${elevation}`,
        padded ? 'is-padded' : '',
        interactive ? 'is-interactive clay-squish' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}

export const ClaySurface = Surface
