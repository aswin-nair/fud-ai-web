export const FIRST_LOG_EVENT = 'first_log'

export function shouldRecordNamedEvent(existing: readonly string[], name: string): boolean {
  return !existing.includes(name)
}
