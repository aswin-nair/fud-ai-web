import { NavLink } from 'react-router-dom'
import { IconCoach, IconHome, IconJourney, IconProgress, IconSettings } from './icons'

const TABS = [
  { to: '/', end: true, label: 'Home', Icon: IconHome },
  { to: '/progress', label: 'Progress', Icon: IconProgress },
  { to: '/journey', label: 'Journey', Icon: IconJourney },
  { to: '/coach', label: 'Coach', Icon: IconCoach },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
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
            {({ isActive }) => (
              <span className="nav-item-inner">
                <tab.Icon active={isActive} />
                <span>{tab.label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
