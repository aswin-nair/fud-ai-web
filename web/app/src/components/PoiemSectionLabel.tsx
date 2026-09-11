import type { ReactNode } from 'react'
import { BrandLogo } from './BrandLogo'

/** A consistent, quiet brand signature above each product page title. */
export function PoiemSectionLabel({ children }: { children: ReactNode }) {
  return <div className="poiem-section-label">
    <span className="sr-only">Poiem · </span><BrandLogo decorative />
    <span className="poiem-section-divider" aria-hidden="true" />
    <span>{children}</span>
  </div>
}
