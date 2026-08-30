import { NavLink } from 'react-router-dom'
import { useFeel } from '../hooks/useHaptic'
import { preloadCamera } from '../lib/cameraPreload'
import { useAnchor } from '../mascot/anchors'
import { IconHome, IconJourney, IconPlus, IconProgress, IconSettings } from './icons'

const TABS = [
  { to: '/', end: true, label: 'Today', Icon: IconHome },
  { to: '/progress', label: 'Insights', Icon: IconProgress },
  { to: '/discover', label: 'Discover', Icon: IconJourney },
  { to: '/settings', label: 'You', Icon: IconSettings },
] as const

export function BottomNav() {
  const feel = useFeel()
  const fabAnchor = useAnchor('fab')

  return (
    <nav className="bottom-nav-wrap" aria-label="Main">
      <div className="bottom-nav">
        {TABS.slice(0, 2).map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={'end' in tab ? tab.end : undefined}
            onPointerDown={() => feel('tap')}
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
            feel('press')
            preloadCamera()
          }}
        >
          <IconPlus size={26} />
        </NavLink>

        {TABS.slice(2).map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            onPointerDown={() => feel('tap')}
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
