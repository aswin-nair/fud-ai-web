import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, Check, Plus } from 'lucide-react'
import { AppearanceToggle } from '../components/AppearanceToggle'
import { BrandLogo } from '../components/BrandLogo'
import { Momo } from '../components/Momo'
import { useCountUp } from '../hooks/useCountUp'
import { useAuth } from '../store/AuthContext'
import '../styles/welcome-poster.css'

const STATS = [
  { value: '03', label: 'Ways to log', note: 'Photo, text or manual' },
  { value: '100%', label: 'Editable', note: 'Every estimate, before you save' },
  { value: '00', label: 'Streak shame', note: 'Breaks never reset milestones' },
] as const

const TICKER = ['Photo logging', 'Describe a meal', 'Manual entry', 'Calories + macros', 'Saved meals', 'Insights'] as const

const STEPS = [
  { number: '01', title: 'Snap or describe', shot: 'log', caption: 'Fig. 02 — Log', text: 'Take a photo, describe what you ate, or enter the numbers yourself.', alt: 'The Poiem log screen with photo, describe and manual entry options' },
  { number: '02', title: 'Check the estimate', shot: 'edit', caption: 'Fig. 03 — Edit', text: 'Every estimate is a starting point. Adjust the name, calories and macros before you save.', alt: 'Editing the calories and macros of a logged meal in Poiem' },
  { number: '03', title: 'See the pattern', shot: 'insights', caption: 'Fig. 04 — Insights', text: 'Insights show your routine over time, and breaks never reset your milestones.', alt: 'Poiem Insights with logged-day milestones' },
  { number: '04', title: 'Repeat your usuals', shot: 'saved', caption: 'Fig. 05 — Saved', text: 'Save the meals you eat often and log them again in a tap.', alt: 'Saved meals in Poiem, ready to log again' },
] as const

const MEALS = [
  { name: 'Avocado toast', detail: 'Sourdough, avocado, egg', kcal: 380, protein: 15, carbs: 34, fat: 20 },
  { name: 'Chicken rice bowl', detail: 'Chicken, rice, greens', kcal: 610, protein: 38, carbs: 72, fat: 16 },
  { name: 'Veggie pizza', detail: 'Two slices', kcal: 520, protein: 22, carbs: 62, fat: 20 },
] as const

/** Grams that fill a macro bar on the sample entry. */
const MACRO_SCALE = 80
const MACROS = [
  { label: 'Protein', key: 'protein', tone: 'var(--wp-accent)' },
  { label: 'Carbs', key: 'carbs', tone: 'var(--wp-hot)' },
  { label: 'Fat', key: 'fat', tone: 'var(--wp-fg)' },
] as const

const PRINCIPLES = [
  { title: 'Edit everything', text: 'AI estimates are a starting point. Change anything before you save.' },
  { title: 'Your data, your call', text: 'Delete your account and your journal whenever you like.' },
  { title: 'No food guilt', text: 'No scorecards. Poiem supports showing up, not hitting a perfect number.' },
  { title: 'Log it your way', text: 'Photo, description, manual entry or a saved meal. Use whatever fits the moment.' },
] as const

const FAQS = [
  ['Do I have to log every single bite?', 'No. Poiem is a journal, not a rulebook. Use it at a pace that helps you, and come back whenever you want.'],
  ['Are the AI numbers exact?', 'No. Photo and text analysis produce estimates, and portions matter. Review and adjust entries before saving, or log food manually.'],
  ['Can I sign up with Google?', 'Yes. Choose Start your journal, then continue with Google. Email signup is available too. You set up your profile after signing in.'],
  ['Is this medical advice?', 'No. Poiem is a food-tracking tool for adults, not a medical service. For personal nutrition or medical advice, speak with a qualified professional.'],
] as const

function productPath(path: string): string {
  return import.meta.env.PROD ? `/app${path}` : path
}

function screenUrl(name: string): string {
  return `${import.meta.env.BASE_URL}showcase/${name}.jpg`
}

function Figure({ shot, caption, alt, eager = false }: { shot: string; caption: string; alt: string; eager?: boolean }) {
  return (
    <figure className="wp-figure">
      <figcaption className="wp-figure-bar"><span>{caption}</span><span>App screen</span></figcaption>
      <img src={screenUrl(shot)} alt={alt} width={390} height={844} loading={eager ? 'eager' : 'lazy'} decoding="async" />
    </figure>
  )
}

function SectionHead({ index, label, titleId, title, note }: { index: string; label: string; titleId: string; title: ReactNode; note?: string }) {
  return (
    <header className="wp-head">
      <p className="wp-label">[{index}] {label}</p>
      <h2 id={titleId}>{title}</h2>
      {note && <p className="wp-head-note">{note}</p>}
    </header>
  )
}

/** The sticky header tightens once the page has scrolled. */
function useCondensedHeader(): boolean {
  const [condensed, setCondensed] = useState(false)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setCondensed(window.scrollY > 24)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])
  return condensed
}

/** The step nearest the middle of the viewport drives the pinned screen. */
function useActiveStep() {
  const [active, setActive] = useState(0)
  const steps = useRef<(HTMLElement | null)[]>([])
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step ?? 0))
      }
    }, { rootMargin: '-45% 0px -45% 0px' })
    for (const step of steps.current) if (step) observer.observe(step)
    return () => observer.disconnect()
  }, [])
  return { active, steps }
}

export default function WelcomePage() {
  const { user } = useAuth()
  const condensed = useCondensedHeader()
  const { active, steps } = useActiveStep()
  const [mealIndex, setMealIndex] = useState(0)
  const meal = MEALS[mealIndex]
  const kcal = useCountUp(meal.kcal, 600)
  const home = import.meta.env.PROD ? '/' : '/welcome'
  const destination = user ? productPath('/') : productPath('/login?mode=signup')
  const signInDestination = user ? productPath('/') : productPath('/login?mode=signin')
  const cta = user ? 'Open my journal' : 'Start your journal'

  return (
    <div className="welcome-poster">
      <a className="wp-skip" href="#welcome-content">Skip to content</a>
      <header className={`wp-header${condensed ? ' is-condensed' : ''}`}>
        <div className="wp-header-inner">
          <Link className="wp-brand" to={home} aria-label="Poiem home"><BrandLogo /></Link>
          <nav className="wp-nav-links" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#try-it">Try it</a>
            <a href="#principles">Principles</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="wp-header-actions">
            <AppearanceToggle />
            {!user && <a className="wp-header-link" href={signInDestination}>Sign in</a>}
            <a className="wp-btn wp-btn-primary wp-btn-sm" href={destination}>{user ? 'My journal' : 'Start'}<ArrowRight size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </header>

      <main id="welcome-content">
        <section className="wp-hero" aria-labelledby="welcome-title">
          <div className="wp-hero-grid">
            <div className="wp-hero-copy">
              <p className="wp-label">[ Poiem ] Food journal — calories, macros, no guilt</p>
              <h1 id="welcome-title" className="wp-stack"><span>A little</span>{' '}<span>tracking.</span>{' '}<span className="wp-mark">A lot of</span>{' '}<span className="wp-mark">living.</span></h1>
              <p className="wp-hero-intro">Log a meal by photo, description or the numbers. Check the estimate, see your calories and macros clearly, and get back to your day.</p>
              <div className="wp-actions">
                <a className="wp-btn wp-btn-primary" href={destination}>{cta}<ArrowRight size={18} aria-hidden="true" /></a>
                <a className="wp-btn wp-btn-ghost" href="#how-it-works">See how it works<ArrowDown size={18} aria-hidden="true" /></a>
              </div>
              <ul className="wp-stats">
                {STATS.map(stat => (
                  <li className="wp-stat" key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span><small>{stat.note}</small></li>
                ))}
              </ul>
            </div>
            <div className="wp-hero-figure">
              <Figure shot="today" caption="Fig. 01 — Today" alt="Poiem’s Today screen with logged meals, calories left and macros" eager />
            </div>
          </div>
        </section>

        <div className="wp-ticker">
          <p className="sr-only">Photo logging, describe a meal, manual entry, calories and macros, saved meals, insights.</p>
          <div className="wp-ticker-track" aria-hidden="true">
            {[0, 1].map(copy => (
              <div className="wp-ticker-group" key={copy}>{TICKER.map(item => <span key={item}>{item}</span>)}</div>
            ))}
          </div>
        </div>

        <section className="wp-section" id="how-it-works" aria-labelledby="how-title">
          <div className="wp-wrap">
            <SectionHead index="01" label="How it works" titleId="how-title" title={<>Four steps.<br /><span>Zero homework.</span></>} note="Real screens from the Poiem app" />
            <div className="wp-steps-grid">
              <ol className="wp-steps">
                {STEPS.map((step, index) => (
                  <li
                    key={step.number}
                    ref={element => { steps.current[index] = element }}
                    data-step={index}
                    className={`wp-step${index === active ? ' is-active' : ''}`}
                  >
                    <span className="wp-step-num">{step.number}</span>
                    <div className="wp-step-body">
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                      <div className="wp-step-figure"><Figure shot={step.shot} caption={step.caption} alt={step.alt} /></div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="wp-steps-stage">
                <figure className="wp-figure">
                  <figcaption className="wp-figure-bar"><span>{STEPS[active].caption}</span><span>App screen</span></figcaption>
                  <div className="wp-stage-screens">
                    {STEPS.map((step, index) => (
                      <img
                        key={step.shot}
                        src={screenUrl(step.shot)}
                        alt={index === active ? step.alt : ''}
                        aria-hidden={index !== active}
                        data-active={index === active}
                        width={390}
                        height={844}
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                </figure>
              </div>
            </div>
          </div>
        </section>

        <section className="wp-section wp-band-acid" id="try-it" aria-labelledby="demo-title">
          <div className="wp-wrap">
            <SectionHead index="02" label="Try it" titleId="demo-title" title={<>Pick a meal.<br /><span>Read the numbers.</span></>} note="Sample data. Nothing is saved" />
            <div className="wp-demo">
              <div className="wp-demo-picker" role="group" aria-label="Choose a sample meal">
                {MEALS.map((item, index) => (
                  <button key={item.name} type="button" className="wp-meal" aria-pressed={index === mealIndex} onClick={() => setMealIndex(index)}>
                    <span className="wp-meal-index">0{index + 1}</span>
                    <span className="wp-meal-name">{item.name}<small>{item.detail}</small></span>
                    <span className="wp-meal-kcal">{item.kcal} kcal</span>
                  </button>
                ))}
                <p className="wp-demo-note">Estimates vary with portion size. You can adjust any entry in Poiem.</p>
              </div>
              <div className="wp-entry">
                <p className="sr-only" aria-live="polite" aria-atomic="true">{`${meal.name}: about ${meal.kcal} kcal, ${meal.protein} g protein, ${meal.carbs} g carbs, ${meal.fat} g fat.`}</p>
                <div className="wp-entry-bar" aria-hidden="true"><span>Sample entry</span><span>No. 00{mealIndex + 1}</span></div>
                <div className="wp-entry-body" aria-hidden="true">
                  <p className="wp-label">{meal.detail}</p>
                  <h3>{meal.name}</h3>
                  <div className="wp-entry-kcal"><strong className="tabular">{kcal}</strong><span>kcal<br />estimated</span></div>
                  <ul className="wp-entry-macros">
                    {MACROS.map(({ label, key, tone }) => (
                      <li key={key}>
                        <span>{label}</span>
                        <strong>{meal[key]} g</strong>
                        <span className="wp-bar">
                          <span key={meal.name} style={{ '--wp-fill': `${Math.min(100, Math.round((meal[key] / MACRO_SCALE) * 100))}%`, '--wp-bar-tone': tone } as CSSProperties} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="wp-entry-foot" aria-hidden="true"><span><Check size={14} /> Ready to log</span><span>Editable</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="wp-section" id="principles" aria-labelledby="principles-title">
          <div className="wp-wrap">
            <SectionHead index="03" label="Principles" titleId="principles-title" title={<>Built to support.<br /><span>Not to judge.</span></>} />
            <ul className="wp-principles">
              {PRINCIPLES.map((item, index) => (
                <li key={item.title} className="wp-principle">
                  <span className="wp-principle-index">P.0{index + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="wp-section wp-band-hot" id="momo" aria-labelledby="momo-title">
          <div className="wp-wrap wp-companion">
            <div className="wp-companion-art" aria-hidden="true"><Momo expression="proud" pose="still" /></div>
            <div className="wp-companion-copy">
              <p className="wp-label">[04] Companion</p>
              <h2 id="momo-title">Meet Momo.</h2>
              <p>An optional companion that notices the small wins and keeps logging from feeling like a chore.</p>
              <p className="wp-companion-note">Prefer just the numbers? Turn Momo down or off in Settings.</p>
            </div>
          </div>
        </section>

        <section className="wp-section" id="faq" aria-labelledby="faq-title">
          <div className="wp-wrap">
            <SectionHead index="05" label="FAQ" titleId="faq-title" title={<>Good<br /><span>questions.</span></>} />
            <div className="wp-faq">
              {FAQS.map(([question, answer], index) => (
                <details key={question}>
                  <summary><span className="wp-faq-index">Q.0{index + 1}</span><span className="wp-faq-question">{question}</span><Plus size={22} aria-hidden="true" /></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="wp-section wp-band-ink wp-final" aria-labelledby="final-title">
          <div className="wp-wrap">
            <p className="wp-label">[06] Start</p>
            <h2 id="final-title" className="wp-stack"><span>Your journal is</span>{' '}<span className="wp-mark">one meal away.</span></h2>
            <div className="wp-actions">
              <a className="wp-btn wp-btn-primary" href={destination}>{cta}<ArrowRight size={18} aria-hidden="true" /></a>
              {!user && <a className="wp-btn wp-btn-ghost" href={signInDestination}>I have an account</a>}
            </div>
          </div>
        </section>
      </main>

      <footer className="wp-footer">
        <div className="wp-footer-grid">
          <div className="wp-footer-brand"><BrandLogo /><p>A little tracking. A lot of living.</p></div>
          <nav aria-label="Product">
            <p className="wp-label">Product</p>
            <a href="#how-it-works">How it works</a>
            <a href="#try-it">Try it</a>
            <a href="#principles">Principles</a>
            <a href="#faq">FAQ</a>
          </nav>
          <nav aria-label="Account">
            <p className="wp-label">Account</p>
            <a href={destination}>{cta}</a>
            {!user && <a href={signInDestination}>Sign in</a>}
            {/* About and Support live inside the signed-in app; guests would only be redirected. */}
            {user && <a href={productPath('/about')}>About</a>}
            {user && <a href={productPath('/support')}>Support</a>}
          </nav>
        </div>
        <p className="wp-footer-legal">© {new Date().getFullYear()} Poiem — A food journal for adults. Not medical advice.</p>
      </footer>
    </div>
  )
}
