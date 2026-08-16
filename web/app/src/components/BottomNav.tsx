import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  IconCamera, IconClipboard, IconEdit, IconHome, IconProgress, IconScan, IconSettings, IconStar,
} from './icons'
import { selectLogMethod, startLogFlow, type LogMethod } from '../lib/analytics'

const TABS_LEFT = [
  { to: '/', end: true, label: 'Home', Icon: IconHome },
  { to: '/progress', label: 'Progress', Icon: IconProgress },
] as const

const TABS_RIGHT = [
  { to: '/discover', label: 'Discover', Icon: IconStar },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
] as const

const LOG_OPTIONS: ReadonlyArray<{
  to: string
  label: string
  Icon: typeof IconEdit
  accent: string
  method: LogMethod
}> = [
  { to: '/log/text', label: 'Text Entry', Icon: IconEdit, accent: 'coral', method: 'text_ai' },
  { to: '/log/photo', label: 'Photo', Icon: IconCamera, accent: 'blue', method: 'photo_ai' },
  { to: '/log/saved', label: 'Saved Meals', Icon: IconStar, accent: 'gold', method: 'saved' },
  { to: '/log/manual', label: 'Manual Entry', Icon: IconClipboard, accent: 'teal', method: 'manual' },
]

function NavTab({ to, end, label, Icon }: { to: string; end?: boolean; label: string; Icon: typeof IconHome }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      {({ isActive }) => (
        <span className="nav-item-inner">
          <Icon active={isActive} />
          <span>{label}</span>
        </span>
      )}
    </NavLink>
  )
}

export function BottomNav() {
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
    <nav className="bottom-nav-wrap" aria-label="Main">
      <div className="bottom-nav">
        {TABS_LEFT.map(tab => <NavTab key={tab.to} {...tab} />)}

        <div className="nav-log-wrap" ref={rootRef}>
          <button
            type="button"
            className={`nav-log-btn${open ? ' open' : ''}`}
            aria-label="Log food"
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => {
              startLogFlow()
              setOpen(v => !v)
            }}
          >
            <IconScan size={23} strokeWidth={2.2} />
          </button>

          {open && (
            <div className="nav-log-dropdown" role="menu">
              <span className="nav-log-dropdown-title">Log food</span>
              {LOG_OPTIONS.map(opt => (
                <Link
                  key={opt.to}
                  to={opt.to}
                  className="nav-log-item"
                  role="menuitem"
                  onClick={() => {
                    selectLogMethod(opt.method)
                    setOpen(false)
                  }}
                >
                  <span className={`nav-log-item-icon icon-tile icon-tile-sm icon-tile-${opt.accent}`}><opt.Icon size={16} /></span>
                  {opt.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {TABS_RIGHT.map(tab => <NavTab key={tab.to} {...tab} />)}
      </div>
    </nav>
  )
}
