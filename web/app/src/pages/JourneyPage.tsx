import { BottomNav } from '../components/BottomNav'
import { useApp } from '../store/AppContext'
import { claimEnamelQuest, rollEnamelQuests, syncEnamelQuests } from '../lib/enamelEconomy'
import { localDayKey } from '../lib/dates'
import { useAnchor } from '../mascot/anchors'
import { mascotReact } from '../mascot/MascotOverlay'
import type { EnamelQuestProgress } from '../types'

function QuestCard({
  quest,
  index,
  onClaim,
}: {
  quest: EnamelQuestProgress
  index: number
  onClaim: () => void
}) {
  const anchor = useAnchor('quest_card_0')
  const pct = Math.min(100, (quest.progress / Math.max(quest.target, 1)) * 100)
  return (
    <article
      className={`quest-stub${quest.completedAt ? ' is-done' : ''}`}
      ref={index === 0 ? anchor : undefined}
    >
      <div className="ticket-water-head">
        <strong>{quest.label}</strong>
        <span className="tabular">{Math.min(quest.progress, quest.target)}/{quest.target}</span>
      </div>
      <div className="home-xp-track" aria-hidden>
        <div className="home-xp-fill" style={{ width: `${pct}%`, background: quest.completedAt ? 'var(--herb)' : 'var(--cobalt)' }} />
      </div>
      {quest.completedAt && !quest.claimedAt && (
        <button type="button" className="ticket-note" onClick={onClaim}>
          Claim +{quest.xpReward} XP
        </button>
      )}
      {quest.claimedAt && <p className="ticket-stamp">Logged.</p>}
    </article>
  )
}

export function JourneyPage() {
  const { state, patchGamification } = useApp()
  const today = localDayKey(new Date())
  const chestAnchor = useAnchor('chest')
  const quests = state.gamification.enamelQuests
    ?? syncEnamelQuests(
      { ...state.gamification, enamelQuests: rollEnamelQuests(today) },
      today,
      {
        entries: state.foodEntries,
        water: state.gamification.waterByDate[today] ?? 0,
        notes: state.gamification.notesByDate[today] ?? 0,
      },
      false,
    )
  const claimable = [...quests.daily, quests.weekly].some(q => q.completedAt && !q.claimedAt)

  return (
    <div className="app-shell journey-shell">
      <main className="app-main journey-main motion-stagger">
        <h1 className="screen-title" style={{ marginBottom: 8 }}>Quests</h1>
        <p className="page-sub">Additive only — show up, log, and collect the chest.</p>

        <p className="eyebrow">Today</p>
        {quests.daily.map((quest, i) => (
          <QuestCard
            key={quest.key}
            quest={quest}
            index={i}
            onClaim={() => {
              patchGamification(g => claimEnamelQuest(g, quest.key) ?? g)
              mascotReact('celebrate_small')
            }}
          />
        ))}

        <p className="eyebrow" style={{ marginTop: 18 }}>This week</p>
        <QuestCard
          quest={quests.weekly}
          index={3}
          onClaim={() => {
            patchGamification(g => claimEnamelQuest(g, quests.weekly.key) ?? g)
            mascotReact('celebrate_big')
          }}
        />

        <div className="quest-chest" ref={chestAnchor}>
          <div aria-hidden style={{ fontSize: '2rem' }}>🧰</div>
          <p>{claimable ? 'A chest is ready. Claim a finished quest.' : 'Finish a quest to open the chest.'}</p>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
