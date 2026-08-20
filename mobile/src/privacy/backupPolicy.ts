/**
 * Nutrition data is health-adjacent. There is no approved cloud restore
 * policy for the Expo database, so backups must not silently copy it.
 *
 * Android Auto Backup is already off (`app.config.ts` `android.allowBackup`).
 * iOS Documents/SQLite is backed up by default; the native helper marks that
 * file excluded from iCloud when the operating system allows it.
 */
export const NUTRITION_DATABASE_BACKUP = 'excluded' as const

export function iosDatabaseCandidates(documentDirectory: string | null, databaseName: string): string[] {
  if (!documentDirectory) return []
  const root = documentDirectory.endsWith('/') ? documentDirectory : `${documentDirectory}/`
  return [`${root}SQLite/${databaseName}`, `${root}${databaseName}`]
}
