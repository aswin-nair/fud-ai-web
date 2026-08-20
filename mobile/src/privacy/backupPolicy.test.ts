import { describe, expect, it } from 'vitest'

import { NUTRITION_DATABASE_BACKUP, iosDatabaseCandidates } from './backupPolicy'

describe('mobile nutrition backup policy', () => {
  it('keeps the nutrition database out of device backups', () => {
    expect(NUTRITION_DATABASE_BACKUP).toBe('excluded')
  })

  it('looks for the expo-sqlite file under Documents/SQLite', () => {
    expect(iosDatabaseCandidates('file:///var/mobile/Documents/', 'calorie-tracker.db')).toEqual([
      'file:///var/mobile/Documents/SQLite/calorie-tracker.db',
      'file:///var/mobile/Documents/calorie-tracker.db',
    ])
  })
})
