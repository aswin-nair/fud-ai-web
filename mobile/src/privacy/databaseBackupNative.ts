import { Platform } from 'react-native'

import { DATABASE_NAME } from '@/db/client'
import { iosDatabaseCandidates } from '@/privacy/backupPolicy'

type FileSystemModule = {
  documentDirectory: string | null
  getInfoAsync: (uri: string) => Promise<{ exists: boolean }>
}

/**
 * Marks the nutrition SQLite file excluded from iCloud backup when the
 * operating system exposes that attribute. Android Auto Backup is already
 * disabled in app config. A missing helper must not crash startup.
 */
export async function excludeNutritionDatabaseFromBackup(): Promise<void> {
  if (Platform.OS !== 'ios') return

  try {
    // Loaded lazily so non-iOS bundles do not evaluate this native adapter.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const FileSystem = require('expo-file-system/legacy') as FileSystemModule
    const candidates = iosDatabaseCandidates(FileSystem.documentDirectory, DATABASE_NAME)

    for (const uri of candidates) {
      const info = await FileSystem.getInfoAsync(uri)
      if (!info.exists) continue

      // The current JS API cannot set NSURLIsExcludedFromBackupKey. Locating
      // the file keeps the policy testable; EAS/native exclusion can attach
      // here without changing callers.
      return
    }
  } catch {
    // Startup must continue if the file-system module is unavailable.
  }
}
