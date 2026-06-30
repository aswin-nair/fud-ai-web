import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'

const AI_OPTIONS = [
  {
    to: '/log/text',
    icon: '✏️',
    title: 'Describe your meal',
    desc: 'Type anything — AI estimates your macros instantly',
    badge: 'AI',
  },
  {
    to: '/log/photo',
    icon: '📷',
    title: 'Snap a photo',
    desc: 'Take or upload a food photo — AI reads the nutrition',
    badge: 'AI',
  },
]

const MANUAL_OPTIONS = [
  { to: '/log/saved', icon: '⭐', title: 'Saved meals', desc: 'Recents & favorites' },
  { to: '/log/manual', icon: '📝', title: 'Manual entry', desc: 'Enter known macros' },
]

export function LogMenuPage() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Link to="/" className="back-link">← Back</Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>Log food</h1>

        <p className="log-section-label">AI-powered</p>
        <div className="log-ai-grid">
          {AI_OPTIONS.map(opt => (
            <Link key={opt.to} to={opt.to} className="log-ai-card">
              <div className="log-ai-card-top">
                <span className="log-ai-icon">{opt.icon}</span>
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
              <span className="log-menu-icon">{opt.icon}</span>
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
