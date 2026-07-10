/**
 * Shared icon set for Fud AI.
 *
 * Every icon is a small, hand-drawn SVG with a consistent 24x24 grid,
 * rounded strokes, and a `currentColor` fill/stroke so icons inherit
 * text color and transition smoothly (e.g. nav active states).
 * Emoji are used elsewhere for food/mood/gamification personality —
 * these cover UI "chrome": navigation, actions, and affordances.
 */
import type { SVGProps } from 'react'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height' | 'viewBox'> {
  size?: number
  active?: boolean
}

function base(size: number | undefined, extra: SVGProps<SVGSVGElement> = {}) {
  return {
    width: size ?? 20,
    height: size ?? 20,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...extra,
  }
}

export function IconHome({ size, active, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M3.5 10.9L12 4l8.5 6.9V19a1.4 1.4 0 01-1.4 1.4H4.9A1.4 1.4 0 013.5 19v-8.1z" />
      <rect x="9.4" y="14" width="5.2" height="6.4" rx="1.1" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 0 : 1.8} />
    </svg>
  )
}

export function IconProgress({ size, active, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <rect x="4" y="13.2" width="4" height="6.8" rx="1.3" fill={active ? 'currentColor' : 'none'} />
      <rect x="10" y="8.4" width="4" height="11.6" rx="1.3" fill={active ? 'currentColor' : 'none'} />
      <rect x="16" y="3.6" width="4" height="16.4" rx="1.3" fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
}

export function IconJourney({ size, active, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M12 21s-6.3-6.05-6.3-10.8A6.3 6.3 0 1118.3 10.2C18.3 14.95 12 21 12 21z" />
      <circle cx="12" cy="10.1" r="2.15" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 0 : 1.8} />
    </svg>
  )
}

export function IconCoach({ size, active: _active, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M4 6.8A3.3 3.3 0 017.3 3.5h9.4A3.3 3.3 0 0120 6.8v5.6a3.3 3.3 0 01-3.3 3.3H9.4l-4.2 3.1a.7.7 0 01-1.2-.6V6.8z" />
      <circle cx="8.3" cy="9.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="9.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="9.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconSettings({ size, active, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <circle cx="12" cy="12" r="3.1" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 0 : 2} />
      <path d="M12 2.5v2.6M12 18.9v2.6M4.7 4.7l1.85 1.85M17.45 17.45l1.85 1.85M1.5 12h2.6M19.9 12h2.6M4.7 19.3l1.85-1.85M17.45 6.55l1.85-1.85" />
    </svg>
  )
}

export function IconPlus({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, { strokeWidth: 2.4, ...rest })}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconClose({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, { strokeWidth: 2.2, ...rest })}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function IconChevronLeft({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, { strokeWidth: 2.3, ...rest })}>
      <path d="M15 4.5l-7 7.5 7 7.5" />
    </svg>
  )
}

export function IconChevronRight({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, { strokeWidth: 2.3, ...rest })}>
      <path d="M9 4.5l7 7.5-7 7.5" />
    </svg>
  )
}

export function IconChevronDown({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, { strokeWidth: 2.3, ...rest })}>
      <path d="M4.5 9l7.5 7 7.5-7" />
    </svg>
  )
}

export function IconStar({ size, active, ...rest }: IconProps) {
  return (
    <svg {...base(size, { strokeWidth: 1.7, fill: active ? 'currentColor' : 'none', ...rest })}>
      <path d="M12 3.2l2.53 5.32 5.77.58-4.31 4.03 1.14 5.75L12 15.9l-5.13 2.98 1.14-5.75-4.31-4.03 5.77-.58z" />
    </svg>
  )
}

export function IconMinus({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, { strokeWidth: 2.4, ...rest })}>
      <path d="M5 12h14" />
    </svg>
  )
}

export function IconTrash({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M4.5 7h15M9.5 7V5a1.5 1.5 0 011.5-1.5h2A1.5 1.5 0 0114.5 5v2M18.5 7l-.72 12.1a2 2 0 01-2 1.9H8.22a2 2 0 01-2-1.9L5.5 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function IconSend({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, { strokeWidth: 1.9, strokeLinejoin: 'round', ...rest })}>
      <path d="M4 12L20 4l-3.2 16-5.1-5.6L4 12z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconCheck({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, { strokeWidth: 2.4, ...rest })}>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  )
}

export function IconMenuLines({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, { strokeWidth: 2.1, ...rest })}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  )
}

export function IconEdit({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M4 20l.9-4.2L15.5 5.2a1.4 1.4 0 012 0l1.3 1.3a1.4 1.4 0 010 2L8.2 19.1 4 20z" />
      <path d="M13.6 6.9l3.3 3.3" />
    </svg>
  )
}

export function IconCamera({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M4 8.3A1.8 1.8 0 015.8 6.5h1.9l.9-1.6a1.6 1.6 0 011.4-.8h4a1.6 1.6 0 011.4.8l.9 1.6h1.9A1.8 1.8 0 0120 8.3v9A1.8 1.8 0 0118.2 19H5.8A1.8 1.8 0 014 17.3v-9z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </svg>
  )
}

export function IconClipboard({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <rect x="5.5" y="4.5" width="13" height="17" rx="2" />
      <path d="M9 4.5h6a1 1 0 011 1v1.2a1 1 0 01-1 1H9a1 1 0 01-1-1V5.5a1 1 0 011-1z" fill="currentColor" />
      <path d="M8.5 12.5h7M8.5 16h7" />
    </svg>
  )
}

export function IconArrowUpRight({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size, { strokeWidth: 2.1, ...rest })}>
      <path d="M7 17L17 7M8.5 7H17v8.5" />
    </svg>
  )
}
