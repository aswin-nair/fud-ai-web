/**
 * Momo's short memory, so he does not say the same thing twice running.
 *
 * This is deliberately per-tab-session rather than durable: within a visit he
 * should not repeat himself, but across visits the pools are allowed to come
 * back around. It holds nothing but his own sentences — no logging data.
 *
 * Every accessor is guarded. Private-browsing modes throw on sessionStorage
 * rather than returning null, and a mascot is not worth a crashed render.
 */

const RECENT_KEY = 'fud-ai-momo-recent'
const VARIANT_KEY = 'fud-ai-momo-variant'

/**
 * Long enough to span several gestures and a full tapping exchange. Individual
 * pools still fall back safely if a very long session exhausts every option.
 */
const RECENT_MAX = 16

export function recentLines(): string[] {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function rememberLine(line: string): void {
  try {
    const next = [line, ...recentLines().filter(l => l !== line)].slice(0, RECENT_MAX)
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* private mode — he will simply be free to repeat himself */
  }
}

/**
 * A number fixed for this tab session, used to shift which wording each poke
 * beat uses. The pose ladder stays put; only the words move, so the joke keeps
 * its shape while the ninth poke is not a recital of the last session's ninth.
 */
export function sessionVariant(): number {
  try {
    const existing = sessionStorage.getItem(VARIANT_KEY)
    if (existing !== null) {
      const n = Number.parseInt(existing, 10)
      if (Number.isFinite(n)) return n
    }
    const fresh = Math.floor(Math.random() * 1000)
    sessionStorage.setItem(VARIANT_KEY, String(fresh))
    return fresh
  } catch {
    return 0
  }
}
