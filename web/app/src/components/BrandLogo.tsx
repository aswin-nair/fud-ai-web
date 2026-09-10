import identity from '../brand/identity.json'

/** Path-based artwork stays crisp, theme-aware and independent of font loading. */
export function BrandLogo({ variant = 'wordmark', className = '', decorative = false }: {
  variant?: 'wordmark' | 'mark'
  className?: string
  decorative?: boolean
}) {
  const mark = variant === 'mark'
  return (
    <svg className={`poiem-logo poiem-logo--${variant} ${className}`}
      viewBox={mark ? '0 0 112 112' : '0 0 356 104'}
      role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : identity.name}
      aria-hidden={decorative || undefined} focusable="false">
      {mark && <rect width="112" height="112" rx="28" className="poiem-logo-tile" />}
      <path fillRule="evenodd" d={mark ? identity.markPath : identity.wordmarkPath} className="poiem-logo-letter" />
      {!mark && <rect x="155" y="1" width="16" height="16" rx="4" transform="rotate(-12 163 9)" className="poiem-logo-spark" />}
    </svg>
  )
}
