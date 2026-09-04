import type { SnapshotDrainResult } from './snapshotDrain'

export function createSnapshotDrainCoordinator(
  drain: (userId: string) => Promise<SnapshotDrainResult>,
): (userId: string) => Promise<SnapshotDrainResult> {
  const active = new Map<string, {
    rerun: boolean
    promise: Promise<SnapshotDrainResult>
  }>()

  return (userId) => {
    const current = active.get(userId)
    if (current) {
      // A write may have landed after the active drain loaded its queue. One
      // successful follow-up pass closes that race without parallel uploads.
      current.rerun = true
      return current.promise
    }

    const slot: { rerun: boolean; promise: Promise<SnapshotDrainResult> } = {
      rerun: false,
      promise: Promise.resolve({ ok: false, kind: 'offline', pending: 0 }),
    }
    slot.promise = (async () => {
      let result: SnapshotDrainResult
      do {
        slot.rerun = false
        result = await drain(userId)
      } while (slot.rerun && result.ok)
      return result
    })().finally(() => {
      if (active.get(userId) === slot) active.delete(userId)
    })
    active.set(userId, slot)
    return slot.promise
  }
}
