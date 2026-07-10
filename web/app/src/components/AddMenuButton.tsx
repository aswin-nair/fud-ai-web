import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconCamera, IconClipboard, IconClose, IconEdit, IconPlus, IconStar } from './icons'

const OPTIONS = [
  { to: '/log/text', label: 'Text Entry', Icon: IconEdit, accent: 'coral' },
  { to: '/log/photo', label: 'Photo', Icon: IconCamera, accent: 'blue' },
  { to: '/log/saved', label: 'Saved Meals', Icon: IconStar, accent: 'gold' },
  { to: '/log/manual', label: 'Manual Entry', Icon: IconClipboard, accent: 'teal' },
] as const

export function AddMenuButton() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="add-menu-wrap" ref={rootRef}>
      <button
        type="button"
        className={`add-menu-btn${open ? ' open' : ''}`}
        aria-label="Log food"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <span className="add-menu-btn-icon add-menu-btn-icon-plus"><IconPlus size={22} strokeWidth={2.5} /></span>
        <span className="add-menu-btn-icon add-menu-btn-icon-close"><IconClose size={22} strokeWidth={2.5} /></span>
      </button>

      {open && (
        <div className="add-menu-dropdown" role="menu">
          {OPTIONS.map(opt => (
            <Link
              key={opt.to}
              to={opt.to}
              className="add-menu-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className={`add-menu-icon icon-tile icon-tile-sm icon-tile-${opt.accent}`}><opt.Icon size={16} /></span>
              {opt.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
