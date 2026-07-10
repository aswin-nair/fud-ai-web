import { useMemo } from 'react'
import { BottomNav } from '../components/BottomNav'
import { useApp } from '../store/AppContext'
import { LEVEL_NAMES, LEVEL_COMPANIONS, xpForLevel, xpForNextLevel, levelFromXp } from '../lib/xp'
import {
  JOURNEY_STAGES, getJourneyStage, getNextStage, getTotalLoggedDays,
  getStreakWithFreezes, getAllBadges, BADGE_CATEGORIES,
} from '../lib/journey'
import { IconCheck } from '../components/icons'

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function JourneyPage() {
  const { state } = useApp()
  const { gamification, foodEntries } = state

  const totalDays = getTotalLoggedDays(foodEntries)
  const currentStage = getJourneyStage(totalDays)
  const nextStage = getNextStage(currentStage)
  const streak = getStreakWithFreezes(foodEntries, gamification.freezeUsedDates)
  const allBadges = useMemo(
    () => getAllBadges(foodEntries, streak, gamification),
    [foodEntries, streak, gamification],
  )

  const level = levelFromXp(gamification.xp)
  const xpCurrent = gamification.xp - xpForLevel(level)
  const xpNeeded = xpForNextLevel(level) - xpForLevel(level)
  const xpPct = xpNeeded > 0 ? Math.min((xpCurrent / xpNeeded) * 100, 100) : 100

  const companion = LEVEL_COMPANIONS[Math.min(level, LEVEL_COMPANIONS.length - 1)]
  const levelName = LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)]

  const unlockedCount = allBadges.filter(b => b.unlocked).length
  const recentEvents = gamification.xpEvents.slice(0, 8)

  return (
    <div className="app-shell journey-shell">
      <main className="app-main journey-main">

        {/* ── Hero ── */}
        <div className="journey-hero">
          <div className="journey-companion-wrap">
            <div className="journey-companion">{companion}</div>
            <div className="journey-stage-badge" style={{ background: currentStage.color + '22', color: currentStage.color }}>
              Stage {currentStage.stage}
            </div>
          </div>
          <div className="journey-hero-info">
            <div className="journey-stage-name">{currentStage.name}</div>
            <div className="journey-tagline">{currentStage.tagline}</div>
            <div className="journey-level-row">
              <span className="journey-level-num">Lv {level}</span>
              <span className="journey-level-name">{levelName}</span>
            </div>
          </div>
        </div>

        {/* ── XP Bar ── */}
        <div className="journey-xp-card">
          <div className="journey-xp-header">
            <span className="journey-xp-label">XP Progress</span>
            <span className="journey-xp-total">{gamification.xp.toLocaleString()} total XP</span>
          </div>
          <div className="journey-xp-track">
            <div className="journey-xp-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <div className="journey-xp-meta">
            <span>{xpCurrent} / {xpNeeded} XP</span>
            <span>{xpNeeded - xpCurrent} to Level {level + 1}</span>
          </div>
        </div>

        {/* ── Journey Map ── */}
        <div className="journey-map-card">
          <div className="journey-map-title">Your Path</div>
          <div className="journey-path">
            {JOURNEY_STAGES.map((stage, i) => {
              const done = totalDays >= stage.minDays
              const isCurrent = stage.stage === currentStage.stage
              return (
                <div key={stage.stage} className="journey-path-step">
                  <div className="journey-path-node-wrap">
                    {i > 0 && (
                      <div className={`journey-path-line${done ? ' done' : ''}`} />
                    )}
                    <div
                      className={`journey-path-node${done ? ' done' : ''}${isCurrent ? ' current' : ''}`}
                      style={isCurrent ? { borderColor: stage.color, boxShadow: `0 0 0 3px ${stage.color}33` } : {}}
                      title={stage.name}
                    >
                      {isCurrent ? companion : done ? <IconCheck size={16} strokeWidth={2.6} /> : stage.terrain}
                    </div>
                  </div>
                  <span className={`journey-path-label${done ? ' done' : ''}${isCurrent ? ' current' : ''}`}>
                    {stage.short}
                  </span>
                </div>
              )
            })}
          </div>
          {nextStage && (
            <p className="journey-next-hint">
              {nextStage.minDays - totalDays} more day{nextStage.minDays - totalDays !== 1 ? 's' : ''} to unlock <strong>{nextStage.name}</strong>
            </p>
          )}
          {!nextStage && (
            <p className="journey-next-hint" style={{ color: '#A78BFA' }}>
              ✨ You've reached the final stage! You're a legend.
            </p>
          )}
        </div>

        {/* ── Streak & Freezes ── */}
        <div className="journey-streak-card">
          <div className="journey-streak-row">
            <span className="journey-streak-fire">🔥</span>
            <div>
              <span className="journey-streak-count">{streak}</span>
              <span className="journey-streak-label"> day streak</span>
            </div>
            <div className="journey-freeze-badges">
              {Array.from({ length: 2 }).map((_, i) => (
                <span
                  key={i}
                  className={`journey-freeze-icon${i < gamification.streakFreezes ? ' active' : ''}`}
                  title={i < gamification.streakFreezes ? 'Streak freeze available' : 'Used'}
                >
                  ❄️
                </span>
              ))}
              <span className="journey-freeze-label">{gamification.streakFreezes} freeze{gamification.streakFreezes !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <p className="journey-freeze-hint">
            Freezes auto-apply on a missed day — you get 2 per month.
          </p>
        </div>

        {/* ── Recent XP ── */}
        {recentEvents.length > 0 && (
          <div className="journey-xp-feed-card">
            <div className="journey-section-title">Recent XP</div>
            {recentEvents.map(ev => (
              <div key={ev.id} className="journey-xp-event">
                <div className="journey-xp-event-dot" />
                <span className="journey-xp-event-label">{ev.label}</span>
                <span className="journey-xp-event-xp">+{ev.xp}</span>
                <span className="journey-xp-event-time">{timeAgo(ev.timestamp)}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Badges ── */}
        <div className="journey-badges-card">
          <div className="journey-section-title">
            Badges
            <span className="journey-badges-count">{unlockedCount} / {allBadges.length}</span>
          </div>
          {BADGE_CATEGORIES.map(cat => {
            const catBadges = allBadges.filter(b => b.category === cat.key)
            return (
              <div key={cat.key} className="journey-badge-category">
                <div className="journey-badge-cat-label">
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </div>
                <div className="journey-badge-grid">
                  {catBadges.map(b => (
                    <div
                      key={b.id}
                      className={`journey-badge${b.unlocked ? ' unlocked' : ' locked'}`}
                      title={b.desc}
                    >
                      <span className="journey-badge-emoji">{b.emoji}</span>
                      <span className="journey-badge-name">{b.name}</span>
                      <span className="journey-badge-desc">{b.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
