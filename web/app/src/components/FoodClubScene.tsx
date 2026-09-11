import { ArrowUpRight, Camera, Check, Flame, Pizza, Sparkles, Sprout, Utensils } from 'lucide-react'
import { MotionConfig, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { useApp } from '../store/AppContext'
import { bubblePop, motionOpacity, motionSoftSpring, stickerDrop } from '../lib/motionPresets'
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
      <aside className={`food-club-poster${returning ? ' is-returning' : ''}`} aria-label="Meet your food sidekick">
        <p className="food-club-eyebrow"><span /> THE EVERYDAY APPETITE <ArrowUpRight size={20} aria-hidden="true" /></p>
        <div className="food-club-cover">
        <h2 className="food-club-headline"><span>EAT.</span>{' '}<span className="food-club-outline-word">LOG.</span>{' '}<span className="food-club-live-word">LIVE.</span></h2>
        <div className="food-club-art" aria-hidden="true">
          <div className="food-club-starburst"><span>BIG<br />APPETITE<br />ENERGY</span></div>
          <div className="food-club-orbit" />
          <span className="food-club-spark"><Sparkles size={38} strokeWidth={2.5} /></span>
          <m.div className="food-club-pizza" {...(reduced ? motionOpacity : stickerDrop)}>
            <Pizza size={60} strokeWidth={2} /><span>YES, PIZZA.</span>
          </m.div>
          <div className="food-club-plate">
            <div className="food-club-plate-ring" />
            {visible ? <m.div className="food-club-momo" initial={false}
              animate={{ rotate: privateFocus ? -5 : error ? 4 : 0, y: loading ? -5 : 0 }}
              transition={motionSoftSpring}>
              <MomoSticker mood={privateFocus ? 'sleepy' : error || loading ? 'curious' : 'excited'} pose={loading ? 'ponder' : 'still'}
                expression={privateFocus ? 'sleepy' : error ? 'skeptical' : loading ? 'curious' : returning ? 'proud' : 'celebrating'} />
            </m.div> : <Utensils className="food-club-fallback" size={90} strokeWidth={1.5} />}
          </div>
          <div className="food-club-greens"><Sprout size={40} /><span>AND GREENS.</span></div>
          <m.div className="food-club-receipt" {...(reduced ? motionOpacity : stickerDrop)}>
            <div><Camera size={16} /><span>ON THE MENU</span><Check size={16} /></div>
            <strong>Yogurt & berries</strong>
            <p><Flame size={18} /><b>320</b> kcal <small>example meal</small></p>
          </m.div>
        </div>
        </div>
        <p className="food-club-description"><strong>A food journal with an appetite for life.</strong> Track calories and macros with a photo or a few words. Then get on with the good stuff.</p>
        {visible && !state.profile.mascotMuted && <div className="food-club-bubble-wrap">
          <span className="food-club-momo-label">MOMO SAYS</span>
          <m.p className="food-club-bubble" key={line} {...(reduced ? motionOpacity : bubblePop)}>{line}</m.p>
        </div>}
        <div className="food-club-poster-foot"><span>01 / SNAP</span><Sparkles size={16} aria-hidden="true" /><span>02 / LOG</span><Sparkles size={16} aria-hidden="true" /><span>03 / LIVE</span></div>
      </aside>
    </MotionConfig>
  )
}
