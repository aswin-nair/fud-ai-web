import { useEffect, useRef } from 'react'
import { LEVEL_NAMES, LEVEL_COMPANIONS } from '../lib/xp'
import { Confetti } from './Confetti'
import { IconChevronRight } from './icons'
import { PressableButton } from './PressableButton'
import { feel } from '../lib/feel'

interface LevelUpOverlayProps {
  level: number
  onDone: () => void
}

export function LevelUpOverlay({ level, onDone }: LevelUpOverlayProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    feel('level-up')
  }, [])

  useEffect(() => {
    timerRef.current = setTimeout(onDone, 4000)
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [onDone])

  const companion = LEVEL_COMPANIONS[Math.min(level, LEVEL_COMPANIONS.length - 1)]
  const name = LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)]

  return (
    <>
      <Confetti />
      <div className="levelup-overlay" role="dialog" aria-modal aria-label={`Level ${level} reached`}>
        <div className="levelup-card">
          <div className="levelup-companion">{companion}</div>
          <div className="levelup-badge">Level up</div>
          <div className="levelup-level">{level}</div>
          <div className="levelup-name">{name}</div>
          <PressableButton fullWidth onClick={onDone}>
            Keep going <IconChevronRight size={16} strokeWidth={2.4} />
          </PressableButton>
        </div>
      </div>
    </>
  )
}
