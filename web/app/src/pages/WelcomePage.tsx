import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, Camera, Check, Cookie, MessageSquare, Plus, Sparkles, Utensils } from 'lucide-react'
import * as m from 'motion/react-m'
import { useReducedMotion } from 'motion/react'
import { BrandLogo } from '../components/BrandLogo'
import { AppearanceControl } from '../components/AppearanceControl'
import { Momo } from '../components/Momo'
import { PosterSticker } from '../components/PosterPrimitives'
import { useAuth } from '../store/AuthContext'
import '../styles/welcome-poster.css'

const MEALS = [
  { name: 'Avocado toast', detail: 'Toast + avocado + egg', kcal: 380, protein: 15, carbs: 34, fat: 20, food: 'egg' as const, note: 'Toast with the most. A very strong opening act.' },
  { name: 'Pizza night', detail: 'Two slices of veggie pizza', kcal: 520, protein: 22, carbs: 62, fat: 20, food: 'pizza' as const, note: 'A slice of life. Actually, two. Excellent plot twist.' },
  { name: 'Cookie break', detail: 'One chocolate-chip cookie', kcal: 210, protein: 3, carbs: 30, fat: 9, food: 'cookie' as const, note: 'The cookie has entered the chat. I support this storyline.' },
]

function productPath(path: string): string {
  return import.meta.env.PROD ? `/app${path}` : path
}

export default function WelcomePage() {
  const { user } = useAuth()
  const reduced = useReducedMotion()
  const [mealIndex, setMealIndex] = useState(0)
  const meal = MEALS[mealIndex]
  const destination = user ? productPath('/') : productPath('/login?mode=signup')
  const signInDestination = user ? productPath('/') : productPath('/login?mode=signin')
  const cta = user ? 'Open my journal' : 'Get started'
  return (
    <div className="welcome-poster">
      <a className="wp-skip" href="#welcome-content">Skip to content</a>
      <header className="wp-nav">
        <Link to="/welcome" aria-label="Poiem home"><BrandLogo /></Link>
        <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#meet-momo">Meet Momo</a></nav>
        <div className="wp-nav-actions"><AppearanceControl compact /><a className="wp-signin" href={signInDestination}>{user ? 'My journal' : 'Sign in'}<ArrowUpRight size={18} /></a></div>
      </header>
      <main id="welcome-content">
        <section className="wp-hero" aria-labelledby="welcome-title">
          <div className="wp-hero-copy">
            <p className="wp-eyebrow"><span /> A FOOD JOURNAL WITH PERSONALITY</p>
            <h1 id="welcome-title">BIG LIFE.<br />GOOD FOOD.<br /><span>LESS FUSS.</span></h1>
            <p className="wp-intro">Eat the food. Log the moment. Get to know your calories and macros—with a little help from AI and a very opinionated dumpling.</p>
            <div className="wp-hero-actions"><a className="wp-button" href={destination}>{cta}<ArrowUpRight /></a><a className="wp-text-link" href="#try-it">Take a little bite <ArrowDown size={18} /></a></div>
            <p className="wp-fine">Google or email signup. Your pace. Your plate.</p>
          </div>
          <div className="wp-collage" aria-label="Momo, Poiem’s dumpling mascot, with a sample food journal ticket">
            <div className="wp-grid-paper" />
            <div className="wp-big-circle"><span>ALL FOODS<br />WELCOME.</span></div>
            <m.div className="wp-momo" whileHover={reduced ? undefined : { rotate: -5, y: -8 }} transition={{ type: 'spring', stiffness: 230, damping: 17 }}><Momo expression="proud" pose={reduced ? 'still' : 'wave_at_user'} /></m.div>
            <span className="wp-speech">Your lunch called.<br />It wants a fan club.</span>
            <div className="wp-sample-ticket"><span>POIEM / DAILY SPECIAL</span><strong>A little more<br />awareness.</strong><div><Check size={17} /> A lot less food guilt.</div><small>KEEP THE JOY. LOSE THE GUESSWORK.</small></div>
            <PosterSticker food="pizza" tone="coral" className="wp-pizza" tilt={12} />
            <PosterSticker food="cherry" tone="rose" className="wp-cherry" tilt={-14} />
            <span className="wp-orbit-label">SMALL LOGS. BIG PICTURE.</span>
          </div>
        </section>
        <div className="wp-manifesto" aria-label="Eat. Log. Live. All foods welcome."><span>EAT.</span><Sparkles /><span>LOG.</span><Sparkles /><span>LIVE.</span><Sparkles /><span>ALL FOODS WELCOME.</span><Utensils /></div>
        <section className="wp-demo wp-section" id="try-it" aria-labelledby="demo-title">
          <div className="wp-section-copy"><p className="wp-eyebrow">01 / A TASTE OF POIEM</p><h2 id="demo-title">YOUR PLATE.<br /><span>THE PLOT.</span></h2><p>Meals are more than numbers. But a few useful numbers can help you see the whole story.</p><p>Pick a meal. Meet your new journal.</p><div className="wp-meal-picker" aria-label="Preview a sample meal">{MEALS.map((item, index) => <button key={item.name} type="button" aria-pressed={index === mealIndex} onClick={() => setMealIndex(index)}>{item.name}<ArrowUpRight size={16} /></button>)}</div><p className="wp-fine">Interactive example, not an AI analysis. Actual portions and estimates vary. Nothing here is saved.</p></div>
          <div className="wp-demo-stage"><div className="wp-receipt" aria-live="polite" aria-atomic="true"><div className="wp-receipt-top"><BrandLogo /><span>SAMPLE ENTRY<br />NO. 00{mealIndex + 1}</span></div><div className="wp-receipt-food"><PosterSticker food={meal.food} tone="citron" tilt={-5} /><span>ON THE MENU</span><h3>{meal.name}</h3><p>{meal.detail}</p></div><div className="wp-calories"><strong>{meal.kcal}</strong><span>ESTIMATED<br />KCAL</span><Check /></div><dl className="wp-macros"><div><dt>Protein</dt><dd>{meal.protein}g</dd></div><div><dt>Carbs</dt><dd>{meal.carbs}g</dd></div><div><dt>Fat</dt><dd>{meal.fat}g</dd></div></dl><p className="wp-receipt-note"><Sparkles size={18} />{meal.note}</p><div className="wp-barcode" aria-hidden="true" /><p className="wp-receipt-end">NOT A SCORECARD. JUST YOUR STORY.</p></div><span className="wp-demo-stamp" aria-hidden="true">OH, THAT’S<br />MY LUNCH.</span></div>
        </section>
        <section className="wp-how wp-section" id="how-it-works" aria-labelledby="how-title">
          <div className="wp-section-heading"><div><p className="wp-eyebrow">02 / THE NOT-SO-SECRET RECIPE</p><h2 id="how-title">LESS TAPPING.<br />MORE <span>LIVING.</span></h2></div><p>Make room for the part that matters.<br />Actually enjoying your food.</p></div>
          <div className="wp-step-grid">{[
            { number: '01', Icon: Camera, title: 'SNAP IT.', text: 'Take a photo or describe your meal. Prefer the details? Enter it yourself.', className: 'wp-step-coral' },
            { number: '02', Icon: Utensils, title: 'MAKE IT YOURS.', text: 'Review the estimate. Adjust ingredients and portions before you save.', className: 'wp-step-yellow' },
            { number: '03', Icon: Sparkles, title: 'SEE THE STORY.', text: 'Look back at your journal, spot patterns, and keep your go-to meals close.', className: 'wp-step-green' },
          ].map(({ number, Icon, title, text, className }) => <m.article key={number} className={`wp-step ${className}`} whileHover={reduced ? undefined : { y: -7, rotate: -1 }}><div><span>{number}</span><Icon size={38} strokeWidth={2} /></div><h3>{title}</h3><p>{text}</p></m.article>)}</div>
        </section>
        <section className="wp-momo-section wp-section" id="meet-momo" aria-labelledby="momo-title"><div className="wp-momo-portrait"><span className="wp-eyebrow">CHIEF ENCOURAGEMENT OFFICER</span><Momo expression="caught_snacking" pose={reduced ? 'still' : 'tiny_dance'} /><span className="wp-name-tag">HELLO, I’M MOMO.</span></div><div className="wp-section-copy"><p className="wp-eyebrow">03 / MEET YOUR HYPE DUMPLING</p><h2 id="momo-title">A LITTLE SASS.<br /><span>ZERO SHAME.</span></h2><p>Momo celebrates the little wins, brings the occasional terrible joke, and keeps your journal from feeling like homework.</p><blockquote>“I’m technically a snack. My qualifications are impeccable.”</blockquote><p className="wp-momo-controls"><MessageSquare size={18} /> Here for the numbers? Quiet Momo down or hide the mascot in settings.</p></div></section>
        <section className="wp-faq wp-section" aria-labelledby="faq-title"><div><p className="wp-eyebrow">THE SIDE DISH</p><h2 id="faq-title">GOOD<br />QUESTIONS.</h2><Cookie size={60} strokeWidth={1.8} aria-hidden="true" /></div><div className="wp-questions">{[
          ['Do I have to log every single bite?', 'No. Poiem is a journal, not a rulebook. Use it at a pace that helps you, and come back whenever you want.'],
          ['Are the AI numbers exact?', 'No. Photo and text analysis produce estimates, and portions matter. Always review and adjust the entry before saving. You can also log food manually.'],
          ['Can I use Google to sign up?', 'Yes. Choose Get started, then Sign up with Google. Email signup is available too. You will set up your profile after signing in.'],
          ['Is this medical advice?', 'No. Poiem is a food-tracking tool for adults, not a medical service. For personal nutrition or medical advice, speak with a qualified professional.'],
        ].map(([question, answer]) => <details key={question}><summary>{question}<Plus size={22} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>
        <section className="wp-finale"><p className="wp-eyebrow">YOUR NEXT CHAPTER STARTS WITH A BITE.</p><h2>GO ON.<br /><span>MAKE A MEAL OF IT.</span></h2><a className="wp-button" href={destination}>{cta}<ArrowUpRight /></a><span className="wp-finale-sticker" aria-hidden="true"><PosterSticker food="croissant" tone="rose" tilt={14} /></span></section>
      </main>
      <footer className="wp-footer"><BrandLogo /><p>Made for messy, delicious, real life.</p><a href="#welcome-content">Back to the top <ArrowUpRight size={16} /></a><span>© {new Date().getFullYear()} Poiem</span></footer>
    </div>
  )
}
