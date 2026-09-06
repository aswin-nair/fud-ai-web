import { Link } from 'react-router-dom'
import { CalendarDays, Camera, Check, ChefHat, Pizza, SlidersHorizontal, Soup, Sparkles, Sprout } from 'lucide-react'
import type { Mood } from '../mascot/behaviors'
import { IconChevronLeft, IconChevronRight } from './icons'
import { MomoSticker } from './MomoSticker'
import { PressableButton } from './PressableButton'
import { useApp } from '../store/AppContext'
import { AppearanceControl } from './AppearanceControl'

const WELCOME_SLIDES = [
  {
    theme: 'lemon',
    kicker: 'Your new food sidekick',
    title: ['Big flavour.', 'Less effort.'],
    description: 'Snap a meal or type what you ate. Keep calories and macros in one happy little journal.',
    speech: 'I do the counting. You do the crunching.',
    sticker: 'All foods welcome',
    ticketTitle: 'Your lunch, logged.',
    ticketDetail: 'A photo or a quick note',
    ticketIcon: Camera,
    mood: 'cozy' as Mood,
    pose: 'wave_at_user',
  },
  {
    theme: 'garden',
    kicker: 'Progress with personality',
    title: ['Small logs.', 'Good vibes.'],
    description: 'Spot your patterns and celebrate consistency with Momo. Messy days are welcome, too.',
    speech: 'A little progress? I brought big applause.',
    sticker: 'Every little log counts',
    ticketTitle: 'Find your rhythm.',
    ticketDetail: 'One day at a time',
    ticketIcon: CalendarDays,
    mood: 'proud' as Mood,
    pose: 'celebrate_small',
  },
  {
    theme: 'lilac',
    kicker: 'Made for your real life',
    title: ['Your plate.', 'Your pace.'],
    description: 'Tell us a little about you. Get a starting plan that fits your routine, with room to change.',
    speech: 'Your routine. My very tiny clipboard.',
    sticker: 'A plan with wiggle room',
    ticketTitle: 'Make it your own.',
    ticketDetail: 'Your goals. Your routine.',
    ticketIcon: SlidersHorizontal,
    mood: 'curious' as Mood,
    pose: 'point_at_target',
  },
] as const

export const WELCOME_SLIDE_COUNT = WELCOME_SLIDES.length

export function OnboardingWelcome({ index, onSlideChange, onStart, signedIn }: {
  index: number
  onSlideChange: (index: number) => void
  onStart: () => void
  signedIn: boolean
}) {
  const { state } = useApp()
  const slide = WELCOME_SLIDES[index] ?? WELCOME_SLIDES[0]
  const TicketIcon = slide.ticketIcon

  return (
    <main className={`welcome-shell welcome-refresh welcome-theme-${slide.theme}`} aria-label="Welcome to Fud AI">
      <header className="welcome-brand-row">
        <span className="welcome-brand">Fud AI<span aria-hidden="true">.</span></span>
        <div className="appearance-header-actions">
          <span className="welcome-club-label"><ChefHat size={19} aria-hidden="true" /> The food club</span>
          <AppearanceControl compact />
        </div>
      </header>

      <div className="welcome-cover">
        <div className="welcome-scene" aria-hidden="true">
          <div className="welcome-scene-grain" />
          <span className="welcome-scene-spark welcome-spark-one"><Sparkles /></span>
          <span className="welcome-scene-spark welcome-spark-two"><Sparkles /></span>
          <span className="welcome-scene-food welcome-food-pizza"><Pizza size={33} /></span>
          <span className="welcome-scene-food welcome-food-sprout"><Sprout size={32} /></span>
          {state.gamification.mascotActivity !== 'off' && !state.profile.mascotMuted && <p className="welcome-momo-speech">{slide.speech}</p>}
          <div className="welcome-mascot-wrap">
            <div className="welcome-mascot-halo" />
            <div className="welcome-mascot-fallback"><Soup size={100} strokeWidth={1.6} /></div>
            <MomoSticker mood={slide.mood} pose={slide.pose} />
          </div>
          <div className="welcome-scene-ticket">
            <span className="welcome-ticket-icon"><TicketIcon size={24} /></span>
            <span><strong>{slide.ticketTitle}</strong><small>{slide.ticketDetail}</small></span>
            <span className="welcome-ticket-check"><Check size={17} /></span>
          </div>
          <span className="welcome-scene-sticker">{slide.sticker}</span>
        </div>

        <section className="welcome-content" aria-labelledby="welcome-heading">
          <div className="welcome-copy" aria-live="polite" aria-atomic="true">
            <p className="welcome-kicker"><span aria-hidden="true">0{index + 1}</span>{slide.kicker}</p>
            <h1 className="welcome-title" id="welcome-heading"><span>{slide.title[0]}</span>{' '}<span>{slide.title[1]}</span></h1>
            <p className="welcome-sub">{slide.description}</p>
          </div>

          <nav className="welcome-slide-nav" aria-label="Introduction slides">
            <div className="welcome-dots">
              {WELCOME_SLIDES.map((item, slideIndex) => (
                <button
                  key={item.theme}
                  type="button"
                  className={`welcome-dot${slideIndex === index ? ' active' : ''}`}
                  aria-label={`Go to slide ${slideIndex + 1}: ${item.title.join(' ')}`}
                  aria-current={slideIndex === index ? 'step' : undefined}
                  onClick={() => onSlideChange(slideIndex)}
                ><span aria-hidden="true">{slideIndex + 1}</span></button>
              ))}
            </div>
            <div className="welcome-slide-arrows">
              <button type="button" aria-label="Previous introduction" disabled={index === 0}
                onClick={() => onSlideChange(Math.max(0, index - 1))}>
                <IconChevronLeft size={20} />
              </button>
              <button type="button" aria-label="Next introduction" disabled={index === WELCOME_SLIDE_COUNT - 1}
                onClick={() => onSlideChange(Math.min(WELCOME_SLIDE_COUNT - 1, index + 1))}>
                <IconChevronRight size={20} />
              </button>
            </div>
          </nav>

          <div className="welcome-actions">
            <PressableButton fullWidth onClick={onStart}>
              Get started <IconChevronRight size={19} />
            </PressableButton>
            <p className="welcome-setup-note">A little setup, then your first meal.</p>
            {!signedIn && (
              <Link to="/login" className="welcome-signin-link">
                Already have an account? <strong>Sign in</strong>
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
