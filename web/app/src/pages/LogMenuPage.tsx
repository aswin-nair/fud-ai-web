import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { BackLink } from '../components/BackLink'
import { IconCamera, IconClipboard, IconEdit, IconStar } from '../components/icons'

const AI_OPTIONS = [
  {
    to: '/log/text',
    Icon: IconEdit,
    accent: 'coral',
    title: 'Describe your meal',
    desc: 'Type anything — AI estimates your macros instantly',
    badge: 'AI',
  },
  {
    to: '/log/photo',
    Icon: IconCamera,
    accent: 'blue',
    title: 'Snap a photo',
    desc: 'Take or upload a food photo — AI reads the nutrition',
    badge: 'AI',
  },
] as const

const MANUAL_OPTIONS = [
  { to: '/log/saved', Icon: IconStar, accent: 'gold', title: 'Saved meals', desc: 'Recents & favorites' },
  { to: '/log/manual', Icon: IconClipboard, accent: 'teal', title: 'Manual entry', desc: 'Enter known macros' },
] as const

export function LogMenuPage() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <BackLink to="/" />
        <h1 className="page-title" style={{ marginTop: 12 }}>Log food</h1>

        <p className="log-section-label">AI-powered</p>
        <div className="log-ai-grid">
          {AI_OPTIONS.map(opt => (
            <Link key={opt.to} to={opt.to} className="log-ai-card">
              <div className="log-ai-card-top">
                <span className={`log-ai-icon icon-tile icon-tile-${opt.accent}`}><opt.Icon size={22} /></span>
                <span className="log-ai-badge">{opt.badge}</span>
              </div>
              <strong className="log-ai-title">{opt.title}</strong>
              <span className="log-ai-desc">{opt.desc}</span>
            </Link>
          ))}
        </div>

        <p className="log-section-label" style={{ marginTop: 24 }}>Manual</p>
        <div className="log-manual-grid">
          {MANUAL_OPTIONS.map(opt => (
            <Link key={opt.to} to={opt.to} className="log-menu-card">
              <span className={`log-menu-icon icon-tile icon-tile-sm icon-tile-${opt.accent}`}><opt.Icon size={18} /></span>
              <strong>{opt.title}</strong>
              <span>{opt.desc}</span>
            </Link>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
