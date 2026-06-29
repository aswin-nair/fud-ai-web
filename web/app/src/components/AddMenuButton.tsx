import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const OPTIONS = [
  { to: '/log/text', label: 'Text Entry', icon: '✏️' },
  { to: '/log/photo', label: 'Photo', icon: '📷' },
  { to: '/log/saved', label: 'Saved Meals', icon: '⭐' },
  { to: '/log/manual', label: 'Manual Entry', icon: '📝' },
]

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
        className="add-menu-btn"
        aria-label="Log food"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
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
              <span className="add-menu-icon">{opt.icon}</span>
              {opt.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
