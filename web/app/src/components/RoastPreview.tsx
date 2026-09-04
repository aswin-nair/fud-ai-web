import { useRef, useState } from 'react'
import { pickRoast, type RoastAct } from '../lib/mascotRoasts'
import { IconSparkles } from './icons'
import { Momo } from './Momo'

export function RoastPreview({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const [act, setAct] = useState<RoastAct | null>(null)
  const recent = useRef<string[]>([])
  function preview() {
    const next = pickRoast('you', Math.floor(Math.random() * 10000), recent.current, 'poke')
    recent.current = [next.line, ...recent.current].slice(0, 16)
    setAct(next)
  }
  return <div className="roast-preview" data-reduced-motion={reducedMotion}>
    {act && <div className="roast-preview-reply">
      <div className="roast-preview-momo" aria-hidden="true">
        <Momo mood="cozy" pose={reducedMotion ? 'still' : act.pose} />
      </div>
      <p role="status" aria-live="polite">{act.line}</p>
    </div>}
    <button type="button" className="today-shortcut" onClick={preview}><IconSparkles /> Roast me</button>
    <p className="roast-preview-hint">No AI key needed. Save settings to use this mode around the app.</p>
  </div>
}
