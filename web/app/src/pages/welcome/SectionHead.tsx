import type { ReactNode } from 'react'

export function SectionHead({ index, label, titleId, title, note }: { index: string; label: string; titleId: string; title: ReactNode; note?: string }) {
  return (
    <header className="wp-head">
      <p className="wp-label">[{index}] {label}</p>
      <h2 id={titleId}>{title}</h2>
      {note && <p className="wp-head-note">{note}</p>}
    </header>
  )
}
