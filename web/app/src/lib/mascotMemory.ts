/**
 * Momo's short, session-only memory.
 *
 * It stores only Momo's own approved sentences, categorical context keys and
 * speech timestamps. It never stores what a person logged, typed or searched
 * for. Every accessor is guarded because private browsing may reject storage.
 */

const RECENT_KEY = 'fud-ai-momo-recent'
const VARIANT_KEY = 'fud-ai-momo-variant'
const GLOBAL_CONTEXT = 'global'

const RECENT_MAX = 16
const CONTEXT_RECENT_MAX = 10
const CONTEXT_MAX = 24

interface MascotMemory {
  version: 2
  global: string[]
  contexts: Record<string, string[]>
  contextOrder: string[]
  lastSpokeAt: Record<string, number>
}

function emptyMemory(): MascotMemory {
  return { version: 2, global: [], contexts: {}, contextOrder: [], lastSpokeAt: {} }
}

function stringList(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))]
    .slice(0, limit)
}

function contextKey(value: string): string {
  const key = value.trim().slice(0, 160)
  return key || GLOBAL_CONTEXT
}

function readMemory(): MascotMemory {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY)
    if (!raw) return emptyMemory()
    const parsed: unknown = JSON.parse(raw)

    // Migrate the original array-only format without losing this session's
    // latest line.
    if (Array.isArray(parsed)) {
      return { ...emptyMemory(), global: stringList(parsed, RECENT_MAX) }
    }
    if (!parsed || typeof parsed !== 'object') return emptyMemory()

    const value = parsed as Partial<MascotMemory>
    const contexts: Record<string, string[]> = {}
    if (value.contexts && typeof value.contexts === 'object') {
      for (const [key, lines] of Object.entries(value.contexts).slice(0, CONTEXT_MAX)) {
        contexts[contextKey(key)] = stringList(lines, CONTEXT_RECENT_MAX)
      }
    }

    const lastSpokeAt: Record<string, number> = {}
    if (value.lastSpokeAt && typeof value.lastSpokeAt === 'object') {
      for (const [key, at] of Object.entries(value.lastSpokeAt).slice(0, CONTEXT_MAX + 1)) {
        if (typeof at === 'number' && Number.isFinite(at) && at >= 0) lastSpokeAt[contextKey(key)] = at
      }
    }

    const contextOrder = stringList(value.contextOrder, CONTEXT_MAX)
      .map(contextKey)
      .filter(key => key in contexts)

    return {
      version: 2,
      global: stringList(value.global, RECENT_MAX),
      contexts,
      contextOrder,
      lastSpokeAt,
    }
  } catch {
    return emptyMemory()
  }
}

function writeMemory(memory: MascotMemory): void {
  try {
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(memory))
  } catch {
    /* Private mode: Momo remains usable, with memory limited to the caller. */
  }
}

/** Recent lines in newest-first order, globally or for one categorical context. */
export function recentLines(context = GLOBAL_CONTEXT): string[] {
  const memory = readMemory()
  const key = contextKey(context)
  return key === GLOBAL_CONTEXT ? memory.global : (memory.contexts[key] ?? [])
}

/**
 * Remember a delivered line. Supplying a context gives each event its own
 * history while also updating the global history used by legacy callers.
 */
export function rememberLine(
  line: string,
  context = GLOBAL_CONTEXT,
  spokenAt = Date.now(),
): void {
  const clean = line.trim()
  if (!clean) return

  const memory = readMemory()
  const key = contextKey(context)
  memory.global = [clean, ...memory.global.filter(item => item !== clean)].slice(0, RECENT_MAX)
  if (Number.isFinite(spokenAt) && spokenAt >= 0) memory.lastSpokeAt[GLOBAL_CONTEXT] = spokenAt

  if (key !== GLOBAL_CONTEXT) {
    const current = memory.contexts[key] ?? []
    memory.contexts[key] = [clean, ...current.filter(item => item !== clean)].slice(0, CONTEXT_RECENT_MAX)
    memory.contextOrder = [key, ...memory.contextOrder.filter(item => item !== key)].slice(0, CONTEXT_MAX)
    if (Number.isFinite(spokenAt) && spokenAt >= 0) memory.lastSpokeAt[key] = spokenAt

    const active = new Set(memory.contextOrder)
    for (const storedKey of Object.keys(memory.contexts)) {
      if (!active.has(storedKey)) {
        delete memory.contexts[storedKey]
        delete memory.lastSpokeAt[storedKey]
      }
    }
  }

  writeMemory(memory)
}

/**
 * A deterministic clock seam for schedulers. `Infinity` represents a muted or
 * disabled mascot and can never become ready accidentally.
 */
export function speechCooldownReady(
  cooldownMs: number,
  context = GLOBAL_CONTEXT,
  now = Date.now(),
): boolean {
  if (cooldownMs === Infinity) return false
  if (!Number.isFinite(cooldownMs) || cooldownMs <= 0) return true

  const last = readMemory().lastSpokeAt[contextKey(context)]
  return last === undefined || now - last >= cooldownMs
}

/**
 * A number fixed for this tab session. Tests may inject entropy so selection
 * stays reproducible without stubbing global randomness.
 */
export function sessionVariant(random: () => number = Math.random): number {
  try {
    const existing = sessionStorage.getItem(VARIANT_KEY)
    if (existing !== null) {
      const n = Number.parseInt(existing, 10)
      if (Number.isFinite(n)) return n
    }
    const sample = random()
    const fresh = Number.isFinite(sample) ? Math.floor(Math.abs(sample) * 1000) % 1000 : 0
    sessionStorage.setItem(VARIANT_KEY, String(fresh))
    return fresh
  } catch {
    return 0
  }
}
