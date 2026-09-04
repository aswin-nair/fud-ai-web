import type { FoodEntry } from '../types'

/** Undo a deletion without replaying log rewards or replacing a newer copy. */
export function restoreDeletedEntry(entries: FoodEntry[], entry: FoodEntry): FoodEntry[] {
  if (entries.some(item => item.id === entry.id)) return entries
  return [...entries, entry]
}
