import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FoodEntry } from '../types'
import { sameDay } from '../lib/dates'
import { useApp } from '../store/AppContext'
import { useToast } from './Toast'
import { IconChevronRight, IconEdit, IconTrash } from './icons'
import { useAnchor } from '../mascot/anchors'
import { feel } from '../lib/feel'

const SNAP_PX = 80

function TicketRow({
  entry,
  readOnly,
  last,
}: {
  entry: FoodEntry
  readOnly: boolean
  last: boolean
}) {
  const { deleteEntry, addEntry } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const lastAnchor = useAnchor('last_entry')
  const touch = useRef({ startX: 0, startY: 0, offset: 0, swiped: false })

  useEffect(() => {
    const el = cardRef.current
    if (!el || readOnly) return
    const t = touch.current

    function snapTo(px: number) {
      t.offset = px
      el!.style.transform = `translateX(${px}px)`
      el!.style.transition = 'transform 0.22s ease'
    }

    function onStart(e: TouchEvent) {
      t.startX = e.touches[0].clientX
      t.startY = e.touches[0].clientY
      t.swiped = false
      el!.style.transition = 'none'
    }

    function onMove(e: TouchEvent) {
      const dx = e.touches[0].clientX - t.startX
      const dy = e.touches[0].clientY - t.startY
      if (Math.abs(dy) > Math.abs(dx) + 4) return
      e.preventDefault()
      if (Math.abs(dx) > 8) t.swiped = true
      const next = Math.max(-SNAP_PX, Math.min(SNAP_PX, t.offset + dx))
      el!.style.transform = `translateX(${next}px)`
    }

    function onEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - t.startX
      const effective = t.offset + dx
      if (effective < -SNAP_PX / 2) snapTo(-SNAP_PX)
      else if (effective > SNAP_PX / 2) snapTo(SNAP_PX)
      else snapTo(0)
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [readOnly])

  function handleDelete() {
    const saved = { ...entry }
    deleteEntry(entry.id)
    toast(`Deleted ${entry.name}`, {
      type: 'info',
      action: { label: 'Undo', fn: () => addEntry(saved) },
    })
  }

  return (
    <div className="ticket-row-outer">
      <div className="swipe-row-wrap">
        {!readOnly && (
          <>
            <button type="button" className="swipe-edit-btn" onClick={() => navigate(`/edit/${entry.id}`)} aria-label="Edit">
              <IconEdit size={18} />
              <span>Edit</span>
            </button>
            <button type="button" className="swipe-delete-btn danger" onClick={handleDelete} aria-label="Delete">
              <IconTrash size={18} />
              <span>Delete</span>
            </button>
          </>
        )}
        <div
          ref={(node) => {
            cardRef.current = node
            if (last) lastAnchor(node)
          }}
          className="ticket-row"
          role="button"
          tabIndex={0}
          onClick={() => {
            if (readOnly || touch.current.swiped) return
            navigate(`/edit/${entry.id}`)
          }}
          onKeyDown={e => e.key === 'Enter' && !readOnly && navigate(`/edit/${entry.id}`)}
        >
          <span className="ticket-thumb" aria-hidden>{entry.emoji ?? '🍽️'}</span>
          <span className="ticket-row-name">{entry.name}</span>
          <span className="ticket-row-kcal tabular">{Math.round(entry.calories)}</span>
          <IconChevronRight size={16} />
        </div>
      </div>
    </div>
  )
}

export function Ticket({
  date,
  ticketNo,
  entries,
  protein,
  carbs,
  fat,
  proteinGoal,
  carbsGoal,
  fatGoal,
  water,
  onWater,
  onNote,
  notes,
  paused,
  variant = 'full',
}: {
  date: Date
  ticketNo: number
  entries: FoodEntry[]
  protein: number
  carbs: number
  fat: number
  proteinGoal: number
  carbsGoal: number
  fatGoal: number
  water: number
  onWater: (n: number) => void
  onNote: () => void
  notes: number
  /** 'extras' renders only water and notes — Home now owns macros and the list. */
  variant?: 'full' | 'extras'
  paused: boolean
}) {
  const today = new Date()
  const isToday = sameDay(date, today)
  const isFuture = date > today && !isToday
  const isPast = date < today && !isToday
  const readOnly = !isToday || paused
  const topAnchor = useAnchor('ticket_top')
  const waterAnchor = useAnchor('water_row')
  const macroAnchor = useAnchor('macro_meter')

  const heading = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <section className={`ticket${isPast ? ' is-torn' : ''}${isFuture ? ' is-future' : ''}`} aria-label="Today's ticket">
      <div className="ticket-perf" ref={topAnchor} aria-hidden />
      {variant === 'full' && (
      <header className="ticket-head">
        <div>
          <p className="ticket-kicker">Kitchen ticket</p>
          <h2 className="ticket-date">{heading}</h2>
        </div>
        <span className="ticket-no tabular">Ticket #{Math.max(1, ticketNo)}</span>
      </header>
      )}

      {variant === 'full' && !paused && (
        <div className="ticket-macros" ref={macroAnchor}>
          <MacroSeg label="Protein" current={protein} goal={proteinGoal} tone="protein" />
          <MacroSeg label="Carbs" current={carbs} goal={carbsGoal} tone="carbs" />
          <MacroSeg label="Fat" current={fat} goal={fatGoal} tone="fat" />
        </div>
      )}

      {variant === 'extras' ? null : isFuture ? (
        <p className="ticket-empty">That day is still ahead. Come back when it is today.</p>
      ) : entries.length === 0 ? (
        <p className="ticket-empty">Nothing logged yet — start with breakfast</p>
      ) : (
        <div className="ticket-list">
          {entries.map((entry, i) => (
            <TicketRow
              key={entry.id}
              entry={entry}
              readOnly={readOnly}
              last={i === entries.length - 1}
            />
          ))}
        </div>
      )}

      {!paused && !isFuture && (
        <div className="ticket-water" ref={waterAnchor}>
          <div className="ticket-water-head">
            <span>Water</span>
            <span className="tabular">{water}/8</span>
          </div>
          <div className="ticket-glasses" role="group" aria-label="Water glasses">
            {Array.from({ length: 8 }, (_, i) => {
              const filled = i < water
              return (
                <button
                  key={i}
                  type="button"
                  className={`ticket-glass${filled ? ' is-filled' : ''}`}
                  disabled={readOnly}
                  aria-label={`Glass ${i + 1}${filled ? ', filled' : ''}`}
                  onClick={() => { feel('water'); onWater(filled && i === water - 1 ? water - 1 : i + 1) }}
                />
              )
            })}
          </div>
          {isToday && !paused && (
            <button type="button" className="ticket-note" onClick={() => { feel('tap'); onNote() }} disabled={notes >= 3}>
              {notes >= 3 ? 'Notes logged' : 'Add a kitchen note'}
            </button>
          )}
        </div>
      )}

      {entries.length > 0 && !paused && (
        <p className="ticket-stamp">Logged.</p>
      )}
    </section>
  )
}

function MacroSeg({
  label,
  current,
  goal,
  tone,
}: {
  label: string
  current: number
  goal: number
  tone: 'protein' | 'carbs' | 'fat'
}) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0
  return (
    <div
      className={`ticket-macro ticket-macro-${tone}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(goal)}
      aria-valuenow={Math.round(Math.min(current, goal))}
    >
      <span className="ticket-macro-fill" style={{ width: `${pct}%` }} />
      <span className="ticket-macro-copy">
        {label}
        {' '}
        <span className="tabular">{Math.round(current)}</span>
        /
        <span className="tabular">{Math.round(goal)}</span>
      </span>
    </div>
  )
}
