import { Fragment, type CSSProperties } from 'react'
import {
  Apple, CakeSlice, Carrot, Cherry, Citrus, Coffee, Cookie, Croissant, Egg,
  IceCreamCone, Pizza, Popcorn, Salad, Sandwich, Soup, Sparkles, Sprout,
} from 'lucide-react'

/*
 * The account poster's visual language, as small reusable parts.
 *
 * Every piece here is decorative. The page heading and controls carry the
 * meaning, so strips, stickers and bursts are hidden from assistive tech and
 * never add names that tests or screen readers would have to step over.
 */

const FOODS = {
  apple: Apple,
  cake: CakeSlice,
  carrot: Carrot,
  cherry: Cherry,
  citrus: Citrus,
  coffee: Coffee,
  cookie: Cookie,
  croissant: Croissant,
  egg: Egg,
  iceCream: IceCreamCone,
  pizza: Pizza,
  popcorn: Popcorn,
  salad: Salad,
  sandwich: Sandwich,
  soup: Soup,
  sprout: Sprout,
} as const

export type PosterFood = keyof typeof FOODS
export type PosterTone = 'paper' | 'coral' | 'citron' | 'leaf' | 'rose' | 'iris'

/** The black manifesto band that crowns the account poster. */
export function PosterStrip({ items, className = '' }: { items: readonly string[]; className?: string }) {
  return (
    <div className={`poster-strip ${className}`.trim()} aria-hidden="true">
      {items.map((item, index) => (
        <Fragment key={item}>
          {index > 0 && <Sparkles size={15} strokeWidth={2.5} />}
          <span>{item}</span>
        </Fragment>
      ))}
    </div>
  )
}

/** A tilted, ink-outlined food cut-out. */
export function PosterSticker({ food, tone = 'paper', tilt = -8, className = '' }: {
  food: PosterFood
  tone?: PosterTone
  tilt?: number
  className?: string
}) {
  const Icon = FOODS[food]
  return (
    <span
      className={`poster-sticker tone-${tone} ${className}`.trim()}
      style={{ '--poster-tilt': `${tilt}deg` } as CSSProperties}
      aria-hidden="true"
    >
      <Icon size={26} strokeWidth={2.25} />
    </span>
  )
}

/** The starburst price-tag badge from the poster, holding two or three short words. */
export function PosterBurst({ lines, tone = 'coral' }: { lines: readonly string[]; tone?: PosterTone }) {
  return (
    <span className={`poster-burst tone-${tone}`} aria-hidden="true">
      <span>{lines.map((line, index) => <Fragment key={line}>{index > 0 && <br />}{line}</Fragment>)}</span>
    </span>
  )
}

/** A masthead collage: one burst and up to two stickers, pinned inside the panel. */
export function PosterArt({ burst, burstTone, stickers = [], placement = 'bottom' }: {
  burst?: readonly string[]
  burstTone?: PosterTone
  stickers?: ReadonlyArray<{ food: PosterFood; tone?: PosterTone; tilt?: number }>
  placement?: 'top' | 'bottom'
}) {
  return (
    <div className={`poster-art is-${placement}`} aria-hidden="true">
      {burst && <PosterBurst lines={burst} tone={burstTone} />}
      {stickers.slice(0, 2).map((sticker, index) => (
        <PosterSticker key={sticker.food} {...sticker} className={`is-${index + 1}`} />
      ))}
    </div>
  )
}
