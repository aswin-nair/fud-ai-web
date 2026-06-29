import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'

const OPTIONS = [
  { to: '/log/text', icon: '✏️', title: 'Text', desc: 'Describe your meal' },
  { to: '/log/photo', icon: '📷', title: 'Photo', desc: 'Snap or upload food' },
  { to: '/log/saved', icon: '⭐', title: 'Saved meals', desc: 'Recents & favorites' },
  { to: '/log/manual', icon: '📝', title: 'Manual', desc: 'Enter known macros' },
]

export function LogMenuPage() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Link to="/" style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>← Back</Link>
        <h1 className="page-title" style={{ marginTop: 12 }}>Log food</h1>
        <p className="page-sub">How would you like to log?</p>

        <div className="log-menu-grid">
          {OPTIONS.map(opt => (
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
