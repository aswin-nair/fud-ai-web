import { useApp } from '../store/AppContext'
import { MomoSticker } from './MomoSticker'
import { IconCalendar, IconCheck, IconEnergy, IconMeal, IconSettings, IconShield, IconSparkles, IconSprout, IconStar, IconWalk } from './icons'
import type { Mood } from '../mascot/behaviors'

const MOMENTS: Array<{ line: string; mood: Mood; pose: string; label: string; Icon: typeof IconMeal }> = [
  { line: 'Hey, I’m Momo. Let’s make this feel like you.', mood: 'cozy', pose: 'wave_at_user', label: 'A quick hello', Icon: IconCalendar },
  { line: 'A name for the food journal hall of fame.', mood: 'proud', pose: 'bow', label: 'Make it yours', Icon: IconStar },
  { line: 'Just a starting point. You’re more interesting than a number.', mood: 'cozy', pose: 'still', label: 'Your starting point', Icon: IconSettings },
  { line: 'You pick the direction. I’ll bring the tiny cheer squad.', mood: 'proud', pose: 'happy_hop', label: 'Pick your direction', Icon: IconSprout },
  { line: 'Desk days count too. Think about your ordinary week.', mood: 'curious', pose: 'stretch', label: 'Your everyday rhythm', Icon: IconWalk },
  { line: 'A little consistency beats a dramatic Monday plan.', mood: 'cozy', pose: 'wave_at_user', label: 'Find your groove', Icon: IconEnergy },
  { line: 'Made for you. Adjustable, just like your weekend plans.', mood: 'proud', pose: 'celebrate_small', label: 'Made for you', Icon: IconSparkles },
  { line: 'Your first entry! Leftovers are absolutely invited.', mood: 'proud', pose: 'happy_hop', label: 'Your first little win', Icon: IconMeal },
]
const CHAPTERS = [
  { label: 'Meet you', detail: 'A few details, a personal starting point.' },
  { label: 'Find your rhythm', detail: 'Your goals. Your everyday pace.' },
  { label: 'Take your first bite', detail: 'Meet your plan and log a real meal.' },
]

export function OnboardingStepBadge({ step }: { step: number }) {
  const { Icon, label } = MOMENTS[step]
  return <div className="setup-question-tag">
    <span className="setup-question-icon" aria-hidden="true"><Icon size={23} /></span>
    <span>{label}</span>
    <span className="setup-question-number" aria-hidden="true">{String(step + 1).padStart(2, '0')}</span>
  </div>
}

export function OnboardingCompanion({ step, error }: { step: number; error: boolean }) {
  const { state } = useApp()
  const moment = MOMENTS[step]
  const chapter = step < 3 ? 0 : step < 6 ? 1 : 2
  const visible = state.gamification.mascotActivity !== 'off'
  return <aside className={`setup-companion${!visible ? ' without-momo' : ''}`} aria-label="Your setup journey">
    <div className="setup-companion-intro">
      <span className="setup-club-label"><IconSprout size={16} /> The good food club</span>
      <h2>Small steps.<br /><span>A very you start.</span></h2>
    </div>
    {visible && <div className="setup-companion-scene" aria-hidden="true">
      <span className="setup-scene-orbit" />
      <span className="setup-scene-spark"><IconSparkles size={28} /></span>
      <span className="setup-scene-meal"><IconMeal size={28} /></span>
      <MomoSticker mood={error ? 'curious' : moment.mood} pose={error ? 'ponder' : moment.pose} />
      <span className="setup-momo-name">Momo, your food buddy</span>
    </div>}
    {visible && !state.profile.mascotMuted && <p className="setup-companion-line">
      {error ? 'We’ve got this. Let’s check that detail together.' : moment.line}
    </p>}
    <ol className="setup-chapters" aria-label="Setup chapters">
      {CHAPTERS.map((item, index) => <li key={item.label} className={index < chapter ? 'is-complete' : index === chapter ? 'is-current' : ''} aria-current={index === chapter ? 'step' : undefined}>
        <span className="setup-chapter-number" aria-hidden="true">{index < chapter ? <IconCheck size={18} /> : index + 1}</span>
        <span><strong>{item.label}</strong><small>{item.detail}</small></span>
        {index < chapter && <span className="sr-only">Completed</span>}
      </li>)}
    </ol>
    <p className="setup-draft-note"><IconShield size={16} /> Your setup saves on this device.</p>
  </aside>
}
