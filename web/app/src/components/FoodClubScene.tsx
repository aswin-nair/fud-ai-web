import { Camera, Check, Flame, Pizza, Sparkles, Sprout, Utensils } from 'lucide-react'
import { MotionConfig, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { useApp } from '../store/AppContext'
import { motionSoftSpring } from '../lib/motionPresets'
import { MomoSticker } from './MomoSticker'

/** The account flow's decorative food poster. Example values are never user data. */
export function FoodClubScene({ privateFocus, loading, error, returning }: {
  privateFocus: boolean; loading: boolean; error: boolean; returning: boolean
}) {
  const { state } = useApp()
  const reduced = useReducedMotion() || state.profile.mascotReducedMotion
  const visible = state.gamification.mascotActivity !== 'off'
  const line = privateFocus ? 'Eyes closed. Your password is your business.'
    : loading ? 'Setting your place at the table…'
      : error ? 'Tiny hiccup. Let’s try that again.'
        : returning ? 'Your plate called. It missed you.' : 'You bring the appetite. I bring the maths.'

  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
      <aside className="food-club-poster" aria-label="Meet your food sidekick">
        <p className="food-club-eyebrow"><span /> GOOD FOOD. GOOD COMPANY.</p>
        <h2 className="food-club-headline">Big flavour.<br /><span>Little effort.</span></h2>
        <p className="food-club-description">A little tracking. A lot of living.<br />Your calories, macros, and meals, all in one happy place.</p>
        <div className="food-club-art" aria-hidden="true">
          <div className="food-club-starburst"><span>ALL FOODS<br />WELCOME</span></div>
          <div className="food-club-orbit" />
          <span className="food-club-spark"><Sparkles size={38} strokeWidth={2.5} /></span>
          <m.div className="food-club-pizza" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={motionSoftSpring}>
            <Pizza size={60} strokeWidth={1.7} /><span>pizza? yes.</span>
          </m.div>
          <div className="food-club-plate">
            <div className="food-club-plate-ring" />
            {visible ? <m.div className="food-club-momo" initial={false}
              animate={{ rotate: privateFocus ? -5 : error ? 4 : 0, y: loading ? -5 : 0 }}
              transition={motionSoftSpring}>
              <MomoSticker mood={privateFocus ? 'sleepy' : error || loading ? 'curious' : 'excited'} pose={loading ? 'ponder' : 'still'} />
            </m.div> : <Utensils className="food-club-fallback" size={90} strokeWidth={1.5} />}
          </div>
          <div className="food-club-greens"><Sprout size={40} /><span>room for greens</span></div>
          <m.div className="food-club-receipt" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...motionSoftSpring, delay: .12 }}>
            <div><Camera size={16} /><span>ON THE MENU</span><Check size={16} /></div>
            <strong>Yogurt & berries</strong>
            <p><Flame size={18} /><b>320</b> kcal <small>example meal</small></p>
          </m.div>
        </div>
        {visible && !state.profile.mascotMuted && <div className="food-club-bubble-wrap">
          <span className="food-club-momo-label">MOMO SAYS</span>
          <m.p className="food-club-bubble" key={line} initial={{ opacity: .3 }} animate={{ opacity: 1 }} transition={{ duration: .18 }}>{line}</m.p>
        </div>}
        <div className="food-club-poster-foot"><span>SNAP IT.</span><Sparkles size={16} /><span>LOG IT.</span><Sparkles size={16} /><span>LIVE A LITTLE.</span></div>
      </aside>
    </MotionConfig>
  )
}
