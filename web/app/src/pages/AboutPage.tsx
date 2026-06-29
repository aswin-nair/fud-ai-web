import { BottomNav } from '../components/BottomNav'

export function AboutPage() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <h1 className="screen-title">About</h1>

        <div className="progress-card">
          <p className="about-lead">
            Fud AI is a privacy-first AI calorie tracker. Log meals by text or photo, track macros, and bring your own API key.
          </p>
        </div>

        <div className="progress-card">
          <a href="https://github.com/apoorvdarshan/fud-ai" target="_blank" rel="noreferrer" className="about-link-row">
            <span>Open Source</span>
            <span className="about-chevron">›</span>
          </a>
          <a href="https://github.com/apoorvdarshan/fud-ai" target="_blank" rel="noreferrer" className="about-link-row">
            <span>Star on GitHub</span>
            <span className="about-chevron">›</span>
          </a>
        </div>

        <p className="about-version">Fud AI Web</p>
      </main>
      <BottomNav />
    </div>
  )
}
