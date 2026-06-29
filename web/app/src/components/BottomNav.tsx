import { NavLink } from 'react-router-dom'

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
    </svg>
  )
}

function IconProgress() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19V5M4 19h16M8 17V9M12 17V7M16 17v-5" />
    </svg>
  )
}

function IconCoach() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

function IconAbout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6M12 7h.01" />
    </svg>
  )
}

const TABS = [
  { to: '/', end: true, label: 'Home', Icon: IconHome },
  { to: '/progress', label: 'Progress', Icon: IconProgress },
  { to: '/coach', label: 'Coach', Icon: IconCoach },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
  { to: '/about', label: 'About', Icon: IconAbout },
] as const

export function BottomNav() {
  return (
    <nav className="bottom-nav-wrap" aria-label="Main">
      <div className="bottom-nav">
        {TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={'end' in tab ? tab.end : undefined}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-item-inner">
              <tab.Icon />
              <span>{tab.label}</span>
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
