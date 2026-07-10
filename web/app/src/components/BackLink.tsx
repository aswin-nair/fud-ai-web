import { Link } from 'react-router-dom'
import { IconChevronLeft } from './icons'

interface BackLinkProps {
  to?: string
  onClick?: () => void
  label?: string
  className?: string
}

/** Consistent "‹ Back" affordance used across sub-pages. Renders a Link when `to` is set, otherwise a button. */
export function BackLink({ to, onClick, label = 'Back', className }: BackLinkProps) {
  const cls = `back-link${className ? ` ${className}` : ''}`
  const content = (
    <>
      <IconChevronLeft size={16} strokeWidth={2.4} />
      <span>{label}</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={cls}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={cls} onClick={onClick}>
      {content}
    </button>
  )
}
