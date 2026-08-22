import { NavLink } from 'react-router-dom'
import { useHaptic } from '../hooks/useHaptic'
import { preloadCamera } from '../lib/cameraPreload'
import { useAnchor } from '../mascot/anchors'
import { IconHome, IconJourney, IconPlus, IconProgress, IconSettings } from './icons'

const TABS = [
  { to: '/', end: true, label: 'Today', Icon: IconHome },
  { to: '/progress', label: 'Insights', Icon: IconProgress },
  { to: '/journey', label: 'Quests', Icon: IconJourney },
  { to: '/settings', label: 'You', Icon: IconSettings },
] as const

export function BottomNav() {
  const vibrate = useHaptic()
  const fabAnchor = useAnchor('fab')

  return (
    <nav className="bottom-nav-wrap" aria-label="Main">
      <div className="bottom-nav">
        {TABS.slice(0, 2).map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={'end' in tab ? tab.end : undefined}
            onPointerDown={() => vibrate(10)}
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

        <NavLink
          to="/log/photo"
          data-testid="fab"
          ref={fabAnchor}
          className="nav-fab"
          aria-label="Log"
          onPointerDown={() => {
            vibrate(12)
            preloadCamera()
          }}
        >
          <IconPlus size={26} />
        </NavLink>

        {TABS.slice(2).map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            onPointerDown={() => vibrate(10)}
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
