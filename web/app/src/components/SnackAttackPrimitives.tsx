import { Camera, Pizza, Sparkles, Sprout, Utensils } from 'lucide-react'
import type { ReactNode } from 'react'

type StickerVariant = 'pizza' | 'sprout' | 'spark' | 'camera' | 'meal'

const STICKERS = {
  pizza: Pizza,
  sprout: Sprout,
  spark: Sparkles,
  camera: Camera,
  meal: Utensils,
} as const

/** A small set of consistent paper-cut food marks for collage compositions. */
export function FoodSticker({ variant, label, className = '' }: {
  variant: StickerVariant
  label?: string
  className?: string
}) {
  const Icon = STICKERS[variant]
  return <span className={`food-sticker food-sticker-${variant} ${className}`.trim()} aria-hidden={label ? undefined : true}>
    <Icon size={28} strokeWidth={2} />
    {label && <span className="sr-only">{label}</span>}
  </span>
}

export function MomoBubble({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`momo-bubble ${className}`.trim()}>{children}</p>
}

export function NeoCard({ children, className = '', as: Tag = 'div' }: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}) {
  return <Tag className={`neo-card ${className}`.trim()}>{children}</Tag>
}

export function ProgressRecipe({ current, labels }: { current: number; labels: readonly string[] }) {
  const safeCurrent = Math.min(Math.max(current, 0), Math.max(labels.length - 1, 0))
  return <div className="progress-recipe" role="progressbar" aria-label="Onboarding progress"
    aria-valuemin={1} aria-valuemax={labels.length} aria-valuenow={safeCurrent + 1}
    aria-valuetext={`Step ${safeCurrent + 1} of ${labels.length}: ${labels[safeCurrent]}`}>
    <span className="progress-recipe-fill" style={{ width: `${labels.length ? ((safeCurrent + 1) / labels.length) * 100 : 0}%` }} />
    <span className="progress-recipe-stops" style={{ gridTemplateColumns: `repeat(${Math.max(labels.length, 1)}, 1fr)` }} aria-hidden="true">{labels.map(label => <i key={label} />)}</span>
  </div>
}
