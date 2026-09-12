import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, Check, Cookie, Globe, HeartHandshake, MessageSquare, PencilLine, Plus, ShieldCheck, Sparkles, Utensils } from 'lucide-react'
import * as m from 'motion/react-m'
import { useInView, useReducedMotion } from 'motion/react'
import { AppearanceToggle } from '../components/AppearanceToggle'
import { BrandLogo } from '../components/BrandLogo'
import { Momo } from '../components/Momo'
import { PosterSticker } from '../components/PosterPrimitives'
import { useCountUp } from '../hooks/useCountUp'
import { useAuth } from '../store/AuthContext'
import '../styles/welcome-poster.css'

const MEALS = [
  { name: 'Avocado toast', detail: 'Toast + avocado + egg', kcal: 380, protein: 15, carbs: 34, fat: 20, food: 'egg', reaction: 'happy', note: 'Toast with the most. A very strong opening act.' },
  { name: 'Pizza night', detail: 'Two slices of veggie pizza', kcal: 520, protein: 22, carbs: 62, fat: 20, food: 'pizza', reaction: 'wink', note: 'A slice of life. Actually, two. Excellent plot twist.' },
  { name: 'Cookie break', detail: 'One chocolate-chip cookie', kcal: 210, protein: 3, carbs: 30, fat: 9, food: 'cookie', reaction: 'caught_snacking', note: 'The cookie has entered the chat. I support this storyline.' },
] as const

/** Grams that fill a macro bar on the sample receipt. */
const MACRO_SCALE = 70
const MACROS = [
  { label: 'Protein', key: 'protein', color: '#bce6c4' },
  { label: 'Carbs', key: 'carbs', color: '#e7f258' },
  { label: 'Fat', key: 'fat', color: '#ff8055' },
] as const

const STEPS = [
  { number: '01', title: 'SNAP IT.', label: 'SNAP, SAY OR TYPE', shot: 'log', text: 'Take a photo or describe your meal. Prefer the details? Enter it yourself.', alt: 'The Poiem log screen with photo, describe and manual entry options' },
  { number: '02', title: 'MAKE IT YOURS.', label: 'YOUR CALL', shot: 'edit', text: 'Every estimate is a starting point. Adjust the details before they go in your journal.', alt: 'Editing a logged meal in Poiem' },
  { number: '03', title: 'SEE THE STORY.', label: 'THE BIG PICTURE', shot: 'insights', text: 'Look back at your days and spot the patterns that matter to you.', alt: 'Poiem Insights showing calories and macros over time' },
  { number: '04', title: 'SAVE YOUR USUALS.', label: 'ON REPEAT', shot: 'saved', text: 'Favourite the meals you have on repeat, then log them again with a tap.', alt: 'Saved meals in Poiem, ready to log again' },
] as const

const PROMISES = [
  { Icon: PencilLine, title: 'EDIT EVERY ESTIMATE.', text: 'AI numbers are a starting point. Change anything before you save.' },
  { Icon: ShieldCheck, title: 'YOUR DATA, YOUR CALL.', text: 'Delete your account and your journal whenever you like.' },
  { Icon: HeartHandshake, title: 'NO FOOD GUILT.', text: 'Poiem cheers for showing up, not for hitting a perfect number.' },
  { Icon: Globe, title: 'NOTHING TO INSTALL.', text: 'Open Poiem in the browser on your phone, tablet or laptop.' },
] as const

const FAQS = [
  ['Do I have to log every single bite?', 'No. Poiem is a journal, not a rulebook. Use it at a pace that helps you, and come back whenever you want.'],
  ['Are the AI numbers exact?', 'No. Photo and text analysis produce estimates, and portions matter. Always review and adjust the entry before saving. You can also log food manually.'],
  ['Can I use Google to sign up?', 'Yes. Choose Get started, then Sign up with Google. Email signup is available too. You will set up your profile after signing in.'],
  ['Is this medical advice?', 'No. Poiem is a food-tracking tool for adults, not a medical service. For personal nutrition or medical advice, speak with a qualified professional.'],
] as const

function productPath(path: string): string {
  return import.meta.env.PROD ? `/app${path}` : path
}

function screenUrl(name: string): string {
  return `${import.meta.env.BASE_URL}showcase/${name}.jpg`
}

function PhoneShot({ name, alt, eager = false }: { name: string; alt: string; eager?: boolean }) {
  return (
    <figure className="wp-phone">
      <img src={screenUrl(name)} alt={alt} width={390} height={844} loading={eager ? 'eager' : 'lazy'} decoding="async" />
    </figure>
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

/** The step nearest the middle of the viewport drives the pinned phone. */
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
  const reduced = useReducedMotion()
  const condensed = useCondensedHeader()
  const { active, steps } = useActiveStep()
  const [mealIndex, setMealIndex] = useState(0)
  const meal = MEALS[mealIndex]
  const kcal = useCountUp(meal.kcal, 700)
  const demoStage = useRef<HTMLDivElement>(null)
  const demoInView = useInView(demoStage, { once: true, amount: 0.35 })
  const finale = useRef<HTMLElement>(null)
  const finaleInView = useInView(finale, { once: true, amount: 0.4 })
  const home = import.meta.env.PROD ? '/' : '/welcome'
  const destination = user ? productPath('/') : productPath('/login?mode=signup')
  const signInDestination = user ? productPath('/') : productPath('/login?mode=signin')
  const cta = user ? 'Open my journal' : 'Get started'

  return (
    <div className="welcome-poster">
      <a className="wp-skip" href="#welcome-content">Skip to content</a>
      <header className={`wp-header${condensed ? ' is-condensed' : ''}`}>
        <div className="wp-nav">
          <Link to={home} aria-label="Poiem home"><BrandLogo /></Link>
          <nav aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#try-it">Try it</a>
            <a href="#meet-momo">Meet Momo</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="wp-nav-actions">
            <AppearanceToggle />
            {!user && <a className="wp-signin" href={signInDestination}>Sign in</a>}
            <a className="wp-button wp-nav-cta" href={destination}>{user ? 'My journal' : 'Get started'}<ArrowUpRight size={18} /></a>
          </div>
        </div>
      </header>

      <main id="welcome-content">
        <section className="wp-hero" aria-labelledby="welcome-title">
          <div className="wp-hero-copy">
            <p className="wp-eyebrow"><span /> A FOOD JOURNAL WITH PERSONALITY</p>
            <h1 id="welcome-title">BIG LIFE.<br />GOOD FOOD.<br /><span>LESS FUSS.</span></h1>
            <p className="wp-intro">Eat the food. Log the moment. Get to know your calories and macros—with a little help from AI and a very opinionated dumpling.</p>
            <div className="wp-hero-actions">
              <a className="wp-button" href={destination}>{cta}<ArrowUpRight /></a>
              <a className="wp-text-link" href="#how-it-works">See how it works <ArrowDown size={18} /></a>
            </div>
            <ul className="wp-hero-points" aria-label="Why Poiem">
              <li><Check aria-hidden="true" /> Google or email signup</li>
              <li><Check aria-hidden="true" /> Edit every estimate</li>
              <li><Check aria-hidden="true" /> No food guilt</li>
            </ul>
          </div>
          <div className="wp-collage">
            <div className="wp-grid-paper" aria-hidden="true" />
            <div className="wp-big-circle" aria-hidden="true" />
            <m.div className="wp-momo" aria-hidden="true" whileHover={reduced ? undefined : { rotate: -5, y: -8 }} transition={{ type: 'spring', stiffness: 230, damping: 17 }}>
              <Momo expression="proud" pose={reduced ? 'still' : 'wave_at_user'} />
            </m.div>
            <span className="wp-speech" aria-hidden="true">Your lunch called.<br />It wants a fan club.</span>
            <m.div
              className="wp-hero-phone"
              initial={reduced ? false : { y: 48, rotate: -14, opacity: 0 }}
              animate={{ y: 0, rotate: -7, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0.15 }}
            >
              <PhoneShot name="today" alt="Poiem’s Today screen with a day of logged meals, calories and macros" eager />
            </m.div>
            <PosterSticker food="pizza" tone="coral" className="wp-pizza" tilt={12} />
            <PosterSticker food="cherry" tone="rose" className="wp-cherry" tilt={-14} />
            <span className="wp-orbit-label" aria-hidden="true">SMALL LOGS. BIG PICTURE.</span>
          </div>
        </section>

        <div className="wp-marquee">
          <p className="sr-only">Eat. Log. Live. All foods welcome.</p>
          <div className="wp-marquee-track" aria-hidden="true">
            {[0, 1].map(copy => (
              <div className="wp-marquee-group" key={copy}>
                <span>EAT.</span><Sparkles /><span>LOG.</span><Sparkles /><span>LIVE.</span><Sparkles /><span>ALL FOODS WELCOME.</span><Utensils />
              </div>
            ))}
          </div>
        </div>

        <section className="wp-story wp-section" id="how-it-works" aria-labelledby="how-title">
          <div className="wp-section-heading">
            <div>
              <p className="wp-eyebrow">01 / THE NOT-SO-SECRET RECIPE</p>
              <h2 id="how-title">LESS TAPPING.<br />MORE <span>LIVING.</span></h2>
            </div>
            <p>Real screens from the Poiem app.<br />Four steps. Zero homework.</p>
          </div>
          <div className="wp-story-layout">
            <ol className="wp-story-steps">
              {STEPS.map((step, index) => (
                <li
                  key={step.number}
                  ref={element => { steps.current[index] = element }}
                  data-step={index}
                  className={`wp-story-step${index === active ? ' is-active' : ''}`}
                >
                  <span className="wp-step-number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <PhoneShot name={step.shot} alt={step.alt} />
                </li>
              ))}
            </ol>
            <div className="wp-story-stage">
              <span className="wp-story-sticker" aria-hidden="true">{STEPS[active].label}</span>
              <figure className="wp-phone">
                <div className="wp-story-screens">
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
        </section>

        <section className="wp-demo wp-section" id="try-it" aria-labelledby="demo-title">
          <div className="wp-section-copy">
            <p className="wp-eyebrow">02 / A TASTE OF POIEM</p>
            <h2 id="demo-title">YOUR PLATE.<br /><span>THE PLOT.</span></h2>
            <p>Meals are more than numbers. But a few useful numbers can help you see the whole story.</p>
            <p>Pick a meal. Watch it land in your journal.</p>
            <div className="wp-meal-picker" role="group" aria-label="Preview a sample meal">
              {MEALS.map((item, index) => (
                <button key={item.name} type="button" aria-pressed={index === mealIndex} onClick={() => setMealIndex(index)}>{item.name}<ArrowUpRight size={16} /></button>
              ))}
            </div>
            <p className="wp-fine">Interactive example, not an AI analysis. Actual portions and estimates vary. Nothing here is saved.</p>
          </div>
          <div className="wp-demo-stage" ref={demoStage}>
            <p className="sr-only" aria-live="polite" aria-atomic="true">{`${meal.name}: about ${meal.kcal} kcal, ${meal.protein} g protein, ${meal.carbs} g carbs, ${meal.fat} g fat.`}</p>
            <m.div
              key={meal.name}
              className="wp-receipt"
              aria-hidden="true"
              initial={reduced ? false : { y: -18, rotate: -1, opacity: 0.4 }}
              animate={{ y: 0, rotate: 2, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <div className="wp-receipt-top"><BrandLogo /><span>SAMPLE ENTRY<br />NO. 00{mealIndex + 1}</span></div>
              <div className="wp-receipt-food"><PosterSticker food={meal.food} tone="citron" tilt={-5} /><span>ON THE MENU</span><h3>{meal.name}</h3><p>{meal.detail}</p></div>
              <div className="wp-calories"><strong className="tabular">{kcal}</strong><span>ESTIMATED<br />KCAL</span><Check /></div>
              <dl className="wp-macros">
                {MACROS.map(({ label, key, color }) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>
                      {meal[key]}g
                      <span className="wp-macro-bar" style={{ '--wp-fill': `${Math.min(100, Math.round((meal[key] / MACRO_SCALE) * 100))}%`, '--wp-bar': color } as CSSProperties}><span /></span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="wp-receipt-note"><Sparkles size={18} />{meal.note}</p>
              <div className="wp-barcode" />
              <p className="wp-receipt-end">NOT A SCORECARD. JUST YOUR STORY.</p>
            </m.div>
            <span className="wp-demo-stamp" aria-hidden="true">OH, THAT’S<br />MY LUNCH.</span>
            <m.div
              className="wp-demo-momo"
              aria-hidden="true"
              initial={reduced ? false : { y: 80, opacity: 0 }}
              animate={demoInView ? { y: 0, opacity: 1 } : undefined}
              transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.2 }}
            >
              <Momo key={meal.name} expression={meal.reaction} pose={reduced ? 'still' : 'happy_hop'} />
            </m.div>
          </div>
        </section>

        <section className="wp-momo-section wp-section" id="meet-momo" aria-labelledby="momo-title">
          <div className="wp-momo-portrait">
            <span className="wp-eyebrow">CHIEF ENCOURAGEMENT OFFICER</span>
            <Momo expression="caught_snacking" pose={reduced ? 'still' : 'tiny_dance'} />
            <span className="wp-name-tag">HELLO, I’M MOMO.</span>
          </div>
          <div className="wp-section-copy">
            <p className="wp-eyebrow">03 / MEET YOUR HYPE DUMPLING</p>
            <h2 id="momo-title">A LITTLE SASS.<br /><span>ZERO SHAME.</span></h2>
            <p>Momo celebrates the little wins, brings the occasional terrible joke, and keeps your journal from feeling like homework.</p>
            <blockquote>“I’m technically a snack. My qualifications are impeccable.”</blockquote>
            <p className="wp-momo-controls"><MessageSquare size={18} /> Here for the numbers? Quiet Momo down or hide the mascot in settings.</p>
          </div>
        </section>

        <section className="wp-trust wp-section" aria-labelledby="trust-title">
          <div className="wp-section-heading">
            <div>
              <p className="wp-eyebrow">04 / THE FINE PRINT, IN BIG LETTERS</p>
              <h2 id="trust-title">KIND BY<br /><span>DESIGN.</span></h2>
            </div>
            <p>A journal should make eating feel lighter,<br />not heavier.</p>
          </div>
          <ul className="wp-trust-grid">
            {PROMISES.map(({ Icon, title, text }) => (
              <li key={title} className="wp-promise"><Icon aria-hidden="true" strokeWidth={2.2} /><h3>{title}</h3><p>{text}</p></li>
            ))}
          </ul>
        </section>

        <section className="wp-faq wp-section" id="faq" aria-labelledby="faq-title">
          <div>
            <p className="wp-eyebrow">THE SIDE DISH</p>
            <h2 id="faq-title">GOOD<br />QUESTIONS.</h2>
            <Cookie size={60} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className="wp-questions">
            {FAQS.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={22} aria-hidden="true" /></summary><p>{answer}</p></details>)}
          </div>
        </section>

        <section className="wp-finale" ref={finale} aria-labelledby="finale-title">
          <div className="wp-finale-momo" aria-hidden="true">
            <Momo expression={finaleInView ? 'confetti' : 'happy'} pose={reduced ? 'still' : finaleInView ? 'celebrate_small' : 'idle_breathe'} />
          </div>
          <p className="wp-eyebrow">YOUR NEXT CHAPTER STARTS WITH A BITE.</p>
          <h2 id="finale-title">GO ON.<br /><span>MAKE A MEAL OF IT.</span></h2>
          <a className="wp-button" href={destination}>{cta}<ArrowUpRight /></a>
          <span className="wp-finale-sticker" aria-hidden="true"><PosterSticker food="croissant" tone="rose" tilt={14} /></span>
        </section>
      </main>

      <footer className="wp-footer">
        <BrandLogo />
        <p>Made for messy, delicious, real life.</p>
        <nav aria-label="Footer">
          {/* About and Support live inside the signed-in app; guests would only be redirected. */}
          {user && <a href={productPath('/about')}>About</a>}
          {user && <a href={productPath('/support')}>Support</a>}
          <a href={signInDestination}>{user ? 'My journal' : 'Sign in'}</a>
          <a href="#welcome-content">Back to the top <ArrowUpRight size={16} /></a>
        </nav>
        <small>© {new Date().getFullYear()} Poiem · A food journal for adults, not medical advice.</small>
      </footer>
    </div>
  )
}
