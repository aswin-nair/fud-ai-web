import { weekDatesContaining, sameDay, narrowWeekday } from '../lib/dates'

interface WeekStripProps {
  selectedDate: Date
  onSelect: (date: Date) => void
}

function isFutureDay(date: Date, today: Date): boolean {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)
  return d > t
}

export function WeekStrip({ selectedDate, onSelect }: WeekStripProps) {
  const today = new Date()
  const days = weekDatesContaining(selectedDate)

  return (
    <div className="week-strip">
      {days.map(d => {
        const isSelected = sameDay(d, selectedDate)
        const isToday = sameDay(d, today)
        const isFuture = isFutureDay(d, today)

        return (
          <button
            key={d.toISOString()}
            type="button"
            className="week-day"
            disabled={isFuture}
            onClick={() => onSelect(d)}
          >
            <span className={`week-day-label${isSelected ? ' selected' : ''}`}>
              {narrowWeekday(d)}
            </span>
            <span
              className={[
                'week-day-circle',
                isSelected ? 'selected' : '',
                isToday && !isSelected ? 'today' : '',
              ].filter(Boolean).join(' ')}
            >
              {d.getDate()}
            </span>
          </button>
        )
      })}
    </div>
  )
}
