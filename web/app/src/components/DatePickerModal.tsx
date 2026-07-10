import { useState } from 'react'
import { monthGridWeeks, sameDay, startOfDay } from '../lib/dates'
import { IconChevronLeft, IconChevronRight, IconClose } from './icons'

interface DatePickerModalProps {
  selectedDate: Date
  onSelect: (date: Date) => void
  onClose: () => void
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function isFutureDay(date: Date, today: Date): boolean {
  return date.getTime() > today.getTime()
}

export function DatePickerModal({ selectedDate, onSelect, onClose }: DatePickerModalProps) {
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  const today = startOfDay()
  const weeks = monthGridWeeks(viewMonth)
  const isCurrentMonth = viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() === today.getMonth()

  function prevMonth() {
    setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }

  function nextMonth() {
    if (isCurrentMonth) return
    setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }

  return (
    <div className="date-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="date-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label="Choose a date"
      >
        <div className="date-modal-header">
          <button type="button" className="date-modal-nav" onClick={prevMonth} aria-label="Previous month">
            <IconChevronLeft size={17} strokeWidth={2.3} />
          </button>
          <span className="date-modal-title">
            {viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
          <button
            type="button"
            className="date-modal-nav"
            onClick={nextMonth}
            disabled={isCurrentMonth}
            aria-label="Next month"
          >
            <IconChevronRight size={17} strokeWidth={2.3} />
          </button>
          <button type="button" className="date-modal-close" onClick={onClose} aria-label="Close">
            <IconClose size={15} strokeWidth={2.3} />
          </button>
        </div>

        <div className="date-modal-weekdays">
          {WEEKDAY_LABELS.map((w, i) => <span key={i}>{w}</span>)}
        </div>

        <div className="date-modal-grid">
          {weeks.map((week, wi) => week.map((d, di) => {
            if (!d) return <span key={`${wi}-${di}`} className="date-modal-cell empty" aria-hidden />
            const future = isFutureDay(d, today)
            const selected = sameDay(d, selectedDate)
            const isToday = sameDay(d, today)
            return (
              <button
                key={`${wi}-${di}`}
                type="button"
                className={`date-modal-cell${selected ? ' selected' : ''}${isToday && !selected ? ' today' : ''}`}
                disabled={future}
                onClick={() => { onSelect(d); onClose() }}
              >
                {d.getDate()}
              </button>
            )
          }))}
        </div>

        <button
          type="button"
          className="date-modal-today-btn"
          onClick={() => { onSelect(startOfDay()); onClose() }}
        >
          Jump to today
        </button>
      </div>
    </div>
  )
}
